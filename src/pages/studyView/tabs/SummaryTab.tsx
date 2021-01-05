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
    ClinicalDataBin,
    GenomicDataBin,
} from 'cbioportal-ts-api-client';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ReactGridLayout, { WidthProvider, Layout } from 'react-grid-layout';
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
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import { ChartMeta, ChartType, RectangleBounds } from '../StudyViewUtils';
import { DataType } from 'cbioportal-frontend-commons';
import { toSampleTreatmentFilter } from '../table/treatments/treatmentsTableUtil';
import { OredSampleTreatmentFilters } from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import DelayedRender from 'shared/components/DelayedRender';

export interface IStudySummaryTabProps {
    store: StudyViewPageStore;
}

const ResizingReactGridLayout = WidthProvider(ReactGridLayout);

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
            onDataBinSelection: (
                chartMeta: ChartMeta,
                dataBins: ClinicalDataBin[]
            ) => {
                this.store.updateClinicalDataIntervalFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onToggleLogScale: (chartMeta: ChartMeta) => {
                this.store.toggleLogScale(chartMeta.uniqueKey);
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
                if (this.store.isCustomChart(chartMeta.uniqueKey)) {
                    props.filters = this.store.getCustomChartFilters(
                        props.chartMeta!.uniqueKey
                    );
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;
                    props.promise = this.store.getCustomChartDataCount(
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
                props.showLogScaleToggle = this.store.isLogScaleToggleVisible(
                    chartMeta.uniqueKey,
                    props.promise!.result
                );
                props.logScaleChecked = this.store.isLogScaleChecked(
                    chartMeta.uniqueKey
                );
                props.downloadTypes = ['Data', 'SVG', 'PDF'];
                break;
            }
            case ChartTypeEnum.TABLE: {
                if (this.store.isCustomChart(chartMeta.uniqueKey)) {
                    props.filters = this.store.getCustomChartFilters(
                        props.chartMeta!.uniqueKey
                    );
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;
                    props.promise = this.store.getCustomChartDataCount(
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
                props.promise = this.store.survivalPlotData;
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
                break;
            }
            case ChartTypeEnum.SCATTER: {
                props.filters = this.store.getScatterPlotFiltersByUniqueKey(
                    props.chartMeta!.uniqueKey
                );
                props.promise = this.store.mutationCountVsCNADensityData;
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
                props.getData = () => this.store.getScatterDownloadData();
                props.downloadTypes = ['Data', 'SVG', 'PDF'];
                break;
            }
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE: {
                props.filters = this.store.sampleTreatmentFiltersAsStrings;
                props.promise = this.store.sampleTreatments;
                props.onValueSelection = this.store.onSampleTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearSampleTreatmentFilters();
                };
                break;
            }
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE: {
                props.filters = this.store.patientTreatmentFiltersAsStrings;
                props.promise = this.store.patientTreatments;
                props.onValueSelection = this.store.onPatientTreatmentSelection;
                props.onResetSelection = () => {
                    this.store.clearPatientTreatmentFilters();
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
                    (elapsedSecs > 2 ? ' - this can take several seconds' : ''),
                promises: [
                    this.store.initialVisibleAttributesClinicalDataBinCountData,
                    this.store.initialVisibleAttributesClinicalDataCountData,
                ],
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
                                    onClick={event =>
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
                                    this.store.undoUserSettings();
                                }}
                                style={{ marginLeft: '10px' }}
                            >
                                Revert to Previous Layout
                            </button>
                        </div>
                    </div>
                )}

                {!this.store.loadingInitialDataForSummaryTab && (
                    <div data-test="summary-tab-content">
                        <div className={styles.studyViewFlexContainer}>
                            {this.store.defaultVisibleAttributes.isComplete && (
                                <ReactGridLayout
                                    className="layout"
                                    style={{
                                        width: this.store.containerWidth,
                                    }}
                                    width={this.store.containerWidth}
                                    cols={
                                        this.store.studyViewPageLayoutProps.cols
                                    }
                                    rowHeight={
                                        this.store.studyViewPageLayoutProps.grid
                                            .h
                                    }
                                    layout={
                                        this.store.studyViewPageLayoutProps
                                            .layout
                                    }
                                    margin={[
                                        STUDY_VIEW_CONFIG.layout.gridMargin.x,
                                        STUDY_VIEW_CONFIG.layout.gridMargin.y,
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
