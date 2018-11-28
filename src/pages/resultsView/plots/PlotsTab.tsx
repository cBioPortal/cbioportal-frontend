import * as React from "react";
import {action, computed, observable} from "mobx";
import {Observer, observer} from "mobx-react";
import "./styles.scss";
import {AlterationTypeConstants, DataTypeConstants, ResultsViewPageStore} from "../ResultsViewPageStore";
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
    getCnaQueries, getMutationQueries, getScatterPlotDownloadData, getBoxPlotDownloadData,
    mutationRenderPriority, mutationSummaryRenderPriority, MutationSummary, mutationSummaryToAppearance,
    CNA_STROKE_WIDTH, PLOT_SIDELENGTH, CLIN_ATTR_DATA_TYPE,
    sortMolecularProfilesForDisplay, scatterPlotZIndexSortBy, getMutationProfileDuplicateSamplesReport, GENESET_DATA_TYPE
} from "./PlotsTabUtils";
import {
    ClinicalAttribute, MolecularProfile, Mutation,
    NumericGeneMolecularData
} from "../../../shared/api/generated/CBioPortalAPI";
import Timer = NodeJS.Timer;
import ScatterPlot from "shared/components/plots/ScatterPlot";
import TablePlot from "shared/components/plots/TablePlot";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import InfoIcon from "../../../shared/components/InfoIcon";
import {remoteData} from "../../../shared/api/remoteData";
import {MobxPromise} from "mobxpromise";
import BoxScatterPlot, {IBoxScatterPlotData} from "../../../shared/components/plots/BoxScatterPlot";
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import setWindowVariable from "../../../shared/lib/setWindowVariable";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';
import onMobxPromise from "../../../shared/lib/onMobxPromise";
import {SpecialAttribute} from "../../../shared/cache/OncoprintClinicalDataCache";
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";
import ScrollBar from "../../../shared/components/Scrollbar/ScrollBar";
import {scatterPlotSize} from "../../../shared/components/plots/PlotUtils";
import {getTablePlotDownloadData} from "../../../shared/components/plots/TablePlotUtils";
import {getMobxPromiseGroupStatus} from "../../../shared/lib/getMobxPromiseGroupStatus";
import StackedBarPlot from "../../../shared/components/plots/StackedBarPlot";
import {STUDY_VIEW_CONFIG} from "../../studyView/StudyViewConfig";

enum EventKey {
    horz_logScale,
    vert_logScale,
    utilities_viewMutationType,
    utilities_viewCopyNumber,
    utilities_discreteVsDiscreteTable,
    utilities_stackedBarHorizontalBars
}


export enum ViewType {
    MutationType,
    MutationTypeAndCopyNumber,
    CopyNumber,
    MutationSummary,
    None
}

export enum PotentialViewType {
    MutationTypeAndCopyNumber,
    MutationSummary,
    None
}

export enum PlotType {
    ScatterPlot,
    BoxPlot,
    DiscreteVsDiscrete,
}

export enum DiscreteVsDiscretePlotType {
    Table,
    StackedBar
}

export enum MutationCountBy {
    MutationType = "MutationType",
    MutatedVsWildType = "MutatedVsWildType"
}

export type AxisMenuSelection = {
    entrezGeneId?:number;
    genesetId?:string;
    selectedGeneOption?:{value:number, label:string}; // value is entrez id, label is hugo symbol
    selectedGenesetOption?:{value:string, label:string};
    dataType?:string;
    dataSourceId?:string;
    mutationCountBy:MutationCountBy;
    logScale: boolean;
};

export interface IPlotsTabProps {
    store:ResultsViewPageStore;
};

const searchInputTimeoutMs = 600;

class PlotsTabScatterPlot extends ScatterPlot<IScatterPlotData> {}
class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

const SVG_ID = "plots-tab-plot-svg";

export const SAME_GENE_OPTION_VALUE = "same";
export const SAME_GENESET_OPTION_VALUE = "same";

const mutationCountByOptions = [
    { value: MutationCountBy.MutationType, label: "Mutation Type" },
    { value: MutationCountBy.MutatedVsWildType, label: "Mutated vs Wild-type" }
];

@observer
export default class PlotsTab extends React.Component<IPlotsTabProps,{}> {

    private horzSelection:AxisMenuSelection;
    private vertSelection:AxisMenuSelection;
    private scrollPane:HTMLDivElement;

    @observable searchCaseInput:string;
    @observable searchMutationInput:string;
    @observable viewMutationType:boolean = true;
    @observable viewCopyNumber:boolean = false;
    // discrete vs discrete settings
    @observable discreteVsDiscretePlotType = DiscreteVsDiscretePlotType.StackedBar;
    @observable stackedBarHorizontalBars = false;

    @observable searchCase:string = "";
    @observable searchMutation:string = "";
    @observable plotExists = false;

    @autobind
    private getScrollPane(){
        return this.scrollPane;
    }

    @computed get viewType():ViewType {
        let ret:ViewType = ViewType.None;
        switch (this.potentialViewType) {
            case PotentialViewType.MutationTypeAndCopyNumber:
                if (this.viewMutationType && this.viewCopyNumber) {
                    ret = ViewType.MutationTypeAndCopyNumber;
                } else if (this.viewMutationType) {
                    ret = ViewType.MutationType;
                } else if (this.viewCopyNumber) {
                    ret = ViewType.CopyNumber;
                } else {
                    ret = ViewType.None;
                }
                break;
            case PotentialViewType.MutationSummary:
                if (this.viewMutationType) {
                    ret = ViewType.MutationSummary;
                } else {
                    ret = ViewType.None;
                }
                break;
        }
        return ret;
    }

    @computed get potentialViewType():PotentialViewType {
        if (this.plotType.result === PlotType.DiscreteVsDiscrete) {
            // cant show either in table
            return PotentialViewType.None;
        }
        if (this.sameGeneInBothAxes) {
            // both axes molecular profile, same gene
            return PotentialViewType.MutationTypeAndCopyNumber;
        } else if (this.bothAxesMolecularProfile) {
            // both axes molecular profile, different gene
            return PotentialViewType.MutationSummary;
        } else if (this.horzSelection.dataType !== CLIN_ATTR_DATA_TYPE ||
            this.vertSelection.dataType !== CLIN_ATTR_DATA_TYPE) {
            // one axis molecular profile
            return PotentialViewType.MutationTypeAndCopyNumber;
        } else {
            // neither axis gene
            return PotentialViewType.None;
        }
    }

    private searchCaseTimeout:Timer;
    private searchMutationTimeout:Timer;

    constructor(props:IPlotsTabProps) {
        super(props);

        this.horzSelection = this.initAxisMenuSelection(false);
        this.vertSelection = this.initAxisMenuSelection(true);

        this.searchCaseInput = "";
        this.searchMutationInput = "";

        (window as any).resultsViewPlotsTab = this;
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
                if (this.dataType !== CLIN_ATTR_DATA_TYPE && this.selectedGeneOption) {
                    if (this.selectedGeneOption.value === SAME_GENE_OPTION_VALUE) {
                        return self.horzSelection.entrezGeneId;
                    } else {
                        return this.selectedGeneOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGeneOption() {
                const geneOptions = (vertical ? self.vertGeneOptions : self.horzGeneOptions.result) || [];
                if (this._selectedGeneOption === undefined && geneOptions.length) {
                    // select default if _selectedGeneOption is undefined and theres defaults to choose from
                    return geneOptions[0];
                } else if (vertical && this._selectedGeneOption && this._selectedGeneOption.value === SAME_GENE_OPTION_VALUE &&
                            self.horzSelection.dataType === CLIN_ATTR_DATA_TYPE) {
                    // if vertical gene option is "same as horizontal", and horizontal is clinical, then use the actual
                    //      gene option value instead of "Same gene" option value, because that would be slightly weird UX
                    return self.horzSelection.selectedGeneOption;
                } else {
                    // otherwise, return stored value for this variable
                    return this._selectedGeneOption;
                }
            },
            set selectedGeneOption(o:any) {
                this._selectedGeneOption = o;
            },
            get dataType() {
                if (!self.dataTypeOptions.isComplete) {
                    // if there are no options to select a default from, then return the stored value for this variable
                    return this._dataType;
                }
                // otherwise, pick the default based on available options
                const dataTypeOptions = self.dataTypeOptions.result!;
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
                if (!self.dataTypeToDataSourceOptions.isComplete) {
                    // if there are no options to select a default from, then return the stored value for this variable
                    return this._dataSourceId;
                }
                // otherwise, pick the default based on the current selected data type, and available sources
                const dataSourceOptionsByType = self.dataTypeToDataSourceOptions.result!;
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
            get mutationCountBy() {
                if (this._mutationCountBy === undefined) {
                    // default
                    return MutationCountBy.MutationType;
                } else {
                    return this._mutationCountBy;
                }
            },
            set mutationCountBy(m:MutationCountBy) {
                this._mutationCountBy = m;
            },
            get logScale() {
                return this._logScale && logScalePossible(this);
            },
            set logScale(v:boolean) {
                this._logScale = v;
            },
            get genesetId() {
                if (this.selectedGenesetOption) {
                    if (this.selectedGenesetOption.value === SAME_GENESET_OPTION_VALUE) {
                        return self.horzSelection.genesetId;
                    } else {
                        return this.selectedGenesetOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGenesetOption() {
                const genesetOptions = (vertical ? self.vertGenesetOptions : self.horzGenesetOptions.result) || [];
                if (this._selectedGenesetOption === undefined && genesetOptions.length) {
                    // select default if _selectedGenesetOption is undefined and theres defaults to choose from
                    return genesetOptions[0];
                } else if (vertical && this._selectedGenesetOption && this._selectedGenesetOption.value === SAME_GENESET_OPTION_VALUE &&
                            self.horzSelection.dataType === CLIN_ATTR_DATA_TYPE) {
                    // if vertical gene set option is "same as horizontal", and horizontal is clinical, then use the actual
                    //      gene set option value instead of "Same gene" option value, because that would be slightly weird UX
                    return self.horzSelection.selectedGenesetOption;
                } else {
                    // otherwise, return stored value for this variable
                    return this._selectedGenesetOption;
                }
            },
            set selectedGenesetOption(o:any) {
                this._selectedGenesetOption = o;
            },
            _selectedGeneOption: undefined,
            _selectedGenesetOption: undefined,
            _dataType: undefined,
            _dataSourceId: undefined,
            _mutationCountBy: undefined,
            _logScale: false
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
            case EventKey.utilities_discreteVsDiscreteTable:
                if (this.discreteVsDiscretePlotType === DiscreteVsDiscretePlotType.Table) {
                    this.discreteVsDiscretePlotType = DiscreteVsDiscretePlotType.StackedBar;
                } else {
                    this.discreteVsDiscretePlotType = DiscreteVsDiscretePlotType.Table;
                }
                break;
            case EventKey.utilities_stackedBarHorizontalBars:
                this.stackedBarHorizontalBars = !this.stackedBarHorizontalBars;
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
                    case PlotType.DiscreteVsDiscrete:
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

    private isAxisMenuLoading(axisSelection:AxisMenuSelection) {
        return ;
    }

    @autobind
    private getHorizontalAxisMenu() {
        if (!this.dataTypeOptions.isComplete ||
            !this.dataTypeToDataSourceOptions.isComplete) {
            return <span></span>;
        } else {
            return this.getAxisMenu(
                false,
                this.dataTypeOptions.result,
                this.dataTypeToDataSourceOptions.result
            );
        }
    }

    @autobind
    private getVerticalAxisMenu() {
        if (!this.dataTypeOptions.isComplete ||
            !this.dataTypeToDataSourceOptions.isComplete) {
            return <span></span>;
        } else {
            return this.getAxisMenu(
                true,
                this.dataTypeOptions.result,
                this.dataTypeToDataSourceOptions.result
            );
        }
    }

    @autobind
    private onVerticalAxisGeneSelect(option:any) {
        this.vertSelection.selectedGeneOption = option;
    }

    @autobind
    private onHorizontalAxisGeneSelect(option:any) {
        this.horzSelection.selectedGeneOption = option;
    }

    @autobind
    private onVerticalAxisGenesetSelect(option:any) {
        this.vertSelection.selectedGenesetOption = option;
    }

    @autobind
    private onHorizontalAxisGenesetSelect(option:any) {
        this.horzSelection.selectedGenesetOption = option;
    }

    public test__selectGeneOption(vertical:boolean, optionValue:any) {
        // for end to end testing
        // optionValue is either entrez id or the code for same gene
        let options:any[];
        if (vertical) {
            options = this.vertGeneOptions;
        } else {
            options = this.horzGeneOptions.result || [];
        }
        const option = options.find(x=>(x.value === optionValue));
        if (!option) {
            throw "Option not found";
        }
        if (vertical) {
            this.onVerticalAxisGeneSelect(option);
        } else {
            this.onHorizontalAxisGeneSelect(option);
        }
    }

    readonly horzGeneOptions = remoteData({
        await:()=>[this.props.store.genes],
        invoke:()=>{
            return Promise.resolve(
                this.props.store.genes.result!.map(gene=>({ value: gene.entrezGeneId, label: gene.hugoGeneSymbol }))
            );
        }
    });

    @computed get vertGeneOptions() {
        // computed instead of remoteData in order to make the rerender synchronous when the 'Same gene (HUGO SYMBOL)'
        //  option changes. if its remoteData, theres setTimeout(0)'s in the way and it causes unnecessarily an extra
        //  render which leads to a flash of the loading icon on the screen
        let sameGeneOption = undefined;
        if (this.horzSelection.selectedGeneOption && this.horzSelection.dataType !== CLIN_ATTR_DATA_TYPE && this.horzSelection.dataType !== GENESET_DATA_TYPE) {
            // show "Same gene" option as long as horzSelection has a selected option, and horz isnt clinical attribute or
            // a gene set, bc in that case theres no selected gene displayed so its confusing UX to have "Same gene" as an option
            sameGeneOption = [{ value: SAME_GENE_OPTION_VALUE, label: `Same gene (${this.horzSelection.selectedGeneOption.label})`}];
        }
        return (sameGeneOption || []).concat((this.horzGeneOptions.result || []) as any[]);
    }

    //readonly horzGenesetOptions = this.props.store.genesetIds.map(genesetId=>({ value: genesetId, label: genesetId }));
    readonly horzGenesetOptions = remoteData({
        await:()=>[this.props.store.genesets],
        invoke:()=>{
            return Promise.resolve(
                this.props.store.genesets.result!.map(geneset=>({ value: geneset.genesetId, label: geneset.name }))
            );
        }
    });

    @computed get vertGenesetOptions() {
        // computed instead of remoteData in order to make the rerender synchronous when the 'Same gene set (GENE SET)'
        //  option changes. if its remoteData, theres setTimeout(0)'s in the way and it causes unnecessarily an extra
        //  render which leads to a flash of the loading icon on the screen
        let sameGenesetOption = undefined;
        if (this.horzSelection.selectedGenesetOption && this.horzSelection.dataType === GENESET_DATA_TYPE) {
            // show "Same gene set" option as long as horzSelection has a selected option, and horz is gene set attribute, bc
            //  in that case theres no selected gene displayed so its confusing UX to have "Same gene" as an option
            sameGenesetOption = [{ value: SAME_GENESET_OPTION_VALUE, label: `Same gene set (${this.horzSelection.selectedGenesetOption.label})`}];
        }
        return (sameGenesetOption || []).concat((this.horzGenesetOptions.result || []) as {value:string, label:string}[]);
    }

    readonly clinicalAttributeIdToClinicalAttribute = remoteData<{[clinicalAttributeId:string]:ClinicalAttribute}>({
        await:()=>[
            this.props.store.clinicalAttributes,
            this.props.store.studyIds
        ],
        invoke:()=>{
            let _map: {[clinicalAttributeId: string]: ClinicalAttribute} = _.keyBy(this.props.store.clinicalAttributes.result, c=>c.clinicalAttributeId);
            return Promise.resolve(_map);
        }
    });

    readonly clinicalAttributeOptions = remoteData({
        await:()=>[this.props.store.clinicalAttributes],
        invoke:()=>{

            let _clinicalAttributes = _.sortBy<ClinicalAttribute>(this.props.store.clinicalAttributes.result!,
                [(o: any)=>-o.priority, (o: any)=>o.label]).map(attribute=>(
                {
                    value: attribute.clinicalAttributeId,
                    label: attribute.displayName,
                    priority: attribute.priority
                }
            ));

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

    readonly dataTypeOptions = remoteData<{value:string, label:string}[]>({
        await:()=>[
            this.props.store.molecularProfilesWithData,
            this.clinicalAttributeOptions,
            this.props.store.molecularProfilesInStudies
        ],
        invoke:()=>{
            const profiles = this.props.store.molecularProfilesWithData.result!;

            // show only data types we have profiles for
            const dataTypeIds:string[] = _.uniq(
                profiles.map(profile=>profile.molecularAlterationType)
            ).filter(type=>!!dataTypeToDisplayType[type]); // only show profiles of the type we want to show

            if (this.clinicalAttributeOptions.result!.length) {
                // add "clinical attribute" to list if we have any clinical attribute options
                dataTypeIds.push(CLIN_ATTR_DATA_TYPE);
            }

            if (this.props.store.molecularProfilesInStudies.result!.length && this.horzGenesetOptions.result && this.horzGenesetOptions.result!.length > 0) {
              // add geneset profile to list if the study contains it and the query contains gene sets
              this.props.store.molecularProfilesInStudies.result.filter(p=>{
                if (p.molecularAlterationType === AlterationTypeConstants[GENESET_DATA_TYPE]) {
                  if (dataTypeIds.indexOf(GENESET_DATA_TYPE) === -1) {
                    dataTypeIds.push(GENESET_DATA_TYPE);
                  }
                }
              });
            }

            return Promise.resolve(
                _.sortBy(dataTypeIds, // sort them into display order
                    type=>dataTypeDisplayOrder.indexOf(type)
                ).map(type=>({
                    value: type,
                    label: dataTypeToDisplayType[type]
                })) // output options
            );
        }
    });

    readonly dataTypeToDataSourceOptions = remoteData<{[dataType:string]:{value:string, label:string}[]}>({
        await:()=>[
            this.props.store.molecularProfilesWithData,
            this.clinicalAttributeOptions
        ],
        invoke:()=>{
            const profiles = this.props.store.molecularProfilesWithData.result!;
            const map = _.mapValues(
                _.groupBy(profiles, profile=>profile.molecularAlterationType), // create a map from profile type to list of profiles of that type
                profilesOfType=>(
                    sortMolecularProfilesForDisplay(profilesOfType).map(p=>({value:p.molecularProfileId, label:p.name}))// create options out of those profiles
                )
            );
            if (this.clinicalAttributeOptions.result!.length) {
                // add clinical attributes
                map[CLIN_ATTR_DATA_TYPE] = this.clinicalAttributeOptions.result!;
            }
            return Promise.resolve(map);
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
    public onVerticalAxisMutationCountBySelect(option:any) {
        this.vertSelection.mutationCountBy = option.value;
    }

    @autobind
    @action
    public onHorizontalAxisMutationCountBySelect(option:any) {
        this.horzSelection.mutationCountBy = option.value;
    }

    @autobind
    @action
    private swapHorzVertSelections() {
        const keys:(keyof AxisMenuSelection)[] = ["dataType", "dataSourceId", "logScale", "mutationCountBy"];
        // have to store all values for swap because values depend on each other in derived data way so the copy can mess up if you do it one by one
        const horz = keys.map(k=>this.horzSelection[k]);
        const vert = keys.map(k=>this.vertSelection[k]);
        for (let i=0; i<keys.length; i++) {
            this.horzSelection[keys[i]] = vert[i];
            this.vertSelection[keys[i]] = horz[i];
        }

        // only swap genes if vertSelection is not set to "Same gene"
        if (!this.vertSelection.selectedGeneOption || (this.vertSelection.selectedGeneOption.value.toString() !== SAME_GENE_OPTION_VALUE)) {
            const horzOption = this.horzSelection.selectedGeneOption;
            const vertOption = this.vertSelection.selectedGeneOption;
            this.horzSelection.selectedGeneOption = vertOption;
            this.vertSelection.selectedGeneOption = horzOption;
        }

        // only swap gene sets if vertSelection is not set to "Same gene set"
        if (!this.vertSelection.selectedGenesetOption || (this.vertSelection.selectedGenesetOption.value.toString() !== SAME_GENESET_OPTION_VALUE)) {
            const horzOption = this.horzSelection.selectedGenesetOption;
            const vertOption = this.vertSelection.selectedGenesetOption;
            this.horzSelection.selectedGenesetOption = vertOption;
            this.vertSelection.selectedGenesetOption = horzOption;
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

    @computed get cnaDataCanBeShown() {
        return !!(this.cnaDataExists.result && this.potentialViewType === PotentialViewType.MutationTypeAndCopyNumber);
    }

    @computed get cnaDataShown() {
        return !!(this.cnaDataExists.result && (this.viewType === ViewType.CopyNumber || this.viewType === ViewType.MutationTypeAndCopyNumber));
    }

    readonly cnaPromise = remoteData({
        await:()=>{
            const queries = getCnaQueries(this.horzSelection, this.vertSelection, this.cnaDataShown);
            if (queries.length > 0) {
                return this.props.store.annotatedCnaCache.getAll(queries);
            } else {
                return [];
            }
        },
        invoke:()=>{
            const queries = getCnaQueries(this.horzSelection, this.vertSelection, this.cnaDataShown);
            if (queries.length > 0) {
                return Promise.resolve(_.flatten(this.props.store.annotatedCnaCache.getAll(queries).map(p=>p.result!)));
            } else {
                return Promise.resolve([]);
            }
        }
    });

    @computed get mutationDataCanBeShown() {
        return !!(this.mutationDataExists.result && this.potentialViewType !== PotentialViewType.None);
    }

    @computed get mutationDataShown() {
        return !!(this.mutationDataExists.result &&
            (this.viewType === ViewType.MutationType || this.viewType === ViewType.MutationSummary ||
                this.viewType === ViewType.MutationTypeAndCopyNumber));
    }

    readonly mutationPromise = remoteData({
        await:()=>this.props.store.putativeDriverAnnotatedMutationCache.getAll(
            getMutationQueries(this.horzSelection, this.vertSelection)
        ),
        invoke: ()=>{
            return Promise.resolve(_.flatten(this.props.store.putativeDriverAnnotatedMutationCache.getAll(
                getMutationQueries(this.horzSelection, this.vertSelection)
            ).map(p=>p.result!)).filter(x=>!!x));
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
            this.props.store.mutationCache,
            this.props.store.numericGeneMolecularDataCache,
            this.props.store.studyToMutationMolecularProfile,
            this.props.store.coverageInformation,
            this.props.store.samples,
            this.props.store.genesetMolecularDataCache
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
            this.props.store.mutationCache,
            this.props.store.numericGeneMolecularDataCache,
            this.props.store.studyToMutationMolecularProfile,
            this.props.store.coverageInformation,
            this.props.store.samples,
            this.props.store.genesetMolecularDataCache
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
        return makeScatterPlotPointAppearance(this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.driverAnnotationSettings.driversAnnotated);
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
    private scatterPlotStrokeOpacity(d:IScatterPlotSampleData) {
        return this.scatterPlotAppearance(d).strokeOpacity;
    }

    @autobind
    private scatterPlotTooltip(d:IScatterPlotData) {
        return scatterPlotTooltip(d);
    }

    @computed get boxPlotTooltip() {
        return (d:IBoxScatterPlotPoint)=>{
            let content;
            if (this.boxPlotData.isComplete) {
                content = boxPlotTooltip(d, this.boxPlotData.result.horizontal);
            } else {
                content = <span>Loading... (this shouldnt appear because the box plot shouldnt be visible)</span>;
            }
            return content;
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

    private getAxisMenu(
        vertical:boolean,
        dataTypeOptions:{value:string, label:string}[],
        dataSourceOptionsByType:{[type:string]:{value:string, label:string}[]}
    ) {
        const axisSelection = vertical ? this.vertSelection : this.horzSelection;
        const dataTestWhichAxis = vertical ? "Vertical" : "Horizontal";

        let dataSourceLabel = "Profile";
        let dataSourceValue = axisSelection.dataSourceId;
        let dataSourceOptions = (axisSelection.dataType ? dataSourceOptionsByType[axisSelection.dataType] : []) || [];
        let onDataSourceChange = vertical ? this.onVerticalAxisDataSourceSelect : this.onHorizontalAxisDataSourceSelect;

        switch (axisSelection.dataType) {
            case CLIN_ATTR_DATA_TYPE:
                dataSourceLabel = "Clinical Attribute";
                break;
            case AlterationTypeConstants.MUTATION_EXTENDED:
                dataSourceLabel = "Group Mutations by";
                dataSourceValue = axisSelection.mutationCountBy;
                dataSourceOptions = mutationCountByOptions;
                onDataSourceChange = vertical ? this.onVerticalAxisMutationCountBySelect : this.onHorizontalAxisMutationCountBySelect;
                break;
            case undefined:
                break;
            default:
                dataSourceLabel = `${dataTypeToDisplayType[axisSelection.dataType!]} Profile`;
                break;
        }

        return (
            <form>
                <h4>{vertical ? "Vertical" : "Horizontal"} Axis</h4>
                <div>
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
                        <label>{dataSourceLabel}</label>
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <ReactSelect
                                className="data-source-id"
                                name={`${vertical ? "v" : "h"}-profile-name-selector`}
                                value={dataSourceValue}
                                onChange={onDataSourceChange}
                                options={dataSourceOptions}
                                clearable={false}
                                searchable={true}
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
                    {(axisSelection.dataType !== GENESET_DATA_TYPE) && (<div className="form-group" style={{opacity:(axisSelection.dataType === CLIN_ATTR_DATA_TYPE ? 0 : 1)}}>
                        <label>Gene</label>
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-gene-selector`}
                                value={axisSelection.selectedGeneOption ? axisSelection.selectedGeneOption.value : undefined}
                                onChange={vertical ? this.onVerticalAxisGeneSelect : this.onHorizontalAxisGeneSelect}
                                isLoading={this.horzGeneOptions.isPending}
                                options={this.horzGeneOptions.isComplete ? (vertical ? this.vertGeneOptions : this.horzGeneOptions.result) : []}
                                clearable={false}
                                searchable={false}
                                disabled={axisSelection.dataType === CLIN_ATTR_DATA_TYPE || axisSelection.dataType === GENESET_DATA_TYPE}
                            />
                        </div>
                    </div>)}
                    {(axisSelection.dataType === GENESET_DATA_TYPE) && (<div className="form-group" style={{opacity:1}}>
                        <label>Gene Set</label>
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-geneset-selector`}
                                value={axisSelection.selectedGenesetOption ? axisSelection.selectedGenesetOption.value : undefined}
                                onChange={vertical ? this.onVerticalAxisGenesetSelect : this.onHorizontalAxisGenesetSelect}
                                isLoading={this.horzGenesetOptions.isPending}
                                options={this.horzGenesetOptions.isComplete ? (vertical ? this.vertGenesetOptions : this.horzGenesetOptions.result) : []}
                                clearable={false}
                                searchable={false}
                                disabled={axisSelection.dataType !== GENESET_DATA_TYPE}
                            />
                        </div>
                    </div>)}
                </div>
            </form>
        );
    }

    @autobind
    private getUtilitiesMenu() {
        const showSearchOptions = this.plotType.isComplete && this.plotType.result !== PlotType.DiscreteVsDiscrete;
        const showDiscreteVsDiscreteOption = this.plotType.isComplete && this.plotType.result === PlotType.DiscreteVsDiscrete;
        const showStackedBarHorizontalOption = showDiscreteVsDiscreteOption && this.discreteVsDiscretePlotType === DiscreteVsDiscretePlotType.StackedBar;
        const showSampleColoringOptions = this.mutationDataCanBeShown || this.cnaDataCanBeShown;
        if (!showSearchOptions && !showSampleColoringOptions && !showDiscreteVsDiscreteOption && !showStackedBarHorizontalOption) {
            return <span></span>;
        }
        return (
            <div>
                <hr/>
                <h4>Utilities</h4>
                <div>
                    {showSearchOptions && (<div>
                        <div className="form-group">
                            <label>Search Case(s)</label>
                            <FormControl
                                type="text"
                                value={this.searchCaseInput}
                                onChange={this.setSearchCaseInput}
                                placeholder="Case ID.."
                            />
                        </div>
                        {this.mutationDataCanBeShown && (
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
                    {showDiscreteVsDiscreteOption && (
                        <div className="checkbox"><label>
                            <input
                                data-test="DiscreteVsDiscreteTable"
                                type="checkbox"
                                name="utilities_discreteVsDiscreteTable"
                                value={EventKey.utilities_discreteVsDiscreteTable}
                                checked={this.discreteVsDiscretePlotType === DiscreteVsDiscretePlotType.Table}
                                onClick={this.onInputClick}
                            /> Show Table Plot
                        </label></div>
                    )}
                    {showStackedBarHorizontalOption && (
                        <div className="checkbox"><label>
                            <input
                                data-test="StackedBarHorizontalBars"
                                type="checkbox"
                                name="utilities_stackedBarHorizontalBars"
                                value={EventKey.utilities_stackedBarHorizontalBars}
                                checked={this.stackedBarHorizontalBars}
                                onClick={this.onInputClick}
                            /> Horizontal Bars
                        </label></div>
                    )}
                    {showSampleColoringOptions && (
                        <div>
                            <label>Color Samples By</label>
                            {this.mutationDataCanBeShown && (
                                <div className="checkbox"><label>
                                    <input
                                        data-test="ViewMutationType"
                                        type="checkbox"
                                        name="utilities_viewMutationType"
                                        value={EventKey.utilities_viewMutationType}
                                        checked={this.viewMutationType}
                                        onClick={this.onInputClick}
                                        disabled={!this.mutationDataExists.isComplete || !this.mutationDataExists.result}
                                    /> Mutation Type *
                                </label></div>
                            )}
                            {this.cnaDataCanBeShown && (
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
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    @autobind
    private assignScrollPaneRef(el:HTMLDivElement){
        this.scrollPane=el;
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
                    return Promise.resolve(PlotType.DiscreteVsDiscrete);
                } else if (isNumberData(horzAxisData) && isNumberData(vertAxisData)) {
                    return Promise.resolve(PlotType.ScatterPlot);
                } else {
                    return Promise.resolve(PlotType.BoxPlot);
                }
            }
        }
    });

    /*readonly mutationProfileDuplicateSamplesReport = remoteData({
        await:()=>[
            this.horzAxisDataPromise,
            this.vertAxisDataPromise
        ],
        invoke:()=>{
            return Promise.resolve(getMutationProfileDuplicateSamplesReport(
                this.horzAxisDataPromise.result!,
                this.vertAxisDataPromise.result!,
                this.horzSelection,
                this.vertSelection
            ));
        }
    });*/

    readonly scatterPlotData = remoteData<IScatterPlotData[]>({
        await: ()=>[
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.props.store.sampleKeyToSample,
            this.props.store.coverageInformation,
            this.mutationPromise,
            this.props.store.studyToMutationMolecularProfile,
            this.cnaPromise,
            this.props.store.studyToMolecularProfileDiscrete
        ],
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
                        this.mutationDataExists.result ? {
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

    readonly boxPlotData = remoteData<{horizontal:boolean, data:IBoxScatterPlotData<IBoxScatterPlotPoint>[]}>({
        await: ()=>[
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.props.store.sampleKeyToSample,
            this.props.store.coverageInformation,
            this.mutationPromise,
            this.props.store.studyToMutationMolecularProfile,
            this.cnaPromise,
            this.props.store.studyToMolecularProfileDiscrete
        ],
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
                        this.mutationDataExists.result ? {
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

    @computed get zIndexSortBy() {
        return scatterPlotZIndexSortBy<IScatterPlotSampleData>(
            this.viewType,
            this.scatterPlotHighlight
        );
    }

    @computed get boxPlotBoxWidth() {
        const SMALL_BOX_WIDTH = 30;
        const LARGE_BOX_WIDTH = 60;

        if (this.boxPlotData.isComplete) {
            return this.boxPlotData.result.data.length > 7 ? SMALL_BOX_WIDTH : LARGE_BOX_WIDTH;
        } else {
            // irrelevant - nothing should be plotted anyway
            return SMALL_BOX_WIDTH;
        }
    }

    @computed get plot() {
        const promises = [this.plotType, this.horzAxisDataPromise, this.vertAxisDataPromise, this.horzLabel, this.vertLabel];
        const groupStatus = getMobxPromiseGroupStatus(...promises);
        switch (groupStatus) {
            case "pending":
                return <LoadingIndicator isLoading={true} center={true} size={"big"}/>;
            case "error":
                return <span>Error loading plot data.</span>;
            default:
                const plotType = this.plotType.result!;
                let plotElt:any = null;
                switch (plotType) {
                    case PlotType.DiscreteVsDiscrete:
                        if (this.discreteVsDiscretePlotType === DiscreteVsDiscretePlotType.Table) {
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
                        } else {
                            plotElt = (
                                <StackedBarPlot
                                    svgId={SVG_ID}
                                    horzData={(this.horzAxisDataPromise.result! as IStringAxisData).data}
                                    vertData={(this.vertAxisDataPromise.result! as IStringAxisData).data}
                                    categoryToColor={STUDY_VIEW_CONFIG.colors.reservedValue}
                                    horzCategoryOrder={(this.horzAxisDataPromise.result! as IStringAxisData).categoryOrder}
                                    vertCategoryOrder={(this.vertAxisDataPromise.result! as IStringAxisData).categoryOrder}
                                    barWidth={50}
                                    chartBase={PLOT_SIDELENGTH}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    legendLocationWidthThreshold={550}
                                    horizontalBars={this.stackedBarHorizontalBars}
                                />
                            );
                        }
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
                                    strokeOpacity={this.scatterPlotStrokeOpacity}
                                    zIndexSortBy={this.zIndexSortBy}
                                    symbol="circle"
                                    fillOpacity={this.scatterPlotFillOpacity}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    useLogSpaceTicks={true}
                                    legendData={scatterPlotLegendData(
                                        this.scatterPlotData.result, this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.driverAnnotationSettings.driversAnnotated
                                    )}
                                />
                            );
                            break;
                        } else if (this.scatterPlotData.isError) {
                            return <span>Error loading plot data.</span>;
                        } else {
                            return <LoadingIndicator isLoading={true} center={true} size={"big"}/>;
                        }
                    case PlotType.BoxPlot:
                        if (this.boxPlotData.isComplete) {
                            const horizontal = this.boxPlotData.result.horizontal;
                            plotElt = (
                                <PlotsTabBoxPlot
                                    svgId={SVG_ID}
                                    domainPadding={75}
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
                                    strokeOpacity={this.scatterPlotStrokeOpacity}
                                    zIndexSortBy={this.zIndexSortBy}
                                    symbol="circle"
                                    fillOpacity={this.scatterPlotFillOpacity}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    useLogSpaceTicks={true}
                                    legendData={scatterPlotLegendData(
                                        _.flatten(this.boxPlotData.result.data.map(d=>d.data)), this.viewType, this.mutationDataExists, this.cnaDataExists, this.props.store.driverAnnotationSettings.driversAnnotated
                                    )}
                                     legendLocationWidthThreshold={550}
                                />
                            );
                            break;
                        } else if (this.boxPlotData.isError) {
                            return <span>Error loading plot data.</span>;
                        } else {
                            return <LoadingIndicator isLoading={true} center={true} size={"big"}/>;
                        }
                    default:
                        return <span>Not implemented yet</span>
                }
                return (
                    <div>
                        <div data-test="PlotsTabPlotDiv" className="borderedChart posRelative">
                            <ScrollBar style={{position:'relative', top:-5}} getScrollEl={this.getScrollPane} />
                            {this.plotExists && (
                                <DownloadControls
                                    getSvg={this.getSvg}
                                    filename={this.downloadFilename}
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
                                <div ref={this.assignScrollPaneRef} style={{position:"relative", display:"inline-block"}}>
                                {plotElt}
                                </div>
                        </div>
                        {this.mutationDataCanBeShown && (
                            <div style={{marginTop:5}}>* Driver annotation settings are located in the Mutation Color menu of the Oncoprint.</div>
                        )}
                        {/*this.mutationProfileDuplicateSamplesReport.isComplete && this.mutationProfileDuplicateSamplesReport.result.showMessage && (
                            <div className="alert alert-info" style={{marginTop:5, padding: 7}}>
                                Notice: With Mutation profiles, there is one data point per mutation type, per sample. In
                                this plot, there are {this.mutationProfileDuplicateSamplesReport.result.numSamples} samples with more than
                                one type of mutation, leading to {this.mutationProfileDuplicateSamplesReport.result.numSurplusPoints} extra
                                data points.
                            </div>
                        )*/}
                    </div>
                );
        }
    }

    componentDidUpdate() {
        this.plotExists = !!this.getSvg();
    }

    public render() {
        return (
            <div data-test="PlotsTabEntireDiv">
                <div className={'tabMessageContainer'}>
                    <OqlStatusBanner className="plots-oql-status-banner" store={this.props.store} tabReflectsOql={false} />
                </div>
                <div className={"plotsTab"} style={{display:"flex", flexDirection:"row"}}>
                    <div className="leftColumn">
                        { (this.dataTypeOptions.isComplete &&
                        this.dataTypeToDataSourceOptions.isComplete) ? (
                            <Observer>
                                {this.controls}
                            </Observer>
                        ) : <LoadingIndicator isLoading={true} center={true} size={"big"}/> }
                    </div>
                    <div className="inlineBlock">
                        {this.plot}
                    </div>
                </div>
            </div>
        );
    }
}
