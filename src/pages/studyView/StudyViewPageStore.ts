import _ from 'lodash';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import defaultClient from 'shared/api/cbioportalClientInstance';
import oncoKBClient from 'shared/api/oncokbClientInstance';
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
    toJS,
} from 'mobx';
import {
    AlterationFilter,
    AndedPatientTreatmentFilters,
    AndedSampleTreatmentFilters,
    BinsGeneratorConfig,
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
    ClinicalDataBinFilter,
    ClinicalDataCount,
    ClinicalDataCountFilter,
    ClinicalDataCountItem,
    ClinicalDataFilter,
    ClinicalDataMultiStudyFilter,
    ClinicalViolinPlotData,
    CopyNumberSeg,
    DataFilterValue,
    DensityPlotBin,
    GeneFilter,
    GeneFilterQuery,
    GenePanel,
    GenericAssayData,
    GenericAssayDataBin,
    GenericAssayDataBinFilter,
    GenericAssayDataCountFilter,
    GenericAssayDataCountItem,
    GenericAssayDataFilter,
    GenericAssayDataMultipleStudyFilter,
    GenericAssayMeta,
    GenomicDataBin,
    GenomicDataBinFilter,
    GenomicDataFilter,
    MolecularProfile,
    MolecularProfileFilter,
    NumericGeneMolecularData,
    OredPatientTreatmentFilters,
    OredSampleTreatmentFilters,
    Patient,
    PatientTreatmentRow,
    ResourceData,
    Sample,
    SampleIdentifier,
    SampleMolecularIdentifier,
    SampleTreatmentRow,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import {
    fetchCopyNumberSegmentsForSamples,
    getAlterationTypesInOql,
    getDefaultProfilesForOql,
    getSurvivalClinicalAttributesPrefix,
    MolecularAlterationType_filenameSuffix,
} from 'shared/lib/StoreUtils';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';
import {
    AnalysisGroup,
    annotationFilterActive,
    buildSelectedDriverTiersMap,
    calculateLayout,
    ChartDataCountSet,
    ChartMeta,
    ChartMetaDataTypeEnum,
    ChartMetaWithDimensionAndChartType,
    ChartType,
    clinicalAttributeComparator,
    ClinicalDataCountSummary,
    ClinicalDataTypeEnum,
    convertClinicalDataBinsToDataBins,
    convertGenericAssayDataBinsToDataBins,
    convertGenomicDataBinsToDataBins,
    DataBin,
    DataType,
    driverTierFilterActive,
    ensureBackwardCompatibilityOfFilters,
    FGA_PLOT_DOMAIN,
    FGA_VS_MUTATION_COUNT_KEY,
    findInvalidMolecularProfileIds,
    geneFilterQueryFromOql,
    geneFilterQueryToOql,
    generateXvsYScatterPlotDownloadData,
    getBinBounds,
    getCategoricalFilterValues,
    getChartMetaDataType,
    getChartSettingsMap,
    getClinicalDataCountWithColorByClinicalDataCount,
    getClinicalEqualityFilterValuesByString,
    getCNAByAlteration,
    getCNASamplesCount,
    getDataIntervalFilterValues,
    getDefaultPriorityByUniqueKey,
    getFilteredAndCompressedDataIntervalFilters,
    getFilteredMolecularProfilesByAlterationType,
    getFilteredSampleIdentifiers,
    getFilteredStudiesWithSamples,
    getFrequencyStr,
    getGenericAssayChartUniqueKey,
    getGenericAssayDataAsClinicalData,
    getGenomicChartUniqueKey,
    getGenomicDataAsClinicalData,
    getGroupsFromBins,
    getGroupsFromQuartiles,
    getMolecularProfileIdsFromUniqueKey,
    getNonZeroUniqueBins,
    getPriorityByClinicalAttribute,
    getQValue,
    getRequestedAwaitPromisesForClinicalData,
    getSamplesByExcludingFiltersOnChart,
    getSampleToClinicalData,
    getStructuralVariantSamplesCount,
    getUniqueKey,
    getUniqueKeyFromMolecularProfileIds,
    getUserGroupColor,
    isFiltered,
    isLogScaleByDataBins,
    makeXvsYDisplayName,
    makeXvsYUniqueKey,
    MolecularProfileOption,
    MUTATION_COUNT_PLOT_DOMAIN,
    NumericalGroupComparisonType,
    pickNewColorForClinicData,
    RectangleBounds,
    shouldShowChart,
    showOriginStudiesInSummaryDescription,
    SPECIAL_CHARTS,
    SpecialChartsUniqueKeyEnum,
    statusFilterActive,
    StudyWithSamples,
    submitToPage,
    updateCustomIntervalFilter,
    getAllClinicalDataByStudyViewFilter,
} from './StudyViewUtils';
import MobxPromise, { MobxPromiseUnionTypeWithDefault } from 'mobxpromise';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import autobind from 'autobind-decorator';
import {
    isQueriedStudyAuthorized,
    updateGeneQuery,
} from 'pages/studyView/StudyViewUtils';
import { generateDownloadFilenamePrefixByStudies } from 'shared/lib/FilenameUtils';
import { unparseOQLQueryLine } from 'shared/lib/oql/oqlfilter';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import windowStore from 'shared/components/window/WindowStore';
import { getHeatmapMeta } from '../../shared/lib/MDACCUtils';
import {
    ChartDimension,
    ChartTypeEnum,
    STUDY_VIEW_CONFIG,
    StudyViewLayout,
} from './StudyViewConfig';
import {
    getComparisonLoadingUrl,
    getMDAndersonHeatmapStudyMetaUrl,
    getStudyDownloadListUrl,
    redirectToComparisonPage,
} from '../../shared/api/urls';
import {
    DataType as DownloadDataType,
    onMobxPromise,
    pluralize,
    remoteData,
    stringListToSet,
    toPromise,
} from 'cbioportal-frontend-commons';
import request from 'superagent';
import { trackStudyViewFilterEvent } from '../../shared/lib/tracking';
import comparisonClient from '../../shared/api/comparisonGroupClientInstance';
import {
    finalizeStudiesAttr,
    getSampleIdentifiers,
    MAX_GROUPS_IN_SESSION,
    splitData,
    StudyViewComparisonGroup,
} from '../groupComparison/GroupComparisonUtils';
import { LoadingPhase } from '../groupComparison/GroupComparisonLoading';
import { sleepUntil } from '../../shared/lib/TimeUtils';
import ComplexKeyMap from '../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { CancerGene } from 'oncokb-ts-api-client';

import { AppStore } from 'AppStore';
import { getGeneCNAOQL } from 'pages/studyView/TableUtils';
import { MultiSelectionTableRow } from './table/MultiSelectionTable';
import {
    getGroupParameters,
    getSelectedGroups,
} from '../groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import { IStudyViewScatterPlotData } from './charts/scatterPlot/StudyViewScatterPlotUtils';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import { AlterationTypeConstants, DataTypeConstants } from 'shared/constants';
import {
    createSurvivalAttributeIdsDict,
    generateStudyViewSurvivalPlotTitle,
    getSurvivalStatusBoolean,
} from 'pages/resultsView/survival/SurvivalUtil';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    toTreatmentFilter,
    treatmentComparisonGroupName,
    treatmentUniqueKey,
} from './table/treatments/treatmentsTableUtil';
import StudyViewURLWrapper from './StudyViewURLWrapper';
import { isMixedReferenceGenome } from 'shared/lib/referenceGenomeUtils';
import { Datalabel } from 'shared/lib/DataUtils';
import PromisePlus from 'shared/lib/PromisePlus';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import {
    createAlteredGeneComparisonSession,
    doesChartHaveComparisonGroupsLimit,
    getCnaData,
    getMutationData,
    getSvData,
    groupSvDataByGene,
} from 'pages/studyView/StudyViewComparisonUtils';
import {
    CNA_AMP_VALUE,
    CNA_HOMDEL_VALUE,
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import {
    fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId,
    fetchGenericAssayMetaByMolecularProfileIdsGroupedByGenericAssayType,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import {
    buildDriverAnnotationSettings,
    DriverAnnotationSettings,
    IAnnotationFilterSettings,
    IDriverAnnotationReport,
    initializeCustomDriverAnnotationSettings,
} from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { ISettingsMenuButtonVisible } from 'shared/components/driverAnnotations/SettingsMenuButton';
import {
    CopyNumberEnrichmentEventType,
    MutationEnrichmentEventType,
} from 'shared/lib/comparison/ComparisonStoreUtils';
import { getServerConfig } from 'config/config';
import {
    ChartUserSetting,
    CustomChart,
    CustomChartData,
    CustomChartIdentifierWithValue,
    Group,
    SessionGroupData,
    StudyPageSettings,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import { PageType } from 'shared/userSession/PageType';
import client from 'shared/api/cbioportalClientInstance';
import { FeatureFlagEnum } from 'shared/featureFlags';

type ChartUniqueKey = string;
type ResourceId = string;
type ComparisonGroupId = string;
type AttributeId = string;

export type StudyViewPageTabKey =
    | StudyViewPageTabKeyEnum.CLINICAL_DATA
    | StudyViewPageTabKeyEnum.SUMMARY
    | StudyViewPageTabKeyEnum.HEATMAPS
    | StudyViewPageTabKeyEnum.CN_SEGMENTS;

export enum StudyViewPageTabDescriptions {
    SUMMARY = 'Summary',
    CLINICAL_DATA = 'Clinical Data',
    HEATMAPS = 'Heatmaps',
    CN_SEGMENTS = 'CN Segments',
}

const DEFAULT_CHART_NAME = 'Custom Data';
export const SELECTED_ANALYSIS_GROUP_VALUE = 'Selected';
export const UNSELECTED_ANALYSIS_GROUP_VALUE = 'Unselected';

export type SurvivalType = {
    id: string;
    title: string;
    associatedAttrs: string[];
    survivalStatusAttribute: ClinicalAttribute;
    filter: (s: string) => boolean;
    isLeftTruncationAvailable: boolean;
};

export type SurvivalData = {
    id: string;
    survivalData: PatientSurvival[];
    survivalDataWithoutLeftTruncation: PatientSurvival[];
};

export type StudyViewURLQuery = {
    tab?: StudyViewPageTabKeyEnum;
    id?: string;
    studyId?: string;
    resourceUrl?: string; // for open resource tabs
    cancer_study_id?: string;
    filterJson?: string;
    filterAttributeId?: string;
    filterValues?: string;
    sharedGroups?: string;
    sharedCustomData?: string;
};

export type XvsYScatterChart = {
    xAttr: ClinicalAttribute;
    yAttr: ClinicalAttribute;
    plotDomain?: {
        x?: { min?: number; max?: number };
        y?: { min?: number; max?: number };
    };
};

export type XvsYViolinChart = {
    categoricalAttr: ClinicalAttribute;
    numericalAttr: ClinicalAttribute;
    violinDomain?: { min?: number; max?: number };
};

export type XvsYChartSettings = {
    xLogScale?: boolean;
    yLogScale?: boolean;
    violinLogScale?: boolean;
    showViolin?: boolean;
    showBox?: boolean;
};

export type GenomicChart = {
    name?: string;
    description?: string;
    profileType: string;
    hugoGeneSymbol: string;
};

export type GenericAssayChart = {
    name?: string;
    description?: string;
    dataType?: string;
    profileType: string;
    genericAssayType: string;
    genericAssayEntityId: string;
    patientLevel?: boolean;
};

export const DataBinMethodConstants: { [key: string]: 'DYNAMIC' | 'STATIC' } = {
    STATIC: 'STATIC',
    DYNAMIC: 'DYNAMIC',
};

export type StatusMessage = {
    status: 'success' | 'warning' | 'danger' | 'info';
    message: string;
};

export type OncokbCancerGene = {
    oncokbAnnotated: boolean;
    isOncokbOncogene: boolean;
    isOncokbTumorSuppressorGene: boolean;
    isCancerGene: boolean;
};

export enum BinMethodOption {
    QUARTILE = 'QUARTILE',
    MEDIAN = 'MEDIAN',
    GENERATE = 'GENERATE',
    CUSTOM = 'CUSTOM',
}

export class StudyViewPageStore
    implements IAnnotationFilterSettings, ISettingsMenuButtonVisible {
    private reactionDisposers: IReactionDisposer[] = [];

    private chartItemToColor: Map<string, string>;
    private chartToUsedColors: Map<string, Set<string>>;

    public studyViewQueryFilter: StudyViewURLQuery;
    @observable
    driverAnnotationSettings: DriverAnnotationSettings = buildDriverAnnotationSettings(
        () => false
    );
    @observable includeGermlineMutations = true;
    @observable includeSomaticMutations = true;
    @observable includeUnknownStatusMutations = true;
    @observable isSettingsMenuVisible = false;

    @observable showComparisonGroupUI = false;
    @observable showCustomDataSelectionUI = false;
    @observable numberOfVisibleColorChooserModals = 0;
    @observable userGroupColors: { [groupId: string]: string } = {};

    @observable chartsBinMethod: { [chartKey: string]: BinMethodOption } = {};
    chartsBinsGeneratorConfigs = observable.map<string, BinsGeneratorConfig>();

    private getDataBinFilterSet(uniqueKey: string) {
        if (this.isGenericAssayChart(uniqueKey)) {
            return this._genericAssayDataBinFilterSet;
        } else if (this.isGeneSpecificChart(uniqueKey)) {
            return this._genomicDataBinFilterSet;
        } else {
            return this._clinicalDataBinFilterSet;
        }
    }
    @action
    toggleNAValue = (uniqueKey: string): void => {
        const filterSet = this.getDataBinFilterSet(uniqueKey);
        const newFilter = _.clone(filterSet.get(uniqueKey)!);
        newFilter.showNA = !this.isShowNAChecked(uniqueKey);
        filterSet.set(uniqueKey, newFilter as any);
    };

    public isShowNAChecked = (uniqueKey: string): boolean => {
        const filter = this.getDataBinFilterSet(uniqueKey).get(uniqueKey)!;
        const showNA = filter ? filter.showNA : undefined;

        // Show NA bars by default
        if (showNA === undefined) {
            return true;
        } else {
            return showNA as boolean;
        }
    };

    public isShowNAToggleVisible(dataBins: DataBin[]): boolean {
        return (
            dataBins.length !== 0 &&
            dataBins.some(dataBin => dataBin.specialValue === 'NA')
        );
    }

    constructor(
        public appStore: AppStore,
        private sessionServiceIsEnabled: boolean,
        private urlWrapper: StudyViewURLWrapper
    ) {
        makeObservable(this);

        this.chartItemToColor = new Map();
        this.chartToUsedColors = new Map();

        /*
        Note for future refactoring:
        We should not have to put a check here because ideally this would never be called unless we have valid studies.
        This can be achieved by a better control mechanism: as for all our fetches, they should be invoked by reference in view layer.
        Here, we fire this in constructor of store, which is an anti-pattern in our app.
         */
        this.reactionDisposers.push(
            reaction(
                () => this.loadingInitialDataForSummaryTab,
                () => {
                    if (!this.loadingInitialDataForSummaryTab) {
                        this.updateChartStats();
                        this.loadUserChartSettings();
                    }
                }
            )
        );

        this.reactionDisposers.push(
            reaction(
                () => [
                    this.visibleAttributes,
                    this.columns,
                    _.fromPairs(this.chartsDimension.toJSON()),
                    _.fromPairs(this.chartsType.toJSON()),
                ],
                () => {
                    this.updateLayout();
                }
            )
        );

        this.reactionDisposers.push(
            reaction(
                () => [
                    toJS(this.currentChartSettingsMap),
                    toJS(this.userGroupColors),
                ],
                () => {
                    if (this.isSavingUserSettingsPossible) {
                        if (!this.hideRestoreSettingsMsg) {
                            // hide restore message if its already shown
                            // this is because the user setting session is going to be updated for every operation once the user is logged in
                            this.hideRestoreSettingsMsg = true;
                        }

                        const groupColorSettingsFirstTime =
                            this.userSettings.result === undefined &&
                            Object.keys(this.userGroupColors).length > 0;
                        const groupColorSettingsChanged =
                            this.userSettings.result &&
                            (!this.userSettings.result!.groupColors ||
                                !_.isEqual(
                                    toJS(this.userGroupColors!),
                                    this.userSettings.result!.groupColors
                                ));
                        // for group color update immediately, for the rest wait 3 sec
                        if (
                            groupColorSettingsChanged ||
                            groupColorSettingsFirstTime
                        ) {
                            this.updateUserSettings();
                        } else this.updateUserSettingsDebounce();
                    }
                }
            )
        );

        this.reactionDisposers.push(
            reaction(
                () => this.userSettings.isComplete,
                isComplete => {
                    //execute if user log in from study page
                    if (
                        isComplete &&
                        this.isSavingUserPreferencePossible &&
                        !this._loadUserSettingsInitially
                    ) {
                        this.previousSettings = this.currentChartSettingsMap;
                        this.loadUserChartSettings();
                    }
                }
            )
        );

        // This reaction is used for public instance where login in optional and user tries to login from study page.
        // It load used saved custom data and also saves any shared or user created custom data charts without login into page.
        this.reactionDisposers.push(
            reaction(
                () => this.userSavedCustomData.isComplete,
                isComplete => {
                    //execute if user log in from study page
                    if (
                        isComplete &&
                        this.isSavingUserPreferencePossible &&
                        !this._loadUserSettingsInitially
                    ) {
                        this.updateCustomDataList(
                            this.userSavedCustomData.result,
                            true
                        );
                        this.saveSharedCustomDataToUserProfile(
                            Array.from(this.customChartSet.values())
                        );
                    }
                }
            )
        );

        // Include special charts into custom data list
        SPECIAL_CHARTS.forEach(
            (chartMeta: ChartMetaWithDimensionAndChartType) => {
                const uniqueKey = chartMeta.uniqueKey;
                if (!this.chartsType.has(uniqueKey)) {
                    this.chartsType.set(uniqueKey, chartMeta.chartType);
                }
                const chartType = this.chartsType.get(uniqueKey);
                if (chartType !== undefined) {
                    this._customCharts.set(uniqueKey, {
                        displayName: chartMeta.displayName,
                        uniqueKey: uniqueKey,
                        dataType: getChartMetaDataType(uniqueKey),
                        patientAttribute: chartMeta.patientAttribute,
                        description: chartMeta.description,
                        renderWhenDataChange: false,
                        priority:
                            STUDY_VIEW_CONFIG.priority[uniqueKey] ||
                            chartMeta.priority,
                    });
                    this.chartsType.set(uniqueKey, chartMeta.chartType);
                    this.chartsDimension.set(uniqueKey, chartMeta.dimension);
                }
            }
        );
    }

    @computed get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    @computed get isSavingUserPreferencePossible() {
        return this.isLoggedIn && this.sessionServiceIsEnabled;
    }

    @observable hideRestoreSettingsMsg = this.isLoggedIn;

    //this is set on initial load
    private _loadUserSettingsInitially = this.isLoggedIn;

    // make sure the reactions are disposed when the component which initialized store will unmount
    destroy(): void {
        for (const disposer of this.reactionDisposers) {
            disposer();
        }
    }

    private openResourceTabMap = observable.map<ResourceId, boolean>();
    @autobind
    public isResourceTabOpen(resourceId: string): boolean {
        return !!this.openResourceTabMap.get(resourceId);
    }
    @action.bound
    public setResourceTabOpen(resourceId: string, open: boolean): void {
        this.openResourceTabMap.set(resourceId, open);
    }

    @observable.ref
    private _comparisonConfirmationModal: JSX.Element | null = null;
    public get comparisonConfirmationModal(): JSX.Element | null {
        return this._comparisonConfirmationModal;
    }
    @action.bound
    public setComparisonConfirmationModal(
        getModal: (hideModal: () => void) => JSX.Element
    ): void {
        this._comparisonConfirmationModal = getModal(() => {
            this._comparisonConfirmationModal = null;
        });
    }

    // <comparison groups code>
    private _selectedComparisonGroups = observable.map<
        ComparisonGroupId,
        boolean
    >({}, { deep: false });
    private createdGroups = observable.map<ComparisonGroupId, boolean>(
        {},
        { deep: false }
    );
    private _selectedComparisonGroupsWarningSigns = observable.map<
        string,
        boolean
    >({}, { deep: false });
    private _comparisonGroupsMarkedForDeletion = observable.map<
        ComparisonGroupId,
        boolean
    >({}, { deep: false });

    private _customChartsMarkedForDeletion = observable.map<string, boolean>(
        {},
        { deep: false }
    );

    @action public trackNewlyCreatedGroup(groupId: string): void {
        this.createdGroups.set(groupId, true);
    }

    @action public setComparisonGroupSelected(
        groupId: string,
        selected = true
    ): void {
        this._selectedComparisonGroups.set(groupId, selected);
    }

    @action public toggleComparisonGroupSelected(groupId: string): void {
        if (this.isComparisonGroupSelected(groupId))
            this.showComparisonGroupWarningSign(groupId, false);
        this.setComparisonGroupSelected(
            groupId,
            !this.isComparisonGroupSelected(groupId)
        );
    }

    @action public toggleComparisonGroupMarkedForDeletion(
        groupId: string
    ): void {
        this._comparisonGroupsMarkedForDeletion.set(
            groupId,
            !this.isComparisonGroupMarkedForDeletion(groupId)
        );
    }

    @action public toggleCustomChartMarkedForDeletion(chartId: string): void {
        this._customChartsMarkedForDeletion.set(
            chartId,
            !this.isCustomChartGroupMarkedForDeletion(chartId)
        );
    }

    @action public showComparisonGroupWarningSign(
        groupId: string,
        markedValue: boolean
    ) {
        this._selectedComparisonGroupsWarningSigns.set(groupId, markedValue);
    }

    public isComparisonGroupSelected(groupId: string): boolean {
        if (this.isComparisonGroupMarkedForDeletion(groupId)) {
            return false; // if marked for deletion, its not selected
        } else if (!this._selectedComparisonGroups.has(groupId)) {
            return false; // default to unselected on page load
        } else {
            // otherwise, return value held in map
            return this._selectedComparisonGroups.get(groupId)!;
        }
    }

    public isComparisonGroupMarkedForDeletion(groupId: string): boolean {
        if (!this._comparisonGroupsMarkedForDeletion.has(groupId)) {
            return false; // default to no
        } else {
            // otherwise, return value held in map
            return this._comparisonGroupsMarkedForDeletion.get(groupId)!;
        }
    }

    public isCustomChartGroupMarkedForDeletion(chartId: string): boolean {
        return this._customChartsMarkedForDeletion.get(chartId) || false;
    }

    @computed
    public get customChartGroupMarkedForDeletion(): string[] {
        const customChartGroupMarkedForDeletion: string[] = [];
        this._customChartsMarkedForDeletion.forEach((key, value) => {
            if (key) {
                customChartGroupMarkedForDeletion.push(value);
            }
        });
        return customChartGroupMarkedForDeletion;
    }

    public isComparisonGroupMarkedWithWarningSign(groupId: string): boolean {
        return !!(
            this._selectedComparisonGroups.has(groupId) &&
            this._selectedComparisonGroupsWarningSigns.get(groupId)!
        );
    }

    @action public async deleteMarkedComparisonGroups(): Promise<void> {
        const deletionPromises = [];
        for (const groupId of this._comparisonGroupsMarkedForDeletion.keys()) {
            if (this.isComparisonGroupMarkedForDeletion(groupId)) {
                if (this.isLoggedIn) {
                    const promise = comparisonClient.deleteGroup(groupId);
                    deletionPromises.push(promise);
                    this._pendingChanges.push(new PromisePlus(promise));
                }
                // delete it even from the shared group set
                delete this.sharedGroupSet[groupId];
                this.createdGroups.delete(groupId);

                this._selectedComparisonGroups.delete(groupId);
            }
        }

        await Promise.all(deletionPromises);
        this._comparisonGroupsMarkedForDeletion.clear();
        this.notifyComparisonGroupsChange();
    }

    @action public async deleteMarkedCustomData(): Promise<void> {
        if (Array.from(this._customChartsMarkedForDeletion.keys()).length > 0) {
            const deletionPromises = [];
            for (const chartId of this._customChartsMarkedForDeletion.keys()) {
                if (this.isCustomChartGroupMarkedForDeletion(chartId)) {
                    if (this.isLoggedIn) {
                        const promise = sessionServiceClient.deleteCustomData(
                            chartId
                        );
                        deletionPromises.push(promise);
                    }
                    // delete it even from the shared group set
                    delete this.sharedCustomChartSet[chartId];
                    this.customChartSet.delete(chartId);
                    this._customCharts.delete(chartId);
                }
            }

            await Promise.all(deletionPromises);
            this._customChartsMarkedForDeletion.clear();
        }
    }

    public flagDuplicateColorsForSelectedGroups(
        groupUid: string,
        color: string | undefined
    ) {
        let colors: { [color: string]: number } = {};

        // check colors only for selected groups
        let selectedGroups = getSelectedGroups(
            this.comparisonGroups.result,
            this
        );

        selectedGroups.sort((a, b) => a.name.localeCompare(b.name));
        selectedGroups.forEach(
            (selectedGroup: StudyViewComparisonGroup, i: number) => {
                let groupColor =
                    selectedGroup.uid === groupUid
                        ? color
                        : this.userGroupColors[selectedGroup.uid];
                if (groupColor != undefined)
                    groupColor = groupColor.toLowerCase();

                if (
                    groupColor == undefined ||
                    colors[groupColor] == undefined
                ) {
                    if (groupColor != undefined) colors[groupColor] = 1;
                    this.showComparisonGroupWarningSign(
                        selectedGroup.uid,
                        false
                    );
                } else {
                    colors[groupColor] = colors[groupColor] + 1;
                    this.showComparisonGroupWarningSign(
                        selectedGroup.uid,
                        true
                    );
                }
            }
        );
    }

    // edge case: user deletes/add a group, then opens the panel again,
    //          and the getGroups request responds before the deleteGroup/addGroup
    //          request completes, thus showing a group that should be
    //          (and soon will be) deleted. We fix this by waiting
    //          until deletions/additions are done before allowing getGroups requests.
    @observable _pendingChanges: PromisePlus<any>[] = [];

    readonly pendingDecision = remoteData<boolean>({
        invoke: async () => {
            this._pendingChanges = this._pendingChanges.filter(
                x => x.status !== 'pending'
            );
            await Promise.all(this._pendingChanges.map(p => p.promise)); // wait for pending deletions to finish
            return false;
        },
        default: true,
    });

    //Save any shared groups to user profile if user login after page is loaded
    public async saveGroupsToUserProfile(
        groups: StudyViewComparisonGroup[]
    ): Promise<void> {
        if (this.isLoggedIn) {
            const addPromises: Promise<void>[] = [];
            groups.forEach(group => {
                // undefined for page session groups
                if (group.isSharedGroup || group.isSharedGroup === undefined) {
                    const promise = comparisonClient.addGroupToUser(group.uid);
                    addPromises.push(promise);
                }
            });
            await Promise.all(addPromises);
        }
    }

    //Save any shared custom data to user profile if user login after page is loaded
    public saveSharedCustomDataToUserProfile(
        customDataList: (ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        })[]
    ): void {
        if (this.isLoggedIn) {
            const addPromises: Promise<void>[] = [];
            customDataList.forEach(customData => {
                // undefined for page session groups
                if (
                    customData.isSharedChart ||
                    customData.isSharedChart === undefined
                ) {
                    const promise = sessionServiceClient.addCustomDataToUser(
                        customData.uniqueKey
                    );
                    addPromises.push(promise);
                }
            });
            Promise.all(addPromises);
        }
    }

    readonly userGroupsFromRemote = remoteData<StudyViewComparisonGroup[]>({
        await: () => [this.sampleSet, this.pendingDecision],
        invoke: async () => {
            // reference this so its responsive to changes
            this._comparisonGroupsChangeCount;
            if (
                this.studyIds.length > 0 &&
                (this.isLoggedIn ||
                    getServerConfig().authenticationMethod ===
                        'noauthsessionservice') &&
                !this.pendingDecision.result
            ) {
                const groups = await comparisonClient.getGroupsForStudies(
                    this.studyIds.slice()
                ); // slice because cant pass mobx

                return groups.map(group =>
                    Object.assign(
                        group.data,
                        {
                            uid: group.id,
                            isSharedGroup: false,
                            color: undefined,
                        },
                        finalizeStudiesAttr(group.data, this.sampleSet.result!)
                    )
                );
            }
            return [];
        },
        default: [],
    });

    readonly sharedGroups = remoteData<StudyViewComparisonGroup[]>({
        await: () => [
            this.sampleSet,
            this.queriedPhysicalStudyIds,
            this.userSettings,
        ],
        invoke: async () => {
            const promises: Promise<Group>[] = [];
            Object.keys(this.sharedGroupSet).forEach(groupId => {
                promises.push(comparisonClient.getGroup(groupId));
            });
            const studyIdsSet = stringListToSet(
                this.queriedPhysicalStudyIds.result!
            );
            const groups = await Promise.all(promises);
            return groups
                .filter(
                    group =>
                        !_.some(
                            group.data.studies,
                            study => studyIdsSet[study.id] === undefined
                        )
                )
                .map(group =>
                    Object.assign(
                        group.data,
                        {
                            uid: group.id,
                            isSharedGroup: true,
                            color: getUserGroupColor(
                                this.userGroupColors,
                                group.id
                            ),
                        },
                        finalizeStudiesAttr(group.data, this.sampleSet.result!)
                    )
                );
        },
        default: [],
    });

    readonly comparisonGroups = remoteData<StudyViewComparisonGroup[]>({
        await: () => [this.userGroupsFromRemote, this.sharedGroups],
        invoke: async () => {
            let groups: StudyViewComparisonGroup[] = _.cloneDeep(
                this.userGroupsFromRemote.result
            );
            let groupIdSet: { [s: string]: boolean } = stringListToSet(
                groups.map(group => group.uid)
            );
            if (this.sharedGroups.result.length > 0) {
                this.sharedGroups.result.forEach(sharedGroup => {
                    if (groupIdSet[sharedGroup.uid] === undefined) {
                        groups.push(sharedGroup);
                        groupIdSet[sharedGroup.uid] = true;
                    }
                });
            }

            // group present in page session which are not saved to user account
            const groupsIdsToFetchGroupData: string[] = Array.from(
                this.createdGroups.keys()
            ).filter(groupId => groupIdSet[groupId] === undefined);

            if (groupsIdsToFetchGroupData.length > 0) {
                const promises = groupsIdsToFetchGroupData.map(groupId =>
                    comparisonClient.getGroup(groupId)
                );
                const studyIdsSet = stringListToSet(
                    this.queriedPhysicalStudyIds.result!
                );
                let newGroups: Group[] = await Promise.all(promises);

                newGroups.forEach(group => {
                    if (_.every(group.data.studies, s => s.id in studyIdsSet)) {
                        groups.push(
                            Object.assign(
                                group.data,
                                { uid: group.id },
                                { color: undefined },
                                finalizeStudiesAttr(
                                    group.data,
                                    this.sampleSet.result!
                                )
                            )
                        );
                    }
                });
            }

            return groups;
        },
        default: [],
        onResult: groups => {
            this.saveGroupsToUserProfile(groups);
        },
    });

    /*
        Different scenarios that could be possible depending on user login state, shared custom data and newly added custom data
        1st - If the user is not logged in
                - loads any shared custom data
                - newly created custom data will have session scope (would be lost if the page is refreshed)
        2nd - if the user log in from study page
                - load custom data from user profile
                - loads any shared custom data and save them to user profile
                - if there were any new custom data befoe login they would be saved to user profile
        3rd - if the user is already logged in and visits study page
                - load custom data from user profile
                - loads any shared custom data and save them to user profile
                - any new custom data would be saved to user profile
    */
    readonly userSavedCustomData = remoteData<
        (ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        })[]
    >({
        invoke: async () => {
            if (this.studyIds.length > 0 && this.isLoggedIn) {
                const customChartsSessions = await sessionServiceClient.getCustomDataForStudies(
                    this.studyIds.slice()
                ); // slice because cant pass mobx

                return customChartsSessions.map(chustomChartsSession => {
                    return {
                        uniqueKey: chustomChartsSession.id,
                        displayName: chustomChartsSession.data.displayName,
                        description: chustomChartsSession.data.description,
                        priority: chustomChartsSession.data.priority,
                        dataType: ChartMetaDataTypeEnum.CUSTOM_DATA,
                        patientAttribute:
                            chustomChartsSession.data.patientAttribute,
                        renderWhenDataChange: false,
                        data: chustomChartsSession.data.data,
                        isSharedChart: false,
                        clinicalAttribute: {
                            clinicalAttributeId: chustomChartsSession.id,
                            datatype: chustomChartsSession.data.datatype,
                            displayName: chustomChartsSession.data.displayName,
                            description: chustomChartsSession.data.description,
                            patientAttribute:
                                chustomChartsSession.data.patientAttribute,
                            priority: chustomChartsSession.data.priority,
                        } as any,
                    };
                });
            }
            return [];
        },
        default: [],
        onResult: customDataList => {
            if (this._loadUserSettingsInitially) {
                this.updateCustomDataList(customDataList, true);
            }
        },
    });

    // these are custom data that are shared through the url.
    readonly sharedCustomData = remoteData<
        (ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        })[]
    >({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: async () => {
            const promises: Promise<CustomChart>[] = [];
            Object.keys(this.sharedCustomChartSet).forEach(chartId => {
                promises.push(sessionServiceClient.getCustomData(chartId));
            });
            const studyIdsSet = stringListToSet(
                this.queriedPhysicalStudyIds.result!
            );
            const customChartSessions = await Promise.all(promises);
            return customChartSessions
                .filter(
                    customChartSession =>
                        !_.some(
                            customChartSession.data.origin, //TODO: do we need to check for origin or all studies in data
                            studyId => studyIdsSet[studyId] === undefined
                        )
                )
                .map(customChartsSession => {
                    return {
                        uniqueKey: customChartsSession.id,
                        displayName: customChartsSession.data.displayName,
                        description: customChartsSession.data.description,
                        priority: customChartsSession.data.priority,
                        dataType: ChartMetaDataTypeEnum.CUSTOM_DATA,
                        patientAttribute:
                            customChartsSession.data.patientAttribute,
                        renderWhenDataChange: false,
                        data: customChartsSession.data.data,
                        isSharedChart: true,
                        clinicalAttribute: {
                            clinicalAttributeId: customChartsSession.id,
                            datatype: customChartsSession.data.datatype,
                            displayName: customChartsSession.data.displayName,
                            description: customChartsSession.data.description,
                            patientAttribute:
                                customChartsSession.data.patientAttribute,
                            priority: customChartsSession.data.priority,
                        } as any,
                    };
                });
        },
        default: [],
        onResult: customDataList => {
            this.updateCustomDataList(customDataList, false, true);
            this.saveSharedCustomDataToUserProfile(customDataList);
        },
    });

    @observable private _comparisonGroupsChangeCount = 0;
    @action public notifyComparisonGroupsChange(): void {
        this._comparisonGroupsChangeCount += 1;
    }

    @action.bound
    public onGroupColorChange(groupId: string, color: string) {
        if (color == undefined && this.userGroupColors[groupId]) {
            delete this.userGroupColors[groupId];
        } else this.userGroupColors[groupId] = color;
    }

    private async createNumberAttributeComparisonSession(
        chartMeta: ChartMeta,
        categorizationType: NumericalGroupComparisonType,
        statusCallback: (phase: LoadingPhase) => void
    ): Promise<string> {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);
        const promises: any = [this.selectedSamples];

        if (this.isGeneSpecificChart(chartMeta.uniqueKey)) {
            promises.push(this.genomicChartPromises[chartMeta.uniqueKey]);
        } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
            promises.push(this.genericAssayChartPromises[chartMeta.uniqueKey]);
        } else {
            promises.push(this.clinicalDataBinPromises[chartMeta.uniqueKey]);
        }

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (selectedSamples: Sample[], dataBins: DataBin[]) => {
                    let data: ClinicalData[] = [];

                    if (this.isGeneSpecificChart(chartMeta.uniqueKey)) {
                        const chartInfo = this._geneSpecificChartMap.get(
                            chartMeta.uniqueKey
                        )!;
                        data = await getGenomicDataAsClinicalData(
                            chartInfo,
                            this.molecularProfileMapByType,
                            selectedSamples
                        );
                    } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
                        const chartInfo = this._genericAssayChartMap.get(
                            chartMeta.uniqueKey
                        )!;
                        data = await getGenericAssayDataAsClinicalData(
                            chartInfo,
                            this.molecularProfileMapByType,
                            selectedSamples
                        );
                    } else {
                        const clinicalAttribute = chartMeta.clinicalAttribute;
                        if (clinicalAttribute) {
                            // get clinical data for the given attribute
                            const entityIdKey = clinicalAttribute.patientAttribute
                                ? 'patientId'
                                : 'sampleId';
                            if (selectedSamples.length === 0) {
                                data = [];
                            } else {
                                data = await defaultClient.fetchClinicalDataUsingPOST(
                                    {
                                        clinicalDataType: clinicalAttribute.patientAttribute
                                            ? ClinicalDataTypeEnum.PATIENT
                                            : ClinicalDataTypeEnum.SAMPLE,
                                        clinicalDataMultiStudyFilter: {
                                            attributeIds: [
                                                clinicalAttribute.clinicalAttributeId,
                                            ],
                                            identifiers: selectedSamples.map(
                                                s => ({
                                                    studyId: s.studyId,
                                                    entityId: s[entityIdKey],
                                                })
                                            ),
                                        },
                                    }
                                );
                            }
                        }
                    }

                    let groups: SessionGroupData[] = [];
                    let clinicalAttributeName: string | undefined;

                    switch (categorizationType) {
                        case NumericalGroupComparisonType.BINS:
                            groups = getGroupsFromBins(
                                selectedSamples,
                                chartMeta.patientAttribute,
                                data,
                                dataBins,
                                this.studyIds
                            );
                            clinicalAttributeName = `Bins of ${chartMeta.displayName}`;
                            break;
                        case NumericalGroupComparisonType.MEDIAN:
                            groups = getGroupsFromQuartiles(
                                selectedSamples,
                                chartMeta.patientAttribute,
                                splitData(data, 2),
                                this.studyIds
                            );
                            clinicalAttributeName = `Median of ${chartMeta.displayName}`;
                            break;
                        case NumericalGroupComparisonType.QUARTILES:
                        default:
                            groups = getGroupsFromQuartiles(
                                selectedSamples,
                                chartMeta.patientAttribute,
                                splitData(data, 4),
                                this.studyIds
                            );
                            clinicalAttributeName = `Quartiles of ${chartMeta.displayName}`;
                    }

                    statusCallback(LoadingPhase.CREATING_SESSION);
                    // create session and get id
                    const { id } = await comparisonClient.addComparisonSession({
                        groups,
                        clinicalAttributeName,
                        origin: this.studyIds,
                        groupNameOrder: groups.map(g => g.name),
                    });
                    return resolve(id);
                }
            );
        });
    }

    private createTreatmentsComparisonSession(
        chartMeta: ChartMeta,
        chartType: ChartType,
        treatmentUniqueKeys: string[],
        statusCallback: (phase: LoadingPhase) => void
    ): Promise<string> {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        // For patient treatments comparison, use all samples for that treatment, pre- and post-
        const isPatientType =
            chartType === ChartTypeEnum.PATIENT_TREATMENTS_TABLE ||
            chartType === ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE ||
            chartType === ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE;
        const promises = [this.selectedSampleSet, this.sampleTreatments];

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (
                    selectedSampleSet: ComplexKeyMap<Sample>,
                    sampleTreatments: SampleTreatmentRow[]
                ) => {
                    const treatmentKeysMap = _.keyBy(treatmentUniqueKeys);
                    const desiredTreatments = sampleTreatments.filter(
                        t =>
                            treatmentUniqueKey(t, isPatientType) in
                            treatmentKeysMap
                    );
                    // If sample type, then there will be exactly one treatment row per id.
                    // If patient type, potentially more than one treatment row per id because it ignores the time
                    const treatmentsGroupedById = _.groupBy(
                        desiredTreatments,
                        t => treatmentUniqueKey(t, isPatientType)
                    );

                    const groups = _.map(
                        treatmentsGroupedById,
                        treatmentRows => {
                            const selectedSampleIdentifiers = _.flatMap(
                                treatmentRows,
                                treatmentRow => {
                                    return treatmentRow.samples.filter(s =>
                                        selectedSampleSet.has(s, [
                                            'sampleId',
                                            'studyId',
                                        ])
                                    );
                                }
                            ).map(s => ({
                                studyId: s.studyId,
                                sampleId: s.sampleId,
                            }));
                            return getGroupParameters(
                                treatmentComparisonGroupName(
                                    treatmentRows[0],
                                    isPatientType
                                ),
                                selectedSampleIdentifiers,
                                this.studyIds
                            );
                        }
                    );

                    statusCallback(LoadingPhase.CREATING_SESSION);

                    // create session and get id
                    const { id } = await comparisonClient.addComparisonSession({
                        groups,
                        origin: this.studyIds,
                        clinicalAttributeName: chartMeta.displayName,
                    });
                    return resolve(id);
                }
            );
        });
    }

    private createSvGeneComparisonSession(
        chartMeta: ChartMeta,
        hugoGeneSymbols: string[],
        statusCallback: (phase: LoadingPhase) => void
    ): Promise<string> {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        // Get mutations among currently selected samples
        const promises: any[] = [
            this.selectedSamples,
            this.structuralVariantProfiles,
        ];

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (
                    selectedSamples: Sample[],
                    svProfiles: MolecularProfile[]
                ) => {
                    const svData = await getSvData(
                        selectedSamples,
                        svProfiles,
                        hugoGeneSymbols
                    );

                    const svByGene = groupSvDataByGene(svData, hugoGeneSymbols);

                    return resolve(
                        await createAlteredGeneComparisonSession(
                            chartMeta,
                            this.studyIds,
                            svByGene,
                            statusCallback
                        )
                    );
                }
            );
        });
    }

    private createCnaGeneComparisonSession(
        chartMeta: ChartMeta,
        hugoGeneSymbols: string[],
        statusCallback: (phase: LoadingPhase) => void
    ): Promise<string> {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        // Get mutations among currently selected samples
        const promises: any[] = [this.selectedSamples, this.cnaProfiles];

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (
                    selectedSamples: Sample[],
                    cnaProfiles: MolecularProfile[]
                ) => {
                    const cnaData = await getCnaData(
                        selectedSamples,
                        cnaProfiles,
                        hugoGeneSymbols
                    );
                    const cnaByGeneAndAlteration = _.groupBy(
                        cnaData.filter(
                            d =>
                                d.value === CNA_AMP_VALUE ||
                                d.value === CNA_HOMDEL_VALUE
                        ),
                        (d: NumericGeneMolecularData) =>
                            `${d.gene.hugoGeneSymbol}:${getCNAByAlteration(
                                d.value
                            )}`
                    );

                    return resolve(
                        await createAlteredGeneComparisonSession(
                            chartMeta,
                            this.studyIds,
                            cnaByGeneAndAlteration,
                            statusCallback
                        )
                    );
                }
            );
        });
    }

    private createMutatedGeneComparisonSession(
        chartMeta: ChartMeta,
        hugoGeneSymbols: string[],
        statusCallback: (phase: LoadingPhase) => void
    ): Promise<string> {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        // Get mutations among currently selected samples
        const promises: any[] = [this.selectedSamples, this.mutationProfiles];

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (
                    selectedSamples: Sample[],
                    mutationProfiles: MolecularProfile[]
                ) => {
                    const mutationData = await getMutationData(
                        selectedSamples,
                        mutationProfiles,
                        hugoGeneSymbols
                    );

                    const mutationsByGene = _.groupBy(
                        mutationData,
                        m => m.gene.hugoGeneSymbol
                    );

                    return resolve(
                        await createAlteredGeneComparisonSession(
                            chartMeta,
                            this.studyIds,
                            mutationsByGene,
                            statusCallback
                        )
                    );
                }
            );
        });
    }

    private createCategoricalAttributeComparisonSession(
        chartMeta: ChartMeta,
        clinicalAttributeValues: ClinicalDataCountSummary[],
        statusCallback: (phase: LoadingPhase) => void
    ): Promise<string> {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        const promises: any = [this.selectedSamples];
        if (chartMeta.uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
            promises.push(this.cancerStudyAsClinicalData);
        } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
            promises.push(this.genericAssayProfiles);
        }

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (
                    selectedSamples: Sample[],
                    clinicalDataList?: ClinicalData[]
                ) => {
                    let data: CustomChartIdentifierWithValue[] = [];

                    if (
                        this.isUserDefinedCustomDataChart(chartMeta.uniqueKey)
                    ) {
                        if (clinicalDataList === undefined) {
                            //combine studyId and sampleId to create sample unique key
                            const sampleKeyToData = _.keyBy(
                                this._customChartsSelectedCases.get(
                                    chartMeta.uniqueKey
                                ),
                                d => d.studyId + d.sampleId
                            );
                            data = selectedSamples.map(sample => {
                                const datum =
                                    sampleKeyToData[
                                        sample.studyId + sample.sampleId
                                    ];
                                return {
                                    sampleId: sample.sampleId,
                                    studyId: sample.studyId,
                                    value: datum ? datum.value : Datalabel.NA,
                                } as CustomChartIdentifierWithValue;
                            });
                        } else {
                            const selectedSampleByKey = _.keyBy(
                                selectedSamples,
                                (d: Sample) => d.uniqueSampleKey
                            );
                            data = _.filter(
                                clinicalDataList,
                                d =>
                                    selectedSampleByKey[d.uniqueSampleKey] !==
                                    undefined
                            );
                        }
                    } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
                        // get generic assay data for the given attribute
                        // patientAttribute and genericAssayChart are always exist
                        const isPatientAttribute = chartMeta.patientAttribute;
                        const genericAssayChart = this._genericAssayChartMap.get(
                            chartMeta.uniqueKey
                        )!;
                        const categorizedGenericAssayProfiles = _.chain(
                            this.genericAssayProfiles.result
                        )
                            .filter(
                                profile =>
                                    profile.genericAssayType ===
                                    genericAssayChart.genericAssayType
                            )
                            .groupBy(profile =>
                                getSuffixOfMolecularProfile(profile)
                            )
                            .value();
                        const sampleMolecularIdentifiers = _.flatMap(
                            categorizedGenericAssayProfiles[
                                genericAssayChart.profileType
                            ].map(profile => profile.molecularProfileId),
                            molecularId =>
                                _.map(this.samples.result, sample => {
                                    return {
                                        molecularProfileId: molecularId,
                                        sampleId: sample.sampleId,
                                    } as SampleMolecularIdentifier;
                                })
                        );
                        data = await defaultClient.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(
                            {
                                genericAssayDataMultipleStudyFilter: {
                                    genericAssayStableIds: [
                                        genericAssayChart.genericAssayEntityId,
                                    ],
                                    sampleMolecularIdentifiers,
                                } as GenericAssayDataMultipleStudyFilter,
                            } as any
                        );

                        const keyToData = isPatientAttribute
                            ? _.keyBy(
                                  data,
                                  (d: GenericAssayData) => d.uniquePatientKey
                              )
                            : _.keyBy(
                                  data,
                                  (d: GenericAssayData) => d.uniqueSampleKey
                              );
                        const getUniqueKeyFromSample = (sample: Sample) =>
                            isPatientAttribute
                                ? sample.uniquePatientKey
                                : sample.uniqueSampleKey;
                        data = selectedSamples.map(sample => {
                            const datum =
                                keyToData[getUniqueKeyFromSample(sample)];
                            return {
                                sampleId: sample.sampleId,
                                studyId: sample.studyId,
                                value: datum ? datum.value : Datalabel.NA,
                            } as CustomChartIdentifierWithValue;
                        });
                    } else {
                        // get clinical data for the given attribute
                        const isPatientAttribute =
                            (chartMeta.clinicalAttribute &&
                                chartMeta.clinicalAttribute.patientAttribute) ||
                            false;
                        const entityIdKey = isPatientAttribute
                            ? 'patientId'
                            : 'sampleId';
                        data = await defaultClient.fetchClinicalDataUsingPOST({
                            clinicalDataType: isPatientAttribute
                                ? 'PATIENT'
                                : 'SAMPLE',
                            clinicalDataMultiStudyFilter: {
                                attributeIds: [
                                    chartMeta.clinicalAttribute!
                                        .clinicalAttributeId,
                                ],
                                identifiers: selectedSamples.map(s => ({
                                    studyId: s.studyId,
                                    entityId: s[entityIdKey],
                                })),
                            },
                        });

                        if (isPatientAttribute) {
                            const patientKeyToData = _.keyBy(
                                data,
                                (d: ClinicalData) => d.uniquePatientKey
                            );
                            data = selectedSamples.map(sample => {
                                const datum =
                                    patientKeyToData[sample.uniquePatientKey];
                                return {
                                    sampleId: sample.sampleId,
                                    studyId: sample.studyId,
                                    value: datum ? datum.value : Datalabel.NA,
                                } as CustomChartIdentifierWithValue;
                            });
                        }
                    }

                    const lcValueToSampleIdentifiers = _.groupBy(data, d =>
                        d.value.toLowerCase()
                    );
                    const lcValueToColor = _.keyBy(clinicalAttributeValues, d =>
                        d.value.toLowerCase()
                    );

                    const groups: SessionGroupData[] = _.chain(
                        clinicalAttributeValues
                    )
                        .filter(attrVal => {
                            const lcValue = attrVal.value.toLowerCase();
                            const sampleIdentifiers =
                                lcValueToSampleIdentifiers[lcValue];
                            return (
                                sampleIdentifiers &&
                                sampleIdentifiers.length > 0
                            );
                        })
                        .sortBy(attrVal => -attrVal.count)
                        // slice max number of groups
                        // do not slice for comparison on cancer studies chart
                        .slice(
                            0,
                            doesChartHaveComparisonGroupsLimit(chartMeta)
                                ? MAX_GROUPS_IN_SESSION
                                : undefined
                        )
                        .map(attrVal => {
                            const lcValue = attrVal.value.toLowerCase();
                            const sampleIdentifiers =
                                lcValueToSampleIdentifiers[lcValue];
                            return getGroupParameters(
                                attrVal.value,
                                sampleIdentifiers,
                                this.studyIds,
                                lcValueToColor[lcValue].color
                            );
                        })
                        .value();

                    statusCallback(LoadingPhase.CREATING_SESSION);

                    // create session and get id
                    const { id } = await comparisonClient.addComparisonSession({
                        groups,
                        clinicalAttributeName: chartMeta.displayName,
                        origin: this.studyIds,
                    });
                    return resolve(id);
                }
            );
        });
    }

    @autobind
    public async openComparisonPage(
        chartMeta: ChartMeta,
        params: {
            // for numerical attribute
            categorizationType?: NumericalGroupComparisonType;
            // for string attribute
            clinicalAttributeValues?: ClinicalDataCountSummary[];
            // for altered genes tables
            hugoGeneSymbols?: string[];
            // for treatments tables
            treatmentUniqueKeys?: string[];
        }
    ): Promise<void> {
        // open window before the first `await` call - this makes it a synchronous window.open,
        //  which doesnt trigger pop-up blockers. We'll send it to the correct url once we get the result
        const comparisonWindow: any = window.open(
            getComparisonLoadingUrl({
                phase: LoadingPhase.DOWNLOADING_GROUPS,
                clinicalAttributeName: chartMeta.displayName,
                origin: this.studyIds.join(','),
            }),
            '_blank'
        );

        // wait until the new window has routingStore available, or its closed
        await sleepUntil(() => {
            return (
                comparisonWindow.closed ||
                (comparisonWindow.globalStores &&
                    comparisonWindow.globalStores.appStore.appReady)
            );
        });

        if (comparisonWindow.closed) {
            // cancel if the windows already closed
            return;
        }

        // set up ping by which the new window can infer whether the study view window has been closed, and
        //  show an error accordingly
        const pingInterval = setInterval(() => {
            try {
                if (!comparisonWindow.closed) {
                    comparisonWindow.ping();
                }
            } catch (e) {
                clearInterval(pingInterval);
            }
        }, 500);

        // save comparison session, and get id
        let comparisonId: string;
        const statusCallback = (phase: LoadingPhase) => {
            if (!comparisonWindow.closed) {
                comparisonWindow.routingStore.updateRoute(
                    { phase },
                    undefined,
                    false
                );
            }
        };

        const chartType = this.chartsType.get(chartMeta.uniqueKey);
        switch (chartType) {
            case ChartTypeEnum.PIE_CHART:
            case ChartTypeEnum.TABLE:
                comparisonId = await this.createCategoricalAttributeComparisonSession(
                    chartMeta,
                    params.clinicalAttributeValues!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.MUTATED_GENES_TABLE:
                comparisonId = await this.createMutatedGeneComparisonSession(
                    chartMeta,
                    params.hugoGeneSymbols!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.CNA_GENES_TABLE:
                comparisonId = await this.createCnaGeneComparisonSession(
                    chartMeta,
                    params.hugoGeneSymbols!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
                comparisonId = await this.createSvGeneComparisonSession(
                    chartMeta,
                    params.hugoGeneSymbols!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
            case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE:
            case ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE:
                comparisonId = await this.createTreatmentsComparisonSession(
                    chartMeta,
                    chartType,
                    params.treatmentUniqueKeys!,
                    statusCallback
                );
                break;
            default:
                comparisonId = await this.createNumberAttributeComparisonSession(
                    chartMeta,
                    params.categorizationType ||
                        NumericalGroupComparisonType.QUARTILES,
                    statusCallback
                );
                break;
        }

        clearInterval(pingInterval);

        if (!comparisonWindow.closed) {
            // redirect window to correct URL
            redirectToComparisonPage(comparisonWindow!, { comparisonId });
        }
    }
    // < / comparison groups code>

    @observable private initialFiltersQuery: Partial<StudyViewFilter> = {};

    @observable studyIds: string[] = [];

    private _clinicalDataFilterSet = observable.map<
        AttributeId,
        ClinicalDataFilter
    >({}, { deep: false });

    private _customDataFilterSet = observable.map<
        ChartUniqueKey,
        ClinicalDataFilter
    >({}, { deep: false });

    @observable private _genomicProfilesFilter: string[][] = [];
    @observable private _caseListsFilter: string[][] = [];
    @computed.struct get genomicProfilesFilter(): string[][] {
        return this._genomicProfilesFilter;
    }
    @computed.struct get caseListsFilter(): string[][] {
        return this._caseListsFilter;
    }

    @action public setGenomicProfilesFilter(p: string[][]): void {
        this._genomicProfilesFilter = p;
    }

    @action public setCaseListsFilter(p: string[][]): void {
        this._caseListsFilter = p;
    }

    private _customBinsFromScatterPlotSelectionSet = observable.map<
        ChartUniqueKey,
        number[]
    >({}, { deep: false });
    private _genomicDataIntervalFilterSet = observable.map<
        ChartUniqueKey,
        GenomicDataFilter
    >({}, { deep: false });
    private _genericAssayDataFilterSet = observable.map<
        ChartUniqueKey,
        GenericAssayDataFilter
    >({}, { deep: false });

    @observable private _clinicalDataBinFilterSet = observable.map<
        ChartUniqueKey,
        ClinicalDataBinFilter & { showNA?: boolean }
    >();
    @observable private _genomicDataBinFilterSet = observable.map<
        ChartUniqueKey,
        GenomicDataBinFilter & { showNA?: boolean }
    >();
    @observable private _genericAssayDataBinFilterSet = observable.map<
        ChartUniqueKey,
        GenericAssayDataBinFilter & { showNA?: boolean }
    >();

    @observable.ref private _geneFilterSet = observable.map<
        string,
        GeneFilterQuery[][]
    >();

    // TODO: make it computed
    // Currently the study view store does not have the full control of the promise.
    // ChartContainer should be modified, instead of accepting a promise, it should accept data and loading state.
    @observable private _chartVisibility = observable.map<
        ChartUniqueKey,
        boolean
    >();

    @observable.ref geneQueryStr: string;

    @observable public geneQueries: SingleGeneQuery[] = [];

    @observable public chartsDimension = observable.map<
        ChartUniqueKey,
        ChartDimension
    >();

    @observable public chartsType = observable.map<ChartUniqueKey, ChartType>();

    private newlyAddedCharts = observable.array<string>();

    @observable public sharedGroupSet: { [id: string]: boolean } = {};
    @observable public sharedCustomChartSet: { [id: string]: boolean } = {};

    private unfilteredClinicalDataCountCache: {
        [uniqueKey: string]: ClinicalDataCountItem;
    } = {};
    private unfilteredClinicalDataBinCountCache: {
        [uniqueKey: string]: DataBin[];
    } = {};

    @computed get currentTab(): StudyViewPageTabKey {
        return this.urlWrapper.tabId;
    }

    @observable pageStatusMessages: { [code: string]: StatusMessage } = {};

    public isNewlyAdded(uniqueKey: string): boolean {
        return this.newlyAddedCharts.includes(uniqueKey);
    }

    @action
    handleTabChange(id: string) {
        this.urlWrapper.setTab(id);
    }

    @action
    updateStoreByFilters(filters: Partial<StudyViewFilter>): void {
        // fixes filters in place to ensure backward compatiblity
        // as filter specification changes
        ensureBackwardCompatibilityOfFilters(filters);

        if (!_.isEmpty(filters.clinicalDataFilters)) {
            _.each(filters.clinicalDataFilters, filter => {
                this._clinicalDataFilterSet.set(filter.attributeId, {
                    attributeId: filter.attributeId,
                    values: _.reduce(
                        filter.values,
                        (acc, next) => {
                            acc.push({
                                end: next.end,
                                start: next.start,
                                value: next.value,
                            });
                            return acc;
                        },
                        [] as DataFilterValue[]
                    ),
                });
            });
        }
        if (
            _.isArray(filters.customDataFilters) &&
            filters.customDataFilters.length > 0
        ) {
            _.each(filters.customDataFilters, filter => {
                this.sharedCustomChartSet[filter.attributeId] = true;
                this._customDataFilterSet.set(filter.attributeId, {
                    attributeId: filter.attributeId,
                    values: _.reduce(
                        filter.values,
                        (acc, next) => {
                            acc.push({
                                end: next.end,
                                start: next.start,
                                value: next.value,
                            });
                            return acc;
                        },
                        [] as DataFilterValue[]
                    ),
                });
            });
        }

        if (!_.isEmpty(filters.geneFilters)) {
            filters.geneFilters!.forEach(geneFilter => {
                const key = getUniqueKeyFromMolecularProfileIds(
                    geneFilter.molecularProfileIds
                );
                this._geneFilterSet.set(key, _.clone(geneFilter.geneQueries));
            });
        }
        if (!_.isEmpty(filters.sampleIdentifiers)) {
            this.numberOfSelectedSamplesInCustomSelection = filters.sampleIdentifiers!.length;
            this.updateChartSampleIdentifierFilter(
                SpecialChartsUniqueKeyEnum.CUSTOM_SELECT,
                filters.sampleIdentifiers!,
                false
            );
        }

        if (filters.genomicProfiles !== undefined) {
            this.setGenomicProfilesFilter(filters.genomicProfiles);
        }

        this.setTreatmentFilters(filters);

        if (filters.caseLists !== undefined) {
            this.setCaseListsFilter(filters.caseLists);
        }

        if (!_.isEmpty(filters.genomicDataFilters)) {
            filters.genomicDataFilters!.forEach(genomicDataFilter => {
                const uniqueKey = getGenomicChartUniqueKey(
                    genomicDataFilter.hugoGeneSymbol,
                    genomicDataFilter.profileType
                );
                this._genomicDataIntervalFilterSet.set(
                    uniqueKey,
                    _.clone(genomicDataFilter)
                );
            });
        }

        if (!_.isEmpty(filters.genericAssayDataFilters)) {
            filters.genericAssayDataFilters!.forEach(genericAssayDataFilter => {
                const uniqueKey = getGenericAssayChartUniqueKey(
                    genericAssayDataFilter.stableId,
                    genericAssayDataFilter.profileType
                );
                this._genericAssayDataFilterSet.set(
                    uniqueKey,
                    _.clone(genericAssayDataFilter)
                );
            });
        }

        if (!_.isEqual(toJS(this.initialFiltersQuery), filters)) {
            this.initialFiltersQuery = filters;
        }
    }

    @action
    async updateStoreFromURL(query: StudyViewURLQuery): Promise<void> {
        let studyIdsString: string = '';
        let studyIds: string[] = [];
        if (query.studyId) {
            studyIdsString = query.studyId;
        }
        if (query.cancer_study_id) {
            studyIdsString = query.cancer_study_id;
        }
        if (query.id) {
            studyIdsString = query.id;
        }
        if (studyIdsString) {
            studyIds = studyIdsString.trim().split(',');
            if (!_.isEqual(studyIds, toJS(this.studyIds))) {
                // update if different
                this.studyIds = studyIds;
            }
        }
        if (query.sharedGroups) {
            this.sharedGroupSet = stringListToSet(
                query.sharedGroups.trim().split(',')
            );
            // Open group comparison manager if there are shared groups in the url
            this.showComparisonGroupUI = true;
        }
        if (query.sharedCustomData) {
            this.sharedCustomChartSet = stringListToSet(
                query.sharedCustomData.trim().split(',')
            );
            this.showCustomDataSelectionUI = true;
        }

        // We do not support studyIds in the query filters
        let filters: Partial<StudyViewFilter> = {};
        if (query.filterJson) {
            try {
                filters = JSON.parse(
                    decodeURIComponent(query.filterJson)
                ) as Partial<StudyViewFilter>;
                this.updateStoreByFilters(filters);
            } catch (e) {
                //  TODO: add some logging here?
            }
        } else if (query.filterAttributeId && query.filterValues) {
            const clinicalAttributes = _.uniqBy(
                await defaultClient.fetchClinicalAttributesUsingPOST({
                    studyIds: studyIds,
                }),
                clinicalAttribute =>
                    `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`
            );

            const matchedAttr = _.find(
                clinicalAttributes,
                (attr: ClinicalAttribute) =>
                    attr.clinicalAttributeId.toUpperCase() ===
                    query.filterAttributeId!.toUpperCase()
            );
            if (matchedAttr !== undefined) {
                if (matchedAttr.datatype == DataType.NUMBER) {
                    filters.clinicalDataFilters = [
                        {
                            attributeId: matchedAttr.clinicalAttributeId,
                            values: query
                                .filterValues!.split(',')
                                .map(range => {
                                    const convertResult = range.split('-');
                                    return {
                                        start: Number(convertResult[0]),
                                        end: Number(convertResult[1]),
                                    } as DataFilterValue;
                                }),
                        } as ClinicalDataFilter,
                    ];
                } else {
                    filters.clinicalDataFilters = [
                        {
                            attributeId: matchedAttr.clinicalAttributeId,
                            values: getClinicalEqualityFilterValuesByString(
                                query.filterValues
                            ).map(value => ({ value })),
                        } as ClinicalDataFilter,
                    ];
                }
                this.updateStoreByFilters(filters);
            } else {
                this.pageStatusMessages['unknownClinicalAttribute'] = {
                    message: `The clinical attribute ${query.filterAttributeId} is not available for this study`,
                    status: 'danger',
                };
            }
        }
    }

    @computed
    get initialFilters(): StudyViewFilter {
        let initialFilter = {} as StudyViewFilter;
        if (_.isEmpty(this.queriedSampleIdentifiers.result)) {
            initialFilter.studyIds = this.queriedPhysicalStudyIds.result;
        } else {
            initialFilter.sampleIdentifiers = this.queriedSampleIdentifiers.result;
        }

        const studyViewFilter: StudyViewFilter = Object.assign(
            {},
            toJS(this.initialFiltersQuery),
            initialFilter
        );

        if (this.customDriverAnnotationReport.isComplete) {
            const driverAnnotationSettings: DriverAnnotationSettings = buildDriverAnnotationSettings(
                () => false
            );
            initializeCustomDriverAnnotationSettings(
                this.customDriverAnnotationReport.result!,
                driverAnnotationSettings,
                driverAnnotationSettings.customTiersDefault
            );

            studyViewFilter.alterationFilter = ({
                // select all CNA types
                copyNumberAlterationEventTypes: {
                    [CopyNumberEnrichmentEventType.AMP]: true,
                    [CopyNumberEnrichmentEventType.HOMDEL]: true,
                },
                // select all mutation types
                mutationEventTypes: {
                    [MutationEnrichmentEventType.any]: true,
                },
                structuralVariants: null,
                includeDriver: driverAnnotationSettings.includeDriver,
                includeVUS: driverAnnotationSettings.includeVUS,
                includeUnknownOncogenicity:
                    driverAnnotationSettings.includeUnknownOncogenicity,
                includeUnknownTier: driverAnnotationSettings.includeUnknownTier,
                includeGermline: true,
                includeSomatic: true,
                includeUnknownStatus: true,
                tiersBooleanMap: this.selectedDriverTiersMap.isComplete
                    ? this.selectedDriverTiersMap.result!
                    : {},
            } as unknown) as AlterationFilter;
        }

        //studyViewFilter can only have studyIds or sampleIdentifiers
        if (!_.isEmpty(studyViewFilter.sampleIdentifiers)) {
            delete (studyViewFilter as Partial<StudyViewFilter>).studyIds;
        }

        return studyViewFilter;
    }

    @computed
    private get isInitialFilterState(): boolean {
        return _.isEqual(toJS(this.initialFilters), toJS(this.filters));
    }

    @computed
    get containerWidth(): number {
        return (
            this.columns * STUDY_VIEW_CONFIG.layout.grid.w +
            (this.columns + 1) * STUDY_VIEW_CONFIG.layout.gridMargin.x
        );
    }

    @computed
    private get columns(): number {
        return Math.floor(
            (windowStore.size.width - 40) /
                (STUDY_VIEW_CONFIG.layout.grid.w +
                    STUDY_VIEW_CONFIG.layout.gridMargin.x)
        );
    }

    @action.bound
    private updateLayout(): void {
        this.currentGridLayout = calculateLayout(
            this.visibleAttributes,
            this.columns,
            _.fromPairs(this.chartsDimension.toJSON()),
            this.useCurrentGridLayout ? this.currentGridLayout : [],
            this.currentFocusedChartByUser,
            this.currentFocusedChartByUserDimension
        );
        if (this.useCurrentGridLayout) {
            this.useCurrentGridLayout = false;
        }
    }

    // Minus the margin width
    @computed
    get studyViewPageLayoutProps(): StudyViewLayout {
        return {
            cols: this.columns,
            grid: STUDY_VIEW_CONFIG.layout.grid,
            gridMargin: STUDY_VIEW_CONFIG.layout.gridMargin,
            layout: this.currentGridLayout,
            dimensions: STUDY_VIEW_CONFIG.layout.dimensions,
        };
    }

    @action.bound
    updateCurrentGridLayout(newGridLayout: ReactGridLayout.Layout[]): void {
        this.currentGridLayout = newGridLayout;
    }

    //this variable is acts as flag whether to use it as a currentGridLayout in updating layout
    private useCurrentGridLayout = false;

    @observable.ref private currentGridLayout: ReactGridLayout.Layout[] = [];
    //@observable private currentGridLayoutUpdated = false;
    @observable private previousSettings: {
        [id: string]: ChartUserSetting;
    } = {};

    private currentFocusedChartByUser: ChartMeta | undefined = undefined;
    private currentFocusedChartByUserDimension:
        | ChartDimension
        | undefined = undefined;

    public clinicalDataBinPromises: {
        [id: string]: MobxPromise<DataBin[]>;
    } = {};
    public clinicalDataCountPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    } = {};
    public customDataCountPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    } = {};
    public genomicChartPromises: {
        [id: string]: MobxPromise<DataBin[]>;
    } = {};
    public genericAssayChartPromises: {
        [id: string]: MobxPromise<DataBin[]>;
    } = {};
    public genericAssayDataCountPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    } = {};

    private _chartSampleIdentifiersFilterSet = observable.map<
        ChartUniqueKey,
        SampleIdentifier[]
    >();

    public preDefinedCustomChartFilterSet = observable.map<
        ChartUniqueKey,
        ClinicalDataFilter
    >();

    @observable numberOfSelectedSamplesInCustomSelection: number = 0;
    @observable _filterComparisonGroups: StudyViewComparisonGroup[] = [];

    @observable private _filterMutatedGenesTableByCancerGenes: boolean = false;
    @observable private _filterSVGenesTableByCancerGenes: boolean = false;
    @observable private _filterCNAGenesTableByCancerGenes: boolean = false;

    @action.bound
    updateMutatedGenesTableByCancerGenesFilter(filtered: boolean): void {
        this._filterMutatedGenesTableByCancerGenes = filtered;
    }
    @action.bound
    updateSVGenesTableByCancerGenesFilter(filtered: boolean): void {
        this._filterSVGenesTableByCancerGenes = filtered;
    }

    @action.bound
    updateCNAGenesTableByCancerGenesFilter(filtered: boolean): void {
        this._filterCNAGenesTableByCancerGenes = filtered;
    }

    @computed get filterMutatedGenesTableByCancerGenes(): boolean {
        return (
            this.oncokbCancerGeneFilterEnabled &&
            this._filterMutatedGenesTableByCancerGenes
        );
    }

    @computed get filterSVGenesTableByCancerGenes(): boolean {
        return (
            this.oncokbCancerGeneFilterEnabled &&
            this._filterSVGenesTableByCancerGenes
        );
    }

    @computed get filterCNAGenesTableByCancerGenes(): boolean {
        return (
            this.oncokbCancerGeneFilterEnabled &&
            this._filterCNAGenesTableByCancerGenes
        );
    }

    public get filterComparisonGroups(): StudyViewComparisonGroup[] {
        return this._filterComparisonGroups;
    }

    @action public updateComparisonGroupsFilter(): void {
        onMobxPromise(this.comparisonGroups, comparisonGroups => {
            this._filterComparisonGroups = getSelectedGroups(
                comparisonGroups,
                this
            );
            this.updateChartSampleIdentifierFilter(
                SpecialChartsUniqueKeyEnum.SELECTED_COMPARISON_GROUPS,
                getSampleIdentifiers(this._filterComparisonGroups)
            );
        });
    }

    @observable private _customCharts = observable.map<
        ChartUniqueKey,
        ChartMeta
    >({}, { deep: false });

    //used in saving gene specific charts
    @observable private _geneSpecificChartMap = observable.map<
        ChartUniqueKey,
        GenomicChart
    >({}, { deep: false });
    @observable private _geneSpecificCharts = observable.map<
        ChartUniqueKey,
        ChartMeta
    >({}, { deep: false });
    //used in saving generic assay charts
    @observable private _genericAssayChartMap = observable.map<
        ChartUniqueKey,
        GenericAssayChart
    >({}, { deep: false });
    @observable private _genericAssayCharts = observable.map<
        ChartUniqueKey,
        ChartMeta
    >({}, { deep: false });
    private _XvsYViolinChartMap = observable.map<
        ChartUniqueKey,
        XvsYViolinChart
    >({}, { deep: true });
    private _XvsYScatterChartMap = observable.map<
        ChartUniqueKey,
        XvsYScatterChart
    >({}, { deep: true });
    private _XvsYCharts = observable.map<ChartUniqueKey, ChartMeta>(
        {},
        { deep: true }
    );
    private _XvsYChartSettings = observable.map<
        ChartUniqueKey,
        XvsYChartSettings
    >({}, { deep: true });

    @observable private _customChartsSelectedCases = observable.map<
        ChartUniqueKey,
        CustomChartIdentifierWithValue[]
    >({}, { deep: false });

    @observable customChartSet = observable.map<
        ChartUniqueKey,
        ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        }
    >({}, { deep: false });

    @observable private _newlyCreatedCustomChartSet = observable.map<
        ChartUniqueKey,
        ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        }
    >({}, { deep: false });

    getXvsYViolinChartInfo(uniqueKey: string): XvsYViolinChart | undefined {
        return this._XvsYViolinChartMap.get(uniqueKey);
    }
    getXvsYScatterChartInfo(uniqueKey: string): XvsYScatterChart | undefined {
        return this._XvsYScatterChartMap.get(uniqueKey);
    }
    getXvsYChartSettings(uniqueKey: string): XvsYChartSettings | undefined {
        return this._XvsYChartSettings.get(uniqueKey);
    }
    getXvsYChartMeta(uniqueKey: string): ChartMeta | undefined {
        return this._XvsYCharts.get(uniqueKey);
    }
    @action.bound
    swapXvsYChartAxes(uniqueKey: string): void {
        const chart = this.getXvsYScatterChartInfo(uniqueKey)!;
        const settings = this.getXvsYChartSettings(uniqueKey)!;
        const chartMeta = this.getXvsYChartMeta(uniqueKey)!;

        const xAttr = chart.xAttr;
        chart.xAttr = chart.yAttr;
        chart.yAttr = xAttr;

        const xLog = settings.xLogScale;
        settings.xLogScale = settings.yLogScale;
        settings.yLogScale = xLog;

        chartMeta.displayName = makeXvsYDisplayName(chart.xAttr, chart.yAttr);

        // trigger rerender
        this.changeChartVisibility(uniqueKey, false);
        this.changeChartVisibility(uniqueKey, true);
    }
    isXvsYChartVisible(attrIdA: string, attrIdB: string) {
        const charts = this._XvsYScatterChartMap.entries();
        let matchingChartKey: ChartUniqueKey | null = null;
        for (const [chartKey, chart] of charts) {
            const chartAttrIds = [
                chart.xAttr.clinicalAttributeId,
                chart.yAttr.clinicalAttributeId,
            ];
            if (
                chartAttrIds.includes(attrIdA) &&
                chartAttrIds.includes(attrIdB)
            ) {
                matchingChartKey = chartKey;
                break;
            }
        }
        return (
            matchingChartKey !== null &&
            !!this._chartVisibility.get(matchingChartKey)
        );
    }

    @action.bound
    onCheckGene(hugoGeneSymbol: string): void {
        //only update geneQueryStr whenever a table gene is clicked.
        this.geneQueries = updateGeneQuery(this.geneQueries, hugoGeneSymbol);
        this.geneQueryStr = this.geneQueries
            .map(query => unparseOQLQueryLine(query))
            .join(' ');
    }

    @action.bound
    isSharedCustomData(chartId: string): boolean {
        return this.customChartSet.has(chartId)
            ? this.customChartSet.get(chartId)?.isSharedChart || false
            : false;
    }

    @computed get selectedGenes(): string[] {
        return this.geneQueries.map(singleGeneQuery => singleGeneQuery.gene);
    }

    @action.bound
    updateSelectedGenes(query: SingleGeneQuery[], queryStr: string): void {
        this.geneQueries = query;
        this.geneQueryStr = queryStr;
    }

    @computed get alterationTypesInOQL(): {
        haveMutInQuery: boolean;
        haveCnaInQuery: boolean;
        haveMrnaInQuery: boolean;
        haveProtInQuery: boolean;
        haveStructuralVariantInQuery: boolean;
    } {
        return getAlterationTypesInOql(this.geneQueries);
    }

    @computed get defaultProfilesForOql():
        | {
              [x: string]: MolecularProfile | undefined;
          }
        | undefined {
        if (this.molecularProfiles.isComplete) {
            return getDefaultProfilesForOql(this.molecularProfiles.result);
        }
        return undefined;
    }
    @computed get defaultMutationProfile(): MolecularProfile | undefined {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.MUTATION_EXTENDED
            ]
        );
    }

    @computed get defaultStructuralVariantProfile():
        | MolecularProfile
        | undefined {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.STRUCTURAL_VARIANT
            ]
        );
    }

    @computed get defaultCnaProfile(): MolecularProfile | undefined {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.COPY_NUMBER_ALTERATION
            ]
        );
    }
    @computed get defaultMrnaProfile(): MolecularProfile | undefined {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[AlterationTypeConstants.MRNA_EXPRESSION]
        );
    }
    @computed get defaultProtProfile(): MolecularProfile | undefined {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[AlterationTypeConstants.PROTEIN_LEVEL]
        );
    }

    @action.bound
    clearAllFilters(): void {
        this._clinicalDataFilterSet.clear();
        this._customDataFilterSet.clear();
        this._geneFilterSet.clear();
        this._genomicDataIntervalFilterSet.clear();
        this._genericAssayDataFilterSet.clear();
        this._chartSampleIdentifiersFilterSet.clear();
        this.preDefinedCustomChartFilterSet.clear();
        this.numberOfSelectedSamplesInCustomSelection = 0;
        this.removeComparisonGroupSelectionFilter();
        this._customBinsFromScatterPlotSelectionSet.clear();
        this.setGenomicProfilesFilter([]);
        this.setCaseListsFilter([]);
        this.clearPatientTreatmentFilters();
        this.clearPatientTreatmentGroupFilters();
        this.clearPatientTreatmentTargetFilters();
        this.clearSampleTreatmentFilters();
        this.clearSampleTreatmentGroupFilters();
        this.clearSampleTreatmentTargetFilters();
    }

    @computed
    get analysisGroupsSettings(): {
        groups: AnalysisGroup[];
    } {
        // analysis groups for selected/unselected
        // unselected goes on bottom, selected should be rendered on top
        return {
            groups: [
                {
                    value: SELECTED_ANALYSIS_GROUP_VALUE,
                    // In the initial load when no case selected(the same affect of all cases selected), the curve should be shown as blue instead of red
                    color: STUDY_VIEW_CONFIG.colors.theme.unselectedGroup,
                    name: this.chartsAreFiltered
                        ? 'Selected patients'
                        : 'All patients',
                },
            ] as AnalysisGroup[],
        };
    }

    readonly sampleToAnalysisGroup = remoteData({
        await: () => [this.samples, this.selectedSamples],
        invoke: () => {
            const selectedSamplesMap = _.keyBy(
                this.selectedSamples.result!,
                s => s.uniqueSampleKey
            );
            return Promise.resolve(
                _.reduce(
                    this.samples.result!,
                    (map, nextSample) => {
                        const sampleKey = nextSample.uniqueSampleKey;
                        if (sampleKey in selectedSamplesMap) {
                            map[sampleKey] = SELECTED_ANALYSIS_GROUP_VALUE;
                        } else {
                            map[sampleKey] = UNSELECTED_ANALYSIS_GROUP_VALUE;
                        }
                        return map;
                    },
                    {} as { [sampleKey: string]: string }
                )
            );
        },
    });

    readonly patientToAnalysisGroup = remoteData<{
        [patientKey: string]: string;
    }>({
        await: () => [this.samples, this.selectedPatientKeys],
        invoke: () => {
            const selectedPatientsMap = _.keyBy(
                this.selectedPatientKeys.result!
            );
            return Promise.resolve(
                _.reduce(
                    this.samples.result!,
                    (map, nextSample) => {
                        const patientKey = nextSample.uniquePatientKey;
                        if (patientKey in selectedPatientsMap) {
                            map[patientKey] = SELECTED_ANALYSIS_GROUP_VALUE;
                        }
                        return map;
                    },
                    {} as { [patientKey: string]: string }
                )
            );
        },
    });

    readonly hasRawDataForDownload = remoteData<boolean>({
        invoke: async () => {
            if (this.studyIds.length === 1) {
                const response = await request(getStudyDownloadListUrl());
                return response.body.includes(this.studyIds[0]);
            } else {
                return false;
            }
        },
        onError: () => false,
        default: false,
    });

    @action.bound
    updateClinicalDataIntervalFilters(
        chartUniqueKey: string,
        dataBins: DataBin[]
    ): void {
        if (
            chartUniqueKey ===
            SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
        ) {
            this._customBinsFromScatterPlotSelectionSet.delete(
                SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
            );
        }
        if (chartUniqueKey === SpecialChartsUniqueKeyEnum.MUTATION_COUNT) {
            this._customBinsFromScatterPlotSelectionSet.delete(
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT
            );
        }

        trackStudyViewFilterEvent('clinicalDataInterval', this);

        const values: DataFilterValue[] = getDataIntervalFilterValues(dataBins);
        this.updateClinicalDataFilterByValues(chartUniqueKey, values);
    }

    @action.bound
    updateClinicalDataFilterByValues(
        chartUniqueKey: string,
        values: DataFilterValue[]
    ): void {
        if (this.chartMetaSet[chartUniqueKey]) {
            let chartMeta = this.chartMetaSet[chartUniqueKey];
            trackStudyViewFilterEvent('clinicalDataFilters', this);
            this.updateClinicalAttributeFilterByValues(
                chartMeta.clinicalAttribute!.clinicalAttributeId,
                values
            );
        }
    }
    @action.bound
    updateClinicalAttributeFilterByValues(
        clinicalAttributeId: string,
        values: DataFilterValue[]
    ): void {
        if (values.length > 0) {
            const clinicalDataFilter = {
                attributeId: clinicalAttributeId,
                values: values,
            };
            this._clinicalDataFilterSet.set(
                clinicalAttributeId,
                clinicalDataFilter
            );
        } else {
            this._clinicalDataFilterSet.delete(clinicalAttributeId);
        }
    }

    @action.bound
    async updateClinicalDataCustomIntervalFilter(
        clinicalAttributeId: string,
        newRange: { start?: number; end?: number }
    ) {
        await updateCustomIntervalFilter(
            newRange,
            ({
                uniqueKey: clinicalAttributeId,
                clinicalAttribute: { clinicalAttributeId },
            } as any) as ChartMeta,
            this.getClinicalDataBin,
            this.getClinicalDataFiltersByUniqueKey,
            this.updateCustomBins,
            this.updateClinicalDataIntervalFilters
        );
    }

    @action.bound
    setCustomChartFilters(chartUniqueKey: string, values: string[]): void {
        if (this.chartMetaSet[chartUniqueKey]) {
            if (values.length > 0) {
                const clinicalDataFilter = {
                    attributeId: chartUniqueKey,
                    values: values.map(value => ({ value } as DataFilterValue)),
                };
                if (
                    chartUniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                ) {
                    // this is for pre-defined custom charts
                    let filteredSampleIdentifiers = getFilteredSampleIdentifiers(
                        this.samples.result.filter(sample =>
                            values.includes(sample.studyId)
                        )
                    );
                    this._chartSampleIdentifiersFilterSet.set(
                        chartUniqueKey,
                        filteredSampleIdentifiers
                    );
                    this.preDefinedCustomChartFilterSet.set(
                        chartUniqueKey,
                        clinicalDataFilter
                    );
                } else {
                    this._customDataFilterSet.set(
                        chartUniqueKey,
                        clinicalDataFilter
                    );
                }
            } else {
                if (
                    chartUniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                ) {
                    // this is for pre-defined custom charts
                    this._chartSampleIdentifiersFilterSet.delete(
                        chartUniqueKey
                    );
                    this.preDefinedCustomChartFilterSet.delete(chartUniqueKey);
                } else {
                    this._customDataFilterSet.delete(chartUniqueKey);
                }
            }
        }
    }

    @action.bound
    updateGenomicDataIntervalFilters(
        uniqueKey: string,
        dataBins: Pick<GenomicDataBin, 'start' | 'end' | 'specialValue'>[]
    ): void {
        trackStudyViewFilterEvent('genomicDataInterval', this);

        const values: DataFilterValue[] = getDataIntervalFilterValues(dataBins);
        this.updateGenomicDataIntervalFiltersByValues(uniqueKey, values);
    }

    @action.bound
    updateGenericAssayDataFilters(
        uniqueKey: string,
        dataBins: Pick<GenericAssayDataBin, 'start' | 'end' | 'specialValue'>[]
    ): void {
        trackStudyViewFilterEvent('genericAssayDataInterval', this);

        const values: DataFilterValue[] = getDataIntervalFilterValues(dataBins);
        this.updateGenericAssayDataFiltersByValues(uniqueKey, values);
    }

    @action.bound
    updateCategoricalGenericAssayDataFilters(
        uniqueKey: string,
        values: string[]
    ): void {
        trackStudyViewFilterEvent('genericAssayCategoricalData', this);

        const dataFilterValues: DataFilterValue[] = getCategoricalFilterValues(
            values
        );
        this.updateGenericAssayDataFiltersByValues(uniqueKey, dataFilterValues);
    }

    @action.bound
    updateScatterPlotFilterByValues(
        chartUniqueKey: string,
        bounds?: RectangleBounds
    ): void {
        const chartInfo = this.getXvsYScatterChartInfo(chartUniqueKey)!;
        if (bounds === undefined) {
            this._clinicalDataFilterSet.delete(
                chartInfo.xAttr.clinicalAttributeId
            );
            this._clinicalDataFilterSet.delete(
                chartInfo.yAttr.clinicalAttributeId
            );
            this._customBinsFromScatterPlotSelectionSet.delete(
                chartInfo.xAttr.clinicalAttributeId
            );
            this._customBinsFromScatterPlotSelectionSet.delete(
                chartInfo.yAttr.clinicalAttributeId
            );
        } else {
            const chartSettings = this.getXvsYChartSettings(chartUniqueKey)!;
            const yFilter: DataFilterValue = {
                start: bounds.yStart,
                end: bounds.yEnd,
            } as any;
            if (chartSettings.yLogScale) {
                yFilter.start = Math.exp(yFilter.start) - 1;
                yFilter.end = Math.exp(yFilter.end) - 1;
            }
            const yIntervalFilter = {
                attributeId: chartInfo.yAttr.clinicalAttributeId,
                values: [yFilter],
            };
            this._customBinsFromScatterPlotSelectionSet.set(
                chartInfo.yAttr.clinicalAttributeId,
                [yFilter.start, yFilter.end]
            );
            this._clinicalDataFilterSet.set(
                chartInfo.yAttr.clinicalAttributeId,
                yIntervalFilter
            );

            const xFilter: DataFilterValue = {
                start: bounds.xStart,
                end: bounds.xEnd,
            } as any;
            if (chartSettings.xLogScale) {
                xFilter.start = Math.exp(xFilter.start) - 1;
                xFilter.end = Math.exp(xFilter.end) - 1;
            }
            const xIntervalFilter = {
                attributeId: chartInfo.xAttr.clinicalAttributeId,
                values: [xFilter],
            };
            this._customBinsFromScatterPlotSelectionSet.set(
                chartInfo.xAttr.clinicalAttributeId,
                [xFilter.start, xFilter.end]
            );
            this._clinicalDataFilterSet.set(
                chartInfo.xAttr.clinicalAttributeId,
                xIntervalFilter
            );
        }
    }

    @action.bound
    addGeneFilters(chartMeta: ChartMeta, hugoGeneSymbols: string[][]): void {
        trackStudyViewFilterEvent('geneFilter', this);
        let geneFilter =
            toJS(this._geneFilterSet.get(chartMeta.uniqueKey)) || [];
        // convert OQL gene queries to GeneFilterObjects accepted by the backend
        const queries: GeneFilterQuery[][] = _.map(hugoGeneSymbols, oqls =>
            _.map(oqls, oql =>
                geneFilterQueryFromOql(
                    oql,
                    this.driverAnnotationSettings.includeDriver,
                    this.driverAnnotationSettings.includeVUS,
                    this.driverAnnotationSettings.includeUnknownOncogenicity,
                    this.selectedDriverTiersMap.isComplete
                        ? this.selectedDriverTiersMap.result!
                        : {},
                    this.driverAnnotationSettings.includeUnknownTier,
                    this.includeGermlineMutations,
                    this.includeSomaticMutations,
                    this.includeUnknownStatusMutations
                )
            )
        );
        geneFilter = geneFilter.concat(queries);
        this._geneFilterSet.set(chartMeta.uniqueKey, geneFilter);
    }

    @action.bound
    updateGenomicDataIntervalFiltersByValues(
        uniqueKey: string,
        values: DataFilterValue[]
    ): void {
        if (values.length > 0) {
            const chart = this._geneSpecificChartMap.get(uniqueKey);
            const genomicDataIntervalFilter: GenomicDataFilter = {
                hugoGeneSymbol: chart!.hugoGeneSymbol,
                profileType: chart!.profileType,
                values: values,
            };
            this._genomicDataIntervalFilterSet.set(
                uniqueKey,
                genomicDataIntervalFilter
            );
        } else {
            this._genomicDataIntervalFilterSet.delete(uniqueKey);
        }
    }

    @action.bound
    updateGenericAssayDataFiltersByValues(
        uniqueKey: string,
        values: DataFilterValue[]
    ): void {
        if (values.length > 0) {
            const chart = this._genericAssayChartMap.get(uniqueKey);
            const gaDataIntervalFilter: GenericAssayDataFilter = {
                stableId: chart!.genericAssayEntityId,
                profileType: chart!.profileType,
                values: values,
            };
            this._genericAssayDataFilterSet.set(
                uniqueKey,
                gaDataIntervalFilter
            );
        } else {
            this._genericAssayDataFilterSet.delete(uniqueKey);
        }
    }

    @action.bound
    addGenomicProfilesFilter(chartMeta: ChartMeta, profiles: string[][]): void {
        let genomicProfilesFilter = toJS(this.genomicProfilesFilter) || [];
        this.setGenomicProfilesFilter(genomicProfilesFilter.concat(profiles));
    }

    @action.bound
    addCaseListsFilter(chartMeta: ChartMeta, caseLists: string[][]): void {
        let caseListsFilter = toJS(this.caseListsFilter) || [];
        this.setCaseListsFilter(caseListsFilter.concat(caseLists));
    }

    @action.bound
    removeGeneFilter(chartUniqueKey: string, toBeRemoved: string): void {
        let geneFilters = toJS(this._geneFilterSet.get(chartUniqueKey)) || [];
        geneFilters = _.reduce(
            geneFilters,
            (acc, next) => {
                const [
                    hugoGeneSymbol,
                    alteration,
                ]: string[] = toBeRemoved.split(':');
                const newGroup = next.filter(
                    geneFilterQuery =>
                        geneFilterQuery.hugoGeneSymbol !== hugoGeneSymbol &&
                        !_.includes(geneFilterQuery.alterations, alteration)
                );
                if (newGroup.length > 0) {
                    acc.push(newGroup);
                }
                return acc;
            },
            [] as GeneFilterQuery[][]
        );
        if (geneFilters.length === 0) {
            this._geneFilterSet.delete(chartUniqueKey);
        } else {
            this._geneFilterSet.set(chartUniqueKey, geneFilters);
        }
    }

    @action.bound
    resetGeneFilter(chartUniqueKey: string): void {
        this._geneFilterSet.delete(chartUniqueKey);
    }

    @action.bound
    removeGenomicProfileFilter(toBeRemoved: string): void {
        let genomicProfilesFilter = toJS(this.genomicProfilesFilter) || [];
        genomicProfilesFilter = _.reduce(
            genomicProfilesFilter,
            (acc: string[][], next) => {
                const newGroup = next.filter(
                    profile => profile !== toBeRemoved
                );
                if (newGroup.length > 0) {
                    acc.push(newGroup);
                }
                return acc;
            },
            []
        );
        this.setGenomicProfilesFilter(genomicProfilesFilter);
    }

    @action.bound
    removeCaseListsFilter(toBeRemoved: string): void {
        let caseListsFilter = toJS(this.caseListsFilter) || [];
        caseListsFilter = _.reduce(
            caseListsFilter,
            (acc: string[][], next) => {
                const newGroup = next.filter(
                    profile => profile !== toBeRemoved
                );
                if (newGroup.length > 0) {
                    acc.push(newGroup);
                }
                return acc;
            },
            []
        );
        this.setGenomicProfilesFilter(caseListsFilter);
    }

    @action.bound
    updateChartSampleIdentifierFilter(
        chartKey: string,
        cases: SampleIdentifier[],
        keepCurrent?: boolean
    ): void {
        let newSampleIdentifiers: SampleIdentifier[] = cases;
        const newSampleIdentifiersMap = _.keyBy(
            newSampleIdentifiers,
            s => `${s.studyId}:${s.sampleId}`
        );
        if (keepCurrent) {
            // if we should keep the current selection, go through and add samples back, taking care not to duplicate
            newSampleIdentifiers = _.reduce(
                this._chartSampleIdentifiersFilterSet.get(chartKey) || [],
                (acc, s) => {
                    if (
                        !(
                            `${s.studyId}:${s.sampleId}` in
                            newSampleIdentifiersMap
                        )
                    ) {
                        acc.push(s);
                    }
                    return acc;
                },
                newSampleIdentifiers
            );
        }

        if (_.isEmpty(newSampleIdentifiers)) {
            this._chartSampleIdentifiersFilterSet.delete(chartKey);
        } else {
            this._chartSampleIdentifiersFilterSet.set(
                chartKey,
                newSampleIdentifiers
            );
        }
    }

    public getChartSampleIdentifiersFilter(
        chartKey: string
    ): SampleIdentifier[] {
        return this._chartSampleIdentifiersFilterSet.get(chartKey) || [];
    }

    public isPreDefinedCustomChart(uniqueKey: string): boolean {
        return uniqueKey in SpecialChartsUniqueKeyEnum;
    }

    public newCustomChartUniqueKey(): string {
        return `CUSTOM_FILTERS_${this._customCharts.size}`;
    }

    public getUserDefinedCustomChartFilters(
        chartKey: string
    ): never[] | ClinicalDataFilter {
        return this._customDataFilterSet.get(chartKey) || [];
    }

    public isUserDefinedCustomDataChart(uniqueKey: string): boolean {
        return this._customCharts.has(uniqueKey);
    }

    public isGeneSpecificChart(uniqueKey: string): boolean {
        return this._geneSpecificChartMap.has(uniqueKey);
    }

    public isGenericAssayChart(uniqueKey: string): boolean {
        return this._genericAssayChartMap.has(uniqueKey);
    }

    @action
    changeChartVisibility(uniqueKey: string, visible: boolean): void {
        if (visible) {
            this._chartVisibility.set(uniqueKey, true);
        } else {
            this._chartVisibility.delete(uniqueKey);
        }
    }

    @action
    resetFilterAndChangeChartVisibility(
        chartUniqueKey: string,
        visible: boolean
    ): void {
        if (!visible) {
            switch (this.chartsType.get(chartUniqueKey)) {
                case ChartTypeEnum.PIE_CHART:
                case ChartTypeEnum.TABLE:
                    if (this.isUserDefinedCustomDataChart(chartUniqueKey)) {
                        this.setCustomChartFilters(chartUniqueKey, []);
                    } else if (this.isGenericAssayChart(chartUniqueKey)) {
                        this.updateGenericAssayDataFilters(chartUniqueKey, []);
                    } else {
                        this.updateClinicalDataFilterByValues(
                            chartUniqueKey,
                            []
                        );
                    }
                    break;
                case ChartTypeEnum.BAR_CHART:
                    if (this.isGeneSpecificChart(chartUniqueKey)) {
                        this.updateGenomicDataIntervalFilters(
                            chartUniqueKey,
                            []
                        );
                    } else if (this.isGenericAssayChart(chartUniqueKey)) {
                        this.updateGenericAssayDataFilters(chartUniqueKey, []);
                    } else {
                        this.updateClinicalDataIntervalFilters(
                            chartUniqueKey,
                            []
                        );
                    }
                    break;
                case ChartTypeEnum.SCATTER:
                    this.updateScatterPlotFilterByValues(chartUniqueKey);
                    break;
                case ChartTypeEnum.MUTATED_GENES_TABLE:
                case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
                case ChartTypeEnum.CNA_GENES_TABLE:
                    this.resetGeneFilter(chartUniqueKey);
                    break;
                case ChartTypeEnum.GENOMIC_PROFILES_TABLE:
                    this.setGenomicProfilesFilter([]);
                    break;
                case ChartTypeEnum.CASE_LIST_TABLE:
                    this.setCaseListsFilter([]);
                    break;
                case ChartTypeEnum.SURVIVAL:
                    break;
                case ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE:
                    this.setSampleTreatmentTargetFilters({ filters: [] });
                    break;
                case ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE:
                    this.setPatientTreatmentTargetFilters({ filters: [] });
                    break;
                case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE:
                    this.setSampleTreatmentGroupFilters({ filters: [] });
                    break;
                case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE:
                    this.setPatientTreatmentGroupFilters({ filters: [] });
                    break;
                case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
                    this.setSampleTreatmentFilters({ filters: [] });
                    break;
                case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                    this.setPatientTreatmentFilters({ filters: [] });
                    break;
                default:
                    this._clinicalDataFilterSet.delete(chartUniqueKey);
                    this._chartSampleIdentifiersFilterSet.delete(
                        chartUniqueKey
                    );
                    this.preDefinedCustomChartFilterSet.delete(chartUniqueKey);
                    this._genomicDataIntervalFilterSet.delete(chartUniqueKey);
                    this._genericAssayDataFilterSet.delete(chartUniqueKey);

                    break;
            }
        }
        this.changeChartVisibility(chartUniqueKey, visible);
    }

    private isChartFiltered(chartUniqueKey: string): boolean {
        switch (this.chartsType.get(chartUniqueKey)) {
            case ChartTypeEnum.PIE_CHART:
            case ChartTypeEnum.TABLE:
                if (this.isUserDefinedCustomDataChart(chartUniqueKey)) {
                    return (
                        this._customDataFilterSet.has(chartUniqueKey) ||
                        this.preDefinedCustomChartFilterSet.has(chartUniqueKey)
                    );
                } else if (this.isGenericAssayChart(chartUniqueKey)) {
                    return this._genericAssayDataFilterSet.has(chartUniqueKey);
                } else {
                    return this._clinicalDataFilterSet.has(chartUniqueKey);
                }
            case ChartTypeEnum.BAR_CHART:
                if (this.isGeneSpecificChart(chartUniqueKey)) {
                    this._genomicDataIntervalFilterSet.has(chartUniqueKey);
                }
                return this._clinicalDataFilterSet.has(chartUniqueKey);
            case ChartTypeEnum.SCATTER:
                const chart = this._XvsYScatterChartMap.get(chartUniqueKey)!;
                return (
                    this._customBinsFromScatterPlotSelectionSet.has(
                        chart.xAttr.clinicalAttributeId
                    ) &&
                    this._customBinsFromScatterPlotSelectionSet.has(
                        chart.yAttr.clinicalAttributeId
                    )
                );
            case ChartTypeEnum.MUTATED_GENES_TABLE:
            case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
            case ChartTypeEnum.CNA_GENES_TABLE:
                return this._geneFilterSet.has(chartUniqueKey);
            case ChartTypeEnum.GENOMIC_PROFILES_TABLE:
                return !_.isEmpty(this._genomicProfilesFilter);
            case ChartTypeEnum.CASE_LIST_TABLE:
                return !_.isEmpty(this._caseListsFilter);
            case ChartTypeEnum.SURVIVAL:
                return false;
            case ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE:
                return !_.isEmpty(this._sampleTreatmentTargetFilters.filters);
            case ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE:
                return !_.isEmpty(this._patientTreatmentTargetFilter.filters);
            case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE:
                return !_.isEmpty(this._sampleTreatmentGroupsFilters.filters);
            case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE:
                return !_.isEmpty(this._patientTreatmentGroupsFilter.filters);
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
                return !_.isEmpty(this._sampleTreatmentsFilters.filters);
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                return !_.isEmpty(this._patientTreatmentsFilter.filters);
            default:
                return false;
        }
    }

    @action.bound
    removeComparisonGroupSelectionFilter(): void {
        this._chartSampleIdentifiersFilterSet.delete(
            SpecialChartsUniqueKeyEnum.SELECTED_COMPARISON_GROUPS
        );
        this._filterComparisonGroups = [];
    }

    @action.bound
    removeCustomSelectFilter(): void {
        this._chartSampleIdentifiersFilterSet.delete(
            SpecialChartsUniqueKeyEnum.CUSTOM_SELECT
        );
        this.numberOfSelectedSamplesInCustomSelection = 0;
    }

    @action
    toggleLogScale(uniqueKey: string): void {
        if (this.isGeneSpecificChart(uniqueKey)) {
            // reset filters before toggling
            this.updateGenomicDataIntervalFilters(uniqueKey, []);

            // the toggle should really only be used by the bar chart.
            // the genomicDataBinFilter is guaranteed for bar chart.
            let ref = this._genomicDataBinFilterSet.get(uniqueKey);
            ref!.disableLogScale = !ref!.disableLogScale;
        } else if (this.isGenericAssayChart(uniqueKey)) {
            // reset filters before toggling
            this.updateGenericAssayDataFilters(uniqueKey, []);

            // the toggle should really only be used by the bar chart.
            // the genericAssayDataBinFilter is guaranteed for bar chart.
            let ref = this._genericAssayDataBinFilterSet.get(uniqueKey);
            ref!.disableLogScale = !ref!.disableLogScale;
        } else {
            // reset filters before toggling
            this.updateClinicalDataIntervalFilters(uniqueKey, []);

            // the toggle should really only be used by the bar chart.
            // the clinicalDataBinFilter is guaranteed for bar chart.
            let ref = this._clinicalDataBinFilterSet.get(uniqueKey);
            ref!.disableLogScale = !ref!.disableLogScale;
        }
    }

    @action
    toggleSurvivalPlotLeftTruncation(uniqueKey: string): void {
        if (this.survivalPlotLeftTruncationToggleMap?.has(uniqueKey)) {
            this.updateSurvivalPlotLeftTruncationToggleMap(
                uniqueKey,
                !this.survivalPlotLeftTruncationToggleMap.get(uniqueKey)
            );
        } else {
            this.updateSurvivalPlotLeftTruncationToggleMap(uniqueKey, true);
        }
    }

    public isLogScaleToggleVisible(
        uniqueKey: string,
        dataBins?: DataBin[]
    ): boolean {
        if (this.isGeneSpecificChart(uniqueKey)) {
            return (
                (this._genomicDataBinFilterSet.get(uniqueKey) !== undefined &&
                    this._genomicDataBinFilterSet.get(uniqueKey)!
                        .disableLogScale) ||
                isLogScaleByDataBins(dataBins)
            );
        } else if (this.isGenericAssayChart(uniqueKey)) {
            return (
                (this._genericAssayDataBinFilterSet.get(uniqueKey) !==
                    undefined &&
                    this._genericAssayDataBinFilterSet.get(uniqueKey)!
                        .disableLogScale) ||
                isLogScaleByDataBins(dataBins)
            );
        } else {
            return (
                (this._clinicalDataBinFilterSet.get(uniqueKey) !== undefined &&
                    this._clinicalDataBinFilterSet.get(uniqueKey)!
                        .disableLogScale) ||
                isLogScaleByDataBins(dataBins)
            );
        }
    }

    public isLogScaleChecked(uniqueKey: string): boolean {
        if (this.isGeneSpecificChart(uniqueKey)) {
            return (
                this._genomicDataBinFilterSet.get(uniqueKey) !== undefined &&
                !this._genomicDataBinFilterSet.get(uniqueKey)!.disableLogScale
            );
        } else if (this.isGenericAssayChart(uniqueKey)) {
            return (
                this._genericAssayDataBinFilterSet.get(uniqueKey) !==
                    undefined &&
                !this._genericAssayDataBinFilterSet.get(uniqueKey)!
                    .disableLogScale
            );
        } else {
            return (
                this._clinicalDataBinFilterSet.get(uniqueKey) !== undefined &&
                !this._clinicalDataBinFilterSet.get(uniqueKey)!.disableLogScale
            );
        }
    }

    @action.bound
    public updateBinMethod(
        uniqueKey: string,
        binMethod: BinMethodOption
    ): void {
        this.chartsBinMethod[uniqueKey] = binMethod;
    }

    @action.bound
    public updateGenerateBinsConfig(
        uniqueKey: string,
        binSize: number,
        anchorValue: number
    ): void {
        this.chartsBinsGeneratorConfigs.set(uniqueKey, {
            binSize,
            anchorValue,
        });
    }

    @action.bound
    public updateCustomBins(
        uniqueKey: string,
        bins: number[],
        binMethod: BinMethodOption,
        binsGeneratorConfig: BinsGeneratorConfig
    ): void {
        // Persist menu selection for when the menu reopens.

        this.updateGenerateBinsConfig(
            uniqueKey,
            binsGeneratorConfig.binSize,
            binsGeneratorConfig.anchorValue
        );

        if (this.isGeneSpecificChart(uniqueKey)) {
            let newFilter = _.clone(
                this._genomicDataBinFilterSet.get(uniqueKey)
            )!;
            newFilter.customBins = bins;
            newFilter.binMethod = binMethod;
            newFilter.binsGeneratorConfig = binsGeneratorConfig;
            this._genomicDataBinFilterSet.set(uniqueKey, newFilter);
        } else if (this.isGenericAssayChart(uniqueKey)) {
            let newFilter = _.clone(
                this._genericAssayDataBinFilterSet.get(uniqueKey)
            )!;
            newFilter.customBins = bins;
            newFilter.binMethod = binMethod;
            newFilter.binsGeneratorConfig = binsGeneratorConfig;
            this._genericAssayDataBinFilterSet.set(uniqueKey, newFilter);
        } else {
            let newFilter = _.clone(
                this._clinicalDataBinFilterSet.get(uniqueKey)
            )!;
            if (bins.length > 0) {
                newFilter.customBins = bins;
            } else {
                delete (newFilter as Partial<
                    ClinicalDataBinFilter & { showNA?: boolean }
                >).customBins;
            }
            newFilter.binMethod = binMethod;
            newFilter.binsGeneratorConfig = binsGeneratorConfig;
            this._clinicalDataBinFilterSet.set(uniqueKey, newFilter);
        }
    }

    public getCurrentBins(chartMeta: ChartMeta): number[] {
        if (this.isGeneSpecificChart(chartMeta.uniqueKey)) {
            return getNonZeroUniqueBins(
                this.getGenomicChartDataBin(chartMeta).result!
            );
        } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
            return getNonZeroUniqueBins(
                this.getGenericAssayChartDataBin(chartMeta).result!
            );
        } else {
            return getNonZeroUniqueBins(
                this.getClinicalDataBin(chartMeta).result!
            );
        }
    }

    @action
    addCharts(visibleChartIds: string[]): void {
        visibleChartIds.forEach(chartId => {
            if (!this._chartVisibility.has(chartId)) {
                this.newlyAddedCharts.push(chartId);
            }
        });
        this.updateChartsVisibility(visibleChartIds);
    }

    @action
    updateChartsVisibility(visibleChartIds: string[]): void {
        for (const chartId of this._chartVisibility.keys()) {
            if (
                !_.includes(visibleChartIds, chartId) ||
                !this._chartVisibility.get(chartId)
            ) {
                // delete it instead of setting it to false
                // because adding chart back would insert in middle instead of appending at last
                this.changeChartVisibility(chartId, false);
            }
        }
        for (const uniqueKey of visibleChartIds) {
            if (this._chartVisibility.get(uniqueKey) === undefined) {
                this.changeChartVisibility(uniqueKey, true);
            }
        }
    }

    @computed get clinicalDataFilters(): ClinicalDataFilter[] {
        return Array.from(this._clinicalDataFilterSet.values());
    }

    @computed get customDataFilters(): ClinicalDataFilter[] {
        return Array.from(this._customDataFilterSet.values());
    }

    @computed get geneFilters(): GeneFilter[] {
        return _.map(this._geneFilterSet.toJSON(), ([key, value]) => {
            return {
                molecularProfileIds: getMolecularProfileIdsFromUniqueKey(key),
                geneQueries: value,
            };
        });
    }

    @computed get genomicDataIntervalFilters(): GenomicDataFilter[] {
        return Array.from(this._genomicDataIntervalFilterSet.values());
    }

    @computed get genericAssayDataFilters(): GenericAssayDataFilter[] {
        return Array.from(this._genericAssayDataFilterSet.values());
    }

    @computed
    get filters(): StudyViewFilter {
        const filters: Partial<StudyViewFilter> = {};

        const clinicalDataFilters = this.clinicalDataFilters;

        const genomicDataIntervalFilters = this.genomicDataIntervalFilters;
        if (genomicDataIntervalFilters.length > 0) {
            filters.genomicDataFilters = genomicDataIntervalFilters;
        }

        const genericAssayDataFilters = this.genericAssayDataFilters;
        if (genericAssayDataFilters.length > 0) {
            filters.genericAssayDataFilters = genericAssayDataFilters;
        }

        if (clinicalDataFilters.length > 0) {
            filters.clinicalDataFilters = clinicalDataFilters;
        }

        if (this.customDataFilters.length > 0) {
            filters.customDataFilters = this.customDataFilters;
        }

        if (this.geneFilters.length > 0) {
            filters.geneFilters = this.geneFilters;
        }

        if (this.genomicProfilesFilter.length > 0) {
            filters.genomicProfiles = toJS(this.genomicProfilesFilter);
        }

        if (this.caseListsFilter.length > 0) {
            filters.caseLists = toJS(this.caseListsFilter);
        }

        if (
            this.sampleTreatmentFilters &&
            this.sampleTreatmentFilters.filters.length > 0
        ) {
            filters.sampleTreatmentFilters = this.sampleTreatmentFilters;
        }

        if (
            this.patientTreatmentFilters &&
            this.patientTreatmentFilters.filters.length > 0
        ) {
            filters.patientTreatmentFilters = this.patientTreatmentFilters;
        }

        if (
            this.sampleTreatmentGroupFilters &&
            this.sampleTreatmentGroupFilters.filters.length > 0
        ) {
            filters.sampleTreatmentGroupFilters = this.sampleTreatmentGroupFilters;
        }

        if (
            this.patientTreatmentGroupFilters &&
            this.patientTreatmentGroupFilters.filters.length > 0
        ) {
            filters.patientTreatmentGroupFilters = this.patientTreatmentGroupFilters;
        }

        if (
            this.sampleTreatmentTargetFilters &&
            this.sampleTreatmentTargetFilters.filters.length > 0
        ) {
            filters.sampleTreatmentTargetFilters = this.sampleTreatmentTargetFilters;
        }

        if (
            this.patientTreatmentTargetFilters &&
            this.patientTreatmentTargetFilters.filters.length > 0
        ) {
            filters.patientTreatmentTargetFilters = this.patientTreatmentTargetFilters;
        }

        let sampleIdentifiersFilterSets = Array.from(
            this._chartSampleIdentifiersFilterSet.values()
        );

        // nested array need to be spread for _.intersectionWith
        let _sampleIdentifiers: SampleIdentifier[] = _.intersectionWith(
            ...sampleIdentifiersFilterSets,
            ((a: SampleIdentifier, b: SampleIdentifier) => {
                return a.sampleId === b.sampleId && a.studyId === b.studyId;
            }) as any
        );

        if (!_.isEmpty(sampleIdentifiersFilterSets)) {
            filters.sampleIdentifiers = _sampleIdentifiers;
        } else {
            if (_.isEmpty(this.queriedSampleIdentifiers.result)) {
                filters.studyIds = this.queriedPhysicalStudyIds.result;
            } else {
                filters.sampleIdentifiers = this.queriedSampleIdentifiers.result;
            }
        }

        filters.alterationFilter = ({
            // select all CNA types
            copyNumberAlterationEventTypes: {
                [CopyNumberEnrichmentEventType.AMP]: true,
                [CopyNumberEnrichmentEventType.HOMDEL]: true,
            },
            // select all mutation types
            mutationEventTypes: {
                [MutationEnrichmentEventType.any]: true,
            },
            structuralVariants: null,
            includeDriver: this.driverAnnotationSettings.includeDriver,
            includeVUS: this.driverAnnotationSettings.includeVUS,
            includeUnknownOncogenicity: this.driverAnnotationSettings
                .includeUnknownOncogenicity,
            includeUnknownTier: this.driverAnnotationSettings
                .includeUnknownTier,
            includeGermline: this.includeGermlineMutations,
            includeSomatic: this.includeSomaticMutations,
            includeUnknownStatus: this.includeUnknownStatusMutations,
            tiersBooleanMap: this.selectedDriverTiersMap.isComplete
                ? this.selectedDriverTiersMap.result!
                : {},
        } as unknown) as AlterationFilter;

        return filters as StudyViewFilter;
    }

    @computed
    get userSelections(): StudyViewFilter & {
        sampleIdentifiersSet: { [id: string]: SampleIdentifier[] };
    } {
        return {
            ...this.filters,
            sampleIdentifiersSet: _.fromPairs(
                this._chartSampleIdentifiersFilterSet.toJSON()
            ),
        };
    }

    public getGeneFiltersByUniqueKey(uniqueKey: string): string[][] {
        const filters = _.map(this._geneFilterSet.get(uniqueKey), filterSet =>
            _.map(filterSet, geneFilterQueryToOql)
        );
        return toJS(filters);
    }

    @autobind
    public getClinicalDataFiltersByUniqueKey(
        uniqueKey: string
    ): DataFilterValue[] {
        const filter = this._clinicalDataFilterSet.get(uniqueKey);
        return filter ? filter.values : [];
    }

    public getCustomDataFiltersByUniqueKey(
        uniqueKey: string
    ): DataFilterValue[] {
        let filter: ClinicalDataFilter | undefined = undefined;
        // pre-defined custom chart
        if (uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
            filter = this.preDefinedCustomChartFilterSet.get(uniqueKey);
        } else {
            filter = this._customDataFilterSet.get(uniqueKey);
        }
        return filter ? filter.values : [];
    }

    public getScatterPlotFiltersByUniqueKey(
        uniqueKey: string
    ): RectangleBounds[] {
        const chartInfo = this.getXvsYScatterChartInfo(uniqueKey)!;

        const xAxisFilter = this._clinicalDataFilterSet.get(
            chartInfo.xAttr.clinicalAttributeId
        );
        const yAxisFilter = this._clinicalDataFilterSet.get(
            chartInfo.yAttr.clinicalAttributeId
        );
        const scatterPlotFilter: RectangleBounds = {};

        if (xAxisFilter) {
            let clinicalDataFilterValue = getFilteredAndCompressedDataIntervalFilters(
                xAxisFilter.values
            );
            scatterPlotFilter.xStart = clinicalDataFilterValue.start;
            scatterPlotFilter.xEnd = clinicalDataFilterValue.end;
        }
        if (yAxisFilter) {
            let clinicalDataFilterValue = getFilteredAndCompressedDataIntervalFilters(
                yAxisFilter.values
            );
            scatterPlotFilter.yStart = clinicalDataFilterValue.start;
            scatterPlotFilter.yEnd = clinicalDataFilterValue.end;
        }
        if (xAxisFilter || yAxisFilter) {
            return [scatterPlotFilter];
        }

        return [];
    }

    @autobind
    public getGenomicDataIntervalFiltersByUniqueKey(
        uniqueKey: string
    ): DataFilterValue[] {
        return this._genomicDataIntervalFilterSet.has(uniqueKey)
            ? this._genomicDataIntervalFilterSet.get(uniqueKey)!.values
            : [];
    }

    @autobind
    public getGenericAssayDataFiltersByUniqueKey(
        uniqueKey: string
    ): DataFilterValue[] {
        return this._genericAssayDataFilterSet.has(uniqueKey)
            ? this._genericAssayDataFilterSet.get(uniqueKey)!.values
            : [];
    }

    @computed
    get unfilteredAttrsForNonNumerical(): ClinicalDataFilter[] {
        const visibleNonNumericalAttributes = this.visibleAttributes.filter(
            (chartMeta: ChartMeta) => {
                if (
                    !this.isUserDefinedCustomDataChart(chartMeta.uniqueKey) &&
                    chartMeta.clinicalAttribute !== undefined &&
                    chartMeta.clinicalAttribute.datatype !== DataType.NUMBER
                ) {
                    const key = getUniqueKey(chartMeta.clinicalAttribute);
                    return !this._clinicalDataFilterSet.has(key);
                }
                return false;
            }
        );

        return visibleNonNumericalAttributes.map((chartMeta: ChartMeta) => {
            return {
                attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
            } as ClinicalDataFilter;
        });
    }

    @computed
    get unfilteredCustomAttrsForNonNumerical(): ClinicalDataFilter[] {
        const visibleNonNumericalCustomAttributes = this.visibleAttributes.filter(
            (chartMeta: ChartMeta) => {
                if (
                    this.isUserDefinedCustomDataChart(chartMeta.uniqueKey) &&
                    chartMeta.clinicalAttribute !== undefined &&
                    chartMeta.clinicalAttribute.datatype !== DataType.NUMBER
                ) {
                    return !this._customDataFilterSet.has(chartMeta.uniqueKey);
                }
                return false;
            }
        );

        return visibleNonNumericalCustomAttributes.map(
            (chartMeta: ChartMeta) => {
                return {
                    attributeId: chartMeta.clinicalAttribute!
                        .clinicalAttributeId,
                } as ClinicalDataFilter;
            }
        );
    }

    @computed
    get newlyAddedUnfilteredAttrsForNonNumerical(): {
        attributeId: string;
    }[] {
        return this.clinicalAttributes.result
            .filter((attr: ClinicalAttribute) => {
                if (attr.datatype !== DataType.NUMBER) {
                    const key = getUniqueKey(attr);
                    if (this.newlyAddedCharts.includes(key)) {
                        return true;
                    }
                    return false;
                }
                return false;
            })
            .map(attr => {
                return {
                    attributeId: attr.clinicalAttributeId,
                };
            });
    }

    @computed
    get newlyAddedUnfilteredAttrsForNumerical(): (ClinicalDataBinFilter & {
        showNA?: boolean | undefined;
    })[] {
        return this.clinicalAttributes.result
            .filter((attr: ClinicalAttribute) => {
                if (attr.datatype === DataType.NUMBER) {
                    const key = getUniqueKey(attr);
                    if (this.newlyAddedCharts.includes(key)) {
                        return true;
                    }
                    return false;
                }
                return false;
            })
            .map(attr => {
                return this._clinicalDataBinFilterSet.get(getUniqueKey(attr))!;
            });
    }

    @computed
    get unfilteredAttrsForNumerical(): (ClinicalDataBinFilter & {
        showNA?: boolean | undefined;
    })[] {
        const visibleNumericalAttributes = this.visibleAttributes.filter(
            (chartMeta: ChartMeta) => {
                if (
                    chartMeta.clinicalAttribute !== undefined &&
                    chartMeta.clinicalAttribute.datatype === DataType.NUMBER
                ) {
                    const key = getUniqueKey(chartMeta.clinicalAttribute);
                    return !this._clinicalDataFilterSet.has(key);
                }
                return false;
            }
        );

        return visibleNumericalAttributes.map((chartMeta: ChartMeta) => {
            return this._clinicalDataBinFilterSet.get(
                getUniqueKey(chartMeta.clinicalAttribute!)
            )!;
        });
    }

    readonly unfilteredClinicalDataCount = remoteData<ClinicalDataCountItem[]>({
        invoke: () => {
            if (!_.isEmpty(this.unfilteredAttrsForNonNumerical)) {
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    clinicalDataCountFilter: {
                        attributes: this.unfilteredAttrsForNonNumerical,
                        studyViewFilter: this.filters,
                    },
                });
            }
            return Promise.resolve([]);
        },
        onError: () => {},
        onResult: data => {
            data.forEach(item => {
                const uniqueKey = item.attributeId;
                if (this.isNewlyAdded(uniqueKey)) {
                    this.showAsPieChart(uniqueKey, item.counts.length);
                    this.newlyAddedCharts.remove(uniqueKey);
                }
            });
        },
        default: [],
    });

    readonly unfilteredCustomDataCount = remoteData<ClinicalDataCountItem[]>({
        await: () => [this.selectedSamples],
        invoke: () => {
            //only invoke if there are filtered samples
            if (this.hasFilteredSamples) {
                return internalClient.fetchCustomDataCountsUsingPOST({
                    clinicalDataCountFilter: {
                        attributes: this.unfilteredCustomAttrsForNonNumerical,
                        studyViewFilter: this.filters,
                    },
                });
            }
            return Promise.resolve([]);
        },
        onError: () => {},
        onResult: data => {
            data.forEach(item => {
                const uniqueKey = item.attributeId;
                if (this.isNewlyAdded(uniqueKey)) {
                    this.showAsPieChart(uniqueKey, item.counts.length);
                    this.newlyAddedCharts.remove(uniqueKey);
                }
            });
        },
        default: [],
    });

    readonly newlyAddedUnfilteredClinicalDataCount = remoteData<
        ClinicalDataCountItem[]
    >({
        invoke: () => {
            if (!_.isEmpty(this.newlyAddedUnfilteredAttrsForNonNumerical)) {
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    clinicalDataCountFilter: {
                        attributes: this
                            .newlyAddedUnfilteredAttrsForNonNumerical,
                        studyViewFilter: this.filters,
                    } as ClinicalDataCountFilter,
                });
            }
            return Promise.resolve([]);
        },
        default: [],
        onError: () => {},
        onResult: data => {
            data.forEach(item => {
                const uniqueKey = item.attributeId;
                this.unfilteredClinicalDataCountCache[uniqueKey] = item;
                this.showAsPieChart(uniqueKey, item.counts.length);
                this.newlyAddedCharts.remove(uniqueKey);
            });
        },
    });

    readonly newlyAddedUnfilteredClinicalDataBinCount = remoteData<DataBin[]>({
        invoke: async () => {
            // return empty if there are no sample identifiers or study ids in the filter
            if (
                this.hasSampleIdentifiersInFilter &&
                this.newlyAddedUnfilteredAttrsForNumerical.length > 0
            ) {
                const clinicalDataBinCountData = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                    {
                        dataBinMethod: 'STATIC',
                        clinicalDataBinCountFilter: {
                            attributes: this
                                .newlyAddedUnfilteredAttrsForNumerical,
                            studyViewFilter: this.filters,
                        },
                    }
                );
                return Promise.resolve(
                    convertClinicalDataBinsToDataBins(clinicalDataBinCountData)
                );
            }
            return Promise.resolve([]);
        },
        default: [],
        onError: () => {},
        onResult: data => {
            _.each(
                _.groupBy(data, item => item.id),
                (item, key) => {
                    this.unfilteredClinicalDataBinCountCache[key] = item;
                    this.newlyAddedCharts.remove(key);
                }
            );
        },
    });

    readonly unfilteredClinicalDataBinCount = remoteData<DataBin[]>({
        invoke: async () => {
            // return empty if there are no sample identifiers or study ids in the filter
            if (
                this.hasSampleIdentifiersInFilter &&
                this.unfilteredAttrsForNumerical.length > 0
            ) {
                const clinicalDataBinCountData = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                    {
                        dataBinMethod: 'STATIC',
                        clinicalDataBinCountFilter: {
                            attributes: this.unfilteredAttrsForNumerical,
                            studyViewFilter: this.filters,
                        },
                    }
                );
                return Promise.resolve(
                    convertClinicalDataBinsToDataBins(clinicalDataBinCountData)
                );
            }
            return Promise.resolve([]);
        },
        onError: () => {},
        default: [],
    });

    @action.bound
    hideChart(uniqueKey: string): void {
        this.changeChartVisibility(uniqueKey, false);
    }

    public getClinicalDataCount(
        chartMeta: ChartMeta
    ): MobxPromise<ClinicalDataCountSummary[]> {
        let uniqueKey: string = getUniqueKey(chartMeta.clinicalAttribute!);
        if (!this.clinicalDataCountPromises.hasOwnProperty(uniqueKey)) {
            const isDefaultAttr =
                _.find(
                    this.defaultVisibleAttributes.result,
                    attr => getUniqueKey(attr) === uniqueKey
                ) !== undefined;
            this.clinicalDataCountPromises[uniqueKey] = remoteData<
                ClinicalDataCountSummary[]
            >({
                await: () => {
                    return [
                        ...getRequestedAwaitPromisesForClinicalData(
                            isDefaultAttr,
                            this.isInitialFilterState,
                            this.chartsAreFiltered,
                            this._clinicalDataFilterSet.has(uniqueKey),
                            this.unfilteredClinicalDataCount,
                            this.newlyAddedUnfilteredClinicalDataCount,
                            this.initialVisibleAttributesClinicalDataCountData
                        ),
                    ];
                },
                invoke: async () => {
                    let result: ClinicalDataCountItem[] = [];
                    if (
                        this.isInitialFilterState &&
                        isDefaultAttr &&
                        !this._clinicalDataFilterSet.has(uniqueKey)
                    ) {
                        result = this
                            .initialVisibleAttributesClinicalDataCountData
                            .result;
                    } else {
                        // Mostly the case when user adds new chart. It would be nice only fetching
                        // the chart specific data instead of using the unfilteredClinicalDataCount which will require
                        // all unfiltered clinical attributes data.

                        if (
                            this._clinicalDataFilterSet.has(uniqueKey) ||
                            this.isInitialFilterState
                        ) {
                            result = await internalClient.fetchClinicalDataCountsUsingPOST(
                                {
                                    clinicalDataCountFilter: {
                                        attributes: [
                                            {
                                                attributeId: chartMeta.clinicalAttribute!
                                                    .clinicalAttributeId,
                                            } as ClinicalDataFilter,
                                        ],
                                        studyViewFilter: this.filters,
                                    },
                                }
                            );
                        } else if (!isDefaultAttr && !this.chartsAreFiltered) {
                            result = [
                                this.unfilteredClinicalDataCountCache[
                                    uniqueKey
                                ],
                            ];
                        } else {
                            result = this.unfilteredClinicalDataCount.result;
                        }
                    }
                    let data = _.find(result, {
                        attributeId: chartMeta.clinicalAttribute!
                            .clinicalAttributeId,
                    } as ClinicalDataCountItem);
                    let counts: ClinicalDataCount[] = [];
                    let attributeId: string = '';
                    if (data !== undefined) {
                        counts = data.counts;
                        attributeId = data.attributeId;
                        if (!this.chartToUsedColors.has(attributeId))
                            this.chartToUsedColors.set(attributeId, new Set());
                    }
                    return this.addColorToCategories(counts, attributeId);
                },
                onError: () => {},
                default: [],
            });
        }
        return this.clinicalDataCountPromises[uniqueKey];
    }

    private addColorToCategories(
        counts: ClinicalDataCount[],
        attributeId: string
    ): ClinicalDataCountSummary[] {
        return getClinicalDataCountWithColorByClinicalDataCount(counts).map(
            item => {
                let colorMapKey = this.generateColorMapKey(
                    attributeId,
                    item.value
                );
                // If the item doesn't has an assigned color
                if (!this.chartItemToColor.has(colorMapKey)) {
                    // If the color has not been used
                    if (
                        !this.chartToUsedColors
                            .get(attributeId)
                            ?.has(item.color)
                    ) {
                        this.chartItemToColor.set(colorMapKey, item.color);
                        this.chartToUsedColors
                            .get(attributeId)
                            ?.add(item.color);
                    } else {
                        // Pick up a new color if the color has been used
                        let d = {
                            value: item.value,
                            count: item.count,
                        };
                        let newColor = pickNewColorForClinicData(
                            d,
                            this.chartToUsedColors.get(attributeId) || new Set()
                        );
                        this.chartItemToColor.set(colorMapKey, newColor);
                        this.chartToUsedColors.get(attributeId)?.add(newColor);
                        item.color = newColor;
                    }
                    return item;
                } else {
                    return {
                        ...item,
                        color: this.chartItemToColor.get(colorMapKey)!,
                    };
                }
            }
        );
    }

    public getCustomDataCount(
        chartMeta: ChartMeta
    ): MobxPromise<ClinicalDataCountSummary[]> {
        let uniqueKey: string = chartMeta.uniqueKey;
        if (uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
            return this.cancerStudiesData;
        }
        if (!this.customDataCountPromises.hasOwnProperty(uniqueKey)) {
            this.customDataCountPromises[uniqueKey] = remoteData<
                ClinicalDataCountSummary[]
            >({
                await: () => {
                    return this._customDataFilterSet.has(uniqueKey)
                        ? [this.selectedSamples]
                        : [
                              this.selectedSamples,
                              this.unfilteredCustomDataCount,
                          ];
                },
                invoke: async () => {
                    let result: ClinicalDataCountItem[] = [];
                    if (
                        this.isInitialFilterState &&
                        !this._customDataFilterSet.has(uniqueKey)
                    ) {
                        result = this.unfilteredCustomDataCount.result;
                    } else {
                        // Mostly the case when user adds new chart. It would be nice only fetching
                        // the chart specific data instead of using the unfilteredClinicalDataCount which will require
                        // all unfiltered clinical attributes data.

                        if (
                            this._customDataFilterSet.has(uniqueKey) ||
                            this.isInitialFilterState
                        ) {
                            if (!this.hasFilteredSamples) {
                                return [];
                            }
                            result = await internalClient.fetchCustomDataCountsUsingPOST(
                                {
                                    clinicalDataCountFilter: {
                                        attributes: [
                                            {
                                                attributeId:
                                                    chartMeta.uniqueKey,
                                            } as ClinicalDataFilter,
                                        ],
                                        studyViewFilter: this.filters,
                                    } as ClinicalDataCountFilter,
                                }
                            );
                        } else {
                            result = this.unfilteredCustomDataCount.result;
                        }
                    }
                    let data = _.find(result, {
                        attributeId: chartMeta.uniqueKey,
                    } as ClinicalDataCountItem);
                    let counts: ClinicalDataCount[] = [];
                    let attributeId: string = '';
                    if (data !== undefined) {
                        counts = data.counts;
                        attributeId = data.attributeId;
                        if (!this.chartToUsedColors.has(attributeId))
                            this.chartToUsedColors.set(attributeId, new Set());
                    }
                    return this.addColorToCategories(counts, attributeId);
                },
                onError: () => {},
                default: [],
            });
        }
        return this.customDataCountPromises[uniqueKey];
    }

    public getGenericAssayChartDataCount(
        chartMeta: ChartMeta
    ): MobxPromise<ClinicalDataCountSummary[]> {
        if (
            !this.genericAssayDataCountPromises.hasOwnProperty(
                chartMeta.uniqueKey
            )
        ) {
            this.genericAssayDataCountPromises[
                chartMeta.uniqueKey
            ] = remoteData<ClinicalDataCountSummary[]>({
                await: () => [],
                invoke: async () => {
                    let res: ClinicalDataCountSummary[] = [];
                    const chartInfo = this._genericAssayChartMap.get(
                        chartMeta.uniqueKey
                    );
                    if (chartInfo) {
                        let result: GenericAssayDataCountItem[] = [];

                        result = await internalClient.fetchGenericAssayDataCountsUsingPOST(
                            {
                                genericAssayDataCountFilter: {
                                    genericAssayDataFilters: [
                                        {
                                            stableId:
                                                chartInfo.genericAssayEntityId,
                                            profileType: chartInfo.profileType,
                                        } as GenericAssayDataFilter,
                                    ],
                                    studyViewFilter: this.filters,
                                } as GenericAssayDataCountFilter,
                            }
                        );

                        let data = result.find(
                            d => d.stableId === chartInfo.genericAssayEntityId
                        );
                        let counts: ClinicalDataCount[] = [];
                        let stableId: string = '';
                        if (data !== undefined) {
                            counts = data.counts.map(c => {
                                return {
                                    count: c.count,
                                    value: c.value,
                                } as ClinicalDataCount;
                            });
                            stableId = data.stableId;
                            if (!this.chartToUsedColors.has(stableId)) {
                                this.chartToUsedColors.set(stableId, new Set());
                            }
                        }

                        return this.addColorToCategories(counts, stableId);
                    }

                    return res;
                },
                default: [],
            });
        }
        return this.genericAssayDataCountPromises[chartMeta.uniqueKey];
    }

    private generateColorMapKey(id: string, value: string): string {
        return `${id}.${value}`;
    }

    @autobind
    public getClinicalDataBin(chartMeta: ChartMeta): MobxPromise<DataBin[]> {
        const uniqueKey: string = getUniqueKey(chartMeta.clinicalAttribute!);
        if (!this.clinicalDataBinPromises.hasOwnProperty(uniqueKey)) {
            const defaultAttr = _.find(
                this.defaultVisibleAttributes.result,
                attr => getUniqueKey(attr) === uniqueKey
            );
            const isDefaultAttr = defaultAttr !== undefined;
            this.clinicalDataBinPromises[uniqueKey] = remoteData<DataBin[]>({
                await: () => {
                    return getRequestedAwaitPromisesForClinicalData(
                        isDefaultAttr,
                        this.isInitialFilterState,
                        this.chartsAreFiltered,
                        this._clinicalDataFilterSet.has(uniqueKey),
                        this.unfilteredClinicalDataBinCount,
                        this.newlyAddedUnfilteredClinicalDataBinCount,
                        this.initialVisibleAttributesClinicalDataBinCountData
                    );
                },
                invoke: async () => {
                    // TODO this.barChartFilters.length > 0 ? 'STATIC' : 'DYNAMIC' (not trivial when multiple filters involved)
                    const dataBinMethod = DataBinMethodConstants.STATIC;
                    let result = [];

                    const initDataBinFilter = _.find(
                        this.initialVisibleAttributesClinicalDataBinAttributes
                            .result,
                        item =>
                            item.attributeId ===
                            getUniqueKey(chartMeta.clinicalAttribute!)
                    );
                    let attribute = _.clone(
                        this._clinicalDataBinFilterSet.get(
                            getUniqueKey(chartMeta.clinicalAttribute!)
                        )!
                    );

                    if (
                        this._customBinsFromScatterPlotSelectionSet.has(
                            chartMeta.uniqueKey
                        )
                    ) {
                        const additioncustomBins =
                            this._customBinsFromScatterPlotSelectionSet.get(
                                chartMeta.uniqueKey
                            ) || [];
                        attribute.customBins = _.sortBy([
                            ...(attribute.customBins || []),
                            ...additioncustomBins,
                        ]);
                    }
                    const attributeChanged =
                        isDefaultAttr &&
                        !_.isEqual(
                            _.omit(toJS(attribute), ['showNA']),
                            _.omit(initDataBinFilter, ['showNA'])
                        );
                    if (
                        this.isInitialFilterState &&
                        isDefaultAttr &&
                        !this._clinicalDataFilterSet.has(uniqueKey) &&
                        !attributeChanged
                    ) {
                        result = this
                            .initialVisibleAttributesClinicalDataBinCountData
                            .result;
                    } else {
                        if (
                            this._clinicalDataFilterSet.has(uniqueKey) ||
                            this.isInitialFilterState
                        ) {
                            // return empty if there are no sample identifiers or study ids in the filter
                            if (!this.hasSampleIdentifiersInFilter) {
                                return [];
                            }
                            result = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                                {
                                    dataBinMethod,
                                    clinicalDataBinCountFilter: {
                                        attributes: [attribute],
                                        studyViewFilter: this.filters,
                                    },
                                }
                            );
                            // convert ClinicalDataBin to DataBin
                            result = convertClinicalDataBinsToDataBins(result);
                        } else if (!isDefaultAttr && !this.chartsAreFiltered) {
                            result = this.unfilteredClinicalDataBinCountCache[
                                uniqueKey
                            ];
                        } else {
                            result = this.unfilteredClinicalDataBinCount.result;
                        }
                    }

                    return (
                        _.filter(
                            result,
                            dataBin =>
                                dataBin.id ===
                                chartMeta.clinicalAttribute!.clinicalAttributeId
                        ) || []
                    );
                },
                onError: () => {},
                default: [],
            });
        }
        return this.clinicalDataBinPromises[uniqueKey];
    }

    @autobind
    public getGenomicChartDataBin(
        chartMeta: ChartMeta
    ): MobxPromise<DataBin[]> {
        if (!this.genomicChartPromises.hasOwnProperty(chartMeta.uniqueKey)) {
            this.genomicChartPromises[chartMeta.uniqueKey] = remoteData<
                DataBin[]
            >({
                await: () => [this.selectedSamples],
                invoke: async () => {
                    const chartInfo = this._geneSpecificChartMap.get(
                        chartMeta.uniqueKey
                    );
                    const attribute = this._genomicDataBinFilterSet.get(
                        chartMeta.uniqueKey
                    )!;
                    //only invoke if there are filtered samples
                    if (chartInfo && this.hasFilteredSamples) {
                        const genomicDataBins = await internalClient.fetchGenomicDataBinCountsUsingPOST(
                            {
                                dataBinMethod: DataBinMethodConstants.STATIC,
                                genomicDataBinCountFilter: {
                                    genomicDataBinFilters: [
                                        {
                                            hugoGeneSymbol:
                                                chartInfo.hugoGeneSymbol,
                                            profileType: chartInfo.profileType,
                                            customBins: attribute.customBins,
                                            disableLogScale:
                                                attribute.disableLogScale,
                                        },
                                    ] as any,
                                    studyViewFilter: this.filters,
                                },
                            }
                        );

                        return convertGenomicDataBinsToDataBins(
                            genomicDataBins
                        );
                    }
                    return [];
                },
                default: [],
            });
        }
        return this.genomicChartPromises[chartMeta.uniqueKey];
    }

    @autobind
    public getGenericAssayChartDataBin(
        chartMeta: ChartMeta
    ): MobxPromise<DataBin[]> {
        if (
            !this.genericAssayChartPromises.hasOwnProperty(chartMeta.uniqueKey)
        ) {
            this.genericAssayChartPromises[chartMeta.uniqueKey] = remoteData<
                DataBin[]
            >({
                await: () => [],
                invoke: async () => {
                    const chartInfo = this._genericAssayChartMap.get(
                        chartMeta.uniqueKey
                    );
                    const attribute = this._genericAssayDataBinFilterSet.get(
                        chartMeta.uniqueKey
                    )!;
                    if (chartInfo) {
                        const gaDataBins = await internalClient.fetchGenericAssayDataBinCountsUsingPOST(
                            {
                                dataBinMethod: DataBinMethodConstants.STATIC,
                                genericAssayDataBinCountFilter: {
                                    genericAssayDataBinFilters: [
                                        {
                                            stableId:
                                                chartInfo.genericAssayEntityId,
                                            profileType: chartInfo.profileType,
                                            customBins: attribute.customBins,
                                            disableLogScale:
                                                attribute.disableLogScale,
                                        },
                                    ] as any,
                                    studyViewFilter: this.filters,
                                },
                            }
                        );
                        return convertGenericAssayDataBinsToDataBins(
                            gaDataBins
                        );
                    }
                    return [];
                },
                default: [],
            });
        }
        return this.genericAssayChartPromises[chartMeta.uniqueKey];
    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: async () => {
            if (this.queriedPhysicalStudyIds.result.length > 0) {
                return await defaultClient.fetchMolecularProfilesUsingPOST({
                    molecularProfileFilter: {
                        studyIds: this.queriedPhysicalStudyIds.result,
                    } as MolecularProfileFilter,
                });
            }
            return [];
        },
        onError: () => {},
        default: [],
    });

    readonly allStudies = remoteData(
        {
            invoke: async () =>
                await defaultClient.getAllStudiesUsingGET({
                    projection: 'SUMMARY',
                }),
        },
        []
    );

    readonly everyStudyIdToStudy = remoteData({
        await: () => [this.allStudies],
        invoke: () =>
            Promise.resolve(_.keyBy(this.allStudies.result!, s => s.studyId)),
    });

    // contains queried physical studies
    readonly filteredPhysicalStudies = remoteData({
        await: () => [this.everyStudyIdToStudy],
        invoke: async () => {
            const everyStudyIdToStudy = this.everyStudyIdToStudy.result!;
            return _.reduce(
                this.studyIds,
                (acc: CancerStudy[], next) => {
                    if (
                        everyStudyIdToStudy[next] &&
                        isQueriedStudyAuthorized(everyStudyIdToStudy[next])
                    ) {
                        acc.push(everyStudyIdToStudy[next]);
                    }
                    return acc;
                },
                []
            );
        },
        default: [],
    });

    // contains queried vaild virtual studies
    readonly filteredVirtualStudies = remoteData({
        await: () => [this.filteredPhysicalStudies],
        invoke: async () => {
            if (
                this.filteredPhysicalStudies.result.length ===
                this.studyIds.length
            ) {
                return [];
            }
            let filteredVirtualStudies: VirtualStudy[] = [];
            let validFilteredPhysicalStudyIds = this.filteredPhysicalStudies.result.map(
                study => study.studyId
            );
            let virtualStudyIds = _.filter(
                this.studyIds,
                id => !_.includes(validFilteredPhysicalStudyIds, id)
            );

            await Promise.all(
                virtualStudyIds.map(id =>
                    sessionServiceClient
                        .getVirtualStudy(id)
                        .then(res => {
                            filteredVirtualStudies.push(res);
                        })
                        .catch(() => {
                            /*do nothing*/
                        })
                )
            );
            return filteredVirtualStudies;
        },
        default: [],
    });

    // includes all physical studies from queried virtual studies
    readonly queriedPhysicalStudies = remoteData({
        await: () => [
            this.filteredPhysicalStudies,
            this.filteredVirtualStudies,
        ],
        invoke: async () => {
            let everyStudyIdToStudy = this.everyStudyIdToStudy.result!;

            let studies = _.reduce(
                this.filteredPhysicalStudies.result,
                (acc, next) => {
                    acc[next.studyId] = everyStudyIdToStudy[next.studyId];
                    return acc;
                },
                {} as { [id: string]: CancerStudy }
            );

            this.filteredVirtualStudies.result.forEach(virtualStudy => {
                virtualStudy.data.studies.forEach(study => {
                    if (!studies[study.id] && everyStudyIdToStudy[study.id]) {
                        studies[study.id] = everyStudyIdToStudy[study.id];
                    }
                });
            });
            return _.values(studies);
        },
        default: [],
    });

    // includes all physical studies from queried virtual studies
    readonly queriedPhysicalStudyIds = remoteData({
        await: () => [this.queriedPhysicalStudies],
        invoke: () => {
            return Promise.resolve(
                _.map(
                    this.queriedPhysicalStudies.result,
                    study => study.studyId
                )
            );
        },
        default: [],
    });

    readonly queriedSampleIdentifiers = remoteData<SampleIdentifier[]>({
        await: () => [
            this.filteredPhysicalStudies,
            this.filteredVirtualStudies,
        ],
        invoke: async () => {
            let result = _.reduce(
                this.filteredVirtualStudies.result,
                (acc, next) => {
                    next.data.studies.forEach(study => {
                        let samples = study.samples;
                        if (acc[study.id]) {
                            samples = _.union(acc[study.id], samples);
                        }
                        acc[study.id] = samples;
                    });
                    return acc;
                },
                {} as { [id: string]: string[] }
            );

            if (!_.isEmpty(result)) {
                result = _.reduce(
                    this.filteredPhysicalStudies.result,
                    (acc, next) => {
                        acc[next.studyId] = [];
                        return acc;
                    },
                    result
                );

                let studySamplesToFetch = _.reduce(
                    result,
                    (acc, samples, studyId) => {
                        if (samples.length === 0) {
                            acc.push(studyId);
                        }
                        return acc;
                    },
                    [] as string[]
                );

                await Promise.all(
                    _.map(studySamplesToFetch, studyId => {
                        return defaultClient
                            .getAllSamplesInStudyUsingGET({
                                studyId: studyId,
                            })
                            .then(samples => {
                                result[studyId] = samples.map(
                                    sample => sample.sampleId
                                );
                            });
                    })
                );
            }

            return _.flatten(
                _.map(result, (samples, studyId) =>
                    samples.map(sampleId => {
                        return {
                            sampleId,
                            studyId,
                        };
                    })
                )
            );
        },
        default: [],
    });

    // all queried studies, includes both physcial and virtual studies
    // this is used in page header(name and description)
    readonly displayedStudies = remoteData({
        await: () => [
            this.filteredVirtualStudies,
            this.filteredPhysicalStudies,
            this.queriedPhysicalStudies,
        ],
        invoke: async () => {
            if (
                this.filteredPhysicalStudies.result.length === 0 &&
                this.filteredVirtualStudies.result.length === 1
            ) {
                const virtualStudy = this.filteredVirtualStudies.result[0];
                return [
                    {
                        name: virtualStudy.data.name,
                        description: virtualStudy.data.description,
                        studyId: virtualStudy.id,
                    } as CancerStudy,
                ];
            } else {
                return this.queriedPhysicalStudies.result;
            }
        },
        default: [],
    });

    @computed get isSingleNonVirtualStudyQueried(): boolean {
        return (
            this.filteredPhysicalStudies.isComplete &&
            this.filteredVirtualStudies.isComplete &&
            this.filteredPhysicalStudies.result.length === 1 &&
            this.filteredVirtualStudies.result.length === 0
        );
    }

    @computed get showOriginStudiesInSummaryDescription(): boolean {
        return showOriginStudiesInSummaryDescription(
            this.filteredPhysicalStudies.result,
            this.filteredVirtualStudies.result
        );
    }

    // origin/parent studies to be shown in summary description
    // this would be empty in all cases except if only one virtual study in queried
    readonly originStudies = remoteData({
        await: () => [
            this.filteredPhysicalStudies,
            this.filteredVirtualStudies,
            this.everyStudyIdToStudy,
        ],
        invoke: async () => {
            let studies: CancerStudy[] = [];
            if (this.showOriginStudiesInSummaryDescription) {
                const originStudyIds = this.filteredVirtualStudies.result[0]
                    .data.origin;
                const virtualStudyIds: string[] = [];
                const everyStudyIdToStudy = this.everyStudyIdToStudy.result!;
                _.each(originStudyIds, studyId => {
                    if (everyStudyIdToStudy[studyId]) {
                        studies.push(everyStudyIdToStudy[studyId]);
                    } else {
                        virtualStudyIds.push(studyId);
                    }
                });
                await Promise.all(
                    virtualStudyIds.map(id =>
                        sessionServiceClient
                            .getVirtualStudy(id)
                            .then(virtualStudy => {
                                studies.push({
                                    name: virtualStudy.data.name,
                                    description: virtualStudy.data.description,
                                    studyId: virtualStudy.id,
                                } as CancerStudy);
                            })
                            .catch(() => {
                                /*do nothing*/
                            })
                    )
                );
            }
            return studies;
        },
        default: [],
    });

    readonly unknownQueriedIds = remoteData({
        await: () => [
            this.filteredPhysicalStudies,
            this.filteredVirtualStudies,
        ],
        invoke: async () => {
            let validIds: string[] = [];
            _.each(this.filteredPhysicalStudies.result, study =>
                validIds.push(study.studyId)
            );
            _.each(this.filteredVirtualStudies.result, study =>
                validIds.push(study.id)
            );
            return _.filter(this.studyIds, id => !_.includes(validIds, id));
        },
        onError: () => {},
        onResult: unknownIds => {
            if (unknownIds.length > 0) {
                this.pageStatusMessages['unknownIds'] = {
                    status: 'danger',
                    message: `Unknown/Unauthorized ${
                        unknownIds.length > 1 ? 'studies:' : 'study:'
                    } ${unknownIds.join(', ')}`,
                };
            }
        },
        default: [],
    });

    readonly studyIdToMolecularProfiles = remoteData({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.molecularProfiles.result!,
                    molecularProfile => molecularProfile.studyId
                )
            );
        },
        onError: error => {},
        default: {},
    });

    readonly mutationProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () => {
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.MUTATION_EXTENDED
                )
            );
        },
        onError: () => {},
        default: [],
    });

    readonly structuralVariantProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () => {
            // TODO: Cleanup once fusions are removed from database
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                    [DataTypeConstants.FUSION, DataTypeConstants.SV]
                )
            );
        },
        onError: () => {},
        default: [],
    });

    readonly cnaProfiles = remoteData({
        await: () => [this.studyIdToMolecularProfiles],
        invoke: () => {
            return Promise.resolve(
                getFilteredMolecularProfilesByAlterationType(
                    this.studyIdToMolecularProfiles.result,
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                    [DataTypeConstants.DISCRETE]
                )
            );
        },
        onError: () => {},
        default: [],
    });

    @computed get hasCnaProfileData() {
        return (
            this.cnaProfiles.isComplete && !_.isEmpty(this.cnaProfiles.result)
        );
    }

    private getDefaultClinicalDataBinFilter(
        attribute: ClinicalAttribute
    ): ClinicalDataBinFilter & {
        showNA?: boolean | undefined;
    } {
        return {
            attributeId: attribute.clinicalAttributeId,
            disableLogScale: false,
            showNA: true,
        } as ClinicalDataBinFilter & { showNA?: boolean };
    }

    readonly resourceDefinitions = remoteData({
        await: () => [this.queriedPhysicalStudies],
        invoke: () => {
            return internalClient.fetchResourceDefinitionsUsingPOST({
                studyIds: this.queriedPhysicalStudies.result.map(
                    study => study.studyId
                ),
            });
        },
        onResult: defs => {
            if (defs) {
                for (const def of defs)
                    if (def.openByDefault)
                        this.setResourceTabOpen(def.resourceId, true);
            }
        },
    });

    readonly studyResourceData = remoteData<ResourceData[]>({
        await: () => [this.resourceDefinitions],
        invoke: () => {
            const ret: ResourceData[] = [];
            const studyResourceDefinitions = this.resourceDefinitions.result!.filter(
                d => d.resourceType === 'STUDY'
            );
            const promises = [];
            for (const resource of studyResourceDefinitions) {
                promises.push(
                    internalClient
                        .getAllStudyResourceDataInStudyUsingGET({
                            studyId: resource.studyId,
                            resourceId: resource.resourceId,
                            projection: 'DETAILED',
                        })
                        .then(data => ret.push(...data))
                );
            }
            return Promise.all(promises).then(() => ret);
        },
    });

    readonly resourceIdToResourceData = remoteData<{
        [resourceId: string]: ResourceData[];
    }>({
        await: () => [this.studyResourceData],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(this.studyResourceData.result!, d => d.resourceId)
            );
        },
    });

    readonly chartClinicalAttributes = remoteData({
        await: () => [
            this.clinicalAttributes,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            // filter out survival attributes (only keep 'OS_STATUS' attribute)
            // create a dict which contains all survival attribute Ids that will be excluded from study view
            // get all survival attribute Ids into a dict
            let survivalAttributeIdsDict = createSurvivalAttributeIdsDict(
                this.survivalClinicalAttributesPrefix.result
            );
            // omit 'OS_STATUS' from dict
            survivalAttributeIdsDict = _.omit(survivalAttributeIdsDict, [
                'OS_STATUS',
            ]);
            return Promise.resolve(
                _.filter(
                    this.clinicalAttributes.result,
                    attribute =>
                        !(
                            attribute.clinicalAttributeId in
                            survivalAttributeIdsDict
                        )
                )
            );
        },
        default: [],
    });

    readonly clinicalAttributes = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: async () => {
            if (this.queriedPhysicalStudyIds.result.length > 0) {
                return _.uniqBy(
                    await defaultClient.fetchClinicalAttributesUsingPOST({
                        studyIds: this.queriedPhysicalStudyIds.result,
                    }),
                    clinicalAttribute =>
                        `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`
                );
            }
            return [];
        },
        default: [],
        onError: () => {},
        onResult: clinicalAttributes => {
            clinicalAttributes.forEach((obj: ClinicalAttribute) => {
                if (obj.datatype === DataType.NUMBER) {
                    const uniqueKey = getUniqueKey(obj);
                    let filter = this.getDefaultClinicalDataBinFilter(obj);

                    if (STUDY_VIEW_CONFIG.initialBins[uniqueKey]) {
                        filter.customBins =
                            STUDY_VIEW_CONFIG.initialBins[uniqueKey];
                    }
                    this._clinicalDataBinFilterSet.set(uniqueKey, filter);
                }
            });
        },
    });

    readonly clinicalAttributeIdToClinicalAttribute = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            return _.keyBy(
                this.clinicalAttributes.result!,
                'clinicalAttributeId'
            );
        },
    });

    readonly clinicalAttributeIdToDataType = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            const clinicalAttributeIdToDataType: { [id: string]: string } = {};
            _.map(Array.from(this._customCharts.values()), customChart => {
                clinicalAttributeIdToDataType[
                    customChart.uniqueKey
                ] = customChart.clinicalAttribute
                    ? customChart.clinicalAttribute.datatype
                    : DataType.STRING;
            });

            this.clinicalAttributes.result!.forEach(clinicalAttribute => {
                clinicalAttributeIdToDataType[
                    clinicalAttribute.clinicalAttributeId
                ] = clinicalAttribute.datatype;
            });

            return clinicalAttributeIdToDataType;
        },
    });

    readonly MDACCHeatmapStudyMeta = remoteData(
        {
            await: () => [this.queriedPhysicalStudyIds],
            onError: () => {},
            invoke: async () => {
                if (getServerConfig().show_mdacc_heatmap) {
                    let isSinglePhysicalStudy =
                        this.queriedPhysicalStudyIds.result.length === 1;
                    if (isSinglePhysicalStudy) {
                        return await getHeatmapMeta(
                            getMDAndersonHeatmapStudyMetaUrl(
                                this.queriedPhysicalStudyIds.result[0]
                            )
                        );
                    }
                }
                return []; // if not enabled or conditions not met, just return default answer
            },
        },
        []
    );

    readonly oncokbCancerGenes = remoteData<CancerGene[]>({
        await: () => [],
        invoke: async () => {
            return oncoKBClient.utilsCancerGeneListGetUsingGET_1({});
        },
        onError: () => {},
        default: [],
    });

    readonly oncokbGenes = remoteData<CancerGene[]>({
        await: () => [this.oncokbCancerGenes],
        invoke: async () => {
            return this.oncokbCancerGenes.result.filter(
                cancerGene => cancerGene.oncokbAnnotated
            );
        },
        onError: () => {},
        default: [],
    });

    readonly oncokbCancerGeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbCancerGenes],
        invoke: async () => {
            return this.oncokbCancerGenes.result.map(gene => gene.entrezGeneId);
        },
        default: [],
    });

    readonly oncokbAnnotatedGeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbCancerGenes],
        invoke: async () => {
            return this.oncokbCancerGenes.result
                .filter(gene => gene.oncokbAnnotated)
                .map(gene => gene.entrezGeneId);
        },
        default: [],
    });

    readonly oncokbOncogeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbGenes],
        invoke: async () => {
            return this.oncokbGenes.result
                .filter(gene => gene.oncogene)
                .map(gene => gene.entrezGeneId);
        },
        default: [],
    });

    readonly oncokbTumorSuppressorGeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbGenes],
        invoke: async () => {
            return this.oncokbGenes.result
                .filter(gene => gene.tsg)
                .map(gene => gene.entrezGeneId);
        },
        default: [],
    });

    readonly genericAssayEntitiesGroupedByGenericAssayType = remoteData<{
        [genericAssayType: string]: GenericAssayMeta[];
    }>({
        await: () => [this.genericAssayProfiles],
        invoke: async () => {
            return await fetchGenericAssayMetaByMolecularProfileIdsGroupedByGenericAssayType(
                this.genericAssayProfiles.result
            );
        },
    });

    readonly genericAssayEntitiesGroupedByProfileId = remoteData<{
        [profileId: string]: GenericAssayMeta[];
    }>({
        await: () => [this.genericAssayProfiles],
        invoke: async () => {
            return await fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId(
                this.genericAssayProfiles.result
            );
        },
    });

    readonly genericAssayStableIdToMeta = remoteData<{
        [genericAssayStableId: string]: GenericAssayMeta;
    }>({
        await: () => [this.genericAssayEntitiesGroupedByGenericAssayType],
        invoke: () => {
            return Promise.resolve(
                _.chain(
                    this.genericAssayEntitiesGroupedByGenericAssayType.result
                )
                    .values()
                    .flatten()
                    .uniqBy(meta => meta.stableId)
                    .keyBy(meta => meta.stableId)
                    .value()
            );
        },
    });

    readonly genericAssayProfiles = remoteData({
        await: () => [this.molecularProfiles],
        invoke: () => {
            return Promise.resolve(
                this.molecularProfiles.result.filter(
                    profile =>
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                )
            );
        },
        default: [],
    });

    readonly genericAssayProfileOptionsByType = remoteData({
        await: () => [
            this.genericAssayProfiles,
            this.molecularProfileSampleCountSet,
        ],
        invoke: () => {
            return Promise.resolve(
                _.chain(this.genericAssayProfiles.result)
                    .filter(
                        profile =>
                            profile.molecularAlterationType ===
                            AlterationTypeConstants.GENERIC_ASSAY
                    )
                    .groupBy(profile => profile.genericAssayType)
                    .mapValues(profiles => {
                        return _.chain(profiles)
                            .groupBy(molecularProfile =>
                                getSuffixOfMolecularProfile(molecularProfile)
                            )
                            .map((profiles, value) => {
                                return {
                                    value: value,
                                    count:
                                        this.molecularProfileSampleCountSet
                                            .result[value] || 0,
                                    label: profiles[0].name,
                                    description: profiles[0].description,
                                    dataType: profiles[0].datatype,
                                    patientLevel: profiles[0].patientLevel,
                                    profileIds: profiles.map(
                                        profile => profile.molecularProfileId
                                    ),
                                };
                            })
                            .value();
                    })
                    .value()
            );
        },
        default: {},
    });

    @computed({ keepAlive: true })
    get oncokbCancerGeneFilterEnabled(): boolean {
        if (!getServerConfig().show_oncokb) {
            return false;
        }
        return !this.oncokbCancerGenes.isError && !this.oncokbGenes.isError;
    }

    @computed get isSingleVirtualStudyPageWithoutFilter(): boolean {
        return (
            this.filteredPhysicalStudies.result.length +
                this.filteredVirtualStudies.result.length ===
                1 &&
            this.filteredVirtualStudies.result.length > 0 &&
            !this.chartsAreFiltered
        );
    }

    @computed get analysisGroupsPossible(): boolean {
        // analysis groups possible iff there are visible analysis groups-capable charts
        const analysisGroupsCharts = this.survivalPlotKeys;
        let ret = false;
        for (const chartMeta of this.visibleAttributes) {
            if (analysisGroupsCharts.includes(chartMeta.uniqueKey)) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    @computed get survivalPlotKeys(): string[] {
        if (this.survivalClinicalAttributesPrefix.result) {
            return this.survivalClinicalAttributesPrefix.result.map(
                prefix => `${prefix}_SURVIVAL`
            );
        } else {
            return [];
        }
    }

    @autobind
    isChartNameValid(chartName: string): boolean {
        const match = _.find(
            this.chartMetaSet,
            chartMeta =>
                chartMeta.displayName.toUpperCase() === chartName.toUpperCase()
        );
        return match === undefined;
    }
    @autobind
    getDefaultCustomChartName(): string {
        return `${DEFAULT_CHART_NAME} ${this._customCharts.size -
            SPECIAL_CHARTS.length +
            1}`;
    }

    @action.bound
    async addCustomChart(
        newChart: CustomChartData,
        loadedfromUserSettings: boolean = false
    ): Promise<void> {
        const newChartName = newChart.displayName
            ? newChart.displayName
            : this.getDefaultCustomChartName();

        let allCases: CustomChartIdentifierWithValue[] = newChart.data;

        var sessionId = await sessionServiceClient.saveCustomData({
            origin: toJS(this.studyIds),
            displayName: newChartName,
            description: newChartName,
            datatype: 'STRING',
            patientAttribute: false,
            priority: 0,
            data: allCases,
        });
        const uniqueKey = sessionId.id;

        const clinicalAttribute: ClinicalAttribute = {
            clinicalAttributeId: uniqueKey,
            datatype: 'STRING',
            description: newChartName,
            displayName: newChartName,
            patientAttribute: false,
            priority: 0,
        } as any;

        let chartMeta: ChartMeta = {
            uniqueKey: uniqueKey,
            displayName: newChartName,
            description: newChartName,
            dataType: ChartMetaDataTypeEnum.CUSTOM_DATA,
            patientAttribute: false,
            renderWhenDataChange: false,
            priority: 0,
            clinicalAttribute,
        };
        this.customChartSet.set(uniqueKey, {
            ...chartMeta,
            data: allCases,
        });

        this._newlyCreatedCustomChartSet.set(uniqueKey, {
            ...chartMeta,
            data: allCases,
        });

        if (newChart.patientAttribute) {
            chartMeta.patientAttribute = true;
        }

        this._customCharts.set(uniqueKey, chartMeta);
        this._customChartsSelectedCases.set(uniqueKey, allCases);
        this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
        this.chartsDimension.set(uniqueKey, { w: 1, h: 1 });
        this.changeChartVisibility(uniqueKey, true);
        // Autoselect the groups
        if (!loadedfromUserSettings) {
            const filters = _.chain(allCases)
                .map(
                    sampleIdentifierWithValue => sampleIdentifierWithValue.value
                )
                .uniq()
                .value();
            this.setCustomChartFilters(chartMeta.uniqueKey, filters);
            this.newlyAddedCharts.clear();
            this.newlyAddedCharts.push(uniqueKey);
        }
    }

    @action.bound
    addXvsYScatterChart(
        attrIds: { xAttrId: string; yAttrId: string },
        loadedfromUserSettings: boolean = false,
        dontAddToNewlyAddedCharts: boolean = false
    ): void {
        if (!loadedfromUserSettings) {
            this.newlyAddedCharts.clear();
        }
        const xAttr = this.clinicalAttributes.result!.find(
            a => a.clinicalAttributeId === attrIds.xAttrId
        )!;
        const yAttr = this.clinicalAttributes.result!.find(
            a => a.clinicalAttributeId === attrIds.yAttrId
        )!;
        const newChart: XvsYScatterChart = { xAttr, yAttr, plotDomain: {} };
        if (
            xAttr.clinicalAttributeId ===
            SpecialChartsUniqueKeyEnum.MUTATION_COUNT
        ) {
            newChart.plotDomain!.x = MUTATION_COUNT_PLOT_DOMAIN;
        } else if (
            xAttr.clinicalAttributeId ===
            SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
        ) {
            newChart.plotDomain!.x = FGA_PLOT_DOMAIN;
        }
        if (
            yAttr.clinicalAttributeId ===
            SpecialChartsUniqueKeyEnum.MUTATION_COUNT
        ) {
            newChart.plotDomain!.y = MUTATION_COUNT_PLOT_DOMAIN;
        } else if (
            yAttr.clinicalAttributeId ===
            SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
        ) {
            newChart.plotDomain!.y = FGA_PLOT_DOMAIN;
        }
        const uniqueKey = makeXvsYUniqueKey(
            newChart.xAttr.clinicalAttributeId,
            newChart.yAttr.clinicalAttributeId
        );

        if (this._XvsYScatterChartMap.has(uniqueKey)) {
            this.changeChartVisibility(uniqueKey, true);
        } else {
            const chartMeta: ChartMeta = {
                uniqueKey: uniqueKey,
                displayName: makeXvsYDisplayName(
                    newChart.xAttr,
                    newChart.yAttr
                ),
                description: '',
                dataType: ChartMetaDataTypeEnum.X_VS_Y_SCATTER,
                patientAttribute: false,
                renderWhenDataChange: false,
                priority: 0,
            };
            if (uniqueKey === FGA_VS_MUTATION_COUNT_KEY) {
                chartMeta.priority = getDefaultPriorityByUniqueKey(
                    FGA_VS_MUTATION_COUNT_KEY
                );
            }

            this._XvsYCharts.set(uniqueKey, chartMeta);

            this._XvsYScatterChartMap.set(uniqueKey, newChart);
            this._XvsYChartSettings.set(uniqueKey, {
                xLogScale: false,
                yLogScale: false,
            });
            this.changeChartVisibility(uniqueKey, true);
            this.chartsType.set(uniqueKey, ChartTypeEnum.SCATTER);
            this.chartsDimension.set(
                uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SCATTER]
            );

            /*this._customBinsFromScatterPlotSelectionSet.set(uniqueKey, {
                clinicalDataType: 'SAMPLE',
                disableLogScale: false,
                hugoGeneSymbol: newChart.hugoGeneSymbol,
                profileType: newChart.profileType,
            } as any);*/
        }

        if (!loadedfromUserSettings && !dontAddToNewlyAddedCharts) {
            this.newlyAddedCharts.push(uniqueKey);
        }
    }

    @action.bound
    addXvsYViolinChart(
        attrIds: { categoricalAttrId: string; numericalAttrId: string },
        loadedfromUserSettings: boolean = false,
        dontAddToNewlyAddedCharts: boolean = false
    ): void {
        if (!loadedfromUserSettings) {
            this.newlyAddedCharts.clear();
        }
        const categoricalAttr = this.clinicalAttributes.result!.find(
            a => a.clinicalAttributeId === attrIds.categoricalAttrId
        )!;
        const numericalAttr = this.clinicalAttributes.result!.find(
            a => a.clinicalAttributeId === attrIds.numericalAttrId
        )!;
        const newChart: XvsYViolinChart = {
            categoricalAttr,
            numericalAttr,
            violinDomain: {},
        };
        switch (numericalAttr.clinicalAttributeId) {
            case SpecialChartsUniqueKeyEnum.MUTATION_COUNT:
                newChart.violinDomain = MUTATION_COUNT_PLOT_DOMAIN;
                break;
            case SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED:
                newChart.violinDomain = FGA_PLOT_DOMAIN;
                break;
        }
        const uniqueKey = makeXvsYUniqueKey(
            newChart.categoricalAttr.clinicalAttributeId,
            newChart.numericalAttr.clinicalAttributeId
        );

        if (this._XvsYViolinChartMap.has(uniqueKey)) {
            this.changeChartVisibility(uniqueKey, true);
        } else {
            const chartMeta: ChartMeta = {
                uniqueKey: uniqueKey,
                displayName: '',
                description: '',
                dataType: ChartMetaDataTypeEnum.X_VS_Y_VIOLIN,
                patientAttribute: false,
                renderWhenDataChange: false,
                priority: 0,
            };

            this._XvsYCharts.set(uniqueKey, chartMeta);

            this._XvsYViolinChartMap.set(uniqueKey, newChart);
            this._XvsYChartSettings.set(uniqueKey, {
                violinLogScale: false,
                showBox: true,
                showViolin: true,
            });
            this.changeChartVisibility(uniqueKey, true);
            this.chartsType.set(uniqueKey, ChartTypeEnum.VIOLIN_PLOT_TABLE);
            this.chartsDimension.set(
                uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[
                    ChartTypeEnum.VIOLIN_PLOT_TABLE
                ]
            );
        }

        if (!loadedfromUserSettings && !dontAddToNewlyAddedCharts) {
            this.newlyAddedCharts.push(uniqueKey);
        }
    }

    @action.bound
    addGeneSpecificCharts(
        newCharts: GenomicChart[],
        loadedfromUserSettings: boolean = false
    ): void {
        if (!loadedfromUserSettings) {
            this.newlyAddedCharts.clear();
        }
        newCharts.forEach(newChart => {
            const uniqueKey = getGenomicChartUniqueKey(
                newChart.hugoGeneSymbol,
                newChart.profileType
            );

            if (this._geneSpecificChartMap.has(uniqueKey)) {
                this.changeChartVisibility(uniqueKey, true);
            } else {
                const newChartName = newChart.name
                    ? newChart.name
                    : this.getDefaultCustomChartName();
                let chartMeta: ChartMeta = {
                    uniqueKey: uniqueKey,
                    displayName: newChartName,
                    description: newChart.description || newChartName,
                    dataType: ChartMetaDataTypeEnum.GENE_SPECIFIC,
                    patientAttribute: false,
                    renderWhenDataChange: false,
                    priority: 0,
                };

                this._geneSpecificCharts.set(uniqueKey, chartMeta);

                this._geneSpecificChartMap.set(uniqueKey, newChart);
                this.changeChartVisibility(uniqueKey, true);
                this.chartsType.set(uniqueKey, ChartTypeEnum.BAR_CHART);
                this.chartsDimension.set(uniqueKey, { w: 2, h: 1 });

                this._genomicDataBinFilterSet.set(uniqueKey, {
                    clinicalDataType: 'SAMPLE',
                    disableLogScale: false,
                    hugoGeneSymbol: newChart.hugoGeneSymbol,
                    profileType: newChart.profileType,
                } as any);
            }

            if (!loadedfromUserSettings) {
                this.newlyAddedCharts.push(uniqueKey);
            }
        });
    }

    @action.bound
    addGenericAssayContinuousCharts(
        newCharts: GenericAssayChart[],
        loadedfromUserSettings: boolean = false
    ): void {
        if (!loadedfromUserSettings) {
            this.newlyAddedCharts.clear();
        }
        newCharts.forEach(newChart => {
            const uniqueKey = getGenericAssayChartUniqueKey(
                newChart.genericAssayEntityId,
                newChart.profileType
            );

            if (this._genericAssayChartMap.has(uniqueKey)) {
                this.changeChartVisibility(uniqueKey, true);
            } else {
                const newChartName = newChart.name
                    ? newChart.name
                    : this.getDefaultCustomChartName();
                let chartMeta: ChartMeta = {
                    uniqueKey: uniqueKey,
                    displayName: newChartName,
                    description: newChart.description || newChartName,
                    dataType: ChartMetaDataTypeEnum.GENERIC_ASSAY,
                    patientAttribute: newChart.patientLevel || false,
                    renderWhenDataChange: false,
                    priority: 0,
                    genericAssayType: newChart.genericAssayType,
                };

                this._genericAssayCharts.set(uniqueKey, chartMeta);

                this._genericAssayChartMap.set(uniqueKey, newChart);
                this.changeChartVisibility(uniqueKey, true);
                this.chartsType.set(uniqueKey, ChartTypeEnum.BAR_CHART);
                this.chartsDimension.set(uniqueKey, { w: 2, h: 1 });

                this._genericAssayDataBinFilterSet.set(uniqueKey, {
                    clinicalDataType: 'SAMPLE',
                    disableLogScale: false,
                    stableId: newChart.genericAssayEntityId,
                    profileType: newChart.profileType,
                } as any);
            }

            if (!loadedfromUserSettings) {
                this.newlyAddedCharts.push(uniqueKey);
            }
        });
    }

    @action.bound
    addGenericAssayBinaryOrCategoricalCharts(
        newCharts: GenericAssayChart[],
        loadedfromUserSettings: boolean = false
    ): void {
        if (!loadedfromUserSettings) {
            this.newlyAddedCharts.clear();
        }
        newCharts.forEach(newChart => {
            const uniqueKey = getGenericAssayChartUniqueKey(
                newChart.genericAssayEntityId,
                newChart.profileType
            );

            if (this._genericAssayChartMap.has(uniqueKey)) {
                this.changeChartVisibility(uniqueKey, true);
            } else {
                const newChartName = newChart.name
                    ? newChart.name
                    : this.getDefaultCustomChartName();
                let chartMeta: ChartMeta = {
                    uniqueKey: uniqueKey,
                    displayName: newChartName,
                    description: newChart.description || newChartName,
                    dataType: ChartMetaDataTypeEnum.GENERIC_ASSAY,
                    patientAttribute: newChart.patientLevel || false,
                    renderWhenDataChange: false,
                    priority: 0,
                    genericAssayType: newChart.genericAssayType,
                };

                this._genericAssayCharts.set(uniqueKey, chartMeta);

                this._genericAssayChartMap.set(uniqueKey, newChart);
                this.changeChartVisibility(uniqueKey, true);
                this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
                this.chartsDimension.set(
                    uniqueKey,
                    STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.PIE_CHART]
                );
            }

            if (!loadedfromUserSettings) {
                this.newlyAddedCharts.push(uniqueKey);
            }
        });
    }

    @action.bound
    updateCustomSelect(newChart: CustomChartData): void {
        this.clearAllFilters();
        const sampleIdentifiers = newChart.data.map(datum => ({
            studyId: datum.studyId,
            sampleId: datum.sampleId,
        }));
        this.numberOfSelectedSamplesInCustomSelection =
            sampleIdentifiers.length;
        this.updateChartSampleIdentifierFilter(
            SpecialChartsUniqueKeyEnum.CUSTOM_SELECT,
            sampleIdentifiers,
            false
        );
    }

    @computed
    get chartMetaSet(): { [id: string]: ChartMeta } {
        let _chartMetaSet = _.fromPairs(this._customCharts.toJSON());
        if (_.isEmpty(this.molecularProfiles.result)) {
            delete _chartMetaSet[
                SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT
            ];
        }
        _chartMetaSet = _.merge(
            _chartMetaSet,
            _.fromPairs(this._geneSpecificCharts.toJSON()),
            _.fromPairs(this._genericAssayCharts.toJSON()),
            _.fromPairs(this._XvsYCharts.toJSON())
        );

        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(
            this.chartClinicalAttributes.result,
            (acc: { [id: string]: ChartMeta }, attribute) => {
                const uniqueKey = getUniqueKey(attribute);
                acc[uniqueKey] = {
                    displayName: attribute.displayName,
                    uniqueKey: uniqueKey,
                    dataType: getChartMetaDataType(uniqueKey),
                    patientAttribute: attribute.patientAttribute,
                    description: attribute.description,
                    priority: getPriorityByClinicalAttribute(attribute),
                    renderWhenDataChange: false,
                    clinicalAttribute: attribute,
                };
                return acc;
            },
            _chartMetaSet
        );

        _.reduce(
            this.survivalPlots.result,
            (acc: { [id: string]: ChartMeta }, survivalPlot) => {
                acc[survivalPlot.id] = {
                    uniqueKey: survivalPlot.id,
                    dataType: getChartMetaDataType(survivalPlot.id),
                    patientAttribute: true,
                    displayName: survivalPlot.title,
                    // use survival status attribute's priority as KM plot's priority for non-reserved plots
                    priority:
                        STUDY_VIEW_CONFIG.priority[survivalPlot.id] ||
                        getPriorityByClinicalAttribute(
                            survivalPlot.survivalStatusAttribute
                        ),
                    renderWhenDataChange: false,
                    description: '',
                };
                return acc;
            },
            _chartMetaSet
        );

        if (this.shouldDisplaySampleTreatments.result) {
            _chartMetaSet['SAMPLE_TREATMENTS'] = {
                uniqueKey: 'SAMPLE_TREATMENTS',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Treatment per Sample (pre/post)',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatments and the corresponding number of samples acquired before treatment or after/on treatment',
            };
        }

        if (this.shouldDisplayPatientTreatments.result) {
            _chartMetaSet['PATIENT_TREATMENTS'] = {
                uniqueKey: 'PATIENT_TREATMENTS',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Treatment per Patient',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.PATIENT_TREATMENTS_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatments and the corresponding number of patients treated',
            };
        }

        if (this.shouldDisplaySampleTreatmentGroups.result) {
            _chartMetaSet['SAMPLE_TREATMENT_GROUPS'] = {
                uniqueKey: 'SAMPLE_TREATMENT_GROUPS',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Treatment Category per Sample (pre/post)',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatments groups and the corresponding number of samples acquired before treatment or after/on treatment',
            };
        }

        if (this.shouldDisplayPatientTreatmentGroups.result) {
            _chartMetaSet['PATIENT_TREATMENT_GROUPS'] = {
                uniqueKey: 'PATIENT_TREATMENT_GROUPS',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Treatment Category per Patient',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatment groups and the corresponding number of patients treated',
            };
        }

        if (this.shouldDisplaySampleTreatmentTarget.result) {
            _chartMetaSet['SAMPLE_TREATMENT_TARGET'] = {
                uniqueKey: 'SAMPLE_TREATMENT_TARGET',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Treatment Target per Sample (pre/post)',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatments targets and the corresponding number of samples acquired before treatment or after/on treatment',
            };
        }

        if (this.shouldDisplayPatientTreatmentTarget.result) {
            _chartMetaSet['PATIENT_TREATMENT_TARGET'] = {
                uniqueKey: 'PATIENT_TREATMENT_TARGET',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Treatment Target per Patient',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatment targets and the corresponding number of patients treated',
            };
        }

        if (!_.isEmpty(this.mutationProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.mutationProfiles.result.map(
                    mutationProfile => mutationProfile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'Mutated Genes',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.MUTATED_GENES_TABLE
                ),
                renderWhenDataChange: false,
                description: '',
            };
        }

        if (!_.isEmpty(this.structuralVariantProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.structuralVariantProfiles.result.map(
                    profile => profile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'Structural Variant Genes',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
                ),
                renderWhenDataChange: true,
                description: '',
            };
        }

        if (!_.isEmpty(this.cnaProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.cnaProfiles.result.map(
                    mutationProfile => mutationProfile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'CNA Genes',
                renderWhenDataChange: false,
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.CNA_GENES_TABLE
                ),
                description: '',
            };
        }

        return _chartMetaSet;
    }

    @computed
    get chartMetaSetWithChartType(): {
        [id: string]: ChartMeta & { chartType: ChartType };
    } {
        return _.reduce(
            this.chartMetaSet,
            (acc, chartMeta) => {
                acc[chartMeta.uniqueKey] = {
                    ...chartMeta,
                    chartType: this.chartsType.get(chartMeta.uniqueKey),
                };
                return acc;
            },
            {} as any
        );
    }

    @computed
    get visibleAttributes(): ChartMeta[] {
        return _.reduce(
            Array.from(this._chartVisibility.entries()),
            (acc, [chartUniqueKey, visible]) => {
                if (visible && this.chartMetaSet[chartUniqueKey]) {
                    let chartMeta = this.chartMetaSet[chartUniqueKey];
                    acc.push(chartMeta);
                }
                return acc;
            },
            [] as ChartMeta[]
        );
    }

    @computed
    get showSettingRestoreMsg(): boolean {
        return !!(
            this.isSavingUserPreferencePossible &&
            !this.hideRestoreSettingsMsg &&
            this.userSettings.isComplete &&
            this.userSettings.result &&
            !_.isEqual(
                this.previousSettings,
                _.keyBy(
                    this.userSettings.result!.chartSettings,
                    chartUserSetting => chartUserSetting.id
                )
            )
        );
    }

    @computed
    get isSavingUserSettingsPossible(): boolean {
        return (
            this.isSavingUserPreferencePossible &&
            this.userSettings.isComplete &&
            (!this.showSettingRestoreMsg ||
                !this.userSettings.result ||
                !_.isEqual(
                    this.currentChartSettingsMap,
                    _.keyBy(
                        this.userSettings.result!.chartSettings,
                        chartSetting => chartSetting.id
                    )
                ) ||
                !_.isEqual(
                    toJS(this.userGroupColors),
                    this.userSettings.result!.groupColors
                ))
        );
    }

    private isInitiallLoad = true;

    @computed
    get loadingInitialDataForSummaryTab(): boolean {
        if (
            !this.queriedPhysicalStudyIds.isComplete ||
            this.queriedPhysicalStudyIds.result.length === 0
        ) {
            return false;
        }

        let pending =
            this.defaultVisibleAttributes.isPending ||
            this.chartClinicalAttributes.isPending ||
            this.clinicalAttributes.isPending ||
            this.mutationProfiles.isPending ||
            this.cnaProfiles.isPending ||
            this.structuralVariantProfiles.isPending ||
            this.survivalPlots.isPending ||
            this.survivalEntryMonths.isPending ||
            this.shouldDisplayPatientTreatments.isPending ||
            this.sharedCustomData.isPending;

        if (
            this.clinicalAttributes.isComplete &&
            !_.isEmpty(this.clinicalAttributes.result)
        ) {
            pending =
                pending ||
                this.initialVisibleAttributesClinicalDataBinCountData
                    .isPending ||
                this.initialVisibleAttributesClinicalDataCountData.isPending;
        }

        if (this._loadUserSettingsInitially) {
            pending = pending || this.userSettings.isPending;
            pending = pending || this.userSavedCustomData.isPending;
        }
        if (!_.isEmpty(this.initialFilters.genomicDataFilters)) {
            pending = pending || this.molecularProfileSampleCounts.isPending;
        }
        if (!_.isEmpty(this.initialFilters.genericAssayDataFilters)) {
            pending =
                pending || this.genericAssayProfileOptionsByType.isPending;
        }
        if (!_.isEmpty(this.initialFilters.caseLists)) {
            pending = pending || this.caseListSampleCounts.isPending;
        }

        if (!pending && this.isInitiallLoad) {
            pending = pending || this.selectedSamples.result.length === 0;
        }
        if (!pending && this.isInitiallLoad) {
            this.isInitiallLoad = false;
        }
        return pending;
    }

    public updateUserSettings() {
        sessionServiceClient.updateUserSettings({
            page: PageType.STUDY_VIEW,
            origin: toJS(this.studyIds),
            chartSettings: _.values(this.currentChartSettingsMap),
            groupColors: toJS(this.userGroupColors),
        });
    }

    public updateUserSettingsDebounce = _.debounce(() => {
        const chartSettingsChanged = !_.isEqual(
            this.previousSettings,
            this.currentChartSettingsMap
        );
        if (chartSettingsChanged) {
            this.previousSettings = this.currentChartSettingsMap;
            if (!_.isEmpty(this.currentChartSettingsMap)) {
                sessionServiceClient.updateUserSettings({
                    page: PageType.STUDY_VIEW,
                    origin: toJS(this.studyIds),
                    chartSettings: _.values(this.currentChartSettingsMap),
                    groupColors: toJS(this.userGroupColors),
                });
            }
        }
    }, 3000);

    // return contains settings for all visible charts each chart setting
    @computed private get currentChartSettingsMap(): {
        [chartId: string]: ChartUserSetting;
    } {
        let chartSettingsMap: { [chartId: string]: ChartUserSetting } = {};
        if (this.isSavingUserPreferencePossible) {
            chartSettingsMap = getChartSettingsMap(
                this.visibleAttributes,
                this.columns,
                _.fromPairs(this.chartsDimension.toJSON()),
                _.fromPairs(this.chartsType.toJSON()),
                _.fromPairs(this._geneSpecificChartMap.toJSON()),
                _.fromPairs(this._genericAssayChartMap.toJSON()),
                _.fromPairs(this._XvsYScatterChartMap.toJSON()),
                _.fromPairs(this._XvsYViolinChartMap.toJSON()),
                _.fromPairs(this._clinicalDataBinFilterSet.toJSON()),
                this._filterMutatedGenesTableByCancerGenes,
                this._filterSVGenesTableByCancerGenes,
                this._filterCNAGenesTableByCancerGenes,
                this.currentGridLayout
            );
        }
        return chartSettingsMap;
    }

    readonly userSettings = remoteData<StudyPageSettings | undefined>({
        invoke: async () => {
            if (
                this.isSavingUserPreferencePossible &&
                this.studyIds.length > 0
            ) {
                return sessionServiceClient.fetchStudyPageSettings(
                    toJS(this.studyIds)
                );
            }
            return undefined;
        },
        default: undefined,
        onError: () => {
            // fail silently when an error occurs
        },
        onResult: () => {
            const groupColorFromSession =
                this.userSettings.isComplete && this.userSettings.result
                    ? this.userSettings.result.groupColors
                    : {};
            _.forIn(
                groupColorFromSession,
                (value, key) => (this.userGroupColors[key] = value)
            );
        },
    });

    @action.bound
    private clearPageChartSettings() {
        // Only remove visibility of unfiltered chart. This is to fix https://github.com/cBioPortal/cbioportal/issues/8057#issuecomment-747062244'
        _.forEach(
            _.fromPairs(this._chartVisibility.toJSON()),
            (isVisible, chartUniqueKey) => {
                if (isVisible && !this.isChartFiltered(chartUniqueKey)) {
                    this._chartVisibility.delete(chartUniqueKey);
                }
            }
        );
        this.currentGridLayout = [];
        this.currentFocusedChartByUser = undefined;
        this.currentFocusedChartByUserDimension = undefined;
        this._filterMutatedGenesTableByCancerGenes = true;
        this._filterSVGenesTableByCancerGenes = true;
        this._filterCNAGenesTableByCancerGenes = true;
        this._clinicalDataBinFilterSet = observable.map(
            toJS(this._defaultClinicalDataBinFilterSet)
        );
    }

    @action.bound
    loadUserChartSettings() {
        if (
            this.isSavingUserPreferencePossible &&
            this.userSettings.isComplete &&
            this.userSettings.result &&
            !_.isEmpty(this.userSettings.result!.chartSettings)
        ) {
            this.loadChartSettings(this.userSettings.result!.chartSettings);
            // set previousSettings only if user is already logged in
            if (this._loadUserSettingsInitially) {
                this.previousSettings = _.keyBy(
                    this.userSettings.result!.chartSettings,
                    chartSetting => chartSetting.id
                );
            }
        }
    }

    @action.bound
    updateCustomDataList(
        customDataList: (ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        })[],
        forceUpdate: boolean = false,
        showChart: boolean = false
    ): void {
        customDataList.forEach(customData => {
            const uniqueKey = customData.uniqueKey;
            if (!this.customChartSet.has(uniqueKey)) {
                let { data, isSharedChart, ...chartMeta } = customData;
                this._customCharts.set(uniqueKey, chartMeta);
                this._customChartsSelectedCases.set(uniqueKey, data);
                this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
                this.chartsDimension.set(uniqueKey, { w: 1, h: 1 });
                this.customChartSet.set(uniqueKey, customData);
                if (showChart) {
                    this.changeChartVisibility(uniqueKey, true);
                }
            }
            if (forceUpdate) {
                // is then required when user logs in from study page and there shared custom data is which also
                this.customChartSet.set(uniqueKey, customData);
            }
        });
    }

    @action.bound
    public undoUserChartSettings(): void {
        this.loadChartSettings(_.values(this.previousSettings));
        this.previousSettings = {};
    }

    // had to create default variables for eachsince the default chart settings
    // depends on the number of columns (browser width)
    @observable private _defaultChartsDimension = observable.map<
        ChartUniqueKey,
        ChartDimension
    >();
    @observable private _defaultChartsType = observable.map<
        ChartUniqueKey,
        ChartType
    >();
    @observable private _defaultVisibleChartIds: string[] = [];
    @observable private _defaultClinicalDataBinFilterSet = observable.map<
        ChartUniqueKey,
        ClinicalDataBinFilter & { showNA?: boolean }
    >();

    @computed get _defaultXvsYChartMap() {
        const map: { [uniqueKey: string]: XvsYScatterChart } = {};

        let mutationCountAttr: ClinicalAttribute | undefined;
        let fractionGenomeAlteredAttr: ClinicalAttribute | undefined;
        this.clinicalAttributes.result.forEach((obj: ClinicalAttribute) => {
            if (obj.priority !== '0') {
                if (
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT ===
                    obj.clinicalAttributeId
                ) {
                    mutationCountAttr = obj;
                } else if (
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED ===
                    obj.clinicalAttributeId
                ) {
                    fractionGenomeAlteredAttr = obj;
                }
            }
        });
        if (
            mutationCountAttr &&
            fractionGenomeAlteredAttr &&
            getDefaultPriorityByUniqueKey(FGA_VS_MUTATION_COUNT_KEY) !== 0
        ) {
            map[FGA_VS_MUTATION_COUNT_KEY] = {
                xAttr: fractionGenomeAlteredAttr,
                yAttr: mutationCountAttr,
                plotDomain: {
                    x: FGA_PLOT_DOMAIN,
                    y: MUTATION_COUNT_PLOT_DOMAIN,
                },
            };
        }

        return map;
    }

    @action.bound
    public resetToDefaultChartSettings(): void {
        this.clearPageChartSettings();
        this.loadChartSettings(_.values(this.defaultChartSettingsMap));
    }

    @computed get showResetToDefaultButton(): boolean {
        return !_.isEqual(
            this.currentChartSettingsMap,
            this.defaultChartSettingsMap
        );
    }

    @computed private get defaultChartSettingsMap(): {
        [chartId: string]: ChartUserSetting;
    } {
        const visibleAttributes = _.reduce(
            this._defaultVisibleChartIds,
            (acc, chartUniqueKey) => {
                if (this.chartMetaSet[chartUniqueKey]) {
                    acc.push(this.chartMetaSet[chartUniqueKey]);
                }
                return acc;
            },
            [] as ChartMeta[]
        );
        return getChartSettingsMap(
            visibleAttributes,
            this.columns,
            _.fromPairs(this._defaultChartsDimension.toJSON()),
            _.fromPairs(this._defaultChartsType.toJSON()),
            {},
            {},
            this._defaultXvsYChartMap,
            {},
            _.fromPairs(this._defaultClinicalDataBinFilterSet.toJSON())
        );
    }

    @action.bound
    private loadChartSettings(chartSettings: ChartUserSetting[]): void {
        this.clearPageChartSettings();
        const validChartTypes = Object.values(ChartTypeEnum).map(chartType =>
            chartType.toString()
        );
        _.map(chartSettings, chartUserSettings => {
            if (chartUserSettings.name && chartUserSettings.groups) {
                type CustomGroup = {
                    name: string;
                    sampleIdentifiers: {
                        studyId: string;
                        sampleId: string;
                        patientId: string;
                    }[];
                };

                const groups: CustomGroup[] = chartUserSettings.groups as any;
                const data: CustomChartIdentifierWithValue[] = _.flatMap(
                    groups,
                    group => {
                        return group.sampleIdentifiers.map(sampleIdentifier => {
                            return {
                                ...sampleIdentifier,
                                value: group.name,
                            };
                        });
                    }
                );

                const chart = {
                    origin: this.studyIds,
                    displayName: chartUserSettings.name,
                    description: chartUserSettings.name,
                    datatype: 'STRING',
                    patientAttribute: chartUserSettings.patientAttribute,
                    priority: 0,
                    data,
                };

                this.addCustomChart(chart, true);
            }
            if (
                chartUserSettings.hugoGeneSymbol &&
                chartUserSettings.profileType
            ) {
                this.addGeneSpecificCharts(
                    [
                        {
                            name: chartUserSettings.name,
                            description: chartUserSettings.description,
                            profileType: chartUserSettings.profileType,
                            hugoGeneSymbol: chartUserSettings.hugoGeneSymbol,
                        },
                    ],
                    true
                );
            }
            if (
                chartUserSettings.genericAssayEntityId &&
                chartUserSettings.profileType
            ) {
                this.addGenericAssayContinuousCharts(
                    [
                        {
                            name: chartUserSettings.name,
                            description: chartUserSettings.description,
                            profileType: chartUserSettings.profileType,
                            genericAssayType: chartUserSettings.genericAssayType!,
                            genericAssayEntityId:
                                chartUserSettings.genericAssayEntityId,
                            dataType: chartUserSettings.dataType,
                            patientLevel: chartUserSettings.patientLevelProfile,
                        },
                    ],
                    true
                );
            }
            if (chartUserSettings.chartType === ChartTypeEnum.SCATTER) {
                this.addXvsYScatterChart(
                    {
                        xAttrId: chartUserSettings.xAttrId!,
                        yAttrId: chartUserSettings.yAttrId!,
                    },
                    true
                );
            }
            if (
                chartUserSettings.chartType === ChartTypeEnum.VIOLIN_PLOT_TABLE
            ) {
                this.addXvsYViolinChart(
                    {
                        categoricalAttrId: chartUserSettings.categoricalAttrId!,
                        numericalAttrId: chartUserSettings.numericalAttrId!,
                    },
                    true
                );
            }
            if (chartUserSettings.layout) {
                this.currentGridLayout.push({
                    i: chartUserSettings.id,
                    isResizable: true,
                    moved: false,
                    static: false,
                    ...chartUserSettings.layout,
                });
                this.chartsDimension.set(chartUserSettings.id, {
                    w: chartUserSettings.layout.w,
                    h: chartUserSettings.layout.h,
                });
            }

            switch (chartUserSettings.chartType) {
                case ChartTypeEnum.MUTATED_GENES_TABLE:
                    this._filterMutatedGenesTableByCancerGenes =
                        chartUserSettings.filterByCancerGenes === undefined
                            ? true
                            : chartUserSettings.filterByCancerGenes;
                    break;
                case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
                    this._filterSVGenesTableByCancerGenes =
                        chartUserSettings.filterByCancerGenes === undefined
                            ? true
                            : chartUserSettings.filterByCancerGenes;
                    break;
                case ChartTypeEnum.CNA_GENES_TABLE:
                    this._filterCNAGenesTableByCancerGenes =
                        chartUserSettings.filterByCancerGenes === undefined
                            ? true
                            : chartUserSettings.filterByCancerGenes;
                    break;
                case ChartTypeEnum.BAR_CHART:
                    let ref = this._clinicalDataBinFilterSet.get(
                        chartUserSettings.id
                    );
                    if (ref) {
                        if (chartUserSettings.customBins) {
                            ref.customBins = chartUserSettings.customBins;
                        }
                        if (chartUserSettings.disableLogScale) {
                            ref.disableLogScale =
                                chartUserSettings.disableLogScale;
                        }
                        ref.showNA = chartUserSettings.showNA;
                    }
                    break;
                default:
                    break;
            }
            let chartType = chartUserSettings.chartType;
            if (chartType) {
                // map any old FUSION_GENES_TABLE chart types to STRUCTURAL_VARIANT_GENES_TABLE
                if (chartType.toString() === 'FUSION_GENES_TABLE') {
                    chartType = ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE;
                }
                //only valid chart types should be visible
                if (validChartTypes.includes(chartType)) {
                    this.changeChartVisibility(chartUserSettings.id, true);
                    this.chartsType.set(chartUserSettings.id, chartType);
                }
            }
        });
        this.useCurrentGridLayout = true;
    }

    @action.bound
    updateChartStats(): void {
        this.initializeChartStatsByClinicalAttributes();

        if (!_.isEmpty(this.molecularProfiles.result)) {
            const chartMeta = _.find(
                this.chartMetaSet,
                chartMeta =>
                    chartMeta.uniqueKey ===
                    SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT
            );
            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT,
                ChartTypeEnum.GENOMIC_PROFILES_TABLE
            );
            this.chartsDimension.set(
                SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT,
                STUDY_VIEW_CONFIG.layout.dimensions[
                    ChartTypeEnum.GENOMIC_PROFILES_TABLE
                ]
            );
            if (chartMeta && chartMeta.priority !== 0) {
                this.changeChartVisibility(chartMeta.uniqueKey, true);
            }
        }

        if (this.shouldDisplayPatientTreatments.result) {
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENTS,
                true
            );
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.PATIENT_TREATMENTS,
                true
            );

            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.PATIENT_TREATMENTS,
                ChartTypeEnum.PATIENT_TREATMENTS_TABLE
            );

            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENTS,
                ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
            );
        }

        if (this.shouldDisplaySampleTreatmentGroups.result) {
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENT_GROUPS,
                true
            );
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.PATIENT_TREATMENT_GROUPS,
                true
            );

            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.PATIENT_TREATMENT_GROUPS,
                ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE
            );

            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENT_GROUPS,
                ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE
            );
        }

        if (this.shouldDisplaySampleTreatmentTarget.result) {
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENT_TARGET,
                true
            );
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.PATIENT_TREATMENT_TARGET,
                true
            );

            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.PATIENT_TREATMENT_TARGET,
                ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE
            );

            this.chartsType.set(
                SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENT_TARGET,
                ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE
            );
        }

        if (!_.isEmpty(this.mutationProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.mutationProfiles.result.map(
                    mutationProfile => mutationProfile.molecularProfileId
                )
            );
            const mutatedGeneMeta = _.find(
                this.chartMetaSet,
                chartMeta => chartMeta.uniqueKey === uniqueKey
            );
            this.chartsType.set(uniqueKey, ChartTypeEnum.MUTATED_GENES_TABLE);
            this.chartsDimension.set(
                uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[
                    ChartTypeEnum.MUTATED_GENES_TABLE
                ]
            );
            if (mutatedGeneMeta && mutatedGeneMeta.priority !== 0) {
                this.changeChartVisibility(mutatedGeneMeta.uniqueKey, true);
            }
        }
        if (!_.isEmpty(this.structuralVariantProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.structuralVariantProfiles.result.map(
                    profile => profile.molecularProfileId
                )
            );
            const structuralVariantGeneMeta = _.find(
                this.chartMetaSet,
                chartMeta => chartMeta.uniqueKey === uniqueKey
            );
            if (
                structuralVariantGeneMeta &&
                structuralVariantGeneMeta.priority !== 0
            ) {
                this.changeChartVisibility(
                    structuralVariantGeneMeta.uniqueKey,
                    true
                );
            }
            this.chartsType.set(
                uniqueKey,
                ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
            );
            this.chartsDimension.set(
                uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[
                    ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
                ]
            );
        }
        if (!_.isEmpty(this.cnaProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.cnaProfiles.result.map(
                    mutationProfile => mutationProfile.molecularProfileId
                )
            );
            const cnaGeneMeta = _.find(
                this.chartMetaSet,
                chartMeta => chartMeta.uniqueKey === uniqueKey
            );
            this.chartsType.set(uniqueKey, ChartTypeEnum.CNA_GENES_TABLE);
            this.chartsDimension.set(
                uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[
                    ChartTypeEnum.CNA_GENES_TABLE
                ]
            );
            if (cnaGeneMeta && cnaGeneMeta.priority !== 0) {
                this.changeChartVisibility(cnaGeneMeta.uniqueKey, true);
            }
        }
        if (!_.isEmpty(this.initialFilters.caseLists)) {
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.CASE_LISTS_SAMPLE_COUNT,
                true
            );
        }

        this.initializeClinicalDataCountCharts();
        this.initializeClinicalDataBinCountCharts();
        this.initializeGeneSpecificCharts();
        this.initializeGenericAssayCharts();
        this._defaultChartsDimension = observable.map(
            _.fromPairs(this.chartsDimension.toJSON())
        );
        this._defaultChartsType = observable.map(
            _.fromPairs(this.chartsType.toJSON())
        );
        this._defaultVisibleChartIds = this.visibleAttributes.map(
            attribute => attribute.uniqueKey
        );
        this._defaultClinicalDataBinFilterSet = observable.map(
            _.fromPairs(this._clinicalDataBinFilterSet.toJSON())
        );
    }

    @action
    initializeChartStatsByClinicalAttributes(): void {
        let mutationCountAttr = null;
        let fractionGenomeAlteredAttr = null;

        this.clinicalAttributes.result.forEach((obj: ClinicalAttribute) => {
            const uniqueKey = getUniqueKey(obj);
            if (obj.priority !== '0') {
                if (
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT ===
                    obj.clinicalAttributeId
                ) {
                    mutationCountAttr = obj;
                } else if (
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED ===
                    obj.clinicalAttributeId
                ) {
                    fractionGenomeAlteredAttr = obj;
                }
            }

            if (obj.datatype === DataType.NUMBER) {
                this.chartsType.set(uniqueKey, ChartTypeEnum.BAR_CHART);
                this.chartsDimension.set(
                    uniqueKey,
                    STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.BAR_CHART]
                );
            } else {
                this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
                this.chartsDimension.set(
                    uniqueKey,
                    STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.PIE_CHART]
                );
            }
        });

        this.survivalPlotKeys.forEach(key => {
            this.chartsType.set(key, ChartTypeEnum.SURVIVAL);
            this.chartsDimension.set(
                key,
                STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SURVIVAL]
            );
            // check priority for survival plots, hide the plot if priority is 0
            if (
                key in this.chartMetaSet &&
                this.chartMetaSet[key].priority !== 0
            ) {
                this.changeChartVisibility(key, true);
            }
            // Currently, left truncation is only appliable for Overall Survival data
            if (
                new RegExp('OS_SURVIVAL').test(key) &&
                this.isLeftTruncationAvailable.result
            ) {
                this.updateSurvivalPlotLeftTruncationToggleMap(key, true);
                this.chartsDimension.set(key, {
                    w: 2,
                    h: 2,
                });
            }
        });

        if (
            mutationCountAttr &&
            fractionGenomeAlteredAttr &&
            getDefaultPriorityByUniqueKey(FGA_VS_MUTATION_COUNT_KEY) !== 0
        ) {
            this.addXvsYScatterChart(
                {
                    xAttrId: SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
                    yAttrId: SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                },
                false,
                true
            );
        }

        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENTS,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
            ]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.PATIENT_TREATMENTS,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.PATIENT_TREATMENTS_TABLE
            ]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENT_GROUPS,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE
            ]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.PATIENT_TREATMENT_GROUPS,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE
            ]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENT_TARGET,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE
            ]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.PATIENT_TREATMENT_TARGET,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE
            ]
        );

        if (this.queriedPhysicalStudyIds.result.length > 1) {
            this.showAsPieChart(
                SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
                this.queriedPhysicalStudyIds.result.length
            );
        }
    }

    private getTableDimensionByNumberOfRecords(
        records: number
    ): ChartDimension {
        return records <= STUDY_VIEW_CONFIG.thresholds.rowsInTableForOneGrid
            ? {
                  w: 2,
                  h: 1,
                  minW: 2,
              }
            : {
                  w: 2,
                  h: 2,
                  minW: 2,
              };
    }

    @action.bound
    changeChartType(attr: ChartMeta, newChartType: ChartType): void {
        let data: MobxPromise<ClinicalDataCountSummary[]> | undefined;
        if (newChartType === ChartTypeEnum.TABLE) {
            if (attr.uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
                data = this.cancerStudiesData;
            } else if (this.isUserDefinedCustomDataChart(attr.uniqueKey)) {
                data = this.getCustomDataCount(attr);
            } else if (this.isGenericAssayChart(attr.uniqueKey)) {
                data = this.getGenericAssayChartDataCount(attr);
            } else {
                data = this.getClinicalDataCount(attr);
            }
            if (data !== undefined) {
                this.chartsDimension.set(
                    attr.uniqueKey,
                    this.getTableDimensionByNumberOfRecords(data.result!.length)
                );
            }
            this.chartsType.set(attr.uniqueKey, ChartTypeEnum.TABLE);
        } else {
            this.chartsDimension.set(
                attr.uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[newChartType]
            );
            this.chartsType.set(attr.uniqueKey, newChartType);
        }
        this.currentFocusedChartByUser = _.clone(attr);
        this.currentFocusedChartByUserDimension = this.chartsDimension.get(
            attr.uniqueKey
        );
        this.useCurrentGridLayout = true;
    }

    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            let queriedAttributes = this.clinicalAttributes.result.map(attr => {
                attr.priority = getPriorityByClinicalAttribute(attr).toString();
                return attr;
            });

            let filterAttributes: ClinicalAttribute[] = queriedAttributes
                .sort(clinicalAttributeComparator)
                .slice(0, 20);

            // Also check the initial filters, make sure all clinical attributes in initial filters will be added in default visible attributes
            let initialFilteredAttributeIds: string[] = [];
            if (this.initialFilters.clinicalDataFilters !== undefined) {
                initialFilteredAttributeIds = initialFilteredAttributeIds.concat(
                    this.initialFilters.clinicalDataFilters.map(
                        item => item.attributeId
                    )
                );
            }

            if (initialFilteredAttributeIds.length > 0) {
                const initialFilteredAttributes = _.filter(
                    this.clinicalAttributes.result,
                    item =>
                        initialFilteredAttributeIds.includes(
                            item.clinicalAttributeId
                        )
                );
                if (filterAttributes !== undefined) {
                    filterAttributes = filterAttributes.concat(
                        initialFilteredAttributes
                    );
                }
            }
            return _.uniq(filterAttributes);
        },
        onError: () => {},
        default: [],
    });

    readonly initialVisibleAttributesClinicalDataCountData = remoteData<
        ClinicalDataCountItem[]
    >({
        await: () => [this.defaultVisibleAttributes],
        invoke: async () => {
            const attributes = _.uniqBy(
                _.filter(
                    this.defaultVisibleAttributes.result,
                    attr => attr.datatype === DataType.STRING
                ).map(attr => {
                    return {
                        attributeId: attr.clinicalAttributeId,
                    } as ClinicalDataFilter;
                }),
                attr => attr.attributeId
            );

            return internalClient.fetchClinicalDataCountsUsingPOST({
                clinicalDataCountFilter: {
                    attributes,
                    studyViewFilter: this.initialFilters,
                },
            });
        },
        onError: () => {},
        default: [],
    });

    readonly initialVisibleAttributesClinicalDataBinAttributes = remoteData<
        (ClinicalDataBinFilter & { showNA?: boolean })[]
    >({
        await: () => [this.defaultVisibleAttributes],
        invoke: async () => {
            return _.chain(this.defaultVisibleAttributes.result)
                .filter(attr => attr.datatype === DataType.NUMBER)
                .map(this.getDefaultClinicalDataBinFilter)
                .uniqBy(attr => attr.attributeId)
                .value();
        },
        onError: () => {},
        default: [],
    });

    readonly initialVisibleAttributesClinicalDataBinCountData = remoteData<
        DataBin[]
    >({
        await: () => [this.initialVisibleAttributesClinicalDataBinAttributes],
        invoke: async () => {
            const clinicalDataBinCountData = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                {
                    dataBinMethod: 'STATIC',
                    clinicalDataBinCountFilter: {
                        attributes: this
                            .initialVisibleAttributesClinicalDataBinAttributes
                            .result,
                        studyViewFilter: this.initialFilters,
                    },
                }
            );
            return Promise.resolve(
                convertClinicalDataBinsToDataBins(clinicalDataBinCountData)
            );
        },
        onError: () => {},
        default: [],
    });

    @action
    initializeClinicalDataCountCharts(): void {
        _.each(
            this.initialVisibleAttributesClinicalDataCountData.result,
            item => {
                this.showAsPieChart(item.attributeId, item.counts.length);
            }
        );
    }

    @action
    initializeGeneSpecificCharts(): void {
        if (!_.isEmpty(this.initialFilters.genomicDataFilters)) {
            const molecularProfileOptionByTypeMap = _.keyBy(
                this.molecularProfileSampleCounts.result,
                molecularProfileOption => molecularProfileOption.uniqueKey
            );
            _.each(
                this.initialFilters.genomicDataFilters,
                genomicDataFilter => {
                    if (
                        molecularProfileOptionByTypeMap[
                            genomicDataFilter.profileType
                        ] !== undefined
                    ) {
                        const molecularProfileOption =
                            molecularProfileOptionByTypeMap[
                                genomicDataFilter.profileType
                            ];
                        this.addGeneSpecificCharts(
                            [
                                {
                                    name: `${genomicDataFilter.hugoGeneSymbol}: ${molecularProfileOption.label}`,
                                    description: molecularProfileOption.label,
                                    profileType: genomicDataFilter.profileType,
                                    hugoGeneSymbol:
                                        genomicDataFilter.hugoGeneSymbol,
                                },
                            ],
                            true
                        );
                    }
                }
            );
        }
    }

    @action
    initializeGenericAssayCharts(): void {
        // initialize generic assay continuous data chart
        if (!_.isEmpty(this.initialFilters.genericAssayDataFilters)) {
            _.map(
                this.genericAssayProfileOptionsByType.result,
                (options, type) => {
                    const molecularProfileOptionByTypeMap = _.keyBy(
                        options,
                        molecularProfileOption => molecularProfileOption.value
                    );
                    _.each(
                        this.initialFilters.genericAssayDataFilters,
                        genericAssayDataFilter => {
                            if (
                                molecularProfileOptionByTypeMap[
                                    genericAssayDataFilter.profileType
                                ] !== undefined
                            ) {
                                const molecularProfileOption =
                                    molecularProfileOptionByTypeMap[
                                        genericAssayDataFilter.profileType
                                    ];

                                if (
                                    molecularProfileOption.dataType ===
                                    DataTypeConstants.LIMITVALUE
                                ) {
                                    this.addGenericAssayContinuousCharts(
                                        [
                                            {
                                                name: `${genericAssayDataFilter.stableId}: ${molecularProfileOption.label}`,
                                                description:
                                                    molecularProfileOption.description,
                                                profileType:
                                                    genericAssayDataFilter.profileType,
                                                genericAssayType: type,
                                                genericAssayEntityId:
                                                    genericAssayDataFilter.stableId,
                                                dataType:
                                                    molecularProfileOption.dataType,
                                                patientLevel:
                                                    molecularProfileOption.patientLevel,
                                            },
                                        ],
                                        true
                                    );
                                } else if (
                                    molecularProfileOption.dataType ===
                                    (DataTypeConstants.BINARY ||
                                        DataTypeConstants.CATEGORICAL)
                                ) {
                                    this.addGenericAssayBinaryOrCategoricalCharts(
                                        [
                                            {
                                                name: `${genericAssayDataFilter.stableId}: ${molecularProfileOption.label}`,
                                                description:
                                                    molecularProfileOption.description,
                                                profileType:
                                                    genericAssayDataFilter.profileType,
                                                genericAssayType: type,
                                                genericAssayEntityId:
                                                    genericAssayDataFilter.stableId,
                                                dataType:
                                                    molecularProfileOption.dataType,
                                            },
                                        ],
                                        true
                                    );
                                } else {
                                    // Do nothing, fail silently
                                }
                            }
                        }
                    );
                }
            );
        }
    }

    @action
    initializeClinicalDataBinCountCharts(): void {
        _.each(
            _.groupBy(
                this.initialVisibleAttributesClinicalDataBinCountData.result,
                item => item.id
            ),
            (item: DataBin[], attributeId: string) => {
                if (
                    shouldShowChart(
                        this.initialFilters,
                        item.length,
                        this.samples.result.length
                    )
                ) {
                    this.changeChartVisibility(attributeId, true);
                }
                this.chartsType.set(attributeId, ChartTypeEnum.BAR_CHART);
                this.chartsDimension.set(
                    attributeId,
                    STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.BAR_CHART]
                );
            }
        );
    }

    @computed
    get chartsAreFiltered(): boolean {
        return isFiltered(this.userSelections);
    }

    readonly samples = remoteData<Sample[]>({
        await: () => [
            this.clinicalAttributes,
            this.queriedSampleIdentifiers,
            this.queriedPhysicalStudyIds,
        ],
        invoke: () => {
            let studyViewFilter: StudyViewFilter = {} as any;
            //this logic is need since fetchFilteredSamplesUsingPOST api accepts sampleIdentifiers or studyIds not both
            if (this.queriedSampleIdentifiers.result.length > 0) {
                studyViewFilter.sampleIdentifiers = this.queriedSampleIdentifiers.result;
            } else {
                studyViewFilter.studyIds = this.queriedPhysicalStudyIds.result;
            }

            if (
                !_.isEmpty(studyViewFilter.sampleIdentifiers) ||
                !_.isEmpty(studyViewFilter.studyIds)
            ) {
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: studyViewFilter,
                });
            }
            return Promise.resolve([]);
        },
        onError: () => {},
        default: [],
    });

    public readonly sampleSet = remoteData({
        await: () => [this.samples],
        invoke: () => {
            const sampleSet = new ComplexKeyMap<Sample>();
            for (const sample of this.samples.result!) {
                sampleSet.set(
                    { studyId: sample.studyId, sampleId: sample.sampleId },
                    sample
                );
            }
            return Promise.resolve(sampleSet);
        },
    });

    public readonly selectedSampleSet = remoteData({
        await: () => [this.selectedSamples],
        invoke: () =>
            Promise.resolve(
                ComplexKeyMap.from(this.selectedSamples.result!, s => ({
                    studyId: s.studyId,
                    sampleId: s.sampleId,
                }))
            ),
    });

    public readonly sampleSetByKey = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(this.samples.result!, sample => sample.uniqueSampleKey)
            );
        },
    });

    readonly invalidSampleIds = remoteData<SampleIdentifier[]>({
        await: () => [this.queriedSampleIdentifiers, this.samples],
        invoke: async () => {
            if (
                this.queriedSampleIdentifiers.result.length > 0 &&
                this.samples.result.length !==
                    this.queriedSampleIdentifiers.result.length
            ) {
                let validSampleIdentifiers = _.reduce(
                    this.samples.result,
                    (acc, next) => {
                        acc[next.studyId + '_' + next.sampleId] = true;
                        return acc;
                    },
                    {} as { [id: string]: boolean }
                );
                return _.filter(
                    this.queriedSampleIdentifiers.result,
                    sampleIdentifier => {
                        return !validSampleIdentifiers[
                            sampleIdentifier.studyId +
                                '_' +
                                sampleIdentifier.sampleId
                        ];
                    }
                );
            }
            return [];
        },
        onError: () => {},
        default: [],
    });

    // used in building virtual study
    readonly studyWithSamples = remoteData<StudyWithSamples[]>({
        await: () => [
            this.selectedSamples,
            this.filteredPhysicalStudies,
            this.filteredVirtualStudies,
        ],
        invoke: () => {
            return Promise.resolve(
                getFilteredStudiesWithSamples(
                    this.selectedSamples.result,
                    this.filteredPhysicalStudies.result,
                    this.filteredVirtualStudies.result
                )
            );
        },
        onError: () => {},
        default: [],
    });

    @observable blockLoading = false;

    readonly selectedSamples = remoteData<Sample[]>({
        await: () => [this.samples, this.molecularProfiles],
        invoke: () => {
            //fetch samples when there are only filters applied
            if (this.chartsAreFiltered) {
                if (!this.hasSampleIdentifiersInFilter) {
                    return Promise.resolve([] as Sample[]);
                }
                // here we are validating only the molecular profile ids,
                // but ideally we should validate the entire filters object
                const invalidMolecularProfiles = findInvalidMolecularProfileIds(
                    this.filters,
                    this.molecularProfiles.result
                );

                if (invalidMolecularProfiles.length > 0) {
                    this.appStore.addError(
                        `Invalid molecular profile id(s): ${invalidMolecularProfiles.join(
                            ', '
                        )}`
                    );
                }

                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: this.filters,
                });
            } else {
                return Promise.resolve(this.samples.result);
            }
        },
        onError: () => {},
        default: [],
        onResult: samples => {
            if (samples.length === 0) {
                this.blockLoading = true;
            } else {
                this.blockLoading = false;
            }
        },
    });

    @computed private get hasFilteredSamples(): boolean {
        return (
            this.selectedSamples.isComplete &&
            this.selectedSamples.result!.length > 0
        );
    }

    @computed private get hasSampleIdentifiersInFilter(): boolean {
        return !(
            _.isEmpty(this.filters.studyIds) &&
            _.isEmpty(this.filters.sampleIdentifiers)
        );
    }

    @computed
    get selectedSamplesMap(): _.Dictionary<Sample> {
        return _.keyBy(this.selectedSamples.result!, s => s.uniqueSampleKey);
    }

    readonly selectedPatientKeys = remoteData<string[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            return _.uniq(
                this.selectedSamples.result.map(
                    sample => sample.uniquePatientKey
                )
            );
        },
        onError: () => {},
        default: [],
    });

    @computed
    get selectedPatients(): Patient[] {
        return _.values(
            _.reduce(
                this.selectedSamples.result,
                (acc, sample) => {
                    acc[sample.uniquePatientKey] = {
                        cancerStudy: {} as any,
                        patientId: sample.patientId,
                        uniquePatientKey: sample.uniquePatientKey,
                        studyId: sample.studyId,
                        uniqueSampleKey: sample.uniqueSampleKey,
                    };
                    return acc;
                },
                {} as { [key: string]: Patient }
            )
        );
    }

    readonly unSelectedPatientKeys = remoteData<string[]>({
        await: () => [this.samples, this.selectedPatientKeys],
        invoke: async () => {
            const selectedPatientKeysObj = _.reduce(
                this.selectedPatientKeys.result,
                (acc, next) => {
                    acc[next] = true;
                    return acc;
                },
                {} as { [patientKey: string]: boolean }
            );
            const unselectedPatientSet = _.reduce(
                this.samples.result,
                (acc: { [id: string]: boolean }, next) => {
                    if (
                        selectedPatientKeysObj[next.uniquePatientKey] ===
                        undefined
                    ) {
                        acc[next.uniquePatientKey] = true;
                    }
                    return acc;
                },
                {}
            );
            return Object.keys(unselectedPatientSet);
        },
        onError: () => {},
        default: [],
    });

    public clinicalViolinDataCache = new MobxPromiseCache<
        {
            chartInfo: XvsYViolinChart;
            violinLogScale: boolean;
        },
        {
            data: ClinicalViolinPlotData;
            violinLogScale: boolean;
        }
    >(
        q => ({
            invoke: async () => ({
                data: await internalClient.fetchClinicalDataViolinPlotsUsingPOST(
                    {
                        categoricalAttributeId:
                            q.chartInfo.categoricalAttr.clinicalAttributeId,
                        numericalAttributeId:
                            q.chartInfo.numericalAttr.clinicalAttributeId,
                        logScale: q.violinLogScale,
                        sigmaMultiplier: 4,
                        studyViewFilter: this.filters,
                    }
                ),
                violinLogScale: q.violinLogScale,
            }),
            default: {
                data: {
                    axisStart: -1,
                    axisEnd: -1,
                    rows: [],
                },
                violinLogScale: false,
            },
        }),
        q => {
            return (
                `Category:${q.chartInfo.categoricalAttr.clinicalAttributeId}/` +
                `Numerical:${q.chartInfo.numericalAttr.clinicalAttributeId}/` +
                `violinDomain:${JSON.stringify(q.chartInfo.violinDomain)}/` +
                `violinLog:${q.violinLogScale}/` +
                `Filters:${JSON.stringify(this.filters)}`
            );
        }
    );

    public clinicalDataDensityCache = new MobxPromiseCache<
        {
            xAxisLogScale: boolean;
            yAxisLogScale: boolean;
            chartInfo: XvsYScatterChart;
        },
        {
            bins: DensityPlotBin[];
            pearsonCorr: number;
            spearmanCorr: number;
            xBinSize: number;
            yBinSize: number;
        }
    >(
        q => ({
            invoke: async () => {
                //TODO:
                // dynamically compute 263.282 and 223.372 using StudyViewDensityScatterPlot::getActualPlotAxisLength
                // What they are is the actual available plot length in pixels. This lets us compute how many
                //  bins to use in order to get circles that just touch but dont overlap.
                const X_AXIS_PIXEL_LENGTH = 263.282;
                const Y_AXIS_PIXEL_LENGTH = 223.372;
                const xAxisBinCount = Math.ceil(X_AXIS_PIXEL_LENGTH / 6);
                const yAxisBinCount = Math.ceil(Y_AXIS_PIXEL_LENGTH / 6);
                const parameters: any = {
                    xAxisAttributeId: q.chartInfo.xAttr.clinicalAttributeId,
                    yAxisAttributeId: q.chartInfo.yAttr.clinicalAttributeId,
                    xAxisLogScale: q.xAxisLogScale,
                    yAxisLogScale: q.yAxisLogScale,
                    xAxisBinCount,
                    yAxisBinCount,
                    studyViewFilter: this.filters,
                };
                if (
                    q.chartInfo.xAttr.clinicalAttributeId ===
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                ) {
                    // FGA always goes 0 to 1
                    parameters.xAxisStart = 0;
                    parameters.xAxisEnd = 1;
                } else if (
                    q.chartInfo.xAttr.clinicalAttributeId ===
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                ) {
                    parameters.xAxisStart = 0; // mutation count always starts at 0
                }
                if (
                    q.chartInfo.yAttr.clinicalAttributeId ===
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                ) {
                    // FGA always goes 0 to 1
                    parameters.yAxisStart = 0;
                    parameters.yAxisEnd = 1;
                } else if (
                    q.chartInfo.yAttr.clinicalAttributeId ===
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                ) {
                    parameters.yAxisStart = 0; // mutation count always starts at 0
                }
                const result: any = await internalClient.fetchClinicalDataDensityPlotUsingPOST(
                    parameters
                );
                const bins = result.bins.filter(
                    (bin: DensityPlotBin) => bin.count > 0
                );
                const binBounds = getBinBounds(bins);
                const xBinSize =
                    (binBounds.x.max - binBounds.x.min) / xAxisBinCount;
                const yBinSize =
                    (binBounds.y.max - binBounds.y.min) / yAxisBinCount;
                return {
                    bins,
                    pearsonCorr: result.pearsonCorr,
                    spearmanCorr: result.spearmanCorr,
                    xBinSize,
                    yBinSize,
                };
            },
            default: {
                bins: [],
                pearsonCorr: 0,
                spearmanCorr: 0,
                xBinSize: -1,
                yBinSize: -1,
            },
        }),
        q => {
            return (
                `Attr1:${q.chartInfo.xAttr.clinicalAttributeId}/` +
                `Attr2:${q.chartInfo.yAttr.clinicalAttributeId}/` +
                `plotDomain:${JSON.stringify(q.chartInfo.plotDomain)}/` +
                `xLog:${q.xAxisLogScale}/` +
                `yLog:${q.yAxisLogScale}`
            );
        }
    );

    public genePanelCache = new MobxPromiseCache<
        { genePanelId: string },
        GenePanel
    >(q => ({
        invoke: () => {
            return defaultClient.getGenePanelUsingGET(q);
        },
    }));

    readonly mutatedGeneTableRowData = remoteData<MultiSelectionTableRow[]>({
        await: () =>
            this.oncokbCancerGeneFilterEnabled
                ? [
                      this.mutationProfiles,
                      this.oncokbAnnotatedGeneEntrezGeneIds,
                      this.oncokbOncogeneEntrezGeneIds,
                      this.oncokbTumorSuppressorGeneEntrezGeneIds,
                      this.oncokbCancerGeneEntrezGeneIds,
                  ]
                : [this.mutationProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                let mutatedGenes = await internalClient.fetchMutatedGenesUsingPOST(
                    {
                        studyViewFilter: this.filters,
                    }
                );
                return mutatedGenes.map(item => {
                    return {
                        ...item,
                        label: item.hugoGeneSymbol,
                        uniqueKey: item.hugoGeneSymbol,
                        oncokbAnnotated: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbAnnotatedGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isOncokbOncogene: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbOncogeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isOncokbTumorSuppressorGene: this
                            .oncokbCancerGeneFilterEnabled
                            ? this.oncokbTumorSuppressorGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isCancerGene: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbCancerGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                    };
                });
            } else {
                return [];
            }
        },
        onError: () => {},
        default: [],
    });

    readonly structuralVariantGeneTableRowData = remoteData<
        MultiSelectionTableRow[]
    >({
        await: () =>
            this.oncokbCancerGeneFilterEnabled
                ? [
                      this.structuralVariantProfiles,
                      this.oncokbAnnotatedGeneEntrezGeneIds,
                      this.oncokbOncogeneEntrezGeneIds,
                      this.oncokbTumorSuppressorGeneEntrezGeneIds,
                      this.oncokbCancerGeneEntrezGeneIds,
                  ]
                : [this.structuralVariantProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.structuralVariantProfiles.result)) {
                const structuralVariantGenes = await internalClient.fetchStructuralVariantGenesUsingPOST(
                    {
                        studyViewFilter: this.filters,
                    }
                );
                return structuralVariantGenes.map(item => {
                    return {
                        ...item,
                        label: item.hugoGeneSymbol,
                        uniqueKey: item.hugoGeneSymbol,
                        oncokbAnnotated: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbAnnotatedGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isOncokbOncogene: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbOncogeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isOncokbTumorSuppressorGene: this
                            .oncokbCancerGeneFilterEnabled
                            ? this.oncokbTumorSuppressorGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isCancerGene: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbCancerGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                    };
                });
            } else {
                return [];
            }
        },
        onError: () => {},
        default: [],
    });

    readonly cnaGeneTableRowData = remoteData<MultiSelectionTableRow[]>({
        await: () =>
            this.oncokbCancerGeneFilterEnabled
                ? [
                      this.cnaProfiles,
                      this.oncokbAnnotatedGeneEntrezGeneIds,
                      this.oncokbOncogeneEntrezGeneIds,
                      this.oncokbTumorSuppressorGeneEntrezGeneIds,
                      this.oncokbCancerGeneEntrezGeneIds,
                  ]
                : [this.cnaProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.cnaProfiles.result)) {
                let cnaGenes = await internalClient.fetchCNAGenesUsingPOST({
                    studyViewFilter: this.filters,
                });
                return cnaGenes.map(item => {
                    return {
                        ...item,
                        label: item.hugoGeneSymbol,
                        uniqueKey: getGeneCNAOQL(
                            item.hugoGeneSymbol,
                            item.alteration
                        ),
                        oncokbAnnotated: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbAnnotatedGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isOncokbOncogene: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbOncogeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isOncokbTumorSuppressorGene: this
                            .oncokbCancerGeneFilterEnabled
                            ? this.oncokbTumorSuppressorGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                        isCancerGene: this.oncokbCancerGeneFilterEnabled
                            ? this.oncokbCancerGeneEntrezGeneIds.result.includes(
                                  item.entrezGeneId
                              )
                            : false,
                    };
                });
            } else {
                return [];
            }
        },
        onError: () => {},
        default: [],
    });

    readonly cnSegments = remoteData<CopyNumberSeg[]>(
        {
            await: () => [this.selectedSamples],
            invoke: () =>
                fetchCopyNumberSegmentsForSamples(this.selectedSamples.result),
        },
        []
    );

    readonly hasCNSegmentData = remoteData<boolean>({
        await: () => [this.samples],
        invoke: async () => {
            return defaultClient
                .fetchCopyNumberSegmentsUsingPOSTWithHttpInfo({
                    sampleIdentifiers: this.samples.result.map(sample => ({
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                    })),
                    projection: 'META',
                })
                .then(function(response: request.Response) {
                    const count = parseInt(response.header['total-count'], 10);
                    return count > 0;
                });
        },
    });

    readonly selectedDriverTiers = remoteData<string[]>({
        await: () => [this.customDriverAnnotationReport],
        invoke: () => {
            return Promise.resolve(
                this.customDriverAnnotationReport.result!.tiers.filter(tier =>
                    this.driverAnnotationSettings.driverTiers.get(tier)
                )
            );
        },
    });

    readonly selectedDriverTiersMap = remoteData<{ [tier: string]: boolean }>({
        await: () => [
            this.customDriverAnnotationReport,
            this.selectedDriverTiers,
        ],
        invoke: () => {
            return Promise.resolve(
                buildSelectedDriverTiersMap(
                    this.selectedDriverTiers.result!,
                    this.customDriverAnnotationReport.result!.tiers
                )
            );
        },
    });

    readonly customDriverAnnotationReport = remoteData<IDriverAnnotationReport>(
        {
            await: () => [this.molecularProfiles],
            invoke: async () => {
                const molecularProfileIds = this.molecularProfiles.result.map(
                    molecularProfile => molecularProfile.molecularProfileId
                );
                const report = await internalClient.fetchAlterationDriverAnnotationReportUsingPOST(
                    { molecularProfileIds }
                );
                return {
                    ...report,
                    hasCustomDriverAnnotations:
                        report.hasBinary || report.tiers.length > 0,
                };
            },
            onResult: result => {
                initializeCustomDriverAnnotationSettings(
                    result!,
                    this.driverAnnotationSettings,
                    this.driverAnnotationSettings.customTiersDefault
                );
            },
        }
    );

    readonly survivalPlots = remoteData<SurvivalType[]>({
        await: () => [
            this.survivalClinicalAttributesPrefix,
            this.clinicalAttributeIdToClinicalAttribute,
            this.survivalDescriptions,
            this.isLeftTruncationAvailable,
        ],
        invoke: async () => {
            let survivalTypes: SurvivalType[] = this.survivalClinicalAttributesPrefix.result.map(
                prefix => {
                    // title shoud starts with 'KM plot:'
                    let plotTitle = 'KM Plot: ';
                    plotTitle +=
                        this.survivalDescriptions.result &&
                        this.survivalDescriptions.result[prefix]
                            ? generateStudyViewSurvivalPlotTitle(
                                  this.survivalDescriptions.result![prefix][0]
                                      .displayName
                              )
                            : `${prefix} Survival`;
                    plotTitle += ' (months)';

                    const survivalStatusAttribute = this
                        .clinicalAttributeIdToClinicalAttribute.result![
                        `${prefix}_STATUS`
                    ];
                    return {
                        id: `${prefix}_SURVIVAL`,
                        title: plotTitle,
                        survivalStatusAttribute,
                        associatedAttrs: [
                            `${prefix}_STATUS`,
                            `${prefix}_MONTHS`,
                        ],
                        filter: s => getSurvivalStatusBoolean(s, prefix),
                        // Currently, left truncation is only appliable for Overall Survival data
                        isLeftTruncationAvailable:
                            !!this.isLeftTruncationAvailable.result &&
                            new RegExp('OS').test(prefix),
                    };
                }
            );
            return survivalTypes;
        },
        default: [],
    });

    public async getPieChartDataDownload(
        chartMeta: ChartMeta,
        dataType?: DownloadDataType
    ): Promise<string> {
        const isCustomChart = this.isUserDefinedCustomDataChart(
            chartMeta.uniqueKey
        );
        if (dataType && dataType === 'summary') {
            if (isCustomChart) {
                return this.getClinicalDataCountSummary(
                    chartMeta,
                    this.getCustomDataCount(chartMeta).result!
                );
            } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
                return this.getClinicalDataCountSummary(
                    chartMeta,
                    this.getGenericAssayChartDataCount(chartMeta).result!
                );
            } else {
                return this.getClinicalDataCountSummary(
                    chartMeta,
                    this.getClinicalDataCount(chartMeta).result!
                );
            }
        } else {
            if (isCustomChart) {
                return this.getCustomChartDownloadData(chartMeta);
            } else {
                return this.getChartDownloadableData(chartMeta);
            }
        }
    }

    public getClinicalDataCountSummary(
        chartMeta: ChartMeta,
        clinicalDataCountSummaries: ClinicalDataCountSummary[]
    ): string {
        const subInfo = chartMeta.patientAttribute ? 'patients' : 'samples';
        const header: string[] = [
            'Category',
            `Number of ${subInfo}`,
            `Percentage of ${subInfo}`,
        ];
        let data = [header.join('\t')];
        data = data.concat(
            clinicalDataCountSummaries.map(clinicalData =>
                [
                    clinicalData.value,
                    clinicalData.count,
                    clinicalData.freq,
                ].join('\t')
            )
        );
        return data.join('\n');
    }

    public async getChartDownloadableData(
        chartMeta: ChartMeta
    ): Promise<string> {
        let clinicalDataList: ClinicalData[] = [];
        if (this.isGeneSpecificChart(chartMeta.uniqueKey)) {
            clinicalDataList = await getGenomicDataAsClinicalData(
                this._geneSpecificChartMap.get(chartMeta.uniqueKey)!,
                this.molecularProfileMapByType,
                this.selectedSamples.result
            );
        } else if (this.isGenericAssayChart(chartMeta.uniqueKey)) {
            clinicalDataList = await getGenericAssayDataAsClinicalData(
                this._genericAssayChartMap.get(chartMeta.uniqueKey)!,
                this.molecularProfileMapByType,
                this.selectedSamples.result
            );
        } else {
            if (chartMeta.clinicalAttribute && this.samples.result) {
                clinicalDataList = await defaultClient.fetchClinicalDataUsingPOST(
                    {
                        clinicalDataType: chartMeta.clinicalAttribute
                            .patientAttribute
                            ? ClinicalDataTypeEnum.PATIENT
                            : ClinicalDataTypeEnum.SAMPLE,
                        clinicalDataMultiStudyFilter: {
                            attributeIds: [
                                chartMeta.clinicalAttribute.clinicalAttributeId,
                            ],
                            identifiers: this.selectedSamples.result.map(
                                sample => ({
                                    entityId: chartMeta.clinicalAttribute!
                                        .patientAttribute
                                        ? sample.patientId
                                        : sample.sampleId,
                                    studyId: sample.studyId,
                                })
                            ),
                        },
                    }
                );
            }
        }

        const header: string[] = ['Study ID', 'Patient ID'];

        if (!chartMeta.patientAttribute) {
            header.push('Sample ID');
        }

        header.push(chartMeta.displayName);

        let data = [header.join('\t')];

        data = data.concat(
            clinicalDataList.map(clinicalData => {
                const row = [
                    clinicalData.studyId || Datalabel.NA,
                    clinicalData.patientId || Datalabel.NA,
                ];

                if (!chartMeta.patientAttribute) {
                    row.push(clinicalData.sampleId || Datalabel.NA);
                }

                row.push(clinicalData.value || Datalabel.NA);

                return row.join('\t');
            })
        );

        return data.join('\n');
    }

    @computed get molecularProfileMapByType(): _.Dictionary<
        MolecularProfile[]
    > {
        return _.groupBy(this.molecularProfiles.result, molecularProfile =>
            getSuffixOfMolecularProfile(molecularProfile)
        );
    }

    public getCustomChartDownloadData(chartMeta: ChartMeta): Promise<string> {
        return new Promise<string>(resolve => {
            if (chartMeta && chartMeta.uniqueKey) {
                let isPatientChart = chartMeta.patientAttribute;
                let header = ['Study ID', 'Patient ID'];

                if (!isPatientChart) {
                    header.push('Sample ID');
                }
                header.push(chartMeta.displayName);
                let data = [header.join('\t')];
                if (
                    chartMeta.uniqueKey ===
                    SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                ) {
                    data = data.concat(
                        this.selectedSamples.result!.map((sample: Sample) => {
                            return [
                                sample.studyId || Datalabel.NA,
                                sample.patientId || Datalabel.NA,
                                sample.sampleId || Datalabel.NA,
                                sample.studyId,
                            ].join('\t');
                        })
                    );
                } else if (
                    this._customChartsSelectedCases.has(chartMeta.uniqueKey)
                ) {
                    if (isPatientChart) {
                        data = data.concat(
                            this.selectedPatients.map((patient: Patient) => {
                                let record = _.find(
                                    this._customChartsSelectedCases.get(
                                        chartMeta.uniqueKey
                                    ),
                                    (
                                        caseIdentifier: CustomChartIdentifierWithValue
                                    ) => {
                                        return (
                                            caseIdentifier.studyId ===
                                                patient.studyId &&
                                            patient.patientId ===
                                                caseIdentifier.patientId
                                        );
                                    }
                                );
                                return [
                                    patient.studyId || Datalabel.NA,
                                    patient.patientId || Datalabel.NA,
                                    record === undefined ? 'NA' : record.value,
                                ].join('\t');
                            })
                        );
                    } else {
                        data = data.concat(
                            this.selectedSamples.result!.map(
                                (sample: Sample) => {
                                    let record = _.find(
                                        this._customChartsSelectedCases.get(
                                            chartMeta.uniqueKey
                                        ),
                                        (
                                            caseIdentifier: CustomChartIdentifierWithValue
                                        ) => {
                                            return (
                                                caseIdentifier.studyId ===
                                                    sample.studyId &&
                                                sample.sampleId ===
                                                    caseIdentifier.sampleId
                                            );
                                        }
                                    );
                                    return [
                                        sample.studyId || Datalabel.NA,
                                        sample.patientId || Datalabel.NA,
                                        sample.sampleId || Datalabel.NA,
                                        record === undefined
                                            ? 'NA'
                                            : record.value,
                                    ].join('\t');
                                }
                            )
                        );
                    }
                }

                resolve(data.join('\n'));
            } else {
                resolve('');
            }
        });
    }

    public async getScatterDownloadData(
        chartUniqueKey: ChartUniqueKey
    ): Promise<string> {
        const chartInfo = this.getXvsYScatterChartInfo(chartUniqueKey)!;
        const selectedSamples = await toPromise(this.selectedSamples);
        const [xData, yData] = await Promise.all([
            getSampleToClinicalData(selectedSamples, chartInfo.xAttr),
            getSampleToClinicalData(selectedSamples, chartInfo.yAttr),
        ]);
        return generateXvsYScatterPlotDownloadData(
            chartInfo.xAttr,
            chartInfo.yAttr,
            selectedSamples,
            xData,
            yData
        );
    }

    public getSurvivalDownloadData(chartMeta: ChartMeta): string {
        const matchedPlot = _.find(
            this.survivalPlots.result,
            plot => plot.id === chartMeta.uniqueKey
        );
        if (matchedPlot && this.survivalData.result) {
            const data: string[] = [];

            // find the unique clinical attribute ids
            const uniqueClinicalAttributeIds = matchedPlot.associatedAttrs;

            // add the header row
            data.push(
                ['Study ID', 'Patient ID', ...uniqueClinicalAttributeIds].join(
                    '\t'
                )
            );

            // add the data rows
            const selectedPatientMap = _.reduce(
                this.selectedPatients,
                (acc, next) => {
                    acc[next.uniquePatientKey] = next;
                    return acc;
                },
                {} as { [uniquePatientKey: string]: Patient }
            );
            this.selectedPatientKeys.result.forEach(uniquePatientKey => {
                const clinicalDataList = this.survivalData.result[
                    uniquePatientKey
                ];
                const row: string[] = [];

                if (clinicalDataList && clinicalDataList.length > 0) {
                    row.push(clinicalDataList[0].studyId || Datalabel.NA);
                    row.push(clinicalDataList[0].patientId || Datalabel.NA);
                    const keyed = _.keyBy(
                        clinicalDataList,
                        'clinicalAttributeId'
                    );

                    _.each(uniqueClinicalAttributeIds, id => {
                        row.push(
                            keyed[id]
                                ? keyed[id].value || Datalabel.NA
                                : Datalabel.NA
                        );
                    });
                } else {
                    const selectedPatient =
                        selectedPatientMap[uniquePatientKey];
                    if (selectedPatient) {
                        row.push(selectedPatient.studyId || Datalabel.NA);
                        row.push(selectedPatient.patientId || Datalabel.NA);

                        _.each(uniqueClinicalAttributeIds, () => {
                            row.push(Datalabel.NA);
                        });
                    }
                }

                data.push(row.join('\t'));
            });

            return data.join('\n');
        } else {
            return '';
        }
    }

    public async getMutatedGenesDownloadData(): Promise<string> {
        if (this.mutatedGeneTableRowData.result) {
            let header = [
                'Gene',
                'MutSig(Q-value)',
                '# Mut',
                '#',
                'Profiled Samples',
                'Freq',
            ];
            if (this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            let data = [header.join('\t')];
            _.each(
                this.mutatedGeneTableRowData.result,
                (record: MultiSelectionTableRow) => {
                    let rowData = [
                        record.label,
                        record.qValue === undefined
                            ? ''
                            : getQValue(record.qValue),
                        record.totalCount,
                        record.numberOfAlteredCases,
                        record.numberOfProfiledCases,
                        getFrequencyStr(
                            (record.numberOfAlteredCases /
                                record.numberOfProfiledCases) *
                                100
                        ),
                    ];
                    if (this.oncokbCancerGeneFilterEnabled) {
                        rowData.push(
                            this.oncokbCancerGeneFilterEnabled
                                ? record.isCancerGene
                                    ? 'Yes'
                                    : 'No'
                                : 'NA'
                        );
                    }
                    data.push(rowData.join('\t'));
                }
            );
            return data.join('\n');
        } else return '';
    }

    public getStructuralVariantGenesDownloadData(): string {
        if (this.structuralVariantGeneTableRowData.result) {
            const header = [
                'Gene',
                '# Structural Variant',
                '#',
                'Profiled Samples',
                'Freq',
            ];
            if (this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            const data = [header.join('\t')];
            _.each(
                this.structuralVariantGeneTableRowData.result,
                (record: MultiSelectionTableRow) => {
                    const rowData = [
                        record.label,
                        record.totalCount,
                        record.numberOfAlteredCases,
                        record.numberOfProfiledCases,
                        getFrequencyStr(
                            (record.numberOfAlteredCases /
                                record.numberOfProfiledCases) *
                                100
                        ),
                    ];
                    if (this.oncokbCancerGeneFilterEnabled) {
                        rowData.push(
                            this.oncokbCancerGeneFilterEnabled
                                ? record.isCancerGene
                                    ? 'Yes'
                                    : 'No'
                                : 'NA'
                        );
                    }
                    data.push(rowData.join('\t'));
                }
            );
            return data.join('\n');
        } else return '';
    }

    public async getGenesCNADownloadData(): Promise<string> {
        if (this.cnaGeneTableRowData.result) {
            let header = [
                'Gene',
                'Gistic(Q-value)',
                'Cytoband',
                'CNA',
                'Profiled Samples',
                '#',
                'Freq',
            ];
            if (this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            let data = [header.join('\t')];
            _.each(
                this.cnaGeneTableRowData.result,
                (record: MultiSelectionTableRow) => {
                    let rowData = [
                        record.label,
                        record.qValue === undefined
                            ? ''
                            : getQValue(record.qValue),
                        record.cytoband,
                        getCNAByAlteration(record.alteration!),
                        record.numberOfAlteredCases,
                        record.numberOfProfiledCases,
                        getFrequencyStr(
                            (record.numberOfAlteredCases /
                                record.numberOfProfiledCases) *
                                100
                        ),
                    ];
                    if (this.oncokbCancerGeneFilterEnabled) {
                        rowData.push(
                            this.oncokbCancerGeneFilterEnabled
                                ? record.isCancerGene
                                    ? 'Yes'
                                    : 'No'
                                : 'NA'
                        );
                    }
                    data.push(rowData.join('\t'));
                }
            );
            return data.join('\n');
        } else return '';
    }

    readonly survivalEntryMonths = remoteData<
        { [uniquePatientKey: string]: number } | undefined
    >({
        invoke: async () => {
            const studyIds = this.studyIds;
            // Please note:
            // The left truncation adjustment is only available for one study: heme_onc_nsclc_genie_bpc at this time
            // clinical attributeId still need to be decided in the future
            if (
                this.isGeniebpcStudy &&
                this.isLeftTruncationFeatureFlagEnabled
            ) {
                const data = await client.getAllClinicalDataInStudyUsingGET({
                    attributeId: 'TT_CPT_REPORT_MOS',
                    clinicalDataType: 'PATIENT',
                    studyId: studyIds[0],
                });
                return data.reduce(
                    (map: { [patientKey: string]: number }, next) => {
                        map[next.uniquePatientKey] = parseFloat(next.value);
                        return map;
                    },
                    {}
                );
            } else {
                return undefined;
            }
        },
    });

    readonly isLeftTruncationAvailable = remoteData<boolean>({
        await: () => [this.survivalEntryMonths],
        invoke: async () => {
            return !_.isEmpty(this.survivalEntryMonths.result);
        },
    });

    readonly survivalPlotDataById = remoteData<{ [id: string]: SurvivalData }>({
        await: () => [
            this.survivalData,
            this.selectedPatientKeys,
            this.survivalPlots,
            this.survivalEntryMonths,
        ],
        invoke: async () => {
            return _.chain(this.survivalPlots.result)
                .map(plot => {
                    return {
                        id: plot.id,
                        survivalData: getPatientSurvivals(
                            this.survivalData.result,
                            this.selectedPatientKeys.result!,
                            plot.associatedAttrs[0],
                            plot.associatedAttrs[1],
                            plot.filter,
                            this.survivalPlotLeftTruncationToggleMap.get(
                                plot.id
                            ) && plot.id === 'OS_SURVIVAL'
                                ? this.survivalEntryMonths.result
                                : undefined
                        ),
                        survivalDataWithoutLeftTruncation: getPatientSurvivals(
                            this.survivalData.result,
                            this.selectedPatientKeys.result!,
                            plot.associatedAttrs[0],
                            plot.associatedAttrs[1],
                            plot.filter,
                            undefined
                        ),
                    };
                })
                .keyBy(plot => plot.id)
                .value();
        },
        onError: () => {},
        default: {},
    });

    readonly survivalData = remoteData<{ [id: string]: ClinicalData[] }>({
        await: () => [
            this.clinicalAttributes,
            this.samples,
            this.survivalPlots,
        ],
        invoke: async () => {
            const attributeIds = _.flatten(
                this.survivalPlots.result.map(obj => obj.associatedAttrs)
            );
            if (!_.isEmpty(attributeIds)) {
                const filter: ClinicalDataMultiStudyFilter = {
                    attributeIds: attributeIds,
                    identifiers: _.map(this.samples.result!, obj => {
                        return {
                            entityId: obj.patientId,
                            studyId: obj.studyId,
                        };
                    }),
                };

                let data = await defaultClient.fetchClinicalDataUsingPOST({
                    clinicalDataType: ClinicalDataTypeEnum.PATIENT,
                    clinicalDataMultiStudyFilter: filter,
                });

                return _.groupBy(data, 'uniquePatientKey');
            }
            return {};
        },
        onError: () => {},
        default: {},
    });

    readonly sampleMutationCountAndFractionGenomeAlteredData = remoteData({
        await: () => [this.clinicalAttributes, this.selectedSamples],
        invoke: () => {
            if (this.selectedSamples.result.length === 0) {
                return Promise.resolve([]);
            }
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: [
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
                ],
                identifiers: _.map(this.selectedSamples.result!, obj => {
                    return {
                        entityId: obj.sampleId,
                        studyId: obj.studyId,
                    };
                }),
            };

            return defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: ClinicalDataTypeEnum.SAMPLE,
                clinicalDataMultiStudyFilter: filter,
            });
        },
        onError: () => {},
        default: [],
    });

    readonly mutationCountVsFGAData = remoteData({
        await: () => [this.sampleMutationCountAndFractionGenomeAlteredData],
        onError: () => {},
        invoke: async () => {
            return _.reduce(
                _.groupBy(
                    this.sampleMutationCountAndFractionGenomeAlteredData.result,
                    datum => datum.uniqueSampleKey
                ),
                (acc, data) => {
                    if (data.length == 2) {
                        // 2 => number of attribute ids
                        let _datum: IStudyViewScatterPlotData = {
                            studyId: data[0].studyId,
                            sampleId: data[0].sampleId,
                            patientId: data[0].patientId,
                            uniqueSampleKey: data[0].uniqueSampleKey,
                            x: 0,
                            y: 0,
                        };
                        _.forEach(data, datum => {
                            if (
                                datum.clinicalAttributeId ===
                                SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                            ) {
                                _datum.y = Number(datum.value);
                            } else if (
                                datum.clinicalAttributeId ===
                                SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                            ) {
                                _datum.x = Number(datum.value);
                            }
                        });
                        acc.push(_datum);
                    }
                    return acc;
                },
                [] as IStudyViewScatterPlotData[]
            );
        },
    });

    readonly mutationCountVsFractionGenomeAlteredDataSet = remoteData<{
        [id: string]: IStudyViewScatterPlotData;
    }>({
        await: () => [this.mutationCountVsFGAData],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(
                    this.mutationCountVsFGAData.result,
                    datum => datum.uniqueSampleKey
                )
            );
        },
        default: {},
    });

    readonly getDataForClinicalDataTab = remoteData({
        await: () => [
            this.clinicalAttributes,
            this.selectedSamples,
            this.sampleSetByKey,
        ],
        onError: () => {},
        invoke: async () => {
            if (this.selectedSamples.result.length === 0) {
                return Promise.resolve([]);
            }
            let sampleClinicalDataMap = await getAllClinicalDataByStudyViewFilter(
                this.filters
            );

            const sampleClinicalDataArray = _.mapValues(
                sampleClinicalDataMap,
                (attrs, uniqueSampleId) => {
                    const sample = this.sampleSetByKey.result![uniqueSampleId];
                    return {
                        studyId: sample.studyId,
                        patientId: sample.patientId,
                        sampleId: sample.sampleId,
                        ...attrs,
                    };
                }
            );

            return _.values(sampleClinicalDataArray);
        },
        default: [],
    });

    readonly clinicalAttributeProduct = remoteData({
        await: () => [this.clinicalAttributes, this.selectedSamples],
        invoke: async () => {
            return (
                this.clinicalAttributes.result.length *
                this.selectedSamples.result.length
            );
        },
        default: 0,
    });

    readonly maxSamplesForClinicalTab = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            return Math.floor(
                getServerConfig().clinical_attribute_product_limit /
                    this.clinicalAttributes.result.length
            );
        },
        default: 0,
    });

    readonly molecularProfileForGeneCharts = remoteData({
        await: () => [
            this.molecularProfiles,
            this.molecularProfileSampleCounts,
        ],
        invoke: async () => {
            return this.molecularProfiles.result.filter(molecularProfile => {
                return (
                    [
                        AlterationTypeConstants.MRNA_EXPRESSION,
                        AlterationTypeConstants.PROTEIN_LEVEL,
                        AlterationTypeConstants.METHYLATION,
                    ].includes(molecularProfile.molecularAlterationType) ||
                    (molecularProfile.molecularAlterationType ===
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                        molecularProfile.datatype ===
                            DataTypeConstants.CONTINUOUS)
                );
            });
        },
        default: [],
    });

    readonly molecularProfileOptions = remoteData<MolecularProfileOption[]>({
        await: () => [
            this.molecularProfileForGeneCharts,
            this.molecularProfileSampleCounts,
        ],
        invoke: async () => {
            let filterProfileTypes = this.molecularProfileForGeneCharts.result.map(
                molecularProfile =>
                    getSuffixOfMolecularProfile(molecularProfile)
            );

            return this.molecularProfileSampleCounts.result
                .filter(datum => filterProfileTypes.includes(datum.uniqueKey))
                .map(datum => {
                    return {
                        value: datum.uniqueKey,
                        count: datum.numberOfAlteredCases,
                        label: datum.label,
                        description: datum.label,
                        dataType: 'STRING',
                    };
                });
        },
        default: [],
    });

    readonly molecularProfileSampleCounts = remoteData<
        MultiSelectionTableRow[]
    >({
        await: () => [this.molecularProfiles],
        invoke: async () => {
            const [counts, selectedSamples] = await Promise.all([
                internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                    studyViewFilter: this.filters,
                }),
                toPromise(this.selectedSamples),
            ]);

            return counts.map(caseListOption => {
                return {
                    uniqueKey: caseListOption.value,
                    label: caseListOption.label,
                    // "Altered" and "Profiled" really just mean
                    //  "numerator" and "denominator" in percent
                    //  calculation of table. Here, they mean
                    //  "# filtered samples in profile" and "# filtered samples overall"
                    numberOfAlteredCases: caseListOption.count,
                    numberOfProfiledCases: selectedSamples.length,
                } as any;
            });
        },
        default: [],
    });

    readonly caseListSampleCounts = remoteData<MultiSelectionTableRow[]>({
        invoke: async () => {
            const [counts, selectedSamples] = await Promise.all([
                internalClient.fetchCaseListCountsUsingPOST({
                    studyViewFilter: this.filters,
                }),
                toPromise(this.selectedSamples),
            ]);

            return counts.map(caseListOption => {
                return {
                    uniqueKey: caseListOption.value,
                    label: caseListOption.label,
                    // "Altered" and "Profiled" really just mean
                    //  "numerator" and "denominator" in percent
                    //  calculation of table. Here, they mean
                    //  "# filtered samples in case list" and "# filtered samples overall"
                    numberOfAlteredCases: caseListOption.count,
                    numberOfProfiledCases: selectedSamples.length,
                } as any;
            });
        },
    });

    readonly molecularProfileSampleCountSet = remoteData({
        await: () => [this.molecularProfileSampleCounts],
        onError: () => {},
        invoke: async () => {
            return _.chain(this.molecularProfileSampleCounts.result || [])
                .keyBy(
                    molecularProfileSampleCount =>
                        molecularProfileSampleCount.uniqueKey
                )
                .mapValues(
                    molecularProfileSampleCount =>
                        molecularProfileSampleCount.numberOfAlteredCases
                )
                .value();
        },
        default: {},
    });

    readonly initialMolecularProfileSampleCounts = remoteData({
        invoke: async () => {
            return internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                studyViewFilter: this.initialFilters,
            });
        },
        default: [],
    });

    readonly initialMolecularProfileSampleCountSet = remoteData({
        await: () => [this.initialMolecularProfileSampleCounts],
        onError: () => {},
        invoke: async () => {
            return _.chain(
                this.initialMolecularProfileSampleCounts.result || []
            )
                .keyBy(
                    molecularProfileSampleCount =>
                        molecularProfileSampleCount.value
                )
                .mapValues(
                    molecularProfileSampleCount =>
                        molecularProfileSampleCount.count
                )
                .value();
        },
    });

    readonly molecularProfileNameSet = remoteData({
        await: () => [this.initialMolecularProfileSampleCounts],
        invoke: async () => {
            return _.chain(this.initialMolecularProfileSampleCounts.result)
                .keyBy(sampleCount => sampleCount.value)
                .mapValues(sampleCount => sampleCount.label)
                .value();
        },
    });

    readonly caseListNameSet = remoteData({
        await: () => [this.caseListSampleCounts],
        invoke: async () => {
            return _.chain(this.caseListSampleCounts.result)
                .keyBy(sampleCount => sampleCount.uniqueKey)
                .mapValues(sampleCount => sampleCount.label)
                .value();
        },
    });

    readonly clinicalAttributesCounts = remoteData({
        await: () => [this.selectedSamples],
        onError: () => {},
        invoke: () => {
            if (this.selectedSamples.result.length === 0) {
                return Promise.resolve([]);
            }

            let sampleIdentifiers = this.selectedSamples.result.map(sample => {
                return {
                    sampleId: sample.sampleId,
                    studyId: sample.studyId,
                };
            });

            let clinicalAttributeCountFilter = {
                sampleIdentifiers,
            } as ClinicalAttributeCountFilter;
            return internalClient.getClinicalAttributeCountsUsingPOST({
                clinicalAttributeCountFilter,
            });
        },
    });

    readonly dataWithCount = remoteData<ChartDataCountSet>({
        await: () => [
            this.molecularProfileSampleCountSet,
            this.clinicalAttributeIdToClinicalAttribute,
            this.clinicalAttributesCounts,
            this.mutationCountVsFractionGenomeAlteredDataSet,
            this.sampleTreatments,
            this.patientTreatments,
            this.sampleTreatmentGroups,
            this.patientTreatmentGroups,
            this.sampleTreatmentTarget,
            this.patientTreatmentTarget,
        ],
        invoke: async () => {
            if (!_.isEmpty(this.chartMetaSet)) {
                const attributeIdToAttribute = this
                    .clinicalAttributeIdToClinicalAttribute.result!;
                // build map
                const ret: ChartDataCountSet = _.reduce(
                    this.clinicalAttributesCounts.result || [],
                    (map: ChartDataCountSet, next: ClinicalAttributeCount) => {
                        const attribute =
                            attributeIdToAttribute[next.clinicalAttributeId];
                        if (attribute) {
                            let key = getUniqueKey(attribute);
                            map[key] = map[key] || 0;
                            map[key] += next.count;
                        }
                        return map;
                    },
                    {}
                );

                _.each(
                    this.survivalPlotDataById.result,
                    (survivalPlotData, id) => {
                        if (id in this.chartMetaSet) {
                            ret[id] = survivalPlotData.survivalData.length;
                        }
                    }
                );

                if (
                    SpecialChartsUniqueKeyEnum.CANCER_STUDIES in
                    this.chartMetaSet
                ) {
                    ret[SpecialChartsUniqueKeyEnum.CANCER_STUDIES] = _.sumBy(
                        this.cancerStudiesData.result,
                        data => data.count
                    );
                }

                const molecularProfileSamplesSet = this
                    .molecularProfileSampleCountSet.result!;

                if (!_.isEmpty(this.mutationProfiles.result)) {
                    const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                        this.mutationProfiles.result.map(
                            profile => profile.molecularProfileId
                        )
                    );
                    // samples countaing this data would be the samples profiled for these molecular profiles
                    ret[uniqueKey] = _.sumBy(
                        this.mutationProfiles.result,
                        profile =>
                            molecularProfileSamplesSet[
                                getSuffixOfMolecularProfile(profile)
                            ] || 0
                    );
                }

                const calculateSampleCount = (
                    result:
                        | (SampleTreatmentRow | PatientTreatmentRow)[]
                        | undefined
                ) => {
                    if (!result) {
                        return 0;
                    }

                    return result
                        .map(row => row.samples)
                        .reduce((allSamples, samples) => {
                            samples.forEach(s =>
                                allSamples.add(s.sampleId + '::' + s.studyId)
                            );
                            return allSamples;
                        }, new Set<String>()).size;
                };

                if (!_.isEmpty(this.sampleTreatments.result)) {
                    ret['SAMPLE_TREATMENTS'] = calculateSampleCount(
                        this.sampleTreatments.result
                    );
                }
                if (!_.isEmpty(this.patientTreatments.result)) {
                    ret['PATIENT_TREATMENTS'] = calculateSampleCount(
                        this.patientTreatments.result
                    );
                }
                if (!_.isEmpty(this.sampleTreatmentGroups.result)) {
                    ret['SAMPLE_TREATMENT_GROUPS'] = calculateSampleCount(
                        this.sampleTreatmentGroups.result
                    );
                }
                if (!_.isEmpty(this.patientTreatmentGroups.result)) {
                    ret['PATIENT_TREATMENT_GROUPS'] = calculateSampleCount(
                        this.patientTreatmentGroups.result
                    );
                }
                if (!_.isEmpty(this.sampleTreatmentTarget.result)) {
                    ret['SAMPLE_TREATMENT_TARGET'] = calculateSampleCount(
                        this.sampleTreatmentTarget.result
                    );
                }
                if (!_.isEmpty(this.patientTreatmentTarget.result)) {
                    ret['PATIENT_TREATMENT_TARGET'] = calculateSampleCount(
                        this.patientTreatmentTarget.result
                    );
                }
                if (!_.isEmpty(this.structuralVariantProfiles.result)) {
                    const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                        this.structuralVariantProfiles.result.map(
                            profile => profile.molecularProfileId
                        )
                    );
                    // samples countaing this data would be the samples profiled for these molecular profiles
                    let count = _.sumBy(
                        this.structuralVariantProfiles.result,
                        profile =>
                            molecularProfileSamplesSet[
                                getSuffixOfMolecularProfile(profile)
                            ] || 0
                    );

                    if (count === 0) {
                        const key = getUniqueKeyFromMolecularProfileIds(
                            this.mutationProfiles.result.map(
                                profile => profile.molecularProfileId
                            )
                        );
                        count = ret[key];
                    }
                    ret[uniqueKey] = count;
                }

                if (!_.isEmpty(this.cnaProfiles.result)) {
                    const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                        this.cnaProfiles.result.map(
                            profile => profile.molecularProfileId
                        )
                    );
                    // samples countaing this data would be the samples profiled for these molecular profiles
                    ret[uniqueKey] = _.sumBy(
                        this.cnaProfiles.result,
                        profile =>
                            molecularProfileSamplesSet[
                                getSuffixOfMolecularProfile(profile)
                            ] || 0
                    );
                }

                if (FGA_VS_MUTATION_COUNT_KEY in this.chartMetaSet) {
                    // number of samples containing mutationCountVsFractionGenomeAlteredData should be
                    // calculated from the selected samples
                    const mutationCountVsFractionGenomeAlteredDataSet = this
                        .mutationCountVsFractionGenomeAlteredDataSet.result;
                    const selectedSamplesMap = _.keyBy(
                        this.selectedSamples.result!,
                        s => s.uniqueSampleKey
                    );
                    const filteredData = _.reduce(
                        selectedSamplesMap,
                        (acc, next) => {
                            if (
                                mutationCountVsFractionGenomeAlteredDataSet[
                                    next.uniqueSampleKey
                                ]
                            ) {
                                acc.push(
                                    mutationCountVsFractionGenomeAlteredDataSet[
                                        next.uniqueSampleKey
                                    ]
                                );
                            }
                            return acc;
                        },
                        [] as IStudyViewScatterPlotData[]
                    );
                    ret[FGA_VS_MUTATION_COUNT_KEY] = filteredData.length;
                }

                if (
                    SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT in
                    this.chartMetaSet
                ) {
                    // always set to selected samples (100%)
                    ret[
                        SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT
                    ] = this.selectedSamples.result!.length;
                }

                // Add all custom data counts, and they should all get 100%
                _.reduce(
                    Array.from(this._customCharts.keys()),
                    (acc, next) => {
                        acc[next] = this.selectedSamples.result.length;
                        return acc;
                    },
                    ret
                );

                // Add counts genomic data charts
                if (this._geneSpecificChartMap.size > 0) {
                    _.reduce(
                        Array.from(this._geneSpecificChartMap.keys()),
                        (acc, uniqueChartKey) => {
                            const genomicChart = this._geneSpecificChartMap.get(
                                uniqueChartKey
                            )!;
                            acc[uniqueChartKey] =
                                molecularProfileSamplesSet[
                                    genomicChart.profileType
                                ] || 0;
                            return acc;
                        },
                        ret
                    );
                }

                // Add counts generic assay data charts
                if (this._genericAssayChartMap.size > 0) {
                    _.reduce(
                        Array.from(this._genericAssayChartMap.keys()),
                        (acc, uniqueChartKey) => {
                            const genericAssayChart = this._genericAssayChartMap.get(
                                uniqueChartKey
                            )!;
                            acc[uniqueChartKey] =
                                molecularProfileSamplesSet[
                                    genericAssayChart.profileType
                                ] || 0;
                            return acc;
                        },
                        ret
                    );
                }

                return _.reduce(
                    this.chartMetaSet,
                    (acc, next, key) => {
                        acc[key] = ret[key] || 0;
                        return acc;
                    },
                    {} as ChartDataCountSet
                );
            }
            return {};
        },
        onError: () => {},
        default: {},
    });

    @computed
    public get clinicalDataDownloadFilename(): string {
        return `${this.downloadFilenamePrefix}clinical_data.tsv`;
    }

    @computed
    public get downloadFilenamePrefix(): string {
        return generateDownloadFilenamePrefixByStudies(
            this.displayedStudies.result
        );
    }

    @autobind
    public async getDownloadDataPromise(): Promise<string> {
        if (this.selectedSamples.result.length === 0) {
            return Promise.resolve('');
        }
        let sampleClinicalDataMap = await getAllClinicalDataByStudyViewFilter(
            this.filters
        );

        let clinicalAttributesNameSet = _.reduce(
            this.clinicalAttributes.result,
            (acc, next) => {
                const uniqueKey = getUniqueKey(next);
                acc[uniqueKey] = next.displayName;
                return acc;
            },
            {
                studyId: 'Study ID',
                patientId: 'Patient ID',
                sampleId: 'Sample ID',
            } as { [id: string]: string }
        );

        let dataRows = _.reduce(
            this.selectedSamples.result,
            (acc, next) => {
                let sampleData: { [attributeId: string]: string } = {
                    studyId: next.studyId,
                    patientId: next.patientId,
                    sampleId: next.sampleId,
                    ...(sampleClinicalDataMap[next.uniqueSampleKey] || {}),
                };

                acc.push(
                    _.map(
                        Object.keys(clinicalAttributesNameSet),
                        attributrId => {
                            return sampleData[attributrId] || Datalabel.NA;
                        }
                    )
                );
                return acc;
            },
            [_.values(clinicalAttributesNameSet)]
        );

        return dataRows.map(mutation => mutation.join('\t')).join('\n');
    }

    @autobind
    onSubmitQuery(): void {
        const unknownQueriedIdsMap = stringListToSet(
            this.unknownQueriedIds.result
        );
        let formOps: { [id: string]: string } = {
            cancer_study_list: this.studyIds
                .filter(studyId => !unknownQueriedIdsMap[studyId])
                .join(','),
            tab_index: 'tab_visualize',
        };
        let molecularProfileFilters: string[] = [];

        if (
            this.filteredVirtualStudies.result.length === 0 &&
            this.studyIds.length === 1
        ) {
            if (
                this.alterationTypesInOQL.haveMutInQuery &&
                this.defaultMutationProfile
            ) {
                molecularProfileFilters.push(
                    getSuffixOfMolecularProfile(this.defaultMutationProfile)
                );
            }
            if (
                this.alterationTypesInOQL.haveStructuralVariantInQuery &&
                this.defaultStructuralVariantProfile
            ) {
                molecularProfileFilters.push(
                    getSuffixOfMolecularProfile(
                        this.defaultStructuralVariantProfile
                    )
                );
            }
            if (
                this.alterationTypesInOQL.haveCnaInQuery &&
                this.defaultCnaProfile
            ) {
                molecularProfileFilters.push(
                    getSuffixOfMolecularProfile(this.defaultCnaProfile)
                );
            }
            if (
                this.alterationTypesInOQL.haveMrnaInQuery &&
                this.defaultMrnaProfile
            ) {
                molecularProfileFilters.push(
                    getSuffixOfMolecularProfile(this.defaultMrnaProfile)
                );
            }
            if (
                this.alterationTypesInOQL.haveProtInQuery &&
                this.defaultProtProfile
            ) {
                molecularProfileFilters.push(
                    getSuffixOfMolecularProfile(this.defaultProtProfile)
                );
            }
        } else {
            molecularProfileFilters = _.chain([
                ...this.mutationProfiles.result,
                ...this.cnaProfiles.result,
                ...this.structuralVariantProfiles.result,
            ])
                .map(profile => getSuffixOfMolecularProfile(profile))
                .uniq()
                .value();
        }

        if (molecularProfileFilters.length > 0) {
            formOps.profileFilter = molecularProfileFilters.join(',');
        }

        if (this.chartsAreFiltered) {
            formOps.case_set_id = '-1';
            formOps.case_ids = _.map(this.selectedSamples.result, sample => {
                return sample.studyId + ':' + sample.sampleId;
            }).join('+');
        } else {
            if (
                this.filteredVirtualStudies.result.length === 0 &&
                this.studyIds.length === 1
            ) {
                formOps.case_set_id = this.studyIds[0] + '_all';
            } else {
                formOps.case_set_id = 'all';
            }
        }

        let url = '/';
        if (!_.isEmpty(this.geneQueries)) {
            formOps.Action = 'Submit';
            formOps.gene_list = this.geneQueries
                .map(query => unparseOQLQueryLine(query))
                .join('\n');
            url = '/results';
        }
        submitToPage(url, formOps, '_blank');
    }

    readonly cancerStudiesData = remoteData<ClinicalDataCountSummary[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            // return empty if there are no filtered samples
            if (!this.hasFilteredSamples) {
                return [];
            }
            let selectedSamples = [];
            if (
                this._chartSampleIdentifiersFilterSet.has(
                    SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                )
            ) {
                selectedSamples = await getSamplesByExcludingFiltersOnChart(
                    SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
                    this.filters,
                    _.fromPairs(this._chartSampleIdentifiersFilterSet.toJSON()),
                    this.queriedSampleIdentifiers.result,
                    this.queriedPhysicalStudyIds.result
                );
            } else {
                selectedSamples = this.selectedSamples.result;
            }
            const counts = _.values(
                _.reduce(
                    selectedSamples,
                    (acc, sample) => {
                        const studyId = sample.studyId;
                        if (acc[studyId]) {
                            acc[studyId].count = acc[studyId].count + 1;
                        } else {
                            acc[studyId] = {
                                value: `${studyId}`,
                                count: 1,
                            };
                        }
                        return acc;
                    },
                    {} as { [id: string]: ClinicalDataCount }
                )
            );
            return this.addColorToCategories(
                counts,
                SpecialChartsUniqueKeyEnum.CANCER_STUDIES
            );
        },
        onError: () => {},
        default: [],
    });

    @action
    showAsPieChart(uniqueKey: string, dataSize: number): void {
        if (
            shouldShowChart(
                this.initialFilters,
                dataSize,
                this.samples.result.length
            )
        ) {
            this.changeChartVisibility(uniqueKey, true);

            if (
                dataSize > STUDY_VIEW_CONFIG.thresholds.pieToTable ||
                _.includes(STUDY_VIEW_CONFIG.tableAttrs, uniqueKey)
            ) {
                this.chartsType.set(uniqueKey, ChartTypeEnum.TABLE);
                this.chartsDimension.set(
                    uniqueKey,
                    this.getTableDimensionByNumberOfRecords(dataSize)
                );
            } else {
                this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
                this.chartsDimension.set(
                    uniqueKey,
                    STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.PIE_CHART]
                );
            }
        }
    }

    readonly cancerStudyAsClinicalData = remoteData<ClinicalData[]>({
        await: () => [this.samples],
        invoke: async () => {
            return Promise.resolve(
                this.samples.result.map(sample => {
                    return {
                        clinicalAttributeId:
                            SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
                        patientId: sample.patientId,
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                        uniquePatientKey: sample.uniquePatientKey,
                        uniqueSampleKey: sample.uniqueSampleKey,
                        value: sample.studyId,
                    } as ClinicalData;
                })
            );
        },
        onError: () => Promise.resolve([]),
        default: [],
    });

    readonly survivalClinicalAttributesPrefix = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: () => {
            return Promise.resolve(
                getSurvivalClinicalAttributesPrefix(
                    this.clinicalAttributes.result
                )
            );
        },
        default: [],
    });

    readonly survivalDescriptions = remoteData({
        await: () => [
            this.clinicalAttributes,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            const survivalDescriptions = _.reduce(
                this.survivalClinicalAttributesPrefix.result!,
                (acc, prefix) => {
                    const clinicalAttributeId = `${prefix}_STATUS`;
                    const clinicalAttributeMap = _.groupBy(
                        this.clinicalAttributes.result,
                        'clinicalAttributeId'
                    );
                    if (
                        clinicalAttributeMap &&
                        clinicalAttributeMap[clinicalAttributeId] &&
                        clinicalAttributeMap[clinicalAttributeId].length > 0
                    ) {
                        clinicalAttributeMap[clinicalAttributeId].map(attr => {
                            if (!acc[prefix]) {
                                acc[prefix] = [];
                            }
                            acc[prefix].push({
                                studyName: attr.studyId,
                                description: attr.description,
                                displayName: attr.displayName,
                            } as ISurvivalDescription);
                        });
                    }
                    return acc;
                },
                {} as { [prefix: string]: ISurvivalDescription[] }
            );
            return Promise.resolve(survivalDescriptions);
        },
    });

    // For mutated genes, cna genes and structural variant gene charts we show number of profiled samples
    // in the chart title. These numbers are fetched from molecularProfileSampleCountSet
    public getChartTitle(
        chartType: ChartTypeEnum,
        title?: string
    ): string | undefined {
        let count = 0;
        if (this.molecularProfileSampleCountSet.result !== undefined) {
            switch (chartType) {
                case ChartTypeEnum.MUTATED_GENES_TABLE: {
                    count = this.molecularProfileSampleCountSet.result[
                        MolecularAlterationType_filenameSuffix.MUTATION_EXTENDED!
                    ]
                        ? this.molecularProfileSampleCountSet.result[
                              MolecularAlterationType_filenameSuffix.MUTATION_EXTENDED!
                          ]
                        : 0;
                    break;
                }
                case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE: {
                    count = getStructuralVariantSamplesCount(
                        this.molecularProfileSampleCountSet.result
                    );
                    break;
                }
                case ChartTypeEnum.CNA_GENES_TABLE: {
                    count = getCNASamplesCount(
                        this.molecularProfileSampleCountSet.result
                    );
                    break;
                }
            }
            if (count > 0) {
                return `${title} (${count} profiled ${pluralize(
                    'sample',
                    count
                )})`;
            }
        }
        return title;
    }

    @computed get isMixedReferenceGenome() {
        if (this.queriedPhysicalStudies.result) {
            return isMixedReferenceGenome(this.queriedPhysicalStudies.result);
        }
    }

    @observable
    private _patientTreatmentsFilter: AndedPatientTreatmentFilters = {
        filters: [],
    };

    @observable
    private _sampleTreatmentsFilters: AndedSampleTreatmentFilters = {
        filters: [],
    };

    @observable
    private _patientTreatmentGroupsFilter: AndedPatientTreatmentFilters = {
        filters: [],
    };

    @observable
    private _sampleTreatmentGroupsFilters: AndedSampleTreatmentFilters = {
        filters: [],
    };

    @observable
    private _patientTreatmentTargetFilter: AndedPatientTreatmentFilters = {
        filters: [],
    };

    @observable
    private _sampleTreatmentTargetFilters: AndedSampleTreatmentFilters = {
        filters: [],
    };

    @computed
    public get patientTreatmentTargetFilters(): AndedPatientTreatmentFilters {
        return this._patientTreatmentTargetFilter;
    }

    @computed
    public get sampleTreatmentTargetFilters(): AndedSampleTreatmentFilters {
        return this._sampleTreatmentTargetFilters;
    }

    @computed
    public get patientTreatmentGroupFilters(): AndedPatientTreatmentFilters {
        return this._patientTreatmentGroupsFilter;
    }

    @computed
    public get sampleTreatmentGroupFilters(): AndedSampleTreatmentFilters {
        return this._sampleTreatmentGroupsFilters;
    }

    @computed
    public get patientTreatmentFilters(): AndedPatientTreatmentFilters {
        return this._patientTreatmentsFilter;
    }

    @computed
    public get sampleTreatmentFilters(): AndedSampleTreatmentFilters {
        return this._sampleTreatmentsFilters;
    }

    @computed
    get sampleTreatmentFiltersAsStrings(): string[][] {
        return this.sampleTreatmentFilters.filters.map(outer => {
            return outer.filters.map(t => treatmentUniqueKey(t));
        });
    }

    @computed
    get patientTreatmentFiltersAsStrings(): string[][] {
        return this.patientTreatmentFilters.filters.map(outer => {
            return outer.filters.map(t => treatmentUniqueKey(t));
        });
    }

    @computed
    get sampleTreatmentGroupFiltersAsStrings(): string[][] {
        return this.sampleTreatmentGroupFilters.filters.map(outer => {
            return outer.filters.map(t => treatmentUniqueKey(t));
        });
    }

    @computed
    get patientTreatmentGroupFiltersAsStrings(): string[][] {
        return this.patientTreatmentGroupFilters.filters.map(outer => {
            return outer.filters.map(t => treatmentUniqueKey(t));
        });
    }

    @computed
    get sampleTreatmentTargetFiltersAsStrings(): string[][] {
        return this.sampleTreatmentTargetFilters.filters.map(outer => {
            return outer.filters.map(t => treatmentUniqueKey(t));
        });
    }

    @computed
    get patientTreatmentTargetFiltersAsStrings(): string[][] {
        return this.patientTreatmentTargetFilters.filters.map(outer => {
            return outer.filters.map(t => treatmentUniqueKey(t));
        });
    }

    @action
    public clearPatientTreatmentFilters(): void {
        this._patientTreatmentsFilter = { filters: [] };
    }

    @action
    public setPatientTreatmentFilters(
        filters: AndedPatientTreatmentFilters
    ): void {
        this._patientTreatmentsFilter = filters;
    }

    @action
    public addPatientTreatmentFilters(
        filters: OredPatientTreatmentFilters[]
    ): void {
        this._patientTreatmentsFilter.filters = this._patientTreatmentsFilter.filters.concat(
            filters
        );
    }

    @action
    public clearSampleTreatmentFilters(): void {
        this._sampleTreatmentsFilters = { filters: [] };
    }

    @action
    public setSampleTreatmentFilters(
        filters: AndedSampleTreatmentFilters
    ): void {
        this._sampleTreatmentsFilters = filters;
    }

    @action
    public addSampleTreatmentFilters(
        filters: OredSampleTreatmentFilters[]
    ): void {
        this._sampleTreatmentsFilters.filters = this._sampleTreatmentsFilters.filters.concat(
            filters
        );
    }

    @action
    public setTreatmentFilters(filters: Partial<StudyViewFilter>): void {
        if (
            filters.patientTreatmentFilters &&
            _.isArray(filters.patientTreatmentFilters.filters)
        ) {
            this.setPatientTreatmentFilters(filters.patientTreatmentFilters);
        }
        if (
            filters.sampleTreatmentFilters &&
            _.isArray(filters.sampleTreatmentFilters.filters)
        ) {
            this.setSampleTreatmentFilters(filters.sampleTreatmentFilters);
        }
        if (
            filters.patientTreatmentGroupFilters &&
            _.isArray(filters.patientTreatmentGroupFilters.filters)
        ) {
            this.setPatientTreatmentFilters(
                filters.patientTreatmentGroupFilters
            );
        }
        if (
            filters.sampleTreatmentGroupFilters &&
            _.isArray(filters.sampleTreatmentGroupFilters.filters)
        ) {
            this.setSampleTreatmentFilters(filters.sampleTreatmentGroupFilters);
        }
        if (
            filters.patientTreatmentTargetFilters &&
            _.isArray(filters.patientTreatmentTargetFilters.filters)
        ) {
            this.setPatientTreatmentFilters(
                filters.patientTreatmentTargetFilters
            );
        }
        if (
            filters.sampleTreatmentTargetFilters &&
            _.isArray(filters.sampleTreatmentTargetFilters.filters)
        ) {
            this.setSampleTreatmentFilters(
                filters.sampleTreatmentTargetFilters
            );
        }
    }

    @action
    public clearPatientTreatmentTargetFilters(): void {
        this._patientTreatmentTargetFilter = { filters: [] };
    }

    @action
    public setPatientTreatmentTargetFilters(
        filters: AndedPatientTreatmentFilters
    ): void {
        this._patientTreatmentTargetFilter = filters;
    }

    @action
    public addPatientTreatmentTargetFilters(
        filters: OredPatientTreatmentFilters[]
    ): void {
        this._patientTreatmentTargetFilter.filters = this._patientTreatmentTargetFilter.filters.concat(
            filters
        );
    }

    @action
    public clearSampleTreatmentTargetFilters(): void {
        this._sampleTreatmentTargetFilters = { filters: [] };
    }

    @action
    public setSampleTreatmentTargetFilters(
        filters: AndedSampleTreatmentFilters
    ): void {
        this._sampleTreatmentTargetFilters = filters;
    }

    @action
    public addSampleTreatmentTargetFilters(
        filters: OredSampleTreatmentFilters[]
    ): void {
        this._sampleTreatmentTargetFilters.filters = this._sampleTreatmentTargetFilters.filters.concat(
            filters
        );
    }

    @action
    public clearPatientTreatmentGroupFilters(): void {
        this._patientTreatmentGroupsFilter = { filters: [] };
    }

    @action
    public setPatientTreatmentGroupFilters(
        filters: AndedPatientTreatmentFilters
    ): void {
        this._patientTreatmentGroupsFilter = filters;
    }

    @action
    public addPatientTreatmentGroupFilters(
        filters: OredPatientTreatmentFilters[]
    ): void {
        this._patientTreatmentGroupsFilter.filters = this._patientTreatmentGroupsFilter.filters.concat(
            filters
        );
    }

    @action
    public clearSampleTreatmentGroupFilters(): void {
        this._sampleTreatmentGroupsFilters = { filters: [] };
    }

    @action
    public setSampleTreatmentGroupFilters(
        filters: AndedSampleTreatmentFilters
    ): void {
        this._sampleTreatmentGroupsFilters = filters;
    }

    @action
    public addSampleTreatmentGroupFilters(
        filters: OredSampleTreatmentFilters[]
    ): void {
        this._sampleTreatmentGroupsFilters.filters = this._sampleTreatmentGroupsFilters.filters.concat(
            filters
        );
    }

    // a row represents a list of patients that either have or have not recieved
    // a specific treatment
    public readonly sampleTreatments = remoteData({
        await: () => [this.shouldDisplaySampleTreatments],
        invoke: () => {
            if (this.shouldDisplaySampleTreatments.result) {
                return defaultClient.getAllSampleTreatmentsUsingPOST({
                    studyViewFilter: this.filters,
                });
            }
            return Promise.resolve([]);
        },
    });

    public readonly shouldDisplayPatientTreatments = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            return defaultClient.getContainsTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
            });
        },
    });

    public readonly shouldDisplaySampleTreatments = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            return defaultClient.getContainsSampleTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
            });
        },
    });

    // a row represents a list of samples that ether have or have not recieved
    // a specific treatment
    public readonly patientTreatments = remoteData({
        await: () => [this.shouldDisplayPatientTreatments],
        invoke: () => {
            if (this.shouldDisplayPatientTreatments.result) {
                return defaultClient.getAllPatientTreatmentsUsingPOST({
                    studyViewFilter: this.filters,
                });
            }
            return Promise.resolve([]);
        },
    });

    public readonly sampleTreatmentGroups = remoteData({
        await: () => [this.shouldDisplaySampleTreatmentGroups],
        invoke: () => {
            if (this.shouldDisplaySampleTreatmentGroups.result) {
                return defaultClient.getAllSampleTreatmentsUsingPOST({
                    studyViewFilter: this.filters,
                    tier: 'AgentClass',
                });
            }
            return Promise.resolve([]);
        },
    });

    public readonly shouldDisplayPatientTreatmentGroups = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            if (!getServerConfig().enable_treatment_groups) {
                return Promise.resolve(false);
            }
            return defaultClient.getContainsTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
                tier: 'AgentClass',
            });
        },
    });

    public readonly shouldDisplaySampleTreatmentGroups = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            if (!getServerConfig().enable_treatment_groups) {
                return Promise.resolve(false);
            }
            return defaultClient.getContainsSampleTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
                tier: 'AgentClass',
            });
        },
    });

    // a row represents a list of samples that ether have or have not recieved
    // a specific treatment
    public readonly patientTreatmentGroups = remoteData({
        await: () => [this.shouldDisplayPatientTreatmentGroups],
        invoke: () => {
            if (this.shouldDisplayPatientTreatmentGroups.result) {
                return defaultClient.getAllPatientTreatmentsUsingPOST({
                    studyViewFilter: this.filters,
                    tier: 'AgentClass',
                });
            }
            return Promise.resolve([]);
        },
    });

    public readonly sampleTreatmentTarget = remoteData({
        await: () => [this.shouldDisplaySampleTreatmentTarget],
        invoke: () => {
            if (this.shouldDisplaySampleTreatmentTarget.result) {
                return defaultClient.getAllSampleTreatmentsUsingPOST({
                    studyViewFilter: this.filters,
                    tier: 'AgentTarget',
                });
            }
            return Promise.resolve([]);
        },
    });

    public readonly shouldDisplayPatientTreatmentTarget = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            if (!getServerConfig().enable_treatment_groups) {
                return Promise.resolve(false);
            }
            return defaultClient.getContainsTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
                tier: 'AgentTarget',
            });
        },
    });

    public readonly shouldDisplaySampleTreatmentTarget = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            if (!getServerConfig().enable_treatment_groups) {
                return Promise.resolve(false);
            }
            return defaultClient.getContainsSampleTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
                tier: 'AgentTarget',
            });
        },
    });

    // a row represents a list of samples that ether have or have not recieved
    // a specific treatment
    public readonly patientTreatmentTarget = remoteData({
        await: () => [this.shouldDisplayPatientTreatmentTarget],
        invoke: () => {
            if (this.shouldDisplayPatientTreatmentTarget.result) {
                return defaultClient.getAllPatientTreatmentsUsingPOST({
                    studyViewFilter: this.filters,
                    tier: 'AgentTarget',
                });
            }
            return Promise.resolve([]);
        },
    });

    @action.bound
    public onTreatmentSelection(meta: ChartMeta, values: string[][]): void {
        const filters = values.map(outerFilter => {
            return {
                filters: outerFilter.map(innerFilter => {
                    return toTreatmentFilter(innerFilter, meta);
                }),
            };
        }) as any[];

        switch (meta.uniqueKey) {
            case 'SAMPLE_TREATMENT_TARGET':
                return this.addSampleTreatmentTargetFilters(filters);
            case 'PATIENT_TREATMENT_TARGET':
                return this.addPatientTreatmentTargetFilters(filters);
            case 'SAMPLE_TREATMENT_GROUPS':
                return this.addSampleTreatmentGroupFilters(filters);
            case 'PATIENT_TREATMENT_GROUPS':
                return this.addPatientTreatmentGroupFilters(filters);
            case 'SAMPLE_TREATMENTS':
                return this.addSampleTreatmentFilters(filters);
            case 'PATIENT_TREATMENTS':
                return this.addPatientTreatmentFilters(filters);
        }
    }

    @action.bound
    public removeTreatmentsFilter(
        andedIndex: number,
        oredIndex: number,
        metaKey: string
    ): void {
        const updatedFilters = this.sampleTreatmentFilters.filters
            .map((oFil, oInd) => {
                return {
                    filters: oFil.filters.filter((unused, iInd) => {
                        return !(andedIndex === oInd && oredIndex === iInd);
                    }),
                };
            })
            .filter(outerFilter => outerFilter.filters.length > 0);

        switch (metaKey) {
            case 'SAMPLE_TREATMENT_TARGET':
                return this.setSampleTreatmentTargetFilters({
                    filters: updatedFilters,
                });
            case 'PATIENT_TREATMENT_TARGET':
                return this.setPatientTreatmentTargetFilters({
                    filters: updatedFilters,
                });
            case 'SAMPLE_TREATMENT_GROUPS':
                return this.setSampleTreatmentGroupFilters({
                    filters: updatedFilters,
                });
            case 'PATIENT_TREATMENT_GROUPS':
                return this.setPatientTreatmentGroupFilters({
                    filters: updatedFilters,
                });
            case 'SAMPLE_TREATMENTS':
                return this.setSampleTreatmentFilters({
                    filters: updatedFilters,
                });
            case 'PATIENT_TREATMENTS':
                return this.setPatientTreatmentFilters({
                    filters: updatedFilters,
                });
        }
    }

    @computed get isGlobalMutationFilterActive(): boolean {
        return this.isGlobalAlterationFilterActive || this.isStatusFilterActive;
    }

    @computed get isGlobalAlterationFilterActive(): boolean {
        return this.isTiersFilterActive || this.isAnnotationsFilterActive;
    }

    @computed get isTiersFilterActive(): boolean {
        return driverTierFilterActive(
            _.fromPairs(this.driverAnnotationSettings.driverTiers.toJSON()),
            this.driverAnnotationSettings.includeUnknownTier
        );
    }

    @computed get isAnnotationsFilterActive(): boolean {
        return annotationFilterActive(
            this.driverAnnotationSettings.includeDriver,
            this.driverAnnotationSettings.includeVUS,
            this.driverAnnotationSettings.includeUnknownOncogenicity
        );
    }

    @computed get isStatusFilterActive(): boolean {
        return statusFilterActive(
            this.includeGermlineMutations,
            this.includeSomaticMutations,
            this.includeUnknownStatusMutations
        );
    }

    @computed get doShowDriverAnnotationSectionInGlobalMenu(): boolean {
        return !!(
            this.customDriverAnnotationReport.isComplete &&
            this.customDriverAnnotationReport.result!.hasBinary &&
            getServerConfig()
                .oncoprint_custom_driver_annotation_binary_menu_label &&
            getServerConfig()
                .oncoprint_custom_driver_annotation_tiers_menu_label
        );
    }

    @computed get doShowTierAnnotationSectionInGlobalMenu(): boolean {
        return !!(
            this.customDriverAnnotationReport.isComplete &&
            this.customDriverAnnotationReport.result!.tiers.length > 0 &&
            getServerConfig()
                .oncoprint_custom_driver_annotation_binary_menu_label &&
            getServerConfig()
                .oncoprint_custom_driver_annotation_tiers_menu_label
        );
    }

    private _survivalPlotLeftTruncationToggleMap = observable.map<
        ChartUniqueKey,
        boolean
    >({}, { deep: false });

    @computed
    public get survivalPlotLeftTruncationToggleMap(): Map<string, boolean> {
        return this._survivalPlotLeftTruncationToggleMap;
    }

    @action
    public updateSurvivalPlotLeftTruncationToggleMap(
        uniqueChartKey: string,
        value: boolean
    ) {
        this._survivalPlotLeftTruncationToggleMap.set(uniqueChartKey, value);
    }

    public get isLeftTruncationFeatureFlagEnabled() {
        return this.appStore.featureFlagStore.has(
            FeatureFlagEnum.LEFT_TRUNCATION_ADJUSTMENT
        );
    }

    @computed get isGeniebpcStudy() {
        return (
            this.studyIds.length === 1 &&
            this.studyIds[0] === 'heme_onc_nsclc_genie_bpc'
        );
    }
}
