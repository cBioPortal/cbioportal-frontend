import * as _ from 'lodash';
import AppConfig from 'appConfig';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import defaultClient from 'shared/api/cbioportalClientInstance';
import client from 'shared/api/cbioportalClientInstance';
import oncoKBClient from 'shared/api/oncokbClientInstance';
import {
    action,
    computed,
    IReactionDisposer,
    observable,
    reaction,
    toJS,
    makeObservable,
} from 'mobx';
import {
    AndedPatientTreatmentFilters,
    AndedSampleTreatmentFilters,
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
    ClinicalDataBinCountFilter,
    ClinicalDataBinFilter,
    ClinicalDataCount,
    ClinicalDataCountFilter,
    ClinicalDataCountItem,
    ClinicalDataFilter,
    ClinicalDataMultiStudyFilter,
    CopyNumberSeg,
    DataFilterValue,
    DensityPlotBin,
    Gene,
    GeneFilter,
    GenePanel,
    GenomicDataBin,
    GenomicDataBinFilter,
    GenomicDataFilter,
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    MolecularProfileFilter,
    MutationMultipleStudyFilter,
    NumericGeneMolecularData,
    OredPatientTreatmentFilters,
    OredSampleTreatmentFilters,
    Patient,
    PatientTreatmentRow,
    ResourceData,
    ResourceDefinition,
    Sample,
    SampleIdentifier,
    SampleMolecularIdentifier,
    SampleTreatmentRow,
    StudyViewFilter,
    GenericAssayDataFilter,
    GenericAssayMeta,
} from 'cbioportal-ts-api-client';
import {
    fetchCopyNumberSegmentsForSamples,
    getAlterationTypesInOql,
    getDefaultProfilesForOql,
    getSurvivalClinicalAttributesPrefix,
} from 'shared/lib/StoreUtils';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';
import {
    AnalysisGroup,
    calculateLayout,
    ChartDataCountSet,
    ChartMeta,
    ChartMetaDataTypeEnum,
    ChartMetaWithDimensionAndChartType,
    ChartType,
    clinicalAttributeComparator,
    ClinicalDataCountSummary,
    ClinicalDataTypeEnum,
    convertGenomicDataBinsToDataBins,
    DataType,
    generateScatterPlotDownloadData,
    GenomicDataCountWithSampleUniqueKeys,
    getChartMetaDataType,
    getChartSettingsMap,
    getClinicalDataBySamples,
    getClinicalDataCountWithColorByClinicalDataCount,
    getClinicalEqualityFilterValuesByString,
    getCNAByAlteration,
    getCNASamplesCount,
    getDataIntervalFilterValues,
    getDefaultPriorityByUniqueKey,
    getFilteredAndCompressedDataIntervalFilters,
    getFilteredSampleIdentifiers,
    getFilteredStudiesWithSamples,
    getFrequencyStr,
    getGenomicChartUniqueKey,
    getGenomicDataAsClinicalData,
    getGroupsFromBins,
    getGroupsFromQuartiles,
    getMolecularProfileIdsFromUniqueKey,
    getMolecularProfileOptions,
    getMolecularProfileSamplesSet,
    getPriorityByClinicalAttribute,
    getQValue,
    getRequestedAwaitPromisesForClinicalData,
    getSamplesByExcludingFiltersOnChart,
    getUniqueKey,
    getUniqueKeyFromMolecularProfileIds,
    isFiltered,
    isLogScaleByDataBins,
    MutationCountVsCnaYBinsMin,
    NumericalGroupComparisonType,
    pickNewColorForClinicData,
    RectangleBounds,
    shouldShowChart,
    showOriginStudiesInSummaryDescription,
    SPECIAL_CHARTS,
    SpecialChartsUniqueKeyEnum,
    StudyWithSamples,
    submitToPage,
    updateSavedUserPreferenceChartIds,
    getGenericAssayChartUniqueKey,
    getGenericAssayDataAsClinicalData,
    convertGenericAssayDataBinsToDataBins,
    getNonZeroUniqueBins,
    DataBin,
    convertClinicalDataBinsToDataBins,
} from './StudyViewUtils';
import MobxPromise from 'mobxpromise';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import autobind from 'autobind-decorator';
import { updateGeneQuery } from 'pages/studyView/StudyViewUtils';
import { generateDownloadFilenamePrefixByStudies } from 'shared/lib/FilenameUtils';
import { unparseOQLQueryLine } from 'shared/lib/oql/oqlfilter';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import { VirtualStudy } from 'shared/model/VirtualStudy';
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
import onMobxPromise from '../../shared/lib/onMobxPromise';
import request from 'superagent';
import { trackStudyViewFilterEvent } from '../../shared/lib/tracking';
import {
    Group,
    SessionGroupData,
} from '../../shared/api/ComparisonGroupClient';
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
import {
    DataType as DownloadDataType,
    pluralize,
    remoteData,
    stringListToSet,
} from 'cbioportal-frontend-commons';
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
import {
    AlterationTypeConstants,
    DataTypeConstants,
} from 'pages/resultsView/ResultsViewPageStore';
import {
    generateStudyViewSurvivalPlotTitle,
    getSurvivalStatusBoolean,
} from 'pages/resultsView/survival/SurvivalUtil';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    toPatientTreatmentFilter,
    toSampleTreatmentFilter,
    treatmentUniqueKey,
    treatmentComparisonGroupName,
} from './table/treatments/treatmentsTableUtil';
import StudyViewURLWrapper from './StudyViewURLWrapper';
import { isMixedReferenceGenome } from 'shared/lib/referenceGenomeUtils';
import { Datalabel } from 'shared/lib/DataUtils';
import PromisePlus from 'shared/lib/PromisePlus';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import { REQUEST_ARG_ENUM } from 'shared/constants';
import {
    createAlteredGeneComparisonSession,
    doesChartHaveComparisonGroupsLimit,
    getCnaData,
    getMutationData,
} from 'pages/studyView/StudyViewComparisonUtils';
import {
    CNA_AMP_VALUE,
    CNA_HOMDEL_VALUE,
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import {
    GenericAssayDataBinFilter,
    GenericAssayDataBin,
} from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import {
    fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId,
    fetchGenericAssayMetaByMolecularProfileIdsGroupByGenericAssayType,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { flatMap } from 'lodash';
import { CustomChart, CustomChartSession } from 'shared/api/sessionServiceAPI';

type ChartUniqueKey = string;
type ResourceId = string;
type ComparisonGroupId = string;
type AttributeId = string;

export type ChartUserSetting = {
    id: string;
    name?: string;
    chartType?: ChartType;
    groups?: any; // for backward compatibility
    layout?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    patientAttribute: boolean;
    filterByCancerGenes?: boolean;
    customBins?: number[];
    disableLogScale?: boolean;
    description?: string;
    profileType?: string;
    hugoGeneSymbol?: string;
    genericAssayType?: string;
    genericAssayEntityId?: string;
    dataType?: string;
};

export type StudyPageSettings = {
    chartSettings: ChartUserSetting[];
    origin: string[];
};

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
    survivalData: PatientSurvival[];
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
};

export const DataBinMethodConstants: { [key: string]: 'DYNAMIC' | 'STATIC' } = {
    STATIC: 'STATIC',
    DYNAMIC: 'DYNAMIC',
};

export type CustomChartIdentifierWithValue = Pick<
    ClinicalData,
    'studyId' | 'sampleId' | 'patientId' | 'value'
>;

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

export class StudyViewPageStore {
    private reactionDisposers: IReactionDisposer[] = [];

    private chartItemToColor: Map<string, string>;
    private chartToUsedColors: Map<string, Set<string>>;

    public studyViewQueryFilter: StudyViewURLQuery;

    @observable showComparisonGroupUI = false;
    @observable showCustomDataSelectionUI = false;

    constructor(
        public appStore: AppStore,
        private sessionServiceIsEnabled: boolean,
        private urlWrapper: StudyViewURLWrapper
    ) {
        makeObservable(this);
        this.chartItemToColor = new Map();
        this.chartToUsedColors = new Map();
        this.reactionDisposers.push(
            reaction(
                () => this.loadingInitialDataForSummaryTab,
                () => {
                    if (!this.loadingInitialDataForSummaryTab) {
                        this.updateChartStats();
                        this.loadUserSettings();
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
                () => toJS(this.currentChartSettingsMap),
                () => {
                    if (this.isSavingUserSettingsPossible) {
                        if (!this.hideRestoreSettingsMsg) {
                            // hide restore message if its already shown
                            // this is because the user setting session is going to be updated for every operation once the user is logged in
                            this.hideRestoreSettingsMsg = true;
                        }
                        this.updateUserSettingsDebounce();
                    }
                }
            )
        );

        this.reactionDisposers.push(
            reaction(
                () => this.fetchUserSettings.isComplete,
                isComplete => {
                    //execute if user log in from study page
                    if (
                        isComplete &&
                        this.isSavingUserPreferencePossible &&
                        !this._loadUserSettingsInitially
                    ) {
                        this.previousSettings = this.currentChartSettingsMap;
                        this.loadUserSettings();
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
    destroy() {
        for (const disposer of this.reactionDisposers) {
            disposer();
        }
    }

    private openResourceTabMap = observable.map<ResourceId, boolean>();
    @autobind
    public isResourceTabOpen(resourceId: string) {
        return !!this.openResourceTabMap.get(resourceId);
    }
    @action.bound
    public setResourceTabOpen(resourceId: string, open: boolean) {
        this.openResourceTabMap.set(resourceId, open);
    }

    @observable.ref
    private _comparisonConfirmationModal: JSX.Element | null = null;
    public get comparisonConfirmationModal() {
        return this._comparisonConfirmationModal;
    }
    @action.bound
    public setComparisonConfirmationModal(
        getModal: (hideModal: () => void) => JSX.Element
    ) {
        this._comparisonConfirmationModal = getModal(() => {
            this._comparisonConfirmationModal = null;
        });
    }

    // <comparison groups code>
    private _selectedComparisonGroups = observable.map<
        ComparisonGroupId,
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

    @action public setComparisonGroupSelected(
        groupId: string,
        selected = true
    ) {
        this._selectedComparisonGroups.set(groupId, selected);
    }

    @action public toggleComparisonGroupSelected(groupId: string) {
        this.setComparisonGroupSelected(
            groupId,
            !this.isComparisonGroupSelected(groupId)
        );
    }

    @action public toggleComparisonGroupMarkedForDeletion(groupId: string) {
        this._comparisonGroupsMarkedForDeletion.set(
            groupId,
            !this.isComparisonGroupMarkedForDeletion(groupId)
        );
    }

    @action public toggleCustomChartMarkedForDeletion(chartId: string) {
        this._customChartsMarkedForDeletion.set(
            chartId,
            !this.isCustomChartGroupMarkedForDeletion(chartId)
        );
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
    public get customChartGroupMarkedForDeletion() {
        const customChartGroupMarkedForDeletion: string[] = [];
        this._customChartsMarkedForDeletion.forEach((key, value) => {
            if (key) {
                customChartGroupMarkedForDeletion.push(value);
            }
        });
        return customChartGroupMarkedForDeletion;
    }

    @action public async deleteMarkedComparisonGroups() {
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

                this._selectedComparisonGroups.delete(groupId);
            }
        }

        await Promise.all(deletionPromises);
        this._comparisonGroupsMarkedForDeletion.clear();
        this.notifyComparisonGroupsChange();
    }

    @action public async deleteMarkedCustomData() {
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
    public async saveGroupsToUserProfile(groups: StudyViewComparisonGroup[]) {
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
    ) {
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

    readonly userSavedGroups = remoteData<StudyViewComparisonGroup[]>({
        await: () => [this.sampleSet, this.pendingDecision],
        invoke: async () => {
            // reference this so its responsive to changes
            this._comparisonGroupsChangeCount;
            if (
                this.studyIds.length > 0 &&
                this.isLoggedIn &&
                !this.pendingDecision.result
            ) {
                const groups = await comparisonClient.getGroupsForStudies(
                    this.studyIds.slice()
                ); // slice because cant pass mobx

                return groups.map(group =>
                    Object.assign(
                        group.data,
                        { uid: group.id, isSharedGroup: false },
                        finalizeStudiesAttr(group.data, this.sampleSet.result!)
                    )
                );
            }
            return [];
        },
        default: [],
    });

    readonly sharedGroups = remoteData<StudyViewComparisonGroup[]>({
        await: () => [this.sampleSet, this.queriedPhysicalStudyIds],
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
                        { uid: group.id, isSharedGroup: true },
                        finalizeStudiesAttr(group.data, this.sampleSet.result!)
                    )
                );
        },
        default: [],
    });

    readonly comparisonGroups = remoteData<StudyViewComparisonGroup[]>({
        await: () => [this.userSavedGroups, this.sharedGroups],
        invoke: async () => {
            let groups: StudyViewComparisonGroup[] = _.cloneDeep(
                this.userSavedGroups.result
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
            const missingGroupIds = Array.from(
                this._selectedComparisonGroups.keys()
            ).filter(groupId => groupIdSet[groupId] === undefined);

            if (missingGroupIds.length > 0) {
                const promises = [];
                for (const groupId of missingGroupIds) {
                    promises.push(comparisonClient.getGroup(groupId));
                }
                const studyIdsSet = stringListToSet(
                    this.queriedPhysicalStudyIds.result!
                );
                let newGroups: Group[] = await Promise.all(promises);

                newGroups
                    .filter(
                        group =>
                            !_.some(
                                group.data.studies,
                                study => studyIdsSet[study.id] === undefined
                            )
                    )
                    .forEach(group =>
                        groups.push(
                            Object.assign(
                                group.data,
                                { uid: group.id },
                                finalizeStudiesAttr(
                                    group.data,
                                    this.sampleSet.result!
                                )
                            )
                        )
                    );
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
            const promises: Promise<CustomChartSession>[] = [];
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
                .map(chustomChartsSession => {
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
                        isSharedChart: true,
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
        },
        default: [],
        onResult: customDataList => {
            this.updateCustomDataList(customDataList, false, true);
            this.saveSharedCustomDataToUserProfile(customDataList);
        },
    });

    @observable private _comparisonGroupsChangeCount = 0;
    @action public notifyComparisonGroupsChange() {
        this._comparisonGroupsChangeCount += 1;
    }

    private async createNumberAttributeComparisonSession(
        chartMeta: ChartMeta,
        categorizationType: NumericalGroupComparisonType,
        statusCallback: (phase: LoadingPhase) => void
    ) {
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
    ) {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        // For patient treatments comparison, use all samples for that treatment, pre- and post-
        const isPatientType =
            chartType === ChartTypeEnum.PATIENT_TREATMENTS_TABLE;
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
                        (treatmentRows, id) => {
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

    private createCnaGeneComparisonSession(
        chartMeta: ChartMeta,
        hugoGeneSymbols: string[],
        statusCallback: (phase: LoadingPhase) => void
    ) {
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
    ) {
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
    ) {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);

        const promises: any = [this.selectedSamples];
        if (chartMeta.uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
            promises.push(this.cancerStudyAsClinicalData);
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
    ) {
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
        let sessionId: string;
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
                sessionId = await this.createCategoricalAttributeComparisonSession(
                    chartMeta,
                    params.clinicalAttributeValues!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.MUTATED_GENES_TABLE:
                sessionId = await this.createMutatedGeneComparisonSession(
                    chartMeta,
                    params.hugoGeneSymbols!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.CNA_GENES_TABLE:
                sessionId = await this.createCnaGeneComparisonSession(
                    chartMeta,
                    params.hugoGeneSymbols!,
                    statusCallback
                );
                break;
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                sessionId = await this.createTreatmentsComparisonSession(
                    chartMeta,
                    chartType,
                    params.treatmentUniqueKeys!,
                    statusCallback
                );
                break;
            default:
                sessionId = await this.createNumberAttributeComparisonSession(
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
            redirectToComparisonPage(comparisonWindow!, { sessionId });
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
    @computed.struct get genomicProfilesFilter() {
        return this._genomicProfilesFilter;
    }
    @computed.struct get caseListsFilter() {
        return this._caseListsFilter;
    }

    @action public setGenomicProfilesFilter(p: string[][]) {
        this._genomicProfilesFilter = p;
    }

    @action public setCaseListsFilter(p: string[][]) {
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
    private _genericAssayDataIntervalFilterSet = observable.map<
        ChartUniqueKey,
        GenericAssayDataFilter
    >({}, { deep: false });

    @observable private _clinicalDataBinFilterSet = observable.map<
        ChartUniqueKey,
        ClinicalDataBinFilter
    >();
    @observable private _genomicDataBinFilterSet = observable.map<
        ChartUniqueKey,
        GenomicDataBinFilter
    >();
    @observable private _genericAssayDataBinFilterSet = observable.map<
        ChartUniqueKey,
        GenericAssayDataBinFilter
    >();

    @observable.ref private _geneFilterSet = observable.map<
        string,
        string[][]
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

    @computed get currentTab() {
        return this.urlWrapper.tabId;
    }

    @observable pageStatusMessages: { [code: string]: StatusMessage } = {};

    public isNewlyAdded(uniqueKey: string) {
        return this.newlyAddedCharts.includes(uniqueKey);
    }

    @action
    updateStoreByFilters(filters: Partial<StudyViewFilter>) {
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
                this._genericAssayDataIntervalFilterSet.set(
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
    async updateStoreFromURL(query: StudyViewURLQuery) {
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
    get initialFilters() {
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
    private updateLayout() {
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
    updateCurrentGridLayout(newGridLayout: ReactGridLayout.Layout[]) {
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

    private _chartSampleIdentifiersFilterSet = observable.map<
        ChartUniqueKey,
        SampleIdentifier[]
    >();

    public preDefinedCustomChartFilterSet = observable.map<
        ChartUniqueKey,
        string[]
    >();

    @observable numberOfSelectedSamplesInCustomSelection: number = 0;
    @observable _filterComparisonGroups: StudyViewComparisonGroup[] = [];

    @observable private _filterMutatedGenesTableByCancerGenes: boolean = true;
    @observable private _filterFusionGenesTableByCancerGenes: boolean = true;
    @observable private _filterCNAGenesTableByCancerGenes: boolean = true;

    @action.bound
    updateMutatedGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterMutatedGenesTableByCancerGenes = filtered;
    }
    @action.bound
    updateFusionGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterFusionGenesTableByCancerGenes = filtered;
    }

    @action.bound
    updateCNAGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterCNAGenesTableByCancerGenes = filtered;
    }

    @computed get filterMutatedGenesTableByCancerGenes() {
        return (
            this.oncokbCancerGeneFilterEnabled &&
            this._filterMutatedGenesTableByCancerGenes
        );
    }

    @computed get filterFusionGenesTableByCancerGenes() {
        return (
            this.oncokbCancerGeneFilterEnabled &&
            this._filterFusionGenesTableByCancerGenes
        );
    }

    @computed get filterCNAGenesTableByCancerGenes() {
        return (
            this.oncokbCancerGeneFilterEnabled &&
            this._filterCNAGenesTableByCancerGenes
        );
    }

    public get filterComparisonGroups() {
        return this._filterComparisonGroups;
    }

    @action public updateComparisonGroupsFilter() {
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

    //used in saving custom added charts
    @observable private _customChartMap = observable.map<
        ChartUniqueKey,
        CustomChart
    >({}, { deep: false });
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

    @observable private _newlyCreatedcustomChartSet = observable.map<
        ChartUniqueKey,
        ChartMeta & {
            data: CustomChartIdentifierWithValue[];
            isSharedChart?: boolean;
        }
    >({}, { deep: false });

    @action.bound
    onCheckGene(hugoGeneSymbol: string) {
        //only update geneQueryStr whenever a table gene is clicked.
        this.geneQueries = updateGeneQuery(this.geneQueries, hugoGeneSymbol);
        this.geneQueryStr = this.geneQueries
            .map(query => unparseOQLQueryLine(query))
            .join(' ');
    }

    @action.bound
    isSharedCustomData(chartId: string) {
        return this.customChartSet.has(chartId)
            ? this.customChartSet.get(chartId)?.isSharedChart || false
            : false;
    }

    @computed get selectedGenes(): string[] {
        return this.geneQueries.map(singleGeneQuery => singleGeneQuery.gene);
    }

    @action.bound
    updateSelectedGenes(query: SingleGeneQuery[], queryStr: string) {
        this.geneQueries = query;
        this.geneQueryStr = queryStr;
    }

    @computed get alterationTypesInOQL() {
        return getAlterationTypesInOql(this.geneQueries);
    }

    @computed get defaultProfilesForOql() {
        if (this.molecularProfiles.isComplete) {
            return getDefaultProfilesForOql(this.molecularProfiles.result);
        }
        return undefined;
    }
    @computed get defaultMutationProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.MUTATION_EXTENDED
            ]
        );
    }
    @computed get defaultCnaProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.COPY_NUMBER_ALTERATION
            ]
        );
    }
    @computed get defaultMrnaProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[AlterationTypeConstants.MRNA_EXPRESSION]
        );
    }
    @computed get defaultProtProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[AlterationTypeConstants.PROTEIN_LEVEL]
        );
    }

    @action.bound
    clearAllFilters() {
        this._clinicalDataFilterSet.clear();
        this._customDataFilterSet.clear();
        this._geneFilterSet.clear();
        this._genomicDataIntervalFilterSet.clear();
        this._genericAssayDataIntervalFilterSet.clear();
        this._chartSampleIdentifiersFilterSet.clear();
        this.preDefinedCustomChartFilterSet.clear();
        this.numberOfSelectedSamplesInCustomSelection = 0;
        this.removeComparisonGroupSelectionFilter();
        this._customBinsFromScatterPlotSelectionSet.clear();
        this.setGenomicProfilesFilter([]);
        this.setCaseListsFilter([]);
        this.clearPatientTreatmentFilters();
        this.clearSampleTreatmentFilters();
    }

    @computed
    get analysisGroupsSettings() {
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

    @action
    updateClinicalDataIntervalFilters(
        chartUniqueKey: string,
        dataBins: DataBin[]
    ) {
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
    ) {
        if (this.chartMetaSet[chartUniqueKey]) {
            let chartMeta = this.chartMetaSet[chartUniqueKey];
            trackStudyViewFilterEvent('clinicalDataFilters', this);
            if (values.length > 0) {
                const clinicalDataFilter = {
                    attributeId: chartMeta.clinicalAttribute!
                        .clinicalAttributeId,
                    values: values,
                };
                this._clinicalDataFilterSet.set(
                    chartMeta.uniqueKey,
                    clinicalDataFilter
                );
            } else {
                this._clinicalDataFilterSet.delete(chartMeta.uniqueKey);
            }
        }
    }

    @action.bound
    setCustomChartFilters(chartUniqueKey: string, values: string[]) {
        if (chartUniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
            if (values.length > 0) {
                let filteredSampleIdentifiers = getFilteredSampleIdentifiers(
                    this.samples.result.filter(sample =>
                        values.includes(sample.studyId)
                    )
                );
                this._chartSampleIdentifiersFilterSet.set(
                    chartUniqueKey,
                    filteredSampleIdentifiers
                );
                this.preDefinedCustomChartFilterSet.set(chartUniqueKey, values);
            } else {
                this._chartSampleIdentifiersFilterSet.delete(chartUniqueKey);
                this.preDefinedCustomChartFilterSet.delete(chartUniqueKey);
            }
        } else {
            if (this.chartMetaSet[chartUniqueKey]) {
                let chartMeta = this.chartMetaSet[chartUniqueKey];
                if (values.length > 0) {
                    const clinicalDataFilter = {
                        attributeId: chartMeta.uniqueKey,
                        values: values.map(
                            value => ({ value } as DataFilterValue)
                        ),
                    };
                    this._customDataFilterSet.set(
                        chartMeta.uniqueKey,
                        clinicalDataFilter
                    );
                } else {
                    this._customDataFilterSet.delete(chartMeta.uniqueKey);
                }
            }
        }
    }

    @action.bound
    updateGenomicDataIntervalFilters(
        uniqueKey: string,
        dataBins: GenomicDataBin[]
    ) {
        trackStudyViewFilterEvent('genomicDataInterval', this);

        const values: DataFilterValue[] = getDataIntervalFilterValues(dataBins);
        this.updateGenomicDataIntervalFiltersByValues(uniqueKey, values);
    }

    @action.bound
    updateGenericAssayDataIntervalFilters(
        uniqueKey: string,
        dataBins: GenericAssayDataBin[]
    ) {
        trackStudyViewFilterEvent('genericAssayDataInterval', this);

        const values: DataFilterValue[] = getDataIntervalFilterValues(dataBins);
        this.updateGenericAssayDataIntervalFiltersByValues(uniqueKey, values);
    }

    @action.bound
    updateScatterPlotFilterByValues(
        chartUniqueKey: string,
        bounds?: RectangleBounds
    ) {
        if (
            chartUniqueKey ===
            SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
        ) {
            if (bounds === undefined) {
                this._clinicalDataFilterSet.delete(
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                );
                this._clinicalDataFilterSet.delete(
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                );
                this._customBinsFromScatterPlotSelectionSet.delete(
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                );
                this._customBinsFromScatterPlotSelectionSet.delete(
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                );
            } else {
                const mutationCountFilter: DataFilterValue = {
                    start: bounds.yStart,
                    end: bounds.yEnd,
                } as any;
                const mutationCountIntervalFilter = {
                    attributeId: SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                    values: [mutationCountFilter],
                };
                this._customBinsFromScatterPlotSelectionSet.set(
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                    [mutationCountFilter.start, mutationCountFilter.end]
                );
                this._clinicalDataFilterSet.set(
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                    mutationCountIntervalFilter
                );

                const fgaFilter: DataFilterValue = {
                    start: bounds.xStart,
                    end: bounds.xEnd,
                } as any;
                const fgaIntervalFilter = {
                    attributeId:
                        SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
                    values: [fgaFilter],
                };
                this._customBinsFromScatterPlotSelectionSet.set(
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
                    [fgaFilter.start, fgaFilter.end]
                );
                this._clinicalDataFilterSet.set(
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
                    fgaIntervalFilter
                );
            }
        }
    }

    @action.bound
    addGeneFilters(chartMeta: ChartMeta, hugoGeneSymbols: string[][]) {
        trackStudyViewFilterEvent('geneFilter', this);
        let geneFilters =
            toJS(this._geneFilterSet.get(chartMeta.uniqueKey)) || [];
        geneFilters = geneFilters.concat(hugoGeneSymbols);

        this._geneFilterSet.set(chartMeta.uniqueKey, geneFilters);
    }

    @action.bound
    updateGenomicDataIntervalFiltersByValues(
        uniqueKey: string,
        values: DataFilterValue[]
    ) {
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
    updateGenericAssayDataIntervalFiltersByValues(
        uniqueKey: string,
        values: DataFilterValue[]
    ) {
        if (values.length > 0) {
            const chart = this._genericAssayChartMap.get(uniqueKey);
            const gaDataIntervalFilter: GenericAssayDataFilter = {
                stableId: chart!.genericAssayEntityId,
                profileType: chart!.profileType,
                values: values,
            };
            this._genericAssayDataIntervalFilterSet.set(
                uniqueKey,
                gaDataIntervalFilter
            );
        } else {
            this._genericAssayDataIntervalFilterSet.delete(uniqueKey);
        }
    }

    @action.bound
    addGenomicProfilesFilter(chartMeta: ChartMeta, profiles: string[][]) {
        let genomicProfilesFilter = toJS(this.genomicProfilesFilter) || [];
        this.setGenomicProfilesFilter(genomicProfilesFilter.concat(profiles));
    }

    @action.bound
    addCaseListsFilter(chartMeta: ChartMeta, caseLists: string[][]) {
        let caseListsFilter = toJS(this.caseListsFilter) || [];
        this.setCaseListsFilter(caseListsFilter.concat(caseLists));
    }

    @action.bound
    removeGeneFilter(chartUniqueKey: string, toBeRemoved: string) {
        let geneFilters = toJS(this._geneFilterSet.get(chartUniqueKey)) || [];
        geneFilters = _.reduce(
            geneFilters,
            (acc, next) => {
                const newGroup = next.filter(oql => oql !== toBeRemoved);
                if (newGroup.length > 0) {
                    acc.push(newGroup);
                }
                return acc;
            },
            [] as string[][]
        );
        if (geneFilters.length === 0) {
            this._geneFilterSet.delete(chartUniqueKey);
        } else {
            this._geneFilterSet.set(chartUniqueKey, geneFilters);
        }
    }

    @action.bound
    resetGeneFilter(chartUniqueKey: string) {
        this._geneFilterSet.delete(chartUniqueKey);
    }

    @action.bound
    removeGenomicProfileFilter(toBeRemoved: string) {
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
    removeCaseListsFilter(toBeRemoved: string) {
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
    ) {
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

    public getChartSampleIdentifiersFilter(chartKey: string) {
        //return this._sampleIdentifiers;
        return this._chartSampleIdentifiersFilterSet.get(chartKey) || [];
    }

    public getPreDefinedCustomChartFilters(chartKey: string) {
        return this.preDefinedCustomChartFilterSet.get(chartKey) || [];
    }

    public isPreDefinedCustomChart(uniqueKey: string): boolean {
        return uniqueKey in SpecialChartsUniqueKeyEnum;
    }

    public newCustomChartUniqueKey(): string {
        return `CUSTOM_FILTERS_${this._customCharts.size}`;
    }

    public getUserDefinedCustomChartFilters(chartKey: string) {
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
    changeChartVisibility(uniqueKey: string, visible: boolean) {
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
    ) {
        if (!visible) {
            switch (this.chartsType.get(chartUniqueKey)) {
                case ChartTypeEnum.PIE_CHART:
                case ChartTypeEnum.TABLE:
                    if (this.isUserDefinedCustomDataChart(chartUniqueKey)) {
                        this.setCustomChartFilters(chartUniqueKey, []);
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
                        this.updateGenericAssayDataIntervalFilters(
                            chartUniqueKey,
                            []
                        );
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
                case ChartTypeEnum.FUSION_GENES_TABLE:
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
                    this._genericAssayDataIntervalFilterSet.delete(
                        chartUniqueKey
                    );

                    break;
            }
        }
        this.changeChartVisibility(chartUniqueKey, visible);
    }

    private isChartFiltered(chartUniqueKey: string) {
        switch (this.chartsType.get(chartUniqueKey)) {
            case ChartTypeEnum.PIE_CHART:
            case ChartTypeEnum.TABLE:
                if (this.isUserDefinedCustomDataChart(chartUniqueKey)) {
                    return (
                        this._customDataFilterSet.has(chartUniqueKey) ||
                        this.preDefinedCustomChartFilterSet.has(chartUniqueKey)
                    );
                }
                return this._clinicalDataFilterSet.has(chartUniqueKey);
            case ChartTypeEnum.BAR_CHART:
                if (this.isGeneSpecificChart(chartUniqueKey)) {
                    this._genomicDataIntervalFilterSet.has(chartUniqueKey);
                }
                return this._clinicalDataFilterSet.has(chartUniqueKey);
            case ChartTypeEnum.SCATTER:
                if (
                    chartUniqueKey ===
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
                ) {
                    return (
                        this._customBinsFromScatterPlotSelectionSet.has(
                            SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                        ) &&
                        this._customBinsFromScatterPlotSelectionSet.has(
                            SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                        )
                    );
                }
                return false;
            case ChartTypeEnum.MUTATED_GENES_TABLE:
            case ChartTypeEnum.FUSION_GENES_TABLE:
            case ChartTypeEnum.CNA_GENES_TABLE:
                return this._geneFilterSet.has(chartUniqueKey);
            case ChartTypeEnum.GENOMIC_PROFILES_TABLE:
                return !_.isEmpty(this._genomicProfilesFilter);
            case ChartTypeEnum.CASE_LIST_TABLE:
                return !_.isEmpty(this._caseListsFilter);
            case ChartTypeEnum.SURVIVAL:
                return false;
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
                return !_.isEmpty(this._patientTreatmentsFilter.filters);
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                return !_.isEmpty(this._sampleTreatmentsFilters.filters);
            default:
                return false;
        }
    }

    @action.bound
    removeComparisonGroupSelectionFilter() {
        this._chartSampleIdentifiersFilterSet.delete(
            SpecialChartsUniqueKeyEnum.SELECTED_COMPARISON_GROUPS
        );
        this._filterComparisonGroups = [];
    }

    @action.bound
    removeCustomSelectFilter() {
        this._chartSampleIdentifiersFilterSet.delete(
            SpecialChartsUniqueKeyEnum.CUSTOM_SELECT
        );
        this.numberOfSelectedSamplesInCustomSelection = 0;
    }

    @action
    toggleLogScale(uniqueKey: string) {
        if (this.isGeneSpecificChart(uniqueKey)) {
            // reset filters before toggling
            this.updateGenomicDataIntervalFilters(uniqueKey, []);

            // the toggle should really only be used by the bar chart.
            // the genomicDataBinFilter is guaranteed for bar chart.
            let ref = this._genomicDataBinFilterSet.get(uniqueKey);
            ref!.disableLogScale = !ref!.disableLogScale;
        } else if (this.isGenericAssayChart(uniqueKey)) {
            // reset filters before toggling
            this.updateGenericAssayDataIntervalFilters(uniqueKey, []);

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

    public isLogScaleToggleVisible(uniqueKey: string, dataBins?: DataBin[]) {
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

    public isLogScaleChecked(uniqueKey: string) {
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
    public updateCustomBins(uniqueKey: string, bins: number[]) {
        if (this.isGeneSpecificChart(uniqueKey)) {
            let newFilter = _.clone(
                this._genomicDataBinFilterSet.get(uniqueKey)
            )!;
            newFilter.customBins = bins;
            this._genomicDataBinFilterSet.set(uniqueKey, newFilter);
        } else if (this.isGenericAssayChart(uniqueKey)) {
            let newFilter = _.clone(
                this._genericAssayDataBinFilterSet.get(uniqueKey)
            )!;
            newFilter.customBins = bins;
            this._genericAssayDataBinFilterSet.set(uniqueKey, newFilter);
        } else {
            let newFilter = _.clone(
                this._clinicalDataBinFilterSet.get(uniqueKey)
            )!;
            if (bins.length > 0) {
                newFilter.customBins = bins;
            } else {
                delete (newFilter as Partial<ClinicalDataBinFilter>).customBins;
            }
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

    @action addCharts(visibleChartIds: string[]) {
        visibleChartIds.forEach(chartId => {
            if (!this._chartVisibility.has(chartId)) {
                this.newlyAddedCharts.push(chartId);
            }
        });
        this.updateChartsVisibility(visibleChartIds);
    }

    @action updateChartsVisibility(visibleChartIds: string[]) {
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

    @computed get clinicalDataFilters() {
        return Array.from(this._clinicalDataFilterSet.values());
    }

    @computed get customDataFilters() {
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

    @computed get genomicDataIntervalFilters() {
        return Array.from(this._genomicDataIntervalFilterSet.values());
    }

    @computed get genericAssayDataIntervalFilters() {
        return Array.from(this._genericAssayDataIntervalFilterSet.values());
    }

    @computed
    get filters(): StudyViewFilter {
        const filters: Partial<StudyViewFilter> = {};

        const clinicalDataFilters = this.clinicalDataFilters;

        const genomicDataIntervalFilters = this.genomicDataIntervalFilters;
        if (genomicDataIntervalFilters.length > 0) {
            filters.genomicDataFilters = genomicDataIntervalFilters;
        }

        const genericAssayDataIntervalFilters = this
            .genericAssayDataIntervalFilters;
        if (genericAssayDataIntervalFilters.length > 0) {
            filters.genericAssayDataFilters = genericAssayDataIntervalFilters;
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
        return filters as StudyViewFilter;
    }

    @computed
    get userSelections() {
        let sampleIdentifiersSet: {
            [id: string]: SampleIdentifier[];
        } = _.fromPairs(this._chartSampleIdentifiersFilterSet.toJSON());
        return { ...this.filters, sampleIdentifiersSet };
    }

    public getGeneFiltersByUniqueKey(uniqueKey: string) {
        return toJS(this._geneFilterSet.get(uniqueKey)) || [];
    }

    public getClinicalDataFiltersByUniqueKey(uniqueKey: string) {
        const filter = this._clinicalDataFilterSet.get(uniqueKey);
        return filter ? filter.values : [];
    }

    public getCustomDataFiltersByUniqueKey(uniqueKey: string) {
        const filter = this._customDataFilterSet.get(uniqueKey);
        return filter ? filter.values : [];
    }

    public getScatterPlotFiltersByUniqueKey(uniqueKey: string) {
        if (
            uniqueKey === SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
        ) {
            const xAxisFilter = this._clinicalDataFilterSet.get(
                SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
            );
            const yAxisFilter = this._clinicalDataFilterSet.get(
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT
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
        }
        return [];
    }

    public getGenomicDataIntervalFiltersByUniqueKey(uniqueKey: string) {
        return this._genomicDataIntervalFilterSet.has(uniqueKey)
            ? this._genomicDataIntervalFilterSet.get(uniqueKey)!.values
            : [];
    }

    public getGenericAssayDataIntervalFiltersByUniqueKey(uniqueKey: string) {
        return this._genericAssayDataIntervalFilterSet.has(uniqueKey)
            ? this._genericAssayDataIntervalFilterSet.get(uniqueKey)!.values
            : [];
    }

    @computed
    get unfilteredAttrsForNonNumerical() {
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
    get unfilteredCustomAttrsForNonNumerical() {
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
    get newlyAddedUnfilteredAttrsForNonNumerical() {
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
    get newlyAddedUnfilteredAttrsForNumerical() {
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
    get unfilteredAttrsForNumerical() {
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
        await: () => [
            this.studyViewFilterWithFilteredSampleIdentifiers,
            this.selectedSamples,
        ],
        invoke: () => {
            //only invoke if there are filtered samples
            if (
                this.hasFilteredSamples &&
                !_.isEmpty(this.unfilteredAttrsForNonNumerical)
            ) {
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    clinicalDataCountFilter: {
                        attributes: this.unfilteredAttrsForNonNumerical,
                        studyViewFilter: this
                            .studyViewFilterWithFilteredSampleIdentifiers
                            .result!,
                    } as ClinicalDataCountFilter,
                });
            }
            return Promise.resolve([]);
        },
        onError: error => {},
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
        await: () => [
            this.studyViewFilterWithFilteredSampleIdentifiers,
            this.selectedSamples,
        ],
        invoke: () => {
            //only invoke if there are filtered samples
            if (this.hasFilteredSamples) {
                return internalClient.fetchCustomDataCountsUsingPOST({
                    clinicalDataCountFilter: {
                        attributes: this.unfilteredCustomAttrsForNonNumerical,
                        studyViewFilter: this
                            .studyViewFilterWithFilteredSampleIdentifiers
                            .result!,
                    } as ClinicalDataCountFilter,
                });
            }
            return Promise.resolve([]);
        },
        onError: error => {},
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
        await: () => [
            this.studyViewFilterWithFilteredSampleIdentifiers,
            this.selectedSamples,
        ],
        invoke: () => {
            //only invoke if there are filtered samples
            if (
                this.hasFilteredSamples &&
                !_.isEmpty(this.newlyAddedUnfilteredAttrsForNonNumerical)
            ) {
                return internalClient.fetchClinicalDataCountsUsingPOST({
                    clinicalDataCountFilter: {
                        attributes: this
                            .newlyAddedUnfilteredAttrsForNonNumerical,
                        studyViewFilter: this
                            .studyViewFilterWithFilteredSampleIdentifiers
                            .result!,
                    } as ClinicalDataCountFilter,
                });
            }
            return Promise.resolve([]);
        },
        default: [],
        onError: error => {},
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
            if (this.hasSampleIdentifiersInFilter) {
                const clinicalDataBinCountData = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                    {
                        dataBinMethod: 'STATIC',
                        clinicalDataBinCountFilter: {
                            attributes: this
                                .newlyAddedUnfilteredAttrsForNumerical,
                            studyViewFilter: this.filters,
                        } as ClinicalDataBinCountFilter,
                    }
                );
                return Promise.resolve(
                    convertClinicalDataBinsToDataBins(clinicalDataBinCountData)
                );
            }
            return Promise.resolve([]);
        },
        default: [],
        onError: error => {},
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
            if (this.hasSampleIdentifiersInFilter) {
                const clinicalDataBinCountData = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                    {
                        dataBinMethod: 'STATIC',
                        clinicalDataBinCountFilter: {
                            attributes: this.unfilteredAttrsForNumerical,
                            studyViewFilter: this.filters,
                        } as ClinicalDataBinCountFilter,
                    }
                );
                return Promise.resolve(
                    convertClinicalDataBinsToDataBins(clinicalDataBinCountData)
                );
            }
            return Promise.resolve([]);
        },
        onError: error => {},
        default: [],
    });

    @action.bound
    hideChart(uniqueKey: string) {
        this.changeChartVisibility(uniqueKey, false);
    }

    public getClinicalDataCount(chartMeta: ChartMeta) {
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
                        this.selectedSamples,
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
                            // return empty if there are no sample identifiers or study ids in the filter
                            if (!this.hasFilteredSamples) {
                                return [];
                            }
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
                                    } as ClinicalDataCountFilter,
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

                    let res = getClinicalDataCountWithColorByClinicalDataCount(
                        counts
                    );
                    res.forEach(item => {
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
                                this.chartItemToColor.set(
                                    colorMapKey,
                                    item.color
                                );
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
                                    this.chartToUsedColors.get(attributeId) ||
                                        new Set()
                                );
                                this.chartItemToColor.set(
                                    colorMapKey,
                                    newColor
                                );
                                this.chartToUsedColors
                                    .get(attributeId)
                                    ?.add(newColor);
                                item.color = newColor;
                            }
                        } else {
                            item.color = this.chartItemToColor.get(
                                colorMapKey
                            )!;
                        }
                    });
                    return res;
                },
                onError: error => {},
                default: [],
            });
        }
        return this.clinicalDataCountPromises[uniqueKey];
    }

    public getCustomDataCount(chartMeta: ChartMeta) {
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

                    let res = getClinicalDataCountWithColorByClinicalDataCount(
                        counts
                    );
                    res.forEach(item => {
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
                                this.chartItemToColor.set(
                                    colorMapKey,
                                    item.color
                                );
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
                                    this.chartToUsedColors.get(attributeId) ||
                                        new Set()
                                );
                                this.chartItemToColor.set(
                                    colorMapKey,
                                    newColor
                                );
                                this.chartToUsedColors
                                    .get(attributeId)
                                    ?.add(newColor);
                                item.color = newColor;
                            }
                        } else {
                            item.color = this.chartItemToColor.get(
                                colorMapKey
                            )!;
                        }
                    });
                    return res;
                },
                onError: error => {},
                default: [],
            });
        }
        return this.customDataCountPromises[uniqueKey];
    }

    private generateColorMapKey(id: string, value: string) {
        return `${id}.${value}`;
    }

    public getClinicalDataBin(chartMeta: ChartMeta) {
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
                        !_.isEqual(toJS(attribute), initDataBinFilter);
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
                                    } as ClinicalDataBinCountFilter,
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
                onError: error => {},
                default: [],
            });
        }
        return this.clinicalDataBinPromises[uniqueKey];
    }

    public getGenomicChartDataBin(chartMeta: ChartMeta) {
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

    public getGenericAssayChartDataBin(chartMeta: ChartMeta) {
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
        onError: error => {},
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
                    if (everyStudyIdToStudy[next]) {
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
                        .catch(error => {
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

    @computed get isSingleNonVirtualStudyQueried() {
        return (
            this.filteredPhysicalStudies.isComplete &&
            this.filteredVirtualStudies.isComplete &&
            this.filteredPhysicalStudies.result.length === 1 &&
            this.filteredVirtualStudies.result.length === 0
        );
    }

    @computed get showOriginStudiesInSummaryDescription() {
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
                            .catch(error => {
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
        onError: error => {},
        onResult: unknownIds => {
            if (unknownIds.length > 0) {
                this.pageStatusMessages['unknownIds'] = {
                    status: 'danger',
                    message: `Unknown/Unauthorized ${
                        unknownIds.length > 1 ? 'studies' : 'study'
                    } ${unknownIds.join(', ')}`,
                };
            }
        },
        default: [],
    });

    readonly mutationProfiles = remoteData({
        await: () => [this.molecularProfiles],
        invoke: async () => {
            return Promise.resolve(
                this.getMolecularProfilesByAlterationType(
                    AlterationTypeConstants.MUTATION_EXTENDED
                )
            );
        },
        onError: error => {},
        default: [],
    });

    readonly structuralVariantProfiles = remoteData({
        await: () => [this.molecularProfiles],
        invoke: async () => {
            // TODO: currently only look for STRUCTURAL_VARIANT profiles with fusion datatype
            // until database is support querying structural variant data
            return Promise.resolve(
                this.getMolecularProfilesByAlterationType(
                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                    AlterationTypeConstants.FUSION
                )
            );
        },
        onError: error => {},
        default: [],
    });

    readonly cnaProfiles = remoteData({
        await: () => [this.molecularProfiles],
        invoke: async () => {
            return Promise.resolve(
                this.getMolecularProfilesByAlterationType(
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                    DataTypeConstants.DISCRETE
                )
            );
        },
        onError: error => {},
        default: [],
    });

    private getMolecularProfilesByAlterationType(
        alterationType: string,
        dataType?: string
    ) {
        let molecularProfiles: MolecularProfile[] = [];
        if (_.isEmpty(dataType)) {
            molecularProfiles = this.molecularProfiles.result.filter(
                profile => profile.molecularAlterationType === alterationType
            );
        } else {
            molecularProfiles = this.molecularProfiles.result.filter(
                profile =>
                    profile.molecularAlterationType === alterationType &&
                    profile.datatype === dataType
            );
        }

        return _.chain(molecularProfiles)
            .groupBy(molecularProfile => molecularProfile.studyId)
            .flatMap(profiles => profiles[0])
            .value();
    }

    readonly filteredGenePanelData = remoteData({
        await: () => [this.molecularProfiles, this.samples],
        invoke: async () => {
            const studyMolecularProfilesSet = _.groupBy(
                this.molecularProfiles.result,
                molecularProfile => molecularProfile.studyId
            );

            const sampleMolecularIdentifiers = _.flatMap(
                this.samples.result,
                sample => {
                    return studyMolecularProfilesSet[sample.studyId].map(
                        molecularProfile => {
                            return {
                                molecularProfileId:
                                    molecularProfile.molecularProfileId,
                                sampleId: sample.sampleId,
                            };
                        }
                    );
                }
            );

            const genePanelData = await defaultClient.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
                {
                    sampleMolecularIdentifiers: sampleMolecularIdentifiers,
                }
            );
            return genePanelData.filter(datum => datum.profiled);
        },
        default: [],
    });

    private getDefaultClinicalDataBinFilter(attribute: ClinicalAttribute) {
        return {
            attributeId: attribute.clinicalAttributeId,
            disableLogScale: false,
        } as ClinicalDataBinFilter;
    }

    readonly resourceDefinitions = remoteData({
        await: () => [this.queriedPhysicalStudies],
        invoke: () => {
            const promises = [];
            const ret: ResourceDefinition[] = [];
            for (const study of this.queriedPhysicalStudies.result) {
                promises.push(
                    defaultClient
                        .getAllResourceDefinitionsInStudyUsingGET({
                            studyId: study.studyId,
                        })
                        .then(data => {
                            ret.push(...data);
                        })
                );
            }
            return Promise.all(promises).then(() => ret);
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
                    defaultClient
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
        onError: error => {},
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
            onError: error => {},
            invoke: async () => {
                if (AppConfig.serverConfig.show_mdacc_heatmap) {
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
        onError: error => {},
        default: [],
    });

    readonly oncokbGenes = remoteData<CancerGene[]>({
        await: () => [this.oncokbCancerGenes],
        invoke: async () => {
            return this.oncokbCancerGenes.result.filter(
                cancerGene => cancerGene.oncokbAnnotated
            );
        },
        onError: error => {},
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

    readonly genericAssayEntitiesGroupByGenericAssayType = remoteData<{
        [genericAssayType: string]: GenericAssayMeta[];
    }>({
        await: () => [this.molecularProfiles],
        invoke: async () => {
            return await fetchGenericAssayMetaByMolecularProfileIdsGroupByGenericAssayType(
                this.molecularProfiles.result
            );
        },
    });

    readonly genericAssayStableIdToMeta = remoteData<{
        [genericAssayStableId: string]: GenericAssayMeta;
    }>({
        await: () => [this.genericAssayEntitiesGroupByGenericAssayType],
        invoke: () => {
            return Promise.resolve(
                _.chain(this.genericAssayEntitiesGroupByGenericAssayType.result)
                    .values()
                    .flatten()
                    .uniqBy(meta => meta.stableId)
                    .keyBy(meta => meta.stableId)
                    .value()
            );
        },
    });

    readonly genericAssayProfileOptionsByType = remoteData(
        {
            await: () => [
                this.molecularProfiles,
                this.sampleUniqueKeysByMolecularProfileIdSet,
            ],
            invoke: async () => {
                return Promise.resolve(
                    _.chain(this.molecularProfiles.result)
                        .filter(
                            profile =>
                                profile.molecularAlterationType ===
                                AlterationTypeConstants.GENERIC_ASSAY
                        )
                        .groupBy(profile => profile.genericAssayType)
                        .mapValues(profiles =>
                            getMolecularProfileOptions(
                                profiles,
                                this.sampleUniqueKeysByMolecularProfileIdSet
                                    .result
                            )
                        )
                        .value()
                );
            },
            default: {},
        },
        {}
    );

    @computed get oncokbCancerGeneFilterEnabled() {
        if (!AppConfig.serverConfig.show_oncokb) {
            return false;
        }
        return !this.oncokbCancerGenes.isError && !this.oncokbGenes.isError;
    }

    @computed get isSingleVirtualStudyPageWithoutFilter() {
        return (
            this.filteredPhysicalStudies.result.length +
                this.filteredVirtualStudies.result.length ===
                1 &&
            this.filteredVirtualStudies.result.length > 0 &&
            !this.chartsAreFiltered
        );
    }

    @computed get analysisGroupsPossible() {
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

    @computed get survivalPlotKeys() {
        if (this.survivalClinicalAttributesPrefix.result) {
            return this.survivalClinicalAttributesPrefix.result.map(
                prefix => `${prefix}_SURVIVAL`
            );
        } else {
            return [];
        }
    }

    @autobind
    isChartNameValid(chartName: string) {
        const match = _.find(
            this.chartMetaSet,
            chartMeta =>
                chartMeta.displayName.toUpperCase() === chartName.toUpperCase()
        );
        return match === undefined;
    }
    @autobind
    getDefaultCustomChartName() {
        return `${DEFAULT_CHART_NAME} ${this._customCharts.size -
            SPECIAL_CHARTS.length +
            1}`;
    }

    @action.bound
    async addCustomChart(
        newChart: CustomChart,
        loadedfromUserSettings: boolean = false
    ) {
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

        this._newlyCreatedcustomChartSet.set(uniqueKey, {
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
    addGeneSpecificCharts(
        newCharts: GenomicChart[],
        loadedfromUserSettings: boolean = false
    ) {
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
    ) {
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
                    patientAttribute: false,
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
    updateCustomSelect(newChart: CustomChart) {
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
        _chartMetaSet = _.merge(
            _chartMetaSet,
            _.fromPairs(this._geneSpecificCharts.toJSON()),
            _.fromPairs(this._genericAssayCharts.toJSON())
        );

        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(
            this.clinicalAttributes.result,
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

        if (this.displaySampleTreatments.result) {
            _chartMetaSet['SAMPLE_TREATMENTS'] = {
                uniqueKey: 'SAMPLE_TREATMENTS',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Sample Treatments',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatments and the corresponding number of samples acquired before treatment or after/on treatment',
            };
        }

        if (this.displayPatientTreatments.result) {
            _chartMetaSet['PATIENT_TREATMENTS'] = {
                uniqueKey: 'PATIENT_TREATMENTS',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: true,
                displayName: 'Patient Treatments',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.PATIENT_TREATMENTS_TABLE
                ),
                renderWhenDataChange: true,
                description:
                    'List of treatments and the corresponding number of patients treated',
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
                displayName: 'Fusion Genes',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.FUSION_GENES_TABLE
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

        const scatterRequiredParams = _.reduce(
            this.clinicalAttributes.result,
            (acc, next) => {
                if (
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT ===
                    next.clinicalAttributeId
                ) {
                    acc[SpecialChartsUniqueKeyEnum.MUTATION_COUNT] = true;
                }
                if (
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED ===
                    next.clinicalAttributeId
                ) {
                    acc[
                        SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                    ] = true;
                }
                return acc;
            },
            {
                [SpecialChartsUniqueKeyEnum.MUTATION_COUNT]: false,
                [SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED]: false,
            }
        );

        if (
            scatterRequiredParams[SpecialChartsUniqueKeyEnum.MUTATION_COUNT] &&
            scatterRequiredParams[
                SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
            ]
        ) {
            _chartMetaSet[
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
            ] = {
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                uniqueKey:
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION,
                displayName: 'Mutation Count vs Fraction of Genome Altered',
                priority: getDefaultPriorityByUniqueKey(
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
                ),
                renderWhenDataChange: false,
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
    get showSettingRestoreMsg() {
        return (
            this.isSavingUserPreferencePossible &&
            !this.hideRestoreSettingsMsg &&
            this.fetchUserSettings.isComplete &&
            !_.isEqual(
                this.previousSettings,
                _.keyBy(
                    this.fetchUserSettings.result,
                    chartUserSetting => chartUserSetting.id
                )
            )
        );
    }

    @computed
    get isSavingUserSettingsPossible() {
        return (
            this.isSavingUserPreferencePossible &&
            this.fetchUserSettings.isComplete &&
            (!this.showSettingRestoreMsg ||
                !_.isEqual(
                    this.currentChartSettingsMap,
                    _.keyBy(
                        this.fetchUserSettings.result,
                        chartSetting => chartSetting.id
                    )
                ))
        );
    }

    private isInitiallLoad = true;

    @computed
    get loadingInitialDataForSummaryTab() {
        let pending =
            this.defaultVisibleAttributes.isPending ||
            this.clinicalAttributes.isPending ||
            this.mutationProfiles.isPending ||
            this.cnaProfiles.isPending ||
            this.structuralVariantProfiles.isPending ||
            this.survivalClinicalAttributesPrefix.isPending ||
            this.displayPatientTreatments.isPending ||
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
            pending = pending || this.fetchUserSettings.isPending;
            pending = pending || this.userSavedCustomData.isPending;
        }
        if (!_.isEmpty(this.initialFilters.genomicDataFilters)) {
            pending = pending || this.molecularProfileOptions.isPending;
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

    public updateUserSettingsDebounce = _.debounce(() => {
        if (!_.isEqual(this.previousSettings, this.currentChartSettingsMap)) {
            this.previousSettings = this.currentChartSettingsMap;
            if (!_.isEmpty(this.currentChartSettingsMap)) {
                sessionServiceClient.updateUserSettings({
                    origin: toJS(this.studyIds),
                    chartSettings: _.values(this.currentChartSettingsMap),
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
                _.fromPairs(this._clinicalDataBinFilterSet.toJSON()),
                this._filterMutatedGenesTableByCancerGenes,
                this._filterFusionGenesTableByCancerGenes,
                this._filterCNAGenesTableByCancerGenes,
                this.currentGridLayout
            );
        }
        return chartSettingsMap;
    }

    readonly fetchUserSettings = remoteData<ChartUserSetting[]>({
        invoke: async () => {
            if (
                this.isSavingUserPreferencePossible &&
                this.studyIds.length > 0
            ) {
                let userSettings = await sessionServiceClient.fetchUserSettings(
                    toJS(this.studyIds)
                );
                if (userSettings) {
                    return updateSavedUserPreferenceChartIds(
                        userSettings.chartSettings
                    );
                }
            }
            return [];
        },
        default: [],
        onError: () => {
            // fail silently when an error occurs
        },
    });

    @action.bound
    private clearPageSettings() {
        // Only remove visibility of unfiltered chart. This is to fix https://github.com/cBioPortal/cbioportal/issues/8057#issuecomment-747062244
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
        this._filterFusionGenesTableByCancerGenes = true;
        this._filterCNAGenesTableByCancerGenes = true;
        this._clinicalDataBinFilterSet = observable.map(
            toJS(this._defaultClinicalDataBinFilterSet)
        );
    }

    @action.bound
    loadUserSettings() {
        if (
            this.isSavingUserPreferencePossible &&
            !_.isEmpty(this.fetchUserSettings.result)
        ) {
            this.loadSettings(this.fetchUserSettings.result);
            // set previousSettings only if user is already logged in
            if (this._loadUserSettingsInitially) {
                this.previousSettings = _.keyBy(
                    this.fetchUserSettings.result,
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
    ) {
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
    public undoUserSettings() {
        this.loadSettings(_.values(this.previousSettings));
        this.previousSettings = {};
    }

    // had to create default variables for eachsince the default chart settings
    // depends on the number of columns (browser width)
    @observable private _defualtChartsDimension = observable.map<
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
        ClinicalDataBinFilter
    >();

    @action.bound
    public resetToDefaultSettings() {
        this.clearPageSettings();
        this.loadSettings(_.values(this.defaultChartSettingsMap));
    }

    @computed get showResetToDefaultButton() {
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
            _.fromPairs(this._defualtChartsDimension.toJSON()),
            _.fromPairs(this._defaultChartsType.toJSON()),
            {},
            {},
            _.fromPairs(this._defaultClinicalDataBinFilterSet.toJSON())
        );
    }

    @action.bound
    private loadSettings(chartSettngs: ChartUserSetting[]) {
        this.clearPageSettings();
        _.map(chartSettngs, chartUserSettings => {
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
                        },
                    ],
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
                case ChartTypeEnum.FUSION_GENES_TABLE:
                    this._filterFusionGenesTableByCancerGenes =
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
                    }
                    break;
                default:
                    break;
            }
            this.changeChartVisibility(chartUserSettings.id, true);
            chartUserSettings.chartType &&
                this.chartsType.set(
                    chartUserSettings.id,
                    chartUserSettings.chartType
                );
        });
        this.useCurrentGridLayout = true;
    }

    @action.bound
    updateChartStats() {
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

        if (this.displayPatientTreatments.result) {
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
            const fusionGeneMeta = _.find(
                this.chartMetaSet,
                chartMeta => chartMeta.uniqueKey === uniqueKey
            );
            if (fusionGeneMeta && fusionGeneMeta.priority !== 0) {
                this.changeChartVisibility(fusionGeneMeta.uniqueKey, true);
            }
            this.chartsType.set(uniqueKey, ChartTypeEnum.FUSION_GENES_TABLE);
            this.chartsDimension.set(
                uniqueKey,
                STUDY_VIEW_CONFIG.layout.dimensions[
                    ChartTypeEnum.FUSION_GENES_TABLE
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
        this._defualtChartsDimension = observable.map(
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
    initializeChartStatsByClinicalAttributes() {
        let mutationCountFlag = false;
        let fractionGenomeAlteredFlag = false;

        this.clinicalAttributes.result.forEach((obj: ClinicalAttribute) => {
            const uniqueKey = getUniqueKey(obj);
            if (obj.priority !== '0') {
                if (
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT ===
                    obj.clinicalAttributeId
                ) {
                    mutationCountFlag = true;
                } else if (
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED ===
                    obj.clinicalAttributeId
                ) {
                    fractionGenomeAlteredFlag = true;
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
            if (this.chartMetaSet[key].priority !== 0) {
                this.changeChartVisibility(key, true);
            }
        });

        this.chartsType.set(
            SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION,
            ChartTypeEnum.SCATTER
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION,
            STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SCATTER]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.SAMPLE_TREATMENTS,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
            ]
        );
        this.chartsDimension.set(
            SpecialChartsUniqueKeyEnum.PATIENT_TREATMENTS,
            STUDY_VIEW_CONFIG.layout.dimensions[
                ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
            ]
        );
        if (
            mutationCountFlag &&
            fractionGenomeAlteredFlag &&
            getDefaultPriorityByUniqueKey(
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
            ) !== 0
        ) {
            this.changeChartVisibility(
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION,
                true
            );
        }

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
    changeChartType(attr: ChartMeta, newChartType: ChartType) {
        let data: MobxPromise<ClinicalDataCountSummary[]> | undefined;
        if (newChartType === ChartTypeEnum.TABLE) {
            if (attr.uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
                data = this.cancerStudiesData;
            } else if (this.isUserDefinedCustomDataChart(attr.uniqueKey)) {
                data = this.getCustomDataCount(attr);
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
        onError: error => {},
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
                } as ClinicalDataCountFilter,
            });
        },
        onError: error => {},
        default: [],
    });

    readonly initialVisibleAttributesClinicalDataBinAttributes = remoteData<
        ClinicalDataBinFilter[]
    >({
        await: () => [this.defaultVisibleAttributes],
        invoke: async () => {
            return _.chain(this.defaultVisibleAttributes.result)
                .filter(attr => attr.datatype === DataType.NUMBER)
                .map(this.getDefaultClinicalDataBinFilter)
                .uniqBy(attr => attr.attributeId)
                .value();
        },
        onError: error => {},
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
                    } as ClinicalDataBinCountFilter,
                }
            );
            return Promise.resolve(
                convertClinicalDataBinsToDataBins(clinicalDataBinCountData)
            );
        },
        onError: error => {},
        default: [],
    });

    @action
    initializeClinicalDataCountCharts() {
        _.each(
            this.initialVisibleAttributesClinicalDataCountData.result,
            item => {
                this.showAsPieChart(item.attributeId, item.counts.length);
            }
        );
    }

    @action
    initializeGeneSpecificCharts() {
        if (!_.isEmpty(this.initialFilters.genomicDataFilters)) {
            const molecularProfileOptionByTypeMap = _.keyBy(
                this.molecularProfileOptions.result,
                molecularProfileOption => molecularProfileOption.value
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
                                    description:
                                        molecularProfileOption.description,
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
    initializeGenericAssayCharts() {
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

                                // TODO: (GA) Add other datatype by using another function
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
                                            },
                                        ],
                                        true
                                    );
                                }
                            }
                        }
                    );
                }
            );
        }
    }

    @action
    initializeClinicalDataBinCountCharts() {
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
    get chartsAreFiltered() {
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
        onError: error => {},
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
        onError: error => {},
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
        onError: error => {},
        default: [],
    });

    private readonly sampleIdentifiersFromGenomicProfileFilter = remoteData({
        await: () => [this.samples, this.initialMolecularProfileSampleCounts],
        invoke: async () => {
            const molecularProfileSampleCountSet = _.keyBy(
                this.initialMolecularProfileSampleCounts.result,
                molecularProfileSampleCount => molecularProfileSampleCount.value
            );
            const filteredSamplesLists = _.map(
                this.genomicProfilesFilter,
                profiles =>
                    _.flatMap(profiles, profile =>
                        molecularProfileSampleCountSet[profile]
                            ? molecularProfileSampleCountSet[profile]
                                  .sampleUniqueKeys
                            : []
                    )
            );

            const sampleSetByKey = this.sampleSetByKey.result || {};
            const filteredSampleKeys: string[] = _.intersection(
                ...filteredSamplesLists
            );
            return _.reduce(
                filteredSampleKeys,
                (acc, next) => {
                    const sample = sampleSetByKey[next];
                    if (sample) {
                        acc.push({
                            sampleId: sample.sampleId,
                            studyId: sample.studyId,
                        });
                    }
                    return acc;
                },
                [] as SampleIdentifier[]
            );
        },
        default: [],
    });
    @observable blockLoading = false;

    readonly selectedSamples = remoteData<Sample[]>({
        await: () => [
            this.samples,
            this.sampleIdentifiersFromGenomicProfileFilter,
        ],
        invoke: () => {
            //fetch samples when there are only filters applied
            if (this.chartsAreFiltered) {
                if (!this.hasSampleIdentifiersInFilter) {
                    return Promise.resolve([] as Sample[]);
                }
                const studyViewFilter = _.clone(this.filters);
                // if genomicProfilesFilter is present there replace it with equivalent sample identifiers
                // we do this to save lot of processing time and resources on the backend
                if (!_.isEmpty(this.genomicProfilesFilter)) {
                    const sampleIdentifiersFromGenomicProfileFilter = this
                        .sampleIdentifiersFromGenomicProfileFilter.result;
                    // if there are already sample identifiers in the filter the find intersection
                    if (!_.isEmpty(studyViewFilter.sampleIdentifiers)) {
                        const sampleIdentifiers = _.intersectionWith(
                            studyViewFilter.sampleIdentifiers,
                            sampleIdentifiersFromGenomicProfileFilter,
                            ((a: SampleIdentifier, b: SampleIdentifier) => {
                                return (
                                    a.sampleId === b.sampleId &&
                                    a.studyId === b.studyId
                                );
                            }) as any
                        );
                        studyViewFilter.sampleIdentifiers = sampleIdentifiers;
                    } else {
                        studyViewFilter.sampleIdentifiers = sampleIdentifiersFromGenomicProfileFilter;
                        // only one of [studyIds, sampleIdentifiers] should present in studyViewFilter.
                        // sending both would throw error.
                        delete (studyViewFilter as Partial<StudyViewFilter>)
                            .studyIds;
                    }
                    delete (studyViewFilter as Partial<StudyViewFilter>)
                        .genomicProfiles;
                }

                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter,
                });
            } else {
                return Promise.resolve(this.samples.result);
            }
        },
        onError: error => {},
        default: [],
        onResult: samples => {
            if (samples.length === 0) {
                this.blockLoading = true;
            } else {
                this.blockLoading = false;
            }
        },
    });

    readonly studyViewFilterWithFilteredSampleIdentifiers = remoteData<
        StudyViewFilter
    >({
        await: () => [this.selectedSamples],
        invoke: () => {
            const sampleIdentifiers = this.selectedSamples.result.map(
                sample => {
                    return {
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                    } as SampleIdentifier;
                }
            );
            return Promise.resolve({ sampleIdentifiers } as any);
        },
        onError: error => {},
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
    get selectedSamplesMap() {
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
        onError: error => {},
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
        onError: error => {},
        default: [],
    });

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
                      this.studyViewFilterWithFilteredSampleIdentifiers,
                  ]
                : [
                      this.mutationProfiles,
                      this.studyViewFilterWithFilteredSampleIdentifiers,
                  ],
        invoke: async () => {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                let mutatedGenes = await internalClient.fetchMutatedGenesUsingPOST(
                    {
                        studyViewFilter: this
                            .studyViewFilterWithFilteredSampleIdentifiers
                            .result!,
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
        onError: error => {},
        default: [],
    });

    readonly fusionGeneTableRowData = remoteData<MultiSelectionTableRow[]>({
        await: () =>
            this.oncokbCancerGeneFilterEnabled
                ? [
                      this.structuralVariantProfiles,
                      this.oncokbAnnotatedGeneEntrezGeneIds,
                      this.oncokbOncogeneEntrezGeneIds,
                      this.oncokbTumorSuppressorGeneEntrezGeneIds,
                      this.oncokbCancerGeneEntrezGeneIds,
                      this.studyViewFilterWithFilteredSampleIdentifiers,
                  ]
                : [
                      this.mutationProfiles,
                      this.studyViewFilterWithFilteredSampleIdentifiers,
                  ],
        invoke: async () => {
            if (!_.isEmpty(this.structuralVariantProfiles.result)) {
                const fusionGenes = await internalClient.fetchFusionGenesUsingPOST(
                    {
                        studyViewFilter: this
                            .studyViewFilterWithFilteredSampleIdentifiers
                            .result!,
                    }
                );
                return fusionGenes.map(item => {
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
        onError: error => {},
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
                      this.studyViewFilterWithFilteredSampleIdentifiers,
                  ]
                : [
                      this.mutationProfiles,
                      this.studyViewFilterWithFilteredSampleIdentifiers,
                  ],
        invoke: async () => {
            if (!_.isEmpty(this.cnaProfiles.result)) {
                let cnaGenes = await internalClient.fetchCNAGenesUsingPOST({
                    studyViewFilter: this
                        .studyViewFilterWithFilteredSampleIdentifiers.result!,
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
        onError: error => {},
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

    readonly survivalPlots = remoteData<SurvivalType[]>({
        await: () => [
            this.survivalClinicalAttributesPrefix,
            this.clinicalAttributeIdToClinicalAttribute,
            this.survivalDescriptions,
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
                        survivalData: [],
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
    ) {
        const isCustomChart = this.isUserDefinedCustomDataChart(
            chartMeta.uniqueKey
        );
        if (dataType && dataType === 'summary') {
            if (isCustomChart) {
                return this.getClinicalDataCountSummary(
                    chartMeta,
                    this.getCustomDataCount(chartMeta).result!
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
    ) {
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

    public async getChartDownloadableData(chartMeta: ChartMeta) {
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

    @computed get molecularProfileMapByType() {
        return _.groupBy(this.molecularProfiles.result, molecularProfile =>
            getSuffixOfMolecularProfile(molecularProfile)
        );
    }

    public getCustomChartDownloadData(chartMeta: ChartMeta) {
        return new Promise<string>(resolve => {
            if (
                chartMeta &&
                chartMeta.uniqueKey &&
                this._customChartsSelectedCases.has(chartMeta.uniqueKey)
            ) {
                let isPatientChart = true;
                let header = ['Study ID', 'Patient ID'];

                if (!chartMeta.patientAttribute) {
                    isPatientChart = false;
                    header.push('Sample ID');
                }
                header.push(chartMeta.displayName);
                let data = [header.join('\t')];
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
                        this.selectedSamples.result!.map((sample: Sample) => {
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
                                record === undefined ? 'NA' : record.value,
                            ].join('\t');
                        })
                    );
                }
                resolve(data.join('\n'));
            } else {
                resolve('');
            }
        });
    }

    public getScatterDownloadData() {
        return new Promise<string>(resolve => {
            onMobxPromise(this.mutationCountVsFGAData, data => {
                if (data) {
                    resolve(
                        generateScatterPlotDownloadData(
                            data,
                            this.sampleToAnalysisGroup.result,
                            undefined,
                            this.analysisGroupsSettings
                                .groups as AnalysisGroup[]
                        )
                    );
                } else {
                    resolve('');
                }
            });
        });
    }

    public getSurvivalDownloadData(chartMeta: ChartMeta) {
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

                        _.each(uniqueClinicalAttributeIds, id => {
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

    public async getMutatedGenesDownloadData() {
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

    public getFusionGenesDownloadData() {
        if (this.fusionGeneTableRowData.result) {
            const header = [
                'Gene',
                '# Fusion',
                '#',
                'Profiled Samples',
                'Freq',
            ];
            if (this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            const data = [header.join('\t')];
            _.each(
                this.fusionGeneTableRowData.result,
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

    public async getGenesCNADownloadData() {
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

    readonly survivalPlotData = remoteData<SurvivalType[]>({
        await: () => [
            this.survivalData,
            this.selectedPatientKeys,
            this.survivalPlots,
        ],
        invoke: async () => {
            return this.survivalPlots.result.map(obj => {
                obj.survivalData = getPatientSurvivals(
                    this.survivalData.result,
                    this.selectedPatientKeys.result!,
                    obj.associatedAttrs[0],
                    obj.associatedAttrs[1],
                    obj.filter
                );
                return obj;
            });
        },
        onError: error => {},
        default: [],
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
        onError: error => {},
        default: {},
    });

    readonly mutationCountVsCNADensityData = remoteData<{
        bins: DensityPlotBin[];
        xBinSize: number;
        yBinSize: number;
    }>({
        await: () => [
            this.clinicalAttributes,
            this.studyViewFilterWithFilteredSampleIdentifiers,
        ],
        invoke: async () => {
            if (
                !!this.clinicalAttributes.result!.find(
                    a =>
                        a.clinicalAttributeId ===
                        SpecialChartsUniqueKeyEnum.MUTATION_COUNT
                ) &&
                !!this.clinicalAttributes.result!.find(
                    a =>
                        a.clinicalAttributeId ===
                        SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                ) &&
                this.studyViewFilterWithFilteredSampleIdentifiers.result!
                    .sampleIdentifiers.length > 0
            ) {
                const yAxisBinCount = MutationCountVsCnaYBinsMin;
                const xAxisBinCount = 50;
                const bins = (
                    await internalClient.fetchClinicalDataDensityPlotUsingPOST({
                        xAxisAttributeId:
                            SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
                        yAxisAttributeId:
                            SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                        xAxisStart: 0,
                        xAxisEnd: 1, // FGA always goes 0 to 1
                        yAxisStart: 0, // mutation always starts at 0
                        xAxisBinCount,
                        yAxisBinCount,
                        studyViewFilter: this
                            .studyViewFilterWithFilteredSampleIdentifiers
                            .result!,
                    })
                ).filter(bin => bin.count > 0); // only show points for bins with stuff in them
                const xBinSize = 1 / xAxisBinCount;
                const yBinSize =
                    Math.max(...bins.map(bin => bin.binY)) /
                    (yAxisBinCount - 1);
                return {
                    bins,
                    xBinSize,
                    yBinSize,
                };
            } else {
                return {
                    bins: [],
                    xBinSize: -1,
                    yBinSize: -1,
                };
            }
        },
        onError: error => {},
        default: {
            bins: [],
            xBinSize: -1,
            yBinSize: -1,
        },
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
        onError: error => {},
        default: [],
    });

    readonly mutationCountVsFGAData = remoteData({
        await: () => [this.sampleMutationCountAndFractionGenomeAlteredData],
        onError: error => {},
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
        await: () => [this.clinicalAttributes, this.selectedSamples],
        onError: error => {},
        invoke: async () => {
            if (this.selectedSamples.result.length === 0) {
                return Promise.resolve([]);
            }
            let sampleClinicalDataMap: {
                [attributeId: string]: { [attributeId: string]: string };
            } = await getClinicalDataBySamples(this.selectedSamples.result);
            return _.reduce(
                this.selectedSamples.result,
                (acc, next) => {
                    let sampleData: { [attributeId: string]: string } = {
                        studyId: next.studyId,
                        patientId: next.patientId,
                        sampleId: next.sampleId,
                        ...(sampleClinicalDataMap[next.uniqueSampleKey] || {}),
                    };

                    acc.push(sampleData);
                    return acc;
                },
                [] as { [id: string]: string }[]
            );
        },
        default: [],
    });

    readonly sampleUniqueKeysByMolecularProfileIdSet = remoteData<{
        [id: string]: string[];
    }>({
        await: () => [this.selectedSamples, this.filteredGenePanelData],
        invoke: async () => {
            return getMolecularProfileSamplesSet(
                this.selectedSamples.result,
                this.filteredGenePanelData.result
            );
        },
        default: {},
    });

    readonly molecularProfileOptions = remoteData({
        await: () => [
            this.molecularProfiles,
            this.sampleUniqueKeysByMolecularProfileIdSet,
        ],
        invoke: async () => {
            return Promise.resolve(
                getMolecularProfileOptions(
                    this.molecularProfiles.result,
                    this.sampleUniqueKeysByMolecularProfileIdSet.result,
                    (molecularProfile: MolecularProfile) => {
                        return (
                            [
                                AlterationTypeConstants.MRNA_EXPRESSION,
                                AlterationTypeConstants.PROTEIN_LEVEL,
                                AlterationTypeConstants.METHYLATION,
                            ].includes(
                                molecularProfile.molecularAlterationType
                            ) ||
                            (molecularProfile.molecularAlterationType ===
                                AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                                molecularProfile.datatype ===
                                    DataTypeConstants.CONTINUOUS)
                        );
                    }
                )
            );
        },
        default: [],
    });

    readonly molecularProfileSampleCounts = remoteData<
        MultiSelectionTableRow[]
    >({
        await: () => [
            this.molecularProfiles,
            this.sampleUniqueKeysByMolecularProfileIdSet,
        ],
        invoke: async () => {
            const molecularProfileOptions: GenomicDataCountWithSampleUniqueKeys[] = getMolecularProfileOptions(
                this.molecularProfiles.result,
                this.sampleUniqueKeysByMolecularProfileIdSet.result!
            );

            return molecularProfileOptions.map(molecularProfileOption => {
                return {
                    uniqueKey: molecularProfileOption.value,
                    label: molecularProfileOption.label,
                    numberOfAlteredCases: molecularProfileOption.count,
                    numberOfProfiledCases: this.selectedSamples.result.length,
                } as any;
            });
        },
    });

    readonly caseListSampleCounts = remoteData<MultiSelectionTableRow[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            // return empty if there are no filtered samples
            if (!this.hasFilteredSamples) {
                return [];
            }
            const counts = await internalClient.fetchCaseListCountsUsingPOST({
                studyViewFilter: this.filters,
            });

            return counts.map(caseListOption => {
                return {
                    uniqueKey: caseListOption.value,
                    label: caseListOption.label,
                    numberOfAlteredCases: caseListOption.count,
                    numberOfProfiledCases: this.selectedSamples.result.length,
                } as any;
            });
        },
    });

    readonly molecularProfileSampleCountSet = remoteData({
        await: () => [this.molecularProfileSampleCounts],
        onError: error => {},
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
    });

    readonly initialMolecularProfileSampleCounts = remoteData({
        await: () => [
            this.samples,
            this.molecularProfiles,
            this.filteredGenePanelData,
        ],
        invoke: async () => {
            return getMolecularProfileOptions(
                this.molecularProfiles.result,
                getMolecularProfileSamplesSet(
                    this.samples.result,
                    this.filteredGenePanelData.result
                )
            );
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
        onError: error => {},
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
            return defaultClient.getClinicalAttributeCountsUsingPOST({
                clinicalAttributeCountFilter,
            });
        },
    });

    readonly dataWithCount = remoteData<ChartDataCountSet>({
        await: () => [
            this.molecularProfileSampleCounts,
            this.clinicalAttributeIdToClinicalAttribute,
            this.clinicalAttributesCounts,
            this.mutationCountVsFractionGenomeAlteredDataSet,
            this.molecularProfileOptions,
            this.sampleTreatments,
            this.patientTreatments,
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

                _.each(this.survivalPlotData.result, survivalPlot => {
                    if (survivalPlot.id in this.chartMetaSet) {
                        ret[survivalPlot.id] = survivalPlot.survivalData.length;
                    }
                });

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
                    .sampleUniqueKeysByMolecularProfileIdSet.result!;
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
                            (
                                molecularProfileSamplesSet[
                                    profile.molecularProfileId
                                ] || []
                            ).length
                    );
                }

                if (!_.isEmpty(this.sampleTreatments.result)) {
                    ret['SAMPLE_TREATMENTS'] = 1;
                }
                if (!_.isEmpty(this.patientTreatments.result)) {
                    ret['PATIENT_TREATMENTS'] = 1;
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
                            (
                                molecularProfileSamplesSet[
                                    profile.molecularProfileId
                                ] || []
                            ).length
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
                            (
                                molecularProfileSamplesSet[
                                    profile.molecularProfileId
                                ] || []
                            ).length
                    );
                }

                if (
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION in
                    this.chartMetaSet
                ) {
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
                    ret[
                        SpecialChartsUniqueKeyEnum.MUTATION_COUNT_CNA_FRACTION
                    ] = filteredData.length;
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
                    const molecularProfileOptionsCountSet = _.chain(
                        this.molecularProfileOptions.result!
                    )
                        .keyBy(datum => datum.value)
                        .mapValues(datum => datum.count)
                        .value();
                    _.reduce(
                        Array.from(this._geneSpecificChartMap.keys()),
                        (acc, uniqueChartKey) => {
                            const genomicChart = this._geneSpecificChartMap.get(
                                uniqueChartKey
                            )!;
                            acc[uniqueChartKey] =
                                molecularProfileOptionsCountSet[
                                    genomicChart.profileType
                                ] || 0;
                            return acc;
                        },
                        ret
                    );
                }

                // Add counts generic assay data charts
                if (this._genericAssayChartMap.size > 0) {
                    const molecularProfileOptionsCountSet = _.chain(
                        this.genericAssayProfileOptionsByType.result!
                    )
                        .flatMap()
                        .keyBy(datum => datum.value)
                        .mapValues(datum => datum.count)
                        .value();
                    _.reduce(
                        Array.from(this._genericAssayChartMap.keys()),
                        (acc, uniqueChartKey) => {
                            const genericAssayChart = this._genericAssayChartMap.get(
                                uniqueChartKey
                            )!;
                            acc[uniqueChartKey] =
                                molecularProfileOptionsCountSet[
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
        onError: error => {},
        default: {},
    });

    @computed
    public get clinicalDataDownloadFilename() {
        return `${this.downloadFilenamePrefix}clinical_data.tsv`;
    }

    @computed
    public get downloadFilenamePrefix() {
        return generateDownloadFilenamePrefixByStudies(
            this.displayedStudies.result
        );
    }

    @autobind
    public async getDownloadDataPromise() {
        let sampleClinicalDataMap = await getClinicalDataBySamples(
            this.selectedSamples.result
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
    onSubmitQuery() {
        const unknownQueriedIdsMap = stringListToSet(
            this.unknownQueriedIds.result
        );
        let formOps: { [id: string]: string } = {
            cancer_study_list: this.studyIds
                .filter(studyId => !unknownQueriedIdsMap[studyId])
                .join(','),
            tab_index: 'tab_visualize',
        };

        if (
            this.filteredVirtualStudies.result.length === 0 &&
            this.studyIds.length === 1
        ) {
            if (
                this.alterationTypesInOQL.haveMutInQuery &&
                this.defaultMutationProfile
            ) {
                formOps[
                    'genetic_profile_ids_PROFILE_MUTATION_EXTENDED'
                ] = this.defaultMutationProfile.molecularProfileId;
            }
            if (
                this.alterationTypesInOQL.haveCnaInQuery &&
                this.defaultCnaProfile
            ) {
                formOps[
                    'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION'
                ] = this.defaultCnaProfile.molecularProfileId;
            }
            if (
                this.alterationTypesInOQL.haveMrnaInQuery &&
                this.defaultMrnaProfile
            ) {
                formOps[
                    'genetic_profile_ids_PROFILE_MRNA_EXPRESSION'
                ] = this.defaultMrnaProfile.molecularProfileId;
            }
            if (
                this.alterationTypesInOQL.haveProtInQuery &&
                this.defaultProtProfile
            ) {
                formOps[
                    'genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION'
                ] = this.defaultProtProfile.molecularProfileId;
            }
        } else {
            let data_priority = '0';
            let { mutation, cna } = {
                mutation: !_.isEmpty(this.mutationProfiles.result),
                cna: !_.isEmpty(this.cnaProfiles),
            };
            if (mutation && cna) data_priority = '0';
            else if (mutation) data_priority = '1';
            else if (cna) data_priority = '2';
            formOps.data_priority = data_priority;
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
            return getClinicalDataCountWithColorByClinicalDataCount(
                _.values(
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
                )
            );
        },
        onError: error => {},
        default: [],
    });

    @action
    showAsPieChart(uniqueKey: string, dataSize: number) {
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
        onError: error => Promise.resolve([]),
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

    // For mutated genes, cna genes and fusion gene charts we show number of profiled samples
    // in the chart title. These numbers are fetched from molecularProfileSampleCountSet
    public getChartTitle(chartType: ChartTypeEnum, title?: string) {
        let count = 0;
        if (this.molecularProfileSampleCountSet.result !== undefined) {
            switch (chartType) {
                case ChartTypeEnum.MUTATED_GENES_TABLE: {
                    count = this.molecularProfileSampleCountSet.result[
                        'mutations'
                    ]
                        ? this.molecularProfileSampleCountSet.result[
                              'mutations'
                          ]
                        : 0;
                    break;
                }
                case ChartTypeEnum.FUSION_GENES_TABLE: {
                    count = this.molecularProfileSampleCountSet.result['fusion']
                        ? this.molecularProfileSampleCountSet.result['fusion']
                        : 0;
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

    @action
    public clearPatientTreatmentFilters() {
        this._patientTreatmentsFilter = { filters: [] };
    }

    @action
    public setPatientTreatmentFilters(filters: AndedPatientTreatmentFilters) {
        this._patientTreatmentsFilter = filters;
    }

    @action
    public addPatientTreatmentFilters(filters: OredPatientTreatmentFilters[]) {
        this._patientTreatmentsFilter.filters = this._patientTreatmentsFilter.filters.concat(
            filters
        );
    }

    @action
    public clearSampleTreatmentFilters() {
        this._sampleTreatmentsFilters = { filters: [] };
    }

    @action
    public setSampleTreatmentFilters(filters: AndedSampleTreatmentFilters) {
        this._sampleTreatmentsFilters = filters;
    }

    @action
    public addSampleTreatmentFilters(filters: OredSampleTreatmentFilters[]) {
        this._sampleTreatmentsFilters.filters = this._sampleTreatmentsFilters.filters.concat(
            filters
        );
    }

    @action
    public setTreatmentFilters(filters: Partial<StudyViewFilter>) {
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
    }

    // a row represents a list of patients that either have or have not recieved
    // a specific treatment
    public readonly sampleTreatments = remoteData({
        await: () => [
            this.studyViewFilterWithFilteredSampleIdentifiers,
            this.selectedSamples,
        ],
        invoke: () => {
            if (this.hasFilteredSamples) {
                return defaultClient.getAllSampleTreatmentsUsingPOST({
                    studyViewFilter: this
                        .studyViewFilterWithFilteredSampleIdentifiers.result!,
                });
            }
            return Promise.resolve([]);
        },
    });

    public readonly displayPatientTreatments = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: () => {
            return defaultClient.getContainsTreatmentDataUsingPOST({
                studyIds: toJS(this.queriedPhysicalStudyIds.result),
            });
        },
    });

    public readonly displaySampleTreatments = remoteData({
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
        await: () => [
            this.studyViewFilterWithFilteredSampleIdentifiers,
            this.selectedSamples,
        ],
        invoke: () => {
            if (this.hasFilteredSamples) {
                return defaultClient.getAllPatientTreatmentsUsingPOST({
                    studyViewFilter: this
                        .studyViewFilterWithFilteredSampleIdentifiers.result!,
                });
            }
            return Promise.resolve([]);
        },
    });

    @action.bound
    public onSampleTreatmentSelection(meta: ChartMeta, values: string[][]) {
        const filters = values.map(outerFilter => {
            return {
                filters: outerFilter.map(innerFilter => {
                    return toSampleTreatmentFilter(innerFilter);
                }),
            };
        });

        this.addSampleTreatmentFilters(filters);
    }

    @action.bound
    public onPatientTreatmentSelection(meta: ChartMeta, values: string[][]) {
        const filters = values.map(outerFilter => {
            return {
                filters: outerFilter.map(innerFilter => {
                    return toPatientTreatmentFilter(innerFilter);
                }),
            };
        });

        this.addPatientTreatmentFilters(filters);
    }

    @action.bound
    public removeSampleTreatmentsFilter(andedIndex: number, oredIndex: number) {
        const updatedFilters = this.sampleTreatmentFilters.filters
            .map((oFil, oInd) => {
                return {
                    filters: oFil.filters.filter((unused, iInd) => {
                        return !(andedIndex === oInd && oredIndex === iInd);
                    }),
                };
            })
            .filter(outerFilter => outerFilter.filters.length > 0);

        this.setSampleTreatmentFilters({ filters: updatedFilters });
    }

    @action.bound
    public removePatientTreatmentsFilter(
        andedIndex: number,
        oredIndex: number
    ) {
        const updatedFilters = this.patientTreatmentFilters.filters
            .map((oFil, oInd) => {
                return {
                    filters: oFil.filters.filter((unused, iInd) => {
                        return !(andedIndex === oInd && oredIndex === iInd);
                    }),
                };
            })
            .filter(outerFilter => outerFilter.filters.length > 0);

        this.setPatientTreatmentFilters({ filters: updatedFilters });
    }
}
