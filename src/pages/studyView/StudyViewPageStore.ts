import * as _ from 'lodash';
import AppConfig from "appConfig";
import {remoteData} from "../../public-lib/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import defaultClient from "shared/api/cbioportalClientInstance";
import oncoKBClient from "shared/api/oncokbClientInstance";
import {action, computed, IReactionDisposer, observable, reaction, toJS} from "mobx";
import {
    ClinicalDataBinCountFilter,
    ClinicalDataBinFilter,
    ClinicalDataCount,
    ClinicalDataCountFilter,
    ClinicalDataCountItem,
    ClinicalDataEqualityFilter,
    ClinicalDataFilter,
    ClinicalDataIntervalFilter,
    ClinicalDataIntervalFilterValue,
    CopyNumberCountByGene,
    CopyNumberGeneFilter,
    CopyNumberGeneFilterElement,
    DataBin,
    DensityPlotBin,
    MolecularProfileSampleCount,
    MutationCountByGene,
    MutationGeneFilter,
    FusionGeneFilter,
    RectangleBounds,
    Sample,
    SampleIdentifier,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    CopyNumberSeg,
    Gene, GenePanel,
    MolecularProfile,
    MolecularProfileFilter,
    Patient
} from 'shared/api/generated/CBioPortalAPI';
import {fetchCopyNumberSegmentsForSamples} from "shared/lib/StoreUtils";
import {PatientSurvival} from 'shared/model/PatientSurvival';
import {getPatientSurvivals} from 'pages/resultsView/SurvivalStoreHelper';
import {
    AnalysisGroup,
    calculateLayout,
    ChartMeta,
    ChartType,
    clinicalAttributeComparator,
    ClinicalDataCountSet,
    ClinicalDataCountSummary,
    ClinicalDataTypeEnum,
    Datalabel,
    generateScatterPlotDownloadData,
    getChartMetaDataType,
    getClinicalAttributeUniqueKey,
    getClinicalAttributeUniqueKeyByDataTypeAttrId,
    getClinicalDataCountWithColorByCategoryCounts,
    getClinicalDataCountWithColorByClinicalDataCount,
    getClinicalDataIntervalFilterValues,
    getClinicalDataType,
    getClinicalEqualityFilterValuesByString,
    getCNAByAlteration,
    getDefaultPriorityByUniqueKey,
    getFilteredSampleIdentifiers,
    getFilteredStudiesWithSamples,
    getFrequencyStr,
    getPriorityByClinicalAttribute,
    getQValue,
    getRequestedAwaitPromisesForClinicalData,
    getSamplesByExcludingFiltersOnChart,
    isFiltered,
    isLogScaleByDataBins,
    isSpecialChart,
    MutationCountVsCnaYBinsMin,
    NA_DATA,
    shouldShowChart,
    showOriginStudiesInSummaryDescription,
    SPECIAL_CHARTS,
    StudyWithSamples,
    submitToPage, ChartMetaWithDimensionAndChartType,
    UniqueKey,
    getChartSettingsMap,
    getGroupsFromBins,
    NumericalGroupComparisonType,
    getGroupsFromQuartiles,
} from './StudyViewUtils';
import MobxPromise from 'mobxpromise';
import {SingleGeneQuery} from 'shared/lib/oql/oql-parser';
import autobind from "autobind-decorator";
import {updateGeneQuery} from 'pages/studyView/StudyViewUtils';
import {generateDownloadFilenamePrefixByStudies} from "shared/lib/FilenameUtils";
import {stringListToSet} from 'public-lib/lib/StringUtils';
import {unparseOQLQueryLine} from 'shared/lib/oql/oqlfilter';
import {IStudyViewScatterPlotData} from "./charts/scatterPlot/StudyViewScatterPlot";
import sessionServiceClient from "shared/api//sessionServiceInstance";
import {VirtualStudy} from 'shared/model/VirtualStudy';
import windowStore from 'shared/components/window/WindowStore';
import {getHeatmapMeta} from "../../shared/lib/MDACCUtils";
import {ChartDimension, ChartTypeEnum, STUDY_VIEW_CONFIG, StudyViewLayout} from "./StudyViewConfig";
import {
    getComparisonLoadingUrl,
    getMDAndersonHeatmapStudyMetaUrl,
    getStudyDownloadListUrl,
    redirectToComparisonPage
} from "../../shared/api/urls";
import onMobxPromise from "../../shared/lib/onMobxPromise";
import request from 'superagent';
import {trackStudyViewFilterEvent} from "../../shared/lib/tracking";
import {SessionGroupData} from "../../shared/api/ComparisonGroupClient";
import comparisonClient from "../../shared/api/comparisonGroupClientInstance";
import {
    finalizeStudiesAttr,
    getSampleIdentifiers, MAX_GROUPS_IN_SESSION,
    StudyViewComparisonGroup,
    splitData
} from "../groupComparison/GroupComparisonUtils";
import client from "../../shared/api/cbioportalClientInstance";
import {LoadingPhase} from "../groupComparison/GroupComparisonLoading";
import {sleepUntil} from "../../shared/lib/TimeUtils";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import MobxPromiseCache from "shared/lib/MobxPromiseCache";
import {CancerGene, Gene as OncokbGene} from "../../public-lib/api/generated/OncoKbAPI";
import {DataType} from "public-lib/components/downloadControls/DownloadControls";

import { AppStore } from 'AppStore';
import {
    getCnaUniqueKey,
    getMutationUniqueKey,
    parseCnaUniqueKey,
    parseMutationUniqueKey
} from "pages/studyView/TableUtils";
import { GeneTableRow } from './table/GeneTable';
import { getSelectedGroups, getStudiesAttr } from '../groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';

export type ChartUserSetting = {
    id: string,
    name?: string,
    chartType?: ChartType,
    groups?: CustomGroup[], //used when it is custom chart
    layout?: {
        x: number,
        y: number,
        w: number;
        h: number;
    },
    patientAttribute: boolean,
    filterByCancerGenes?: boolean,
    customBins?: number[],
    disableLogScale?: boolean
}

export type StudyPageSettings = {
    chartSettings:ChartUserSetting[],
    origin:string[]
}

export enum StudyViewPageTabKeyEnum {
    SUMMARY = 'summary',
    CLINICAL_DATA = 'clinicalData',
    HEATMAPS = 'heatmaps',
    CN_SEGMENTS = 'cnSegments'
}

export type StudyViewPageTabKey =
    StudyViewPageTabKeyEnum.CLINICAL_DATA | StudyViewPageTabKeyEnum.SUMMARY | StudyViewPageTabKeyEnum.HEATMAPS |
    StudyViewPageTabKeyEnum.CN_SEGMENTS;

export enum StudyViewPageTabDescriptions {
    SUMMARY = 'Summary',
    CLINICAL_DATA = 'Clinical Data',
    HEATMAPS = 'Heatmaps',
    CN_SEGMENTS = 'CN Segments'
}

const DEFAULT_CHART_NAME = 'Custom Chart';

export const MUTATION_COUNT = 'MUTATION_COUNT';
export const FRACTION_GENOME_ALTERED = 'FRACTION_GENOME_ALTERED';
export const OS_STATUS = "OS_STATUS";
export const OS_MONTHS = "OS_MONTHS";
export const DFS_STATUS = "DFS_STATUS";
export const DFS_MONTHS = "DFS_MONTHS";

export const SELECTED_ANALYSIS_GROUP_VALUE = "Selected";
export const UNSELECTED_ANALYSIS_GROUP_VALUE = "Unselected";

export type SurvivalType = {
    id: string,
    title: string,
    associatedAttrs: ['OS_STATUS', 'OS_MONTHS'] | ['DFS_STATUS', 'DFS_MONTHS'],
    filter: string[],
    survivalData: PatientSurvival[]
}

export type StudyViewURLQuery = {
    tab?: StudyViewPageTabKeyEnum,
    id?: string,
    studyId?: string,
    cancer_study_id?: string,
    filters?: string,
    filterAttributeId?: string,
    filterValues?: string
}

export type CustomGroup = {
    name: string,
    sampleIdentifiers: CustomChartIdentifier[]
}

export type CustomChart = {
    name?: string,
    patientAttribute: boolean,
    groups: CustomGroup[]
}

export const DataBinMethodConstants: {[key: string]: 'DYNAMIC' | 'STATIC'}= {
    STATIC: 'STATIC',
    DYNAMIC: 'DYNAMIC'
};

export type CustomChartIdentifier = {
    studyId: string,
    sampleId: string,
    patientId: string
}

export type CustomChartIdentifierWithValue = CustomChartIdentifier & {
    value: string
}

export type GeneIdentifier = {
    entrezGeneId: number,
    hugoGeneSymbol: string
}

export type CopyNumberAlterationIdentifier = CopyNumberGeneFilterElement & {
    hugoGeneSymbol: string
}

export type StatusMessage = {
    status: 'success' | 'warning' | 'danger' | 'info',
    message: string
};

export type OncokbCancerGene = {
    oncokbAnnotated: boolean;
    isOncokbOncogene: boolean;
    isOncokbTumorSuppressorGene: boolean;
    isCancerGene: boolean;
};

export class StudyViewPageStore {
    private reactionDisposers:IReactionDisposer[] = [];

    constructor(private appStore: AppStore, private sessionServiceIsEnabled: boolean) {
        this.reactionDisposers.push(reaction(() => this.loadingInitialDataForSummaryTab, () => {
            if (!this.loadingInitialDataForSummaryTab) {
                this.updateChartStats();
                this.loadUserSettings();
            }
        }));

        this.reactionDisposers.push(reaction(() => [this.visibleAttributes, this.columns, this.chartsDimension.toJS(), this.chartsType.toJS()], () => {
            this.updateLayout();
        }));

        this.reactionDisposers.push(reaction(() => toJS(this.currentChartSettingsMap), () => {
            if(this.isSavingUserSettingsPossible){
                if (!this.hideRestoreSettingsMsg) {
                    // hide restore message if its already shown
                    // this is because the user setting session is going to be updated for every operation once the user is logged in
                    this.hideRestoreSettingsMsg = true;
                }
                this.updateUserSettingsDebounce();
            }
        }));

        this.reactionDisposers.push(reaction(() => this.fetchUserSettings.isComplete, (isComplete) => {
            //execute if user log in from study page
            if (isComplete && this.isSavingUserPreferencePossible && !this._loadUserSettingsInitially) {
                this.previousSettings = this.currentChartSettingsMap;
                this.loadUserSettings();
            }
        }));

        this.reactionDisposers.push(reaction(() => this.uniqueEntrezGeneIdsInFilters, (uniqueEntrezGeneIds) => {
            this.getGenesInfo(uniqueEntrezGeneIds);
        }));

        // Include special charts into custom charts list
       SPECIAL_CHARTS.forEach((chartMeta:ChartMetaWithDimensionAndChartType) => {
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
                   priority: STUDY_VIEW_CONFIG.priority[uniqueKey] || chartMeta.priority
               });
               this.chartsType.set(uniqueKey, chartMeta.chartType);
               this.chartsDimension.set(uniqueKey, chartMeta.dimension);

               if (uniqueKey === UniqueKey.CANCER_STUDIES) {
                   this.customChartsPromises[uniqueKey] = this.cancerStudiesData;
               }
           }
       });
    }

    @computed
    get uniqueEntrezGeneIdsInFilters() {
        return _.uniq(
            _.flatten(
                this._mutatedGeneFilter.map(item => item.entrezGeneIds)
                    .concat(this._fusionGeneFilter.map(item => item.entrezGeneIds))
                    .concat(this._cnaGeneFilter.map(item => _.flatten(item.alterations.map(alteration => alteration.entrezGeneId))))
            ));
    }

    @action
    getGenesInfo(entrezGeneIds: number[]) {
        const unknownEntrezGeneIds = entrezGeneIds.filter(entrezGeneId => !this.geneMapCache[entrezGeneId]).map(entrezGeneId => entrezGeneId.toString());
        if (unknownEntrezGeneIds.length > 0) {
            client.fetchGenesUsingPOST({geneIdType: 'ENTREZ_GENE_ID', geneIds: unknownEntrezGeneIds})
                .then((genes: Gene[]) => {
                    genes.forEach(gene => {
                        this.geneMapCache[gene.entrezGeneId] = gene.hugoGeneSymbol;
                    })
                })
        }
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

    @observable.ref private _comparisonConfirmationModal:JSX.Element|null = null;
    public get comparisonConfirmationModal() {
        return this._comparisonConfirmationModal;
    }
    @autobind
    @action
    public setComparisonConfirmationModal(getModal:((hideModal:()=>void)=>JSX.Element)) {
        this._comparisonConfirmationModal = getModal(()=>{this._comparisonConfirmationModal = null; });
    }

    // <comparison groups code>
    private _selectedComparisonGroups = observable.shallowMap<boolean>();
    private _comparisonGroupsMarkedForDeletion = observable.shallowMap<boolean>();

    @action public setComparisonGroupSelected(groupId:string, selected=true) {
        this._selectedComparisonGroups.set(groupId, selected);
    }

    @action public toggleComparisonGroupSelected(groupId:string) {
        this.setComparisonGroupSelected(groupId, !this.isComparisonGroupSelected(groupId));
    }

    @action public toggleComparisonGroupMarkedForDeletion(groupId:string) {
        this._comparisonGroupsMarkedForDeletion.set(groupId, !this.isComparisonGroupMarkedForDeletion(groupId));
    }

    public isComparisonGroupSelected(groupId:string):boolean {
        if (this.isComparisonGroupMarkedForDeletion(groupId)) {
            return false; // if marked for deletion, its not selected
        } else if (!this._selectedComparisonGroups.has(groupId)) {
            return false; // default to unselected on page load
        } else {
            // otherwise, return value held in map
            return this._selectedComparisonGroups.get(groupId)!;
        }
    }

    public isComparisonGroupMarkedForDeletion(groupId:string):boolean {
        if (!this._comparisonGroupsMarkedForDeletion.has(groupId)) {
            return false; // default to no
        } else {
            // otherwise, return value held in map
            return this._comparisonGroupsMarkedForDeletion.get(groupId)!;
        }
    }

    @action public markSelectedGroupsForDeletion() {
        onMobxPromise(
            this.comparisonGroups,
            groups=>{
                for (const group of groups) {
                    if (this.isComparisonGroupSelected(group.uid)) {
                        this.toggleComparisonGroupMarkedForDeletion(group.uid);
                    }
                }
            }
        );
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
        await:()=>[this.sampleSet],
        invoke:async()=>{
            // reference this so its responsive to changes
            this._comparisonGroupsChangeCount;
            if (this.studyIds.length > 0) {
                const groups = await comparisonClient.getGroupsForStudies(this.studyIds.slice()); // slice because cant pass mobx
                return groups.map(group=>Object.assign(group.data, { uid: group.id }, finalizeStudiesAttr(group.data, this.sampleSet.result!)));
            } else {
                return [];
            }
        }
    });

    @observable private _comparisonGroupsChangeCount = 0;
    @action public notifyComparisonGroupsChange() {
        this._comparisonGroupsChangeCount += 1;
    }

    private async createNumberAttributeComparisonSession(
        clinicalAttribute:ClinicalAttribute,
        categorizationType: NumericalGroupComparisonType,
        statusCallback:(phase:LoadingPhase)=>void
    ) {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);
        return new Promise<string>((resolve)=>{
            onMobxPromise<any>([this.selectedSamples, this.clinicalDataBinPromises[getClinicalAttributeUniqueKey(clinicalAttribute)]],
                async (selectedSamples:Sample[], dataBins:DataBin[])=>{
                    // get clinical data for the given attribute
                    const entityIdKey = (clinicalAttribute.patientAttribute ? "patientId" : "sampleId");
                    let data = await client.fetchClinicalDataUsingPOST({
                        clinicalDataType: clinicalAttribute.patientAttribute ? "PATIENT" : "SAMPLE",
                        clinicalDataMultiStudyFilter: {
                            attributeIds: [clinicalAttribute.clinicalAttributeId],
                            identifiers: selectedSamples.map(s=>({ studyId: s.studyId, entityId: s[entityIdKey] }))
                        }
                    });

                    let groups: SessionGroupData[] = [];
                    let clinicalAttributeName = '';

                    switch (categorizationType) {
                        case NumericalGroupComparisonType.BINS:
                            groups = getGroupsFromBins(selectedSamples, clinicalAttribute.patientAttribute, data, dataBins, this.studyIds);
                            clinicalAttributeName = `Bins of ${clinicalAttribute.displayName}`
                            break;
                        case NumericalGroupComparisonType.MEDIAN:
                            groups = getGroupsFromQuartiles(selectedSamples, clinicalAttribute.patientAttribute, splitData(data,2), this.studyIds);
                            clinicalAttributeName = `Median of ${clinicalAttribute.displayName}`;
                            break;
                        case NumericalGroupComparisonType.QUARTILES:
                        default:
                            groups = getGroupsFromQuartiles(selectedSamples, clinicalAttribute.patientAttribute, splitData(data,4), this.studyIds);
                            clinicalAttributeName = `Quartiles of ${clinicalAttribute.displayName}`;
                    }

                    statusCallback(LoadingPhase.CREATING_SESSION);
                    // create session and get id
                    const {id} = await comparisonClient.addComparisonSession({
                        groups,
                        clinicalAttributeName,
                        origin:this.studyIds,
                        groupNameOrder: groups.map(g=>g.name)
                    });
                    return resolve(id);
                }
            );
        });
    }

    private createSpecialChartComparisonSession(
        chartMeta: ChartMeta,
        statusCallback:(phase:LoadingPhase)=>void
    ) {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);
        // for now, the only one possible is cancer studies
        return new Promise<string>(resolve=>{
            onMobxPromise<any>([this.selectedSamples, this.cancerStudiesData],
                async (selectedSamples:Sample[], cancerStudiesData:ClinicalDataCountSummary[])=>{

                    // group samples by study
                    const studyIdToSamples:{[studyId:string]:Sample[]} = _.groupBy(selectedSamples, s=>s.studyId);
                    const studyIdToCountWithColor = _.keyBy(cancerStudiesData, s=>s.value);
                    const groups = _.map(studyIdToSamples, (samples, studyId)=>{
                        return {
                            name: studyId,
                            description: "",
                            studies: getStudiesAttr(samples),
                            origin: this.studyIds,
                            color: studyIdToCountWithColor[studyId].color
                        };
                    });

                    // create session and get id
                    const {id} = await comparisonClient.addComparisonSession({
                        groups,
                        clinicalAttributeName: chartMeta.displayName,
                        origin: this.studyIds
                    });
                    return resolve(id);
                }
            );
        });
    }

    private createStringAttributeComparisonSession(
        clinicalAttribute:ClinicalAttribute,
        clinicalAttributeValues:ClinicalDataCountSummary[],
        statusCallback:(phase:LoadingPhase)=>void
    ) {
        statusCallback(LoadingPhase.DOWNLOADING_GROUPS);
        return new Promise<string>((resolve)=>{
            onMobxPromise(this.selectedSamples,
                async (selectedSamples)=>{
                    // get clinical data for the given attribute
                    const entityIdKey = (clinicalAttribute.patientAttribute ? "patientId" : "sampleId")
                    const data = await client.fetchClinicalDataUsingPOST({
                        clinicalDataType: clinicalAttribute.patientAttribute ? "PATIENT" : "SAMPLE",
                        clinicalDataMultiStudyFilter: {
                            attributeIds: [clinicalAttribute.clinicalAttributeId],
                            identifiers: selectedSamples.map(s=>({ studyId: s.studyId, entityId: s[entityIdKey] }))
                        }
                    });

                    const lcValueToValue:{[lowerCaseValue:string]:string} = {};
                    const lcValueToColor = _.keyBy(clinicalAttributeValues, d=>d.value.toLowerCase());
                    let lcValueToSampleIdentifiers:{[value:string]:SampleIdentifier[]} = {};
                    if (clinicalAttribute.patientAttribute) {
                        const patientKeyToData = _.keyBy(data, (d:ClinicalData)=>d.uniquePatientKey);
                        for (const sample of selectedSamples) {
                            const datum = patientKeyToData[sample.uniquePatientKey];
                            const value = datum ? datum.value : "NA";
                            const lcValue = value.toLowerCase();
                            lcValueToValue[lcValue] = lcValueToValue[lcValue] || value;
                            lcValueToSampleIdentifiers[lcValue] = lcValueToSampleIdentifiers[lcValue] || [];
                            lcValueToSampleIdentifiers[lcValue].push({
                                sampleId: sample.sampleId,
                                studyId: sample.studyId
                            });
                        }
                    } else {
                        lcValueToSampleIdentifiers = _.groupBy(data, (d:ClinicalData)=>{
                            const value = d.value;
                            const lcValue = value.toLowerCase();
                            lcValueToValue[lcValue] = lcValueToValue[lcValue] || value;
                            return lcValue;
                        });
                    }

                    statusCallback(LoadingPhase.CREATING_SESSION);

                    // create groups using data - up to MAX_GROUPS_IN_SESSION - ordered by size
                    const groups:SessionGroupData[] = [];
                    const sortedAttrVals = _.sortBy(clinicalAttributeValues, attrVal=>-attrVal.count);
                    for (const attrVal of sortedAttrVals) {
                        if (groups.length >= MAX_GROUPS_IN_SESSION) {
                            break;
                        }

                        const lcValue = attrVal.value.toLowerCase();
                        const sampleIdentifiers = lcValueToSampleIdentifiers[lcValue];
                        if (sampleIdentifiers && sampleIdentifiers.length > 0) {
                            groups.push({
                                name: attrVal.value,
                                description: "",
                                studies: getStudiesAttr(sampleIdentifiers),
                                origin: this.studyIds,
                                color: lcValueToColor[lcValue].color,
                            });
                        }
                    }
                    // create session and get id
                    const {id} = await comparisonClient.addComparisonSession({
                        groups,
                        clinicalAttributeName: clinicalAttribute.displayName,
                        origin: this.studyIds
                    });
                    return resolve(id);
                }
            );
        });
    }

    @autobind
    public async openComparisonPage(params:{
        chartMeta: ChartMeta,
        categorizationType?: NumericalGroupComparisonType
        clinicalAttributeValues?: ClinicalDataCountSummary[]
    }) {
        // open window before the first `await` call - this makes it a synchronous window.open,
        //  which doesnt trigger pop-up blockers. We'll send it to the correct url once we get the result
        const comparisonWindow:any = window.open(getComparisonLoadingUrl({
            phase: LoadingPhase.DOWNLOADING_GROUPS,
            clinicalAttributeName: params.chartMeta.displayName,
            origin: this.studyIds.join(",")
        }), "_blank");

        // wait until the new window has routingStore available, or its closed
        await sleepUntil(()=>{
            return comparisonWindow.closed ||
                (comparisonWindow.globalStores && comparisonWindow.globalStores.appStore.appReady);
        });

        if (comparisonWindow.closed) {
            // cancel if the windows already closed
            return;
        }

        // set up ping by which the new window can infer whether the study view window has been closed, and
        //  show an error accordingly
        const pingInterval = setInterval(()=>{
            try {
                if (!comparisonWindow.closed) {
                    comparisonWindow.ping();
                }
            } catch (e) {
                clearInterval(pingInterval);
            }
        }, 500);

        // save comparison session, and get id
        let sessionId:string;
        const statusCallback = (phase:LoadingPhase)=>{
            if (!comparisonWindow.closed) {
                comparisonWindow.routingStore.updateRoute({phase}, undefined, false);
            }
        };

        if (isSpecialChart(params.chartMeta)) {
            sessionId = await this.createSpecialChartComparisonSession(
                params.chartMeta,
                statusCallback
            );
        } else {
            switch (this.chartsType.get(params.chartMeta.uniqueKey)) {
                case ChartTypeEnum.PIE_CHART:
                case ChartTypeEnum.TABLE:
                    sessionId =
                        await this.createStringAttributeComparisonSession(
                            params.chartMeta.clinicalAttribute!,
                            params.clinicalAttributeValues!,
                            statusCallback
                        );
                    break;
                default:
                    sessionId =
                        await this.createNumberAttributeComparisonSession(
                            params.chartMeta.clinicalAttribute!,
                            params.categorizationType || NumericalGroupComparisonType.QUARTILES,
                            statusCallback
                        );
                    break;
            }
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

    @observable private sampleIdentifiers: SampleIdentifier[] = [];

    private _clinicalDataEqualityFilterSet = observable.shallowMap<ClinicalDataEqualityFilter>();
    private _clinicalDataIntervalFilterSet = observable.shallowMap<ClinicalDataIntervalFilter>();

    @observable private _clinicalDataBinFilterSet = observable.map<ClinicalDataBinFilter>();

    @observable.ref private _mutatedGeneFilter: MutationGeneFilter[] = [];
    @observable.ref private _fusionGeneFilter: FusionGeneFilter[] = [];
    @observable.ref private _cnaGeneFilter: CopyNumberGeneFilter[] = [];
    @observable private _mutationCountVsCNAFilter:RectangleBounds|undefined;

    @observable private _withMutationDataFilter: boolean | undefined;
    @observable private _withCNADataFilter: boolean | undefined;

    // TODO: make it computed
    // Currently the study view store does not have the full control of the promise.
    // ChartContainer should be modified, instead of accepting a promise, it should accept data and loading state.
    @observable private _chartVisibility = observable.map<boolean>();

    @observable geneQueryStr: string;

    @observable private geneQueries: SingleGeneQuery[] = [];

    private geneMapCache:{[entrezGeneId:number]:string} = {};

    @observable public chartsDimension = observable.map<ChartDimension>();

    @observable public chartsType = observable.map<ChartType>();

    private newlyAddedCharts = observable.array<string>();

    private unfilteredClinicalDataCountCache: { [uniqueKey: string]: ClinicalDataCountItem } = {};
    private unfilteredClinicalDataBinCountCache: { [uniqueKey: string]: DataBin[] } = {};

    @observable currentTab: StudyViewPageTabKey;

    @action
    updateCurrentTab(newTabId: StudyViewPageTabKey | undefined) {
        this.currentTab = newTabId === undefined ? StudyViewPageTabKeyEnum.SUMMARY : newTabId;
    }

    @observable pageStatusMessages: { [code: string]: StatusMessage } = {};

    public isNewlyAdded(uniqueKey:string) {
        return this.newlyAddedCharts.includes(uniqueKey);
    }

    @action
    updateStoreByFilters(filters:Partial<StudyViewFilter>) {
        if (_.isArray(filters.clinicalDataEqualityFilters) && filters.clinicalDataEqualityFilters.length > 0) {
            _.each(filters.clinicalDataEqualityFilters, (filter: ClinicalDataEqualityFilter) => {
                this._clinicalDataEqualityFilterSet.set(getClinicalAttributeUniqueKeyByDataTypeAttrId(filter.clinicalDataType, filter.attributeId), {
                    attributeId: filter.attributeId,
                    clinicalDataType: filter.clinicalDataType,
                    values: _.reduce(filter.values, (acc, next) => {
                        acc.push(next);
                        return acc;
                    }, [] as string[])
                });
            });
        }

        if (_.isArray(filters.clinicalDataIntervalFilters) && filters.clinicalDataIntervalFilters.length > 0) {
            _.each(filters.clinicalDataIntervalFilters, (filter: ClinicalDataIntervalFilter) => {
                this._clinicalDataIntervalFilterSet.set(getClinicalAttributeUniqueKeyByDataTypeAttrId(filter.clinicalDataType, filter.attributeId), {
                    attributeId: filter.attributeId,
                    clinicalDataType: filter.clinicalDataType,
                    values: _.reduce(filter.values, (acc, next) => {
                        acc.push({
                            end: next.end,
                            start: next.start,
                            value: next.value
                        });
                        return acc;
                    }, [] as ClinicalDataIntervalFilterValue[])
                });
            });
        }

        if (_.isArray(filters.mutatedGenes) && filters.mutatedGenes.length > 0) {
            this._mutatedGeneFilter = filters.mutatedGenes.map(mutationGene => {
                return {
                    entrezGeneIds: _.clone(mutationGene.entrezGeneIds)
                }
            });
        }

        if (_.isArray(filters.fusionGenes) && filters.fusionGenes.length > 0) {
            this._fusionGeneFilter = filters.fusionGenes.map(fusionGene => {
                return {
                    entrezGeneIds: _.clone(fusionGene.entrezGeneIds)
                }
            });
        }

        if (_.isArray(filters.cnaGenes) && filters.cnaGenes.length > 0) {
            this._cnaGeneFilter = filters.cnaGenes.map(cnaGene => {
                return {
                    alterations: _.cloneDeep(cnaGene.alterations)
                };
            });
        }
        if (_.isArray(filters.sampleIdentifiers) && filters.sampleIdentifiers.length > 0) {
            this.numberOfSelectedSamplesInCustomSelection = filters.sampleIdentifiers.length;
            this.updateChartSampleIdentifierFilter(UniqueKey.CUSTOM_SELECT, filters.sampleIdentifiers, false);
        }

        if (filters.mutationCountVsCNASelection) {
            this._mutationCountVsCNAFilter = filters.mutationCountVsCNASelection;
        }

        if (filters.withCNAData !== undefined) {
            this._withCNADataFilter = filters.withCNAData;
            const value = filters.withCNAData ? Datalabel.YES : Datalabel.NO;
            this.customChartFilterSet.set(UniqueKey.WITH_CNA_DATA, [value]);
        }

        if (filters.withMutationData !== undefined) {
            this._withMutationDataFilter = filters.withMutationData;
            const value = filters.withMutationData ? Datalabel.YES : Datalabel.NO;
            this.customChartFilterSet.set(UniqueKey.WITH_MUTATION_DATA, [value]);
        }

        if(!_.isEqual(toJS(this.initialFiltersQuery), filters)) {
            this.initialFiltersQuery = filters;
        }
    }

    @action
    async updateStoreFromURL(query: StudyViewURLQuery) {
        let studyIdsString:string = '';
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
            studyIds = studyIdsString.trim().split(",");
            if (!_.isEqual(studyIds, toJS(this.studyIds))) {
                // update if different
                this.studyIds = studyIds;
            }
        }

        // We do not support studyIds in the query filters
        let filters: Partial<StudyViewFilter> = {};
        if (query.filters) {
            try {
                filters = JSON.parse(decodeURIComponent(query.filters)) as Partial<StudyViewFilter>;
                this.updateStoreByFilters(filters);
            } catch (e) { }
        } else if (query.filterAttributeId && query.filterValues) {
            const clinicalAttributes = _.uniqBy(await defaultClient.fetchClinicalAttributesUsingPOST({
                studyIds: studyIds
            }), clinicalAttribute => `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`);

            const matchedAttr = _.find(clinicalAttributes, (attr: ClinicalAttribute) => attr.clinicalAttributeId.toUpperCase() === query.filterAttributeId!.toUpperCase());
            if (matchedAttr !== undefined) {
                if (matchedAttr.datatype == "NUMBER") {
                    filters.clinicalDataIntervalFilters = [{
                        'attributeId': matchedAttr.clinicalAttributeId,
                        'clinicalDataType': matchedAttr.patientAttribute ? ClinicalDataTypeEnum.PATIENT : ClinicalDataTypeEnum.SAMPLE,
                        'values': query.filterValues!.split(',').map(range => {
                            const convertResult = range.split('-');
                            return {
                                start: Number(convertResult[0]),
                                end: Number(convertResult[1])
                            } as ClinicalDataIntervalFilterValue
                        })
                    } as ClinicalDataIntervalFilter];
                } else {
                    filters.clinicalDataEqualityFilters = [{
                        'attributeId': matchedAttr.clinicalAttributeId,
                        'clinicalDataType': matchedAttr.patientAttribute ? ClinicalDataTypeEnum.PATIENT : ClinicalDataTypeEnum.SAMPLE,
                        'values': getClinicalEqualityFilterValuesByString(query.filterValues)
                    } as ClinicalDataEqualityFilter];
                }
                this.updateStoreByFilters(filters);
            } else {
                this.pageStatusMessages['unknownClinicalAttribute'] = {
                    message: `The clinical attribute ${query.filterAttributeId} is not available for this study`,
                    status: 'danger'
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

        return Object.assign({}, this.initialFiltersQuery, initialFilter);
    }

    @computed
    get isInitialFilterState(): boolean {
        return _.isEqual(toJS(this.initialFilters), toJS(this.filters));
    }

    @computed
    get containerWidth(): number {
        return this.columns * STUDY_VIEW_CONFIG.layout.grid.w + (this.columns + 1) * STUDY_VIEW_CONFIG.layout.gridMargin.x;
    }

    @computed
    private get columns(): number {
        return Math.floor((windowStore.size.width - 40) / (STUDY_VIEW_CONFIG.layout.grid.w + STUDY_VIEW_CONFIG.layout.gridMargin.x));
    }

    @autobind @action
    private updateLayout() {
        this.currentGridLayout = calculateLayout(this.visibleAttributes, this.columns, this.chartsDimension.toJS(), this.useCurrentGridLayout ? this.currentGridLayout : [], this.currentFocusedChartByUser, this.currentFocusedChartByUserDimension);
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
            dimensions: STUDY_VIEW_CONFIG.layout.dimensions
        };
    }

    @autobind @action
    updateCurrentGridLayout(newGridLayout: ReactGridLayout.Layout[]) {
        this.currentGridLayout = newGridLayout;
    }

    //this variable is acts as flag whether to use it as a currentGridLayout in updating layout
    private useCurrentGridLayout = false;

    @observable.ref private currentGridLayout: ReactGridLayout.Layout[] = [];
    //@observable private currentGridLayoutUpdated = false;
    @observable private previousSettings: { [id: string]: ChartUserSetting } = {};

    private currentFocusedChartByUser: ChartMeta | undefined = undefined;
    private currentFocusedChartByUserDimension: ChartDimension | undefined = undefined;

    public clinicalDataBinPromises: { [id: string]: MobxPromise<DataBin[]> } = {};
    public clinicalDataCountPromises: { [id: string]: MobxPromise<ClinicalDataCountSummary[]> } = {};
    public customChartsPromises: { [id: string]: MobxPromise<ClinicalDataCountSummary[]> } = {};

    private _chartSampleIdentifiersFilterSet =  observable.map<SampleIdentifier[]>();

    public customChartFilterSet =  observable.map<string[]>();

    @observable numberOfSelectedSamplesInCustomSelection: number = 0;
    @observable _filterComparisonGroups:StudyViewComparisonGroup[] = [];

    @observable private _filterMutatedGenesTableByCancerGenes: boolean = true;
    @observable private _filterFusionGenesTableByCancerGenes: boolean = true;
    @observable private _filterCNAGenesTableByCancerGenes: boolean = true;

    @autobind
    @action updateMutatedGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterMutatedGenesTableByCancerGenes = filtered;
    }
    @autobind
    @action updateFusionGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterFusionGenesTableByCancerGenes = filtered;
    }

    @autobind
    @action updateCNAGenesTableByCancerGenesFilter(filtered: boolean) {
        this._filterCNAGenesTableByCancerGenes = filtered;
    }

    @computed get filterMutatedGenesTableByCancerGenes() {
        return this.oncokbCancerGeneFilterEnabled && this._filterMutatedGenesTableByCancerGenes;
    }

    @computed get filterFusionGenesTableByCancerGenes() {
        return this.oncokbCancerGeneFilterEnabled && this._filterFusionGenesTableByCancerGenes;
    }

    @computed get filterCNAGenesTableByCancerGenes() {
        return this.oncokbCancerGeneFilterEnabled && this._filterCNAGenesTableByCancerGenes;
    }

    public get filterComparisonGroups() {
        return this._filterComparisonGroups;
    }

    @action public updateComparisonGroupsFilter() {
        onMobxPromise(
            this.comparisonGroups,
            comparisonGroups=>{
                this._filterComparisonGroups = getSelectedGroups(comparisonGroups, this);
                this.updateChartSampleIdentifierFilter(
                    UniqueKey.SELECTED_COMPARISON_GROUPS,
                    getSampleIdentifiers(
                        this._filterComparisonGroups
                    )
                );
            }
        )
    }

    //used in saving custom added charts
    @observable private _customChartMap = observable.shallowMap<CustomChart>();
    @observable private _customCharts = observable.shallowMap<ChartMeta>();
    @observable private _customChartsSelectedCases = observable.shallowMap<CustomChartIdentifierWithValue[]>();

    @autobind
    @action onCheckGene(hugoGeneSymbol: string) {
        //only update geneQueryStr whenever a table gene is clicked.
        this.geneQueries = updateGeneQuery(this.geneQueries, hugoGeneSymbol);
        this.geneQueryStr = this.geneQueries.map(query=>unparseOQLQueryLine(query)).join(' ');
    }

    @computed get selectedGenes(): string[] {
        return this.geneQueries.map(singleGeneQuery=>singleGeneQuery.gene);
    }

    @autobind
    @action updateSelectedGenes(query: SingleGeneQuery[], queryStr: string) {
        this.geneQueries = query;
        this.geneQueryStr = queryStr;
    }

    @autobind
    getKnownHugoGeneSymbolByEntrezGeneId(entrezGeneId: number): string | undefined {
        return this.geneMapCache[entrezGeneId];
    }

    @autobind
    @action
    clearMutatedGeneFilter() {
        this._mutatedGeneFilter = [];
    }

    @autobind
    @action
    clearFusionGeneFilter() {
        this._fusionGeneFilter = [];
    }

    @autobind
    @action
    clearCNAGeneFilter() {
        this._cnaGeneFilter = [];
    }

    @autobind
    @action
    clearChartSampleIdentifierFilter(chartMeta: ChartMeta) {
        this._chartSampleIdentifiersFilterSet.delete(chartMeta.uniqueKey)
        this.customChartFilterSet.delete(chartMeta.uniqueKey)
    }

    @autobind
    @action
    clearAllFilters() {
        this._clinicalDataEqualityFilterSet.clear();
        this._clinicalDataIntervalFilterSet.clear();
        this.clearMutatedGeneFilter();
        this.clearFusionGeneFilter();
        this.clearCNAGeneFilter();
        this.resetMutationCountVsCNAFilter();
        this._chartSampleIdentifiersFilterSet.clear();
        this.customChartFilterSet.clear();
        this._withMutationDataFilter = undefined;
        this._withCNADataFilter = undefined;
        this.numberOfSelectedSamplesInCustomSelection = 0;
        this.removeComparisonGroupSelectionFilter();
    }

    @autobind
    @action
    toggleWithMutationDataFilter() {
        let isSelected = !this._withMutationDataFilter;
        this._withMutationDataFilter = isSelected;
        if (isSelected) {
            trackStudyViewFilterEvent("withMutationQuickFilter", this);
            this.customChartFilterSet.set(UniqueKey.WITH_MUTATION_DATA, [Datalabel.YES]);
        } else {
            this.customChartFilterSet.delete(UniqueKey.WITH_MUTATION_DATA);
        }
    }

    @autobind
    @action
    toggleWithCNADataFilter() {
        let isSelected = !this._withCNADataFilter;
        this._withCNADataFilter = isSelected;
        if (isSelected) {
            trackStudyViewFilterEvent("withCNADataQuickFilter", this);
            this.customChartFilterSet.set(UniqueKey.WITH_CNA_DATA, [Datalabel.YES]);
        } else {
            this.customChartFilterSet.delete(UniqueKey.WITH_CNA_DATA);
        }
    }

    @autobind
    @action
    removeWithMutationDataFilter() {
        this._withMutationDataFilter = undefined;
    }

    @autobind
    @action
    removeWithCNADataFilter() {
        this._withCNADataFilter = undefined;
    }

    @computed
    get analysisGroupsSettings() {
        // analysis groups for selected/unselected
        // unselected goes on bottom, selected should be rendered on top
        return {
            groups: [{
                value: SELECTED_ANALYSIS_GROUP_VALUE,
                // In the initial load when no case selected(the same affect of all cases selected), the curve should be shown as blue instead of red
                color: STUDY_VIEW_CONFIG.colors.theme.unselectedGroup,
                name: this.chartsAreFiltered ? "Selected patients" : "All patients"
            }] as AnalysisGroup[]
        }
    }

    readonly sampleToAnalysisGroup = remoteData({
        await:()=>[this.samples, this.selectedSamples],
        invoke:()=>{
            const selectedSamplesMap = _.keyBy(this.selectedSamples.result!, s=>s.uniqueSampleKey);
            return Promise.resolve(_.reduce(this.samples.result!, (map, nextSample)=>{
                const sampleKey = nextSample.uniqueSampleKey;
                if (sampleKey in selectedSamplesMap) {
                    map[sampleKey] = SELECTED_ANALYSIS_GROUP_VALUE;
                } else {
                    map[sampleKey] = UNSELECTED_ANALYSIS_GROUP_VALUE;
                }
                return map;
            }, {} as {[sampleKey:string]:string}));
        }
    });

    readonly patientToAnalysisGroup = remoteData<{[patientKey:string]:string}>({
        await:()=>[this.samples, this.selectedPatientKeys],
        invoke:()=>{
            const selectedPatientsMap = _.keyBy(this.selectedPatientKeys.result!);
            return Promise.resolve(_.reduce(this.samples.result!, (map, nextSample)=>{
                const patientKey = nextSample.uniquePatientKey;
                if (patientKey in selectedPatientsMap) {
                    map[patientKey] = SELECTED_ANALYSIS_GROUP_VALUE;
                }
                return map;
            }, {} as {[patientKey:string]:string}));
        }
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
        default: false
    });

    @autobind
    @action
    updateClinicalDataEqualityFilters(chartMeta: ChartMeta, values: string[]) {

        trackStudyViewFilterEvent("clinicalDataEquality", this);

        if (values.length > 0) {
            let clinicalDataEqualityFilter = {
                attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                clinicalDataType: getClinicalDataType(chartMeta.clinicalAttribute!.patientAttribute),
                values: values.sort()
            };
            this._clinicalDataEqualityFilterSet.set(chartMeta.uniqueKey, clinicalDataEqualityFilter);

        } else {
            this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
        }
    }

    @action
    updateClinicalDataIntervalFilters(chartMeta: ChartMeta, dataBins: DataBin[]) {

        trackStudyViewFilterEvent("clinicalDataInterval", this);

        const values: ClinicalDataIntervalFilterValue[] = getClinicalDataIntervalFilterValues(dataBins);
        this.updateClinicalDataIntervalFiltersByValues(chartMeta, values);
    }

    @autobind
    @action
    updateClinicalDataIntervalFiltersByValues(chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) {
        if (values.length > 0) {
            const clinicalDataIntervalFilter = {
                attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                clinicalDataType: getClinicalDataType(chartMeta.clinicalAttribute!.patientAttribute),
                values: values
            };
            this._clinicalDataIntervalFilterSet.set(chartMeta.uniqueKey, clinicalDataIntervalFilter);

        } else {
            this._clinicalDataIntervalFilterSet.delete(chartMeta.uniqueKey);
        }
    }

    @autobind
    @action
    addGeneFilters(uniqueKeys: string[]) {
        const genes = uniqueKeys.map(uniqueKey => parseMutationUniqueKey(uniqueKey));

        trackStudyViewFilterEvent("geneFilter", this);

        genes.forEach(gene => this.geneMapCache[gene.entrezGeneId] = gene.hugoGeneSymbol);
        this._mutatedGeneFilter = [...this._mutatedGeneFilter, {entrezGeneIds: genes.map(gene => gene.entrezGeneId)}];
    }

    @autobind
    @action
    removeMutatedGeneFilter(toBeRemoved: number) {
        this._mutatedGeneFilter = _.reduce(this._mutatedGeneFilter, (acc, next) => {
            const newGroup = _.reduce(next.entrezGeneIds, (list, entrezGeneId) => {
                if (entrezGeneId !== toBeRemoved) {
                    list.push(entrezGeneId);
                }
                return list;
            }, [] as number[]);
            if (newGroup.length > 0) {
                acc.push({
                    entrezGeneIds: newGroup
                });
            }
            return acc;
        }, [] as MutationGeneFilter[]);
    }

    @autobind
    @action resetMutatedGeneFilter() {
        if(this._mutatedGeneFilter.length > 0) {
            this._mutatedGeneFilter = [];
        }
    }

    @autobind
    @action
    addFusionGeneFilters(uniqueKeys: string[]) {
        const genes = uniqueKeys.map(uniqueKey => parseMutationUniqueKey(uniqueKey));

        trackStudyViewFilterEvent("geneFilter", this);

        genes.forEach(gene => this.geneMapCache[gene.entrezGeneId] = gene.hugoGeneSymbol);
        this._fusionGeneFilter = [...this._fusionGeneFilter, {entrezGeneIds: genes.map(gene => gene.entrezGeneId)}];
    }

    @autobind
    @action
    removeFusionGeneFilter(entrezIdToBeRemoved: number) {
        this._fusionGeneFilter = _.reduce(this._fusionGeneFilter, (acc, next) => {
            const newGroup = next.entrezGeneIds.filter(entrezGeneId => entrezGeneId !== entrezIdToBeRemoved);
            if (newGroup.length > 0) {
                acc.push({
                    entrezGeneIds: newGroup
                });
            }
            return acc;
        }, [] as FusionGeneFilter[]);
    }

    @autobind
    @action resetFusionGeneFilter() {
        if(this._fusionGeneFilter.length > 0) {
            this._fusionGeneFilter = [];
        }
    }

    @autobind
    @action
    updateChartSampleIdentifierFilter(chartKey:string, cases: SampleIdentifier[], keepCurrent?:boolean) {

        let newSampleIdentifiers:SampleIdentifier[] = cases;
        const newSampleIdentifiersMap = _.keyBy(newSampleIdentifiers, s=>`${s.studyId}:${s.sampleId}`);
        if (keepCurrent) {
            // if we should keep the current selection, go through and add samples back, taking care not to duplicate
            newSampleIdentifiers = _.reduce(this._chartSampleIdentifiersFilterSet.get(chartKey)|| [],(acc, s)=>{
                if (!(`${s.studyId}:${s.sampleId}` in newSampleIdentifiersMap)) {
                    acc.push(s);
                }
                return acc
            }, newSampleIdentifiers);
        }

        if(_.isEmpty(newSampleIdentifiers)){
            this._chartSampleIdentifiersFilterSet.delete(chartKey)
        } else {
            this._chartSampleIdentifiersFilterSet.set(chartKey,newSampleIdentifiers)
        }
    }

    public getChartSampleIdentifiersFilter(chartKey:string) {
        //return this._sampleIdentifiers;
        return this._chartSampleIdentifiersFilterSet.get(chartKey)|| [];
    }

    public getCustomChartFilters(chartKey:string) {
        return this.customChartFilterSet.get(chartKey)|| [];
    }

    public newCustomChartUniqueKey():string {
        return `CUSTOM_FILTERS_${this._customCharts.keys().length}`;
    }

    public isCustomChart(uniqueKey:string):boolean {
        return this._customCharts.has(uniqueKey);
    }

    @autobind
    @action
    addCNAGeneFilters(uniqueKeys: string[]) {
        const filters = uniqueKeys.map(uniqueKey => parseCnaUniqueKey(uniqueKey));
        trackStudyViewFilterEvent("cnaGene", this);

        filters.forEach(filter => this.geneMapCache[filter.entrezGeneId]  = filter.hugoGeneSymbol);
        this._cnaGeneFilter = [...this._cnaGeneFilter, {
            alterations: filters.map(filter => {
                return {
                    alteration: filter.alteration,
                    entrezGeneId: filter.entrezGeneId
                } as CopyNumberGeneFilterElement
            })
        }];
    }

    @autobind
    @action
    removeCNAGeneFilters(toBeRemoved: CopyNumberGeneFilterElement) {
        this._cnaGeneFilter = _.reduce(this._cnaGeneFilter, (acc, next) => {
            const newGroup = _.reduce(next.alterations, (list, filter) => {
                if (filter.entrezGeneId !== toBeRemoved.entrezGeneId && filter.alteration !== toBeRemoved.alteration) {
                    list.push(filter);
                }
                return list;
            }, [] as CopyNumberGeneFilterElement[]);
            if (newGroup.length > 0) {
                acc.push({
                    alterations: newGroup
                });
            }
            return acc;
        }, [] as CopyNumberGeneFilter[]);
    }

    @autobind
    @action
    resetCNAGeneFilter() {
        if(this._cnaGeneFilter.length > 0) {
            this._cnaGeneFilter = [];
        }
    }

    public getMutationCountVsCNAFilter() {
        if (this._mutationCountVsCNAFilter) {
            return Object.assign({}, this._mutationCountVsCNAFilter);
        } else {
            return undefined;
        }
    }

    @autobind
    @action
    setMutationCountVsCNAFilter(bounds:RectangleBounds) {

        trackStudyViewFilterEvent("mutationCountVsCNA", this);

        this._mutationCountVsCNAFilter = bounds;
    }

    @autobind
    @action
    resetMutationCountVsCNAFilter() {
        this._mutationCountVsCNAFilter = undefined;
    }

    @action
    changeChartVisibility(uniqueKey:string, visible: boolean) {
        if(visible){
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
    resetFilterAndChangeChartVisibility(chartMeta: ChartMeta, visible: boolean) {
        if (!visible) {
            switch (this.chartsType.get(chartMeta.uniqueKey)) {
                case ChartTypeEnum.MUTATED_GENES_TABLE:
                    this.resetMutatedGeneFilter();
                    break;
                case ChartTypeEnum.FUSION_GENES_TABLE:
                    this.resetFusionGeneFilter();
                    break;
                case ChartTypeEnum.CNA_GENES_TABLE:
                    this.resetCNAGeneFilter();
                    break;
                case ChartTypeEnum.SCATTER:
                    this._chartSampleIdentifiersFilterSet.delete(chartMeta.uniqueKey)
                    if (chartMeta.uniqueKey === UniqueKey.MUTATION_COUNT_CNA_FRACTION) {
                        this.resetMutationCountVsCNAFilter();
                    }
                    break;
                case ChartTypeEnum.SURVIVAL:
                    break;
                default:
                    if(chartMeta.uniqueKey === UniqueKey.WITH_MUTATION_DATA) {
                        this._withMutationDataFilter = undefined;
                    }
                    if(chartMeta.uniqueKey === UniqueKey.WITH_CNA_DATA) {
                        this._withCNADataFilter = undefined;
                    }
                    this._clinicalDataEqualityFilterSet.delete(chartMeta.uniqueKey);
                    this._clinicalDataIntervalFilterSet.delete(chartMeta.uniqueKey);
                    this.clearChartSampleIdentifierFilter(chartMeta);

                    break;
            }
        }
        this.changeChartVisibility(chartMeta.uniqueKey, visible);
    }

    @autobind
    @action
    removeComparisonGroupSelectionFilter() {
        this._chartSampleIdentifiersFilterSet.delete(UniqueKey.SELECTED_COMPARISON_GROUPS);
        this._filterComparisonGroups = [];
    }

    @autobind
    @action
    removeCustomSelectFilter() {
        this._chartSampleIdentifiersFilterSet.delete(UniqueKey.CUSTOM_SELECT);
        this.numberOfSelectedSamplesInCustomSelection = 0;
    }

    @action
    toggleLogScale(chartMeta: ChartMeta) {
        // reset filters before toggling
        this.updateClinicalDataIntervalFilters(chartMeta, []);

        // the toggle should really only be used by the bar chart.
        // the clinicalDataBinFilter is guaranteed for bar chart.
        let ref = this._clinicalDataBinFilterSet.get(chartMeta.uniqueKey);
        ref!.disableLogScale = !ref!.disableLogScale;
    }

    public isLogScaleToggleVisible(uniqueKey: string, dataBins?: DataBin[]) {
        return (
            (this._clinicalDataBinFilterSet.get(uniqueKey) !== undefined &&  this._clinicalDataBinFilterSet.get(uniqueKey)!.disableLogScale) ||
            isLogScaleByDataBins(dataBins)
        );
    }

    public isLogScaleChecked(uniqueKey: string) {
        return this._clinicalDataBinFilterSet.get(uniqueKey) !== undefined &&
            !this._clinicalDataBinFilterSet.get(uniqueKey)!.disableLogScale;
    }

    @autobind
    @action
    public updateCustomBins(uniqueKey: string, bins: number[]) {
        let newFilter = _.clone(this._clinicalDataBinFilterSet.get(uniqueKey))!;
        newFilter.customBins = bins;
        this._clinicalDataBinFilterSet.set(uniqueKey, newFilter);
    }

    public geCurrentBins(chartMeta: ChartMeta): number[] {
        return _.uniq(_.reduce(this.getClinicalDataBin(chartMeta).result, (acc, next) => {
            if (next.start) {
                acc.push(next.start);
            }
            if (next.end) {
                acc.push(next.end);
            }
            return acc;
        }, [] as number[]));
    }

    @action addCharts(visibleChartIds: string[]) {
        visibleChartIds.forEach(chartId => {
            if(!this._chartVisibility.keys().includes(chartId)) {
                this.newlyAddedCharts.push(chartId);
            }
        });
        this.updateChartsVisibility(visibleChartIds);
    }

    @action updateChartsVisibility(visibleChartIds:string[]){
        _.each(this._chartVisibility.keys(),chartId=>{
            if(!_.includes(visibleChartIds,chartId) || !this._chartVisibility.get(chartId)){
                // delete it instead of setting it to false
                // because adding chart back would insert in middle instead of appending at last
                this._chartVisibility.delete(chartId);
            }
        })
        _.each(visibleChartIds,uniqueKey=>{
            if(this._chartVisibility.get(uniqueKey) === undefined) {
                this._chartVisibility.set(uniqueKey, true);
            }
        });
    }

    @computed get clinicalDataEqualityFilters() {
        return this._clinicalDataEqualityFilterSet.values();
    }

    @computed get clinicalDataIntervalFilters() {
        return this._clinicalDataIntervalFilterSet.values();
    }

    @computed
    get filters(): StudyViewFilter {
        const filters: Partial<StudyViewFilter> = {};

        const clinicalDataEqualityFilters = this.clinicalDataEqualityFilters;
        const clinicalDataIntervalFilters = this.clinicalDataIntervalFilters;

        //checking for empty since the api throws error when the clinicalDataEqualityFilter array is empty
        if (clinicalDataEqualityFilters.length > 0) {
            filters.clinicalDataEqualityFilters = clinicalDataEqualityFilters;
        }

        if (clinicalDataIntervalFilters.length > 0) {
            filters.clinicalDataIntervalFilters = clinicalDataIntervalFilters;
        }

        if (this._mutatedGeneFilter.length > 0) {
            filters.mutatedGenes = this._mutatedGeneFilter;
        }

        if (this._fusionGeneFilter.length > 0) {
            filters.fusionGenes = this._fusionGeneFilter;
        }

        if (this._cnaGeneFilter.length > 0) {
            filters.cnaGenes = this._cnaGeneFilter;
        }

        if (this._mutationCountVsCNAFilter) {
            filters.mutationCountVsCNASelection = this._mutationCountVsCNAFilter;
        }

        let sampleIdentifiersFilterSets = this._chartSampleIdentifiersFilterSet.values()

        // nested array need to be spread for _.intersectionWith
        let _sampleIdentifiers: SampleIdentifier[] = _.intersectionWith(...sampleIdentifiersFilterSets,
            ((a: SampleIdentifier, b: SampleIdentifier) => {
                return a.sampleId === b.sampleId &&
                    a.studyId === b.studyId;
            }) as any);

        if(_sampleIdentifiers && _sampleIdentifiers.length>0) {
            filters.sampleIdentifiers = _sampleIdentifiers;
        } else {
            if(_.isEmpty(this.queriedSampleIdentifiers.result)){
                filters.studyIds = this.queriedPhysicalStudyIds.result;
            } else {
                filters.sampleIdentifiers = this.queriedSampleIdentifiers.result;
            }
        }

        if(this._withMutationDataFilter !== undefined) {
            let customChartFilterSet = this.customChartFilterSet.get(UniqueKey.WITH_MUTATION_DATA)
            if(customChartFilterSet !== undefined && customChartFilterSet.length === 1) {
                filters.withMutationData = this._withMutationDataFilter;
            }

        }
        if(this._withCNADataFilter !== undefined) {
            let customChartFilterSet = this.customChartFilterSet.get(UniqueKey.WITH_CNA_DATA)
            if(customChartFilterSet !== undefined && customChartFilterSet.length === 1) {
                filters.withCNAData = this._withCNADataFilter;
            }
        }

        return filters as StudyViewFilter;
    }

    @computed
    get userSelections() {

        let sampleIdentifiersSet:{[id:string]:SampleIdentifier[]} = this._chartSampleIdentifiersFilterSet.toJS()
        //let filters:StudyViewFilterWithCustomFilters =  Object.assign({}, this.filters,  {sampleIdentifiersSet:sampleIdentifiersSet})

        return {...this.filters, sampleIdentifiersSet}

    }

    public getMutatedGenesTableFilters(): string[] {
        return _.flatMap(this._mutatedGeneFilter, filter => filter.entrezGeneIds).map(entrezGeneId => getMutationUniqueKey(entrezGeneId, this.geneMapCache[entrezGeneId]));
    }

    public getFusionGenesTableFilters(): string[] {
        return _.flatMap(this._fusionGeneFilter, filter => filter.entrezGeneIds).map(entrezGeneId => getMutationUniqueKey(entrezGeneId, this.geneMapCache[entrezGeneId]));
    }

    public getCNAGenesTableFilters(): string[] {
        return _.flatMap(this._cnaGeneFilter, filter => filter.alterations).map(alteration => getCnaUniqueKey(alteration.entrezGeneId, this.geneMapCache[alteration.entrezGeneId], alteration.alteration));
    }

    public getClinicalDataFiltersByUniqueKey(uniqueKey: string): string[] {
        const filter = this._clinicalDataEqualityFilterSet.get(uniqueKey);
        return filter ? filter.values : [];
    }

    public getClinicalDataIntervalFiltersByUniqueKey(uniqueKey: string): ClinicalDataIntervalFilterValue[] {
        const result = this._clinicalDataIntervalFilterSet.get(uniqueKey);
        return result ? result.values : [];
    }

    @computed
    get unfilteredAttrsForNonNumerical() {
        const visibleNonNumericalAttributes = this.visibleAttributes.filter((chartMeta: ChartMeta) => {
            if(chartMeta.clinicalAttribute !== undefined && chartMeta.clinicalAttribute.datatype !== "NUMBER") {
                const key = getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute);
                return !this._clinicalDataEqualityFilterSet.has(key);
            }
            return false;
        });

        return visibleNonNumericalAttributes.map((chartMeta: ChartMeta) => {
            return {
                attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                clinicalDataType: chartMeta.clinicalAttribute!.patientAttribute ? 'PATIENT' : 'SAMPLE'
            } as ClinicalDataFilter;
        });
    }

    @computed
    get newlyAddedUnfilteredAttrsForNonNumerical() {
        return this.clinicalAttributes.result.filter((attr:ClinicalAttribute) => {
            if(attr.datatype !== "NUMBER") {
                const key = getClinicalAttributeUniqueKey(attr);
                if(this.newlyAddedCharts.includes(key)) {
                    return true;
                }
                return false;
            }
            return false;
        }).map(attr => {
            return {
                attributeId: attr.clinicalAttributeId,
                clinicalDataType: attr.patientAttribute ? 'PATIENT' : 'SAMPLE'
            };
        });
    }

    @computed
    get newlyAddedUnfilteredAttrsForNumerical() {
        return this.clinicalAttributes.result.filter((attr:ClinicalAttribute) => {
            if(attr.datatype === "NUMBER") {
                const key = getClinicalAttributeUniqueKey(attr);
                if(this.newlyAddedCharts.includes(key)) {
                    return true;
                }
                return false;
            }
            return false;
        }).map(attr => {
            return this._clinicalDataBinFilterSet.get(getClinicalAttributeUniqueKey( attr))!;
        });
    }


    @computed
    get unfilteredAttrsForNumerical() {
        const visibleNumericalAttributes = this.visibleAttributes.filter((chartMeta: ChartMeta) => {
            if (chartMeta.clinicalAttribute !== undefined && chartMeta.clinicalAttribute.datatype === "NUMBER") {
                const key = getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute);
                return !this._clinicalDataIntervalFilterSet.has(key);
            }
            return false;
        });

        return visibleNumericalAttributes.map((chartMeta: ChartMeta) => {
            return this._clinicalDataBinFilterSet.get(getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute!))!;
        });
    }

    readonly unfilteredClinicalDataCount = remoteData<ClinicalDataCountItem[]>({
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                clinicalDataCountFilter: {
                    attributes: this.unfilteredAttrsForNonNumerical,
                    studyViewFilter: this.filters
                } as ClinicalDataCountFilter
            });
        },
        onError: (error => {}),
        onResult: (data=>{
            data.forEach(item => {
                const uniqueKey = getClinicalAttributeUniqueKeyByDataTypeAttrId(item.clinicalDataType, item.attributeId);
                if (this.isNewlyAdded(uniqueKey)) {
                    this.showAsPieChart(uniqueKey, item.counts.length, item.clinicalDataType === "PATIENT" ? true : false);
                    this.newlyAddedCharts.remove(uniqueKey);
                }
            });
        }),
        default: []
    });

    readonly newlyAddedUnfilteredClinicalDataCount = remoteData<ClinicalDataCountItem[]>({
        invoke: () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                clinicalDataCountFilter: {
                    attributes: this.newlyAddedUnfilteredAttrsForNonNumerical,
                    studyViewFilter: this.filters
                } as ClinicalDataCountFilter
            });
        },
        default: [],
        onError: (error => {}),
        onResult: (data) => {
            data.forEach(item => {
                const uniqueKey = getClinicalAttributeUniqueKeyByDataTypeAttrId(item.clinicalDataType, item.attributeId);
                this.unfilteredClinicalDataCountCache[uniqueKey] = item;
                this.showAsPieChart(uniqueKey, item.counts.length, item.clinicalDataType === "PATIENT" ? true : false);
                this.newlyAddedCharts.remove(uniqueKey);
            });
        }
    });

    readonly newlyAddedUnfilteredClinicalDataBinCount = remoteData<DataBin[]>({
        invoke: () => {
            return internalClient.fetchClinicalDataBinCountsUsingPOST({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: this.newlyAddedUnfilteredAttrsForNumerical,
                    studyViewFilter: this.filters
                } as ClinicalDataBinCountFilter
            });
        },
        default: [],
        onError: (error => {}),
        onResult: (data) => {
            _.each(_.groupBy(data, item => getClinicalAttributeUniqueKeyByDataTypeAttrId(item.clinicalDataType, item.attributeId)), (item, key) => {
                this.unfilteredClinicalDataBinCountCache[key] = item;
                this.newlyAddedCharts.remove(key);
            });
        }
    });

    readonly unfilteredClinicalDataBinCount = remoteData<DataBin[]>({
        invoke: () => {
            return internalClient.fetchClinicalDataBinCountsUsingPOST({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: this.unfilteredAttrsForNumerical,
                    studyViewFilter: this.filters
                } as ClinicalDataBinCountFilter
            });
        },
        onError: (error => {}),
        default: []
    });

    @autobind
    @action
    hideChart(uniqueKey: string) {
        this.changeChartVisibility(uniqueKey, false);
    }

    public getClinicalDataCount(chartMeta: ChartMeta) {
        let uniqueKey:string = getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute!);
        if(!this.clinicalDataCountPromises.hasOwnProperty(uniqueKey)) {
            const isDefaultAttr = _.find(this.defaultVisibleAttributes.result, attr => getClinicalAttributeUniqueKey(attr) === uniqueKey) !== undefined;
            this.clinicalDataCountPromises[uniqueKey] = remoteData<ClinicalDataCountSummary[]>({
                await: () => {
                    return getRequestedAwaitPromisesForClinicalData(
                        isDefaultAttr,
                        this.isInitialFilterState, this.chartsAreFiltered,
                        this._clinicalDataEqualityFilterSet.has(uniqueKey),
                        this.unfilteredClinicalDataCount, this.newlyAddedUnfilteredClinicalDataCount,
                        this.initialVisibleAttributesClinicalDataCountData);
                },
                invoke: async () => {
                    let dataType: "SAMPLE" | "PATIENT" = chartMeta.clinicalAttribute!.patientAttribute ? 'PATIENT' : 'SAMPLE';
                    let result: ClinicalDataCountItem[] = [];
                    if (this.isInitialFilterState && isDefaultAttr && !this._clinicalDataEqualityFilterSet.has(uniqueKey)) {
                        result = this.initialVisibleAttributesClinicalDataCountData.result;
                    } else {
                        // Mostly the case when user adds new chart. It would be nice only fetching
                        // the chart specific data instead of using the unfilteredClinicalDataCount which will require
                        // all unfiltered clinical attributes data.

                        if (this._clinicalDataEqualityFilterSet.has(uniqueKey) || this.isInitialFilterState) {
                            result = await internalClient.fetchClinicalDataCountsUsingPOST({
                                clinicalDataCountFilter: {
                                    attributes: [{
                                        attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                                        clinicalDataType: dataType
                                    } as ClinicalDataFilter],
                                    studyViewFilter: this.filters
                                } as ClinicalDataCountFilter
                            });
                        } else if (!isDefaultAttr && !this.chartsAreFiltered) {
                            result = [this.unfilteredClinicalDataCountCache[uniqueKey]];
                        } else{
                            result = this.unfilteredClinicalDataCount.result;
                        }
                    }
                    let data = _.find(result, {
                        attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId,
                        clinicalDataType: dataType
                    } as ClinicalDataCountItem);
                    let counts:ClinicalDataCount[] = [];
                    if (data !== undefined) {
                        counts = data.counts;
                    }
                    return getClinicalDataCountWithColorByClinicalDataCount(counts)
                },
                onError: (error => {}),
                default: []
            });
        }
        return this.clinicalDataCountPromises[uniqueKey];
    }

    public getClinicalDataBin(chartMeta: ChartMeta) {
        const uniqueKey: string = getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute!);
        if (!this.clinicalDataBinPromises.hasOwnProperty(uniqueKey)) {
            const defaultAttr = _.find(this.defaultVisibleAttributes.result, attr => getClinicalAttributeUniqueKey(attr) === uniqueKey);
            const isDefaultAttr = defaultAttr !== undefined;
            this.clinicalDataBinPromises[uniqueKey] = remoteData<DataBin[]>({
                await: () => {
                    return getRequestedAwaitPromisesForClinicalData(
                        isDefaultAttr, this.isInitialFilterState, this.chartsAreFiltered,
                        this._clinicalDataIntervalFilterSet.has(uniqueKey),
                        this.unfilteredClinicalDataBinCount, this.newlyAddedUnfilteredClinicalDataBinCount,
                        this.initialVisibleAttributesClinicalDataBinCountData);
                },
                invoke: async () => {
                    const clinicalDataType = chartMeta.clinicalAttribute!.patientAttribute ? 'PATIENT' : 'SAMPLE';
                    // TODO this.barChartFilters.length > 0 ? 'STATIC' : 'DYNAMIC' (not trivial when multiple filters involved)
                    const dataBinMethod = DataBinMethodConstants.STATIC;
                    let result = [];
                    const initDataBinFilter = _.find(this.initialVisibleAttributesClinicalDataBinAttributes.result,
                            item=>getClinicalAttributeUniqueKeyByDataTypeAttrId(
                                item.clinicalDataType,item.attributeId)===getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute!));
                    const attribute = this._clinicalDataBinFilterSet.get(getClinicalAttributeUniqueKey(chartMeta.clinicalAttribute!))!;
                    const attributeChanged = isDefaultAttr && !_.isEqual(toJS(attribute), initDataBinFilter);
                    if (this.isInitialFilterState &&
                        isDefaultAttr &&
                        !this._clinicalDataIntervalFilterSet.has(uniqueKey) &&
                        !attributeChanged) {
                        result = this.initialVisibleAttributesClinicalDataBinCountData.result;
                    } else {
                        if (this._clinicalDataIntervalFilterSet.has(uniqueKey)) {
                            result = await internalClient.fetchClinicalDataBinCountsUsingPOST({
                                dataBinMethod,
                                clinicalDataBinCountFilter: {
                                    attributes: [attribute],
                                    studyViewFilter: this.filters
                                } as ClinicalDataBinCountFilter
                            });
                        } else if (!isDefaultAttr && !this.chartsAreFiltered) {
                            result = this.unfilteredClinicalDataBinCountCache[uniqueKey];
                        } else {
                            result = this.unfilteredClinicalDataBinCount.result;
                        }
                    }

                    return _.filter(result, {
                        attributeId: chartMeta.clinicalAttribute!.clinicalAttributeId
                    }) || [];
                },
                onError: (error => {}),
                default: []
            });
        }
        return this.clinicalDataBinPromises[uniqueKey];
    }

    private async getClinicalDataBySamples(samples: Sample[]) {
        let clinicalData:{[sampleId:string]: {[attributeId: string]: string}} = {};

        let sampleClinicalData = await defaultClient.fetchClinicalDataUsingPOST({
            'clinicalDataType': "SAMPLE",
            'clinicalDataMultiStudyFilter': {
                'identifiers': _.map(samples, sample => {
                    return {
                        entityId: sample.sampleId,
                        studyId: sample.studyId
                    }
                })
            } as ClinicalDataMultiStudyFilter
        });

        _.forEach(sampleClinicalData, item => {
            clinicalData[item.uniqueSampleKey] = { ...(clinicalData[item.uniqueSampleKey] || {}), ['SAMPLE_' + item.clinicalAttributeId]: item.value };
        })

        let patientClinicalData = await defaultClient.fetchClinicalDataUsingPOST({
            'clinicalDataType': "PATIENT",
            'clinicalDataMultiStudyFilter': {
                'identifiers': _.map(samples, sample => {
                    return {
                        entityId: sample.patientId,
                        studyId: sample.studyId
                    }
                })
            } as ClinicalDataMultiStudyFilter
        });

        const patientSamplesMap = _.groupBy(samples, sample => sample.uniquePatientKey);

        _.forEach(patientClinicalData, item => {
            (patientSamplesMap[item.uniquePatientKey] || []).forEach(sample => {
                clinicalData[sample.uniqueSampleKey] = { ...(clinicalData[sample.uniqueSampleKey] || {}), ['PATIENT_' + item.clinicalAttributeId]: item.value };
            });
        });
        return clinicalData;

    }

    readonly molecularProfiles = remoteData<MolecularProfile[]>({
        await: ()=>[this.queriedPhysicalStudyIds],
        invoke: async () => {
            return await defaultClient.fetchMolecularProfilesUsingPOST({
                molecularProfileFilter: {
                    studyIds: this.queriedPhysicalStudyIds.result
                } as MolecularProfileFilter
            })
        },
        onError: (error => {}),
        default: []
    });


    readonly allPhysicalStudies = remoteData({
        invoke: async () => {
            if (this.studyIds.length > 0) {
                return defaultClient
                    .fetchStudiesUsingPOST({
                        studyIds: toJS(this.studyIds),
                        projection: 'SUMMARY'
                    }).then((studies) => {
                        return studies
                    }).catch((error) => {
                        return defaultClient.getAllStudiesUsingGET({ projection: 'SUMMARY' });
                    })
            }
            return [];
        },
        default: []
    });

    readonly physicalStudiesSet = remoteData<{[id:string]:CancerStudy}>({
        await: ()=>[this.allPhysicalStudies],
        invoke: async () => {
            return _.keyBy(this.allPhysicalStudies.result, s=>s.studyId);
        },
        default: {}
    });

    // contains queried physical studies
    readonly filteredPhysicalStudies = remoteData({
        await: ()=>[this.physicalStudiesSet],
        invoke: async () => {
            const physicalStudiesSet = this.physicalStudiesSet.result;
            return _.reduce(this.studyIds, (acc: CancerStudy[], next) => {
                if (physicalStudiesSet[next]) {
                    acc.push(physicalStudiesSet[next]);
                }
                return acc;
            }, []);
        },
        default: []
    });

    // contains queried vaild virtual studies
    readonly filteredVirtualStudies = remoteData({
        await: () => [this.filteredPhysicalStudies],
        invoke: async () => {
            if (this.filteredPhysicalStudies.result.length === this.studyIds.length) {
                return [];
            }
            let filteredVirtualStudies: VirtualStudy[] = [];
            let validFilteredPhysicalStudyIds = this.filteredPhysicalStudies.result.map(study => study.studyId);
            let virtualStudyIds = _.filter(this.studyIds, id => !_.includes(validFilteredPhysicalStudyIds, id));

            await Promise.all(virtualStudyIds.map(id =>
                sessionServiceClient
                    .getVirtualStudy(id)
                    .then((res) => {
                        filteredVirtualStudies.push(res);
                    })
                    .catch(error => { /*do nothing*/ })
            ));
            return filteredVirtualStudies;
        },
        default: []
    });

    // includes all physical studies from queried virtual studies
    readonly queriedPhysicalStudies = remoteData({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {

            let physicalStudiesSet = this.physicalStudiesSet.result;

            const virtualStudyRelatedPhysicalStudiesIds = _.uniq(_.flatten(this.filteredVirtualStudies.result.map((vs:VirtualStudy)=>vs.data.studies.map(study => study.id))));
            const unsettledPhysicalStudies = _.without(virtualStudyRelatedPhysicalStudiesIds, ..._.keys(physicalStudiesSet));
            if(unsettledPhysicalStudies.length > 0) {
                const virtualStudyRelatedPhysicalStudies = await defaultClient.fetchStudiesUsingPOST({
                    studyIds:unsettledPhysicalStudies,
                    projection: 'SUMMARY'
                });
                physicalStudiesSet = _.merge(physicalStudiesSet, _.keyBy(virtualStudyRelatedPhysicalStudies, 'studyId'));
            }
            let studies = _.reduce(this.filteredPhysicalStudies.result, (acc, next) => {
                acc[next.studyId] = physicalStudiesSet[next.studyId];
                return acc;
            }, {} as { [id: string]: CancerStudy })

            this.filteredVirtualStudies.result.forEach(virtualStudy => {
                virtualStudy.data.studies.forEach(study => {
                    if (!studies[study.id] && physicalStudiesSet[study.id]) {
                        studies[study.id] = physicalStudiesSet[study.id];
                    }
                })
            });
            return _.values(studies);
        },
        default: []
    });

    // includes all physical studies from queried virtual studies
    readonly queriedPhysicalStudyIds = remoteData({
        await: () => [this.queriedPhysicalStudies],
        invoke: () => {
            return Promise.resolve(_.map(this.queriedPhysicalStudies.result, study => study.studyId));
        },
        default: []
    });

    readonly queriedSampleIdentifiers = remoteData<SampleIdentifier[]>({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {
            let result = _.reduce(this.filteredVirtualStudies.result, (acc, next) => {
                next.data.studies.forEach(study => {
                    let samples = study.samples;
                    if (acc[study.id]) {
                        samples = _.union(acc[study.id], samples);
                    }
                    acc[study.id] = samples;
                })
                return acc;
            }, {} as { [id: string]: string[] });

            if (!_.isEmpty(result) || this.sampleIdentifiers.length > 0) {

                result = _.reduce(this.filteredPhysicalStudies.result, (acc, next) => {
                    acc[next.studyId] = [];
                    return acc;
                }, result);

                _.chain(this.sampleIdentifiers)
                    .groupBy(sampleIdentifier => sampleIdentifier.studyId)
                    .each((sampleIdentifiers, studyId) => {
                        if (result[studyId] !== undefined) {
                            if (result[studyId].length > 0) {
                                const sampleIds = result[studyId];
                                const filteredSampleIds = sampleIdentifiers.map(sampleIdentifier => sampleIdentifier.sampleId);
                                result[studyId] = _.intersection(sampleIds, filteredSampleIds);
                            } else {
                                result[studyId] = sampleIdentifiers.map(sampleIdentifier => sampleIdentifier.sampleId);
                            }
                        }
                    })
                    .value();

                let studySamplesToFetch = _.reduce(result, (acc, samples, studyId) => {
                    if (samples.length === 0) {
                        acc.push(studyId);
                    }
                    return acc;
                }, [] as string[])

                await Promise.all(_.map(studySamplesToFetch, studyId => {
                    return defaultClient.getAllSamplesInStudyUsingGET({
                        studyId: studyId
                    }).then(samples => {
                        result[studyId] = samples.map(sample => sample.sampleId);
                    })
                }))
            }

            return _.flatten(_.map(result, (samples, studyId) =>
                samples.map(sampleId => {
                    return {
                        sampleId,
                        studyId
                    }
                })
            ));
        },
        default: []
    });

    // all queried studies, includes both physcial and virtual studies
    // this is used in page header(name and description)
    readonly displayedStudies = remoteData({
        await: () => [this.filteredVirtualStudies, this.filteredPhysicalStudies, this.queriedPhysicalStudies],
        invoke: async () => {
            if (this.filteredPhysicalStudies.result.length === 0 && this.filteredVirtualStudies.result.length === 1) {

                const virtualStudy = this.filteredVirtualStudies.result[0]
                return [{
                    name: virtualStudy.data.name,
                    description: virtualStudy.data.description,
                    studyId: virtualStudy.id,
                } as CancerStudy]
            } else {
                return this.queriedPhysicalStudies.result;
            }
        },
        default: []
    });

    @computed get showOriginStudiesInSummaryDescription() {
        return showOriginStudiesInSummaryDescription(this.filteredPhysicalStudies.result, this.filteredVirtualStudies.result);
    }

    // origin/parent studies to be shown in summary description
    // this would be empty in all cases except if only one virtual study in queried
    readonly originStudies = remoteData({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {
            let studies: CancerStudy[] = [];
            if(this.showOriginStudiesInSummaryDescription) {
                const originStudyIds = this.filteredVirtualStudies.result[0].data.origin;
                const virtualStudyIds: string[] = [];
                const physicalStudiesSet = this.physicalStudiesSet.result;
                _.each(originStudyIds, studyId => {
                    if (physicalStudiesSet[studyId]) {
                        studies.push(physicalStudiesSet[studyId]);
                    } else {
                        virtualStudyIds.push(studyId);
                    }
                })
                await Promise.all(virtualStudyIds.map(id =>
                    sessionServiceClient
                        .getVirtualStudy(id)
                        .then((virtualStudy) => {
                            studies.push({
                                name: virtualStudy.data.name,
                                description: virtualStudy.data.description,
                                studyId: virtualStudy.id,
                            } as CancerStudy);
                        })
                        .catch(error => { /*do nothing*/ })
                ));
            }
            return studies;
        },
        default: []
    });

    readonly unknownQueriedIds = remoteData({
        await: () => [this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: async () => {
            let validIds:string[] = [];
            _.each(this.filteredPhysicalStudies.result,study => validIds.push(study.studyId));
            _.each(this.filteredVirtualStudies.result,study => validIds.push(study.id));
            return _.filter(this.studyIds, id => !_.includes(validIds, id));
        },
        onError: (error => {
        }),
        onResult: (unknownIds) => {
            if (unknownIds.length > 0) {
                this.pageStatusMessages['unknownIds'] = {
                    status: 'danger',
                    message: `Unknown/Unauthorized ${unknownIds.length > 1 ? 'studies' : 'study'} ${unknownIds.join(', ')}`
                };
            }
        },
        default: []
    });

    readonly mutationProfiles = remoteData({
        await: ()=>[this.molecularProfiles],
        invoke: async ()=>{
            return this.molecularProfiles.result.filter(profile => profile.molecularAlterationType === "MUTATION_EXTENDED")
        },
        onError: (error => {}),
        default: []
    });


    readonly cnaProfiles = remoteData({
        await: ()=>[this.molecularProfiles],
        invoke: async ()=>{
            return  this.molecularProfiles
            .result
            .filter(profile => profile.molecularAlterationType === "COPY_NUMBER_ALTERATION" && profile.datatype === "DISCRETE")

        },
        onError: (error => {}),
        default: []
    });

    private getDefaultClinicalDataBinFilter(attribute: ClinicalAttribute) {
        return {
            attributeId: attribute.clinicalAttributeId,
            clinicalDataType: attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
            disableLogScale: false
        } as ClinicalDataBinFilter;
    }

    readonly clinicalAttributes = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        invoke: async () => _.uniqBy(await defaultClient.fetchClinicalAttributesUsingPOST({
            studyIds: this.queriedPhysicalStudyIds.result
        }), clinicalAttribute => `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`),
        default: [],
        onError: (error => {}),
        onResult:(clinicalAttributes)=>{
            clinicalAttributes.forEach((obj:ClinicalAttribute) => {
                if(obj.datatype === 'NUMBER') {
                    const uniqueKey = getClinicalAttributeUniqueKey(obj);
                    let filter = this.getDefaultClinicalDataBinFilter(obj);

                    if (STUDY_VIEW_CONFIG.initialBins[uniqueKey]) {
                        filter.customBins = STUDY_VIEW_CONFIG.initialBins[uniqueKey];
                    }
                    this._clinicalDataBinFilterSet.set(uniqueKey, filter);
                }
            });
        }
    });

    readonly clinicalAttributeIdToClinicalAttribute = remoteData({
        await:()=>[this.clinicalAttributes],
        invoke:async()=>{
            return _.keyBy(this.clinicalAttributes.result!, "clinicalAttributeId");
        }
    });

    readonly MDACCHeatmapStudyMeta = remoteData({
        await: () => [this.queriedPhysicalStudyIds],
        onError: (error => {}),
        invoke: async () => {
            let isSinglePhysicalStudy = this.queriedPhysicalStudyIds.result.length === 1;
            if (isSinglePhysicalStudy) {
                return await getHeatmapMeta(getMDAndersonHeatmapStudyMetaUrl(this.queriedPhysicalStudyIds.result[0]));
            }
            return [];
        }
    }, []);

    readonly oncokbCancerGenes = remoteData<CancerGene[]>({
        await: () => [],
        invoke: async () => {
            return oncoKBClient.utilsCancerGeneListGetUsingGET({});
        },
        onError: (error => {
        }),
        default: []
    });

    readonly oncokbGenes = remoteData<OncokbGene[]>({
        await: () => [],
        invoke: async () => {
            return oncoKBClient.genesGetUsingGET({});
        },
        onError: (error => {
        }),
        default: []
    });

    readonly oncokbCancerGeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbCancerGenes],
        invoke: async () => {
            return this.oncokbCancerGenes.result.map(gene => gene.entrezGeneId);
        },
        default: []
    });

    readonly oncokbAnnotatedGeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbCancerGenes],
        invoke: async () => {
            return this.oncokbCancerGenes.result.filter(gene => gene.oncokbAnnotated).map(gene => gene.entrezGeneId);
        },
        default: []
    });

    readonly oncokbOncogeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbGenes],
        invoke: async () => {
            return this.oncokbGenes.result.filter(gene => gene.oncogene).map(gene => gene.entrezGeneId);
        },
        default: []
    });

    readonly oncokbTumorSuppressorGeneEntrezGeneIds = remoteData<number[]>({
        await: () => [this.oncokbGenes],
        invoke: async () => {
            return this.oncokbGenes.result.filter(gene => gene.tsg).map(gene => gene.entrezGeneId);
        },
        default: []
    });

    @computed get oncokbCancerGeneFilterEnabled() {
        if (!AppConfig.serverConfig.show_oncokb) {
            return false;
        }
        return !this.oncokbCancerGenes.isError && !this.oncokbGenes.isError;
    }

    @computed get isSingleVirtualStudyPageWithoutFilter() {
        return (this.filteredPhysicalStudies.result.length + this.filteredVirtualStudies.result.length) === 1 && this.filteredVirtualStudies.result.length > 0 && !this.chartsAreFiltered;
    }

    @computed get analysisGroupsPossible() {
        // analysis groups possible iff there are visible analysis groups-capable charts
        const analysisGroupsCharts =
            [UniqueKey.DISEASE_FREE_SURVIVAL, UniqueKey.OVERALL_SURVIVAL] as string[];
        let ret = false;
        for (const chartMeta of this.visibleAttributes) {
            if (analysisGroupsCharts.includes(chartMeta.uniqueKey)) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    @autobind
    isChartNameValid(chartName: string) {
        const match = _.find(this.chartMetaSet, chartMeta => chartMeta.displayName.toUpperCase() === chartName.toUpperCase());
        return match === undefined;
    }
    @autobind
    getDefaultCustomChartName() {
        return `${DEFAULT_CHART_NAME} ${this._customCharts.size - SPECIAL_CHARTS.length + 1}`;
    }

    @autobind
    @action addCustomChart(newChart:CustomChart, uniqueKey:string = this.newCustomChartUniqueKey(), loadedfromUserSettings:boolean=false) {
        const newChartName = newChart.name ? newChart.name : this.getDefaultCustomChartName();
        let chartMeta:ChartMeta = {
            uniqueKey: uniqueKey,
            displayName: newChartName,
            description: newChartName,
            dataType: getChartMetaDataType(uniqueKey),
            patientAttribute: false,
            renderWhenDataChange: false,
            priority: 1
        };
        let allCases: CustomChartIdentifierWithValue[] = [];
        if(newChart.patientAttribute) {
            chartMeta.patientAttribute = true;
        }
        _.each(newChart.groups, (group:CustomGroup) => {
            _.reduce(group.sampleIdentifiers, (acc, next) => {
                acc.push({
                    studyId: next.studyId,
                    sampleId: next.sampleId,
                    patientId: next.patientId,
                    value: group.name
                });
                return acc;
            }, allCases)
        });
        this._customCharts.set(uniqueKey, chartMeta);
        this._customChartMap.set(uniqueKey, newChart)
        this._chartVisibility.set(uniqueKey, true);
        this._customChartsSelectedCases.set(uniqueKey, allCases);
        this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
        this.chartsDimension.set(uniqueKey, {w: 1, h: 1});

        // Autoselect the groups
        if(!loadedfromUserSettings) {
            this.setCustomChartFilters(chartMeta, newChart.groups.map(group=>group.name));
            this.newlyAddedCharts.clear();
            this.newlyAddedCharts.push(uniqueKey);
        }
    }

    @autobind
    @action
    updateCustomSelect(newChart: CustomChart) {
        const sampleIdentifiers = _.reduce(newChart.groups, (acc, next) => {
            acc.push(...next.sampleIdentifiers.map((customCase: CustomChartIdentifier) => {
                return {
                    sampleId: customCase.sampleId,
                    studyId: customCase.studyId
                };
            }));
            return acc;
        }, [] as SampleIdentifier[]);
        this.numberOfSelectedSamplesInCustomSelection = sampleIdentifiers.length;
        this.updateChartSampleIdentifierFilter(UniqueKey.CUSTOM_SELECT, sampleIdentifiers, false);
    }

    @computed
    get chartMetaSet(): { [id: string]: ChartMeta } {
        let _chartMetaSet: { [id: string]: ChartMeta } = _.reduce(this._customCharts.values(), (acc: { [id: string]: ChartMeta }, chartMeta:ChartMeta) => {
            acc[chartMeta.uniqueKey] = toJS(chartMeta);
            return acc
        }, {} as { [id: string]: ChartMeta });

        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(this.clinicalAttributes.result, (acc: { [id: string]: ChartMeta }, attribute) => {
            const uniqueKey = getClinicalAttributeUniqueKey(attribute);
            acc[uniqueKey] = {
                displayName: attribute.displayName,
                uniqueKey: uniqueKey,
                dataType: getChartMetaDataType(uniqueKey),
                patientAttribute:attribute.patientAttribute,
                description: attribute.description,
                priority: getPriorityByClinicalAttribute(attribute),
                renderWhenDataChange: false,
                clinicalAttribute: attribute
            };
            return acc
        }, _chartMetaSet);

        _.reduce(this.survivalPlots, (acc: { [id: string]: ChartMeta }, survivalPlot) => {
            acc[survivalPlot.id] = {
                uniqueKey: survivalPlot.id,
                dataType: getChartMetaDataType(survivalPlot.id),
                patientAttribute:true,
                displayName: survivalPlot.title,
                priority: getDefaultPriorityByUniqueKey(survivalPlot.id),
                renderWhenDataChange: false,
                description: ''
            };
            return acc;
        }, _chartMetaSet);

        if (!_.isEmpty(this.mutationProfiles.result)) {
            _chartMetaSet[UniqueKey.MUTATED_GENES_TABLE] = {
                uniqueKey: UniqueKey.MUTATED_GENES_TABLE,
                dataType: getChartMetaDataType(UniqueKey.MUTATED_GENES_TABLE),
                patientAttribute:false,
                displayName: 'Mutated Genes',
                priority: getDefaultPriorityByUniqueKey(UniqueKey.MUTATED_GENES_TABLE),
                renderWhenDataChange: false,
                description: ''
            };
        }

        if (!_.isEmpty(this.mutationProfiles.result)) {
            _chartMetaSet[UniqueKey.FUSION_GENES_TABLE] = {
                uniqueKey: UniqueKey.FUSION_GENES_TABLE,
                dataType: getChartMetaDataType(UniqueKey.FUSION_GENES_TABLE),
                patientAttribute:false,
                displayName: 'Fusion Genes',
                priority: getDefaultPriorityByUniqueKey(UniqueKey.FUSION_GENES_TABLE),
                renderWhenDataChange: true,
                description: ''
            };
        }

        if (!_.isEmpty(this.cnaProfiles.result)) {
            _chartMetaSet[UniqueKey.CNA_GENES_TABLE] = {
                uniqueKey: UniqueKey.CNA_GENES_TABLE,
                dataType: getChartMetaDataType(UniqueKey.CNA_GENES_TABLE),
                patientAttribute:false,
                displayName: 'CNA Genes',
                renderWhenDataChange: false,
                priority: getDefaultPriorityByUniqueKey(UniqueKey.CNA_GENES_TABLE),
                description: ''
            };
        }

        const scatterRequiredParams = _.reduce(this.clinicalAttributes.result, (acc, next) => {
            if (MUTATION_COUNT === next.clinicalAttributeId) {
                acc[MUTATION_COUNT] = true
            }
            if (FRACTION_GENOME_ALTERED === next.clinicalAttributeId) {
                acc[FRACTION_GENOME_ALTERED] = true
            }
            return acc;
        }, {[MUTATION_COUNT]: false, [FRACTION_GENOME_ALTERED]: false});

        if (scatterRequiredParams[MUTATION_COUNT] && scatterRequiredParams[FRACTION_GENOME_ALTERED]) {
            _chartMetaSet[UniqueKey.MUTATION_COUNT_CNA_FRACTION] = {
                dataType: getChartMetaDataType(UniqueKey.MUTATION_COUNT_CNA_FRACTION),
                patientAttribute:false,
                uniqueKey: UniqueKey.MUTATION_COUNT_CNA_FRACTION,
                displayName: 'Mutation Count vs Fraction of Genome Altered',
                priority: getDefaultPriorityByUniqueKey(UniqueKey.MUTATION_COUNT_CNA_FRACTION),
                renderWhenDataChange: false,
                description: ''
            };
        }
        return _chartMetaSet;
    }

    @computed
    get visibleAttributes(): ChartMeta[] {
        return _.reduce(this._chartVisibility.entries(), (acc, [chartUniqueKey, visible]) => {
            if (visible && this.chartMetaSet[chartUniqueKey]) {
                let chartMeta = this.chartMetaSet[chartUniqueKey];
                acc.push(chartMeta);
            }
            return acc;
        }, [] as ChartMeta[]);
    }

    @computed
    get showSettingRestoreMsg() {
        return this.isSavingUserPreferencePossible &&
            !this.hideRestoreSettingsMsg &&
            this.fetchUserSettings.isComplete &&
            !_.isEqual(this.previousSettings, _.keyBy(this.fetchUserSettings.result, chartUserSetting => chartUserSetting.id));
    }

    @computed
    get isSavingUserSettingsPossible() {
        return this.isSavingUserPreferencePossible && this.fetchUserSettings.isComplete &&
            (!this.showSettingRestoreMsg || !_.isEqual(this.currentChartSettingsMap, _.keyBy(this.fetchUserSettings.result, chartSetting => chartSetting.id)))
    }

    @computed
    get loadingInitialDataForSummaryTab() {
        let pending = this.defaultVisibleAttributes.isPending ||
            this.initialVisibleAttributesClinicalDataBinCountData.isPending ||
            this.initialVisibleAttributesClinicalDataCountData.isPending ||
            this.mutationProfiles.isPending ||
            this.cnaProfiles.isPending;

        if (this._loadUserSettingsInitially) {
            pending = pending || this.fetchUserSettings.isPending
        }
        return pending;
    }

    public updateUserSettingsDebounce = _.debounce(() => {
        if (!_.isEqual(this.previousSettings, this.currentChartSettingsMap)) {
            this.previousSettings = this.currentChartSettingsMap;
            if (!_.isEmpty(this.currentChartSettingsMap)) {
                sessionServiceClient.updateUserSettings({
                    origin: toJS(this.studyIds),
                    chartSettings: _.values(this.currentChartSettingsMap)
                });
            }
        }
    }, 3000);

    // return contains settings for all visible charts each chart setting
    @computed private get currentChartSettingsMap(): { [chartId: string]: ChartUserSetting } {
        let chartSettingsMap: { [chartId: string]: ChartUserSetting } = {};
        if (this.isSavingUserPreferencePossible) {
            chartSettingsMap = getChartSettingsMap(
                this.visibleAttributes,
                this.columns,
                this.chartsDimension.toJS(),
                this.chartsType.toJS(),
                this._customChartMap.toJS(),
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
            if (this.isSavingUserPreferencePossible && this.studyIds.length > 0) {
                let userSettings = await sessionServiceClient.fetchUserSettings(toJS(this.studyIds));
                if(userSettings) {
                    return userSettings.chartSettings || [];
                }
            }
            return [];
        },
        default: [],
        onError: () => {
            // fail silently when an error occurs
        }
    });

    @autobind
    @action private clearPageSettings() {
        this._chartVisibility.clear();
        this.currentGridLayout = [];
        this.currentFocusedChartByUser = undefined;
        this.currentFocusedChartByUserDimension = undefined;
        this._filterMutatedGenesTableByCancerGenes = true;
        this._filterFusionGenesTableByCancerGenes = true;
        this._filterCNAGenesTableByCancerGenes = true;
        this._clinicalDataBinFilterSet = observable.map(toJS(this._defaultClinicalDataBinFilterSet));
    }

    @autobind
    @action
    loadUserSettings() {
        if (this.isSavingUserPreferencePossible && !_.isEmpty(this.fetchUserSettings.result)) {
            this.loadSettings(this.fetchUserSettings.result);
            // set previousSettings only if user is already logged in
            if(this._loadUserSettingsInitially){
                this.previousSettings = _.keyBy(this.fetchUserSettings.result, chartSetting => chartSetting.id);
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
    @observable private _defualtChartsDimension = observable.map<ChartDimension>();
    @observable private _defaultChartsType = observable.map<ChartType>();
    @observable private _defaultVisibleChartIds: string[] = [];
    @observable private _defaultClinicalDataBinFilterSet = observable.map<ClinicalDataBinFilter>();

    @autobind
    @action
    public resetToDefaultSettings() {
        this.clearPageSettings();
        this.loadSettings(_.values(this.defaultChartSettingsMap));
    }

    @computed get showResetToDefaultButton() {
        return !_.isEqual(this.currentChartSettingsMap, this.defaultChartSettingsMap);
    }

    @computed private get defaultChartSettingsMap(): { [chartId: string]: ChartUserSetting } {
        return getChartSettingsMap(
            this._defaultVisibleChartIds.map(chartUniqueKey => this.chartMetaSet[chartUniqueKey]),
            this.columns,
            this._defualtChartsDimension.toJS(),
            this._defaultChartsType.toJS(),
            {},
            this._defaultClinicalDataBinFilterSet.toJS());
    }

    @autobind
    @action
    private loadSettings(chartSettngs: ChartUserSetting[]){
        this.clearPageSettings();
        _.map(chartSettngs, chartUserSettings => {
            if (chartUserSettings.name && chartUserSettings.groups && chartUserSettings.groups.length > 0) {
                this.addCustomChart({
                    name: chartUserSettings.name,
                    groups: chartUserSettings.groups || [],
                    patientAttribute: chartUserSettings.patientAttribute,
                }, chartUserSettings.id, true);
            }

            if (chartUserSettings.layout) {
                this.currentGridLayout.push({
                    i: chartUserSettings.id,
                    isResizable: false,
                    moved: false,
                    static: false,
                    ...chartUserSettings.layout
                });
                this.chartsDimension.set(chartUserSettings.id, {
                    w: chartUserSettings.layout.w,
                    h: chartUserSettings.layout.h
                });
            }

            switch (chartUserSettings.chartType) {
                case UniqueKey.MUTATED_GENES_TABLE:
                    this._filterMutatedGenesTableByCancerGenes = chartUserSettings.filterByCancerGenes === undefined ? true : chartUserSettings.filterByCancerGenes;
                    break;
                case UniqueKey.FUSION_GENES_TABLE:
                    this._filterFusionGenesTableByCancerGenes = chartUserSettings.filterByCancerGenes === undefined ? true : chartUserSettings.filterByCancerGenes;
                    break;
                case UniqueKey.CNA_GENES_TABLE:
                    this._filterCNAGenesTableByCancerGenes = chartUserSettings.filterByCancerGenes === undefined ? true : chartUserSettings.filterByCancerGenes;
                    break;
                case ChartTypeEnum.BAR_CHART:
                    let ref = this._clinicalDataBinFilterSet.get(chartUserSettings.id);
                    if (ref) {
                        if (chartUserSettings.customBins) {
                            ref.customBins = chartUserSettings.customBins;
                        }
                        if (chartUserSettings.disableLogScale) {
                            ref.disableLogScale = chartUserSettings.disableLogScale;
                        }
                    }
                    break;
                default:
                    break;
            }
            this.changeChartVisibility(chartUserSettings.id, true);
            chartUserSettings.chartType && this.chartsType.set(chartUserSettings.id, chartUserSettings.chartType);
        });
        this.useCurrentGridLayout = true;
    }

    @autobind
    @action
    updateChartStats() {
        this.initializeChartStatsByClinicalAttributes();

        if (!_.isEmpty(this.mutationProfiles.result)) {
            const mutatedGeneMeta = _.find(this.chartMetaSet, chartMeta => chartMeta.uniqueKey === UniqueKey.MUTATED_GENES_TABLE);
            this.chartsType.set(UniqueKey.MUTATED_GENES_TABLE, ChartTypeEnum.MUTATED_GENES_TABLE);
            this.chartsDimension.set(UniqueKey.MUTATED_GENES_TABLE, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.MUTATED_GENES_TABLE]);
            if (mutatedGeneMeta && mutatedGeneMeta.priority !== 0) {
                this.changeChartVisibility(UniqueKey.MUTATED_GENES_TABLE, true);
            }
        }
        if (!_.isEmpty(this.mutationProfiles.result)) {
            const fusionGeneMeta = _.find(this.chartMetaSet, chartMeta => chartMeta.uniqueKey === UniqueKey.FUSION_GENES_TABLE);
            if (fusionGeneMeta && fusionGeneMeta.priority !== 0) {
                this.changeChartVisibility(UniqueKey.FUSION_GENES_TABLE, true);
            }
            this.chartsType.set(UniqueKey.FUSION_GENES_TABLE, ChartTypeEnum.FUSION_GENES_TABLE);
            this.chartsDimension.set(UniqueKey.FUSION_GENES_TABLE,STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.FUSION_GENES_TABLE]);
        }
        if (!_.isEmpty(this.cnaProfiles.result)) {
            const cnaGeneMeta = _.find(this.chartMetaSet, chartMeta => chartMeta.uniqueKey === UniqueKey.CNA_GENES_TABLE);
            this.chartsType.set(UniqueKey.CNA_GENES_TABLE, ChartTypeEnum.CNA_GENES_TABLE);
            this.chartsDimension.set(UniqueKey.CNA_GENES_TABLE, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.CNA_GENES_TABLE]);
            if (cnaGeneMeta && cnaGeneMeta.priority !== 0) {
                this.changeChartVisibility(UniqueKey.CNA_GENES_TABLE, true);
            }
        }

        this.initializeClinicalDataCountCharts();
        this.initializeClinicalDataBinCountCharts();
        this._defualtChartsDimension = observable.map(this.chartsDimension.toJS());
        this._defaultChartsType = observable.map(this.chartsType.toJS());
        this._defaultVisibleChartIds = this.visibleAttributes.map(attribute => attribute.uniqueKey);
        this._defaultClinicalDataBinFilterSet = observable.map(toJS(this._clinicalDataBinFilterSet));
    }

    @action
    initializeChartStatsByClinicalAttributes() {
        let osStatusFlag = false;
        let osMonthsFlag = false;
        let dfsStatusFlag = false;
        let dfsMonthsFlag = false;
        let mutationCountFlag = false;
        let fractionGenomeAlteredFlag = false;

        this.clinicalAttributes.result.forEach((obj: ClinicalAttribute) => {
            const uniqueKey = getClinicalAttributeUniqueKey(obj);
            if (obj.priority !== "0") {
                if (obj.clinicalAttributeId === OS_STATUS) {
                    osStatusFlag = true;
                } else if (obj.clinicalAttributeId === OS_MONTHS) {
                    osMonthsFlag = true;
                } else if (obj.clinicalAttributeId === DFS_STATUS) {
                    dfsStatusFlag = true;
                } else if (obj.clinicalAttributeId === DFS_MONTHS) {
                    dfsMonthsFlag = true;
                } else if (MUTATION_COUNT === obj.clinicalAttributeId) {
                    mutationCountFlag = true;
                } else if (FRACTION_GENOME_ALTERED === obj.clinicalAttributeId) {
                    fractionGenomeAlteredFlag = true;
                }
            }

            if (obj.datatype === 'NUMBER') {
                this.chartsType.set(uniqueKey, ChartTypeEnum.BAR_CHART);
                this.chartsDimension.set(uniqueKey, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.BAR_CHART]);
            } else {
                this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
                this.chartsDimension.set(uniqueKey, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.PIE_CHART]);
            }
        });

        const cancerTypeIds = _.uniq(this.queriedPhysicalStudies.result.map(study => study.cancerTypeId));

        this.chartsType.set(UniqueKey.OVERALL_SURVIVAL, ChartTypeEnum.SURVIVAL);
        this.chartsDimension.set(UniqueKey.OVERALL_SURVIVAL, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SURVIVAL]);
        if (osStatusFlag && osMonthsFlag && getDefaultPriorityByUniqueKey(UniqueKey.OVERALL_SURVIVAL) !== 0) {
            // hide OVERALL_SURVIVAL chart if cancer type is mixed or have more than one cancer type
            if (cancerTypeIds.length === 1 && cancerTypeIds[0] !== 'mixed') {
                this.changeChartVisibility(UniqueKey.OVERALL_SURVIVAL, true);
            }
        }
        this.chartsType.set(UniqueKey.DISEASE_FREE_SURVIVAL, ChartTypeEnum.SURVIVAL);
        this.chartsDimension.set(UniqueKey.DISEASE_FREE_SURVIVAL, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SURVIVAL]);
        if (dfsStatusFlag && dfsMonthsFlag && getDefaultPriorityByUniqueKey(UniqueKey.DISEASE_FREE_SURVIVAL) !== 0) {
            // hide DISEASE_FREE_SURVIVAL chart if cancer type is mixed or have more than one cancer type
            if (cancerTypeIds.length === 1 && cancerTypeIds[0] !== 'mixed') {
                this.changeChartVisibility(UniqueKey.DISEASE_FREE_SURVIVAL, true);
            }
        }

        this.chartsType.set(UniqueKey.MUTATION_COUNT_CNA_FRACTION, ChartTypeEnum.SCATTER);
        this.chartsDimension.set(UniqueKey.MUTATION_COUNT_CNA_FRACTION, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.SCATTER]);
        if (mutationCountFlag && fractionGenomeAlteredFlag && getDefaultPriorityByUniqueKey(UniqueKey.MUTATION_COUNT_CNA_FRACTION)!== 0) {
            this.changeChartVisibility(UniqueKey.MUTATION_COUNT_CNA_FRACTION, true);
        }

        // This is also the proper place to initialize the special charts visibility
        _.each(this.specialChartKeysInCustomCharts, key => {
            this.showAsPieChart(key, key === UniqueKey.CANCER_STUDIES ? this.cancerStudiesData.result.length : 2, false);
        });
    }
    private getTableDimensionByNumberOfRecords(records: number) {
        return records <= STUDY_VIEW_CONFIG.thresholds.rowsInTableForOneGrid ? {
            w: 2,
            h: 1
        } : {w: 2, h: 2};
    }

    @computed
    get specialChartKeysInCustomCharts() {
        if (this.queriedPhysicalStudyIds.result.length > 1) {
            return [UniqueKey.CANCER_STUDIES];
        } else {
            return []
        }
    }

    @autobind @action
    changeChartType(attr: ChartMeta, newChartType: ChartType) {
        let data: MobxPromise<ClinicalDataCountSummary[]> | undefined
        if (newChartType === ChartTypeEnum.TABLE) {
            if (_.includes(this.specialChartKeysInCustomCharts, attr.uniqueKey)) {
                if (attr.uniqueKey === UniqueKey.CANCER_STUDIES) {
                    data = this.cancerStudiesData;
                }
            } else if (this.isCustomChart(attr.uniqueKey)) {
                data = this.getCustomChartDataCount(attr);
            } else {
                data = this.getClinicalDataCount(attr);
            }
            if (data !== undefined) {
                this.chartsDimension.set(attr.uniqueKey, this.getTableDimensionByNumberOfRecords(data.result!.length));
            }
            this.chartsType.set(attr.uniqueKey, ChartTypeEnum.TABLE);
        } else {
            this.chartsDimension.set(attr.uniqueKey, STUDY_VIEW_CONFIG.layout.dimensions[newChartType]);
            this.chartsType.set(attr.uniqueKey, newChartType);
        }
        this.currentFocusedChartByUser = _.clone(attr);
        this.currentFocusedChartByUserDimension = this.chartsDimension.get(attr.uniqueKey);
        this.useCurrentGridLayout=true
    }

    readonly defaultVisibleAttributes = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: async () => {
            let queriedAttributes = this.clinicalAttributes.result.map(attr => {
                attr.priority = getPriorityByClinicalAttribute(attr).toString();
                return attr;
            });

            let filterAttributes: ClinicalAttribute[] = queriedAttributes.sort(clinicalAttributeComparator).slice(0, 20);

            // Also check the initial filters, make sure all clinical attributes in initial filters will be added in default visible attributes
            let initialFilteredAttributeIds:string[] = [];
            if(this.initialFilters.clinicalDataEqualityFilters !== undefined){
                initialFilteredAttributeIds = initialFilteredAttributeIds.concat(this.initialFilters.clinicalDataEqualityFilters.map(item => item.attributeId));
            }

            if(this.initialFilters.clinicalDataIntervalFilters !== undefined){
                initialFilteredAttributeIds = initialFilteredAttributeIds.concat(this.initialFilters.clinicalDataIntervalFilters.map(item => item.attributeId));
            }

            if (initialFilteredAttributeIds.length > 0) {
                const initialFilteredAttributes = _.filter(this.clinicalAttributes.result, item => initialFilteredAttributeIds.includes(item.clinicalAttributeId));
                if (filterAttributes !== undefined) {
                    filterAttributes = filterAttributes.concat(initialFilteredAttributes);
                }
            }
            return _.uniq(filterAttributes);
        },
        onError: (error => {}),
        default: []
    });

    readonly initialVisibleAttributesClinicalDataCountData = remoteData<ClinicalDataCountItem[]>({
        await: () => [this.defaultVisibleAttributes],
        invoke: async () => {
            const attributes = _.uniqBy(
                _.filter(this.defaultVisibleAttributes.result, attr => attr.datatype === 'STRING').map(attr => {
                    return {
                        attributeId: attr.clinicalAttributeId,
                        clinicalDataType: attr.patientAttribute ? 'PATIENT' : 'SAMPLE'
                    } as ClinicalDataFilter
                }),
                attr => `${attr.attributeId}_${attr.clinicalDataType}`
            );

            return internalClient.fetchClinicalDataCountsUsingPOST({
                clinicalDataCountFilter: {
                    attributes,
                    studyViewFilter: this.initialFilters
                } as ClinicalDataCountFilter
            });
        },
        onError: (error => {}),
        default: []
    });

    readonly initialVisibleAttributesClinicalDataBinAttributes = remoteData<ClinicalDataBinFilter[]>({
        await: () => [this.defaultVisibleAttributes],
        invoke: async () => {
            return _.chain(this.defaultVisibleAttributes.result)
                .filter(attr => attr.datatype === 'NUMBER')
                .map(this.getDefaultClinicalDataBinFilter)
                .uniqBy(attr => `${attr.attributeId}_${attr.clinicalDataType}`)
                .value();
        },
        onError: (error => {
        }),
        default: []
    });

    readonly initialVisibleAttributesClinicalDataBinCountData = remoteData<DataBin[]>({
        await: () => [this.initialVisibleAttributesClinicalDataBinAttributes],
        invoke: async () => {
            return internalClient.fetchClinicalDataBinCountsUsingPOST({
                dataBinMethod: 'STATIC',
                clinicalDataBinCountFilter: {
                    attributes: this.initialVisibleAttributesClinicalDataBinAttributes.result,
                    studyViewFilter: this.initialFilters
                } as ClinicalDataBinCountFilter
            });
        },
        onError: (error => {
        }),
        default: []
    });

    @action
    initializeClinicalDataCountCharts() {
        _.each(this.initialVisibleAttributesClinicalDataCountData.result, item => {
            const uniqueKey = getClinicalAttributeUniqueKeyByDataTypeAttrId(item.clinicalDataType, item.attributeId);
            this.showAsPieChart(uniqueKey, item.counts.length, item.clinicalDataType === "PATIENT" ? true : false);
        });
    }

    @action
    initializeClinicalDataBinCountCharts() {
        _.each(_.groupBy(this.initialVisibleAttributesClinicalDataBinCountData.result, 'attributeId'), (item:DataBin[], attributeId:string) => {
            const uniqueKey = getClinicalAttributeUniqueKeyByDataTypeAttrId(item[0].clinicalDataType, attributeId);
            this.chartsType.set(uniqueKey, ChartTypeEnum.BAR_CHART);
            this.chartsDimension.set(uniqueKey, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.BAR_CHART]);

            if (shouldShowChart(this.initialFilters, item.length, this.samples.result.length)) {
                this._chartVisibility.set(uniqueKey, true);
            }
        });
    }

    @computed
    get chartsAreFiltered() {
        return isFiltered(this.userSelections);
    }

    readonly samples = remoteData<Sample[]>({
        await: () => [this.clinicalAttributes, this.queriedSampleIdentifiers, this.queriedPhysicalStudyIds],
        invoke: () => {
            let studyViewFilter: StudyViewFilter = {} as any
            //this logic is need since fetchFilteredSamplesUsingPOST api accepts sampleIdentifiers or studyIds not both
            if (this.queriedSampleIdentifiers.result.length > 0) {
                studyViewFilter.sampleIdentifiers = this.queriedSampleIdentifiers.result;
            } else {
                studyViewFilter.studyIds = this.queriedPhysicalStudyIds.result;
            }

            return internalClient.fetchFilteredSamplesUsingPOST({
                studyViewFilter: studyViewFilter
            });
        },
        onError: (error => {}),
        default: []
    });

    public readonly sampleSet = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            const sampleSet = new ComplexKeyMap<Sample>();
            for (const sample of this.samples.result!) {
                sampleSet.set({studyId: sample.studyId, sampleId: sample.sampleId}, sample);
            }
            return Promise.resolve(sampleSet);
        }
    });


    readonly invalidSampleIds = remoteData<SampleIdentifier[]>({
        await: () => [this.queriedSampleIdentifiers, this.samples],
        invoke: async () => {
            if (this.queriedSampleIdentifiers.result.length > 0 &&
                this.samples.result.length !== this.queriedSampleIdentifiers.result.length) {

                let validSampleIdentifiers = _.reduce(this.samples.result, (acc, next) => {
                    acc[next.studyId + '_' + next.sampleId] = true
                    return acc;
                }, {} as { [id: string]: boolean })
                return _.filter(this.queriedSampleIdentifiers.result, sampleIdentifier => {
                    return !validSampleIdentifiers[sampleIdentifier.studyId + '_' + sampleIdentifier.sampleId]
                })
            }
            return []
        },
        onError: (error => {}),
        default: []
    });

    // used in building virtual study
    readonly studyWithSamples = remoteData<StudyWithSamples[]>({
        await: () => [this.selectedSamples, this.filteredPhysicalStudies, this.filteredVirtualStudies],
        invoke: () => {
            return Promise.resolve(getFilteredStudiesWithSamples(
                this.selectedSamples.result,
                this.filteredPhysicalStudies.result,
                this.filteredVirtualStudies.result));
        },
        onError: (error => {}),
        default: []
    });

    readonly selectedSamples = remoteData<Sample[]>({
        await: () => [this.samples],
        invoke: () => {
            //fetch samples when there are only filters applied
            if (this.chartsAreFiltered) {
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: this.filters
                })
            }
            return Promise.resolve(this.samples.result)
        },
        onError: (error => {}),
        default: []
    });

    @computed
    get selectedSamplesMap() {
        return _.keyBy(this.selectedSamples.result!, s=>s.uniqueSampleKey);
    }

    readonly selectedPatientKeys = remoteData<string[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            return _.uniq(this.selectedSamples.result.map(sample => sample.uniquePatientKey));
        },
        onError: (error => {}),
        default: []
    });

    @computed
    get selectedPatients(): Patient[] {
        return _.values(_.reduce(this.selectedSamples.result, (acc, sample) => {
            acc[sample.uniquePatientKey] = {
                cancerStudy: {} as any,
                patientId: sample.patientId,
                uniquePatientKey: sample.uniquePatientKey,
                studyId: sample.studyId,
                uniqueSampleKey: sample.uniqueSampleKey
            };
            return acc;
        }, {} as { [key: string]: Patient }))
    };

    readonly unSelectedPatientKeys = remoteData<string[]>({
        await: () => [this.samples, this.selectedPatientKeys],
        invoke: async () => {
            const selectedPatientKeysObj = _.reduce(this.selectedPatientKeys.result, (acc, next)=>{
                acc[next] = true;
                return acc;
            },{} as {[patientKey:string]:boolean});
            const unselectedPatientSet = _.reduce(this.samples.result, (acc: { [id: string]: boolean }, next) => {
                if (selectedPatientKeysObj[next.uniquePatientKey] === undefined) {
                    acc[next.uniquePatientKey] = true;
                }
                return acc;
            }, {});
            return Object.keys(unselectedPatientSet);
        },
        onError: (error => {}),
        default: []
    });

    public genePanelCache = new MobxPromiseCache<{ genePanelId: string }, GenePanel>(q => ({
        invoke: () => {
            return defaultClient.getGenePanelUsingGET(q);
        }
    }));

    readonly mutatedGeneTableRowData = remoteData<GeneTableRow[]>({
        await: () => this.oncokbCancerGeneFilterEnabled ?
            [this.mutationProfiles, this.oncokbAnnotatedGeneEntrezGeneIds, this.oncokbOncogeneEntrezGeneIds, this.oncokbTumorSuppressorGeneEntrezGeneIds, this.oncokbCancerGeneEntrezGeneIds] :
            [this.mutationProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                let mutatedGenes = await internalClient.fetchMutatedGenesUsingPOST({
                    studyViewFilter: this.filters
                });
                return mutatedGenes.map(item => {
                    return {
                        ...item,
                        uniqueKey: getMutationUniqueKey(item.entrezGeneId, item.hugoGeneSymbol),
                        oncokbAnnotated: this.oncokbCancerGeneFilterEnabled ? this.oncokbAnnotatedGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isOncokbOncogene: this.oncokbCancerGeneFilterEnabled ? this.oncokbOncogeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isOncokbTumorSuppressorGene: this.oncokbCancerGeneFilterEnabled ? this.oncokbTumorSuppressorGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isCancerGene: this.oncokbCancerGeneFilterEnabled ? this.oncokbCancerGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false
                    };
                });
            } else {
                return [];
            }
        },
        onError: (error => {
        }),
        default: []
    });

    readonly fusionGeneTableRowData = remoteData<GeneTableRow[]>({
        await: () => this.oncokbCancerGeneFilterEnabled ?
            [this.mutationProfiles, this.oncokbAnnotatedGeneEntrezGeneIds, this.oncokbOncogeneEntrezGeneIds, this.oncokbTumorSuppressorGeneEntrezGeneIds, this.oncokbCancerGeneEntrezGeneIds] :
            [this.mutationProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                const fusionGenes = await internalClient.fetchFusionGenesUsingPOST({
                    studyViewFilter: this.filters
                });
                return fusionGenes.map(item => {
                    return {
                        ...item,
                        uniqueKey: getMutationUniqueKey(item.entrezGeneId, item.hugoGeneSymbol),
                        oncokbAnnotated: this.oncokbCancerGeneFilterEnabled ? this.oncokbAnnotatedGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isOncokbOncogene: this.oncokbCancerGeneFilterEnabled ? this.oncokbOncogeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isOncokbTumorSuppressorGene: this.oncokbCancerGeneFilterEnabled ? this.oncokbTumorSuppressorGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isCancerGene: this.oncokbCancerGeneFilterEnabled ? this.oncokbCancerGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false
                    };
                });
            } else {
                return [];
            }
        },
        onError: (error => {
        }),
        default: []
    });

    readonly cnaGeneTableRowData = remoteData<GeneTableRow[]>({
        await: () => this.oncokbCancerGeneFilterEnabled ?
            [this.cnaProfiles, this.oncokbAnnotatedGeneEntrezGeneIds, this.oncokbOncogeneEntrezGeneIds, this.oncokbTumorSuppressorGeneEntrezGeneIds, this.oncokbCancerGeneEntrezGeneIds] :
            [this.mutationProfiles],
        invoke: async () => {
            if (!_.isEmpty(this.cnaProfiles.result)) {
                let cnaGenes = await internalClient.fetchCNAGenesUsingPOST({
                    studyViewFilter: this.filters
                });
                return cnaGenes.map(item => {
                    return {
                        ...item,
                        uniqueKey: getCnaUniqueKey(item.entrezGeneId, item.hugoGeneSymbol, item.alteration),
                        oncokbAnnotated: this.oncokbCancerGeneFilterEnabled ? this.oncokbAnnotatedGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isOncokbOncogene: this.oncokbCancerGeneFilterEnabled ? this.oncokbOncogeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isOncokbTumorSuppressorGene: this.oncokbCancerGeneFilterEnabled ? this.oncokbTumorSuppressorGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                        isCancerGene: this.oncokbCancerGeneFilterEnabled ? this.oncokbCancerGeneEntrezGeneIds.result.includes(item.entrezGeneId) : false,
                    };
                });
            } else {
                return [];
            }
        },
        onError: (error => {}),
        default: []
    });

    readonly entrezGeneIdToGene = remoteData({
        await:()=>[this.mutatedGeneTableRowData, this.cnaGeneTableRowData],
        invoke:()=>{
            const ret:{[entrez:number]:GeneIdentifier} = {};
            for (const d of this.mutatedGeneTableRowData.result!) {
                ret[d.entrezGeneId] = d;
            }
            for (const d of this.cnaGeneTableRowData.result!) {
                ret[d.entrezGeneId] = d;
            }
            return Promise.resolve(ret);
        }
    });

    readonly cnSegments = remoteData<CopyNumberSeg[]>({
        await: () => [
            this.selectedSamples
        ],
        invoke: () => fetchCopyNumberSegmentsForSamples(this.selectedSamples.result)
    }, []);

    @computed private get survivalPlots() {
        let osStatusFlag = false;
        let osMonthsFlag = false;
        let dfsStatusFlag = false;
        let dfsMonthsFlag = false;
        let survivalTypes: SurvivalType[] = [];

        this.clinicalAttributes.result.forEach(obj => {
            if (obj.clinicalAttributeId === OS_STATUS) {
                osStatusFlag = true;
            } else if (obj.clinicalAttributeId === OS_MONTHS) {
                osMonthsFlag = true;
            } else if (obj.clinicalAttributeId === DFS_STATUS) {
                dfsStatusFlag = true;
            } else if (obj.clinicalAttributeId === DFS_MONTHS) {
                dfsMonthsFlag = true;
            }
        });

        if (osStatusFlag && osMonthsFlag) {
            survivalTypes.push({
                id: UniqueKey.OVERALL_SURVIVAL,
                title: 'Overall Survival',
                associatedAttrs: [OS_STATUS, OS_MONTHS],
                filter: ['DECEASED'],
                survivalData: []
            });

        }
        if (dfsStatusFlag && dfsMonthsFlag) {
            survivalTypes.push({
                id: UniqueKey.DISEASE_FREE_SURVIVAL,
                title: 'Disease Free Survival',
                associatedAttrs: [DFS_STATUS, DFS_MONTHS],
                filter: ['Recurred/Progressed', 'Recurred'],
                survivalData: []
            });
        }

        return survivalTypes;
    }

    public async getPieChartDataDownload(chartMeta: ChartMeta, dataType?: DataType) {
        const isCustomChart = this.isCustomChart(chartMeta.uniqueKey);
        if (dataType && dataType === 'summary') {
            if (isCustomChart) {
                return this.getClinicalDataCountSummary(chartMeta, this.getCustomChartDataCount(chartMeta).result!);
            } else {
                return this.getClinicalDataCountSummary(chartMeta, this.getClinicalDataCount(chartMeta).result!)
            }
        } else {
            if (isCustomChart) {
                return this.getCustomChartDownloadData(chartMeta)
            } else {
                return this.getClinicalData(chartMeta)
            }
        }
    }

    public getClinicalDataCountSummary(chartMeta: ChartMeta, clinicalDataCountSummaries:ClinicalDataCountSummary[]) {
        const subInfo = chartMeta.patientAttribute ? 'patients' : 'samples';
        const header: string[] = ["Category", `Number of ${subInfo}`, `Percentage of ${subInfo}`];
        let data = [header.join("\t")];
        data = data.concat(clinicalDataCountSummaries.map(clinicalData => [clinicalData.value, clinicalData.count, clinicalData.freq].join("\t")));
        return data.join("\n");
    }

    public async getClinicalData(chartMeta: ChartMeta) {
        if (chartMeta.clinicalAttribute && this.samples.result) {
            const clinicalDataList = await defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: chartMeta.clinicalAttribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                clinicalDataMultiStudyFilter: {
                    attributeIds: [chartMeta.clinicalAttribute.clinicalAttributeId],
                    identifiers: this.selectedSamples.result.map(sample => ({
                        entityId: chartMeta.clinicalAttribute!.patientAttribute ? sample.patientId : sample.sampleId,
                        studyId: sample.studyId
                    }))
                }
            });

            const header: string[] = ["Study ID", "Patient ID"];

            if (!chartMeta.clinicalAttribute!.patientAttribute) {
                header.push("Sample ID");
            }

            header.push(chartMeta.clinicalAttribute.displayName);

            let data = [header.join("\t")];

            data = data.concat(clinicalDataList.map(clinicalData => {
                const row = [clinicalData.studyId || NA_DATA, clinicalData.patientId || NA_DATA];

                if (!chartMeta.clinicalAttribute!.patientAttribute) {
                    row.push(clinicalData.sampleId || NA_DATA);
                }

                row.push(clinicalData.value || NA_DATA);

                return row.join("\t");
            }));

            return data.join("\n");
        }
        else {
            return "";
        }
    }

    public getCustomChartDownloadData(chartMeta: ChartMeta) {
        return new Promise<string>((resolve) => {
            if (chartMeta && chartMeta.uniqueKey && this._customChartsSelectedCases.has(chartMeta.uniqueKey)) {
                let isPatientChart = true;
                let header = ["Study ID", "Patient ID",];

                if (!chartMeta.patientAttribute) {
                    isPatientChart = false;
                    header.push('Sample ID');
                }
                header.push(chartMeta.displayName);
                let data = [header.join("\t")];
                if (isPatientChart) {
                    data = data.concat(this.selectedPatients.map((patient: Patient) => {
                        let record = _.find(this._customChartsSelectedCases.get(chartMeta.uniqueKey), (caseIdentifier: CustomChartIdentifierWithValue) => {
                            return caseIdentifier.studyId === patient.studyId && patient.patientId === caseIdentifier.patientId;
                        });
                        return [patient.studyId || NA_DATA, patient.patientId || NA_DATA, record === undefined ? 'NA' : record.value].join("\t");
                    }));
                } else {
                    data = data.concat(this.selectedSamples.result!.map((sample: Sample) => {
                        let record = _.find(this._customChartsSelectedCases.get(chartMeta.uniqueKey), (caseIdentifier: CustomChartIdentifierWithValue) => {
                            return caseIdentifier.studyId === sample.studyId && sample.sampleId === caseIdentifier.sampleId;
                        });
                        return [sample.studyId || NA_DATA, sample.patientId || NA_DATA, sample.sampleId || NA_DATA, record === undefined ? 'NA' : record.value].join("\t");
                    }));
                }
                resolve(data.join("\n"));
            } else {
                resolve("");
            }
        });
    }

    public getScatterDownloadData()
    {
        return new Promise<string>((resolve)=>{
            onMobxPromise(this.mutationCountVsFGAData, data=>{
                if (data) {
                    resolve(generateScatterPlotDownloadData(
                        data,
                        this.sampleToAnalysisGroup.result,
                        undefined,
                        this.analysisGroupsSettings.groups as AnalysisGroup[]
                    ));
                } else {
                    resolve("");
                }
            });
        });
    }

    public async getSurvivalDownloadData(chartMeta: ChartMeta)
    {
        const matchedPlot = _.find(this.survivalPlots, plot =>plot.id===chartMeta.uniqueKey);
        if (matchedPlot && this.survivalData.result)
        {
            const data: string[] = [];

            // find the unique clinical attribute ids
            const uniqueClinicalAttributeIds = matchedPlot.associatedAttrs;

            // add the header row
            data.push(["Study ID", "Patient ID", ...uniqueClinicalAttributeIds].join("\t"));

            // add the data rows
            const selectedPatientMap = _.reduce(this.selectedPatients, (acc, next)=>{
                acc[next.uniquePatientKey] = next;
                return acc;
            }, {} as {[uniquePatientKey:string]:Patient});
            this.selectedPatientKeys.result.forEach(uniquePatientKey => {
                const clinicalDataList = this.survivalData.result[uniquePatientKey];
                const row: string[] = [];

                if (clinicalDataList && clinicalDataList.length > 0) {
                    row.push(clinicalDataList[0].studyId || NA_DATA);
                    row.push(clinicalDataList[0].patientId || NA_DATA);
                    const keyed = _.keyBy(clinicalDataList, 'clinicalAttributeId');

                    _.each(uniqueClinicalAttributeIds, id => {
                        row.push(keyed[id] ? keyed[id].value || NA_DATA : NA_DATA);
                    });
                } else {
                    const selectedPatient = selectedPatientMap[uniquePatientKey];
                    if (selectedPatient) {
                        row.push(selectedPatient.studyId || NA_DATA);
                        row.push(selectedPatient.patientId || NA_DATA);

                        _.each(uniqueClinicalAttributeIds, id => {
                            row.push(NA_DATA);
                        });
                    }
                }

                data.push(row.join("\t"));
            });

            return data.join("\n");
        }
        else {
            return "";
        }
    }

    public async getMutatedGenesDownloadData() {
        if (this.mutatedGeneTableRowData.result) {
            let header = ['Gene', 'MutSig(Q-value)', '# Mut', '#', 'Freq'];
            if(this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            let data = [header.join('\t')];
            _.each(this.mutatedGeneTableRowData.result, (record: GeneTableRow) => {
                let rowData = [
                    record.hugoGeneSymbol,
                    record.qValue === undefined ? '' : getQValue(record.qValue),
                    record.totalCount,
                    record.numberOfAlteredCases,
                    getFrequencyStr(record.numberOfAlteredCases / record.numberOfProfiledCases * 100)
                ];
                if (this.oncokbCancerGeneFilterEnabled) {
                    rowData.push(this.oncokbCancerGeneFilterEnabled ? (record.isCancerGene ? 'Yes' : 'No') : 'NA');
                }
                data.push(rowData.join("\t"));
            });
            return data.join("\n");
        } else
            return '';
    }

    public getFusionGenesDownloadData() {
        if (this.fusionGeneTableRowData.result) {
            const header = ['Gene','# Fusion', '#', 'Freq'];
            if(this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            const data = [header.join('\t')];
            _.each(this.fusionGeneTableRowData.result, (record: GeneTableRow) => {
                const rowData = [
                    record.hugoGeneSymbol,
                    record.totalCount,
                    record.numberOfAlteredCases,
                    getFrequencyStr(record.numberOfAlteredCases / record.numberOfProfiledCases * 100)
                ];
                if (this.oncokbCancerGeneFilterEnabled) {
                    rowData.push(this.oncokbCancerGeneFilterEnabled ? (record.isCancerGene ? 'Yes' : 'No') : 'NA');
                }
                data.push(rowData.join("\t"));
            });
            return data.join("\n");
        } else
            return '';
    }

    public async getGenesCNADownloadData() {
        if (this.cnaGeneTableRowData.result) {
            let header = ['Gene', 'Gistic(Q-value)', 'Cytoband', 'CNA', '#', 'Freq'];
            if (this.oncokbCancerGeneFilterEnabled) {
                header.push('Is Cancer Gene (source: OncoKB)');
            }
            let data = [header.join('\t')];
            _.each(this.cnaGeneTableRowData.result, (record: GeneTableRow) => {
                let rowData = [
                    record.hugoGeneSymbol,
                    record.qValue === undefined ? '' : getQValue(record.qValue),
                    record.cytoband, getCNAByAlteration(record.alteration!),
                    record.numberOfAlteredCases, getFrequencyStr(record.numberOfAlteredCases / record.numberOfProfiledCases * 100)
                ];
                if (this.oncokbCancerGeneFilterEnabled) {
                    rowData.push(this.oncokbCancerGeneFilterEnabled ? (record.isCancerGene ? 'Yes' : 'No') : 'NA');
                }
                data.push(rowData.join("\t"));
            });
            return data.join("\n");
        } else
            return '';
    }

    readonly survivalPlotData = remoteData<SurvivalType[]>({
        await: () => [this.survivalData, this.selectedPatientKeys],
        invoke: async () => {

            return this.survivalPlots.map(obj => {
                obj.survivalData = getPatientSurvivals(
                    this.survivalData.result,
                    this.selectedPatientKeys.result!, obj.associatedAttrs[0], obj.associatedAttrs[1], s => obj.filter.includes(s));
                return obj
            });
        },
        onError: (error => {}),
        default: []
    });

    readonly survivalData = remoteData<{ [id: string]: ClinicalData[] }>({
        await: () => [this.clinicalAttributes, this.samples],
        invoke: async () => {
            const attributeIds = _.flatten(this.survivalPlots.map(obj => obj.associatedAttrs))
            if(!_.isEmpty(attributeIds)){
                const filter: ClinicalDataMultiStudyFilter = {
                    attributeIds: attributeIds,
                    identifiers: _.map(this.samples.result!, obj => {
                        return {
                            "entityId": obj.patientId,
                            "studyId": obj.studyId
                        }
                    })
                };

                let data = await defaultClient.fetchClinicalDataUsingPOST({
                    clinicalDataType: ClinicalDataTypeEnum.PATIENT,
                    clinicalDataMultiStudyFilter: filter
                })

                return _.groupBy(data, 'uniquePatientKey')
            }
            return {}
        },
        onError: (error => {}),
        default: {}
    });

    readonly mutationCountVsCNADensityData = remoteData<{bins:DensityPlotBin[], xBinSize:number, yBinSize:number}>({
        await:()=>[this.clinicalAttributes],
        invoke:async()=>{
            if (!!this.clinicalAttributes.result!.find(a=>a.clinicalAttributeId === MUTATION_COUNT) &&
                !!this.clinicalAttributes.result!.find(a=>a.clinicalAttributeId === FRACTION_GENOME_ALTERED)) {
                let yAxisBinCount = MutationCountVsCnaYBinsMin;
                // dont have more bins than there are integers in the plot area
                const filter = this.getMutationCountVsCNAFilter();
                if (filter) {
                    yAxisBinCount = Math.min(yAxisBinCount, Math.floor(filter.yEnd));
                }
                // remove selection area filter because we want to show even unselected dots
                const studyViewFilter = Object.assign({}, this.filters);
                delete studyViewFilter.mutationCountVsCNASelection;

                const xAxisBinCount = 50;
                const bins = (await internalClient.fetchClinicalDataDensityPlotUsingPOST({
                    xAxisAttributeId: FRACTION_GENOME_ALTERED,
                    yAxisAttributeId: MUTATION_COUNT,
                    xAxisStart:0, xAxisEnd:1, // FGA always goes 0 to 1
                    yAxisStart:0, // mutation always starts at 0
                    xAxisBinCount,
                    yAxisBinCount,
                    clinicalDataType: "SAMPLE",
                    studyViewFilter
                })).filter(bin=>(bin.count > 0));// only show points for bins with stuff in them
                const xBinSize = 1/xAxisBinCount;
                const yBinSize = Math.max(...bins.map(bin=>bin.binY)) / (yAxisBinCount - 1);
                return {
                    bins, xBinSize, yBinSize
                };
            } else {
                return {
                    bins: [],
                    xBinSize:-1,
                    yBinSize:-1
                };
            }
        },
        onError: (error => {}),
        default: {
            bins: [],
            xBinSize:-1,
            yBinSize:-1
        }
    });

    readonly sampleMutationCountAndFractionGenomeAlteredData = remoteData({
        await:()=>[this.clinicalAttributes, this.selectedSamples],
        invoke:()=>{
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: [MUTATION_COUNT, FRACTION_GENOME_ALTERED],
                identifiers: _.map(this.selectedSamples.result!, obj => {
                    return {
                        "entityId": obj.sampleId,
                        "studyId": obj.studyId
                    }
                })
            };

            return defaultClient.fetchClinicalDataUsingPOST({
                clinicalDataType: ClinicalDataTypeEnum.SAMPLE,
                clinicalDataMultiStudyFilter: filter
            });
        },
        onError: (error => {}),
        default: []
    });

    readonly mutationCountVsFGAData = remoteData({
        await:()=>[this.sampleMutationCountAndFractionGenomeAlteredData],
        onError: (error => {}),
        invoke: async ()=>{
            return _.reduce(_.groupBy(this.sampleMutationCountAndFractionGenomeAlteredData.result, datum => datum.uniqueSampleKey), (acc, data) => {
                if (data.length == 2) { // 2 => number of attribute ids
                    let _datum: IStudyViewScatterPlotData = {
                        studyId: data[0].studyId,
                        sampleId: data[0].sampleId,
                        patientId: data[0].patientId,
                        uniqueSampleKey: data[0].uniqueSampleKey,
                        x: 0,
                        y: 0
                    };
                    _.forEach(data, datum => {
                        if (datum.clinicalAttributeId === MUTATION_COUNT) {
                            _datum.y = Number(datum.value)
                        } else if (datum.clinicalAttributeId === FRACTION_GENOME_ALTERED) {
                            _datum.x = Number(datum.value)
                        }
                    });
                    acc.push(_datum)
                }
                return acc
            }, [] as IStudyViewScatterPlotData[]);
        }
    });


    readonly mutationCountVsFractionGenomeAlteredDataSet = remoteData<{ [id: string]: IStudyViewScatterPlotData }>({
        await: () => [this.mutationCountVsFGAData],
        invoke: () => {
            return Promise.resolve(_.keyBy(this.mutationCountVsFGAData.result, datum => datum.uniqueSampleKey));
        },
        default: {}
    });

    readonly getDataForClinicalDataTab = remoteData({
        await: () => [this.clinicalAttributes, this.selectedSamples],
        onError: (error => {}),
        invoke: async () => {
            let sampleClinicalDataMap: { [attributeId: string]: { [attributeId: string]: string; } } = await this.getClinicalDataBySamples(this.selectedSamples.result)
            return _.reduce(this.selectedSamples.result, (acc, next) => {

                let sampleData: { [attributeId: string]: string; } = {
                    studyId: next.studyId,
                    patientId: next.patientId,
                    sampleId: next.sampleId,
                    ...(sampleClinicalDataMap[next.uniqueSampleKey] || {})
                };

                acc.push(sampleData);
                return acc;
            }, [] as { [id: string]: string }[]);
        },
        default: []
    });

    readonly molecularProfileSampleCounts = remoteData<MolecularProfileSampleCount>({
        onError: (error => {}),
        invoke: async () => {
            return internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                studyViewFilter: this.filters
            });
        }
    });

    readonly initialMolecularProfileSampleCounts = remoteData<MolecularProfileSampleCount>({
        onError: (error => {}),
        invoke: async () => {
            return internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                studyViewFilter: this.initialFilters
            });
        }
    });

    readonly clinicalAttributesCounts = remoteData({
        await: () => [this.selectedSamples],
        onError: (error => {}),
        invoke: () => {
            let sampleIdentifiers = this.selectedSamples.result.map(sample => {
                return {
                    sampleId: sample.sampleId,
                    studyId: sample.studyId
                }
            });

            let clinicalAttributeCountFilter = {
                sampleIdentifiers
            } as ClinicalAttributeCountFilter;
            return defaultClient.getClinicalAttributeCountsUsingPOST({
                clinicalAttributeCountFilter
            });
        }
    });

    readonly clinicalDataWithCount = remoteData<ClinicalDataCountSet>({
        await: () => [
            this.molecularProfileSampleCounts,
            this.survivalPlotData,
            this.clinicalAttributeIdToClinicalAttribute,
            this.clinicalAttributesCounts,
            this.cancerStudiesData,
        ],
        invoke: async () => {
            if (!_.isEmpty(this.chartMetaSet)) {
                const attributeIdToAttribute = this.clinicalAttributeIdToClinicalAttribute.result!;
                // build map
                const ret: { [clinicalAttributeId: string]: number } =
                    _.reduce(this.clinicalAttributesCounts.result || [], (map: ClinicalDataCountSet, next: ClinicalAttributeCount) => {
                        const attribute = attributeIdToAttribute[next.clinicalAttributeId];
                        if (attribute) {
                            let key = getClinicalAttributeUniqueKey(attribute);
                            map[key] = map[key] || 0;
                            map[key] += next.count;
                        }
                        return map;
                    }, {});

                _.each(this.survivalPlotData.result, (survivalPlot) => {
                    if (survivalPlot.id in this.chartMetaSet) {
                        ret[survivalPlot.id] = survivalPlot.survivalData.length;
                    }
                });

                if (UniqueKey.CANCER_STUDIES in this.chartMetaSet) {
                    ret[UniqueKey.CANCER_STUDIES] = _.sumBy(this.cancerStudiesData.result, data => data.count);
                }

                // Add all custom chart counts, and they should all get 100%
                _.reduce(this._customCharts.keys(), (acc, next) => {
                    acc[next] = this.selectedSamples.result.length;
                    return acc;
                }, ret);

                return _.reduce(this.chartMetaSet, (acc, next, key) => {
                    acc[key] = ret[key] || 0;
                    return acc;
                }, {} as ClinicalDataCountSet);
            }
            return {}
        },
        onError: (error => {}),
        default: {}
    });

    readonly genomicDataWithCount = remoteData<ClinicalDataCountSet>({
        await: () => [
            this.molecularProfileSampleCounts,
            this.clinicalAttributeIdToClinicalAttribute,
            this.clinicalAttributesCounts,
            this.mutationCountVsFractionGenomeAlteredDataSet],
        invoke: async () => {
            if (!_.isEmpty(this.chartMetaSet)) {
                const attributeIdToAttribute = this.clinicalAttributeIdToClinicalAttribute.result!;
                // build map
                const ret: ClinicalDataCountSet =
                    _.reduce(this.clinicalAttributesCounts.result || [], (map: ClinicalDataCountSet, next: ClinicalAttributeCount) => {
                        const attribute = attributeIdToAttribute[next.clinicalAttributeId];
                        if (attribute) {
                            let key = getClinicalAttributeUniqueKey(attribute)
                            map[key] = map[key] || 0;
                            map[key] += next.count;
                        }
                        return map;
                    }, {});


                if (UniqueKey.MUTATED_GENES_TABLE in this.chartMetaSet) {
                    ret[UniqueKey.MUTATED_GENES_TABLE] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples : 0;
                    ret[UniqueKey.WITH_MUTATION_DATA] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples : 0;
                }

                if (UniqueKey.FUSION_GENES_TABLE in this.chartMetaSet) {
                    ret[UniqueKey.FUSION_GENES_TABLE] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples : 0;
                    ret[UniqueKey.WITH_FUSION_DATA] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples : 0;
                }

                if (UniqueKey.CNA_GENES_TABLE in this.chartMetaSet) {
                    ret[UniqueKey.CNA_GENES_TABLE] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples : 0;
                    ret[UniqueKey.WITH_CNA_DATA] = this.molecularProfileSampleCounts.result ? this.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples : 0;
                }

                if (UniqueKey.MUTATION_COUNT_CNA_FRACTION in this.chartMetaSet) {
                    // number of samples containing mutationCountVsFractionGenomeAlteredData should be
                    // calculated from the selected samples
                    const mutationCountVsFractionGenomeAlteredDataSet = this.mutationCountVsFractionGenomeAlteredDataSet.result;
                    const selectedSamplesMap = _.keyBy(this.selectedSamples.result!, s => s.uniqueSampleKey);
                    const filteredData = _.reduce(selectedSamplesMap, (acc, next) => {
                        if (mutationCountVsFractionGenomeAlteredDataSet[next.uniqueSampleKey]) {
                            acc.push(mutationCountVsFractionGenomeAlteredDataSet[next.uniqueSampleKey]);
                        }
                        return acc;
                    }, [] as IStudyViewScatterPlotData[]);
                    ret[UniqueKey.MUTATION_COUNT_CNA_FRACTION] = filteredData.length;
                }

                return _.reduce(this.chartMetaSet, (acc, next, key) => {
                    acc[key] = ret[key] || 0;
                    return acc;
                }, {} as ClinicalDataCountSet);
            }
            return {}
        },
        onError: (error => {}),
        default: {}
    });

    @computed
    public get clinicalDataDownloadFilename()
    {
        return `${this.downloadFilenamePrefix}clinical_data.tsv`;
    }

    @computed
    public get downloadFilenamePrefix() {
        return generateDownloadFilenamePrefixByStudies(_.values(this.physicalStudiesSet.result));
    }

    @autobind
    public async getDownloadDataPromise() {

        let sampleClinicalDataMap = await this.getClinicalDataBySamples(this.selectedSamples.result)

        let clinicalAttributesNameSet = _.reduce(this.clinicalAttributes.result, (acc, next) => {
            let id = (next.patientAttribute ? 'PATIENT' : 'SAMPLE') + '_' + next.clinicalAttributeId;
            acc[id] = next.displayName;
            return acc;
        }, {
            studyId: 'Study ID',
            patientId: 'Patient ID',
            sampleId: 'Sample ID',
        } as { [id: string]: string })

        let dataRows = _.reduce(this.selectedSamples.result, (acc, next) => {

            let sampleData: { [attributeId: string]: string; } = {
                studyId: next.studyId,
                patientId: next.patientId,
                sampleId: next.sampleId,
                ...(sampleClinicalDataMap[next.uniqueSampleKey] || {})
            };

            acc.push(
                _.map(Object.keys(clinicalAttributesNameSet), (attributrId) => {
                    return sampleData[attributrId] || NA_DATA;
                })
            );
            return acc;
        }, [_.values(clinicalAttributesNameSet)]);

        return dataRows.map(mutation => mutation.join('\t')).join('\n');
    }

    @autobind
    onSubmitQuery() {
        const unknownQueriedIdsMap = stringListToSet(this.unknownQueriedIds.result);
        let formOps: { [id: string]: string } = {
            cancer_study_list: this.studyIds.filter(studyId => !unknownQueriedIdsMap[studyId]).join(','),
            tab_index: 'tab_visualize',
        }

        if (this.filteredVirtualStudies.result.length === 0 && this.studyIds.length === 1) {
            if (!_.isEmpty(this.mutationProfiles.result)) {
                formOps['genetic_profile_ids_PROFILE_MUTATION_EXTENDED'] = this.mutationProfiles.result[0].molecularProfileId
            }
            if (!_.isEmpty(this.cnaProfiles.result)) {
                formOps['genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION'] = this.cnaProfiles.result[0].molecularProfileId
            }
        } else {
            let data_priority = '0';
            let { mutation, cna } = {
                mutation: !_.isEmpty(this.mutationProfiles.result),
                cna: !_.isEmpty(this.cnaProfiles)
            };
            if (mutation && cna)
                data_priority = '0';
            else if (mutation)
                data_priority = '1';
            else if (cna)
                data_priority = '2';
            formOps.data_priority = data_priority;
        }

        if (this.chartsAreFiltered) {
            formOps.case_set_id = '-1'
            formOps.case_ids = _.map(this.selectedSamples.result, sample => {
                return sample.studyId + ":" + sample.sampleId;
            }).join('+');
        } else {
            if (this.filteredVirtualStudies.result.length === 0 && this.studyIds.length === 1) {
                formOps.case_set_id = this.studyIds[0] + '_all';
            } else {
                formOps.case_set_id = 'all';
            }
        }

        let url = '/';
        if (!_.isEmpty(this.geneQueries)) {
            formOps.Action = 'Submit';
            formOps.gene_list = this.geneQueries.map(query => unparseOQLQueryLine(query)).join('\n');
            url = '/results/legacy_submission';
        }
        submitToPage(url, formOps, '_blank');
    }

    @autobind
    @action
    setCustomChartFilters(chartMeta: ChartMeta, values: string[]) {
        if (values.length > 0) {
            switch (chartMeta.uniqueKey) {
                case UniqueKey.CANCER_STUDIES: {
                    let filteredSampleIdentifiers = getFilteredSampleIdentifiers(this.samples.result.filter(sample => values.includes(sample.studyId)));
                    this._chartSampleIdentifiersFilterSet.set(chartMeta.uniqueKey, filteredSampleIdentifiers);
                    break;
                }
                case UniqueKey.WITH_MUTATION_DATA: {
                    switch (values.length) {
                        case 1: {
                            this._withMutationDataFilter = values[0] === Datalabel.YES ? true : false;
                            break;
                        }
                        case 2: {
                            this._withMutationDataFilter = undefined;
                            break;
                        }
                    }
                    break;
                }
                case UniqueKey.WITH_CNA_DATA: {
                    switch (values.length) {
                        case 1: {
                            this._withCNADataFilter = values[0] === Datalabel.YES ? true : false;
                            break;
                        }
                        case 2: {
                            this._withCNADataFilter = undefined;
                            break;
                        }
                    }
                    break;
                }
                default: {
                    let filteredSampleIdentifiers = _.reduce(this._customChartsSelectedCases.get(chartMeta.uniqueKey), (acc, next) => {
                        if(values.includes(next.value)) {
                            acc.push({
                                studyId: next.studyId,
                                sampleId: next.sampleId
                            });
                        }
                        return acc;
                    }, [] as SampleIdentifier[]);
                    this._chartSampleIdentifiersFilterSet.set(chartMeta.uniqueKey, filteredSampleIdentifiers);
                }
            }
            this.customChartFilterSet.set(chartMeta.uniqueKey, values);
        }
        else {
            if(UniqueKey.WITH_MUTATION_DATA === chartMeta.uniqueKey) {
                this._withMutationDataFilter = undefined;
            }
            if(UniqueKey.WITH_CNA_DATA === chartMeta.uniqueKey) {
                this._withCNADataFilter = undefined;
            }
            this._chartSampleIdentifiersFilterSet.delete(chartMeta.uniqueKey)
            this.customChartFilterSet.delete(chartMeta.uniqueKey)
        }
    }

    readonly cancerStudiesData = remoteData<ClinicalDataCountSummary[]>({
        await: () => [this.selectedSamples],
        invoke: async () => {
            let selectedSamples = [];
            if (_.includes(this._chartSampleIdentifiersFilterSet.keys(), UniqueKey.CANCER_STUDIES)) {
                selectedSamples = await getSamplesByExcludingFiltersOnChart(
                    UniqueKey.CANCER_STUDIES,
                    this.filters,
                    this._chartSampleIdentifiersFilterSet.toJS(),
                    this.queriedSampleIdentifiers.result,
                    this.queriedPhysicalStudyIds.result
                );
            }else {
                selectedSamples = this.selectedSamples.result;
            }
            return getClinicalDataCountWithColorByClinicalDataCount(_.values(_.reduce(selectedSamples, (acc, sample) => {
                const studyId = sample.studyId;
                if (acc[studyId]) {
                    acc[studyId].count = acc[studyId].count + 1
                } else {
                    acc[studyId] = {value: `${studyId}`, count: 1}
                }
                return acc
            }, {} as { [id: string]: ClinicalDataCount })));
        },
        onError: (error => {}),
        default: []
    });

    @action
    showAsPieChart(uniqueKey: string, dataSize: number, patientAttribute:boolean) {
        if (shouldShowChart(this.initialFilters, dataSize, this.samples.result.length)) {
            this.changeChartVisibility(uniqueKey, true);

            if (dataSize > STUDY_VIEW_CONFIG.thresholds.pieToTable || _.includes(STUDY_VIEW_CONFIG.tableAttrs, uniqueKey)) {
                this.chartsType.set(uniqueKey, ChartTypeEnum.TABLE);
                this.chartsDimension.set(uniqueKey, this.getTableDimensionByNumberOfRecords(dataSize));
            }else {
                this.chartsType.set(uniqueKey, ChartTypeEnum.PIE_CHART);
                this.chartsDimension.set(uniqueKey, STUDY_VIEW_CONFIG.layout.dimensions[ChartTypeEnum.PIE_CHART]);
            }
        }
    }

    public getCustomChartDataCount(chartMeta: ChartMeta) {
        let uniqueKey: string = chartMeta.uniqueKey;

        if (!this.customChartsPromises.hasOwnProperty(uniqueKey)) {
            switch (uniqueKey) {
                case UniqueKey.WITH_MUTATION_DATA:
                    this.customChartsPromises[uniqueKey] = this.withMutationDataChartCounts;
                    break;
                case UniqueKey.WITH_CNA_DATA:
                    this.customChartsPromises[uniqueKey] = this.withCNADataChartCounts;
                    break;
                default:
                    this.customChartsPromises[uniqueKey] = remoteData<ClinicalDataCountSummary[]>({
                        await: () => {
                            return _.includes([UniqueKey.WITH_MUTATION_DATA, UniqueKey.WITH_CNA_DATA], uniqueKey) ? [this.molecularProfileSampleCounts, this.selectedSamples] : [this.selectedSamples];
                        },
                        invoke: () => {
                            let dataCountSet: { [id: string]: ClinicalDataCount } = {};
                            dataCountSet = _.reduce(this.selectedSamples.result, (acc, sample) => {
                                const matchedCases = _.filter(this._customChartsSelectedCases.get(uniqueKey), (selectedCase: CustomChartIdentifierWithValue) => selectedCase.sampleId === sample.sampleId);
                                const valDefault = Datalabel.NA;
                                let matchedValues: string[] = [];
                                if (matchedCases.length >= 1) {
                                    matchedValues = matchedCases.map(item => {
                                        return item.value ? item.value : valDefault;
                                    });
                                } else {
                                    matchedValues = [valDefault];
                                }
                                matchedValues.forEach(value => {
                                    if (acc[value]) {
                                        acc[value].count = acc[value].count + 1
                                    } else {
                                        acc[value] = {
                                            value: value,
                                            count: 1
                                        }
                                    }
                                });
                                return acc;
                            }, dataCountSet);
                            return Promise.resolve(getClinicalDataCountWithColorByClinicalDataCount(_.values(dataCountSet)));
                        },
                        default: []
                    });
                    break;
            }
        }
        return this.customChartsPromises[uniqueKey];
    }

    private withMutationDataChartCounts = remoteData<ClinicalDataCountSummary[]>({
        invoke: async () => {
            let molecularProfileSampleCounts = await internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                studyViewFilter: Object.assign({}, this.filters, { withMutationData: undefined })
            });
            return Promise.resolve(
                getClinicalDataCountWithColorByCategoryCounts(
                    molecularProfileSampleCounts.numberOfMutationProfiledSamples,
                    molecularProfileSampleCounts.numberOfMutationUnprofiledSamples));
        },
        default: []
    })

    private withCNADataChartCounts = remoteData<ClinicalDataCountSummary[]>({
        invoke: async () => {
            let molecularProfileSampleCounts = await internalClient.fetchMolecularProfileSampleCountsUsingPOST({
                studyViewFilter: Object.assign({}, this.filters, { withCNAData: undefined })
            });
            return Promise.resolve(
                getClinicalDataCountWithColorByCategoryCounts(
                    molecularProfileSampleCounts.numberOfCNAProfiledSamples,
                    molecularProfileSampleCounts.numberOfCNAUnprofiledSamples));
        },
        default: []
    });

}
