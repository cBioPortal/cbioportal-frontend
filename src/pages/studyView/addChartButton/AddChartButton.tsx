import * as React from 'react';
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    when,
} from 'mobx';
import { observer } from 'mobx-react';
import 'react-mfb/mfb.css';
import {
    StudyViewPageStore,
    StudyViewPageTabKey,
    GenomicChart,
    GenericAssayChart,
} from '../StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import autobind from 'autobind-decorator';
import _ from 'lodash';
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
import { deriveDisplayTextFromGenericAssayType } from 'pages/resultsView/plots/PlotsTabUtils';
import GenericAssaySelection from './genericAssaySelection/GenericAssaySelection';
import { makeGenericAssayOption } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { DataTypeConstants } from 'pages/resultsView/ResultsViewPageStore';
import { getInfoMessageForGenericAssayChart } from './AddChartButtonHelper';
import classnames from 'classnames';
import styles from './styles.module.scss';
import { openSocialAuthWindow } from 'shared/lib/openSocialAuthWindow';
import { CustomChartData } from 'shared/api/session-service/sessionServiceModels';
import ReactSelect from 'react-select';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';

export interface IAddChartTabsProps {
    store: StudyViewPageStore;
    currentTab: StudyViewPageTabKey;
    disableGenomicTab?: boolean;
    disableCustomTab?: boolean;
    disableGeneSpecificTab?: boolean;
    disableGenericAssayTabs?: boolean;
    onInfoMessageChange?: (newMessage: string) => void;
    showResetPopup: () => void;
    openShareCustomDataUrlModal: (chartIds: string[]) => void;
    defaultActiveTab?: ChartMetaDataTypeEnum;
}

export interface IAddChartButtonProps extends IAddChartTabsProps {
    buttonText: string;
    addChartOverlayClassName?: string;
    openShareCustomDataUrlModal: (chartIds: string[]) => void;
    isShareLinkModalVisible: boolean;
}

export type ChartOption = {
    label: string;
    key: string;
    chartType: ChartType;
    disabled?: boolean;
    selected?: boolean;
    freq: number;
    isSharedChart?: boolean;
};

export const INFO_TIMEOUT = 10000;
export const MIN_ADD_CHART_TOOLTIP_WIDTH = 400;
export const RESET_CHART_BUTTON_WIDTH = 70;
export const CONTAINER_PADDING_WIDTH = 20;

export enum TabNamesEnum {
    CUSTOM_DATA = 'Custom Data',
    CLINICAL = 'Clinical',
    GENOMIC = 'Genomic',
    GENE_SPECIFIC = 'Gene Specific',
}

@observer
class AddChartTabs extends React.Component<IAddChartTabsProps, {}> {
    @observable activeId: ChartMetaDataTypeEnum =
        this.props.defaultActiveTab || ChartMetaDataTypeEnum.CLINICAL;
    @observable infoMessage: string = '';
    @observable tabsWidth = 0;
    // Record user selected profile in each Generic Assay type
    private selectedGenericAssayProfileIdByType = observable.map<
        string,
        string
    >({}, { deep: true });
    @observable xVsYSelection: {
        x?: { value: string; label: string };
        y?: { value: string; label: string };
    } = {
        x: undefined,
        y: undefined,
    };
    private readonly tabsDivRef: React.RefObject<HTMLDivElement>;
    private genericAssayEntityOptionsReaction: IReactionDisposer;

    public static defaultProps = {
        disableGenomicTab: false,
        disableCustomTab: false,
        disableGeneSpecificTab: false,
        disableGenericAssayTabs: false,
    };

    constructor(props: IAddChartTabsProps, context: any) {
        super(props, context);
        makeObservable(this);
        this.tabsDivRef = React.createRef<HTMLDivElement>();

        // Using the first profile as default profile option to initialze genericAssayProfileOptionsByType
        this.genericAssayEntityOptionsReaction = when(
            () =>
                !_.isEmpty(
                    this.props.store.genericAssayProfileOptionsByType.result
                ),
            () =>
                _.forEach(
                    this.props.store.genericAssayProfileOptionsByType.result,
                    (options, type) => {
                        this.selectedGenericAssayProfileIdByType.set(
                            type,
                            options[0].value
                        );
                    }
                )
        );
    }

    componentDidMount(): void {
        this.setTabsWidth(this.tabsDivRef.current);
    }

    componentWillUnmount(): void {
        this.genericAssayEntityOptionsReaction();
    }

    readonly xVsYClinicalAttributes = remoteData({
        await: () => [this.props.store.chartClinicalAttributes],
        invoke: () => {
            return Promise.resolve(
                this.props.store.chartClinicalAttributes.result!.filter(
                    attr => {
                        return attr.datatype === 'NUMBER';
                    }
                )
            );
        },
        default: [],
    });

    readonly xVsYOptions = remoteData({
        await: () => [this.xVsYClinicalAttributes],
        invoke: () => {
            return Promise.resolve(
                this.xVsYClinicalAttributes.result!.map(attr => ({
                    value: attr.clinicalAttributeId,
                    label: attr.displayName,
                }))
            );
        },
        default: [],
    });
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

    @action.bound
    setTabsWidth(tab: HTMLDivElement | null) {
        if (tab) {
            this.tabsWidth = tab.offsetWidth;
        }
    }

    @computed get getTabsWidth(): number {
        let widthWithResetButton =
            this.tabsWidth +
            (this.showResetButton ? RESET_CHART_BUTTON_WIDTH : 0);
        if (widthWithResetButton > MIN_ADD_CHART_TOOLTIP_WIDTH) {
            return widthWithResetButton;
        } else {
            return MIN_ADD_CHART_TOOLTIP_WIDTH;
        }
    }

    @computed get showResetButton(): boolean {
        return (
            this.props.store.isLoggedIn &&
            this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY &&
            this.props.store.showResetToDefaultButton
        );
    }

    @action.bound
    updateActiveId(newId: string) {
        this.activeId = newId as ChartMetaDataTypeEnum;
        this.resetInfoMessage();
    }

    @action.bound
    updateInfoMessage(newMessage: string) {
        this.infoMessage = newMessage;
        setTimeout(this.resetInfoMessage, INFO_TIMEOUT);
    }

    @action.bound
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
    get genomicChartOptions(): ChartOption[] {
        const genomicDataOptions = getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[ChartMetaDataTypeEnum.GENOMIC] ||
                [],
            this.selectedAttrs,
            _.fromPairs(this.props.store.chartsType.toJSON())
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
    get geneSpecificChartOptions(): ChartOption[] {
        const genomicDataOptions = getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[
                ChartMetaDataTypeEnum.GENE_SPECIFIC
            ] || [],
            this.selectedAttrs,
            _.fromPairs(this.props.store.chartsType.toJSON())
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
    get genericAssayChartOptionsByGenericAssayType(): {
        [genericAssayType: string]: ChartOption[];
    } {
        const groupedChartMetaByGenericAssayType = _.groupBy(
            this.groupedChartMetaByDataType[
                ChartMetaDataTypeEnum.GENERIC_ASSAY
            ] || [],
            chartMeta => chartMeta.genericAssayType
        );

        return _.mapValues(groupedChartMetaByGenericAssayType, chartMeta => {
            return getOptionsByChartMetaDataType(
                chartMeta,
                this.selectedAttrs,
                _.fromPairs(this.props.store.chartsType.toJSON())
            );
        });
    }

    @computed
    get clinicalDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[ChartMetaDataTypeEnum.CLINICAL] ||
                [],
            this.selectedAttrs,
            _.fromPairs(this.props.store.chartsType.toJSON())
        );
    }

    @computed
    get customChartDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(
            this.groupedChartMetaByDataType[
                ChartMetaDataTypeEnum.CUSTOM_DATA
            ] || [],
            this.selectedAttrs,
            _.fromPairs(this.props.store.chartsType.toJSON()),
            this.props.store.isLoggedIn
                ? this.props.store.showCustomDataSelectionUI
                    ? this.props.store.isSharedCustomData
                    : undefined
                : this.props.store.isSharedCustomData
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
            !this.props.store.molecularProfileForGeneCharts.isComplete ||
            (this.props.store.molecularProfileForGeneCharts.isComplete &&
                this.props.store.molecularProfileForGeneCharts.result.length ===
                    0)
        );
    }

    @computed
    get hideGenericAssayTabs() {
        return (
            this.props.disableGenericAssayTabs ||
            !this.props.store.genericAssayProfiles.isComplete ||
            !this.props.store.genericAssayEntitiesGroupedByProfileId
                .isComplete ||
            (this.props.store.genericAssayProfiles.isComplete &&
                _.isEmpty(this.props.store.genericAssayProfiles.result))
        );
    }

    @action.bound
    private onGenericAssaySubmit(charts: GenericAssayChart[]) {
        // Update info message
        this.infoMessage = getInfoMessageForGenericAssayChart(
            charts,
            this.selectedAttrs
        );
        const chartsGroupedByDataType = _.groupBy(
            charts,
            chart => chart.dataType
        );
        // Add LIMITVALUE data as continuous chart
        if (!_.isEmpty(chartsGroupedByDataType[DataTypeConstants.LIMITVALUE])) {
            this.props.store.addGenericAssayContinuousCharts(
                chartsGroupedByDataType[DataTypeConstants.LIMITVALUE]
            );
        }
        // Add BINARY or CATEGORICAL data as categorical chart
        if (!_.isEmpty(chartsGroupedByDataType[DataTypeConstants.BINARY])) {
            this.props.store.addGenericAssayBinaryOrCategoricalCharts(
                chartsGroupedByDataType[DataTypeConstants.BINARY]
            );
        }
        if (
            !_.isEmpty(chartsGroupedByDataType[DataTypeConstants.CATEGORICAL])
        ) {
            this.props.store.addGenericAssayBinaryOrCategoricalCharts(
                chartsGroupedByDataType[DataTypeConstants.CATEGORICAL]
            );
        }
    }

    @action.bound
    private onSelectGenericAssayProfileByType(
        genericAssayType: string,
        profileId: string
    ) {
        this.selectedGenericAssayProfileIdByType.set(
            genericAssayType,
            profileId
        );
    }

    @action.bound
    private onAddAll(keys: string[]) {
        this.props.store.addCharts(this.selectedAttrs.concat(keys));

        const addInSummaryInfoMessage = `${keys.length} chart${
            keys.length > 1 ? 's' : ''
        } added`;
        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            this.updateInfoMessage(
                `${keys.length} column${
                    keys.length > 1 ? 's' : ''
                } added to table and ${addInSummaryInfoMessage} in Summary tab`
            );
        } else if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            this.updateInfoMessage(addInSummaryInfoMessage);
        } else {
            this.updateInfoMessage(`Added`);
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
            this.updateInfoMessage(
                `${keys.length} column${
                    keys.length > 1 ? 's' : ''
                } removed from table and ${removeInSummaryInfoMessage} from Summary tab`
            );
        } else if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            this.updateInfoMessage(removeInSummaryInfoMessage);
        } else {
            this.updateInfoMessage(`Removed`);
        }
    }

    @action.bound
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
                this.updateInfoMessage(
                    `${chartMeta.displayName}${additionType} is removed`
                );
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
                this.updateInfoMessage(
                    `${chartMeta.displayName} added${additionType}`
                );

                trackEvent({
                    category: 'studyPage',
                    action: 'addChart',
                    label: chartUniqueKey,
                });
            }
        }
    }

    @computed
    private get genericAssayTabs() {
        let tabs = [];
        // create one tab for each generic assay type
        tabs = _.map(
            this.props.store.genericAssayProfileOptionsByType.result,
            (options, type) => {
                // Generic Assay tabs will assign one Generic Assay type to one tab
                // And one tab can only has one selected profile at a time
                // selectedGenericAssayProfileIdByType been initialzed at the begining
                // so we know we can always find a selected profile for each Generic Assay type
                const molecularProfileIdsInType =
                    options.find(
                        option =>
                            option.value ===
                            this.selectedGenericAssayProfileIdByType.get(type)
                    )?.profileIds || [];
                const entities = _.reduce(
                    molecularProfileIdsInType,
                    (set, profileId) => {
                        this.props.store.genericAssayEntitiesGroupedByProfileId.result![
                            profileId
                        ].forEach(set.add, set);
                        return set;
                    },
                    new Set<GenericAssayMeta>()
                );

                const genericAssayEntityOptions = _.map(
                    Array.from(entities),
                    entity => makeGenericAssayOption(entity, false)
                );

                const shouldShowChartOptionTable =
                    this.genericAssayChartOptionsByGenericAssayType[type] &&
                    this.genericAssayChartOptionsByGenericAssayType[type]
                        .length > 0;
                const molecularProfileOptions = options.map(option => {
                    return {
                        ...option,
                        label: `${option.label} (${option.count} ${
                            option.patientLevel ? 'patients' : 'samples'
                        })`,
                        profileName: option.label,
                    };
                });

                return (
                    <MSKTab
                        key={type}
                        id={type}
                        linkText={deriveDisplayTextFromGenericAssayType(type)}
                    >
                        <GenericAssaySelection
                            containerWidth={this.getTabsWidth}
                            molecularProfileOptions={molecularProfileOptions}
                            submitButtonText={'Add Chart'}
                            genericAssayType={type}
                            genericAssayEntityOptions={
                                genericAssayEntityOptions
                            }
                            onChartSubmit={this.onGenericAssaySubmit}
                            onSelectGenericAssayProfile={profileId =>
                                this.onSelectGenericAssayProfileByType(
                                    type,
                                    profileId
                                )
                            }
                        />
                        {shouldShowChartOptionTable && (
                            <div style={{ marginTop: 10 }}>
                                <AddChartByType
                                    width={this.getTabsWidth}
                                    options={
                                        this
                                            .genericAssayChartOptionsByGenericAssayType[
                                            type
                                        ]
                                    }
                                    freqPromise={this.dataCount}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}
                                    hideControls={true}
                                    firstColumnHeaderName={`${deriveDisplayTextFromGenericAssayType(
                                        type
                                    )} Chart`}
                                />
                            </div>
                        )}
                    </MSKTab>
                );
            }
        );
        return tabs;
    }

    @computed get existSharedCustomData() {
        return _.some(
            this.customChartDataOptions,
            option => option.isSharedChart
        );
    }

    @computed get notificationMessages() {
        let notificationMessages: JSX.Element[] = [];
        if (this.props.store.customChartSet.size > 0) {
            // Notify if there any shared custom data
            if (this.existSharedCustomData) {
                notificationMessages.push(
                    <>
                        <span
                            className={classnames({
                                [styles.sharedChart]: true,
                            })}
                        >
                            Highlighted rows
                        </span>{' '}
                        are shared custom data.
                    </>
                );
            }
            // Notify that shared and page-session custom data are not saved for non-logged users
            if (
                !this.props.store.isLoggedIn &&
                this.props.store.appStore.isSocialAuthenticated
            ) {
                if (notificationMessages.length > 0) {
                    notificationMessages.push(<br />);
                }
                notificationMessages.push(
                    <>
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() =>
                                openSocialAuthWindow(this.props.store.appStore)
                            }
                        >
                            Login
                        </button>
                        &nbsp;to save custom data charts to your profile.
                    </>
                );
            } else if (this.existSharedCustomData) {
                // Notify if shared custom data are saved to user profile
                if (notificationMessages.length > 0) {
                    notificationMessages.push(<br />);
                }
                notificationMessages.push(
                    <>&nbsp;Custom charts are saved to your profile</>
                );
            }

            if (
                !_.isEmpty(this.props.store.customChartGroupMarkedForDeletion)
            ) {
                if (notificationMessages.length > 0) {
                    notificationMessages.push(<br />);
                }
                notificationMessages.push(
                    <span>
                        Deleted charts will be permanently removed when this
                        menu is closed. Any active filters based on deleted
                        charts will also be removed.
                    </span>
                );
            }
        }
        return notificationMessages;
    }

    @computed get selectedCustomChartIds() {
        return this.customChartDataOptions
            .filter(customData => !!customData.selected)
            .map(customData => customData.key);
    }

    @observable private showAddNewChart = false;

    @action.bound
    private onToggleAddNewChart() {
        this.showAddNewChart = !this.showAddNewChart;
    }

    @computed private get isAddNewChartWindowVisible() {
        return this.customChartDataOptions.length === 0 || this.showAddNewChart;
    }

    @observable private savingCustomData = false;

    @computed private get addXVsYChartButton() {
        let disabled = false;
        let text = 'Add Chart';
        if (!this.xVsYSelection.x || !this.xVsYSelection.y) {
            disabled = true;
        } else if (this.xVsYSelection.x.value === this.xVsYSelection.y.value) {
            disabled = true;
            text = 'Please choose two different attributes.';
        } else if (
            this.props.store.isXVsYChartVisible(
                this.xVsYSelection.x.value,
                this.xVsYSelection.y.value
            )
        ) {
            disabled = true;
            text = 'A chart with these attributes already exists';
        }

        return (
            <button
                className="btn btn-primary btn-sm"
                data-test={'x-vs-y-submit-btn'}
                disabled={disabled}
                onClick={
                    disabled
                        ? undefined
                        : action(() => {
                              this.props.store.addXVsYChart({
                                  xAttrId: this.xVsYSelection.x!.value,
                                  yAttrId: this.xVsYSelection.y!.value,
                              });
                              this.updateInfoMessage(
                                  `${this.xVsYSelection.y!.label} vs ${
                                      this.xVsYSelection.x!.label
                                  } added.`
                              );
                              this.xVsYSelection.x = undefined;
                              this.xVsYSelection.y = undefined;
                          })
                }
            >
                {text}
            </button>
        );
    }

    render() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                }}
                ref={this.tabsDivRef}
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
                            width={this.getTabsWidth}
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
                        hide={
                            this.props.disableGenomicTab ||
                            this.genomicChartOptions.length === 0
                        }
                        className="addGenomicChartTab"
                    >
                        <AddChartByType
                            width={this.getTabsWidth}
                            options={this.genomicChartOptions}
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
                            containerWidth={this.getTabsWidth}
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
                                    this.updateInfoMessage(
                                        `${charts[0].name} ${
                                            this.selectedAttrs.includes(
                                                uniqueKey
                                            )
                                                ? 'is already'
                                                : 'has been'
                                        } added.`
                                    );
                                } else {
                                    this.updateInfoMessage(
                                        `${charts.length} charts added`
                                    );
                                }
                                this.props.store.addGeneSpecificCharts(charts);
                            }}
                        />
                        {this.geneSpecificChartOptions.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <AddChartByType
                                    width={this.getTabsWidth}
                                    options={this.geneSpecificChartOptions}
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
                        <div
                            style={{
                                width:
                                    this.getTabsWidth - CONTAINER_PADDING_WIDTH,
                            }}
                        >
                            {this.customChartDataOptions.length > 0 && (
                                <button
                                    className="btn btn-primary btn-xs"
                                    onClick={this.onToggleAddNewChart}
                                >
                                    {this.isAddNewChartWindowVisible
                                        ? 'Cancel'
                                        : '+ Add new custom data'}
                                </button>
                            )}

                            {this.isAddNewChartWindowVisible && (
                                <CustomCaseSelection
                                    allSamples={this.props.store.samples.result}
                                    selectedSamples={
                                        this.props.store.selectedSamples.result
                                    }
                                    submitButtonText={'Add Chart'}
                                    queriedStudies={
                                        this.props.store.queriedPhysicalStudyIds
                                            .result
                                    }
                                    isChartNameValid={
                                        this.props.store.isChartNameValid
                                    }
                                    getDefaultChartName={
                                        this.props.store
                                            .getDefaultCustomChartName
                                    }
                                    disableSubmitButton={this.savingCustomData}
                                    onSubmit={(chart: CustomChartData) => {
                                        this.showAddNewChart = false;
                                        this.savingCustomData = true;
                                        this.updateInfoMessage(
                                            `Saving ${chart.displayName}`
                                        );
                                        this.props.store
                                            .addCustomChart(chart)
                                            .then(() => {
                                                this.savingCustomData = false;
                                                this.updateInfoMessage(
                                                    `${chart.displayName} has been added.`
                                                );
                                            });
                                    }}
                                />
                            )}

                            <>
                                {this.customChartDataOptions.length > 0 && (
                                    <>
                                        <hr
                                            style={{
                                                marginTop: 10,
                                                marginBottom: 10,
                                            }}
                                        />
                                        <AddChartByType
                                            width={this.getTabsWidth}
                                            options={
                                                this.customChartDataOptions
                                            }
                                            freqPromise={this.dataCount}
                                            onAddAll={this.onAddAll}
                                            onClearAll={this.onClearAll}
                                            onToggleOption={this.onToggleOption}
                                            hideControls={true}
                                            firstColumnHeaderName="Custom data"
                                            shareCharts={
                                                this.props
                                                    .openShareCustomDataUrlModal
                                            }
                                            deleteChart={(id: string) => {
                                                this.props.store.toggleCustomChartMarkedForDeletion(
                                                    id
                                                );
                                            }}
                                            restoreChart={(id: string) => {
                                                this.props.store.toggleCustomChartMarkedForDeletion(
                                                    id
                                                );
                                            }}
                                            markedForDeletion={
                                                this.props.store
                                                    .customChartGroupMarkedForDeletion
                                            }
                                        />
                                    </>
                                )}
                                {this.notificationMessages.length > 0 && (
                                    <>
                                        <br />
                                        <span className="text-warning">
                                            Note: {this.notificationMessages}
                                        </span>
                                    </>
                                )}
                            </>
                        </div>
                    </MSKTab>
                    <MSKTab
                        id={ChartMetaDataTypeEnum.X_VS_Y}
                        linkText={
                            <span>
                                X vs Y
                                <strong
                                    style={{ marginLeft: 5 }}
                                    className={'beta-text'}
                                >
                                    Beta!
                                </strong>
                            </span>
                        }
                        key={4}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div style={{ paddingBottom: 5 }}>
                                <span
                                    style={{
                                        float: 'left',
                                        paddingTop: 10,
                                        paddingRight: 7,
                                    }}
                                >
                                    X-Axis:
                                </span>
                                <ReactSelect
                                    name="x-vs-y-select-x"
                                    className={'xvsy-x-axis-selector'}
                                    placeholder={`Select x-axis clinical attribute`}
                                    closeMenuOnSelect={true}
                                    value={[this.xVsYSelection.x]}
                                    isMulti={false}
                                    isClearable={false}
                                    options={this.xVsYOptions.result}
                                    onChange={action((opt: any) => {
                                        this.xVsYSelection.x = opt;
                                    })}
                                />
                            </div>
                            <div style={{ paddingBottom: 15 }}>
                                <span
                                    style={{
                                        float: 'left',
                                        paddingTop: 10,
                                        paddingRight: 7,
                                    }}
                                >
                                    Y-Axis:
                                </span>
                                <ReactSelect
                                    name="x-vs-y-select-y"
                                    className={'xvsy-y-axis-selector'}
                                    placeholder={`Select y-axis clinical attribute`}
                                    closeMenuOnSelect={true}
                                    value={[this.xVsYSelection.y]}
                                    isMulti={false}
                                    isClearable={false}
                                    options={this.xVsYOptions.result}
                                    onChange={action((opt: any) => {
                                        this.xVsYSelection.y = opt;
                                    })}
                                />
                            </div>
                            {this.addXVsYChartButton}
                        </div>
                    </MSKTab>
                    {!this.hideGenericAssayTabs && this.genericAssayTabs}
                </MSKTabs>
                {this.showResetButton && (
                    <button
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 18,
                            zIndex: 2,
                        }}
                        className="btn btn-primary btn-xs"
                        onClick={this.props.showResetPopup}
                    >
                        Reset charts
                    </button>
                )}
                {this.infoMessage && !this.savingCustomData && (
                    <SuccessBanner message={this.infoMessage} />
                )}
                {this.savingCustomData && (
                    <div
                        className="alert alert-info"
                        style={{ marginTop: '10px', marginBottom: '0' }}
                    >
                        <span>
                            <i className="fa fa-spinner fa-spin" />{' '}
                            {this.infoMessage}
                        </span>
                    </div>
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
    constructor(props: IAddChartButtonProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get tabsLoading() {
        return (
            this.props.store.genericAssayProfileOptionsByType.isPending ||
            this.props.store.molecularProfileOptions.isPending ||
            this.props.store.genericAssayEntitiesGroupedByProfileId.isPending
        );
    }

    render() {
        return (
            <DefaultTooltip
                visible={
                    this.showTooltip ||
                    this.props.store.showCustomDataSelectionUI
                }
                onVisibleChange={visible => {
                    if (!this.props.isShareLinkModalVisible) {
                        this.showTooltip = !this.tabsLoading && !!visible;
                        this.props.store.showCustomDataSelectionUI = false;
                        if (!visible) {
                            this.props.store.deleteMarkedCustomData();
                        }
                    }
                }}
                trigger={['click']}
                placement={'bottomRight'}
                destroyTooltipOnHide={false}
                getTooltipContainer={() =>
                    document.getElementById('comparisonGroupManagerContainer')!
                }
                overlay={() => (
                    <AddChartTabs
                        store={this.props.store}
                        defaultActiveTab={this.props.defaultActiveTab}
                        currentTab={this.props.currentTab}
                        disableGenomicTab={this.props.disableGenomicTab}
                        disableGeneSpecificTab={
                            this.props.disableGeneSpecificTab
                        }
                        disableGenericAssayTabs={
                            this.props.disableGenericAssayTabs
                        }
                        disableCustomTab={this.props.disableCustomTab}
                        showResetPopup={this.props.showResetPopup}
                        openShareCustomDataUrlModal={
                            this.props.openShareCustomDataUrlModal
                        }
                    />
                )}
                overlayClassName={this.props.addChartOverlayClassName}
            >
                <button
                    className={classNames('btn btn-primary btn-sm', {
                        active: this.showTooltip,
                        disabled: this.tabsLoading,
                    })}
                    style={{ marginLeft: 10 }}
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
