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
    makeAxisDataPromise, makeScatterPlotData, makeScatterPlotPointAppearance, dataTypeDisplayOrder,
    dataTypeToDisplayType, scatterPlotTooltip, scatterPlotLegendData, IStringAxisData, INumberAxisData,
    makeBoxScatterPlotData, IScatterPlotSampleData, noMutationAppearance, IBoxScatterPlotPoint, boxPlotTooltip,
    getCnaQueries, getMutationQueries, getScatterPlotDownloadData, getBoxPlotDownloadData, getTablePlotDownloadData,
    mutationRenderPriority, mutationSummaryRenderPriority, MutationSummary, mutationSummaryToAppearance,
    CNA_STROKE_WIDTH, scatterPlotSize, PLOT_SIDELENGTH, CLIN_ATTR_DATA_TYPE, maxWidthTooltip,
    sortScatterPlotDataForZIndex
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
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import setWindowVariable from "../../../shared/lib/setWindowVariable";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';
import onMobxPromise from "../../../shared/lib/onMobxPromise";
import {logicalOr} from "../../../shared/lib/LogicUtils";
import {SpecialAttribute} from "../../../shared/cache/OncoprintClinicalDataCache";

enum EventKey {
    horz_logScale,
    vert_logScale,
    utilities_viewMutationType,
    utilities_viewCopyNumber,
}


export enum ViewType {
    MutationType,
    MutationTypeAndCopyNumber,
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
    entrezGeneId?:number;
    dataType?:string;
    dataSourceId?:string;
    logScale: boolean;
};

export interface IPlotsTabProps {
    store:ResultsViewPageStore;
};

const searchInputTimeoutMs = 600;

class PlotsTabScatterPlot extends ScatterPlot<IScatterPlotData> {}
class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

const SVG_ID = "plots-tab-plot-svg";

@observer
export default class PlotsTab extends React.Component<IPlotsTabProps,{}> {

    private horzSelection:AxisMenuSelection;
    private vertSelection:AxisMenuSelection;

    @observable geneLock:boolean;
    @observable searchCaseInput:string;
    @observable searchMutationInput:string;
    @observable viewMutationType:boolean = true;
    @observable viewCopyNumber:boolean = true;

    @observable searchCase:string = "";
    @observable searchMutation:string = "";
    @observable plotExists = false;

    @computed get viewType():ViewType {
        if (this.sameGeneInBothAxes) {
            // both axes molecular profile, same gene
            if (this.viewMutationType && this.viewCopyNumber) {
                return ViewType.MutationTypeAndCopyNumber;
            } else if (this.viewMutationType) {
                return ViewType.MutationType;
            } else if (this.viewCopyNumber) {
                return ViewType.CopyNumber;
            } else {
                return ViewType.None;
            }
        } else if (this.bothAxesMolecularProfile) {
            // both axes molecular profile, different gene
            return ViewType.MutationSummary;
        } else if (this.horzSelection.dataType !== CLIN_ATTR_DATA_TYPE ||
                    this.vertSelection.dataType !== CLIN_ATTR_DATA_TYPE) {
            // one axis molecular profile
            return ViewType.MutationType;
        } else {
            // neither axis gene
            return ViewType.None;
        }
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

        setWindowVariable("resultsViewPlotsTab", this); // for e2e testing
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    private downloadFilename = "plot"; // todo: more specific?

    private initAxisMenuSelection(vertical:boolean):AxisMenuSelection {
        const self = this;

        return observable({
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
            get dataType() {
                if (this.entrezGeneId === undefined || !self.geneToDataTypeOptions.isComplete) {
                    // if theres no selected gene (this only happens at beginning of initialization),
                    //  or if there are no options to select a default from, then return the stored value for this variable
                    return this._dataType;
                }
                // otherwise, pick the default based on sources that have data for the selected gene
                const dataTypeOptions = self.geneToDataTypeOptions.result![this.entrezGeneId] || [];
                if (this._dataType === undefined && dataTypeOptions.length) {
                    // return computed default if _dataType is undefined and if there are options to select a default value from
                    if (vertical && !!dataTypeOptions.find(o=>(o.value === AlterationTypeConstants.MRNA_EXPRESSION))) {
                        // default for the vertical axis is mrna, if one is available
                        return AlterationTypeConstants.MRNA_EXPRESSION;
                    } else if (!vertical && !!dataTypeOptions.find(o=>(o.value === AlterationTypeConstants.COPY_NUMBER_ALTERATION))) {
                        // default for the horizontal axis is CNA, if one is available
                        return AlterationTypeConstants.COPY_NUMBER_ALTERATION;
                    } else {
                        // otherwise, just return the first option
                        return dataTypeOptions[0].value;
                    }
                } else {
                    // otherwise, _dataType is defined, or there are no default options to choose from, so return _dataType
                    return this._dataType;
                }
            },
            set dataType(t:string|undefined) {
                if (this._dataType !== t) {
                    this._dataSourceId = undefined;
                }
                this._dataType = t;
            },
            get dataSourceId() {
                if (this.entrezGeneId === undefined || !self.geneToTypeToDataSourceOptions.isComplete) {
                    // if theres no selected gene (this only happens at beginning of initialization),
                    //  or if there are no options to select a default from, then return the stored value for this variable
                    return this._dataSourceId;
                }
                // otherwise, pick the default based on the current selected data type, and
                //  the sources that have data for the selected gene
                const dataSourceOptionsByType = self.geneToTypeToDataSourceOptions.result![this.entrezGeneId] || {};
                if (this._dataSourceId === undefined &&
                    this.dataType &&
                    dataSourceOptionsByType[this.dataType] &&
                    dataSourceOptionsByType[this.dataType].length) {
                    // return computed default if _dataSourceId is undefined
                    return dataSourceOptionsByType[this.dataType][0].value;
                } else {
                    // otherwise, _dataSourceId is defined, or there are no default options to choose from, so return _dataType
                    return this._dataSourceId;
                }
            },
            set dataSourceId(id:string|undefined) {
                this._dataSourceId = id;
            },
            get logScale() {
                return this._logScale && logScalePossible(this);
            },
            set logScale(v:boolean) {
                this._logScale = v;
            },
            _entrezGeneId: undefined,
            _dataType: undefined,
            _dataSourceId: undefined,
            _logScale: true
        });
    }

    @autobind
    @action
    private onInputClick(event:React.MouseEvent<HTMLInputElement>) {
        switch (parseInt((event.target as HTMLInputElement).value, 10)) {
            case EventKey.horz_logScale:
                this.horzSelection.logScale = !this.horzSelection.logScale;
                break;
            case EventKey.vert_logScale:
                this.vertSelection.logScale = !this.vertSelection.logScale;
                break;
            case EventKey.utilities_viewCopyNumber:
                this.viewCopyNumber = !this.viewCopyNumber;
                break;
            case EventKey.utilities_viewMutationType:
                this.viewMutationType = !this.viewMutationType;
                break;
        }
    }

    @autobind
    private downloadData() {
        onMobxPromise<any>(
            [this.props.store.entrezGeneIdToGene,
            this.props.store.sampleKeyToSample,
            this.horzLabel,
            this.vertLabel],
            (entrezGeneIdToGene, sampleKeyToSample, horzLabel, vertLabel)=>{
                const filename = `${this.downloadFilename}.txt`;
                switch (this.plotType.result) {
                    case PlotType.ScatterPlot:
                        fileDownload(
                            getScatterPlotDownloadData(
                                this.scatterPlotData.result!,
                                horzLabel,
                                vertLabel,
                                entrezGeneIdToGene
                            ),
                            filename
                        );
                        break;
                    case PlotType.BoxPlot:
                        const categoryLabel = this.boxPlotData.result!.horizontal ? vertLabel : horzLabel;
                        const valueLabel = this.boxPlotData.result!.horizontal ? horzLabel : vertLabel;
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
                                horzLabel,
                                vertLabel
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

    readonly clinicalAttributeIdToClinicalAttribute = remoteData<{[clinicalAttributeId:string]:ClinicalAttribute}>({
        await:()=>[
            this.props.store.clinicalAttributes,
            this.props.store.studyIds
        ],
        invoke:()=>{
            let _map: {[clinicalAttributeId: string]: ClinicalAttribute} = _.keyBy(this.props.store.clinicalAttributes.result, c=>c.clinicalAttributeId);
            _map[SpecialAttribute.MutationCount] = {
                clinicalAttributeId: SpecialAttribute.MutationCount,
                datatype: "NUMBER",
                description: "Total mutations",
                displayName: "Total mutations",
                patientAttribute: false,
                priority: "1",
                studyId: this.props.store.studyIds.result![0],
                count: 0
            };
            _map[SpecialAttribute.FractionGenomeAltered] = {
                clinicalAttributeId: SpecialAttribute.FractionGenomeAltered,
                datatype: "NUMBER",
                description: "Fraction Genome Altered",
                displayName: "Fraction Genome Altered",
                patientAttribute: false,
                priority: "1",
                studyId: this.props.store.studyIds.result![0],
                count: 0
            };
            return Promise.resolve(_map);
        }
    });

    readonly clinicalAttributeOptions = remoteData({
        await:()=>[this.props.store.clinicalAttributes],
        invoke:()=>{
            let _clinicalAttributes: {value: string, label: string}[] = [];
            _clinicalAttributes.push({
                value: SpecialAttribute.MutationCount,
                label: "Total mutations"
            });
            _clinicalAttributes.push({
                value: SpecialAttribute.FractionGenomeAltered,
                label: "Fraction Genome Altered"
            });
            this.props.store.clinicalAttributes.result!.map(attribute=>(
                _clinicalAttributes.push({
                    value: attribute.clinicalAttributeId,
                    label: attribute.displayName
                })));

            // to load more quickly, only filter and annotate with data availability once its ready
            // TODO: temporarily disabled because cant figure out a way right now to make this work nicely
            /*if (this.props.store.clinicalAttributeIdToAvailableSampleCount.isComplete) {
                const sampleCounts = this.props.store.clinicalAttributeIdToAvailableSampleCount.result!;
                _clinicalAttributes = _clinicalAttributes.filter(option=>{
                    const count = sampleCounts[option.value];
                    if (!count) {
                        return false;
                    } else {
                        option.label = `${option.label} (${count} samples)`;
                        return true;
                    }
                });
            }*/

            return Promise.resolve(_clinicalAttributes);
        }
    });

    readonly geneToDataTypeOptions = remoteData<{[entrezGeneId:number]:{value:string, label:string}[]}>({
        await:()=>[
            this.props.store.nonMutationMolecularProfilesWithData,
            this.clinicalAttributeOptions
        ],
        invoke:()=>{
            return Promise.resolve(_.mapValues(this.props.store.nonMutationMolecularProfilesWithData.result!,
                profiles=>{
                    const dataTypeIds:string[] = _.uniq(
                        profiles.map(profile=>profile.molecularAlterationType)
                    ).filter(type=>!!dataTypeToDisplayType[type]);

                    if (this.clinicalAttributeOptions.result!.length) {
                        dataTypeIds.push(CLIN_ATTR_DATA_TYPE);
                    }

                    return _.sortBy(dataTypeIds,
                        type=>dataTypeDisplayOrder.indexOf(type)
                    ).map(type=>({
                        value: type,
                        label: dataTypeToDisplayType[type]
                    }));
                }
            ));
        }
    });

    readonly geneToTypeToDataSourceOptions = remoteData<{[entrezGeneId:number]:{[type:string]:{value:string, label:string}[]}}>({
        await:()=>[
            this.props.store.nonMutationMolecularProfilesWithData,
            this.props.store.nonMutationMolecularProfileDataAvailability,
            this.clinicalAttributeOptions
        ],
        invoke:()=>{
            const sampleCounts = this.props.store.nonMutationMolecularProfileDataAvailability.result!;
            return Promise.resolve(_.mapValues(this.props.store.nonMutationMolecularProfilesWithData.result!,
                (profiles, gene)=>{
                    const map = _.mapValues(
                        _.groupBy(profiles, profile=>profile.molecularAlterationType),
                        profilesOfType=>(
                            profilesOfType.map(p=>{
                                // sampleCount definitely exists because these profiles are in nonMutationMolecularProfilesWithData
                                const sampleCount = sampleCounts[p.molecularProfileId][parseInt(gene, 10)];
                                return {value:p.molecularProfileId, label:`${p.name} (${sampleCount} samples)`};
                            })
                        )
                    );
                    if (this.clinicalAttributeOptions.result!.length) {
                        map[CLIN_ATTR_DATA_TYPE] = this.clinicalAttributeOptions.result!;
                    }
                    return map;
                }
            ));
        }
    });

    @autobind
    @action
    private onVerticalAxisDataTypeSelect(option:any) {
        this.vertSelection.dataType = option.value;
    }

    @autobind
    @action
    public onHorizontalAxisDataTypeSelect(option:any) {
        this.horzSelection.dataType = option.value;
    }

    @autobind
    @action
    public onVerticalAxisDataSourceSelect(option:any) {
        this.vertSelection.dataSourceId = option.value;
    }

    @autobind
    @action
    public onHorizontalAxisDataSourceSelect(option:any) {
        this.horzSelection.dataSourceId = option.value;
    }

    @autobind
    @action
    private swapHorzVertSelections() {
        const keys:(keyof AxisMenuSelection)[] = ["entrezGeneId", "dataType", "dataSourceId", "logScale"];
        // have to store all values for swap because values depend on each other in derived data way so the copy can mess up if you do it one by one
        const horz = keys.map(k=>this.horzSelection[k]);
        const vert = keys.map(k=>this.vertSelection[k]);
        for (let i=0; i<keys.length; i++) {
            this.horzSelection[keys[i]] = vert[i];
            this.vertSelection[keys[i]] = horz[i];
        }
    }

    @computed get bothAxesMolecularProfile() {
        return (this.horzSelection.dataType !== CLIN_ATTR_DATA_TYPE) &&
             (this.vertSelection.dataType !== CLIN_ATTR_DATA_TYPE);
    }

    @computed get sameGeneInBothAxes() {
        return  this.bothAxesMolecularProfile &&
            (this.horzSelection.entrezGeneId === this.vertSelection.entrezGeneId);
    }

    @computed get cnaDataShown() {
        return this.cnaDataExists && (this.viewType === ViewType.CopyNumber || this.viewType === ViewType.MutationTypeAndCopyNumber);
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
            (this.viewType === ViewType.MutationType || this.viewType === ViewType.MutationSummary ||
                this.viewType === ViewType.MutationTypeAndCopyNumber);
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
                return Promise.resolve([]);
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
            this.props.store.studyToMutationMolecularProfile
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
            this.props.store.numericGeneMolecularDataCache,
            this.props.store.studyToMutationMolecularProfile
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


    readonly horzLabel = remoteData({
        await:()=>[
            this.props.store.molecularProfileIdToMolecularProfile,
            this.props.store.entrezGeneIdToGene,
            this.clinicalAttributeIdToClinicalAttribute
        ],
        invoke:()=>{
            return Promise.resolve(getAxisLabel(
                this.horzSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result!,
                this.props.store.entrezGeneIdToGene.result!,
                this.clinicalAttributeIdToClinicalAttribute.result!
            ));
        }
    });

    @computed get horzLabelLogSuffix() {
        if (this.horzSelection.logScale) {
            return " (log2)";
        } else {
            return "";
        }
    }

    readonly vertLabel = remoteData({
        await:()=>[
            this.props.store.molecularProfileIdToMolecularProfile,
            this.props.store.entrezGeneIdToGene,
            this.clinicalAttributeIdToClinicalAttribute
        ],
        invoke:()=>{
            return Promise.resolve(getAxisLabel(
                this.vertSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result!,
                this.props.store.entrezGeneIdToGene.result!,
                this.clinicalAttributeIdToClinicalAttribute.result!
            ));
        }
    });

    @computed get vertLabelLogSuffix() {
        if (this.vertSelection.logScale) {
            return " (log2)";
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
            case ViewType.MutationTypeAndCopyNumber:
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

    @computed get scatterPlotStrokeWidth() {
        if (this.viewType === ViewType.CopyNumber || this.viewType === ViewType.MutationTypeAndCopyNumber) {
            return CNA_STROKE_WIDTH;
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
        const searchCaseWords = this.searchCase.trim().split(/\s+/g);
        const searchMutationWords = this.searchMutation.trim().split(/\s+/g);

        // need to regenerate the function whenever these change in order to trigger immediate Victory rerender
        return (d:IScatterPlotSampleData)=>{
            let caseMatch = false;
            for (const word of searchCaseWords) {
                caseMatch = caseMatch || (!!word.length && (d.sampleId.indexOf(word) > -1));
                if (caseMatch) {
                    break;
                }
            }
            let mutationMatch = false;
            for (const word of searchMutationWords) {
                mutationMatch = mutationMatch || (!!word.length && (!!d.mutations.find(m=>!!(m.proteinChange && (m.proteinChange.indexOf(word) > -1)))));
                if (mutationMatch) {
                    break;
                }
            }
            return caseMatch || mutationMatch;
        };
    }

    private getAxisMenu(vertical:boolean) {
        const axisSelection = vertical ? this.vertSelection : this.horzSelection;
        const dataTestWhichAxis = vertical ? "Vertical" : "Horizontal";
        let dataTypeOptions:{value:string, label:string}[] = [];
        let dataSourceOptionsByType:{[type:string]:{value:string, label:string}[]} = {};
        if (!this.geneToDataTypeOptions.isComplete || !this.geneToTypeToDataSourceOptions.isComplete) {
            return <LoadingIndicator isLoading={true}/>;
        } else if (axisSelection.entrezGeneId !== undefined) {
            dataTypeOptions = this.geneToDataTypeOptions.result![axisSelection.entrezGeneId] || [];
            dataSourceOptionsByType = this.geneToTypeToDataSourceOptions.result![axisSelection.entrezGeneId] || {};
        }
        return (
            <form>
                <h4>{vertical ? "Vertical" : "Horizontal"} Axis</h4>
                <div>
                    <div className="form-group" style={{opacity:(axisSelection.dataType === CLIN_ATTR_DATA_TYPE ? 0.5 : 1)}}>
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
                                disabled={axisSelection.dataType === CLIN_ATTR_DATA_TYPE}
                            />
                            <div style={{marginLeft:7, display:"inline"}}>
                                {/* this parent div, and the div inside <DefaultTooltip>, are necessary because of issue with <DefaultTooltip> placement */}
                                <DefaultTooltip
                                    placement="right"
                                    overlay={<span>{this.geneLock ? "Gene selection synchronized in both axes" : "Gene selections independent in each axis"}</span>}
                                >
                                    <div data-test={`${dataTestWhichAxis}AxisGeneLockButton`}>
                                        <LockIcon
                                            locked={this.geneLock}
                                            disabled={axisSelection.dataType === CLIN_ATTR_DATA_TYPE}
                                            className="lockIcon"
                                            onClick={vertical ? this.onVerticalAxisGeneLockClick : this.onHorizontalAxisGeneLockClick}
                                        />
                                    </div>
                                </DefaultTooltip>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Data Type</label>
                        <ReactSelect
                            name={`${vertical ? "v" : "h"}-profile-type-selector`}
                            value={axisSelection.dataType}
                            onChange={vertical ? this.onVerticalAxisDataTypeSelect : this.onHorizontalAxisDataTypeSelect}
                            options={dataTypeOptions}
                            clearable={false}
                            searchable={false}
                        />
                    </div>
                    <div className="form-group">
                        <label>{axisSelection.dataType === CLIN_ATTR_DATA_TYPE ? "Clinical Attribute" : `${axisSelection.dataType ? dataTypeToDisplayType[axisSelection.dataType] : ""} Profile`}</label>
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <ReactSelect
                                className="data-source-id"
                                name={`${vertical ? "v" : "h"}-profile-name-selector`}
                                value={axisSelection.dataSourceId}
                                onChange={vertical ? this.onVerticalAxisDataSourceSelect : this.onHorizontalAxisDataSourceSelect}
                                options={dataSourceOptionsByType[axisSelection.dataType+""] || []}
                                clearable={false}
                                searchable={false}
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
                            <label>Color Samples By</label>
                            <div className="checkbox"><label>
                                <input
                                    data-test="ViewMutationType"
                                    type="checkbox"
                                    name="utilities_viewMutationType"
                                    value={EventKey.utilities_viewMutationType}
                                    checked={this.viewMutationType}
                                    onClick={this.onInputClick}
                                    disabled={!this.mutationDataExists.isComplete || !this.mutationDataExists.result}
                                /> Mutation Type
                            </label></div>
                            <div className="checkbox"><label>
                                <input
                                    data-test="ViewCopyNumber"
                                    type="checkbox"
                                    name="utilities_viewCopyNumber"
                                    value={EventKey.utilities_viewCopyNumber}
                                    checked={this.viewCopyNumber}
                                    onClick={this.onInputClick}
                                    disabled={!this.cnaDataExists.isComplete || !this.cnaDataExists.result}
                                /> Copy Number Alteration
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
            // Sort data to put some data on top (z-index order)
            return Promise.resolve(sortScatterPlotDataForZIndex<IScatterPlotData>(
                this._unsortedScatterPlotData.result!,
                this.viewType,
                this.scatterPlotHighlight
            ));
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
        },
    });

    readonly boxPlotData = remoteData<{horizontal:boolean, data:IBoxScatterPlotData<IBoxScatterPlotPoint>[]}>({
        await: ()=>[this._unsortedBoxPlotData],
        invoke:()=>{
            // Sort data to put some data on top (z-index order)
            const horizontal = this._unsortedBoxPlotData.result!.horizontal;
            let boxPlotData = this._unsortedBoxPlotData.result!.data;
            boxPlotData = boxPlotData.map(labelAndData=>({
                label: labelAndData.label,
                data: sortScatterPlotDataForZIndex<IBoxScatterPlotPoint>(labelAndData.data, this.viewType, this.scatterPlotHighlight)
            }));
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
        const promises = [this.plotType, this.horzAxisDataPromise, this.vertAxisDataPromise, this.horzLabel, this.vertLabel];
        if (logicalOr(promises.map(p=>p.isPending))) {
            return <LoadingIndicator isLoading={true}/>;
        } else if (logicalOr(promises.map(p=>p.isError))) {
            return <span>Error loading plot data.</span>;
        } else {
            // all complete
            const plotType = this.plotType.result!;
            let plotElt:any = null;
            switch (plotType) {
                case PlotType.Table:
                    plotElt = (
                        <TablePlot
                            svgId={SVG_ID}
                            horzData={(this.horzAxisDataPromise.result! as IStringAxisData).data}
                            vertData={(this.vertAxisDataPromise.result! as IStringAxisData).data}
                            horzCategoryOrder={(this.horzAxisDataPromise.result! as IStringAxisData).categoryOrder}
                            vertCategoryOrder={(this.vertAxisDataPromise.result! as IStringAxisData).categoryOrder}
                            minCellWidth={35}
                            minCellHeight={35}
                            minChartWidth={PLOT_SIDELENGTH}
                            minChartHeight={PLOT_SIDELENGTH}
                            axisLabelX={this.horzLabel.result!}
                            axisLabelY={this.vertLabel.result!}
                        />
                    );
                    break;
                case PlotType.ScatterPlot:
                    if (this.scatterPlotData.isComplete) {
                        plotElt = (
                            <PlotsTabScatterPlot
                                svgId={SVG_ID}
                                axisLabelX={this.horzLabel.result! + this.horzLabelLogSuffix}
                                axisLabelY={this.vertLabel.result! + this.vertLabelLogSuffix}
                                data={this.scatterPlotData.result}
                                size={scatterPlotSize}
                                chartWidth={PLOT_SIDELENGTH}
                                chartHeight={PLOT_SIDELENGTH}
                                tooltip={this.scatterPlotTooltip}
                                highlight={this.scatterPlotHighlight}
                                logX={this.horzSelection.logScale}
                                logY={this.vertSelection.logScale}
                                fill={this.scatterPlotFill}
                                stroke={this.scatterPlotStroke}
                                symbol="circle"
                                fillOpacity={this.scatterPlotFillOpacity}
                                strokeWidth={this.scatterPlotStrokeWidth}
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
                                svgId={SVG_ID}
                                boxWidth={this.boxPlotBoxWidth}
                                axisLabelX={this.horzLabel.result! + (horizontal ? this.horzLabelLogSuffix : "")}
                                axisLabelY={this.vertLabel.result! + (!horizontal ? this.vertLabelLogSuffix : "")}
                                data={this.boxPlotData.result.data}
                                chartBase={550}
                                tooltip={this.boxPlotTooltip}
                                highlight={this.scatterPlotHighlight}
                                horizontal={horizontal}
                                logScale={horizontal ? this.horzSelection.logScale : this.vertSelection.logScale}
                                size={scatterPlotSize}
                                fill={this.scatterPlotFill}
                                stroke={this.scatterPlotStroke}
                                symbol="circle"
                                fillOpacity={this.scatterPlotFillOpacity}
                                strokeWidth={this.scatterPlotStrokeWidth}
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
                    {this.plotExists && (
                        <DownloadControls
                            getSvg={this.getSvg}
                            filename={this.downloadFilename}
                            buttons={["SVG", "PDF"]}
                            additionalRightButtons={[{
                                key:"Data",
                                content:<span>Data <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                                onClick:this.downloadData,
                                disabled: !this.props.store.entrezGeneIdToGene.isComplete
                            }]}
                            dontFade={true}
                            style={{position:'absolute', right:10, top:10 }}
                            collapse={true}
                        />
                    )}
                        {plotElt}
                        { this.plotExists && // only show info if theres an actual plot
                        (plotType === PlotType.ScatterPlot || plotType === PlotType.BoxPlot) &&
                        (this.viewType === ViewType.MutationType || this.viewType === ViewType.MutationTypeAndCopyNumber) && (
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

    componentDidUpdate() {
        this.plotExists = !!this.getSvg();
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
                    {this.plot()}
                </div>
            </div>
        );
    }
}