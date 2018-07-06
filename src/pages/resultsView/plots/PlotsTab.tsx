import * as React from "react";
import {action, computed, observable} from "mobx";
import {Observer, observer} from "mobx-react";
import "./styles.scss";
import {AlterationTypeConstants, ResultsViewPageStore} from "../ResultsViewPageStore";
import {FormControl} from "react-bootstrap";
import LockIcon from "../../../shared/components/LockIcon";
import ReactSelect from "react-select";
import _ from "lodash";
import {
    getAxisDescription,
    getAxisLabel, IScatterPlotData, isNumberData, isStringData, logScalePossible,
    makeAxisDataPromise, makeScatterPlotData, makeScatterPlotPointAppearance, molecularProfileTypeDisplayOrder,
    molecularProfileTypeToDisplayType, scatterPlotTooltip, scatterPlotLegendData, IStringAxisData, INumberAxisData,
    makeBoxScatterPlotData, IScatterPlotSampleData, noMutationAppearance, IBoxScatterPlotPoint, boxPlotTooltip,
    getCnaQueries, getMutationQueries, getScatterPlotDownloadData, getBoxPlotDownloadData, getTablePlotDownloadData,
    mutationRenderPriority, mutationSummaryRenderPriority, MutationSummary, mutationSummaryToAppearance
} from "./PlotsTabUtils";
import {
    ClinicalAttribute, MolecularProfile, Mutation,
    NumericGeneMolecularData
} from "../../../shared/api/generated/CBioPortalAPI";
import Timer = NodeJS.Timer;
import ScatterPlot, {LEGEND_Y as SCATTERPLOT_LEGEND_Y} from "shared/components/plots/ScatterPlot";
import TablePlot from "shared/components/plots/TablePlot";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import InfoIcon from "../../../shared/components/InfoIcon";
import {remoteData} from "../../../shared/api/remoteData";
import {MobxPromise} from "mobxpromise";
import BoxScatterPlot, {LEGEND_Y as BOXPLOT_LEGEND_Y, IBoxScatterPlotData} from "../../../shared/components/plots/BoxScatterPlot";
import DownloadControls from "../../../shared/components/DownloadControls";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import setWindowVariable from "../../../shared/lib/setWindowVariable";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';
import onMobxPromise from "../../../shared/lib/onMobxPromise";

enum EventKey {
    horz_molecularProfile,
    horz_clinicalAttribute,
    horz_logScale,

    vert_molecularProfile,
    vert_clinicalAttribute,
    vert_logScale,

    utilities_viewMutationType,
    utilities_viewCopyNumber,
}

export enum AxisType {
    molecularProfile,
    clinicalAttribute
}

export enum ViewType {
    MutationType,
    CopyNumber,
    MutationSummary,
    None
}

export enum PlotType {
    ScatterPlot,
    BoxPlot,
    Table
}

export type AxisMenuSelection = {
    axisType: AxisType|undefined;
    entrezGeneId?:number;
    molecularProfileType?:string;
    molecularProfileId?:string;
    clinicalAttributeId?:string;
    logScale: boolean;
};

export interface IPlotsTabProps {
    store:ResultsViewPageStore;
};

const searchInputTimeoutMs = 600;

class PlotsTabScatterPlot extends ScatterPlot<IScatterPlotData> {}
class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

@observer
export default class PlotsTab extends React.Component<IPlotsTabProps,{}> {

    private horzSelection:AxisMenuSelection;
    private vertSelection:AxisMenuSelection;

    @observable geneLock:boolean;
    @observable searchCaseInput:string;
    @observable searchMutationInput:string;
    @observable _viewType:ViewType;

    @observable svg:SVGElement|null;

    @observable searchCase:string = "";
    @observable searchMutation:string = "";

    @autobind
    private svgRef(svg:SVGElement|null) {
        this.svg = svg;
    }

    @computed get viewType():ViewType {
        if (this.sameGeneInBothAxes) {
            // both axes molecular profile, same gene
            return this._viewType;
        } else if (this.bothAxesMolecularProfile) {
            // both axes molecular profile, different gene
            return ViewType.MutationSummary;
        } else if (this.horzSelection.axisType === AxisType.molecularProfile ||
                    this.vertSelection.axisType === AxisType.molecularProfile) {
            // one axis molecular profile
            return ViewType.MutationType;
        } else {
            // neither axis gene
            return ViewType.None;
        }
    }

    set viewType(v:ViewType) {
        this._viewType = v;
    }

    private searchCaseTimeout:Timer;
    private searchMutationTimeout:Timer;

    constructor(props:IPlotsTabProps) {
        super(props);

        this.horzSelection = this.initAxisMenuSelection(false);
        this.vertSelection = this.initAxisMenuSelection(true);

        this.geneLock = true;
        this.searchCaseInput = "";
        this.searchMutationInput = "";
        this.viewType = ViewType.MutationType;

        setWindowVariable("resultsViewPlotsTab", this); // for e2e testing
    }

    @autobind
    private getSvg() {
        return this.svg;
    }

    @computed get downloadFilename() {
        return "plot"; // todo: more specific?
    }

    private initAxisMenuSelection(vertical:boolean):AxisMenuSelection {
        const self = this;

        return observable({
            get axisType() {
                if (!self.profileTypeOptions.length && !self.clinicalAttributeOptions.length) {
                    return undefined;
                } else if (!self.profileTypeOptions.length) {
                    return AxisType.clinicalAttribute;
                } else if (!self.clinicalAttributeOptions.length) {
                    return AxisType.molecularProfile;
                } else {
                    return this._axisType;
                }
            },
            set axisType(a:AxisType|undefined) {
                this._axisType = a;
            },
            get entrezGeneId() {
                if (this._entrezGeneId === undefined && self.geneOptions.isComplete && self.geneOptions.result.length) {
                    return self.geneOptions.result[0].value;
                } else {
                    return this._entrezGeneId;
                }
            },
            set entrezGeneId(e:number|undefined) {
                this._entrezGeneId = e;
            },
            get molecularProfileType() {
                // default is horizontal CNA vs vertical mRNA
                if (this._molecularProfileType === undefined && self.profileTypeOptions.length) {
                    if (vertical && !!self.profileTypeOptions.find(o=>(o.value === AlterationTypeConstants.MRNA_EXPRESSION))) {
                        return AlterationTypeConstants.MRNA_EXPRESSION;
                    } else if (!vertical && !!self.profileTypeOptions.find(o=>(o.value === AlterationTypeConstants.COPY_NUMBER_ALTERATION))) {
                        return AlterationTypeConstants.COPY_NUMBER_ALTERATION;
                    } else {
                        return self.profileTypeOptions[0].value;
                    }
                } else {
                    return this._molecularProfileType;
                }
            },
            set molecularProfileType(t:string|undefined) {
                this._molecularProfileType = t;
            },
            get molecularProfileId() {
                if (this._molecularProfileId === undefined &&
                    this.molecularProfileType &&
                    self.profileNameOptionsByType[this.molecularProfileType] &&
                    self.profileNameOptionsByType[this.molecularProfileType].length) {
                    return self.profileNameOptionsByType[this.molecularProfileType][0].value;
                } else {
                    return this._molecularProfileId;
                }
            },
            set molecularProfileId(id:string|undefined) {
                this._molecularProfileId = id;
            },
            get clinicalAttributeId() {
                if (this._clinicalAttributeId === undefined && self.clinicalAttributeOptions.length) {
                    return self.clinicalAttributeOptions[0].value;
                } else {
                    return this._clinicalAttributeId;
                }
            },
            set clinicalAttributeId(id:string|undefined) {
                this._clinicalAttributeId = id;
            },
            get logScale() {
                return this._logScale && logScalePossible(this);
            },
            set logScale(v:boolean) {
                this._logScale = v;
            },
            _axisType: AxisType.molecularProfile,
            _entrezGeneId: undefined,
            _molecularProfileType: undefined,
            _molecularProfileId: undefined,
            _clinicalAttributeId: undefined,
            _logScale: true
        });
    }

    @autobind
    @action
    private onInputClick(event:React.MouseEvent<HTMLInputElement>) {
        switch (parseInt((event.target as HTMLInputElement).value, 10)) {
            case EventKey.horz_molecularProfile:
                this.horzSelection.axisType = AxisType.molecularProfile;
                break;
            case EventKey.horz_clinicalAttribute:
                this.horzSelection.axisType = AxisType.clinicalAttribute;
                break;
            case EventKey.vert_molecularProfile:
                this.vertSelection.axisType = AxisType.molecularProfile;
                break;
            case EventKey.vert_clinicalAttribute:
                this.vertSelection.axisType = AxisType.clinicalAttribute;
                break;
            case EventKey.horz_logScale:
                this.horzSelection.logScale = !this.horzSelection.logScale;
                break;
            case EventKey.vert_logScale:
                this.vertSelection.logScale = !this.vertSelection.logScale;
                break;
            case EventKey.utilities_viewCopyNumber:
                this.viewType = ViewType.CopyNumber;
                break;
            case EventKey.utilities_viewMutationType:
                this.viewType = ViewType.MutationType;
                break;
        }
    }

    @autobind
    private downloadData() {
        onMobxPromise<any>(
            [this.props.store.entrezGeneIdToGene,
            this.props.store.sampleKeyToSample],
            (entrezGeneIdToGene, sampleKeyToSample)=>{
                const filename = `${this.downloadFilename}.txt`;
                switch (this.plotType.result) {
                    case PlotType.ScatterPlot:
                        fileDownload(
                            getScatterPlotDownloadData(
                                this.scatterPlotData.result!,
                                this.horzLabel,
                                this.vertLabel,
                                entrezGeneIdToGene
                            ),
                            filename
                        );
                        break;
                    case PlotType.BoxPlot:
                        const categoryLabel = this.boxPlotData.result!.horizontal ? this.vertLabel : this.horzLabel;
                        const valueLabel = this.boxPlotData.result!.horizontal ? this.horzLabel : this.vertLabel;
                        fileDownload(
                            getBoxPlotDownloadData(
                                this.boxPlotData.result!.data,
                                categoryLabel,
                                valueLabel,
                                entrezGeneIdToGene
                            ),
                            filename
                        );
                        break;
                    case PlotType.Table:
                        fileDownload(
                            getTablePlotDownloadData(
                                (this.horzAxisDataPromise.result! as IStringAxisData).data,
                                (this.vertAxisDataPromise.result! as IStringAxisData).data,
                                sampleKeyToSample,
                                this.horzLabel,
                                this.vertLabel
                            ),
                            filename
                        );
                        break;
                }
            }
        )
    }

    @autobind
    @action
    private setSearchCaseInput(e:any) {
        this.searchCaseInput = e.target.value;
        clearTimeout(this.searchCaseTimeout);
        this.searchCaseTimeout = setTimeout(()=>this.executeSearchCase(this.searchCaseInput), searchInputTimeoutMs);
    }

    @autobind
    @action
    private setSearchMutationInput(e:any) {
        this.searchMutationInput = e.target.value;
        clearTimeout(this.searchMutationTimeout);
        this.searchMutationTimeout = setTimeout(()=>this.executeSearchMutation(this.searchMutationInput), searchInputTimeoutMs);
    }

    @autobind
    @action
    public executeSearchCase(caseId:string) {
        this.searchCase = caseId;
    }

    @autobind
    @action
    public executeSearchMutation(proteinChange:string) {
        this.searchMutation = proteinChange;
    }

    @autobind
    private getHorizontalAxisMenu() {
        return this.getAxisMenu(false);
    }

    @autobind
    private getVerticalAxisMenu() {
        return this.getAxisMenu(true);
    }

    @action
    private onGeneLockClick(vertical:boolean) {
        this.geneLock = !this.geneLock;
        if (vertical) {
            this.horzSelection.entrezGeneId = this.vertSelection.entrezGeneId;
        } else {
            this.vertSelection.entrezGeneId = this.horzSelection.entrezGeneId;
        }
    }

    @autobind
    private onVerticalAxisGeneLockClick() {
        this.onGeneLockClick(true);
    }

    @autobind
    private onHorizontalAxisGeneLockClick() {
        this.onGeneLockClick(false);
    }

    @action
    public onGeneSelect(vertical:boolean, entrezGeneId:number) {
        let targetSelection;
        let otherSelection;
        if (vertical) {
            targetSelection = this.vertSelection;
            otherSelection = this.horzSelection;
        } else {
            targetSelection = this.horzSelection;
            otherSelection = this.vertSelection;
        }
        targetSelection.entrezGeneId = entrezGeneId;
        if (this.geneLock) {
            otherSelection.entrezGeneId = entrezGeneId;
        }
    }

    @autobind
    private onVerticalAxisGeneSelect(option:any) {
        this.onGeneSelect(true, option.value);
    }

    @autobind
    private onHorizontalAxisGeneSelect(option:any) {
        this.onGeneSelect(false, option.value);
    }

    readonly geneOptions = remoteData({
        await:()=>[this.props.store.genes],
        invoke:()=>{
            return Promise.resolve(
                this.props.store.genes.result!.map(gene=>({ value: gene.entrezGeneId, label: gene.hugoGeneSymbol }))
            );
        }
    });

    @computed get clinicalAttributeIdToClinicalAttribute():{[clinicalAttributeId:string]:ClinicalAttribute} {
        if (this.props.store.clinicalAttributes.isComplete) {
            return this.props.store.clinicalAttributes.result.reduce((map:{[clinicalAttributeId:string]:ClinicalAttribute}, next)=>{
                map[next.clinicalAttributeId] = next;
                return map;
            }, {});
        } else {
            return {};
        }
    }

    @computed get clinicalAttributeOptions() {
        if (this.props.store.clinicalAttributes.isComplete) {
            return this.props.store.clinicalAttributes.result.map(attribute=>({
                value: attribute.clinicalAttributeId,
                label: attribute.displayName
            }));
        } else {
            return [];
        }
    }

    @computed get profileTypeOptions() {
        if (this.props.store.molecularProfilesInStudies.isComplete) {
            return _.sortBy(
                _.uniq(
                    this.props.store.molecularProfilesInStudies.result.map(profile=>profile.molecularAlterationType)
                ).filter(type=>!!molecularProfileTypeToDisplayType[type]),
                type=>molecularProfileTypeDisplayOrder.indexOf(type)
            ).map(type=>({
                value: type,
                label: molecularProfileTypeToDisplayType[type]
            }));
        } else {
            return [];
        }
    }

    @computed get profileNameOptionsByType() {
        if (this.props.store.molecularProfilesInStudies.isComplete) {
            return _.mapValues(
                _.groupBy(this.props.store.molecularProfilesInStudies.result, profile=>profile.molecularAlterationType),
                profiles=>profiles.map(p=>({value:p.molecularProfileId, label:p.name}))
            );
        } else {
            return {};
        }
    }

    @autobind
    @action
    private onVerticalAxisProfileTypeSelect(option:any) {
        this.vertSelection.molecularProfileType = option.value;
    }

    @autobind
    @action
    public onHorizontalAxisProfileTypeSelect(option:any) {
        this.horzSelection.molecularProfileType = option.value;
    }

    @autobind
    @action
    public onVerticalAxisProfileIdSelect(option:any) {
        this.vertSelection.molecularProfileId = option.value;
    }

    @autobind
    @action
    public onHorizontalAxisProfileIdSelect(option:any) {
        this.horzSelection.molecularProfileId = option.value;
    }

    @autobind
    @action
    public onVerticalAxisClinicalAttributeSelect(option:any) {
        this.vertSelection.clinicalAttributeId = option.value;
    }

    @autobind
    @action
    public onHorizontalAxisClinicalAttributeSelect(option:any) {
        this.horzSelection.clinicalAttributeId = option.value;
    }

    @autobind
    @action
    private swapHorzVertSelections() {
        const keys:(keyof AxisMenuSelection)[] = ["axisType", "entrezGeneId", "molecularProfileType", "molecularProfileId", "clinicalAttributeId", "logScale"];
        // have to store all values for swap because values depend on each other in derived data way so the copy can mess up if you do it one by one
        const horz = keys.map(k=>this.horzSelection[k]);
        const vert = keys.map(k=>this.vertSelection[k]);
        for (let i=0; i<keys.length; i++) {
            this.horzSelection[keys[i]] = vert[i];
            this.vertSelection[keys[i]] = horz[i];
        }
    }

    @computed get bothAxesMolecularProfile() {
        return (this.horzSelection.axisType === AxisType.molecularProfile) &&
             (this.vertSelection.axisType === AxisType.molecularProfile);
    }

    @computed get sameGeneInBothAxes() {
        return  this.bothAxesMolecularProfile &&
            (this.horzSelection.entrezGeneId === this.vertSelection.entrezGeneId);
    }

    @computed get cnaDataShown() {
        return this.cnaDataExists && this.viewType === ViewType.CopyNumber;
    }

    readonly cnaPromise = remoteData({
        await:()=>this.props.store.numericGeneMolecularDataCache.await(
            [this.props.store.studyToMolecularProfileDiscrete],
            map=>{
                if (this.cnaDataShown && this.horzSelection.entrezGeneId !== undefined) {
                    return getCnaQueries(this.horzSelection.entrezGeneId, map);
                } else {
                    return [];
                }
            }
        ),
        invoke:()=>{
            if (this.cnaDataShown && this.horzSelection.entrezGeneId !== undefined) {
                const queries = getCnaQueries(
                    this.horzSelection.entrezGeneId,
                    this.props.store.studyToMolecularProfileDiscrete.result!
                );
                const promises = this.props.store.numericGeneMolecularDataCache.getAll(queries);
                return Promise.resolve(_.flatten(promises.map(p=>p.result!)));
            } else {
                return Promise.resolve(undefined);
            }
        }
    });

    @computed get mutationDataShown() {
        return this.mutationDataExists &&
            (this.viewType === ViewType.MutationType || this.viewType === ViewType.MutationSummary);
    }

    readonly mutationPromise = remoteData({
        await:()=>this.props.store.putativeDriverAnnotatedMutationCache.getAll(
            getMutationQueries(this.horzSelection, this.vertSelection)
        ),
        invoke: ()=>{
            if (this.mutationDataShown) {
                return Promise.resolve(_.flatten(this.props.store.putativeDriverAnnotatedMutationCache.getAll(
                    getMutationQueries(this.horzSelection, this.vertSelection)
                ).map(p=>p.result!)));
            } else {
                return Promise.resolve(undefined);
            }
        }
    });

    @computed get horzAxisDataPromise() {
        return makeAxisDataPromise(
            this.horzSelection,
            this.clinicalAttributeIdToClinicalAttribute,
            this.props.store.molecularProfileIdToMolecularProfile,
            this.props.store.patientKeyToSamples,
            this.props.store.entrezGeneIdToGene,
            this.props.store.clinicalDataCache,
            this.props.store.numericGeneMolecularDataCache,
        );
    }

    @computed get vertAxisDataPromise() {
        return makeAxisDataPromise(
            this.vertSelection,
            this.clinicalAttributeIdToClinicalAttribute,
            this.props.store.molecularProfileIdToMolecularProfile,
            this.props.store.patientKeyToSamples,
            this.props.store.entrezGeneIdToGene,
            this.props.store.clinicalDataCache,
            this.props.store.numericGeneMolecularDataCache
        );
    }

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


    @computed get horzLabel() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete &&
            this.props.store.entrezGeneIdToGene.isComplete) {
            return getAxisLabel(
                this.horzSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.props.store.entrezGeneIdToGene.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get horzLabelLogSuffix() {
        if (this.horzSelection.logScale) {
            return " (log2)";
        } else {
            return "";
        }
    }

    @computed get vertLabel() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete &&
            this.props.store.entrezGeneIdToGene.isComplete) {
            return getAxisLabel(
                this.vertSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.props.store.entrezGeneIdToGene.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get vertLabelLogSuffix() {
        if (this.vertSelection.logScale) {
            return " (log2)";
        } else {
            return "";
        }
    }

    @computed get horzDescription() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            return getAxisDescription(
                this.horzSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get vertDescription() {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            return getAxisDescription(
                this.vertSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result,
                this.clinicalAttributeIdToClinicalAttribute
            );
        } else {
            return "";
        }
    }

    @computed get scatterPlotAppearance() {
        return makeScatterPlotPointAppearance(this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.mutationAnnotationSettings.driversAnnotated);
    }

    @computed get scatterPlotFill() {
        switch (this.viewType) {
            case ViewType.CopyNumber:
                return "#000000";
            case ViewType.MutationType:
            case ViewType.MutationSummary:
                return (d:IScatterPlotSampleData)=>this.scatterPlotAppearance(d).fill!;
            case ViewType.None:
                return mutationSummaryToAppearance[MutationSummary.Neither].fill;
        }
    }

    @computed get scatterPlotFillOpacity() {
        if (this.viewType === ViewType.CopyNumber) {
            return 0;
        } else {
            return 1;
        }
    }

    @autobind
    private scatterPlotTooltip(d:IScatterPlotData) {
        return scatterPlotTooltip(d, this.props.store.entrezGeneIdToGene);
    }

    @computed get boxPlotTooltip() {
        return (d:IBoxScatterPlotPoint)=>{
            if (this.boxPlotData.isComplete) {
                return boxPlotTooltip(d, this.props.store.entrezGeneIdToGene, this.boxPlotData.result.horizontal);
            } else {
                return <span>Loading... (this shouldnt appear because the box plot shouldnt be visible)</span>;
            }
        }
    }

    @autobind
    private scatterPlotStroke(d:IScatterPlotSampleData) {
        return this.scatterPlotAppearance(d).stroke;
    }

    @computed get scatterPlotHighlight() {
        const searchCase = this.searchCase;
        const searchMutation = this.searchMutation;

        // need to regenerate the function whenever these change in order to trigger immediate Victory rerender
        return (d:IScatterPlotSampleData)=>{
            let caseMatch = false;
            if (searchCase.length) {
                caseMatch = d.sampleId.indexOf(searchCase) > -1;
            }
            let mutationMatch = false;
            if (searchMutation.length) {
                mutationMatch = !!d.mutations.find(m=>!!(m.proteinChange && (m.proteinChange.indexOf(searchMutation) > -1)));
            }
            return caseMatch || mutationMatch;
        };
    }

    @computed get scatterPlotSymbol() {
        switch (this.viewType) {
            case ViewType.MutationType:
                return (d:IScatterPlotSampleData)=>this.scatterPlotAppearance(d).symbol!;
            case ViewType.CopyNumber:
            case ViewType.MutationSummary:
                return "circle";
        }
    }

    private getAxisMenu(vertical:boolean) {
        const axisSelection = vertical ? this.vertSelection : this.horzSelection;
        const dataTestWhichAxis = vertical ? "Vertical" : "Horizontal";
        return (
            <form>
                <h4>{vertical ? "Vertical" : "Horizontal"} Axis</h4>
                <div>
                    <div className="radio"><label>
                        <input
                            data-test={`${dataTestWhichAxis}AxisMolecularProfileRadio`}
                            type="radio"
                            name={vertical ? "vert_molecularProfile" : "horz_molecularProfile"}
                            value={vertical ? EventKey.vert_molecularProfile : EventKey.horz_molecularProfile}
                            checked={axisSelection.axisType === AxisType.molecularProfile}
                            onClick={this.onInputClick}
                        /> Molecular Profile
                    </label></div>
                    <div className="radio"><label>
                        <input
                            data-test={`${dataTestWhichAxis}AxisClinicalAttributeRadio`}
                            type="radio"
                            name={vertical ? "vert_clinicalAttribute" : "horz_clinicalAttribute"}
                            value={vertical ? EventKey.vert_clinicalAttribute : EventKey.horz_clinicalAttribute}
                            checked={axisSelection.axisType === AxisType.clinicalAttribute}
                            onClick={this.onInputClick}
                        /> Clinical Attribute
                    </label></div>
                </div>
                {(axisSelection.axisType === AxisType.molecularProfile) && (
                    <div>
                        <div className="form-group">
                            <label>Gene</label>
                            <div style={{display:"flex", flexDirection:"row"}}>
                                <ReactSelect
                                    name={`${vertical ? "v" : "h"}-gene-selector`}
                                    value={axisSelection.entrezGeneId}
                                    onChange={vertical ? this.onVerticalAxisGeneSelect : this.onHorizontalAxisGeneSelect}
                                    isLoading={this.geneOptions.isPending}
                                    options={this.geneOptions.isComplete ? this.geneOptions.result : []}
                                    clearable={false}
                                    searchable={false}
                                />
                                <div style={{marginLeft:7, display:"inline"}}>
                                    {/* this parent div, and the div inside <DefaultTooltip>, are necessary because of issue with <DefaultTooltip> placement */}
                                    <DefaultTooltip
                                        placement="right"
                                        overlay={<span>{this.geneLock ? "Gene selection synchronized in both axes" : "Gene selections independent in each axis"}</span>}
                                    >
                                        <div data-test={`${dataTestWhichAxis}AxisGeneLockButton`}>
                                            <LockIcon locked={this.geneLock} className="lockIcon" onClick={vertical ? this.onVerticalAxisGeneLockClick : this.onHorizontalAxisGeneLockClick}/>
                                        </div>
                                    </DefaultTooltip>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Profile Type</label>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-profile-type-selector`}
                                value={axisSelection.molecularProfileType}
                                onChange={vertical ? this.onVerticalAxisProfileTypeSelect : this.onHorizontalAxisProfileTypeSelect}
                                options={this.profileTypeOptions}
                                clearable={false}
                                searchable={false}
                            />
                        </div>
                        <div className="form-group">
                            <label>Profile Name</label>
                            <div style={{display:"flex", flexDirection:"row"}}>
                                <ReactSelect
                                    name={`${vertical ? "v" : "h"}-profile-name-selector`}
                                    value={axisSelection.molecularProfileId}
                                    onChange={vertical ? this.onVerticalAxisProfileIdSelect : this.onHorizontalAxisProfileIdSelect}
                                    options={this.profileNameOptionsByType[axisSelection.molecularProfileType+""] || []}
                                    clearable={false}
                                    searchable={false}
                                />
                                <InfoIcon
                                    tooltip={<span>{vertical ? this.vertDescription : this.horzDescription}</span>}
                                    tooltipPlacement="right"
                                    style={{marginTop:"0.9em", marginLeft:5}}
                                />
                            </div>
                        </div>
                        { logScalePossible(axisSelection) && (
                            <div className="checkbox"><label>
                                <input
                                    data-test={`${dataTestWhichAxis}LogCheckbox`}
                                    type="checkbox"
                                    name={vertical ? "vert_logScale" : "vert_logScale"}
                                    value={vertical ? EventKey.vert_logScale : EventKey.horz_logScale}
                                    checked={axisSelection.logScale}
                                    onClick={this.onInputClick}
                                /> Apply Log Scale
                            </label></div>
                        )}
                    </div>
                )}
                {(axisSelection.axisType === AxisType.clinicalAttribute) && (
                    <div>
                        Clinical Attribute
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-clinical-attribute-selector`}
                                value={axisSelection.clinicalAttributeId}
                                onChange={vertical ? this.onVerticalAxisClinicalAttributeSelect : this.onHorizontalAxisClinicalAttributeSelect}
                                options={this.clinicalAttributeOptions}
                                clearable={false}
                                searchable={false}
                            />
                            <InfoIcon
                                tooltip={<span>{vertical ? this.vertDescription : this.horzDescription}</span>}
                                tooltipPlacement="right"
                                style={{marginTop:"0.9em", marginLeft:5}}
                            />
                        </div>
                    </div>
                )}
            </form>
        );
    }

    @autobind
    private getUtilitiesMenu() {
        const showTopPart = this.plotType.isComplete && this.plotType.result !== PlotType.Table;
        const showBottomPart = this.sameGeneInBothAxes;
        if (!showTopPart && !showBottomPart) {
            return <span></span>;
        }
        return (
            <div>
                <hr/>
                <h4>Utilities</h4>
                <div>
                    {showTopPart && (<div>
                        <div className="form-group">
                            <label>Search Case(s)</label>
                            <FormControl
                                type="text"
                                value={this.searchCaseInput}
                                onChange={this.setSearchCaseInput}
                                placeholder="Case ID.."
                            />
                        </div>
                        {this.mutationDataShown && (
                            <div className="form-group">
                                <label>Search Mutation(s)</label>
                                <FormControl
                                    type="text"
                                    value={this.searchMutationInput}
                                    onChange={this.setSearchMutationInput}
                                    placeholder="Protein Change.."
                                />
                            </div>
                        )}
                    </div>)}
                    {showBottomPart && (
                        <div>
                            <label>View</label>
                            <div className="radio"><label>
                                <input
                                    type="radio"
                                    name="utilities_viewMutationType"
                                    value={EventKey.utilities_viewMutationType}
                                    checked={this.viewType === ViewType.MutationType}
                                    onClick={this.onInputClick}
                                    disabled={!this.mutationDataExists.isComplete || !this.mutationDataExists.result}
                                /> Mutation Type
                            </label></div>
                            <div className="radio"><label>
                                <input
                                    data-test="ViewCopyNumber"
                                    type="radio"
                                    name="utilities_viewCopyNumber"
                                    value={EventKey.utilities_viewCopyNumber}
                                    checked={this.viewType === ViewType.CopyNumber}
                                    onClick={this.onInputClick}
                                    disabled={!this.cnaDataExists.isComplete || !this.cnaDataExists.result}
                                /> Copy Number
                            </label></div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    @autobind
    private controls() {
        return (
            <div style={{display:"flex", flexDirection:"column"}}>
                <div className="axisBlock">
                    <Observer>
                        {this.getHorizontalAxisMenu}
                    </Observer>
                </div>
                <div style={{ textAlign:'center'}}>
                    <button className="btn btn-default" data-test="swapHorzVertButton" onClick={this.swapHorzVertSelections}><i className="fa fa-arrow-up"></i> Swap Axes <i className="fa fa-arrow-down"></i></button>
                </div>
                <div className="axisBlock">
                    <Observer>
                        {this.getVerticalAxisMenu}
                    </Observer>
                </div>
                <div>
                    <Observer>
                        {this.getUtilitiesMenu}
                    </Observer>
                </div>
            </div>
        );
    }

    readonly plotType = remoteData({
        await: ()=>[
            this.horzAxisDataPromise,
            this.vertAxisDataPromise
        ],
        invoke: ()=>{
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<PlotType>(()=>0); // dont resolve
            } else {
                if (isStringData(horzAxisData) && isStringData(vertAxisData)) {
                    return Promise.resolve(PlotType.Table);
                } else if (isNumberData(horzAxisData) && isNumberData(vertAxisData)) {
                    return Promise.resolve(PlotType.ScatterPlot);
                } else {
                    return Promise.resolve(PlotType.BoxPlot);
                }
            }
        }
    });

    readonly _unsortedScatterPlotData = remoteData<IScatterPlotData[]>({
        await: ()=>{
            const ret:MobxPromise<any>[] = [
                this.horzAxisDataPromise,
                this.vertAxisDataPromise,
                this.props.store.sampleKeyToSample,
                this.props.store.coverageInformation
            ];
            if (this.mutationDataShown) {
                ret.push(this.mutationPromise);
                ret.push(this.props.store.studyToMutationMolecularProfile);
            }
            if (this.cnaDataShown) {
                ret.push(this.cnaPromise);
                ret.push(this.props.store.studyToMolecularProfileDiscrete);
            }
            return ret;
        },
        invoke: ()=>{
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<IScatterPlotData[]>(()=>0); // dont resolve
            } else {
                if (isNumberData(horzAxisData) && isNumberData(vertAxisData)) {
                    return Promise.resolve(makeScatterPlotData(
                        horzAxisData,
                        vertAxisData,
                        this.props.store.sampleKeyToSample.result!,
                        this.props.store.coverageInformation.result!.samples,
                        this.mutationDataShown ? {
                            molecularProfileIds: _.values(this.props.store.studyToMutationMolecularProfile.result!).map(p=>p.molecularProfileId),
                            data: this.mutationPromise.result!
                        } : undefined,
                        this.cnaDataShown ? {
                            molecularProfileIds: _.values(this.props.store.studyToMolecularProfileDiscrete.result!).map(p=>p.molecularProfileId),
                            data: this.cnaPromise.result!
                        }: undefined
                    ));
                } else {
                    return Promise.resolve([]);
                }
            }
        }
    });

    readonly scatterPlotData = remoteData<IScatterPlotData[]>({
        await:()=>[this._unsortedScatterPlotData],
        invoke:()=>{
            let data = this._unsortedScatterPlotData.result!;
            switch (this.viewType) {
                case ViewType.MutationType:
                    data = _.sortBy<IScatterPlotData>(data, d=>{
                        if (d.dispMutationType! in mutationRenderPriority) {
                            return -mutationRenderPriority[d.dispMutationType!]
                        } else {
                            return Number.NEGATIVE_INFINITY;
                        }
                    });
                    break;
                case ViewType.MutationSummary:
                    data = _.sortBy<IScatterPlotData>(data, d=>{
                        if (d.dispMutationSummary! in mutationSummaryRenderPriority) {
                            return -mutationSummaryRenderPriority[d.dispMutationSummary!]        ;
                        } else {
                            return Number.NEGATIVE_INFINITY;
                        }
                    });
                    break;
            }
            return Promise.resolve(data);
        }
    });

    readonly _unsortedBoxPlotData = remoteData<{horizontal:boolean, data:IBoxScatterPlotData<IBoxScatterPlotPoint>[]}>({
        await: ()=>{
            const ret:MobxPromise<any>[] = [
                this.horzAxisDataPromise,
                this.vertAxisDataPromise,
                this.props.store.sampleKeyToSample,
                this.props.store.coverageInformation
            ];
            if (this.mutationDataShown) {
                ret.push(this.mutationPromise);
                ret.push(this.props.store.studyToMutationMolecularProfile);
            }
            if (this.cnaDataShown) {
                ret.push(this.cnaPromise);
                ret.push(this.props.store.studyToMolecularProfileDiscrete);
            }
            return ret;
        },
        invoke: ()=>{
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<any>(()=>0); // dont resolve
            } else {
                let categoryData:IStringAxisData;
                let numberData:INumberAxisData;
                let horizontal:boolean;
                if (isNumberData(horzAxisData) && isStringData(vertAxisData)) {
                    categoryData = vertAxisData;
                    numberData = horzAxisData;
                    horizontal = true;
                } else if (isStringData(horzAxisData) && isNumberData(vertAxisData)) {
                    categoryData = horzAxisData;
                    numberData = vertAxisData;
                    horizontal = false;
                } else {
                    return Promise.resolve({horizontal:false, data:[]});
                }
                return Promise.resolve({
                    horizontal,
                    data: makeBoxScatterPlotData(
                        categoryData, numberData,
                        this.props.store.sampleKeyToSample.result!,
                        this.props.store.coverageInformation.result!.samples,
                        this.mutationDataShown ? {
                            molecularProfileIds: _.values(this.props.store.studyToMutationMolecularProfile.result!).map(p=>p.molecularProfileId),
                            data: this.mutationPromise.result!
                        } : undefined,
                        this.cnaDataShown ? {
                            molecularProfileIds: _.values(this.props.store.studyToMolecularProfileDiscrete.result!).map(p=>p.molecularProfileId),
                            data: this.cnaPromise.result!
                        }: undefined
                    )
                });
            }
        }
    });

    readonly boxPlotData = remoteData<{horizontal:boolean, data:IBoxScatterPlotData<IBoxScatterPlotPoint>[]}>({
        await: ()=>[this._unsortedBoxPlotData],
        invoke:()=>{
            const horizontal = this._unsortedBoxPlotData.result!.horizontal;
            let boxPlotData = this._unsortedBoxPlotData.result!.data;
            switch (this.viewType) {
                case ViewType.MutationType:
                    boxPlotData = boxPlotData.map(labelAndData=>({
                        label: labelAndData.label,
                        data: _.sortBy<IBoxScatterPlotPoint>(labelAndData.data, d=>{
                            if (d.dispMutationType! in mutationRenderPriority) {
                                return -mutationRenderPriority[d.dispMutationType!]
                            } else {
                                return Number.NEGATIVE_INFINITY;
                            }
                        })
                    }));
                    break;
                case ViewType.MutationSummary:
                    boxPlotData = boxPlotData.map(labelAndData=>({
                        label: labelAndData.label,
                        data: _.sortBy<IBoxScatterPlotPoint>(labelAndData.data, d=>{
                            if (d.dispMutationSummary! in mutationSummaryRenderPriority) {
                                return -mutationSummaryRenderPriority[d.dispMutationSummary!]        ;
                            } else {
                                return Number.NEGATIVE_INFINITY;
                            }
                        })
                    }));
                    break;
            }
            return Promise.resolve({ horizontal, data: boxPlotData });
        }
    });

    @computed get boxPlotBoxWidth() {
        const SMALL_BOX_WIDTH = 30;
        const LARGE_BOX_WIDTH = 80;

        if (this.boxPlotData.isComplete) {
            return this.boxPlotData.result.data.length > 7 ? SMALL_BOX_WIDTH : LARGE_BOX_WIDTH;
        } else {
            // irrelevant - nothing should be plotted anyway
            return SMALL_BOX_WIDTH;
        }
    }

    @autobind
    private plot() {
        if (this.plotType.isPending || this.horzAxisDataPromise.isPending || this.vertAxisDataPromise.isPending) {
            return <LoadingIndicator isLoading={true}/>;
        } else if (this.plotType.isError || this.horzAxisDataPromise.isError || this.vertAxisDataPromise.isError) {
            return <span>Error loading plot data.</span>;
        } else {
            // all complete
            const plotType = this.plotType.result!;
            let plotElt:any = null;
            switch (plotType) {
                case PlotType.Table:
                    plotElt = (
                        <TablePlot
                            svgRef={this.svgRef}
                            horzData={(this.horzAxisDataPromise.result! as IStringAxisData).data}
                            vertData={(this.vertAxisDataPromise.result! as IStringAxisData).data}
                            horzCategoryOrder={(this.horzAxisDataPromise.result! as IStringAxisData).categoryOrder}
                            vertCategoryOrder={(this.vertAxisDataPromise.result! as IStringAxisData).categoryOrder}
                            minCellWidth={35}
                            minCellHeight={35}
                            minChartWidth={500}
                            minChartHeight={500}
                            axisLabelX={this.horzLabel}
                            axisLabelY={this.vertLabel}
                        />
                    );
                    break;
                case PlotType.ScatterPlot:
                    if (this.scatterPlotData.isComplete) {
                        plotElt = (
                            <PlotsTabScatterPlot
                                svgRef={this.svgRef}
                                axisLabelX={this.horzLabel + this.horzLabelLogSuffix}
                                axisLabelY={this.vertLabel + this.vertLabelLogSuffix}
                                data={this.scatterPlotData.result}
                                chartWidth={500}
                                chartHeight={500}
                                tooltip={this.scatterPlotTooltip}
                                highlight={this.scatterPlotHighlight}
                                logX={this.horzSelection.logScale}
                                logY={this.vertSelection.logScale}
                                fill={this.scatterPlotFill}
                                stroke={this.scatterPlotStroke}
                                symbol={this.scatterPlotSymbol}
                                fillOpacity={this.scatterPlotFillOpacity}
                                strokeWidth={1}
                                useLogSpaceTicks={true}
                                legendData={scatterPlotLegendData(
                                    this.scatterPlotData.result, this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.mutationAnnotationSettings.driversAnnotated
                                )}
                            />
                        );
                        break;
                    } else if (this.scatterPlotData.isError) {
                        return <span>Error loading plot data.</span>;
                    } else {
                        return <LoadingIndicator isLoading={true}/>;
                    }
                case PlotType.BoxPlot:
                    if (this.boxPlotData.isComplete) {
                        const horizontal = this.boxPlotData.result.horizontal;
                        plotElt = (
                            <PlotsTabBoxPlot
                                svgRef={this.svgRef}
                                boxWidth={this.boxPlotBoxWidth}
                                axisLabelX={this.horzLabel + (horizontal ? this.horzLabelLogSuffix : "")}
                                axisLabelY={this.vertLabel + (!horizontal ? this.vertLabelLogSuffix : "")}
                                data={this.boxPlotData.result.data}
                                chartBase={500}
                                tooltip={this.boxPlotTooltip}
                                highlight={this.scatterPlotHighlight}
                                horizontal={horizontal}
                                logScale={horizontal ? this.horzSelection.logScale : this.vertSelection.logScale}
                                fill={this.scatterPlotFill}
                                stroke={this.scatterPlotStroke}
                                symbol={this.scatterPlotSymbol}
                                fillOpacity={this.scatterPlotFillOpacity}
                                strokeWidth={1}
                                useLogSpaceTicks={true}
                                legendData={scatterPlotLegendData(
                                    _.flatten(this.boxPlotData.result.data.map(d=>d.data)), this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.mutationAnnotationSettings.driversAnnotated
                                )}
                            />
                        );
                        break;
                    } else if (this.boxPlotData.isError) {
                        return <span>Error loading plot data.</span>;
                    } else {
                        return <LoadingIndicator isLoading={true}/>;
                    }
                default:
                    return <span>Not implemented yet</span>
            }
            const legendY = (plotType === PlotType.ScatterPlot ? SCATTERPLOT_LEGEND_Y : BOXPLOT_LEGEND_Y);
            return (
                <div data-test="PlotsTabPlotDiv" className="borderedChart posRelative inlineBlock" style={{position: "relative"}}>
                    <div style={{display:"flex", flexDirection:"row"}}>
                        <DownloadControls
                            getSvg={this.getSvg}
                            filename={this.downloadFilename}
                            buttons={["SVG", "PDF"]}
                            additionalRightButtons={[{
                                key:"data",
                                content:<span>Data <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                                onClick:this.downloadData,
                                disabled: !this.props.store.entrezGeneIdToGene.isComplete
                            }]}
                            dontFade={true}
                            style={{position:'absolute', right:10, top:10 }}
                        />
                        {plotElt}
                        {(plotType === PlotType.ScatterPlot || plotType === PlotType.BoxPlot) && this.viewType === ViewType.MutationType && (
                            <div style={{position:"relative", top:legendY + 4.5}}>
                                <InfoIcon
                                    tooltip={<span>Driver annotation settings are located in the Mutation Color menu of the Oncoprint.</span>}
                                    tooltipPlacement="right"
                                />
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    }

    public render() {
        return (
            <div className={"plotsTab"} style={{display:"flex", flexDirection:"row", maxWidth:"inherit"}} data-test="PlotsTabEntireDiv">
                <div className="leftColumn">
                    <Observer>
                        {this.controls}
                    </Observer>
                </div>
                <div style={{overflow:"auto"}}>
                    <Observer>
                        {this.plot}
                    </Observer>
                </div>
            </div>
        );
    }
}