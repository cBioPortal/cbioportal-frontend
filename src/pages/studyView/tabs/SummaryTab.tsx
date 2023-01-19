import * as React from 'react';
import styles from './studySummaryTabStyles.module.scss';
import chartHeaderStyles from '../chartHeader/styles.module.scss';
import {
    ChartContainer,
    IChartContainerProps,
} from 'pages/studyView/charts/ChartContainer';
import { observable, toJS, makeObservable } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import {
    DataFilterValue,
    GenericAssayDataBin,
    GenomicDataBin,
} from 'cbioportal-ts-api-client';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ReactGridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { observer } from 'mobx-react';
import {
    ChartTypeEnum,
    STUDY_VIEW_CONFIG,
    ChartDimension,
} from '../StudyViewConfig';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from '../../../shared/components/progressIndicator/ProgressIndicator';
import autobind from 'autobind-decorator';
import {
    ChartMeta,
    ChartType,
    RectangleBounds,
    DataBin,
    makeDensityScatterPlotTooltip,
    logScalePossible,
} from '../StudyViewUtils';
import { DataType } from 'cbioportal-frontend-commons';
import DelayedRender from 'shared/components/DelayedRender';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import { getServerConfig } from 'config/config';

export interface IStudySummaryTabProps {
    store: StudyViewPageStore;
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method.
// Even if this value is referenced deep within some helper method
@observer
export class StudySummaryTab extends React.Component<
    IStudySummaryTabProps,
    {}
> {
    private store: StudyViewPageStore;
    private handlers: any;

    @observable showErrorMessage = true;

    constructor(props: IStudySummaryTabProps) {
        super(props);
        makeObservable(this);
        this.store = props.store;

        this.handlers = {
            onValueSelection: (chartMeta: ChartMeta, values: string[]) => {
                this.store.updateClinicalDataFilterByValues(
                    chartMeta.uniqueKey,
                    values.map(value => ({ value } as DataFilterValue))
                );
            },
            onDataBinSelection: (chartMeta: ChartMeta, dataBins: DataBin[]) => {
                this.store.updateClinicalDataIntervalFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onToggleLogScale: (chartMeta: ChartMeta) => {
                this.store.toggleLogScale(chartMeta.uniqueKey);
            },
            onToggleSurvivalPlotLeftTruncation: (chartMeta: ChartMeta) => {
                this.store.toggleSurvivalPlotLeftTruncation(
                    chartMeta.uniqueKey
                );
            },
            onToggleNAValue: (chartMeta: ChartMeta) => {
                this.store.toggleNAValue(chartMeta.uniqueKey);
            },
            onDeleteChart: (chartMeta: ChartMeta) => {
                this.store.resetFilterAndChangeChartVisibility(
                    chartMeta.uniqueKey,
                    false
                );
            },
            onChangeChartType: (
                chartMeta: ChartMeta,
                newChartType: ChartType
            ) => {
                this.store.changeChartType(chartMeta, newChartType);
            },
            isNewlyAdded: (uniqueKey: string) => {
                return this.store.isNewlyAdded(uniqueKey);
            },
            setCustomChartFilters: (chartMeta: ChartMeta, values: string[]) => {
                this.store.setCustomChartFilters(chartMeta.uniqueKey, values);
            },
            onLayoutChange: (layout: ReactGridLayout.Layout[]) => {
                this.store.updateCurrentGridLayout(layout);
                this.onResize(layout);
            },
            resetGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetGeneFilter(chartMeta.uniqueKey);
            },
            onGenomicDataBinSelection: (
                chartMeta: ChartMeta,
                dataBins: GenomicDataBin[]
            ) => {
                this.store.updateGenomicDataIntervalFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onGenericAssayDataBinSelection: (
                chartMeta: ChartMeta,
                dataBins: GenericAssayDataBin[]
            ) => {
                this.store.updateGenericAssayDataFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onGenericAssayCategoricalValueSelection: (
                chartMeta: ChartMeta,
                values: string[]
            ) => {
                this.store.updateCategoricalGenericAssayDataFilters(
                    chartMeta.uniqueKey,
                    values
                );
            },
        };
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        const props: Partial<IChartContainerProps> = {
            chartMeta: chartMeta,
            chartType: this.props.store.chartsType.get(chartMeta.uniqueKey),
            store: this.props.store,
            dimension: this.store.chartsDimension.get(chartMeta.uniqueKey),
            title: chartMeta.displayName,
            filters: [],
            onDeleteChart: this.handlers.onDeleteChart,
            isNewlyAdded: this.handlers.isNewlyAdded,
            studyViewFilters: this.store.filters,
            analysisGroupsSettings: this.store.analysisGroupsSettings,
            cancerGeneFilterEnabled: this.store.oncokbCancerGeneFilterEnabled,
            setComparisonConfirmationModal: this.store
                .setComparisonConfirmationModal,
        };

        switch (this.store.chartsType.get(chartMeta.uniqueKey)) {
            case ChartTypeEnum.PIE_CHART: {
                //if the chart is one of the custom charts then get the appropriate promise
                if (
                    this.store.isUserDefinedCustomDataChart(chartMeta.uniqueKey)
                ) {
                    props.filters = this.store
                        .getCustomDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        );
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;
                    props.promise = this.store.getCustomDataCount(chartMeta);
                } else if (
                    this.store.isGenericAssayChart(chartMeta.uniqueKey)
                ) {
                    props.filters = this.store
                        .getGenericAssayDataFiltersByUniqueKey(
                            props.chartMeta!.uniqueKey
                        )
                        .map(
                            genericAssayDataFilter =>
                                genericAssayDataFilter.value
                        );
                    props.onValueSelection = this.handlers.onGenericAssayCategoricalValueSelection;
                    props.onResetSelection = this.handlers.onGenericAssayCategoricalValueSelection;
                    props.promise = this.store.getGenericAssayChartDataCount(
                        chartMeta
                    );
                } else {
                    props.promise = this.store.getClinicalDataCount(chartMeta);
                    props.filters = this.store
                        .getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        );
                    props.onValueSelection = this.handlers.onValueSelection;
                    props.onResetSelection = this.handlers.onValueSelection;
                }
                props.onChangeChartType = this.handlers.onChangeChartType;
                props.getData = (dataType?: DataType) =>
                    this.store.getPieChartDataDownload(chartMeta, dataType);
                props.downloadTypes = [
                    'Summary Data',
                    'Full Data',
                    'SVG',
                    'PDF',
                ];
                break;
            }
            case ChartTypeEnum.BAR_CHART: {
                //if the chart is one of the custom charts then get the appropriate promise
                if (this.store.isGeneSpecificChart(chartMeta.uniqueKey)) {
                    props.promise = this.store.getGenomicChartDataBin(
                        chartMeta
                    );
                    props.filters = this.store.getGenomicDataIntervalFiltersByUniqueKey(
                        props.chartMeta!.uniqueKey
                    );
                    props.onDataBinSelection = this.handlers.onGenomicDataBinSelection;
                    props.onResetSelection = this.handlers.onGenomicDataBinSelection;
                    props.getData = () =>
                        this.store.getChartDownloadableData(chartMeta);
                } else if (
                    this.store.isGenericAssayChart(chartMeta.uniqueKey)
                ) {
                    props.promise = this.store.getGenericAssayChartDataBin(
                        chartMeta
                    );
                    props.filters = this.store.getGenericAssayDataFiltersByUniqueKey(
                        props.chartMeta!.uniqueKey
                    );
                    props.onDataBinSelection = this.handlers.onGenericAssayDataBinSelection;
                    props.onResetSelection = this.handlers.onGenericAssayDataBinSelection;
                    props.getData = () =>
                        this.store.getChartDownloadableData(chartMeta);
                } else {
                    props.promise = this.store.getClinicalDataBin(chartMeta);
                    props.filters = this.store.getClinicalDataFiltersByUniqueKey(
                        chartMeta.uniqueKey
                    );
                    props.onDataBinSelection = this.handlers.onDataBinSelection;
                    props.onResetSelection = this.handlers.onDataBinSelection;
                    props.getData = () =>
                        this.store.getChartDownloadableData(chartMeta);
                }
                props.onToggleLogScale = this.handlers.onToggleLogScale;
                props.onToggleNAValue = this.handlers.onToggleNAValue;
                props.showLogScaleToggle = this.store.isLogScaleToggleVisible(
                    chartMeta.uniqueKey,
                    props.promise!.result
                );
                props.logScaleChecked = this.store.isLogScaleChecked(
                    chartMeta.uniqueKey
                );
                props.isShowNAChecked = this.store.isShowNAChecked(
                    chartMeta.uniqueKey
                );
                props.showNAToggle = this.store.isShowNAToggleVisible(
                    props.promise!.result
                );
                props.downloadTypes = ['Data', 'SVG', 'PDF'];
                break;
            }
            case ChartTypeEnum.TABLE: {
                if (
                    this.store.isUserDefinedCustomDataChart(chartMeta.uniqueKey)
                ) {
                    props.filters = this.store
                        .getCustomDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        );
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;
                    props.promise = this.store.getCustomDataCount(chartMeta);
                } else if (
                    this.store.isGenericAssayChart(chartMeta.uniqueKey)
                ) {
                    props.filters = this.store
                        .getGenericAssayDataFiltersByUniqueKey(
                            props.chartMeta!.uniqueKey
                        )
                        .map(
                            genericAssayDataFilter =>
                                genericAssayDataFilter.value
                        );
                    props.onValueSelection = this.handlers.onGenericAssayCategoricalValueSelection;
                    props.onResetSelection = this.handlers.onGenericAssayCategoricalValueSelection;
                    props.promise = this.store.getGenericAssayChartDataCount(
                        chartMeta
                    );
                } else {
                    props.filters = this.store
                        .getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        );
                    props.promise = this.store.getClinicalDataCount(chartMeta);
                    props.onValueSelection = this.handlers.onValueSelection;
                    props.onResetSelection = this.handlers.onValueSelection;
                }
                props.onChangeChartType = this.handlers.onChangeChartType;
                props.getData = () =>
                    this.store.getChartDownloadableData(chartMeta);
                props.downloadTypes = ['Data'];
                break;
            }
            case ChartTypeEnum.MUTATED_GENES_TABLE: {
                props.filters = this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                );
                props.promise = this.store.mutatedGeneTableRowData;
                props.onValueSelection = this.store.addGeneFilters;
                props.onResetSelection = () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey);
                props.selectedGenes = this.store.selectedGenes;
                props.onGeneSelect = this.store.onCheckGene;
                props.title = this.store.getChartTitle(
                    ChartTypeEnum.MUTATED_GENES_TABLE,
                    props.title
                );
                props.getData = () => this.store.getMutatedGenesDownloadData();
                props.genePanelCache = this.store.genePanelCache;
                props.downloadTypes = ['Data'];
                props.filterByCancerGenes = this.store.filterMutatedGenesTableByCancerGenes;
                props.onChangeCancerGeneFilter = this.store.updateMutatedGenesTableByCancerGenesFilter;
                props.alterationFilterEnabled = getServerConfig().skin_show_settings_menu;
                props.filterAlterations = this.store.isGlobalMutationFilterActive;
                break;
            }
            case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE: {
                props.filters = this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                );
                props.promise = this.store.structuralVariantGeneTableRowData;
                props.onValueSelection = this.store.addGeneFilters;
                props.onResetSelection = () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey);
                props.selectedGenes = this.store.selectedGenes;
                props.onGeneSelect = this.store.onCheckGene;
                props.title = this.store.getChartTitle(
                    ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE,
                    props.title
                );
                props.getData = () =>
                    this.store.getStructuralVariantGenesDownloadData();
                props.genePanelCache = this.store.genePanelCache;
                props.downloadTypes = ['Data'];
                props.filterByCancerGenes = this.store.filterSVGenesTableByCancerGenes;
                props.onChangeCancerGeneFilter = this.store.updateSVGenesTableByCancerGenesFilter;
                props.alterationFilterEnabled = getServerConfig().skin_show_settings_menu;
                props.filterAlterations = this.store.isGlobalMutationFilterActive;
                break;
            }
            case ChartTypeEnum.CNA_GENES_TABLE: {
                props.filters = this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                );
                props.promise = this.store.cnaGeneTableRowData;
                props.onValueSelection = this.store.addGeneFilters;
                props.onResetSelection = () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey);
                props.selectedGenes = this.store.selectedGenes;
                props.onGeneSelect = this.store.onCheckGene;
                props.title = this.store.getChartTitle(
                    ChartTypeEnum.CNA_GENES_TABLE,
                    props.title
                );
                props.getData = () => this.store.getGenesCNADownloadData();
                props.genePanelCache = this.store.genePanelCache;
                props.downloadTypes = ['Data'];
                props.filterByCancerGenes = this.store.filterCNAGenesTableByCancerGenes;
                props.onChangeCancerGeneFilter = this.store.updateCNAGenesTableByCancerGenesFilter;
                props.alterationFilterEnabled = getServerConfig().skin_show_settings_menu;
                props.filterAlterations = this.store.isGlobalAlterationFilterActive;
                break;
            }
            case ChartTypeEnum.GENOMIC_PROFILES_TABLE: {
                props.filters = toJS(this.store.genomicProfilesFilter);
                props.promise = this.store.molecularProfileSampleCounts;
                props.onValueSelection = this.store.addGenomicProfilesFilter;
                props.onResetSelection = () => {
                    this.store.setGenomicProfilesFilter([]);
                };
                break;
            }
            case ChartTypeEnum.CASE_LIST_TABLE: {
                props.filters = toJS(this.store.caseListsFilter);
                props.promise = this.store.caseListSampleCounts;
                props.onValueSelection = this.store.addCaseListsFilter;
                props.onResetSelection = () => {
                    this.store.setCaseListsFilter([]);
                };
                break;
            }
            case ChartTypeEnum.SURVIVAL: {
                props.promise = this.store.survivalPlots;
                props.getData = () =>
                    this.store.getSurvivalDownloadData(chartMeta);
                props.patientToAnalysisGroup = this.store.patientToAnalysisGroup;
                props.downloadTypes = ['Data', 'SVG', 'PDF'];
                props.description = this.store.survivalDescriptions.result
                    ? this.store.survivalDescriptions.result![
                          chartMeta.uniqueKey.substring(
                              0,
                              chartMeta.uniqueKey.lastIndexOf('_SURVIVAL')
                          )
                      ][0]
                    : undefined;
                props.onToggleSurvivalPlotLeftTruncation = this.handlers.onToggleSurvivalPlotLeftTruncation;
                props.survivalPlotLeftTruncationChecked = this.store.survivalPlotLeftTruncationToggleMap?.get(
                    chartMeta!.uniqueKey
                );
                /* start of left truncation adjustment related settings */
                // Currently, left truncation is only appliable for Overall Survival data
                if (
                    this.store.isLeftTruncationAvailable.result &&
                    new RegExp('OS_SURVIVAL').test(chartMeta.uniqueKey)
                ) {
                    props.isLeftTruncationAvailable = true;
                    props.patientSurvivalsWithoutLeftTruncation = this.store.survivalPlotDataById.result[
                        'OS_SURVIVAL'
                    ]?.survivalDataWithoutLeftTruncation;
                }
                /* end of left truncation adjustment related settings */
                break;
            }
            case ChartTypeEnum.VIOLIN_PLOT_TABLE:
                const chartInfo = this.store.getXvsYViolinChartInfo(
                    props.chartMeta!.uniqueKey
                )!;
                const settings = this.store.getXvsYChartSettings(
                    props.chartMeta!.uniqueKey
                )!;
                props.filters = [
                    ...this.store.getClinicalDataFiltersByUniqueKey(
                        chartInfo.categoricalAttr.clinicalAttributeId
                    ),
                    ...this.store.getClinicalDataFiltersByUniqueKey(
                        chartInfo.numericalAttr.clinicalAttributeId
                    ),
                ];
                props.title = `${chartInfo.numericalAttr.displayName}${
                    settings.violinLogScale ? ' (log)' : ''
                } vs ${chartInfo.categoricalAttr.displayName}`;
                props.promise = this.store.clinicalViolinDataCache.get({
                    chartInfo,
                    violinLogScale: !!settings.violinLogScale,
                });
                props.axisLabelX = chartInfo.categoricalAttr.displayName;
                props.axisLabelY = chartInfo.numericalAttr.displayName;
                props.showLogScaleToggle = logScalePossible(
                    chartInfo.numericalAttr.clinicalAttributeId
                );
                props.logScaleChecked = settings.violinLogScale;
                props.onToggleLogScale = () => {
                    const settings = this.store.getXvsYChartSettings(
                        props.chartMeta!.uniqueKey
                    )!;
                    settings.violinLogScale = !settings.violinLogScale;
                };
                props.showViolinPlotToggle = true;
                props.violinPlotChecked = settings.showViolin;
                props.onToggleViolinPlot = () => {
                    const settings = this.store.getXvsYChartSettings(
                        props.chartMeta!.uniqueKey
                    )!;
                    settings.showViolin = !settings.showViolin;
                };
                props.showBoxPlotToggle = true;
                props.boxPlotChecked = settings.showBox;
                props.onToggleBoxPlot = () => {
                    const settings = this.store.getXvsYChartSettings(
                        props.chartMeta!.uniqueKey
                    )!;
                    settings.showBox = !settings.showBox;
                };
                props.onValueSelection = (
                    type: 'categorical' | 'numerical',
                    values: string[] | { start: number; end: number }
                ) => {
                    switch (type) {
                        case 'categorical':
                            this.store.updateClinicalAttributeFilterByValues(
                                chartInfo.categoricalAttr.clinicalAttributeId,
                                (values as string[]).map(
                                    value => ({ value } as DataFilterValue)
                                )
                            );
                            break;
                        case 'numerical':
                            this.store.updateClinicalDataCustomIntervalFilter(
                                chartInfo.numericalAttr.clinicalAttributeId,
                                values as { start: number; end: number }
                            );
                            break;
                    }
                };
                props.selectedCategories = this.store
                    .getClinicalDataFiltersByUniqueKey(
                        chartInfo.categoricalAttr.clinicalAttributeId
                    )
                    .map(x => x.value);
                props.onResetSelection = () => {
                    this.store.updateClinicalAttributeFilterByValues(
                        chartInfo.categoricalAttr.clinicalAttributeId,
                        []
                    );
                    this.store.updateClinicalAttributeFilterByValues(
                        chartInfo.numericalAttr.clinicalAttributeId,
                        []
                    );
                };
                break;
            case ChartTypeEnum.SCATTER: {
                props.filters = this.store.getScatterPlotFiltersByUniqueKey(
                    props.chartMeta!.uniqueKey
                );
                const chartInfo = this.store.getXvsYScatterChartInfo(
                    props.chartMeta!.uniqueKey
                )!;
                const settings = this.store.getXvsYChartSettings(
                    props.chartMeta!.uniqueKey
                )!;
                props.title = props.chartMeta!.displayName;
                props.promise = this.store.clinicalDataDensityCache.get({
                    chartInfo,
                    xAxisLogScale: !!settings.xLogScale,
                    yAxisLogScale: !!settings.yLogScale,
                });
                props.showLogScaleXToggle = logScalePossible(
                    chartInfo.xAttr.clinicalAttributeId
                );
                props.showLogScaleYToggle = logScalePossible(
                    chartInfo.yAttr.clinicalAttributeId
                );
                props.logScaleXChecked = settings.xLogScale;
                props.logScaleYChecked = settings.yLogScale;
                props.onToggleLogScaleX = () => {
                    const settings = this.store.getXvsYChartSettings(
                        props.chartMeta!.uniqueKey
                    )!;
                    settings.xLogScale = !settings.xLogScale;
                };
                props.onToggleLogScaleY = () => {
                    const settings = this.store.getXvsYChartSettings(
                        props.chartMeta!.uniqueKey
                    )!;
                    settings.yLogScale = !settings.yLogScale;
                };
                props.onSwapAxes = () => {
                    this.store.swapXvsYChartAxes(props.chartMeta!.uniqueKey);
                };
                props.plotDomain = chartInfo.plotDomain;
                props.axisLabelX = `${chartInfo.xAttr.displayName}${
                    settings.xLogScale ? ' (log)' : ''
                }`;
                props.axisLabelY = `${chartInfo.yAttr.displayName}${
                    settings.yLogScale ? ' (log)' : ''
                }`;
                props.tooltip = makeDensityScatterPlotTooltip(
                    chartInfo,
                    settings
                );
                props.onValueSelection = (bounds: RectangleBounds) => {
                    this.store.updateScatterPlotFilterByValues(
                        props.chartMeta!.uniqueKey,
                        bounds
                    );
                };
                props.onResetSelection = () => {
                    this.store.updateScatterPlotFilterByValues(
                        props.chartMeta!.uniqueKey
                    );
                };
                props.sampleToAnalysisGroup = this.store.sampleToAnalysisGroup;
                props.getData = () =>
                    this.store.getScatterDownloadData(
                        props.chartMeta!.uniqueKey
                    );
                props.downloadTypes = ['Data', 'SVG', 'PDF'];
                break;
            }
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE: {
                props.filters = this.store.sampleTreatmentFiltersAsStrings;
                props.promise = this.store.sampleTreatments;
                props.onValueSelection = this.store.onTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearSampleTreatmentFilters();
                };
                break;
            }
            case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE: {
                props.filters = this.store.sampleTreatmentGroupFiltersAsStrings;
                props.promise = this.store.sampleTreatmentGroups;
                props.onValueSelection = this.store.onTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearSampleTreatmentGroupFilters();
                };
                break;
            }
            case ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE: {
                props.filters = this.store.sampleTreatmentTargetFiltersAsStrings;
                props.promise = this.store.sampleTreatmentTarget;
                props.onValueSelection = this.store.onTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearSampleTreatmentTargetFilters();
                };
                break;
            }
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE: {
                props.filters = this.store.patientTreatmentFiltersAsStrings;
                props.promise = this.store.patientTreatments;
                props.onValueSelection = this.store.onTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearPatientTreatmentFilters();
                };
                break;
            }
            case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE: {
                props.filters = this.store.patientTreatmentGroupFiltersAsStrings;
                props.promise = this.store.patientTreatmentGroups;
                props.onValueSelection = this.store.onTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearPatientTreatmentGroupFilters();
                };
                break;
            }
            case ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE: {
                props.filters = this.store.patientTreatmentTargetFiltersAsStrings;
                props.promise = this.store.patientTreatmentTarget;
                props.onValueSelection = this.store.onTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearPatientTreatmentTargetFilters();
                };
                break;
            }
            default:
                break;
        }

        // Using custom component inside of the GridLayout creates too many chaos as mentioned here
        // https://github.com/STRML/react-grid-layout/issues/299
        // Option 1:    Always create div wrapper out of your custom component, but this solves all the issues.
        // Option 2:    Expose style, className in your component and apply all the properties in your component
        //              first division tag. And remember, you component has to use div as first child.
        //              This solution only works with grid layout, not resizing.
        // Decided to go with option 1 due to following reasons:
        // 1.   The ChartContainer will be used to include all charts in the study view.
        //      Then across the study page, there should be only one place to include ChartContainer component.
        // 2.   The maintainer of RGL repo currently not actively accepts pull requests. So we don't know when the
        //      issue will be solved.
        return (
            <div key={chartMeta.uniqueKey}>
                <DelayedRender>
                    {/* Delay the render after a setTimeout, because synchronous rendering would jam UI updates
                    and make things laggy */}
                    <ChartContainer
                        key={chartMeta.uniqueKey}
                        {...(props as any)}
                    />
                </DelayedRender>
            </div>
        );
    };

    @autobind
    onResize(newLayout: Layout[]) {
        newLayout
            .filter(l => {
                const layout = this.store.chartsDimension.get(l.i as string);
                return layout && (layout.h !== l.h || layout.w !== l.w);
            })
            .forEach(l => {
                const key = l.i as string;
                const toUpdate = this.store.chartsDimension.get(
                    key
                ) as ChartDimension;

                toUpdate.h = l.h;
                toUpdate.w = l.w;
                this.store.chartsDimension.set(key, toUpdate);
            });
    }

    @autobind
    getProgressItems(elapsedSecs: number): IProgressIndicatorItem[] {
        const clinicalDataPromises = [
            this.store.initialVisibleAttributesClinicalDataBinCountData,
            this.store.initialVisibleAttributesClinicalDataCountData,
        ];

        const sampleDataPromises = [
            this.store.caseListSampleCounts,
            this.store.selectedSamples,
        ];

        // do not display "this can take several seconds" if the corresponding data group has already been loaded
        const isClinicalDataTakingLong =
            elapsedSecs > 2 &&
            getRemoteDataGroupStatus(...clinicalDataPromises) === 'pending';
        const isSampleDataTakingLong =
            elapsedSecs > 2 &&
            getRemoteDataGroupStatus(...sampleDataPromises) === 'pending';

        return [
            {
                label: 'Loading meta information',
                promises: [
                    this.store.defaultVisibleAttributes,
                    this.store.mutationProfiles,
                    this.store.cnaProfiles,
                ],
            },
            {
                label:
                    'Loading clinical data' +
                    (isClinicalDataTakingLong
                        ? ' - this can take several seconds'
                        : ''),
                promises: clinicalDataPromises,
            },
            {
                label:
                    'Loading sample data' +
                    (isSampleDataTakingLong
                        ? ' - this can take several seconds'
                        : ''),
                promises: sampleDataPromises,
            },
            {
                label: 'Rendering',
            },
        ];
    }

    render() {
        return (
            <div>
                <LoadingIndicator
                    isLoading={this.store.loadingInitialDataForSummaryTab}
                    size={'big'}
                    center={true}
                >
                    <ProgressIndicator
                        getItems={this.getProgressItems}
                        show={this.store.loadingInitialDataForSummaryTab}
                        sequential={true}
                    />
                </LoadingIndicator>
                {this.store.invalidSampleIds.result.length > 0 &&
                    this.showErrorMessage && (
                        <div>
                            <div className="alert alert-danger">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() =>
                                        (this.showErrorMessage = false)
                                    }
                                >
                                    &times;
                                </button>
                                The following sample(s) might have been
                                deleted/updated with the recent data updates
                                <br />
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        padding: '10px',
                                        maxHeight: '300px',
                                        overflowY: 'scroll',
                                    }}
                                >
                                    {this.store.invalidSampleIds.result.map(
                                        sample => (
                                            <li>
                                                {sample.studyId +
                                                    ':' +
                                                    sample.sampleId}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                {this.store.showSettingRestoreMsg && (
                    <div>
                        <div className="alert alert-info">
                            <button
                                type="button"
                                className="close"
                                onClick={() => {
                                    this.store.hideRestoreSettingsMsg = true;
                                }}
                            >
                                &times;
                            </button>
                            Your previously saved layout preferences have been
                            applied.
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    this.store.hideRestoreSettingsMsg = true;
                                }}
                                style={{ marginLeft: '10px' }}
                            >
                                Keep Saved Layout
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    this.store.hideRestoreSettingsMsg = true;
                                    this.store.undoUserChartSettings();
                                }}
                                style={{ marginLeft: '10px' }}
                            >
                                Revert to Previous Layout
                            </button>
                        </div>
                    </div>
                )}

                {!this.store.loadingInitialDataForSummaryTab &&
                    !this.store.blockLoading && (
                        <div data-test="summary-tab-content">
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.defaultVisibleAttributes
                                    .isComplete && (
                                    <ReactGridLayout
                                        className="layout"
                                        style={{
                                            width: this.store.containerWidth,
                                        }}
                                        width={this.store.containerWidth}
                                        cols={
                                            this.store.studyViewPageLayoutProps
                                                .cols
                                        }
                                        rowHeight={
                                            this.store.studyViewPageLayoutProps
                                                .grid.h
                                        }
                                        layout={
                                            this.store.studyViewPageLayoutProps
                                                .layout
                                        }
                                        margin={[
                                            STUDY_VIEW_CONFIG.layout.gridMargin
                                                .x,
                                            STUDY_VIEW_CONFIG.layout.gridMargin
                                                .y,
                                        ]}
                                        useCSSTransforms={false}
                                        draggableHandle={`.${chartHeaderStyles.draggable}`}
                                        onLayoutChange={
                                            this.handlers.onLayoutChange
                                        }
                                        onResizeStop={this.onResize}
                                    >
                                        {this.store.visibleAttributes.map(
                                            this.renderAttributeChart
                                        )}
                                    </ReactGridLayout>
                                )}
                            </div>
                        </div>
                    )}
                {this.props.store.selectedSamples.isComplete &&
                    this.props.store.selectedSamples.result.length === 0 && (
                        <div className={styles.studyViewNoSamples}>
                            <div className={styles.studyViewNoSamplesInner}>
                                <p>
                                    The filters you have selected have filtered
                                    out all the samples in this study; because
                                    of this, no data visualizations are shown.
                                </p>
                                <p>
                                    You can remove filters in the header of this
                                    page to widen your search criteria and add
                                    samples back to your results.
                                </p>
                            </div>
                        </div>
                    )}
            </div>
        );
    }
}
