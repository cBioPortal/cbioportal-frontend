import * as React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';
import _ from 'lodash';
import {
    ChartControls,
    ChartHeader,
} from 'pages/studyView/chartHeader/ChartHeader';
import {
    StudyViewPageStore,
    SurvivalType,
} from 'pages/studyView/StudyViewPageStore';
import { ClinicalDataBin, StudyViewFilter } from 'cbioportal-ts-api-client';
import PieChart from 'pages/studyView/charts/pieChart/PieChart';
import classnames from 'classnames';
import ClinicalTable from 'pages/studyView/table/ClinicalTable';
import MobxPromise from 'mobxpromise';
import SurvivalChart, {
    LegendLocation,
} from '../../resultsView/survival/SurvivalChart';

import autobind from 'autobind-decorator';
import BarChart from './barChart/BarChart';
import {
    ChartMeta,
    ChartType,
    ClinicalDataCountSummary,
    getHeightByDimension,
    getTableHeightByDimension,
    getWidthByDimension,
    mutationCountVsCnaTooltip,
    MutationCountVsCnaYBinsMin,
    SpecialChartsUniqueKeyEnum,
    NumericalGroupComparisonType,
} from '../StudyViewUtils';
import { GenePanel } from 'cbioportal-ts-api-client';
import { makeSurvivalChartData } from './survival/StudyViewSurvivalUtils';
import StudyViewDensityScatterPlot from './scatterPlot/StudyViewDensityScatterPlot';
import {
    ChartDimension,
    ChartTypeEnum,
    STUDY_VIEW_CONFIG,
} from '../StudyViewConfig';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { DataType, DownloadControlsButton } from 'cbioportal-frontend-commons';
import { MAX_GROUPS_IN_SESSION } from '../../groupComparison/GroupComparisonUtils';
import { Modal } from 'react-bootstrap';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import WindowStore from 'shared/components/window/WindowStore';
import Timer = NodeJS.Timer;
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    MultiSelectionTableColumnKey,
    MultiSelectionTable,
} from 'pages/studyView/table/MultiSelectionTable';
import { FreqColumnTypeEnum } from '../TableUtils';
import { Dimensions } from 'react-virtualized';
import {
    SampleTreatmentsTable,
    SampleTreatmentsTableColumnKey,
} from '../table/treatments/SampleTreatmentsTable';
import { TreatmentTableType } from '../table/treatments/treatmentsTableUtil';
import {
    PatientTreatmentsTableColumnKey,
    PatientTreatmentsTable,
} from '../table/treatments/PatientTreatmentsTable';

export interface AbstractChart {
    toSVGDOMNode: () => Element;
}

export type ChartDownloadType = 'TSV' | 'SVG' | 'PDF' | 'PNG';

export interface IChartContainerDownloadProps {
    type: ChartDownloadType;
    initDownload?: () => Promise<string>;
}

const COMPARISON_CHART_TYPES: ChartType[] = [
    ChartTypeEnum.PIE_CHART,
    ChartTypeEnum.TABLE,
    ChartTypeEnum.BAR_CHART,
    ChartTypeEnum.MUTATED_GENES_TABLE,
    ChartTypeEnum.SAMPLE_TREATMENTS_TABLE,
    ChartTypeEnum.PATIENT_TREATMENTS_TABLE,
];

export interface IChartContainerProps {
    chartMeta: ChartMeta;
    chartType: ChartType;
    store: StudyViewPageStore;
    dimension: ChartDimension;
    title: string;
    description?: ISurvivalDescription;
    promise: MobxPromise<any>;
    filters: any;
    studyViewFilters: StudyViewFilter;
    setComparisonConfirmationModal: StudyViewPageStore['setComparisonConfirmationModal'];
    onValueSelection?: any;
    onDataBinSelection?: any;
    getData?:
        | ((dataType?: DataType) => Promise<string | null>)
        | ((dataType?: DataType) => string);
    downloadTypes?: DownloadControlsButton[];
    onResetSelection?: any;
    onDeleteChart: (chartMeta: ChartMeta) => void;
    onChangeChartType: (chartMeta: ChartMeta, newChartType: ChartType) => void;
    onToggleLogScale?: any;
    logScaleChecked?: boolean;
    showLogScaleToggle?: boolean;
    selectedGenes?: any;
    cancerGenes: number[];
    onGeneSelect?: any;
    isNewlyAdded: (uniqueKey: string) => boolean;
    cancerGeneFilterEnabled: boolean;
    filterByCancerGenes?: boolean;
    onChangeCancerGeneFilter?: (filtered: boolean) => void;
    analysisGroupsSettings: StudyViewPageStore['analysisGroupsSettings'];
    patientToAnalysisGroup?: MobxPromise<{
        [uniquePatientKey: string]: string;
    }>;
    sampleToAnalysisGroup?: MobxPromise<{ [uniqueSampleKey: string]: string }>;
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
}

@observer
export class ChartContainer extends React.Component<IChartContainerProps, {}> {
    private chartHeaderHeight = 20;

    private handlers: any;
    private plot: AbstractChart;

    private mouseLeaveTimeout: Timer;

    @observable mouseInChart: boolean = false;
    @observable placement: 'left' | 'right' = 'right';
    @observable chartType: ChartType;

    @observable newlyAdded = false;
    @observable private selectedRowsKeys: string[] = [];

    constructor(props: IChartContainerProps) {
        super(props);

        this.chartType = this.props.chartType;

        this.handlers = {
            ref: (plot: AbstractChart) => {
                this.plot = plot;
            },
            resetFilters: action(() => {
                this.props.onResetSelection(this.props.chartMeta, []);
            }),
            onValueSelection: action((values: any) => {
                this.props.onValueSelection(this.props.chartMeta, values);
            }),
            onChangeSelectedRows: action((values: string[]) => {
                this.selectedRowsKeys = values;
            }),
            onDataBinSelection: action((dataBins: ClinicalDataBin[]) => {
                this.props.onDataBinSelection(this.props.chartMeta, dataBins);
            }),
            onToggleLogScale: action(() => {
                if (this.props.onToggleLogScale) {
                    this.props.onToggleLogScale(this.props.chartMeta);
                }
            }),
            onMouseEnterChart: action((event: React.MouseEvent<any>) => {
                if (this.mouseLeaveTimeout) {
                    clearTimeout(this.mouseLeaveTimeout);
                }
                this.placement =
                    event.nativeEvent.x > WindowStore.size.width - 400
                        ? 'left'
                        : 'right';
                this.mouseInChart = true;
            }),
            onMouseLeaveChart: action(() => {
                this.mouseLeaveTimeout = setTimeout(() => {
                    this.placement = 'right';
                    this.mouseInChart = false;
                }, 100);
            }),
            defaultDownload: {
                SVG: () =>
                    Promise.resolve(
                        new XMLSerializer().serializeToString(
                            this.toSVGDOMNode()
                        )
                    ),
                PNG: () => Promise.resolve(this.toSVGDOMNode()),
                PDF: () => Promise.resolve(this.toSVGDOMNode()),
            },
            onChangeChartType: (newChartType: ChartType) => {
                this.mouseInChart = false;
                this.props.onChangeChartType(
                    this.props.chartMeta,
                    newChartType
                );
            },
            onDeleteChart: () => {
                this.props.onDeleteChart(this.props.chartMeta);
            },
        };
    }

    public toSVGDOMNode(): SVGElement {
        if (this.plot) {
            // Get result of plot
            return this.plot.toSVGDOMNode() as SVGElement;
        } else {
            return document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
        }
    }

    @computed
    get chartControls(): ChartControls {
        let controls: Partial<ChartControls> = {};
        switch (this.chartType) {
            case ChartTypeEnum.BAR_CHART: {
                controls = {
                    showLogScaleToggle: this.props.showLogScaleToggle,
                    logScaleChecked: this.props.logScaleChecked,
                };
                break;
            }
            case ChartTypeEnum.PIE_CHART: {
                controls = { showTableIcon: true };
                break;
            }
            case ChartTypeEnum.TABLE: {
                controls = { showPieIcon: true };
                break;
            }
        }
        if (this.comparisonPagePossible) {
            controls.showComparisonPageIcon = true;
        }
        return {
            ...controls,
            showResetIcon: this.props.filters && this.props.filters.length > 0,
        } as ChartControls;
    }

    @autobind
    @action
    changeChartType(chartType: ChartType) {
        this.chartType = chartType;
        this.handlers.onChangeChartType(chartType);
    }

    @computed
    get comparisonPagePossible() {
        return (
            this.props.promise.isComplete &&
            this.props.promise.result!.length > 1 &&
            COMPARISON_CHART_TYPES.indexOf(this.props.chartType) > -1
        );
    }

    @autobind
    @action
    openComparisonPage(params?: {
        // for numerical clinical attributes
        categorizationType?: NumericalGroupComparisonType;
        // for mutated genes table
        hugoGeneSymbols?: string[];
        // for treatments tables
        treatmentUniqueKeys?: string[];
    }) {
        if (this.comparisonPagePossible) {
            switch (this.props.chartType) {
                case ChartTypeEnum.PIE_CHART:
                case ChartTypeEnum.TABLE:
                    const openComparison = () =>
                        this.props.store.openComparisonPage(
                            this.props.chartMeta,
                            {
                                clinicalAttributeValues: this.props.promise
                                    .result! as ClinicalDataCountSummary[],
                            }
                        );
                    const values = this.props.promise
                        .result! as ClinicalDataCountSummary[];
                    if (values.length > MAX_GROUPS_IN_SESSION) {
                        this.props.setComparisonConfirmationModal(hideModal => {
                            return (
                                <Modal
                                    show={true}
                                    onHide={() => {}}
                                    backdrop="static"
                                >
                                    <Modal.Body>
                                        Group comparisons are limited to 20
                                        groups. Click OK to compare the 20
                                        largest groups in this chart. Or, select
                                        up to 20 specific groups in the chart to
                                        compare.
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <button
                                            className="btn btn-md btn-primary"
                                            onClick={() => {
                                                openComparison();
                                                hideModal();
                                            }}
                                        >
                                            OK
                                        </button>
                                        <button
                                            className="btn btn-md btn-default"
                                            onClick={hideModal}
                                        >
                                            Cancel
                                        </button>
                                    </Modal.Footer>
                                </Modal>
                            );
                        });
                    } else {
                        openComparison();
                    }
                    break;
                case ChartTypeEnum.BAR_CHART:
                case ChartTypeEnum.MUTATED_GENES_TABLE:
                case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
                case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                    this.props.store.openComparisonPage(
                        this.props.chartMeta,
                        params || {}
                    );
                    break;
            }
        }
    }

    @computed get survivalChartData() {
        // need to put this in @computed instead of a remoteData, because in a remoteData any changes to props trigger
        //   a rerender with delay
        if (
            this.props.promise.isComplete &&
            this.props.patientToAnalysisGroup &&
            this.props.patientToAnalysisGroup.isComplete
        ) {
            const survival: SurvivalType = _.find(
                this.props.promise.result!,
                survivalPlot => {
                    return survivalPlot.id === this.props.chartMeta.uniqueKey;
                }
            );
            return makeSurvivalChartData(
                survival.survivalData,
                this.props.analysisGroupsSettings.groups,
                this.props.patientToAnalysisGroup!.result!
            );
        } else {
            return undefined;
        }
    }

    // Scatter plot has a weird height setting.
    getScatterPlotHeight(height: number) {
        return (
            STUDY_VIEW_CONFIG.layout.grid.h * height -
            this.chartHeaderHeight +
            33
        );
    }

    @computed
    get borderWidth() {
        return this.highlightChart ? 2 : 1;
    }

    @computed
    get chart(): (() => JSX.Element) | null {
        switch (this.chartType) {
            case ChartTypeEnum.PIE_CHART: {
                return () => (
                    <PieChart
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        ref={this.handlers.ref}
                        onUserSelection={this.handlers.onValueSelection}
                        openComparisonPage={this.openComparisonPage}
                        filters={this.props.filters}
                        data={this.props.promise.result}
                        placement={this.placement}
                        label={this.props.title}
                        labelDescription={this.props.chartMeta.description}
                        patientAttribute={this.props.chartMeta.patientAttribute}
                    />
                );
            }
            case ChartTypeEnum.BAR_CHART: {
                return () => (
                    <BarChart
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        ref={this.handlers.ref}
                        onUserSelection={this.handlers.onDataBinSelection}
                        filters={this.props.filters}
                        data={this.props.promise.result}
                    />
                );
            }
            case ChartTypeEnum.TABLE: {
                return () => (
                    <ClinicalTable
                        data={this.props.promise.result}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onUserSelection={this.handlers.onValueSelection}
                        labelDescription={this.props.chartMeta.description}
                        patientAttribute={this.props.chartMeta.patientAttribute}
                        showAddRemoveAllButtons={this.mouseInChart}
                    />
                );
            }
            case ChartTypeEnum.MUTATED_GENES_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.MUTATION}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            { columnKey: MultiSelectionTableColumnKey.GENE },
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.NUMBER_MUTATIONS,
                            },
                            { columnKey: MultiSelectionTableColumnKey.NUMBER },
                            { columnKey: MultiSelectionTableColumnKey.FREQ },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                    />
                );
            }
            case ChartTypeEnum.FUSION_GENES_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.FUSION}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            { columnKey: MultiSelectionTableColumnKey.GENE },
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.NUMBER_FUSIONS,
                            },
                            { columnKey: MultiSelectionTableColumnKey.NUMBER },
                            { columnKey: MultiSelectionTableColumnKey.FREQ },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                    />
                );
            }
            case ChartTypeEnum.CNA_GENES_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.CNA}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            {
                                columnKey: MultiSelectionTableColumnKey.GENE,
                                columnWidthRatio: 0.24,
                            },
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.CYTOBAND,
                                columnWidthRatio: 0.24,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.CNA,
                                columnWidthRatio: 0.18,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.NUMBER,
                                columnWidthRatio: 0.17,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.FREQ,
                                columnWidthRatio: 0.17,
                            },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                    />
                );
            }
            case ChartTypeEnum.GENOMIC_PROFILES_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.DATA}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.MOLECULAR_PROFILE,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.NUMBER,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.FREQ,
                            },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                    />
                );
            }
            case ChartTypeEnum.CASE_LIST_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.DATA}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.CASE_LIST,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.NUMBER,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.FREQ,
                            },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                    />
                );
            }
            case ChartTypeEnum.SURVIVAL: {
                if (this.survivalChartData) {
                    const data = this.survivalChartData;
                    return () => (
                        <SurvivalChart
                            ref={this.handlers.ref}
                            sortedGroupedSurvivals={data.sortedGroupedSurvivals}
                            patientToAnalysisGroups={
                                data.patientToAnalysisGroups
                            }
                            pValue={data.pValue}
                            analysisGroups={data.analysisGroups}
                            legendLocation={LegendLocation.TOOLTIP}
                            title={this.props.title}
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Deceased"
                            medianMonthsHeader="Median Months Survival"
                            yLabelTooltip="Survival estimate"
                            xLabelWithEventTooltip="Time of death"
                            xLabelWithoutEventTooltip="Time of last observation"
                            showDownloadButtons={false}
                            showSlider={false}
                            showTable={false}
                            styleOpts={{
                                padding: {
                                    top: 15,
                                    bottom: 30,
                                    left: 45,
                                    right: 20,
                                },
                                width: getWidthByDimension(
                                    this.props.dimension,
                                    this.borderWidth
                                ),
                                height: getHeightByDimension(
                                    this.props.dimension,
                                    this.chartHeaderHeight
                                ),
                                tooltipXOffset: 10,
                                tooltipYOffset: -58,
                                pValue: {
                                    x:
                                        getWidthByDimension(
                                            this.props.dimension,
                                            this.borderWidth
                                        ) - 10,
                                    y: 30,
                                    textAnchor: 'end',
                                },
                                axis: {
                                    y: {
                                        axisLabel: {
                                            padding: 40,
                                        },
                                    },
                                },
                            }}
                            fileName={this.props.title.replace(' ', '_')}
                            // scatter the tick to avoid text overlaping on study view survival plots
                            yAxisTickCount={2}
                            xAxisTickCount={4}
                        />
                    );
                } else {
                    return null;
                }
            }
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE: {
                return () => (
                    <SampleTreatmentsTable
                        tableType={TreatmentTableType.SAMPLE}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        columns={[
                            {
                                columnKey:
                                    SampleTreatmentsTableColumnKey.TREATMENT,
                            },
                            { columnKey: SampleTreatmentsTableColumnKey.TIME },
                            { columnKey: SampleTreatmentsTableColumnKey.COUNT },
                        ]}
                        defaultSortBy={SampleTreatmentsTableColumnKey.COUNT}
                        selectedTreatments={[]}
                    />
                );
            }
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE: {
                return () => (
                    <PatientTreatmentsTable
                        tableType={TreatmentTableType.PATIENT}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        columns={[
                            {
                                columnKey:
                                    PatientTreatmentsTableColumnKey.TREATMENT,
                            },
                            {
                                columnKey:
                                    PatientTreatmentsTableColumnKey.COUNT,
                            },
                        ]}
                        defaultSortBy={PatientTreatmentsTableColumnKey.COUNT}
                        selectedTreatments={[]}
                    />
                );
            }
            case ChartTypeEnum.SCATTER: {
                return () => (
                    <div
                        style={{
                            overflow: 'hidden',
                            height: getHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            ),
                        }}
                    >
                        {/* have to do all this weird positioning to decrease gap btwn chart and title, bc I cant do it from within Victory */}
                        {/* overflow: "hidden" because otherwise the large SVG (I have to make it larger to make the plot large enough to
                            decrease the gap) will cover the header controls and make them unclickable */}
                        <div style={{ marginTop: -33 }}>
                            <StudyViewDensityScatterPlot
                                ref={this.handlers.ref}
                                width={getWidthByDimension(
                                    this.props.dimension,
                                    this.borderWidth
                                )}
                                height={this.getScatterPlotHeight(
                                    this.props.dimension.h
                                )}
                                yBinsMin={MutationCountVsCnaYBinsMin}
                                onSelection={this.props.onValueSelection}
                                selectionBounds={
                                    this.props.filters &&
                                    this.props.filters.length > 0
                                        ? this.props.filters[0]
                                        : undefined
                                }
                                data={this.props.promise.result.bins}
                                xBinSize={this.props.promise.result.xBinSize}
                                yBinSize={this.props.promise.result.yBinSize}
                                isLoading={this.props.promise.isPending}
                                axisLabelX="Fraction of copy number altered genome"
                                axisLabelY="# of mutations"
                                tooltip={mutationCountVsCnaTooltip}
                            />
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    }

    @computed
    get highlightChart() {
        return this.newlyAdded;
    }

    componentDidMount() {
        if (this.props.isNewlyAdded(this.props.chartMeta.uniqueKey)) {
            this.newlyAdded = true;
            setTimeout(
                () => (this.newlyAdded = false),
                STUDY_VIEW_CONFIG.thresholds.chartHighlight
            );
        }
    }

    componentWillReceiveProps(
        nextProps: Readonly<IChartContainerProps>,
        nextContext: any
    ): void {
        if (nextProps.chartType !== this.chartType) {
            this.chartType = nextProps.chartType;
        }
    }

    public render() {
        return (
            <div
                className={classnames(styles.chart, {
                    [styles.highlight]: this.highlightChart,
                })}
                data-test={`chart-container-${this.props.chartMeta.uniqueKey}`}
                onMouseEnter={this.handlers.onMouseEnterChart}
                onMouseLeave={this.handlers.onMouseLeaveChart}
            >
                <ChartHeader
                    height={this.chartHeaderHeight}
                    chartMeta={this.props.chartMeta}
                    chartType={this.props.chartType}
                    store={this.props.store}
                    title={this.props.title}
                    active={this.mouseInChart}
                    resetChart={this.handlers.resetFilters}
                    deleteChart={this.handlers.onDeleteChart}
                    selectedRowsKeys={this.selectedRowsKeys}
                    toggleLogScale={this.handlers.onToggleLogScale}
                    chartControls={this.chartControls}
                    changeChartType={this.changeChartType}
                    getSVG={() => Promise.resolve(this.toSVGDOMNode())}
                    getData={this.props.getData}
                    downloadTypes={this.props.downloadTypes}
                    openComparisonPage={this.openComparisonPage}
                    placement={this.placement}
                    description={this.props.description}
                />
                <div
                    style={{
                        display: 'flex',
                        flexGrow: 1,
                        margin: 'auto',
                        alignItems: 'center',
                    }}
                >
                    {this.props.promise.isPending && (
                        <LoadingIndicator
                            isLoading={true}
                            className={styles.chartLoader}
                        />
                    )}
                    {this.props.promise.isError && (
                        <div>Error when loading data.</div>
                    )}

                    {(!this.props.chartMeta.renderWhenDataChange ||
                        this.props.promise.isComplete) && (
                        <div
                            style={{
                                visibility: this.props.promise.isPending
                                    ? 'hidden'
                                    : 'visible',
                                display: 'flex',
                            }}
                        >
                            {this.chart && this.chart()}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
