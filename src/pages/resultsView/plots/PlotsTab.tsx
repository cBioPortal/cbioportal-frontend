import * as React from "react";
import {action, computed, observable} from "mobx";
import {Observer, observer} from "mobx-react";
import "./styles.scss";
import {AlterationTypeConstants,  ResultsViewPageStore} from "../ResultsViewPageStore";
import {FormControl,Button} from "react-bootstrap";
import ReactSelect from "react-select1";
import _ from "lodash";
import {
    getAxisLabel,
    IScatterPlotData,
    isNumberData,
    isStringData,
    logScalePossible,
    makeAxisDataPromise,
    makeScatterPlotData,
    makeScatterPlotPointAppearance,
    dataTypeDisplayOrder,
    dataTypeToDisplayType,
    scatterPlotTooltip,
    scatterPlotLegendData,
    IStringAxisData,
    INumberAxisData,
    makeBoxScatterPlotData,
    IPlotSampleData,
    IBoxScatterPlotPoint,
    boxPlotTooltip,
    getCnaQueries,
    getMutationQueries,
    getScatterPlotDownloadData,
    getBoxPlotDownloadData,
    MutationSummary,
    mutationSummaryToAppearance,
    CNA_STROKE_WIDTH,
    PLOT_SIDELENGTH,
    CLIN_ATTR_DATA_TYPE,
    sortMolecularProfilesForDisplay,
    scatterPlotZIndexSortBy,
    GENESET_DATA_TYPE,
    makeClinicalAttributeOptions,
    makeWaterfallPlotData,
    IWaterfallPlotData,
    waterfallPlotTooltip,
    getWaterfallPlotDownloadData,
    WATERFALLPLOT_SIDELENGTH,
    WATERFALLPLOT_BASE_SIDELENGTH,
    WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR,
    IAxisLogScaleParams,
    makeAxisLogScaleFunction,
    axisHasNegativeNumbers,
    getLimitValues
} from "./PlotsTabUtils";
import {
    ClinicalAttribute,
} from '../../../shared/api/generated/CBioPortalAPI';
import Timer = NodeJS.Timer;
import ScatterPlot from "shared/components/plots/ScatterPlot";
import WaterfallPlot from "shared/components/plots/WaterfallPlot";
import TablePlot from "shared/components/plots/TablePlot";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import InfoIcon from "../../../shared/components/InfoIcon";
import {remoteData} from "../../../public-lib/api/remoteData";
import BoxScatterPlot, {IBoxScatterPlotData} from "../../../shared/components/plots/BoxScatterPlot";
import DownloadControls from "../../../public-lib/components/downloadControls/DownloadControls";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';
import OqlStatusBanner from "../../../shared/components/banners/OqlStatusBanner";
import ScrollBar from "../../../shared/components/Scrollbar/ScrollBar";
import {scatterPlotSize, dataPointIsLimited} from "../../../shared/components/plots/PlotUtils";
import {getTablePlotDownloadData} from "../../../shared/components/plots/TablePlotUtils";
import {getMobxPromiseGroupStatus} from "../../../shared/lib/getMobxPromiseGroupStatus";
import MultipleCategoryBarPlot from "../../../shared/components/plots/MultipleCategoryBarPlot";
import {RESERVED_CLINICAL_VALUE_COLORS} from "shared/lib/Colors";
import onMobxPromise from "../../../shared/lib/onMobxPromise";
import "./styles.scss";
import { Treatment } from "shared/api/generated/CBioPortalAPIInternal";
import { showWaterfallPlot } from 'pages/resultsView/plots/PlotsTabUtils';
import AlterationFilterWarning from "../../../shared/components/banners/AlterationFilterWarning";
import LastPlotsTabSelectionForDatatype from "./LastPlotsTabSelectionForDatatype";
import { generateQuickPlots } from "./QuickPlots";

enum EventKey {
    horz_logScale,
    vert_logScale,
    utilities_viewMutationType,
    utilities_viewCopyNumber,
    utilities_horizontalBars,
    utilities_showRegressionLine,
    utilities_viewLimitValues
}


export enum ViewType {
    MutationType,
    MutationTypeAndCopyNumber,
    CopyNumber,
    MutationSummary,
    LimitVal,
    LimitValMutationSummary,
    LimitValMutationType,
    LimitValCopyNumber,
    LimitValMutationTypeAndCopyNumber,
    None
}

export enum PotentialViewType {
    MutationTypeAndCopyNumber,
    MutationSummary,
    None,
    LimitValMutationTypeAndCopyNumber,
    LimitValMutationSummary,
    LimitVal
}

export enum PlotType {
    ScatterPlot,
    WaterfallPlot,
    BoxPlot,
    DiscreteVsDiscrete,
    Table
}

export enum DiscreteVsDiscretePlotType {
    Bar = "Bar",
    StackedBar = "StackedBar",
    PercentageStackedBar = "PercentageStackedBar",
    Table = "Table"
}

export enum MutationCountBy {
    MutationType = "MutationType",
    MutatedVsWildType = "MutatedVsWildType"
}

export type AxisMenuSelection = {
    entrezGeneId?:number;
    genesetId?:string;
    treatmentId?:string;
    selectedGeneOption?:PlotsTabGeneOption;
    selectedDataSourceOption?:PlotsTabOption;
    selectedGenesetOption?:PlotsTabOption;
    selectedTreatmentOption?:PlotsTabOption;
    dataType?:string;
    dataSourceId?:string;
    mutationCountBy:MutationCountBy;
    logScale: boolean;
};

export type UtilitiesMenuSelection = {
    entrezGeneIdForMutCNAStyling?:number;
    selectedGeneOption?:{value:number, label:string};
};

export interface IPlotsTabProps {
    store:ResultsViewPageStore;
}

export type PlotsTabDataSource = {
    [dataType: string]: { value: string; label: string }[];
};

export type PlotsTabOption = { value: string; label: string };

export type PlotsTabGeneOption = {
    value: number, // entrez id
    label: string, // hugo symbol
}
export type PlotsTabDataTypeToSources = {
    [dataType: string]: { value: string; label: string }[];
};

const searchInputTimeoutMs = 600;

class PlotsTabScatterPlot extends ScatterPlot<IScatterPlotData> {}
class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}
class PlotsTabWaterfallPlot extends WaterfallPlot<IWaterfallPlotData> {}

const SVG_ID = "plots-tab-plot-svg";

export const NONE_SELECTED_OPTION_STRING_VALUE = "none";
export const NONE_SELECTED_OPTION_NUMERICAL_VALUE = -1;
export const NONE_SELECTED_OPTION_LABEL = "Ordered samples";
export const ALL_SELECTED_OPTION_NUMERICAL_VALUE = -3;
export const SAME_SELECTED_OPTION_STRING_VALUE = "same";
export const SAME_SELECTED_OPTION_NUMERICAL_VALUE = -2;
const LEGEND_TO_BOTTOM_WIDTH_THRESHOLD = 550; // when plot is wider than this value, the legend moves from right to bottom of screen

const mutationCountByOptions = [
    { value: MutationCountBy.MutationType, label: "Mutation Type" },
    { value: MutationCountBy.MutatedVsWildType, label: "Mutated vs Wild-type" }
];

const discreteVsDiscretePlotTypeOptions = [
    { value: DiscreteVsDiscretePlotType.Bar, label: "Bar chart" },
    { value: DiscreteVsDiscretePlotType.StackedBar, label: "Stacked bar chart" },
    { value: DiscreteVsDiscretePlotType.PercentageStackedBar, label: "100% stacked bar chart" },
    { value: DiscreteVsDiscretePlotType.Table, label: "Table" }
]

@observer
export default class PlotsTab extends React.Component<IPlotsTabProps,{}> {

    private horzSelection:AxisMenuSelection;
    private vertSelection:AxisMenuSelection;
    private selectionHistory = new LastPlotsTabSelectionForDatatype();
    private utilitiesMenuSelection:UtilitiesMenuSelection;

    private scrollPane:HTMLDivElement;

    @observable searchCaseInput:string;
    @observable searchMutationInput:string;
    @observable viewMutationType:boolean = true;
    @observable viewCopyNumber:boolean = false;
    @observable showRegressionLine = false;
    // discrete vs discrete settings
    @observable discreteVsDiscretePlotType:DiscreteVsDiscretePlotType = DiscreteVsDiscretePlotType.StackedBar;
    @observable horizontalBars = false;
    @observable percentageBar = false;
    @observable stackedBar = false;
    @observable viewLimitValues:boolean = true;
    @observable _waterfallPlotSortOrder:string|undefined = undefined;

    @observable searchCase:string = "";
    @observable searchMutation:string = "";
    @observable plotExists = false;

    @autobind
    private getScrollPane(){
        return this.scrollPane;
    }

    // determine whether formatting for points in the scatter plot (based on
    // mutations type, CNA, ...) will actually be shown in the plot (depends
    // on user choice via check boxes).
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
            case PotentialViewType.LimitValMutationTypeAndCopyNumber:
                if (this.viewMutationType && this.viewCopyNumber && this.viewLimitValues) {
                    ret = ViewType.LimitValMutationTypeAndCopyNumber;
                } else if (this.viewMutationType && this.viewCopyNumber) {
                    ret = ViewType.MutationTypeAndCopyNumber;
                } else if (this.viewMutationType && this.viewLimitValues) {
                    ret = ViewType.LimitValMutationType;
                } else if (this.viewCopyNumber && this.viewLimitValues) {
                    ret = ViewType.LimitValCopyNumber;
                } else if (this.viewMutationType) {
                    ret = ViewType.MutationType;
                } else if (this.viewCopyNumber) {
                    ret = ViewType.CopyNumber;
                } else if (this.viewLimitValues) {
                    ret = ViewType.LimitVal;
                } else {
                    ret = ViewType.None;
                }
            break;
            case PotentialViewType.LimitValMutationSummary:
                if (this.viewMutationType && this.viewLimitValues) {
                    ret = ViewType.LimitValMutationSummary;
                } else if (this.viewMutationType) {
                    ret = ViewType.MutationSummary;
                } else if (this.viewLimitValues) {
                    ret = ViewType.LimitVal;
                } else {
                    ret = ViewType.None;
                }
            break;
            case PotentialViewType.LimitVal:
                if (this.viewLimitValues) {
                    ret = ViewType.LimitVal;
                }
            break;
        }
        return ret;
    }

    @computed get quickPlotButtons(): JSX.Element {
        if (
            !this.dataTypeOptions.isComplete ||
            !this.dataTypeToDataSourceOptions.isComplete ||
            !this.props.store.samplesByDetailedCancerType.isComplete ||
            !this.props.store.mutations.isComplete
        ) {
            return (
                <LoadingIndicator
                        isLoading={true}
                        size={"small"}
                    />
            );
        }

        const cancerTypes = Object.keys(this.props.store.samplesByDetailedCancerType.result);
        const mutationCount = this.props.store.mutations.result.length;
        const horizontalSource = this.horzSelection.selectedDataSourceOption ?
            this.horzSelection.selectedDataSourceOption.value : undefined;
        const verticalSource = this.vertSelection.selectedDataSourceOption ?
            this.vertSelection.selectedDataSourceOption.value : undefined;

        const plots = generateQuickPlots(
            this.dataTypeOptions.result,
            this.dataTypeToDataSourceOptions.result,
            cancerTypes,
            mutationCount,
            {type: this.horzSelection.dataType, source: horizontalSource},
            {type: this.vertSelection.dataType, source: verticalSource}
        );

        return (
            <div className="pillTabs">
                <ul className="nav nav-pills">
                    {plots.map(pill => (
                        <li
                            className={'plots-tab-pills ' + (pill.selected ? 'active' : '')}
                            onClick={() => {
                                if (pill.plotModel.horizontal.dataType) {
                                    this.onHorizontalAxisDataTypeSelect(
                                        pill.plotModel.horizontal.dataType
                                    );
                                }
                                if (pill.plotModel.horizontal.dataSource) {
                                    this.onHorizontalAxisDataSourceSelect(
                                        pill.plotModel.horizontal.dataSource
                                    );
                                }
                                if (pill.plotModel.vertical.dataType) {
                                    this.onVerticalAxisDataTypeSelect(
                                        pill.plotModel.vertical.dataType
                                    );
                                }
                                if (pill.plotModel.vertical.dataSource) {
                                    this.onVerticalAxisDataSourceSelect(
                                        pill.plotModel.vertical.dataSource
                                    );
                                }
                            }}
                        >
                            <a>{pill.display}</a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // determine whether the selected DataTypes support formatting options
    // for points in the scatter plot (based on mutations type, CNA, ...)
    // NOTE1: the order of these statements is critical for correct resolution
    // NOTE2: limit values are only supported for treatment outcome profiles
    @computed get potentialViewType():PotentialViewType {
        if (this.plotType.result === PlotType.DiscreteVsDiscrete) {
            // cant show either in table
            return PotentialViewType.None;
        }
        // both axes molecular profile, same gene
        if (this.sameGeneInBothAxes) {
            return PotentialViewType.MutationTypeAndCopyNumber;
        }
        // both axes molecular profile, different gene
        if (this.bothAxesMolecularProfile) {
            return PotentialViewType.MutationSummary;
        }
        // one axis molecular profile
        if (this.oneAxisMolecularProfile) {
            //  establish whether data may contain limit values
            // (for now only supported for treatment data)
            if (this.limitValuesCanBeShown) {
                return PotentialViewType.LimitValMutationTypeAndCopyNumber;
            }
            return PotentialViewType.MutationTypeAndCopyNumber;
        }

        //  establish whether data may contain limit values
        // (for now only supported for treatment data)
        if (this.limitValuesCanBeShown) {
            return PotentialViewType.LimitVal;
        }

        // neither axis gene or treatment
        return PotentialViewType.None;
    }

    private searchCaseTimeout:Timer;
    private searchMutationTimeout:Timer;

    constructor(props:IPlotsTabProps) {
        super(props);

        this.horzSelection = this.initAxisMenuSelection(false);
        this.vertSelection = this.initAxisMenuSelection(true);
        this.utilitiesMenuSelection = this.initUtilitiesGeneSelection();

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
                if ( self.showGeneSelectBox(this.dataType) && this.selectedGeneOption) {
                    if (this.selectedGeneOption.value === SAME_SELECTED_OPTION_NUMERICAL_VALUE) {
                        return self.horzSelection.entrezGeneId;
                    } else {
                        return this.selectedGeneOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGeneOption() {
                const geneOptions = vertical ? self.vertGeneOptions : self.horzGeneOptions.result || [];
                if (this._selectedGeneOption === undefined && geneOptions.length) {
                    // select default if _selectedGeneOption is undefined and theres defaults to choose from
                    return geneOptions[0];
                } else if (vertical && this._selectedGeneOption && this._selectedGeneOption.value === SAME_SELECTED_OPTION_NUMERICAL_VALUE &&
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
                } else if (this._dataType === NONE_SELECTED_OPTION_STRING_VALUE) {
                    // when a `none` option was selected in the datatype menu
                    // and was removed (no treatment data selected on other axis)
                    // just return the first option.
                    const firstDataTypeOption = vertical ? self.vertDatatypeOptions[0] : self.horzDatatypeOptions[0];
                    const returnType = firstDataTypeOption.value === NONE_SELECTED_OPTION_STRING_VALUE ? this._dataType : dataTypeOptions[0].value;
                    return returnType;
                } else {
                    // otherwise, _dataType is defined, or there are no default options to choose from, so return _dataType
                    return this._dataType;
                }
            },
            set dataType(t:string|undefined) {
                if (this._dataType !== t) {
                    this._selectedDataSourceOption = undefined;
                }
                this._dataType = t;
            },
            get selectedDataSourceOption() {
                if (!self.dataTypeToDataSourceOptions.isComplete) {
                    // if there are no options to select a default from, then return the stored value for this variable
                    return this._selectedDataSourceOption;
                }
                // otherwise, pick the default based on the current selected data type, and available sources
                const dataSourceOptionsByType = self.dataTypeToDataSourceOptions.result!;
                if (this._selectedDataSourceOption === undefined &&
                    this.dataType &&
                    dataSourceOptionsByType[this.dataType] &&
                    dataSourceOptionsByType[this.dataType].length) {
                    // return computed default if _selectedDataSourceOption is undefined
                    return dataSourceOptionsByType[this.dataType][0];
                } else {
                    // otherwise, _selectedDataSourceOption is defined, or there are no default options to choose from, so return _dataType
                    return this._selectedDataSourceOption;
                }
            },
            set selectedDataSourceOption(option:{value:string, label:string}) {
                this._selectedDataSourceOption = option;
            },
            get dataSourceId() {
                if (this.selectedDataSourceOption) {
                    return this.selectedDataSourceOption.value;
                }
                return undefined;
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
                    if (this.selectedGenesetOption.value === SAME_SELECTED_OPTION_STRING_VALUE) {
                        return self.horzSelection.genesetId;
                    } else {
                        return this.selectedGenesetOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGenesetOption() {
                const genesetOptions = (vertical ? self.vertGenesetOptions : self.horzGenesetOptions
                    .result) || [];
                if (this._selectedGenesetOption === undefined && genesetOptions.length) {
                    // select default if _selectedGenesetOption is undefined and theres defaults to choose from
                    return genesetOptions[0];
                } else if (vertical && this._selectedGenesetOption && this._selectedGenesetOption.value === SAME_SELECTED_OPTION_STRING_VALUE &&
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
            get treatmentId() {
                if (self.showTreatmentSelectBox(this.dataType) && this.selectedTreatmentOption) {
                    if (this.selectedTreatmentOption.value === SAME_SELECTED_OPTION_STRING_VALUE) {
                        return self.horzSelection.treatmentId;
                    } else {
                        return this.selectedTreatmentOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedTreatmentOption() {
                const treatmentOptions = (vertical ? self.vertTreatmentOptions : self.horzTreatmentOptions.result) || [];
                if (this._selectedTreatmentOption === undefined && treatmentOptions.length) {
                    // select default if _selectedTreatmentOption is undefined and there are treatments to choose from
                    return treatmentOptions[0];
                } else if (vertical && this._selectedTreatmentOption
                    && this._selectedTreatmentOption.value === SAME_SELECTED_OPTION_STRING_VALUE
                    && self.horzSelection.dataType === CLIN_ATTR_DATA_TYPE) {
                    // if vertical gene set option is "same as horizontal", and horizontal is clinical, then use the actual
                    //      gene set option value instead of "Same gene" option value, because that would be slightly weird UX
                    return self.horzSelection.selectedTreatmentOption;
                } else {
                    // otherwise, return stored value for this variable
                    return this._selectedTreatmentOption;
                }
            },
            set selectedTreatmentOption(o:any) {
                this._selectedTreatmentOption = o;
            },
            _selectedGeneOption: undefined,
            _selectedGenesetOption: undefined,
            _selectedTreatmentOption: undefined,
            _dataType: undefined,
            _mutationCountBy: undefined,
            _logScale: false,
            _selectedDataSourceOption: undefined
        });
    }

    private initUtilitiesGeneSelection():UtilitiesMenuSelection {
        const self = this;
        return observable({
            get entrezGeneIdForMutCNAStyling() {
                if (self.showUtilitiesMenuGeneSelectBox && this.selectedGeneOption) {
                    return this.selectedGeneOption.value;
                }
                return undefined;
            },
            get selectedGeneOption() {
                const geneOptions = self.horzGeneOptions.isComplete ? self.horzGeneOptions.result : [];
                if (this._selectedUtilitiesGeneOption === undefined && geneOptions.length) {
                    // select default if _selectedUtilitiesGeneOption is undefined and there are genes to choose from
                    return geneOptions[0];
                } else {
                    // otherwise, return stored value for this variable
                    return this._selectedUtilitiesGeneOption;
                }
            },
            set selectedGeneOption(o:any) {
                this._selectedUtilitiesGeneOption = o;
            },
            _selectedUtilitiesGeneOption: undefined
        });
    }

    @autobind
    @action
    private onInputClick(event:React.MouseEvent<HTMLInputElement>) {
        const plotType = this.plotType.result!;
        switch (parseInt((event.target as HTMLInputElement).value, 10)) {
            case EventKey.horz_logScale:
                this.horzSelection.logScale = !this.horzSelection.logScale;
                break;
            case EventKey.vert_logScale:
                this.vertSelection.logScale = !this.vertSelection.logScale;
                break;
            case EventKey.utilities_viewCopyNumber:
                // Styling by mutation type and CNA for waterfall plot
                // is mutually exclusive. When selected the viewMutationType
                // option is deselected when currently selected.
                if (plotType === PlotType.WaterfallPlot) {
                    this.viewCopyNumber = true;
                    this.viewMutationType = false;
                } else {
                    this.viewCopyNumber = !this.viewCopyNumber;
                }
                break;
            case EventKey.utilities_viewMutationType:
                // Styling by mutation type and CNA for waterfall plot
                // is mutually exclusive. When selected the viewCopyNumber
                // option is deselected when currently selected.
                if (plotType === PlotType.WaterfallPlot) {
                    this.viewCopyNumber = false;
                    this.viewMutationType = true;
                } else {
                    this.viewMutationType = !this.viewMutationType;
                }
                break;
            case EventKey.utilities_showRegressionLine:
                this.showRegressionLine = !this.showRegressionLine;
                break;
            case EventKey.utilities_horizontalBars:
                this.horizontalBars = !this.horizontalBars;
                break;
            case EventKey.utilities_viewLimitValues:
                this.viewLimitValues = !this.viewLimitValues;
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
                    case PlotType.WaterfallPlot:
                        fileDownload(
                            getWaterfallPlotDownloadData(
                                this.waterfallPlotData.result!.data,
                                this.waterfallPlotSortOrder,
                                this.waterfallPlotPivotThreshold,
                                this.waterfallLabel.result!,
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
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
    }

    @autobind
    private onHorizontalAxisGeneSelect(option:any) {
        this.horzSelection.selectedGeneOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
    }

    @autobind
    private onVerticalAxisGenesetSelect(option:any) {
        this.vertSelection.selectedGenesetOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
    }

    @autobind
    private onHorizontalAxisGenesetSelect(option:any) {
        this.horzSelection.selectedGenesetOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
    }

    @autobind
    private onVerticalAxisTreatmentSelect(option:any) {
        this.vertSelection.selectedTreatmentOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
    }

    @autobind
    private onHorizontalAxisTreatmentSelect(option:any) {
        this.horzSelection.selectedTreatmentOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
    }

    @autobind
    private onUtilitiesGeneSelect(option:any) {
        this.utilitiesMenuSelection.selectedGeneOption = option;
    }

    public test__selectGeneOption(vertical:boolean, optionValue:any) {
        // for end to end testing
        // optionValue is either entrez id or the code for same gene
        let options:any[];
        if (vertical) {
            options = this.vertGeneOptions || [];
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

    @computed get horzDatatypeOptions() {
        let noneDatatypeOption = undefined;
        // listen to updates of `dataTypeOptions` and on the selected data type for the vertical axis
        if (this.dataTypeOptions && this.vertSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY) {
            noneDatatypeOption = [{ value: NONE_SELECTED_OPTION_STRING_VALUE, label: NONE_SELECTED_OPTION_LABEL}];
        }
        const options = (noneDatatypeOption || []).concat((this.dataTypeOptions.result || []) as any[]);
        return options;
    }

    @computed get vertDatatypeOptions() {
        let noneDatatypeOption = undefined;
        // listen to updates of `dataTypeOptions` and on the selected data type for the horzontal axis
        if (this.dataTypeOptions && this.horzSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY) {
            noneDatatypeOption = [{ value: NONE_SELECTED_OPTION_STRING_VALUE, label: NONE_SELECTED_OPTION_LABEL}];
        }
        return (noneDatatypeOption || []).concat((this.dataTypeOptions.result || []) as any[]);
    }

    @observable readonly horzGeneOptions = remoteData({
        await:()=>[this.props.store.genes],
        invoke:()=>{
            return Promise.resolve(
                this.props.store.genes.result!.map(gene=>({ value: gene.entrezGeneId, label: gene.hugoGeneSymbol }))
            );
        }
    });

    @computed get vertGeneOptions() {
        let sameGeneOption = undefined;
        // // listen to updates of `horzGeneOptions` or the selected data type for the horzontal axis
            // when the data type on the horizontal axis is a gene  profile
            // add an option to select the same gene
        if (this.horzSelection.dataType &&
            this.showGeneSelectBox(this.horzSelection.dataType) &&
            this.horzSelection.selectedGeneOption &&
            this.horzSelection.selectedGeneOption.value !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            sameGeneOption = [{ value: SAME_SELECTED_OPTION_NUMERICAL_VALUE, label: `Same gene (${this.horzSelection.selectedGeneOption.label})`}];
        }
        return (sameGeneOption || []).concat((this.horzGeneOptions.result || []) as any[]);
    }

    @computed get utilityMenuGeneOptions() {
        return (this.horzGeneOptions.result || []) as any[];
    }

    @observable readonly horzGenesetOptions = remoteData({
        await:()=>[this.props.store.genesets],
        invoke:()=>{
            return Promise.resolve(
                this.props.store.genesets.result!.map(geneset=>({ value: geneset.genesetId, label: geneset.name }))
            );
        }
    });

    @computed get vertGenesetOptions() {
        let sameGenesetOption = undefined;
        // listen to updates of `horzGenesetOptions` or the selected data type for the horzontal axis
        if (this.horzGenesetOptions || this.horzSelection.dataType) {
            // when the data type on the horizontal axis is a gene  profile
            // add an option to select the same gene
            if (this.horzSelection.dataType && this.showGenesetSelectBox(this.horzSelection.dataType)
                && this.horzSelection.selectedGenesetOption && this.horzSelection.selectedGenesetOption.value !== NONE_SELECTED_OPTION_STRING_VALUE) {
                sameGenesetOption = [{ value: SAME_SELECTED_OPTION_STRING_VALUE, label: `Same gene set (${this.horzSelection.selectedGenesetOption.label})`}];
            }
        }
        return (sameGenesetOption || []).concat((this.horzGenesetOptions.result || []) as any[]);
    }

    @observable readonly horzTreatmentOptions = remoteData({
        await:()=>[this.props.store.selectedTreatments],
        invoke:()=>{
            return Promise.resolve(
                this.props.store.selectedTreatments.result!.map((treatment:Treatment)=>({ value: treatment.treatmentId, label: treatment.name }))
            );
        }
    });

    @computed get vertTreatmentOptions() {
        let sameTreatmentOption = undefined;
        // listen to updates of `horzTreatmentOptions` or the selected data type for the horzontal axis
        if (this.horzTreatmentOptions || this.horzSelection.dataType) {
            if (this.horzSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY) {
                // when the data type on the horizontal axis is a treatment profile
                // add an option to select the same treatment
                if (this.horzSelection.dataType && this.showTreatmentSelectBox(this.horzSelection.dataType)
                    && this.horzSelection.selectedTreatmentOption && this.horzSelection.selectedTreatmentOption.value !== NONE_SELECTED_OPTION_STRING_VALUE) {
                    sameTreatmentOption = [{ value: SAME_SELECTED_OPTION_STRING_VALUE, label: `Same treatment (${this.horzSelection.selectedTreatmentOption.label})`}];
                }
            }
        }
        return (sameTreatmentOption || []).concat((this.horzTreatmentOptions.result || []) as {value:string, label:string}[]);
    }

    private showGeneSelectBox(dataType:string):boolean {
        return dataType !== NONE_SELECTED_OPTION_STRING_VALUE
                && dataType !== GENESET_DATA_TYPE
                && dataType !== CLIN_ATTR_DATA_TYPE
                && dataType !== AlterationTypeConstants.GENERIC_ASSAY;
    }

    private showGenesetSelectBox(dataType:string):boolean {
        return dataType !== NONE_SELECTED_OPTION_STRING_VALUE
                && dataType === GENESET_DATA_TYPE;
    }

    private showTreatmentSelectBox(dataType:string):boolean {
        return dataType !== NONE_SELECTED_OPTION_STRING_VALUE
                && dataType === AlterationTypeConstants.GENERIC_ASSAY;
    }

    private showDatasourceBox(dataType:string):boolean {
        return dataType !== NONE_SELECTED_OPTION_STRING_VALUE;
    }

    private showUtilitiesMenuGeneSelectBox():boolean {
        return this.plotType.isComplete && this.plotType.result === PlotType.WaterfallPlot;
    }

    private showSortOrderButton(onVerticalAxis:boolean):boolean {
        if (this.waterfallPlotIsShown){
            if (onVerticalAxis) {
                return ! this.isHorizontalWaterfallPlot;
            } else {
                return this.isHorizontalWaterfallPlot;
            }
        }
        return false;
    }

    @computed get waterfallPlotIsShown():boolean {
        return showWaterfallPlot(this.horzSelection, this.vertSelection);
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
        invoke:()=>Promise.resolve(makeClinicalAttributeOptions(this.props.store.clinicalAttributes.result!))
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

            // if no gene sets are queried, remove gene set profile from dataTypeIds
            if (this.props.store.genesets.result!.length === 0 && dataTypeIds.includes("GENESET_SCORE")) {
                    _.remove(dataTypeIds, function(n) {
                        return n === "GENESET_SCORE";
                      });
            }

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
            this.props.store.molecularProfilesInStudies,
            this.clinicalAttributeOptions
        ],
        invoke:()=>{
            const profiles = this.props.store.molecularProfilesInStudies.result!;
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
    private onVerticalAxisDataTypeSelect(option: PlotsTabOption) {
        const oldVerticalGene = this.vertSelection.selectedGeneOption;
        const oldHorizontalGene = this.horzSelection.selectedGeneOption;
        this.vertSelection.dataType = option.value;
        // simultaneous selection of viewCNA and viewMutationType is not
        // supported by the waterfall plot
        if (this.waterfallPlotIsShown && this.viewMutationType && this.viewCopyNumber) {
            this.viewCopyNumber = false;
        }
        this.viewLimitValues = true;
        this.selectionHistory.runVerticalUpdaters(
            option.value,
            this.onVerticalAxisGeneSelect,
            this.onVerticalAxisGenesetSelect,
            this.onVerticalAxisDataSourceSelect,
            this.onVerticalAxisTreatmentSelect,
        );

        if (
            this.vertSelection.dataType &&
            !this.showGeneSelectBox(this.vertSelection.dataType) &&
            oldHorizontalGene &&
            oldHorizontalGene.value == SAME_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            this.onHorizontalAxisGeneSelect(oldVerticalGene);
        }
    }

    @autobind
    @action
    public onHorizontalAxisDataTypeSelect(option: PlotsTabOption) {
        const oldHorizontalGene = this.horzSelection.selectedGeneOption;
        const oldVerticalGene = this.vertSelection.selectedGeneOption;
        // simultaneous selection of viewCNA and viewMutationType is not
        // supported by the waterfall plot
        this.horzSelection.dataType = option.value;
        if (this.waterfallPlotIsShown && this.viewMutationType && this.viewCopyNumber) {
            this.viewCopyNumber = false;
        }
        this.viewLimitValues = true;
        this.selectionHistory.runHorizontalUpdaters(
            option.value,
            this.onHorizontalAxisGeneSelect,
            this.onHorizontalAxisGenesetSelect,
            this.onHorizontalAxisDataSourceSelect,
            this.onHorizontalAxisTreatmentSelect,
        );

        if (
            this.horzSelection.dataType &&
            !this.showGeneSelectBox(this.horzSelection.dataType) &&
            oldVerticalGene &&
            oldVerticalGene.value == SAME_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            this.onVerticalAxisGeneSelect(oldHorizontalGene);
        }
    }

    @autobind
    @action
    public onVerticalAxisDataSourceSelect(option: PlotsTabOption) {
        this.vertSelection.selectedDataSourceOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
    }

    @autobind
    @action
    public onHorizontalAxisDataSourceSelect(option: PlotsTabOption) {
        this.horzSelection.selectedDataSourceOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
    }

    @autobind
    @action
    public onVerticalAxisMutationCountBySelect(option:any) {
        this.vertSelection.mutationCountBy = option.value;
        this.viewLimitValues = true;
    }

    @autobind
    @action
    public onHorizontalAxisMutationCountBySelect(option:any) {
        this.horzSelection.mutationCountBy = option.value;
        this.viewLimitValues = true;
    }

    @autobind
    @action
    private onDiscreteVsDiscretePlotTypeSelect(option:any){
        this.discreteVsDiscretePlotType = option.value;
    }

    @autobind
    @action
    private onSortOrderButtonPressed() {
        this._waterfallPlotSortOrder = this.waterfallPlotSortOrder === "ASC" ? "DESC" : "ASC";
    }

    @autobind
    @action
    private swapHorzVertSelections() {
        const keys:(keyof AxisMenuSelection)[] = ["dataType", "selectedDataSourceOption", "logScale", "mutationCountBy"];
        // have to store all values for swap because values depend on each other in derived data way so the copy can mess up if you do it one by one
        const horz = keys.map(k=>this.horzSelection[k]);
        const vert = keys.map(k=>this.vertSelection[k]);
        for (let i=0; i<keys.length; i++) {
            this.horzSelection[keys[i]] = vert[i];
            this.vertSelection[keys[i]] = horz[i];
        }

        // only swap genes if vertSelection is not set to "Same gene"
        if (!this.vertSelection.selectedGeneOption || (this.vertSelection.selectedGeneOption.value !== SAME_SELECTED_OPTION_NUMERICAL_VALUE)) {
            const horzOption = this.horzSelection.selectedGeneOption;
            const vertOption = this.vertSelection.selectedGeneOption;
            this.horzSelection.selectedGeneOption = vertOption;
            this.vertSelection.selectedGeneOption = horzOption;
        }

        // only swap gene sets if vertSelection is not set to "Same gene set"
        if (!this.vertSelection.selectedGenesetOption || (this.vertSelection.selectedGenesetOption.value !== SAME_SELECTED_OPTION_STRING_VALUE)) {
            const horzOption = this.horzSelection.selectedGenesetOption;
            const vertOption = this.vertSelection.selectedGenesetOption;
            this.horzSelection.selectedGenesetOption = vertOption;
            this.vertSelection.selectedGenesetOption = horzOption;
        }

        // only swap treatments if vertSelection is not set to "Same treatment"
        if (!this.vertSelection.selectedTreatmentOption || (this.vertSelection.selectedTreatmentOption.value !== SAME_SELECTED_OPTION_STRING_VALUE)) {
            const horzOption = this.horzSelection.selectedTreatmentOption;
            const vertOption = this.vertSelection.selectedTreatmentOption;
            this.horzSelection.selectedTreatmentOption = vertOption;
            this.vertSelection.selectedTreatmentOption = horzOption;
        }
    }

    @computed get bothAxesMolecularProfile() {
        return (this.horzSelection.dataType !== CLIN_ATTR_DATA_TYPE && this.horzSelection.dataType !== AlterationTypeConstants.GENERIC_ASSAY) &&
             (this.vertSelection.dataType !== CLIN_ATTR_DATA_TYPE && this.vertSelection.dataType !== AlterationTypeConstants.GENERIC_ASSAY);
    }

    @computed get oneAxisMolecularProfile() {
        return !this.bothAxesMolecularProfile && ((this.horzSelection.dataType !== CLIN_ATTR_DATA_TYPE && this.horzSelection.dataType !== AlterationTypeConstants.GENERIC_ASSAY) ||
             (this.vertSelection.dataType !== CLIN_ATTR_DATA_TYPE && this.vertSelection.dataType !== AlterationTypeConstants.GENERIC_ASSAY));
    }

    @computed get sameGeneInBothAxes() {
        return  this.bothAxesMolecularProfile &&
            (this.horzSelection.entrezGeneId === this.vertSelection.entrezGeneId);
    }

    @computed get cnaDataCanBeShown() {
        return !!(this.cnaDataExists.result
        && (this.potentialViewType === PotentialViewType.MutationTypeAndCopyNumber
            || this.potentialViewType === PotentialViewType.LimitValMutationTypeAndCopyNumber)
        );
    }

    @computed get limitValuesCanBeShown():boolean {
        return this.limitValueTypes.length > 0;
    }

    @computed get limitValueTypes():string[] {
        return _.uniq(this.horzLimitValueTypes.concat(this.vertLimitValueTypes));
    }

    @computed get horzLimitValueTypes():string[] {
        if (this.horzAxisDataPromise.result && this.horzSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY) {
            return getLimitValues(this.horzAxisDataPromise.result.data);
        }
        return [] as string[];
    }

    @computed get horzLimitValuesCanBeShown():boolean {
        return this.horzLimitValueTypes.length > 0;
    }

    @computed get vertLimitValueTypes():string[] {
        if (this.vertAxisDataPromise.result && this.vertSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY) {
            return getLimitValues(this.vertAxisDataPromise.result.data);
        }
        return [] as string[];
    }

    @computed get vertLimitValuesCanBeShown():boolean {
        return this.vertLimitValueTypes.length > 0;
    }

    @computed get legendLimitValueLabel() {
        return `value ${this.limitValueTypes.join(' or ')}${!this.isWaterfallPlot?' **':''}`;
    }

    @computed get vertMenuLimitValueLabel() {
        return `Value ${this.vertLimitValueTypes.join(' or ')} Labels${!this.isWaterfallPlot?' **':''}`;
    }

    @computed get horzMenuLimitValueLabel() {
        return `Value ${this.horzLimitValueTypes.join(' or ')} Labels${!this.isWaterfallPlot?' **':''}`;
    }

    @computed get cnaDataShown() {
        return !!(this.cnaDataExists.result
        && (this.viewType === ViewType.CopyNumber || this.viewType === ViewType.MutationTypeAndCopyNumber
            || this.viewType === ViewType.LimitValCopyNumber || this.viewType === ViewType.LimitValMutationTypeAndCopyNumber
        ));
    }

    readonly cnaPromise = remoteData({
        await:()=>this.props.store.annotatedCnaCache.getAll(
            getCnaQueries(this.horzSelection, this.vertSelection, this.utilitiesMenuSelection)
        ),
        invoke:()=>{
            const queries = getCnaQueries(this.horzSelection, this.vertSelection, this.utilitiesMenuSelection);
            if (queries.length > 0) {
                return Promise.resolve(_.flatten(this.props.store.annotatedCnaCache.getAll(queries).map(p=>p.result!)));
            } else {
                return Promise.resolve([]);
            }
        }
    });

    @computed get mutationDataCanBeShown() {
        return !!(this.mutationDataExists.result && this.potentialViewType !== PotentialViewType.None && this.potentialViewType !== PotentialViewType.LimitVal);
    }

    @computed get mutationDataShown() {
        return !!(this.mutationDataExists.result &&
            (this.viewType === ViewType.MutationType || this.viewType === ViewType.MutationSummary ||
                this.viewType === ViewType.MutationTypeAndCopyNumber));
    }

    readonly mutationPromise = remoteData({
        await:()=>this.props.store.annotatedMutationCache.getAll(
            getMutationQueries(this.horzSelection, this.vertSelection, this.utilitiesMenuSelection)
        ),
        invoke: ()=>{
            return Promise.resolve(_.flatten(this.props.store.annotatedMutationCache.getAll(
                getMutationQueries(this.horzSelection, this.vertSelection, this.utilitiesMenuSelection)
            ).map(p=>p.result!)).filter(x=>!!x));
        }
    });

    @computed get plotDataExistsForTwoAxes() {
        return (this.horzAxisDataPromise.isComplete && this.horzAxisDataPromise.result!.data.length > 0)
            && (this.vertAxisDataPromise.isComplete && this.vertAxisDataPromise.result!.data.length > 0);
    }

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
            this.props.store.genesetMolecularDataCache,
            this.props.store.treatmentMolecularDataCache
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
            this.props.store.genesetMolecularDataCache,
            this.props.store.treatmentMolecularDataCache
        );
    }

    @computed get vertAxisDataHasNegativeNumbers():boolean {
        if (this.vertAxisDataPromise.isComplete && this.vertAxisDataPromise.result) {
            return axisHasNegativeNumbers(this.vertAxisDataPromise.result);
        }
        return false;
    }

    @computed get horzAxisDataHasNegativeNumbers():boolean {
        if (this.horzAxisDataPromise.isComplete && this.horzAxisDataPromise.result) {
            return axisHasNegativeNumbers(this.horzAxisDataPromise.result);
        }
        return false;
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
            this.clinicalAttributeIdToClinicalAttribute,
            this.plotType
        ],
        invoke:()=>{
            return Promise.resolve(getAxisLabel(
                this.horzSelection,
                this.props.store.molecularProfileIdToMolecularProfile.result!,
                this.props.store.entrezGeneIdToGene.result!,
                this.clinicalAttributeIdToClinicalAttribute.result!,
                this.horzLogScaleFunction
            ));
        }
    });

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
                this.clinicalAttributeIdToClinicalAttribute.result!,
                this.vertLogScaleFunction
            ));
        }
    });

    readonly waterfallLabel = remoteData({
        await:()=>[
            this.props.store.molecularProfileIdToMolecularProfile,
            this.props.store.entrezGeneIdToGene,
            this.clinicalAttributeIdToClinicalAttribute,
            this.plotType
        ],
        invoke:()=>{
            const selection = this.isHorizontalWaterfallPlot? this.horzSelection: this.vertSelection;
            const logScaleFunc = this.isHorizontalWaterfallPlot? this.horzLogScaleFunction: this.vertLogScaleFunction;

            return Promise.resolve(getAxisLabel(
                selection,
                this.props.store.molecularProfileIdToMolecularProfile.result!,
                this.props.store.entrezGeneIdToGene.result!,
                this.clinicalAttributeIdToClinicalAttribute.result!,
                logScaleFunc
            ));
        }
    });

    @computed get waterfallPlotTitle():string {

        const selection = this.isHorizontalWaterfallPlot? this.horzSelection: this.vertSelection;

        const treatmentName = selection.selectedTreatmentOption!.label;
        const profileName = selection.selectedDataSourceOption!.label;
        const geneName = this.utilitiesMenuSelection.selectedGeneOption!.label;

        let geneStyle = "";
        if (this.viewMutationType) {
            geneStyle = ` x ${geneName} mutation types`;
        } else if (this.viewCopyNumber) {
            geneStyle = ` x ${geneName} CNA types`;
        }
        return `${treatmentName} ${profileName}${geneStyle}`;
    }

    @computed get waterfallPlotWidth():number {
        const noSamples = this.waterfallPlotData.isComplete ? this.waterfallPlotData.result.data.length : 0;
        if (this.isHorizontalWaterfallPlot) {
            return WATERFALLPLOT_SIDELENGTH;
        }
        return WATERFALLPLOT_BASE_SIDELENGTH + Math.round(noSamples * WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR);
    }

    @computed get waterfallPlotHeigth():number {
        const noSamples = this.waterfallPlotData.isComplete ? this.waterfallPlotData.result.data.length : 0;
        if (this.isHorizontalWaterfallPlot) {
            return WATERFALLPLOT_BASE_SIDELENGTH + Math.round(noSamples * WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR);
        }
        return WATERFALLPLOT_SIDELENGTH;
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
            case ViewType.LimitVal:
            case ViewType.LimitValMutationType:
            case ViewType.LimitValMutationSummary:
            case ViewType.LimitValMutationTypeAndCopyNumber:
                return (d:IPlotSampleData)=>this.scatterPlotAppearance(d).fill!;
            case ViewType.None:
                return mutationSummaryToAppearance[MutationSummary.Neither].fill;
        }
    }

    @computed get scatterPlotFillOpacity() {
        if (this.viewType === ViewType.CopyNumber
            || this.viewType === ViewType.LimitValCopyNumber) {
            return 0;
        } else {
            return 1;
        }
    }

    @autobind
    private scatterPlotStroke(d:IPlotSampleData) {
        return this.scatterPlotAppearance(d).stroke;
    }

    @computed get scatterPlotStrokeWidth() {
        if (this.viewType === ViewType.CopyNumber
            || this.viewType === ViewType.MutationTypeAndCopyNumber
            || this.viewType === ViewType.LimitValCopyNumber
            || this.viewType === ViewType.LimitValMutationTypeAndCopyNumber) {
            return CNA_STROKE_WIDTH;
        } else {
            return 1;
        }
    }

    @autobind
    private scatterPlotStrokeOpacity(d:IPlotSampleData) {
        return this.scatterPlotAppearance(d).strokeOpacity;
    }

    @autobind
    private scatterPlotSymbol(d:IPlotSampleData) {
        return this.scatterPlotAppearance(d).symbol || "circle";
    }

    @autobind
    private waterfallPlotColor(d:IPlotSampleData) {
        // With the waterfall plot coloring for mutation type
        // and copy number are mutually exclusive. Therefore,
        // combined viewTypes (such as MutationTypeAndCopyNumber)
        // do not exist for this plot type and are not evaluated.
        switch (this.viewType) {
            case ViewType.CopyNumber:
            case ViewType.LimitValCopyNumber:
                return this.scatterPlotStroke(d);
            case ViewType.MutationType:
            case ViewType.MutationSummary:
            case ViewType.LimitValMutationType:
            case ViewType.LimitValMutationSummary:
                return this.scatterPlotAppearance(d).fill!;
            case ViewType.LimitVal:
            case ViewType.None:
            default:
                return mutationSummaryToAppearance[MutationSummary.Neither].fill;
        }
    }

    @autobind
    private waterfallPlotLimitValueSymbolVisibility(d:IPlotSampleData) {
        switch (this.viewType) {
            case ViewType.LimitVal:
            case ViewType.LimitValMutationType:
            case ViewType.LimitValMutationSummary:
            case ViewType.LimitValCopyNumber:
            case ViewType.LimitValMutationTypeAndCopyNumber:
                return dataPointIsLimited(d);
            default:
                return false;
        }
    }

    @autobind
    private scatterPlotTooltip(d:IScatterPlotData) {
        return scatterPlotTooltip(d);
    }

    @autobind
    private waterfallPlotTooltip(d:IWaterfallPlotData) {
        return waterfallPlotTooltip(d);
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

    @computed get searchMutationWords() {
        return this.searchMutation.trim().split(/\s+/g).filter((m:string) => !!m.length);
    }

    @computed get scatterPlotHighlight() {
        const searchCaseWords = this.searchCase.trim().split(/\s+/g);
        const searchMutationWords = this.searchMutationWords;

        // need to regenerate the function whenever these change in order to trigger immediate Victory rerender
        return (d:IPlotSampleData)=>{
            let caseMatch = false;
            for (const word of searchCaseWords) {
                caseMatch = caseMatch || (!!word.length && (d.sampleId.indexOf(word) > -1));
                if (caseMatch) {
                    break;
                }
            }
            let mutationMatch = false;
            for (const word of searchMutationWords) {
                mutationMatch = mutationMatch || this.fDatumHasMutation(d, word);
                if (mutationMatch) {
                    break;
                }
            }
            return caseMatch || mutationMatch;
        };
    }

    private fDatumHasMutation = (d:any, mutation:string) => {
        const mutationFound = !!mutation && !!d.mutations.find((m:any)=>!!(m.proteinChange && (m.proteinChange.indexOf(mutation) > -1)));
        return mutationFound;
    }

    @computed get showMutationNotFoundMessage():boolean {
        let showMessage = false;
        if (this.searchMutationWords.length > 0 && this.waterfallPlotIsShown && this.waterfallPlotData.isComplete) {
            showMessage = true;
            _.each(this.searchMutationWords, (word:string) => {
                const dataPoints = this.waterfallPlotData.result!.data;
                if (_.some(dataPoints, (d:any) => this.fDatumHasMutation(d, word))) {
                    showMessage = false;
                }
            });
        }
        return showMessage;
    }

    isDisabledAxisLogCheckbox(vertical:boolean):boolean {
        return vertical ? this.vertAxisDataHasNegativeNumbers : this.horzAxisDataHasNegativeNumbers;
    }

    private getAxisMenu(
        vertical:boolean,
        dataTypeOptions:{value:string, label:string}[],
        dataSourceOptionsByType:{[type:string]:{value:string, label:string}[]}
    ) {
        const axisSelection = vertical ? this.vertSelection : this.horzSelection;
        if (
            (axisSelection.dataType === CLIN_ATTR_DATA_TYPE && !this.clinicalAttributeIdToClinicalAttribute.isComplete) ||
            (axisSelection.dataType !== CLIN_ATTR_DATA_TYPE && axisSelection.dataType !== AlterationTypeConstants.MUTATION_EXTENDED &&
                !this.props.store.molecularProfileIdToMolecularProfile.isComplete)
        ) {
            return <LoadingIndicator isLoading={true}/>;
        }

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

        let dataSourceDescription:string = "";
        if (dataSourceValue && axisSelection.dataType !== AlterationTypeConstants.MUTATION_EXTENDED) {
            if (axisSelection.dataType === CLIN_ATTR_DATA_TYPE) {
                dataSourceDescription = this.clinicalAttributeIdToClinicalAttribute.result![dataSourceValue].description;
            } else {
                dataSourceDescription = this.props.store.molecularProfileIdToMolecularProfile.result![dataSourceValue].description;
            }
        }

        let dataTypeDescription:string = "";
        if (axisSelection.dataType === NONE_SELECTED_OPTION_STRING_VALUE) {
            const otherDataSourceId = vertical ? this.horzSelection.dataSourceId : this.vertSelection.dataSourceId;
            const otherProfileName = this.props.store.molecularProfileIdToMolecularProfile.result![otherDataSourceId!].name;
            dataTypeDescription = `Sample order determined by values on the '${otherProfileName}' axis`;
        }

        return (
            <form className="main-form">
                <h4 className="tab-title">{vertical ? "Vertical" : "Horizontal"} Axis</h4>
                <div>
                    <div style={{marginBottom:"5px"}} className="form-group">
                        <label className="label-text">Data Type</label>
                        <div style={{display:"flex", alignItems:"center"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-profile-type-selector`}
                                value={axisSelection.dataType}
                                onChange={vertical ? this.onVerticalAxisDataTypeSelect : this.onHorizontalAxisDataTypeSelect}
                                options={this.horzDatatypeOptions && this.vertDatatypeOptions? (vertical ? this.vertDatatypeOptions : this.horzDatatypeOptions): []}
                                clearable={false}
                                searchable={false}
                            />
                            { dataTypeDescription && (
                                <InfoIcon
                                    tooltip={<span>{dataTypeDescription}</span>}
                                    tooltipPlacement="right"
                                    style={{marginLeft:7}}
                                />
                            )}
                        </div>
                    </div>
                    { this.showSortOrderButton(!vertical) && (
                        <div className="checkbox">
                            <label>
                                <Button
                                    className="btn btn-default sort-order"
                                    data-test="changeSortOrderButton"
                                    type="button"
                                    onClick={this.onSortOrderButtonPressed}>
                                    <i className={this.sortOrderImageClassName} />
                                </Button>
                                Sort Order
                            </label>
                        </div>)}
                    {(axisSelection.dataType && this.showDatasourceBox(axisSelection.dataType)) && (
                    <div style={{marginBottom:"5px"}} className="form-group">
                        <label className="label-text">{dataSourceLabel}</label>
                        <div style={{display:"flex", alignItems:"center"}}>
                            <ReactSelect
                                className="data-source-id"
                                name={`${vertical ? "v" : "h"}-profile-name-selector`}
                                value={dataSourceValue}
                                onChange={onDataSourceChange}
                                options={dataSourceOptions}
                                clearable={false}
                                searchable={true}
                            />
                            { dataSourceDescription && (
                                <InfoIcon
                                    tooltip={<span>{dataSourceDescription}</span>}
                                    tooltipPlacement="right"
                                    style={{marginLeft:7}}
                                />
                            )}
                        </div>
                    </div>
                    )}
                    { logScalePossible(axisSelection) && (
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test={`${dataTestWhichAxis}LogCheckbox`}
                                    type="checkbox"
                                    name={vertical ? "vert_logScale" : "vert_logScale"}
                                    value={vertical ? EventKey.vert_logScale : EventKey.horz_logScale}
                                    checked={axisSelection.logScale && ! this.isDisabledAxisLogCheckbox(vertical)}
                                    disabled={this.isDisabledAxisLogCheckbox(vertical)}
                                    onClick={this.onInputClick}
                                />
                                Log Scale
                            </label>
                        </div>
                    )}
                    {((vertical && this.vertLimitValuesCanBeShown) || (!vertical && this.horzLimitValuesCanBeShown)) && (
                        <div className="checkbox color-samples-toolbar-elt">
                            <label className="limit-value-label">
                                <input
                                    data-test="ViewLimitValues"
                                    type="checkbox"
                                    name="utilities_viewLimitValues"
                                    value={EventKey.utilities_viewLimitValues}
                                    checked={this.viewLimitValues}
                                    onClick={this.onInputClick}
                                    disabled={(vertical && !this.vertLimitValuesCanBeShown) || (!vertical && !this.horzLimitValuesCanBeShown)}
                                />{vertical? this.vertMenuLimitValueLabel : this.horzMenuLimitValueLabel}
                            </label>
                        </div>
                    )}
                    {(axisSelection.dataType && this.showGeneSelectBox(axisSelection.dataType))
                        && (<div className="form-group" style={{display:(axisSelection.dataType === CLIN_ATTR_DATA_TYPE ? 'none' : 'block')}}>
                        <label>Gene</label>
                        <div style={{display:"flex"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-gene-selector`}
                                value={axisSelection.selectedGeneOption ? axisSelection.selectedGeneOption.value : undefined}
                                onChange={vertical ? this.onVerticalAxisGeneSelect : this.onHorizontalAxisGeneSelect}
                                isLoading={this.horzGeneOptions.isPending}
                                options={this.vertGeneOptions && this.horzGeneOptions? (vertical ? this.vertGeneOptions : this.horzGeneOptions.result): []}
                                clearable={false}
                                searchable={false}
                                disabled={axisSelection.dataType === CLIN_ATTR_DATA_TYPE || axisSelection.dataType === GENESET_DATA_TYPE}
                            />
                        </div>
                    </div>)}
                    {(axisSelection.dataType && this.showGenesetSelectBox(axisSelection.dataType))
                        && (<div className="form-group" style={{opacity:1}}>
                        <label>Gene Set</label>
                        <div style={{display:"flex"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-geneset-selector`}
                                value={axisSelection.selectedGenesetOption ? axisSelection.selectedGenesetOption.value : undefined}
                                onChange={vertical ? this.onVerticalAxisGenesetSelect : this.onHorizontalAxisGenesetSelect}
                                isLoading={this.horzGenesetOptions.isPending}
                                options={this.vertGenesetOptions && this.horzGenesetOptions? (vertical ? this.vertGenesetOptions : this.horzGenesetOptions.result): []}
                                clearable={false}
                                searchable={false}
                                disabled={axisSelection.dataType !== GENESET_DATA_TYPE}
                            />
                        </div>
                    </div>)}
                    {(axisSelection.dataType && this.showTreatmentSelectBox(axisSelection.dataType))
                        && (<div className="form-group" style={{opacity:1}}>
                        <label>Treatment</label>
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <ReactSelect
                                name={`${vertical ? "v" : "h"}-treatment-selector`}
                                value={axisSelection.selectedTreatmentOption ? axisSelection.selectedTreatmentOption.value : undefined}
                                onChange={vertical ? this.onVerticalAxisTreatmentSelect : this.onHorizontalAxisTreatmentSelect}
                                isLoading={this.horzTreatmentOptions.isPending}
                                options={this.vertTreatmentOptions && this.horzTreatmentOptions? (vertical ? this.vertTreatmentOptions : this.horzTreatmentOptions.result): []}
                                clearable={false}
                                searchable={false}
                                disabled={axisSelection.dataType === CLIN_ATTR_DATA_TYPE || axisSelection.dataType !== AlterationTypeConstants.GENERIC_ASSAY}
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
        const showStackedBarHorizontalOption = showDiscreteVsDiscreteOption && this.discreteVsDiscretePlotType !== DiscreteVsDiscretePlotType.Table;
        const showSampleColoringOptions = this.mutationDataCanBeShown || this.cnaDataCanBeShown;
        const showRegression = this.plotType.isComplete && this.plotType.result === PlotType.ScatterPlot;
        if (!showSearchOptions && !showSampleColoringOptions && !showDiscreteVsDiscreteOption && !showStackedBarHorizontalOption && !showRegression) {
            return <span></span>;
        }
        return (
            <div style={{marginTop:10}}>
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
                            {this.showMutationNotFoundMessage && (<span className="mutation-message">Mutation not found for selected gene</span>)}
                            </div>
                        )}
                    </div>)}
                    {showDiscreteVsDiscreteOption && (
                        <div className="form-group">
                            <label>Plot Type</label>
                            <div style={{ display: "flex"}}>
                                <ReactSelect
                                    name="discrete-vs-discrete-plot-type"
                                    value={this.discreteVsDiscretePlotType}
                                    onChange={this.onDiscreteVsDiscretePlotTypeSelect}
                                    options={discreteVsDiscretePlotTypeOptions}
                                    clearable={false}
                                    searchable={true}
                                />
                            </div>
                        </div>
                    )}
                    {showStackedBarHorizontalOption && (
                        <div className="checkbox"><label>
                            <input
                                data-test="horizontalBars"
                                type="checkbox"
                                name="utilities_horizontalBars"
                                value={EventKey.utilities_horizontalBars}
                                checked={this.horizontalBars}
                                onClick={this.onInputClick}
                            /> Horizontal Bars
                        </label></div>
                    )}
                    {showRegression && (
                        <div className="checkbox" style={{marginTop:14}}><label>
                            <input
                                data-test="ShowRegressionline"
                                type="checkbox"
                                name="utilities_showRegressionLine"
                                value={EventKey.utilities_showRegressionLine}
                                checked={this.showRegressionLine}
                                onClick={this.onInputClick}
                            /> Show Regression Line
                        </label></div>
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
                <div className={"swapAxes"}>
                    <button className="btn btn-link btn-xs" data-test="swapHorzVertButton" onClick={this.swapHorzVertSelections}><i className="fa fa-arrow-up"></i> Swap Axes <i className="fa fa-arrow-down"></i></button>
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
            const horzAxisNoneSelected = this.horzSelection.dataType === NONE_SELECTED_OPTION_STRING_VALUE;
            const vertAxisNoneSelected = this.vertSelection.dataType === NONE_SELECTED_OPTION_STRING_VALUE;

            if (!horzAxisData || !vertAxisData) {
                return new Promise<PlotType>(()=>0); // dont resolve
            }

            if ((vertAxisNoneSelected && horzAxisData)
                || (horzAxisNoneSelected && vertAxisData)) {
                return Promise.resolve(PlotType.WaterfallPlot);
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

    // In case we want to handle samples differently
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
                        this.cnaDataExists.result ? {
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

    readonly waterfallPlotData = remoteData<{data:IWaterfallPlotData[]}>({
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

            if (!horzAxisData && !vertAxisData) {
                return new Promise<{horizontal:boolean, data:IWaterfallPlotData[]}>(()=>0); // dont resolve
            } else {
                const axisData = this.isHorizontalWaterfallPlot? horzAxisData : vertAxisData;

                // Note: for treatment profiles the identity of the selected gene is not
                // naturally embedded in the genetic profile. Instead, the user selects
                // the gene of interest from a select box in the Utilities menu.
                const ensemblGeneId = this.utilitiesMenuSelection.selectedGeneOption!.value;
                const selectedGene = this.props.store.entrezGeneIdToGene.result![ensemblGeneId];

                if (isNumberData(axisData!)) {
                    return Promise.resolve({
                        data: makeWaterfallPlotData(
                                axisData as INumberAxisData,
                                this.props.store.sampleKeyToSample.result!,
                                this.props.store.coverageInformation.result!.samples,
                                selectedGene,
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
                } else {
                    return Promise.resolve({data: []});
                }
            }
        }

    });

    @computed get waterfallPlotPivotThreshold():number {
        const dataSourceId:string|undefined = this.isHorizontalWaterfallPlot ? this.horzSelection.dataSourceId! : this.vertSelection.dataSourceId!;
        const profile = this.props.store.molecularProfileIdToMolecularProfile.result![dataSourceId];
        return profile.pivotThreshold;
    }

    @computed get waterfallPlotSortOrder():string {
        if (this._waterfallPlotSortOrder === undefined && this.isWaterfallPlot) {
            const dataSourceId = this.horzSelection.dataSourceId || this.vertSelection.dataSourceId;
            return this.props.store.molecularProfileIdToMolecularProfile.result![dataSourceId!].sortOrder;
        }
        return this._waterfallPlotSortOrder!;
    }

    @computed get isHorizontalWaterfallPlot():boolean {
        return this.isWaterfallPlot && !!(this.vertAxisDataPromise.result) && this.vertAxisDataPromise.result['datatype'] === NONE_SELECTED_OPTION_STRING_VALUE;
    }

    @computed get isWaterfallPlot():boolean {
        return !!(this.plotType.result) && this.plotType.result === PlotType.WaterfallPlot;
    }

    @computed get sortOrderImageClassName():string {
        const baseClass = "fa fa-signal";
        const axisClass =  this.isHorizontalWaterfallPlot ? "horz" : "vert";
        const sortClass =  (!this.isHorizontalWaterfallPlot && this.waterfallPlotSortOrder === "ASC") || (this.isHorizontalWaterfallPlot && this.waterfallPlotSortOrder === "DESC")? "ascending" : "descending";
        return `${baseClass} ${axisClass}-${sortClass}`;
    }

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
                        this.cnaDataExists.result ? {
                            molecularProfileIds: _.values(this.props.store.studyToMolecularProfileDiscrete.result!).map(p=>p.molecularProfileId),
                            data: this.cnaPromise.result!
                        }: undefined
                    )
                });
            }
        },
    });

    @computed get zIndexSortBy() {
        return scatterPlotZIndexSortBy<IPlotSampleData>(
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

    @computed get horzLogScaleFunction():IAxisLogScaleParams|undefined {
        return makeAxisLogScaleFunction(this.horzSelection);
    }

    @computed get vertLogScaleFunction():IAxisLogScaleParams|undefined {
        return makeAxisLogScaleFunction(this.vertSelection);
    }

    @computed get showNoTreamentsSelectedWarning() {
        return ( (this.vertSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY || this.horzSelection.dataType === AlterationTypeConstants.GENERIC_ASSAY)
                  && this.vertTreatmentOptions.length === 0);
    }

    @computed get plot() {
        const promises = [this.plotType, this.horzAxisDataPromise, this.vertAxisDataPromise, this.horzLabel, this.vertLabel];
        const groupStatus = getMobxPromiseGroupStatus(...promises);
        const isPercentage = this.discreteVsDiscretePlotType === DiscreteVsDiscretePlotType.PercentageStackedBar;
        const isStacked = isPercentage || this.discreteVsDiscretePlotType === DiscreteVsDiscretePlotType.StackedBar;


        if (this.showNoTreamentsSelectedWarning) {
            return (
                <div>
                    <i className="fa fa-exclamation-triangle text-danger" />&nbsp;
                    <span>To visualize treatment response data, you must first visit the OncoPrint tab and use the "Heatmap" menu to add treatment response tracks to the OncoPrint. Any treatments added to the OncoPrint will then be available on this tab for visualization.</span>
                </div>
            )
        }

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
                                <MultipleCategoryBarPlot
                                    svgId={SVG_ID}
                                    horzData={(this.horzAxisDataPromise.result! as IStringAxisData).data}
                                    vertData={(this.vertAxisDataPromise.result! as IStringAxisData).data}
                                    categoryToColor={RESERVED_CLINICAL_VALUE_COLORS}
                                    horzCategoryOrder={(this.horzAxisDataPromise.result! as IStringAxisData).categoryOrder}
                                    vertCategoryOrder={(this.vertAxisDataPromise.result! as IStringAxisData).categoryOrder}
                                    barWidth={20}
                                    domainPadding={20}
                                    chartBase={PLOT_SIDELENGTH}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    legendLocationWidthThreshold={LEGEND_TO_BOTTOM_WIDTH_THRESHOLD}
                                    horizontalBars={this.horizontalBars}
                                    percentage={isPercentage}
                                    stacked={isStacked}
                                />
                            );
                        }
                        break;
                    case PlotType.ScatterPlot:
                        if (this.scatterPlotData.isComplete) {
                            plotElt = (
                                <PlotsTabScatterPlot
                                    svgId={SVG_ID}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    data={this.scatterPlotData.result}
                                    size={scatterPlotSize}
                                    chartWidth={PLOT_SIDELENGTH}
                                    chartHeight={PLOT_SIDELENGTH}
                                    tooltip={this.scatterPlotTooltip}
                                    highlight={this.scatterPlotHighlight}
                                    showRegressionLine={this.showRegressionLine}
                                    logX={this.horzLogScaleFunction}
                                    logY={this.vertLogScaleFunction}
                                    fill={this.scatterPlotFill}
                                    stroke={this.scatterPlotStroke}
                                    strokeOpacity={this.scatterPlotStrokeOpacity}
                                    zIndexSortBy={this.zIndexSortBy}
                                    symbol={this.scatterPlotSymbol}
                                    fillOpacity={this.scatterPlotFillOpacity}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    useLogSpaceTicks={true}
                                    excludeLimitValuesFromCorrelation={this.limitValuesCanBeShown && this.viewLimitValues}
                                    legendData={scatterPlotLegendData(
                                        this.scatterPlotData.result, this.viewType, PlotType.ScatterPlot, this.mutationDataExists, this.cnaDataExists, this.props.store.driverAnnotationSettings.driversAnnotated, this.limitValueTypes, this.scatterPlotHighlight
                                    )}
                                />
                            );
                            break;
                        } else if (this.scatterPlotData.isError) {
                            return <span>Error loading plot data.</span>;
                        } else {
                            return <LoadingIndicator isLoading={true} center={true} size={"big"}/>;
                        }
                    case PlotType.WaterfallPlot:
                        if (this.waterfallPlotData.isComplete) {
                            const horizontal = this.isHorizontalWaterfallPlot;
                            plotElt = (
                                <PlotsTabWaterfallPlot
                                    svgId={SVG_ID}
                                    title={this.waterfallPlotTitle}
                                    axisLabel={this.waterfallLabel.result!}
                                    data={this.waterfallPlotData.result.data}
                                    size={scatterPlotSize}
                                    chartWidth={this.waterfallPlotWidth}
                                    chartHeight={this.waterfallPlotHeigth}
                                    tooltip={this.waterfallPlotTooltip}
                                    highlight={this.scatterPlotHighlight}
                                    log={horizontal ? this.horzLogScaleFunction : this.vertLogScaleFunction}
                                    horizontal={horizontal}
                                    fill={this.waterfallPlotColor}
                                    fillOpacity={1}
                                    stroke={this.waterfallPlotColor}
                                    strokeOpacity={1}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    symbol={this.scatterPlotSymbol}
                                    labelVisibility={this.waterfallPlotLimitValueSymbolVisibility}
                                    zIndexSortBy={this.zIndexSortBy}
                                    useLogSpaceTicks={true}
                                    legendLocationWidthThreshold={LEGEND_TO_BOTTOM_WIDTH_THRESHOLD}
                                    sortOrder={this.waterfallPlotSortOrder}
                                    pivotThreshold={this.waterfallPlotPivotThreshold}
                                    legendData={scatterPlotLegendData(
                                        this.waterfallPlotData.result.data, this.viewType, PlotType.WaterfallPlot, this.mutationDataExists, this.cnaDataExists, this.props.store.driverAnnotationSettings.driversAnnotated, this.limitValueTypes, this.scatterPlotHighlight
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
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    data={this.boxPlotData.result.data}
                                    chartBase={550}
                                    scatterPlotTooltip={this.boxPlotTooltip}
                                    highlight={this.scatterPlotHighlight}
                                    horizontal={horizontal}
                                    logScale={horizontal ? this.horzLogScaleFunction : this.vertLogScaleFunction}
                                    size={scatterPlotSize}
                                    fill={this.scatterPlotFill}
                                    stroke={this.scatterPlotStroke}
                                    strokeOpacity={this.scatterPlotStrokeOpacity}
                                    zIndexSortBy={this.zIndexSortBy}
                                    symbol={this.scatterPlotSymbol}
                                    fillOpacity={this.scatterPlotFillOpacity}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    useLogSpaceTicks={true}
                                    excludeLimitValuesFromBoxPlot={this.limitValuesCanBeShown && this.viewLimitValues}
                                    legendData={scatterPlotLegendData(
                                        _.flatten(this.boxPlotData.result.data.map(d=>d.data)), this.viewType, PlotType.BoxPlot, this.mutationDataExists, this.cnaDataExists, this.props.store.driverAnnotationSettings.driversAnnotated, this.limitValueTypes, this.scatterPlotHighlight
                                    )}
                                    legendLocationWidthThreshold={LEGEND_TO_BOTTOM_WIDTH_THRESHOLD}
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
                const geneSelectShownClassName = this.isWaterfallPlot? 'gene-select-shown':'';
                return (
                    <div>
                        <div data-test="PlotsTabPlotDiv" className="borderedChart posRelative">
                            <ScrollBar style={{position:'relative', top:-5}} getScrollEl={this.getScrollPane} />
                                {((this.plotDataExistsForTwoAxes || this.waterfallPlotIsShown) && (this.mutationDataCanBeShown || this.cnaDataCanBeShown)) && (
                                    <div style={{textAlign:"left", position:"relative", zIndex:1, marginTop:"-6px", marginBottom: this.isWaterfallPlot?"9px":"-16px", minWidth: this.mutationDataCanBeShown && this.cnaDataCanBeShown ? 600 : 0}}>
                                        <div style={{display:"inline-block", position: "relative"}} className="utilities-menu">
                                            <label className="legend-label">Style samples by:</label>
                                            &nbsp;
                                            <div style={{display:"inline-block"}} className={`gene-select-background ${geneSelectShownClassName}`}>
                                                {this.isWaterfallPlot && (
                                                    <div className="checkbox gene-select-container">
                                                        <label>Gene:</label>
                                                        &nbsp;
                                                        <ReactSelect
                                                            className={'color-samples-toolbar-elt gene-select'}
                                                            name={`utilities_geneSelectionBox`}
                                                            value={this.utilitiesMenuSelection.selectedGeneOption ? this.utilitiesMenuSelection.selectedGeneOption.value : undefined}
                                                            onChange={this.onUtilitiesGeneSelect}
                                                            isLoading={this.horzGeneOptions.isPending}
                                                            options={this.utilityMenuGeneOptions}
                                                            clearable={false}
                                                            searchable={false}
                                                            disabled={!this.mutationDataExists.isComplete || !this.mutationDataExists.result}
                                                            />
                                                    </div>
                                                )}
                                                {this.mutationDataCanBeShown && (
                                                    <div className={`checkbox color-samples-toolbar-elt`}><label>
                                                        <input
                                                            data-test="ViewMutationType"
                                                            type={this.plotType.result === PlotType.WaterfallPlot? "radio": "checkbox"}                                                name="utilities_viewMutationType"
                                                            value={EventKey.utilities_viewMutationType}
                                                            checked={this.viewMutationType}
                                                            onClick={this.onInputClick}
                                                            disabled={!this.mutationDataExists.isComplete || !this.mutationDataExists.result}
                                                        />Mutation Type *
                                                    </label></div>
                                                )}
                                                {this.cnaDataCanBeShown && (
                                                    <div className="checkbox color-samples-toolbar-elt"><label>
                                                        <input
                                                            data-test="ViewCopyNumber"
                                                            type={this.plotType.result === PlotType.WaterfallPlot? "radio": "checkbox"}                                                name="utilities_viewCopyNumber"
                                                            value={EventKey.utilities_viewCopyNumber}
                                                            checked={this.viewCopyNumber}
                                                            onClick={this.onInputClick}
                                                            disabled={!this.cnaDataExists.isComplete || !this.cnaDataExists.result}
                                                        />Copy Number Alteration
                                                    </label></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                    type='button'
                                />
                            )}
                            <div ref={this.assignScrollPaneRef} style={{position:"relative", display:"inline-block"}}>
                                {plotElt}
                            </div>
                        </div>
                        {this.mutationDataCanBeShown && (
                            <div style={{marginTop:5}}>* Driver annotation settings are located in the Mutation Color menu of the Oncoprint.</div>
                        )}
                        {this.limitValuesCanBeShown && this.plotType.result === PlotType.ScatterPlot && (
                            <div style={{marginTop:5}}>
                                <div>** Labeling of threshold values (e.g. >8.00) excludes threshold values from correlation coefficient calculation.</div>
                            </div>
                            )}
                        {this.limitValuesCanBeShown && this.plotType.result === PlotType.BoxPlot && (
                            <div style={{marginTop:5}}>
                                <div>** Labeling of threshold values (e.g. >8.00) excludes threshold values from box plot calculation.</div>
                            </div>
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
                    <AlterationFilterWarning store={this.props.store} isUnaffected={true}/>
                </div>
                <div className={"plotsTab"}>
                    <div className="quickPlotsContainer">
                        <strong className="quickPlotsTitle">Examples: </strong>
                        {this.quickPlotButtons}
                    </div>
                    <div style={{display:"flex"}}>
                    <div className="leftColumn">
                        { (this.dataTypeOptions.isComplete &&
                            this.dataTypeToDataSourceOptions.isComplete) ? (
                            <Observer>
                                {this.controls}
                            </Observer>
                        ) : <LoadingIndicator isLoading={true} center={true} size={"big"}/> }
                    </div>
                    <div className="chartWrapper">
                        {this.plot}
                    </div></div>
                </div>
            </div>
        );
    }
}
