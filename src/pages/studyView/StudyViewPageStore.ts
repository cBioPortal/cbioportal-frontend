import * as _ from 'lodash';
import AppConfig from 'appConfig';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import defaultClient from 'shared/api/cbioportalClientInstance';
import oncoKBClient from 'shared/api/oncokbClientInstance';
import {
    action,
    computed,
    IReactionDisposer,
    observable,
    reaction,
    toJS,
} from 'mobx';
import {
    ClinicalDataBinCountFilter,
    ClinicalDataBinFilter,
    ClinicalDataCount,
    ClinicalDataCountFilter,
    ClinicalDataCountItem,
    ClinicalDataFilter,
    DensityPlotBin,
    Sample,
    SampleIdentifier,
    StudyViewFilter,
    DataFilterValue,
    GenomicDataCount,
    GeneFilter,
    ClinicalDataBin,
    GenomicDataBinFilter,
    GenomicDataFilter,
    GenomicDataBin,
} from 'cbioportal-ts-api-client';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    CopyNumberSeg,
    GenePanel,
    MolecularProfile,
    MolecularProfileFilter,
    Patient,
    ResourceData,
    ResourceDefinition,
} from 'cbioportal-ts-api-client';
import { fetchCopyNumberSegmentsForSamples } from 'shared/lib/StoreUtils';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';
import {
    AnalysisGroup,
    calculateLayout,
    ChartMeta,
    ChartMetaDataTypeEnum,
    ChartMetaWithDimensionAndChartType,
    ChartType,
    clinicalAttributeComparator,
    ChartDataCountSet,
    ClinicalDataCountSummary,
    ClinicalDataTypeEnum,
    Datalabel,
    DataType,
    generateScatterPlotDownloadData,
    GenomicDataCountWithSampleUniqueKeys,
    getChartMetaDataType,
    getChartSettingsMap,
    getClinicalDataBySamples,
    getClinicalDataCountWithColorByClinicalDataCount,
    getDataIntervalFilterValues,
    getClinicalEqualityFilterValuesByString,
    getCNAByAlteration,
    getCNASamplesCount,
    getDefaultPriorityByUniqueKey,
    getFilteredAndCompressedDataIntervalFilters,
    getFilteredSampleIdentifiers,
    getFilteredStudiesWithSamples,
    getFrequencyStr,
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
    RectangleBounds,
    shouldShowChart,
    showOriginStudiesInSummaryDescription,
    SPECIAL_CHARTS,
    SpecialChartsUniqueKeyEnum,
    StudyWithSamples,
    submitToPage,
    updateSavedUserPreferenceChartIds,
    getGenomicDataAsClinicalData,
    convertGenomicDataBinsToClinicalDataBins,
    getGenomicChartUniqueKey,
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
import { SessionGroupData } from '../../shared/api/ComparisonGroupClient';
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
    getSurvivalAttributes,
    plotsPriority,
    survivalClinicalDataVocabulary,
} from 'pages/resultsView/survival/SurvivalUtil';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import StudyViewURLWrapper from './StudyViewURLWrapper';
import client from '../../shared/api/cbioportalClientInstance';

export type ChartUserSetting = {
    id: string;
    name?: string;
    chartType?: ChartType;
    groups?: CustomGroup[]; //used when it is custom chart
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

const DEFAULT_CHART_NAME = 'Custom Chart';
export const SELECTED_ANALYSIS_GROUP_VALUE = 'Selected';
export const UNSELECTED_ANALYSIS_GROUP_VALUE = 'Unselected';

export type SurvivalType = {
    id: string;
    title: string;
    associatedAttrs: string[];
    filter: string[];
    survivalData: PatientSurvival[];
};

export type StudyViewURLQuery = {
    tab?: StudyViewPageTabKeyEnum;
    id?: string;
    studyId?: string;
    resourceUrl?: string; // for open resource tabs
    cancer_study_id?: string;
    filters?: string;
    filterAttributeId?: string;
    filterValues?: string;
};

export type CustomGroup = {
    name: string;
    sampleIdentifiers: CustomChartIdentifier[];
};

export type CustomChart = {
    name?: string;
    patientAttribute: boolean;
    groups: CustomGroup[];
};

export type GenomicChart = {
    name?: string;
    description?: string;
    profileType: string;
    hugoGeneSymbol: string;
};

export const DataBinMethodConstants: { [key: string]: 'DYNAMIC' | 'STATIC' } = {
    STATIC: 'STATIC',
    DYNAMIC: 'DYNAMIC',
};

export type CustomChartIdentifier = {
    studyId: string;
    sampleId: string;
    patientId: string;
};

export type CustomChartIdentifierWithValue = CustomChartIdentifier & {
    value: string;
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

export class StudyViewPageStore {
    private reactionDisposers: IReactionDisposer[] = [];

    public studyViewQueryFilter: StudyViewURLQuery;

    constructor(
        private appStore: AppStore,
        private sessionServiceIsEnabled: boolean,
        private urlWrapper: StudyViewURLWrapper
    ) {
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
                    this.chartsDimension.toJS(),
                    this.chartsType.toJS(),
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

        // Include special charts into custom charts list
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

                    if (
                        uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                    ) {
                        this.customChartsPromises[
                            uniqueKey
                        ] = this.cancerStudiesData;
                    }
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

    private openResourceTabMap = observable.map<boolean>();
    @autobind
    public isResourceTabOpen(resourceId: string) {
        return !!this.openResourceTabMap.get(resourceId);
    }
    @autobind
    @action
    public setResourceTabOpen(resourceId: string, open: boolean) {
        this.openResourceTabMap.set(resourceId, open);
    }

    @observable.ref
    private _comparisonConfirmationModal: JSX.Element | null = null;
    public get comparisonConfirmationModal() {
        return this._comparisonConfirmationModal;
    }
    @autobind
    @action
    public setComparisonConfirmationModal(
        getModal: (hideModal: () => void) => JSX.Element
    ) {
        this._comparisonConfirmationModal = getModal(() => {
            this._comparisonConfirmationModal = null;
        });
    }

    // <comparison groups code>
    private _selectedComparisonGroups = observable.shallowMap<boolean>();
    private _comparisonGroupsMarkedForDeletion = observable.shallowMap<
        boolean
    >();

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

    @action public markSelectedGroupsForDeletion() {
        onMobxPromise(this.comparisonGroups, groups => {
            for (const group of groups) {
                if (this.isComparisonGroupSelected(group.uid)) {
                    this.toggleComparisonGroupMarkedForDeletion(group.uid);
                }
            }
        });
    }

    @action public async deleteMarkedComparisonGroups() {
        const deletionPromises = [];
        for (const groupId of this._comparisonGroupsMarkedForDeletion.keys()) {
            if (this.isComparisonGroupMarkedForDeletion(groupId)) {
                deletionPromises.push(comparisonClient.deleteGroup(groupId));
                this._selectedComparisonGroups.delete(groupId);
            }
        }
        await Promise.all(deletionPromises);
        this._comparisonGroupsMarkedForDeletion.clear();
        this.notifyComparisonGroupsChange();
    }

    readonly comparisonGroups = remoteData<StudyViewComparisonGroup[]>({
        await: () => [this.sampleSet],
        invoke: async () => {
            // reference this so its responsive to changes
            this._comparisonGroupsChangeCount;
            if (this.studyIds.length > 0) {
                const groups = await comparisonClient.getGroupsForStudies(
                    this.studyIds.slice()
                ); // slice because cant pass mobx
                return groups.map(group =>
                    Object.assign(
                        group.data,
                        { uid: group.id },
                        finalizeStudiesAttr(group.data, this.sampleSet.result!)
                    )
                );
            } else {
                return [];
            }
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
        } else {
            promises.push(this.clinicalDataBinPromises[chartMeta.uniqueKey]);
        }

        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                promises,
                async (
                    selectedSamples: Sample[],
                    dataBins: ClinicalDataBin[]
                ) => {
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
                    } else {
                        const clinicalAttribute = chartMeta.clinicalAttribute;
                        if (clinicalAttribute) {
                            // get clinical data for the given attribute
                            const entityIdKey = clinicalAttribute.patientAttribute
                                ? 'patientId'
                                : 'sampleId';
                            data = await defaultClient.fetchClinicalDataUsingPOST(
                                {
                                    clinicalDataType: clinicalAttribute.patientAttribute
                                        ? ClinicalDataTypeEnum.PATIENT
                                        : ClinicalDataTypeEnum.SAMPLE,
                                    clinicalDataMultiStudyFilter: {
                                        attributeIds: [
                                            clinicalAttribute.clinicalAttributeId,
                                        ],
                                        identifiers: selectedSamples.map(s => ({
                                            studyId: s.studyId,
                                            entityId: s[entityIdKey],
                                        })),
                                    },
                                }
                            );
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

                    if (this.isCustomChart(chartMeta.uniqueKey)) {
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
                        .sortBy(attrVal => -attrVal.count)
                        // do not slice for comparison on cancer studies chart
                        .slice(
                            0,
                            chartMeta.uniqueKey ===
                                SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                                ? undefined
                                : MAX_GROUPS_IN_SESSION
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
    public async openComparisonPage(params: {
        chartMeta: ChartMeta;
        categorizationType?: NumericalGroupComparisonType;
        clinicalAttributeValues?: ClinicalDataCountSummary[];
    }) {
        // open window before the first `await` call - this makes it a synchronous window.open,
        //  which doesnt trigger pop-up blockers. We'll send it to the correct url once we get the result
        const comparisonWindow: any = window.open(
            getComparisonLoadingUrl({
                phase: LoadingPhase.DOWNLOADING_GROUPS,
                clinicalAttributeName: params.chartMeta.displayName,
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

        switch (this.chartsType.get(params.chartMeta.uniqueKey)) {
            case ChartTypeEnum.PIE_CHART:
            case ChartTypeEnum.TABLE:
                sessionId = await this.createCategoricalAttributeComparisonSession(
                    params.chartMeta,
                    params.clinicalAttributeValues!,
                    statusCallback
                );
                break;
            default:
                sessionId = await this.createNumberAttributeComparisonSession(
                    params.chartMeta,
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

    private _clinicalDataFilterSet = observable.shallowMap<
        ClinicalDataFilter
    >();

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

    private _customBinsFromScatterPlotSelectionSet = observable.shallowMap<
        number[]
    >();
    private _genomicDataIntervalFilterSet = observable.shallowMap<
        GenomicDataFilter
    >();

    @observable private _clinicalDataBinFilterSet = observable.map<
        ClinicalDataBinFilter
    >();
    @observable private _genomicDataBinFilterSet = observable.map<
        GenomicDataBinFilter
    >();

    @observable.ref private _geneFilterSet = observable.map<string[][]>();

    // TODO: make it computed
    // Currently the study view store does not have the full control of the promise.
    // ChartContainer should be modified, instead of accepting a promise, it should accept data and loading state.
    @observable private _chartVisibility = observable.map<boolean>();

    @observable geneQueryStr: string;

    @observable private geneQueries: SingleGeneQuery[] = [];

    @observable public chartsDimension = observable.map<ChartDimension>();

    @observable public chartsType = observable.map<ChartType>();

    private newlyAddedCharts = observable.array<string>();

    private unfilteredClinicalDataCountCache: {
        [uniqueKey: string]: ClinicalDataCountItem;
    } = {};
    private unfilteredClinicalDataBinCountCache: {
        [uniqueKey: string]: ClinicalDataBin[];
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
        if (
            _.isArray(filters.clinicalDataFilters) &&
            filters.clinicalDataFilters.length > 0
        ) {
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

        if (_.isArray(filters.geneFilters) && filters.geneFilters.length > 0) {
            filters.geneFilters.forEach(geneFilter => {
                const key = getUniqueKeyFromMolecularProfileIds(
                    geneFilter.molecularProfileIds
                );
                this._geneFilterSet.set(key, _.clone(geneFilter.geneQueries));
            });
        }
        if (
            _.isArray(filters.sampleIdentifiers) &&
            filters.sampleIdentifiers.length > 0
        ) {
            this.numberOfSelectedSamplesInCustomSelection =
                filters.sampleIdentifiers.length;
            this.updateChartSampleIdentifierFilter(
                SpecialChartsUniqueKeyEnum.CUSTOM_SELECT,
                filters.sampleIdentifiers,
                false
            );
        }

        if (filters.genomicProfiles !== undefined) {
            this.setGenomicProfilesFilter(filters.genomicProfiles);
        }

        if (filters.caseLists !== undefined) {
            this.setCaseListsFilter(filters.caseLists);
        }

        if (
            _.isArray(filters.genomicDataFilters) &&
            filters.genomicDataFilters.length > 0
        ) {
            filters.genomicDataFilters.forEach(genomicDataFilter => {
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

        // We do not support studyIds in the query filters
        let filters: Partial<StudyViewFilter> = {};
        if (query.filters) {
            try {
                filters = JSON.parse(
                    decodeURIComponent(query.filters)
                ) as Partial<StudyViewFilter>;
                this.updateStoreByFilters(filters);
            } catch (e) {}
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
            delete studyViewFilter.studyIds;
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

    @autobind
    @action
    private updateLayout() {
        this.currentGridLayout = calculateLayout(
            this.visibleAttributes,
            this.columns,
            this.chartsDimension.toJS(),
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

    @autobind
    @action
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
        [id: string]: MobxPromise<ClinicalDataBin[]>;
    } = {};
    public clinicalDataCountPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    } = {};
    public customChartsPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    } = {};
    public genomicChartPromises: {
        [id: string]: MobxPromise<ClinicalDataBin[]>;
    } = {};

    private _chartSampleIdentifiersFilterSet = observable.map<
        SampleIdentifier[]
    >();

    public customChartFilterSet = observable.map<string[]>();

    @observable numberOfSelectedSamplesInCustomSelection: number = 0;
    @observable _filterComparisonGroups: StudyViewComparisonGroup[] = [];

    @observable private _filterMutatedGenesTableByCancerGenes: boolean = true;
    @observable private _filterFusionGenesTableByCancerGenes: boolean = true;
    @observable private _filterCNAGenesTableByCancerGenes: boolean = true;

    @autobind
    @action
    updateMutatedGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterMutatedGenesTableByCancerGenes = filtered;
    }
    @autobind
    @action
    updateFusionGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterFusionGenesTableByCancerGenes = filtered;
    }

    @autobind
    @action
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
    @observable private _customChartMap = observable.shallowMap<CustomChart>();
    @observable private _customCharts = observable.shallowMap<ChartMeta>();

    //used in saving gene specific charts
    @observable private _geneSpecificChartMap = observable.shallowMap<
        GenomicChart
    >();
    @observable private _geneSpecificCharts = observable.shallowMap<
        ChartMeta
    >();
    @observable private _customChartsSelectedCases = observable.shallowMap<
        CustomChartIdentifierWithValue[]
    >();

    @autobind
    @action
    onCheckGene(hugoGeneSymbol: string) {
        //only update geneQueryStr whenever a table gene is clicked.
        this.geneQueries = updateGeneQuery(this.geneQueries, hugoGeneSymbol);
        this.geneQueryStr = this.geneQueries
            .map(query => unparseOQLQueryLine(query))
            .join(' ');
    }

    @computed get selectedGenes(): string[] {
        return this.geneQueries.map(singleGeneQuery => singleGeneQuery.gene);
    }

    @autobind
    @action
    updateSelectedGenes(query: SingleGeneQuery[], queryStr: string) {
        this.geneQueries = query;
        this.geneQueryStr = queryStr;
    }

    @autobind
    @action
    clearAllFilters() {
        this._clinicalDataFilterSet.clear();
        this._geneFilterSet.clear();
        this._genomicDataIntervalFilterSet.clear();
        this._chartSampleIdentifiersFilterSet.clear();
        this.customChartFilterSet.clear();
        this.numberOfSelectedSamplesInCustomSelection = 0;
        this.removeComparisonGroupSelectionFilter();
        this._customBinsFromScatterPlotSelectionSet.clear();
        this.setGenomicProfilesFilter([]);
        this.setCaseListsFilter([]);
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
        dataBins: ClinicalDataBin[]
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

    @autobind
    @action
    updateClinicalDataFilterByValues(
        chartUniqueKey: string,
        values: DataFilterValue[]
    ) {
        if (this.chartMetaSet[chartUniqueKey]) {
            let chartMeta = this.chartMetaSet[chartUniqueKey];
            trackStudyViewFilterEvent('clinicalDataFilters', this);
            if (values.length > 0) {
                const clinicalDataIntervalFilter = {
                    attributeId: chartMeta.clinicalAttribute!
                        .clinicalAttributeId,
                    values: values,
                };
                this._clinicalDataFilterSet.set(
                    chartMeta.uniqueKey,
                    clinicalDataIntervalFilter
                );
            } else {
                this._clinicalDataFilterSet.delete(chartMeta.uniqueKey);
            }
        }
    }

    @autobind
    @action
    updateGenomicDataIntervalFilters(
        uniqueKey: string,
        dataBins: GenomicDataBin[]
    ) {
        trackStudyViewFilterEvent('genomicDataInterval', this);

        const values: DataFilterValue[] = getDataIntervalFilterValues(dataBins);
        this.updateGenomicDataIntervalFiltersByValues(uniqueKey, values);
    }

    @autobind
    @action
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

    @autobind
    @action
    addGeneFilters(chartMeta: ChartMeta, hugoGeneSymbols: string[][]) {
        trackStudyViewFilterEvent('geneFilter', this);
        let geneFilters =
            toJS(this._geneFilterSet.get(chartMeta.uniqueKey)) || [];
        geneFilters = geneFilters.concat(hugoGeneSymbols);

        this._geneFilterSet.set(chartMeta.uniqueKey, geneFilters);
    }

    @autobind
    @action
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

    @autobind
    @action
    addGenomicProfilesFilter(chartMeta: ChartMeta, profiles: string[][]) {
        let genomicProfilesFilter = toJS(this.genomicProfilesFilter) || [];
        this.setGenomicProfilesFilter(genomicProfilesFilter.concat(profiles));
    }

    @autobind
    @action
    addCaseListsFilter(chartMeta: ChartMeta, caseLists: string[][]) {
        let caseListsFilter = toJS(this.caseListsFilter) || [];
        this.setCaseListsFilter(caseListsFilter.concat(caseLists));
    }

    @autobind
    @action
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

    @autobind
    @action
    resetGeneFilter(chartUniqueKey: string) {
        this._geneFilterSet.delete(chartUniqueKey);
    }

    @autobind
    @action
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

    @autobind
    @action
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

    @autobind
    @action
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

    public getCustomChartFilters(chartKey: string) {
        return this.customChartFilterSet.get(chartKey) || [];
    }

    public newCustomChartUniqueKey(): string {
        return `CUSTOM_FILTERS_${this._customCharts.keys().length}`;
    }

    public isCustomChart(uniqueKey: string): boolean {
        return this._customCharts.has(uniqueKey);
    }

    public isGeneSpecificChart(uniqueKey: string): boolean {
        return this._geneSpecificChartMap.has(uniqueKey);
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
    changeChartsVisibility(charts: { [uniqueKey: string]: boolean }) {
        _.each(charts, (visible, uniqueKey) => {
            if (visible) {
                this._chartVisibility.set(uniqueKey, true);
            } else {
                this._chartVisibility.delete(uniqueKey);
            }
        });
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
                    if (this.isCustomChart(chartUniqueKey)) {
                        this.customChartFilterSet.delete(chartUniqueKey);
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
                default:
                    this._clinicalDataFilterSet.delete(chartUniqueKey);
                    this._chartSampleIdentifiersFilterSet.delete(
                        chartUniqueKey
                    );
                    this.customChartFilterSet.delete(chartUniqueKey);
                    this._genomicDataIntervalFilterSet.delete(chartUniqueKey);

                    break;
            }
        }
        this.changeChartVisibility(chartUniqueKey, visible);
    }

    @autobind
    @action
    removeComparisonGroupSelectionFilter() {
        this._chartSampleIdentifiersFilterSet.delete(
            SpecialChartsUniqueKeyEnum.SELECTED_COMPARISON_GROUPS
        );
        this._filterComparisonGroups = [];
    }

    @autobind
    @action
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
            // the clinicalDataBinFilter is guaranteed for bar chart.
            let ref = this._genomicDataBinFilterSet.get(uniqueKey);
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

    public isLogScaleToggleVisible(
        uniqueKey: string,
        dataBins?: ClinicalDataBin[]
    ) {
        if (this.isGeneSpecificChart(uniqueKey)) {
            return (
                (this._genomicDataBinFilterSet.get(uniqueKey) !== undefined &&
                    this._genomicDataBinFilterSet.get(uniqueKey)!
                        .disableLogScale) ||
                isLogScaleByDataBins(dataBins)
            );
        }

        return (
            (this._clinicalDataBinFilterSet.get(uniqueKey) !== undefined &&
                this._clinicalDataBinFilterSet.get(uniqueKey)!
                    .disableLogScale) ||
            isLogScaleByDataBins(dataBins)
        );
    }

    public isLogScaleChecked(uniqueKey: string) {
        if (this.isGeneSpecificChart(uniqueKey)) {
            return (
                this._genomicDataBinFilterSet.get(uniqueKey) !== undefined &&
                !this._genomicDataBinFilterSet.get(uniqueKey)!.disableLogScale
            );
        }
        return (
            this._clinicalDataBinFilterSet.get(uniqueKey) !== undefined &&
            !this._clinicalDataBinFilterSet.get(uniqueKey)!.disableLogScale
        );
    }

    @autobind
    @action
    public updateCustomBins(uniqueKey: string, bins: number[]) {
        if (this.isGeneSpecificChart(uniqueKey)) {
            let newFilter = _.clone(
                this._genomicDataBinFilterSet.get(uniqueKey)
            )!;
            newFilter.customBins = bins;
            this._genomicDataBinFilterSet.set(uniqueKey, newFilter);
        } else {
            let newFilter = _.clone(
                this._clinicalDataBinFilterSet.get(uniqueKey)
            )!;
            if (bins.length > 0) {
                newFilter.customBins = bins;
            } else {
                delete newFilter.customBins;
            }
            this._clinicalDataBinFilterSet.set(uniqueKey, newFilter);
        }
    }

    public getCurrentBins(chartMeta: ChartMeta): number[] {
        if (this.isGeneSpecificChart(chartMeta.uniqueKey)) {
            return _.uniq(
                _.reduce(
                    this.getGenomicChartDataBin(chartMeta).result,
                    (acc, next) => {
                        if (next.start) {
                            acc.push(next.start);
                        }
                        if (next.end) {
                            acc.push(next.end);
                        }
                        return acc;
                    },
                    [] as number[]
                )
            );
        }

        return _.uniq(
            _.reduce(
                this.getClinicalDataBin(chartMeta).result,
                (acc, next) => {
                    if (next.start) {
                        acc.push(next.start);
                    }
                    if (next.end) {
                        acc.push(next.end);
                    }
                    return acc;
                },
                [] as number[]
            )
        );
    }

    @action addCharts(visibleChartIds: string[]) {
        visibleChartIds.forEach(chartId => {
            if (!this._chartVisibility.keys().includes(chartId)) {
                this.newlyAddedCharts.push(chartId);
            }
        });
        this.updateChartsVisibility(visibleChartIds);
    }

    @action updateChartsVisibility(visibleChartIds: string[]) {
        _.each(this._chartVisibility.keys(), chartId => {
            if (
                !_.includes(visibleChartIds, chartId) ||
                !this._chartVisibility.get(chartId)
            ) {
                // delete it instead of setting it to false
                // because adding chart back would insert in middle instead of appending at last
                this._chartVisibility.delete(chartId);
            }
        });
        _.each(visibleChartIds, uniqueKey => {
            if (this._chartVisibility.get(uniqueKey) === undefined) {
                this._chartVisibility.set(uniqueKey, true);
            }
        });
    }

    @computed get clinicalDataFilters() {
        return this._clinicalDataFilterSet.values();
    }

    @computed get geneFilters(): GeneFilter[] {
        return _.map(this._geneFilterSet.entries(), ([key, value]) => {
            return {
                molecularProfileIds: getMolecularProfileIdsFromUniqueKey(key),
                geneQueries: value,
            };
        });
    }

    @computed get genomicDataIntervalFilters() {
        return this._genomicDataIntervalFilterSet.values();
    }

    @computed
    get filters(): StudyViewFilter {
        const filters: Partial<StudyViewFilter> = {};

        const clinicalDataFilters = this.clinicalDataFilters;

        const genomicDataIntervalFilters = this.genomicDataIntervalFilters;
        if (genomicDataIntervalFilters.length > 0) {
            filters.genomicDataFilters = genomicDataIntervalFilters;
        }

        if (clinicalDataFilters.length > 0) {
            filters.clinicalDataFilters = clinicalDataFilters;
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

        let sampleIdentifiersFilterSets = this._chartSampleIdentifiersFilterSet.values();

        // nested array need to be spread for _.intersectionWith
        let _sampleIdentifiers: SampleIdentifier[] = _.intersectionWith(
            ...sampleIdentifiersFilterSets,
            ((a: SampleIdentifier, b: SampleIdentifier) => {
                return a.sampleId === b.sampleId && a.studyId === b.studyId;
            }) as any
        );

        if (_sampleIdentifiers && _sampleIdentifiers.length > 0) {
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
        } = this._chartSampleIdentifiersFilterSet.toJS();
        return { ...this.filters, sampleIdentifiersSet };
    }

    public getGeneFiltersByUniqueKey(uniqueKey: string) {
        return toJS(this._geneFilterSet.get(uniqueKey)) || [];
    }

    public getClinicalDataFiltersByUniqueKey(uniqueKey: string) {
        const filter = this._clinicalDataFilterSet.get(uniqueKey);
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

    @computed
    get unfilteredAttrsForNonNumerical() {
        const visibleNonNumericalAttributes = this.visibleAttributes.filter(
            (chartMeta: ChartMeta) => {
                if (
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
        await: () => [this.studyViewFilterWithFilteredSampleIdentifiers],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                clinicalDataCountFilter: {
                    attributes: this.unfilteredAttrsForNonNumerical,
                    studyViewFilter: this
                        .studyViewFilterWithFilteredSampleIdentifiers.result!,
                } as ClinicalDataCountFilter,
            });
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
        await: () => [this.studyViewFilterWithFilteredSampleIdentifiers],
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                clinicalDataCountFilter: {
                    attributes: this.newlyAddedUnfilteredAttrsForNonNumerical,
                    studyViewFilter: this
                        .studyViewFilterWithFilteredSampleIdentifiers.result!,
                } as ClinicalDataCountFilter,
            });
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

    readonly newlyAddedUnfilteredClinicalDataBinCount = remoteData<
        ClinicalDataBin[]
    >({
        invoke: () => {
            return internalClient.fetchClinicalDataBinCountsUsingPOST({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: this.newlyAddedUnfilteredAttrsForNumerical,
                    studyViewFilter: this.filters,
                } as ClinicalDataBinCountFilter,
            });
        },
        default: [],
        onError: error => {},
        onResult: data => {
            _.each(_.groupBy(data, item => item.attributeId), (item, key) => {
                this.unfilteredClinicalDataBinCountCache[key] = item;
                this.newlyAddedCharts.remove(key);
            });
        },
    });

    readonly unfilteredClinicalDataBinCount = remoteData<ClinicalDataBin[]>({
        invoke: () => {
            return internalClient.fetchClinicalDataBinCountsUsingPOST({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: this.unfilteredAttrsForNumerical,
                    studyViewFilter: this.filters,
                } as ClinicalDataBinCountFilter,
            });
        },
        onError: error => {},
        default: [],
    });

    @autobind
    @action
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
                    return getRequestedAwaitPromisesForClinicalData(
                        isDefaultAttr,
                        this.isInitialFilterState,
                        this.chartsAreFiltered,
                        this._clinicalDataFilterSet.has(uniqueKey),
                        this.unfilteredClinicalDataCount,
                        this.newlyAddedUnfilteredClinicalDataCount,
                        this.initialVisibleAttributesClinicalDataCountData
                    );
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
                    if (data !== undefined) {
                        counts = data.counts;
                    }
                    return getClinicalDataCountWithColorByClinicalDataCount(
                        counts
                    );
                },
                onError: error => {},
                default: [],
            });
        }
        return this.clinicalDataCountPromises[uniqueKey];
    }

    public getClinicalDataBin(chartMeta: ChartMeta) {
        const uniqueKey: string = getUniqueKey(chartMeta.clinicalAttribute!);
        if (!this.clinicalDataBinPromises.hasOwnProperty(uniqueKey)) {
            const defaultAttr = _.find(
                this.defaultVisibleAttributes.result,
                attr => getUniqueKey(attr) === uniqueKey
            );
            const isDefaultAttr = defaultAttr !== undefined;
            this.clinicalDataBinPromises[uniqueKey] = remoteData<
                ClinicalDataBin[]
            >({
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
                            result = await internalClient.fetchClinicalDataBinCountsUsingPOST(
                                {
                                    dataBinMethod,
                                    clinicalDataBinCountFilter: {
                                        attributes: [attribute],
                                        studyViewFilter: this.filters,
                                    } as ClinicalDataBinCountFilter,
                                }
                            );
                        } else if (!isDefaultAttr && !this.chartsAreFiltered) {
                            result = this.unfilteredClinicalDataBinCountCache[
                                uniqueKey
                            ];
                        } else {
                            result = this.unfilteredClinicalDataBinCount.result;
                        }
                    }

                    return (
                        _.filter(result, {
                            attributeId: chartMeta.clinicalAttribute!
                                .clinicalAttributeId,
                        }) || []
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
                ClinicalDataBin[]
            >({
                await: () => [],
                invoke: async () => {
                    const chartInfo = this._geneSpecificChartMap.get(
                        chartMeta.uniqueKey
                    );
                    const attribute = this._genomicDataBinFilterSet.get(
                        chartMeta.uniqueKey
                    )!;
                    if (chartInfo) {
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
                        return convertGenomicDataBinsToClinicalDataBins(
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

    readonly allPhysicalStudies = remoteData({
        invoke: async () => {
            if (this.studyIds.length > 0) {
                return defaultClient
                    .fetchStudiesUsingPOST({
                        studyIds: toJS(this.studyIds),
                        projection: 'SUMMARY',
                    })
                    .then(studies => {
                        return studies;
                    })
                    .catch(error => {
                        return defaultClient.getAllStudiesUsingGET({
                            projection: 'SUMMARY',
                        });
                    });
            }
            return [];
        },
        default: [],
    });

    readonly physicalStudiesSet = remoteData<{ [id: string]: CancerStudy }>({
        await: () => [this.allPhysicalStudies],
        invoke: async () => {
            return _.keyBy(this.allPhysicalStudies.result, s => s.studyId);
        },
        default: {},
    });

    // contains queried physical studies
    readonly filteredPhysicalStudies = remoteData({
        await: () => [this.physicalStudiesSet],
        invoke: async () => {
            const physicalStudiesSet = this.physicalStudiesSet.result;
            return _.reduce(
                this.studyIds,
                (acc: CancerStudy[], next) => {
                    if (physicalStudiesSet[next]) {
                        acc.push(physicalStudiesSet[next]);
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
            let physicalStudiesSet = this.physicalStudiesSet.result;

            const virtualStudyRelatedPhysicalStudiesIds = _.uniq(
                _.flatten(
                    this.filteredVirtualStudies.result.map((vs: VirtualStudy) =>
                        vs.data.studies.map(study => study.id)
                    )
                )
            );
            const unsettledPhysicalStudies = _.without(
                virtualStudyRelatedPhysicalStudiesIds,
                ..._.keys(physicalStudiesSet)
            );
            if (unsettledPhysicalStudies.length > 0) {
                const virtualStudyRelatedPhysicalStudies = await defaultClient.fetchStudiesUsingPOST(
                    {
                        studyIds: unsettledPhysicalStudies,
                        projection: 'SUMMARY',
                    }
                );
                physicalStudiesSet = _.merge(
                    physicalStudiesSet,
                    _.keyBy(virtualStudyRelatedPhysicalStudies, 'studyId')
                );
            }
            let studies = _.reduce(
                this.filteredPhysicalStudies.result,
                (acc, next) => {
                    acc[next.studyId] = physicalStudiesSet[next.studyId];
                    return acc;
                },
                {} as { [id: string]: CancerStudy }
            );

            this.filteredVirtualStudies.result.forEach(virtualStudy => {
                virtualStudy.data.studies.forEach(study => {
                    if (!studies[study.id] && physicalStudiesSet[study.id]) {
                        studies[study.id] = physicalStudiesSet[study.id];
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
        ],
        invoke: async () => {
            let studies: CancerStudy[] = [];
            if (this.showOriginStudiesInSummaryDescription) {
                const originStudyIds = this.filteredVirtualStudies.result[0]
                    .data.origin;
                const virtualStudyIds: string[] = [];
                const physicalStudiesSet = this.physicalStudiesSet.result;
                _.each(originStudyIds, studyId => {
                    if (physicalStudiesSet[studyId]) {
                        studies.push(physicalStudiesSet[studyId]);
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

    readonly studies = remoteData<CancerStudy[]>({
        invoke: () => {
            if (this.studyIds.length > 0) {
                return defaultClient.fetchStudiesUsingPOST({
                    studyIds: toJS(this.studyIds),
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly resourceDefinitions = remoteData({
        invoke: () => {
            const promises = [];
            const ret: ResourceDefinition[] = [];
            for (const studyId of this.studyIds) {
                promises.push(
                    client
                        .getAllResourceDefinitionsInStudyUsingGET({ studyId })
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
                    client
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
            return _.reduce(
                this.clinicalAttributes.result!,
                (acc, clinicalAttribute) => {
                    if (
                        acc[clinicalAttribute.clinicalAttributeId] === undefined
                    ) {
                        acc[clinicalAttribute.clinicalAttributeId] =
                            clinicalAttribute.datatype;
                    } else if (
                        acc[clinicalAttribute.clinicalAttributeId] !==
                        clinicalAttribute.datatype
                    ) {
                        acc[clinicalAttribute.clinicalAttributeId] =
                            DataType.STRING;
                    }
                    return acc;
                },
                {} as { [id: string]: string }
            );
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

    @autobind
    @action
    addCustomChart(
        newChart: CustomChart,
        uniqueKey: string = this.newCustomChartUniqueKey(),
        loadedfromUserSettings: boolean = false
    ) {
        const newChartName = newChart.name
            ? newChart.name
            : this.getDefaultCustomChartName();
        let chartMeta: ChartMeta = {
            uniqueKey: uniqueKey,
            displayName: newChartName,
            description: newChartName,
            dataType: ChartMetaDataTypeEnum.CUSTOM_DATA,
            patientAttribute: false,
            renderWhenDataChange: false,
            priority: 0,
        };
        let allCases: CustomChartIdentifierWithValue[] = [];
        if (newChart.patientAttribute) {
            chartMeta.patientAttribute = true;
        }
        _.each(newChart.groups, (group: CustomGroup) => {
            _.reduce(
                group.sampleIdentifiers,
                (acc, next) => {
                    acc.push({
                        studyId: next.studyId,
                        sampleId: next.sampleId,
                        patientId: next.patientId,
                        value: group.name,
                    });
                    return acc;
                },
                allCases
            );
        });
        this._customCharts.set(uniqueKey, chartMeta);
        this._customChartMap.set(uniqueKey, newChart);
        this._chartVisibility.set(uniqueKey, true);
        this._customChartsSelectedCases.set(uniqueKey, allCases);
        this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
        this.chartsDimension.set(uniqueKey, { w: 1, h: 1 });

        // Autoselect the groups
        if (!loadedfromUserSettings) {
            this.setCustomChartFilters(
                chartMeta.uniqueKey,
                newChart.groups.map(group => group.name)
            );
            this.newlyAddedCharts.clear();
            this.newlyAddedCharts.push(uniqueKey);
        }
    }

    @autobind
    @action
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
                this._chartVisibility.set(uniqueKey, true);
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
                this._chartVisibility.set(uniqueKey, true);
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

    @autobind
    @action
    updateCustomSelect(newChart: CustomChart) {
        this.clearAllFilters();
        const sampleIdentifiers = _.reduce(
            newChart.groups,
            (acc, next) => {
                acc.push(
                    ...next.sampleIdentifiers.map(
                        (customCase: CustomChartIdentifier) => {
                            return {
                                sampleId: customCase.sampleId,
                                studyId: customCase.studyId,
                            };
                        }
                    )
                );
                return acc;
            },
            [] as SampleIdentifier[]
        );
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
        let _chartMetaSet = this._customCharts.toJS();
        _chartMetaSet = _.merge(_chartMetaSet, this._geneSpecificCharts.toJS());

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
            this.survivalPlots,
            (acc: { [id: string]: ChartMeta }, survivalPlot) => {
                acc[survivalPlot.id] = {
                    uniqueKey: survivalPlot.id,
                    dataType: getChartMetaDataType(survivalPlot.id),
                    patientAttribute: true,
                    displayName: survivalPlot.title,
                    priority: getDefaultPriorityByUniqueKey(survivalPlot.id),
                    renderWhenDataChange: false,
                    description: '',
                };
                return acc;
            },
            _chartMetaSet
        );

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
            this._chartVisibility.entries(),
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

    @computed
    get loadingInitialDataForSummaryTab() {
        let pending =
            this.defaultVisibleAttributes.isPending ||
            this.clinicalAttributes.isPending ||
            this.mutationProfiles.isPending ||
            this.cnaProfiles.isPending ||
            this.structuralVariantProfiles.isPending ||
            this.survivalClinicalAttributesPrefix.isPending;

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
        }
        if (!_.isEmpty(this.initialFilters.genomicDataFilters)) {
            pending = pending || this.molecularProfileOptions.isPending;
        }
        if (!_.isEmpty(this.initialFilters.caseLists)) {
            pending = pending || this.caseListSampleCounts.isPending;
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
                this.chartsDimension.toJS(),
                this.chartsType.toJS(),
                this._customChartMap.toJS(),
                this._geneSpecificChartMap.toJS(),
                this._clinicalDataBinFilterSet.toJS(),
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

    @autobind
    @action
    private clearPageSettings() {
        this._chartVisibility.clear();
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

    @autobind
    @action
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

    @autobind
    @action
    public undoUserSettings() {
        this.loadSettings(_.values(this.previousSettings));
        this.previousSettings = {};
    }

    // had to create default variables for eachsince the default chart settings
    // depends on the number of columns (browser width)
    @observable private _defualtChartsDimension = observable.map<
        ChartDimension
    >();
    @observable private _defaultChartsType = observable.map<ChartType>();
    @observable private _defaultVisibleChartIds: string[] = [];
    @observable private _defaultClinicalDataBinFilterSet = observable.map<
        ClinicalDataBinFilter
    >();

    @autobind
    @action
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
        return getChartSettingsMap(
            this._defaultVisibleChartIds.map(
                chartUniqueKey => this.chartMetaSet[chartUniqueKey]
            ),
            this.columns,
            this._defualtChartsDimension.toJS(),
            this._defaultChartsType.toJS(),
            {},
            {},
            this._defaultClinicalDataBinFilterSet.toJS()
        );
    }

    @autobind
    @action
    private loadSettings(chartSettngs: ChartUserSetting[]) {
        this.clearPageSettings();
        _.map(chartSettngs, chartUserSettings => {
            if (
                chartUserSettings.name &&
                chartUserSettings.groups &&
                chartUserSettings.groups.length > 0
            ) {
                this.addCustomChart(
                    {
                        name: chartUserSettings.name,
                        groups: chartUserSettings.groups || [],
                        patientAttribute: chartUserSettings.patientAttribute,
                    },
                    chartUserSettings.id,
                    true
                );
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
            if (chartUserSettings.layout) {
                this.currentGridLayout.push({
                    i: chartUserSettings.id,
                    isResizable: false,
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

    @autobind
    @action
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
        this._defualtChartsDimension = observable.map(
            this.chartsDimension.toJS()
        );
        this._defaultChartsType = observable.map(this.chartsType.toJS());
        this._defaultVisibleChartIds = this.visibleAttributes.map(
            attribute => attribute.uniqueKey
        );
        this._defaultClinicalDataBinFilterSet = observable.map(
            toJS(this._clinicalDataBinFilterSet)
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

        const cancerTypeIds = _.uniq(
            this.queriedPhysicalStudies.result.map(study => study.cancerTypeId)
        );
        const survivalUniqueKeys = this.survivalPlotKeys;

        survivalUniqueKeys.forEach(key => {
            this.chartsType.set(key, ChartTypeEnum.SURVIVAL);
            this.chartsDimension.set(
                key,
                STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SURVIVAL]
            );
            if (getDefaultPriorityByUniqueKey(key) !== 0) {
                // hide *_SURVIVAL chart if cancer type is mixed or have more than one cancer type
                if (
                    cancerTypeIds.length === 1 &&
                    cancerTypeIds[0] !== 'mixed'
                ) {
                    this.changeChartVisibility(key, true);
                }
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

    private getTableDimensionByNumberOfRecords(records: number) {
        return records <= STUDY_VIEW_CONFIG.thresholds.rowsInTableForOneGrid
            ? {
                  w: 2,
                  h: 1,
              }
            : { w: 2, h: 2 };
    }

    @autobind
    @action
    changeChartType(attr: ChartMeta, newChartType: ChartType) {
        let data: MobxPromise<ClinicalDataCountSummary[]> | undefined;
        if (newChartType === ChartTypeEnum.TABLE) {
            if (attr.uniqueKey === SpecialChartsUniqueKeyEnum.CANCER_STUDIES) {
                data = this.cancerStudiesData;
            } else if (this.isCustomChart(attr.uniqueKey)) {
                data = this.getCustomChartDataCount(attr);
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
        ClinicalDataBin[]
    >({
        await: () => [this.initialVisibleAttributesClinicalDataBinAttributes],
        invoke: async () => {
            return internalClient.fetchClinicalDataBinCountsUsingPOST({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: this
                        .initialVisibleAttributesClinicalDataBinAttributes
                        .result,
                    studyViewFilter: this.initialFilters,
                } as ClinicalDataBinCountFilter,
            });
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
    initializeClinicalDataBinCountCharts() {
        _.each(
            _.groupBy(
                this.initialVisibleAttributesClinicalDataBinCountData.result,
                'attributeId'
            ),
            (item: ClinicalDataBin[], attributeId: string) => {
                if (
                    shouldShowChart(
                        this.initialFilters,
                        item.length,
                        this.samples.result.length
                    )
                ) {
                    this._chartVisibility.set(attributeId, true);
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

    readonly selectedSamples = remoteData<Sample[]>({
        await: () => [
            this.samples,
            this.sampleIdentifiersFromGenomicProfileFilter,
        ],
        invoke: () => {
            //fetch samples when there are only filters applied
            if (this.chartsAreFiltered) {
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
                        delete studyViewFilter.studyIds;
                    }
                    delete studyViewFilter.genomicProfiles;
                }

                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter,
                });
            }
            return Promise.resolve(this.samples.result);
        },
        onError: error => {},
        default: [],
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

    @computed private get survivalPlots() {
        let survivalTypes: SurvivalType[] = this.survivalClinicalAttributesPrefix.result.map(
            prefix => {
                let plotTitle =
                    this.survivalDescriptions.result &&
                    this.survivalDescriptions.result[prefix]
                        ? generateStudyViewSurvivalPlotTitle(
                              this.survivalDescriptions.result![prefix][0]
                                  .displayName
                          )
                        : `${prefix} Survival`;
                return {
                    id: `${prefix}_SURVIVAL`,
                    title: plotTitle,
                    associatedAttrs: [`${prefix}_STATUS`, `${prefix}_MONTHS`],
                    filter: survivalClinicalDataVocabulary[prefix],
                    survivalData: [],
                };
            }
        );
        return survivalTypes;
    }

    public async getPieChartDataDownload(
        chartMeta: ChartMeta,
        dataType?: DownloadDataType
    ) {
        const isCustomChart = this.isCustomChart(chartMeta.uniqueKey);
        if (dataType && dataType === 'summary') {
            if (isCustomChart) {
                return this.getClinicalDataCountSummary(
                    chartMeta,
                    this.getCustomChartDataCount(chartMeta).result!
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
            molecularProfile.molecularProfileId.replace(
                molecularProfile.studyId + '_',
                ''
            )
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

    public async getSurvivalDownloadData(chartMeta: ChartMeta) {
        const matchedPlot = _.find(
            this.survivalPlots,
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
            let header = ['Gene', 'MutSig(Q-value)', '# Mut', '#', 'Freq'];
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
            const header = ['Gene', '# Fusion', '#', 'Freq'];
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
        await: () => [this.survivalData, this.selectedPatientKeys],
        invoke: async () => {
            return this.survivalPlots.map(obj => {
                obj.survivalData = getPatientSurvivals(
                    this.survivalData.result,
                    this.selectedPatientKeys.result!,
                    obj.associatedAttrs[0],
                    obj.associatedAttrs[1],
                    s => obj.filter.includes(s)
                );
                return obj;
            });
        },
        onError: error => {},
        default: [],
    });

    readonly survivalData = remoteData<{ [id: string]: ClinicalData[] }>({
        await: () => [this.clinicalAttributes, this.samples],
        invoke: async () => {
            const attributeIds = _.flatten(
                this.survivalPlots.map(obj => obj.associatedAttrs)
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
                )
            ) {
                const yAxisBinCount = MutationCountVsCnaYBinsMin;
                const xAxisBinCount = 50;
                const bins = (await internalClient.fetchClinicalDataDensityPlotUsingPOST(
                    {
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
                    }
                )).filter(bin => bin.count > 0); // only show points for bins with stuff in them
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
            this.initialMolecularProfileSampleCounts,
            this.sampleUniqueKeysByMolecularProfileIdSet,
            this.selectedSamples,
        ],
        invoke: async () => {
            let molecularProfileOptions: GenomicDataCountWithSampleUniqueKeys[] = [];
            if (this.isInitialFilterState) {
                molecularProfileOptions = this
                    .initialMolecularProfileSampleCounts.result!;
            } else {
                molecularProfileOptions = getMolecularProfileOptions(
                    this.molecularProfiles.result,
                    this.sampleUniqueKeysByMolecularProfileIdSet.result!
                );
            }

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

                if (!_.isEmpty(this.structuralVariantProfiles.result)) {
                    const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                        this.structuralVariantProfiles.result.map(
                            profile => profile.molecularProfileId
                        )
                    );
                    // samples countaing this data would be the samples profiled for these molecular profiles
                    ret[uniqueKey] = _.sumBy(
                        this.structuralVariantProfiles.result,
                        profile =>
                            (
                                molecularProfileSamplesSet[
                                    profile.molecularProfileId
                                ] || []
                            ).length
                    );
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

                // Add all custom chart counts, and they should all get 100%
                _.reduce(
                    this._customCharts.keys(),
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
                        this._geneSpecificChartMap.keys(),
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
            _.values(this.physicalStudiesSet.result)
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
            if (!_.isEmpty(this.mutationProfiles.result)) {
                formOps[
                    'genetic_profile_ids_PROFILE_MUTATION_EXTENDED'
                ] = this.mutationProfiles.result[0].molecularProfileId;
            }
            if (!_.isEmpty(this.cnaProfiles.result)) {
                formOps[
                    'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION'
                ] = this.cnaProfiles.result[0].molecularProfileId;
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

    @autobind
    @action
    setCustomChartFilters(chartUniqueKey: string, values: string[]) {
        if (values.length > 0) {
            switch (chartUniqueKey) {
                case SpecialChartsUniqueKeyEnum.CANCER_STUDIES: {
                    let filteredSampleIdentifiers = getFilteredSampleIdentifiers(
                        this.samples.result.filter(sample =>
                            values.includes(sample.studyId)
                        )
                    );
                    this._chartSampleIdentifiersFilterSet.set(
                        chartUniqueKey,
                        filteredSampleIdentifiers
                    );
                    break;
                }
                default: {
                    let filteredSampleIdentifiers = _.reduce(
                        this._customChartsSelectedCases.get(chartUniqueKey),
                        (acc, next) => {
                            if (values.includes(next.value)) {
                                acc.push({
                                    studyId: next.studyId,
                                    sampleId: next.sampleId,
                                });
                            }
                            return acc;
                        },
                        [] as SampleIdentifier[]
                    );
                    this._chartSampleIdentifiersFilterSet.set(
                        chartUniqueKey,
                        filteredSampleIdentifiers
                    );
                }
            }
            this.customChartFilterSet.set(chartUniqueKey, values);
        } else {
            this._chartSampleIdentifiersFilterSet.delete(chartUniqueKey);
            this.customChartFilterSet.delete(chartUniqueKey);
        }
    }

    readonly cancerStudiesData = remoteData<ClinicalDataCountSummary[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            let selectedSamples = [];
            if (
                _.includes(
                    this._chartSampleIdentifiersFilterSet.keys(),
                    SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                )
            ) {
                selectedSamples = await getSamplesByExcludingFiltersOnChart(
                    SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
                    this.filters,
                    this._chartSampleIdentifiersFilterSet.toJS(),
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

    public getCustomChartDataCount(chartMeta: ChartMeta) {
        let uniqueKey: string = chartMeta.uniqueKey;

        if (!this.customChartsPromises.hasOwnProperty(uniqueKey)) {
            switch (uniqueKey) {
                default:
                    this.customChartsPromises[uniqueKey] = remoteData<
                        ClinicalDataCountSummary[]
                    >({
                        await: () => [this.selectedSamples],
                        invoke: async () => {
                            let dataCountSet: {
                                [id: string]: ClinicalDataCount;
                            } = {};

                            let selectedSamples: Sample[] = [];
                            if (
                                this._chartSampleIdentifiersFilterSet.has(
                                    uniqueKey
                                )
                            ) {
                                selectedSamples = await getSamplesByExcludingFiltersOnChart(
                                    uniqueKey,
                                    this.filters,
                                    this._chartSampleIdentifiersFilterSet.toJS(),
                                    this.queriedSampleIdentifiers.result,
                                    this.queriedPhysicalStudyIds.result
                                );
                            } else {
                                selectedSamples = this.selectedSamples.result;
                            }

                            dataCountSet = _.reduce(
                                selectedSamples,
                                (acc, sample) => {
                                    const matchedCases = _.filter(
                                        this._customChartsSelectedCases.get(
                                            uniqueKey
                                        ),
                                        (
                                            selectedCase: CustomChartIdentifierWithValue
                                        ) =>
                                            selectedCase.studyId ===
                                                sample.studyId &&
                                            selectedCase.sampleId ===
                                                sample.sampleId
                                    );
                                    const valDefault = Datalabel.NA;
                                    let matchedValues: string[] = [];
                                    if (matchedCases.length >= 1) {
                                        matchedValues = matchedCases.map(
                                            item => {
                                                return item.value
                                                    ? item.value
                                                    : valDefault;
                                            }
                                        );
                                    } else {
                                        matchedValues = [valDefault];
                                    }
                                    matchedValues.forEach(value => {
                                        if (acc[value]) {
                                            acc[value].count =
                                                acc[value].count + 1;
                                        } else {
                                            acc[value] = {
                                                value: value,
                                                count: 1,
                                            };
                                        }
                                    });
                                    return acc;
                                },
                                dataCountSet
                            );
                            return Promise.resolve(
                                getClinicalDataCountWithColorByClinicalDataCount(
                                    _.values(dataCountSet)
                                )
                            );
                        },
                        default: [],
                    });
                    break;
            }
        }
        return this.customChartsPromises[uniqueKey];
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
            const attributes = getSurvivalAttributes(
                this.clinicalAttributes.result!
            );
            // get paired attributes
            const attributesPrefix = _.reduce(
                attributes,
                (attributesPrefix, attribute) => {
                    let prefix = attribute.substring(
                        0,
                        attribute.indexOf('_STATUS')
                    );
                    if (!attributesPrefix.includes(prefix)) {
                        if (attributes.includes(`${prefix}_MONTHS`)) {
                            attributesPrefix.push(prefix);
                        }
                    }
                    return attributesPrefix;
                },
                [] as string[]
            );
            // change prefix order based on priority
            return Promise.resolve(
                _.sortBy(attributesPrefix, prefix => {
                    return plotsPriority[prefix] || 999;
                })
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
}
