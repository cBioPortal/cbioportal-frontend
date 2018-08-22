import * as React from 'react';
import * as _ from 'lodash';
import {observer, Observer} from "mobx-react";
import './styles.scss';
import {
    CancerStudy, Gene, NumericGeneMolecularData, Mutation, MolecularProfile
} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import getCanonicalMutationType from "../../../shared/lib/getCanonicalMutationType";
import {
    calculateJitter, ExpressionStyle, ExpressionStyleSheet, getExpressionStyle,
    getMolecularDataBuckets, prioritizeMutations
} from "./expressionHelpers";
import {Modal} from "react-bootstrap";
import autobind from "autobind-decorator";
import {
    VictoryBoxPlot, VictoryChart, VictoryAxis, Point,
    VictoryLabel, VictoryContainer, VictoryTooltip, VictoryScatter, VictoryLegend
} from 'victory';
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {BOX_STYLES, BoxPlotModel, calculateBoxPlotModel, VictoryBoxPlotModel} from "../../../shared/lib/boxPlotUtils";
import {ITooltipModel} from "../../../shared/model/ITooltipModel";
import ChartContainer from "../../../shared/components/ChartContainer/ChartContainer";
import {If, Then, Else} from 'react-if';
import jStat from 'jStat';
import numeral from 'numeral';
import classNames from 'classnames';
import {MSKTab, MSKTabs} from "../../../shared/components/MSKTabs/MSKTabs";
import {CoverageInformation, isPanCanStudy, isTCGAProvStudy} from "../ResultsViewPageStoreUtils";
import {sleep} from "../../../shared/lib/TimeUtils";
import {
    CNA_STROKE_WIDTH,
    getCnaQueries, IBoxScatterPlotPoint, INumberAxisData, IScatterPlotData, IScatterPlotSampleData, IStringAxisData,
    makeBoxScatterPlotData, makeScatterPlotPointAppearance,
    mutationRenderPriority, MutationSummary, mutationSummaryToAppearance, scatterPlotLegendData, scatterPlotSize,
    scatterPlotTooltip, boxPlotTooltip, sortScatterPlotDataForZIndex
} from "../plots/PlotsTabUtils";
import {getOncoprintMutationType} from "../../../shared/components/oncoprint/DataUtils";
import {getSampleViewUrl} from "../../../shared/api/urls";
import {AnnotatedMutation, ResultsViewPageStore} from "../ResultsViewPageStore";
import OqlStatusBanner from "../../../shared/components/OqlStatusBanner";
import {remoteData} from "../../../shared/api/remoteData";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {MobxPromise} from "mobxpromise";
import {stringListToSet} from "../../../shared/lib/StringUtils";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import BoxScatterPlot from "../../../shared/components/plots/BoxScatterPlot";
import {ViewType} from "../plots/PlotsTab";
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";

export interface ExpressionWrapperProps {
    store:ResultsViewPageStore;
    expressionProfiles:MobxPromise<MolecularProfile[]>;
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>;
    studyMap: { [studyId: string]: CancerStudy };
    genes: Gene[];
    mutations: AnnotatedMutation[];
    onRNASeqVersionChange: (version: number) => void;
    RNASeqVersion: number;
    coverageInformation: CoverageInformation
}

class ExpressionTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

const SYMBOL_SIZE = 3;

const EXPRESSION_CAP = .01;

const LOGGING_FUNCTION = Math.log2;

const SVG_ID = "expression-tab-plot-svg";

export type ScatterPoint = { x: number, y: NumericGeneMolecularData };

type SortOptions = "alphabetic" | "median";

type ExpressionTooltipModel = {
    studyName: string;
    studyId:string;
    mutationType:string | null;
    proteinChange:string | null;
    sampleId: string;
    expression: number,
    style: ExpressionStyle
};

@observer
export default class ExpressionWrapper extends React.Component<ExpressionWrapperProps, {}> {

    constructor(props: ExpressionWrapperProps) {
        super();
        this.selectedGene = props.genes[0];
        (window as any).box = this;
    }

    componentWillMount(){
        // initialize selected study state. study is on except if it does not have any data (doesn't appear in data collection)
        this.selectedStudyIds = _.mapValues(this.props.studyMap,(study)=>true);
    }

    svgContainer: SVGElement;

    @observable.ref tooltipModel: ITooltipModel<ExpressionTooltipModel> | null = null;

    @observable.ref selectedGene: Gene;

    @observable studySelectorModalVisible = false;

    @observable showMutations: boolean = true;

    @observable showCna: boolean = true;

    @observable selectedStudyIds: { [studyId: string]: boolean } = {};

    @observable height = 700;

    @observable logScale = true;

    @observable sortBy: SortOptions = "alphabetic";

    @observable isTooltipHovered = false;

    // for debugging
    @observable public showMutationType = [];

    tooltipCounter: number = 0;

    @computed get selectedStudies() {
        return _.filter(this.props.studyMap,(study)=>this.selectedStudyIds[study.studyId] === true);
    }

    @computed get widthThreshold(){
        return (this.selectedStudies.length > 7);
    }

    @computed get boxWidth(){
        return this.widthThreshold ? 27 : 80;
    }

    readonly sampleStudyData = remoteData<IStringAxisData>({
        await:()=>[this.props.store.samples],
        invoke: ()=>{
            // data representing the horizontal axis - which sample is in which study
            return Promise.resolve(
                {
                    data: this.props.store.samples.result!.reduce((_data, sample)=>{
                        // filter out data for unselected studies
                        if (this.selectedStudyIds[sample.studyId]) {
                            _data.push({
                                uniqueSampleKey: sample.uniqueSampleKey,
                                value: this.props.studyMap[sample.studyId].shortName
                            });
                        }
                        return _data;
                    }, [] as IStringAxisData["data"]),
                    datatype: "string"
                }
            );
        }
    });

    readonly expressionData = remoteData<NumericGeneMolecularData[]>({
        await:()=>this.props.numericGeneMolecularDataCache.await([this.props.expressionProfiles],
            profiles=>profiles.map((p:MolecularProfile)=>({ entrezGeneId: this.selectedGene.entrezGeneId, molecularProfileId: p.molecularProfileId }))
        ),
        invoke:()=>{
            // TODO: this cache is leading to some ugly code
            return Promise.resolve(_.flatten(this.props.numericGeneMolecularDataCache.getAll(
                this.props.expressionProfiles.result!.map(p=>({ entrezGeneId: this.selectedGene.entrezGeneId, molecularProfileId: p.molecularProfileId }))
            ).map(promise=>promise.result!)) as NumericGeneMolecularData[]);
        }
    });

    readonly studiesWithExpressionData = remoteData<{[studyId:string]:boolean}>({
        await:()=>[this.expressionData],
        invoke:()=>{
            const studyIds = _.chain<NumericGeneMolecularData[]>(this.expressionData.result!)
                    .map(d=>d.studyId)
                    .uniq()
                    .value();
            return Promise.resolve(stringListToSet(studyIds));
        }
    });

    readonly mutationDataExists = remoteData({
        await: ()=>[this.props.store.studyToMutationMolecularProfile],
        invoke: ()=>{
            return Promise.resolve(!!_.values(this.props.store.studyToMutationMolecularProfile).length);
        }
    });

    readonly cnaDataExists = remoteData({
        await: ()=>[this.props.store.studyToMolecularProfileDiscrete],
        invoke: ()=>{
            return Promise.resolve(!!_.values(this.props.store.studyToMolecularProfileDiscrete).length);
        }
    });

    readonly cnaData = remoteData({
        await:()=>{
            if (this.cnaDataShown && this.selectedGene !== undefined) {
                return [this.props.store.annotatedCnaCache.get({ entrezGeneId: this.selectedGene.entrezGeneId })];
            } else {
                return [];
            }
        },
        invoke:()=>{
            if (this.cnaDataShown && this.selectedGene !== undefined) {
                return Promise.resolve(this.props.store.annotatedCnaCache.get({ entrezGeneId: this.selectedGene.entrezGeneId }).result!);
            } else {
                return Promise.resolve([]);
            }
        }
    });

    @computed get mutationDataShown() {
        return this.mutationDataExists.result && this.showMutations;
    }

    @computed get cnaDataShown() {
        return this.cnaDataExists.result && this.showCna;
    }

    readonly _unsortedBoxPlotData = remoteData({
        await:()=>[
            this.sampleStudyData,
            this.expressionData,
            this.props.store.sampleKeyToSample,
            this.props.store.studyToMutationMolecularProfile,
            this.props.store.studyToMolecularProfileDiscrete,
            this.cnaData
        ],
        invoke:()=>{
            return Promise.resolve(makeBoxScatterPlotData(
                this.sampleStudyData.result!,
                {
                    data: this.expressionData.result!,
                    datatype: "number",
                    hugoGeneSymbol: this.selectedGene.hugoGeneSymbol
                } as INumberAxisData,
                this.props.store.sampleKeyToSample.result!,
                this.props.coverageInformation.samples,
                this.mutationDataExists.result ? {
                    molecularProfileIds: _.values(this.props.store.studyToMutationMolecularProfile.result!).map(p=>p.molecularProfileId),
                    data: this.props.mutations
                } : undefined,
                this.cnaDataShown ? {
                    molecularProfileIds: _.values(this.props.store.studyToMolecularProfileDiscrete.result!).map(p=>p.molecularProfileId),
                    data: this.cnaData.result!
                }: undefined
            ));
        }
    });

    readonly boxPlotData = remoteData({
        await:()=>[this._unsortedBoxPlotData],
        invoke:()=>{
            // sort data order within boxes, for rendering order (z-index)
            const sortedData = this._unsortedBoxPlotData.result!.map(labelAndData=>({
                label: labelAndData.label,
                data: sortScatterPlotDataForZIndex<IBoxScatterPlotPoint>(labelAndData.data, this.viewType)
            }));

            // sort box order
            if (this.sortBy === "alphabetic") {
                return Promise.resolve(_.sortBy<any>(sortedData, d=>d.label));
            } else {
                return Promise.resolve(_.sortBy<any>(sortedData, d=>{
                    //Note: we have to use slice to convert Seamless immutable array to real array, otherwise jStat chokes
                    return jStat.median(Array.prototype.slice((d.data.map((v:any)=>(v.value as number)))));
                }));
            }
        }
    });

    @computed get studyTypeCounts(){
        const allStudies = _.values(this.props.studyMap);
        return {
            provisional:allStudies.filter((study)=>isTCGAProvStudy(study.studyId)),
            panCancer:allStudies.filter((study)=>isPanCanStudy(study.studyId))
        }
    }

    @autobind
    handleStudySelection(event: React.SyntheticEvent<HTMLInputElement>) {
        // toggle state of it
        this.selectedStudyIds[event.currentTarget.value] = !this.selectedStudyIds[event.currentTarget.value];
    }

    @autobind
    handleRNASeqVersionChange(event: React.SyntheticEvent<HTMLSelectElement>) {
        this.props.onRNASeqVersionChange(parseInt(event.currentTarget.value));
    }

    @autobind
    handleSortByChange(event: React.SyntheticEvent<HTMLSelectElement>) {
        this.sortBy = event.currentTarget.value as any;
    }

    @autobind
    handleSelectAllStudies(){
        if (this.studiesWithExpressionData.isComplete) {
            this.applyStudyFilter((study)=>{
                return study.studyId in this.studiesWithExpressionData.result!;
            });
        }
    }

    @autobind
    handleDeselectAllStudies(){
        this.applyStudyFilter((study)=>{
            return false;
        });
    }

    @computed get hasUnselectedStudies(){
        if (this.studiesWithExpressionData.isComplete) {
            return undefined !== _.find(this.props.studyMap,(study)=>{
                const hasData = study.studyId in this.studiesWithExpressionData.result!;
                const isSelected = this.selectedStudies.includes(study);
                return hasData && !isSelected;
            });
        } else {
            return false;
        }
    }

    @computed
    get alphabetizedStudies(){
        return _.chain(this.props.studyMap).values().sortBy(
            (study:CancerStudy)=>study.name
        ).value();
    }

    @computed
    get studySelectionModal() {

        return (<Modal data-test="ExpressionStudyModal" show={true} onHide={() => {
            this.studySelectorModalVisible = false
        }} className="cbioportal-frontend">
            <Modal.Header closeButton>
                <Modal.Title>Select Studies</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <div>
                        <a data-test="ExpressionStudySelectAll" className={classNames({hidden:!this.hasUnselectedStudies})} onClick={this.handleSelectAllStudies}>Select all</a>
                        <span className={classNames({hidden:!this.hasUnselectedStudies || this.selectedStudies.length === 0})}>&nbsp;|&nbsp;</span>
                        <a data-test="ExpressionStudyUnselectAll" className={classNames({hidden:this.selectedStudies.length === 0})} onClick={this.handleDeselectAllStudies}>Deselect all</a>
                    </div>
                    {
                        _.map(this.alphabetizedStudies, (study: CancerStudy) => {
                            const hasData = (study.studyId in (this.studiesWithExpressionData.result || {}));
                            return (
                                <div className={classNames('checkbox',{ disabled:!hasData })}>
                                    <label>
                                        <input type="checkbox"
                                               checked={hasData && this.selectedStudyIds[study.studyId] === true}
                                               value={study.studyId}
                                               disabled={!hasData}
                                               onChange={(!hasData)? ()=>{} : this.handleStudySelection}/>
                                        {study.name}
                                        { (!hasData) && (<span className="badge badge-info small" style={{marginLeft:5}}>{"No Expr. Data"}</span>) }
                                    </label>
                                </div>
                            )
                        })
                    }
                </div>
            </Modal.Body>
        </Modal>)

    }

    @autobind
    public applyStudyFilter(test: (study: CancerStudy) => boolean) {
        this.selectedStudyIds = _.mapValues(this.props.studyMap, (study: CancerStudy, studyId: string) => {
            return test(study);
        });
    }

    @autobind
    public handleTabClick(id: string, datum:Gene) {
        this.selectedGene = datum;
    }

    @computed
    get yAxisLabel() {
        const log = this.logScale ? ' (log2)' : '';
        return `${this.selectedGene.hugoGeneSymbol} Expression --- RNA Seq V${this.props.RNASeqVersion}${log}`;
    }

    @computed get boxPlotTooltip() {
        return (d:IBoxScatterPlotPoint)=>{
            if (this.boxPlotData.isComplete) {
                return boxPlotTooltip(d, false);
            } else {
                return <span>Loading... (this shouldnt appear because the box plot shouldnt be visible)</span>;
            }
        }
    }

    @computed get fill() {
        if (this.showCna || this.showMutations) {
            return (d:IScatterPlotSampleData)=>this.scatterPlotAppearance(d).fill!;
        } else {
            return mutationSummaryToAppearance[MutationSummary.Neither].fill;
        }
    }

    @computed get fillOpacity() {
        if (!this.showMutations && this.showCna) {
            return 0;
        } else {
            return 1;
        }
    }

    @computed get strokeWidth() {
        if (this.showCna) {
            return CNA_STROKE_WIDTH;
        } else {
            return 1;
        }
    }

    @autobind
    private strokeOpacity(d:IScatterPlotSampleData) {
        return this.scatterPlotAppearance(d).strokeOpacity;
    }

    @autobind
    private scatterPlotTooltip(d:IScatterPlotData) {
        return scatterPlotTooltip(d);
    }

    @autobind
    private stroke(d:IScatterPlotSampleData) {
        return this.scatterPlotAppearance(d).stroke;
    }

    @computed get scatterPlotAppearance() {
        return makeScatterPlotPointAppearance(this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.mutationAnnotationSettings.driversAnnotated);
    }

    @computed get viewType() {
        if (this.showMutations && this.showCna) {
            return ViewType.MutationTypeAndCopyNumber;
        } else if (this.showMutations) {
            return ViewType.MutationType;
        } else if (this.showCna) {
            return ViewType.CopyNumber;
        } else {
            return ViewType.None;
        }
    }

    @autobind
    private getChart() {
        if (this.boxPlotData.isComplete) {
            return (
                <ChartContainer
                    getSVGElement={this.getSvg}
                    exportFileName={this.exportFileName}
                >
                    <ExpressionTabBoxPlot
                        svgId={SVG_ID}
                        boxWidth={this.boxWidth}
                        axisLabelY={this.yAxisLabel}
                        data={this.boxPlotData.result}
                        chartBase={550}
                        tooltip={this.boxPlotTooltip}
                        horizontal={false}
                        logScale={this.logScale}
                        size={scatterPlotSize}
                        fill={this.fill}
                        stroke={this.stroke}
                        strokeOpacity={this.strokeOpacity}
                        symbol="circle"
                        fillOpacity={this.fillOpacity}
                        strokeWidth={this.strokeWidth}
                        useLogSpaceTicks={true}
                        legendData={scatterPlotLegendData(
                            _.flatten(this.boxPlotData.result.map(d=>d.data)), this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.mutationAnnotationSettings.driversAnnotated
                        )}
                    />
                    {this.mutationDataExists.result && (
                        <div style={{marginTop:5}}>* Driver annotation settings are located in the Mutation Color menu of the Oncoprint.</div>
                    )}
                </ChartContainer>
            );
        } else {
            return <span></span>
        }
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @computed get exportFileName() {
        // TODO: more specific?
        return "Expression";
    }

    render() {
        return (
            <div>
                <OqlStatusBanner className="expression-oql-status-banner" store={this.props.store} tabReflectsOql={false} style={{marginTop:-1, marginBottom:12}}/>
                { (this.studySelectorModalVisible) && this.studySelectionModal }
                <div style={{marginBottom:15}}>

                    <MSKTabs onTabClick={this.handleTabClick}
                             enablePagination={true}
                             unmountOnHide={true}
                             tabButtonStyle="pills"
                             activeTabId={"summaryTab" + this.selectedGene.hugoGeneSymbol}
                             className="pillTabs">
                        {
                            this.props.genes.map((gene:Gene)=> {
                               return <MSKTab key={gene.hugoGeneSymbol} datum={gene} id={"summaryTab" + gene.hugoGeneSymbol}
                                        linkText={gene.hugoGeneSymbol}/>
                            })
                        }
                    </MSKTabs>

                    <form className="form-inline expression-controls" style={{marginBottom:10}}>

                        <div className="form-group">
                            <h5>Profile:</h5>
                            <select className="form-control input-sm" value={this.props.RNASeqVersion}
                                    onChange={this.handleRNASeqVersionChange} title="Select profile">
                                <option value={2}>RNA Seq V2</option>
                                <option value={1}>RNA Seq</option>
                            </select>
                        </div>

                        {(this.boxPlotData.isComplete && this.boxPlotData.result.length > 1) && (
                            <div className="form-group">
                                <h5>Sort By:</h5>

                                <select className="form-control input-sm" value={this.sortBy}
                                        onChange={this.handleSortByChange} title="Select profile">
                                    <option value={"alphabetic"}>Cancer Study</option>
                                    <option value={"median"}>Median</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="checkbox-inline">
                                <input type="checkbox" checked={this.logScale}
                                       onChange={()=>this.logScale = !this.logScale} title="Log scale"/>
                                Log scale
                            </label>
                            { this.mutationDataExists.result && <label className="checkbox-inline">
                                <input type="checkbox" checked={this.showMutations}
                                       onChange={() => this.showMutations = !this.showMutations}
                                       title="Show mutations *"/>
                                Show mutations *
                            </label>}
                            { this.cnaDataExists.result && <label className="checkbox-inline">
                                <input type="checkbox" checked={this.showCna}
                                       onChange={() => this.showCna = !this.showCna}
                                       title="Show copy number alterations"/>
                                Show copy number alterations
                            </label>}
                        </div>

                    </form>

                    { this.studiesWithExpressionData.isComplete && <div>
                        <label>Select studies:</label>&nbsp;
                        <If condition={this.studyTypeCounts.provisional.length > 0}>
                            <button className="btn btn-default btn-xs" style={{marginRight:5}}
                                    onClick={() => this.applyStudyFilter((study: CancerStudy) => isTCGAProvStudy(study.studyId))}>
                                 TCGA Provisional ({this.studyTypeCounts.provisional.length})
                            </button>
                        </If>
                        <If condition={this.studyTypeCounts.panCancer.length > 0}>
                            <button className="btn btn-default btn-xs" style={{marginRight:5}}
                                    onClick={() => this.applyStudyFilter((study: CancerStudy) => isPanCanStudy(study.studyId))}>
                                TCGA Pan-Can Atlas ({this.studyTypeCounts.panCancer.length})
                            </button>
                        </If>
                        <button data-test="ExpressionStudyModalButton"className="btn btn-default btn-xs"
                                onClick={() => this.studySelectorModalVisible = !this.studySelectorModalVisible}>Custom list</button>

                    </div>}
                    { this.studiesWithExpressionData.isPending && <LoadingIndicator isLoading={true} />}

                    <div className="collapse">
                        <div className="well"></div>
                    </div>
                </div>

                { this.boxPlotData.isComplete && <If condition={this.selectedStudies.length > 0}>
                    <Then>
                        <If condition={_.size(this.boxPlotData.result!) > 0}>
                            <Then>
                                <div className="posRelative">
                                    <Observer>
                                        {this.getChart}
                                    </Observer>
                                </div>
                            </Then>
                            <Else>
                                <div className="alert alert-info">
                                    No expression data for this query.
                                </div>
                            </Else>
                        </If>
                    </Then>
                    <Else>
                        <div className="alert alert-info">
                            No studies selected.
                        </div>
                    </Else>
                </If>}
                { this.boxPlotData.isPending && <LoadingIndicator isLoading={true} />}
            </div>
        );
    }

}