import * as React from 'react';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import 'react-mfb/mfb.css';
import {
    CustomChart,
    StudyViewPageStore,
    StudyViewPageTabKey,
    GenomicChart,
} from '../StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import autobind from 'autobind-decorator';
import * as _ from 'lodash';
import AddChartByType from './addChartByType/AddChartByType';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import CustomCaseSelection from './customCaseSelection/CustomCaseSelection';
import {
    calculateClinicalDataCountFrequency,
    ChartMetaDataTypeEnum,
    ChartType,
    ChartDataCountSet,
    getOptionsByChartMetaDataType,
    getGenomicChartUniqueKey,
} from '../StudyViewUtils';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import { ChartTypeEnum, ChartTypeNameEnum } from '../StudyViewConfig';
import SuccessBanner from '../infoBanner/SuccessBanner';
import { serializeEvent, trackEvent } from '../../../shared/lib/tracking';
import classNames from 'classnames';
import GeneLevelSelection from './geneLevelSelection/GeneLevelSelection';

export interface IAddChartTabsProps {
    store: StudyViewPageStore;
    currentTab: StudyViewPageTabKey;
    disableGenomicTab?: boolean;
    disableCustomTab?: boolean;
    disableGeneSpecificTab?: boolean;
    onInfoMessageChange?: (newMessage: string) => void;
    showResetPopup: () => void;
}

export interface IAddChartButtonProps extends IAddChartTabsProps {
    buttonText: string;
    addChartOverlayClassName?: string;
}

export type ChartOption = {
    label: string;
    key: string;
    chartType: ChartType;
    disabled?: boolean;
    selected?: boolean;
    freq: number;
};

export const INFO_TIMEOUT = 5000;

export enum TabNamesEnum {
    CUSTOM_DATA = 'Custom Data',
    CLINICAL = 'Clinical',
    GENOMIC = 'Genomic',
    GENE_SPECIFIC = 'Gene Specific',
}

@observer
class AddChartTabs extends React.Component<IAddChartTabsProps, {}> {
    @observable activeId: ChartMetaDataTypeEnum =
        ChartMetaDataTypeEnum.CLINICAL;
    @observable infoMessage: string = '';
    public static defaultProps = {
        disableGenomicTab: false,
        disableCustomTab: false,
        disableGeneSpecificTab: false,
    };

    constructor(props: IAddChartTabsProps, context: any) {
        super(props, context);
    }

    readonly dataCount = remoteData<ChartDataCountSet>({
        await: () => [
            this.props.store.dataWithCount,
            this.props.store.selectedSamples,
        ],
        invoke: async () => {
            return calculateClinicalDataCountFrequency(
                this.props.store.dataWithCount.result,
                this.props.store.selectedSamples.result.length
            );
        },
        default: {},
    });

    @autobind
    @action
    updateActiveId(newId: string) {
        this.activeId = newId as ChartMetaDataTypeEnum;
        this.resetInfoMessage();
    }

    @autobind
    @action
    onInfoMessageChange(newMessage: string) {
        this.infoMessage = newMessage;
        if (this.props.onInfoMessageChange) {
            this.props.onInfoMessageChange(newMessage);
        }
        setTimeout(this.resetInfoMessage, INFO_TIMEOUT);
    }

    @autobind
    @action
    resetInfoMessage() {
        this.infoMessage = '';
    }

    @computed
    get groupedChartMetaByDataType() {
        return _.chain(this.props.store.chartMetaSet)
            .values()
            .groupBy(chartMeta => chartMeta.dataType)
            .value();
    }

    @computed
    get genomicDataOptions(): ChartOption[] {
        const genomicDataOptions = getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[ChartMetaDataTypeEnum.GENOMIC] ||
                [],
            this.selectedAttrs,
            this.props.store.chartsType.toJS()
        );

        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            return genomicDataOptions.filter(
                option =>
                    option.chartType === ChartTypeEnum.BAR_CHART ||
                    option.chartType === ChartTypeEnum.PIE_CHART
            );
        } else {
            return genomicDataOptions;
        }
    }

    @computed
    get geneSpecificDataOptions(): ChartOption[] {
        const genomicDataOptions = getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[
                ChartMetaDataTypeEnum.GENE_SPECIFIC
            ] || [],
            this.selectedAttrs,
            this.props.store.chartsType.toJS()
        );
        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            return genomicDataOptions.filter(
                option =>
                    option.chartType === ChartTypeEnum.BAR_CHART ||
                    option.chartType === ChartTypeEnum.PIE_CHART
            );
        } else {
            return genomicDataOptions;
        }
    }

    @computed
    get clinicalDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[ChartMetaDataTypeEnum.CLINICAL] ||
                [],
            this.selectedAttrs,
            this.props.store.chartsType.toJS()
        );
    }

    @computed
    get customChartDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[
                ChartMetaDataTypeEnum.CUSTOM_DATA
            ] || [],
            this.selectedAttrs,
            this.props.store.chartsType.toJS()
        );
    }

    @computed
    get selectedAttrs(): string[] {
        return this.props.store.visibleAttributes.map(attr => attr.uniqueKey);
    }

    @computed
    get hideGeneSpecificTab() {
        return (
            this.props.disableGeneSpecificTab ||
            !this.props.store.molecularProfileOptions.isComplete ||
            (this.props.store.molecularProfileOptions.isComplete &&
                this.props.store.molecularProfileOptions.result.length === 0)
        );
    }

    @autobind
    @action
    private onAddAll(keys: string[]) {
        this.props.store.addCharts(this.selectedAttrs.concat(keys));

        const addInSummaryInfoMessage = `${keys.length} chart${
            keys.length > 1 ? 's' : ''
        } added`;
        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            this.infoMessage = `${keys.length} column${
                keys.length > 1 ? 's' : ''
            } added to table and ${addInSummaryInfoMessage} in Summary tab`;
        } else if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            this.infoMessage = addInSummaryInfoMessage;
        } else {
            this.infoMessage = `Added`;
        }
    }

    @autobind
    private onClearAll(keys: string[]) {
        this.props.store.updateChartsVisibility(
            _.reduce(
                this.selectedAttrs,
                (acc, attr) => {
                    if (!keys.includes(attr)) {
                        acc.push(attr);
                    }
                    return acc;
                },
                [] as string[]
            )
        );

        const removeInSummaryInfoMessage = `${keys.length} chart${
            keys.length > 1 ? 's' : ''
        } removed`;

        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            this.infoMessage = `${keys.length} column${
                keys.length > 1 ? 's' : ''
            } removed from table and ${removeInSummaryInfoMessage} from Summary tab`;
        } else if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            this.infoMessage = removeInSummaryInfoMessage;
        } else {
            this.infoMessage = `Removed`;
        }
    }

    @autobind
    @action
    private onToggleOption(chartUniqueKey: string) {
        const chartMeta = this.props.store.chartMetaSet[chartUniqueKey];
        if (chartMeta !== undefined) {
            const chartTypeName =
                ChartTypeNameEnum[
                    this.props.store.chartsType.get(chartUniqueKey)!
                ];
            if (this.selectedAttrs.includes(chartUniqueKey)) {
                this.props.store.resetFilterAndChangeChartVisibility(
                    chartUniqueKey,
                    false
                );
                let additionType = '';
                if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
                    additionType = ` ${chartTypeName}`;
                } else if (
                    this.props.currentTab ===
                    StudyViewPageTabKeyEnum.CLINICAL_DATA
                ) {
                    additionType = ' column';
                }

                trackEvent({
                    category: 'studyPage',
                    action: 'removeChart',
                    label: chartUniqueKey,
                });

                this.infoMessage = `${chartMeta.displayName}${additionType} is removed`;
            } else {
                this.props.store.addCharts(
                    this.selectedAttrs.concat([chartUniqueKey])
                );

                let additionType = '';
                if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
                    additionType = ` as a ${chartTypeName}`;
                } else if (
                    this.props.currentTab ===
                    StudyViewPageTabKeyEnum.CLINICAL_DATA
                ) {
                    additionType = ` to table and as ${chartTypeName} in Summary tab`;
                }
                this.infoMessage = `${chartMeta.displayName} added${additionType}`;

                trackEvent({
                    category: 'studyPage',
                    action: 'addChart',
                    label: chartUniqueKey,
                });
            }
        }
    }

    render() {
        return (
            <div
                style={{
                    width: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <MSKTabs
                    unmountOnHide={false}
                    activeTabId={this.activeId}
                    onTabClick={this.updateActiveId}
                    className="addChartTabs mainTabs"
                >
                    <MSKTab
                        key={0}
                        id={ChartMetaDataTypeEnum.CLINICAL}
                        linkText={TabNamesEnum.CLINICAL}
                        className="addClinicalChartTab"
                    >
                        <AddChartByType
                            options={this.clinicalDataOptions}
                            freqPromise={this.dataCount}
                            onAddAll={this.onAddAll}
                            onClearAll={this.onClearAll}
                            onToggleOption={this.onToggleOption}
                        />
                    </MSKTab>
                    <MSKTab
                        key={1}
                        id={ChartMetaDataTypeEnum.GENOMIC}
                        linkText={TabNamesEnum.GENOMIC}
                        hide={this.props.disableGenomicTab}
                        className="addGenomicChartTab"
                    >
                        <AddChartByType
                            options={this.genomicDataOptions}
                            freqPromise={this.dataCount}
                            onAddAll={this.onAddAll}
                            onClearAll={this.onClearAll}
                            onToggleOption={this.onToggleOption}
                        />
                    </MSKTab>
                    <MSKTab
                        key={2}
                        id={ChartMetaDataTypeEnum.GENE_SPECIFIC}
                        linkText={TabNamesEnum.GENE_SPECIFIC}
                        hide={this.hideGeneSpecificTab}
                    >
                        <GeneLevelSelection
                            molecularProfileOptionsPromise={
                                this.props.store.molecularProfileOptions
                            }
                            submitButtonText={'Add Chart'}
                            onSubmit={(charts: GenomicChart[]) => {
                                if (charts.length === 1) {
                                    const uniqueKey = getGenomicChartUniqueKey(
                                        charts[0].hugoGeneSymbol,
                                        charts[0].profileType
                                    );
                                    this.infoMessage = `${charts[0].name} ${
                                        this.selectedAttrs.includes(uniqueKey)
                                            ? 'is already'
                                            : 'has been'
                                    } added.`;
                                } else {
                                    this.infoMessage = `${charts.length} charts added`;
                                }
                                this.props.store.addGeneSpecificCharts(charts);
                            }}
                        />
                        {this.geneSpecificDataOptions.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <AddChartByType
                                    options={this.geneSpecificDataOptions}
                                    freqPromise={this.dataCount}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}
                                    hideControls={true}
                                    firstColumnHeaderName="Gene Specific Chart"
                                />
                            </div>
                        )}
                    </MSKTab>
                    <MSKTab
                        key={3}
                        id={ChartMetaDataTypeEnum.CUSTOM_DATA}
                        linkText={TabNamesEnum.CUSTOM_DATA}
                        hide={this.props.disableCustomTab}
                        className="custom"
                    >
                        <CustomCaseSelection
                            allSamples={this.props.store.samples.result}
                            selectedSamples={
                                this.props.store.selectedSamples.result
                            }
                            submitButtonText={'Add Chart'}
                            queriedStudies={
                                this.props.store.queriedPhysicalStudyIds.result
                            }
                            isChartNameValid={this.props.store.isChartNameValid}
                            getDefaultChartName={
                                this.props.store.getDefaultCustomChartName
                            }
                            onSubmit={(chart: CustomChart) => {
                                this.infoMessage = `${chart.name} has been added.`;
                                this.props.store.addCustomChart(chart);
                            }}
                        />
                        {this.customChartDataOptions.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <AddChartByType
                                    options={this.customChartDataOptions}
                                    freqPromise={this.dataCount}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}
                                    hideControls={true}
                                    firstColumnHeaderName="Custom Chart"
                                />
                            </div>
                        )}
                    </MSKTab>
                </MSKTabs>
                {this.props.store.isLoggedIn &&
                    this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY &&
                    this.props.store.showResetToDefaultButton && (
                        <button
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '18px',
                                zIndex: 2,
                            }}
                            className="btn btn-primary btn-xs"
                            onClick={this.props.showResetPopup}
                        >
                            Reset charts
                        </button>
                    )}
                {this.infoMessage && (
                    <SuccessBanner message={this.infoMessage} />
                )}
            </div>
        );
    }
}

@observer
export default class AddChartButton extends React.Component<
    IAddChartButtonProps,
    {}
> {
    @observable showTooltip = false;
    render() {
        return (
            <DefaultTooltip
                visible={this.showTooltip}
                onVisibleChange={visible => (this.showTooltip = !!visible)}
                trigger={['click']}
                placement={'bottomRight'}
                destroyTooltipOnHide={false}
                overlay={() => (
                    <AddChartTabs
                        store={this.props.store}
                        currentTab={this.props.currentTab}
                        disableGenomicTab={this.props.disableGenomicTab}
                        disableGeneSpecificTab={
                            this.props.disableGeneSpecificTab
                        }
                        disableCustomTab={this.props.disableCustomTab}
                        showResetPopup={this.props.showResetPopup}
                    />
                )}
                overlayClassName={this.props.addChartOverlayClassName}
            >
                <button
                    className={classNames('btn btn-primary btn-sm', {
                        active: this.showTooltip,
                    })}
                    style={{ marginLeft: '10px' }}
                    aria-pressed={this.showTooltip}
                    data-event={serializeEvent({
                        category: 'studyPage',
                        action: 'addChartMenuOpen',
                        label: this.props.store.studyIds.join(','),
                    })}
                    data-test="add-charts-button"
                >
                    {this.props.buttonText}
                </button>
            </DefaultTooltip>
        );
    }
}
