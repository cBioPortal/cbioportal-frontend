import {
    ComparisonGroup,
    CopyNumberEnrichment, finalizeStudiesAttr,
    getOverlapFilteredGroups,
    getOverlappingPatients,
    getOverlappingSamples,
    getStudyIds,
    isGroupEmpty,
    ClinicalDataEnrichmentWithQ,
    OverlapFilteredComparisonGroup, getSampleIdentifiers,
    GroupComparisonTab
} from "./GroupComparisonUtils";
import { remoteData } from "../../shared/api/remoteData";
import {
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    MolecularProfile,
    MolecularProfileFilter,
    PatientIdentifier,
    Sample,
    SampleFilter,
    SampleIdentifier
} from "../../shared/api/generated/CBioPortalAPI";
import { action, computed, observable } from "mobx";
import client from "../../shared/api/cbioportalClientInstance";
import comparisonClient from "../../shared/api/comparisonGroupClientInstance";
import _ from "lodash";
import {
    pickCopyNumberEnrichmentProfiles,
    pickMRNAEnrichmentProfiles,
    pickMutationEnrichmentProfiles,
    pickProteinEnrichmentProfiles
} from "../resultsView/enrichments/EnrichmentsUtil";
import { makeEnrichmentDataPromise } from "../resultsView/ResultsViewPageStoreUtils";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import autobind from "autobind-decorator";
import { PatientSurvival } from "shared/model/PatientSurvival";
import request from "superagent";
import {getPatientSurvivals} from "pages/resultsView/SurvivalStoreHelper";
import {SURVIVAL_CHART_ATTRIBUTES} from "pages/resultsView/survival/SurvivalChart";
import {COLORS, getPatientIdentifiers, pickClinicalDataColors} from "pages/studyView/StudyViewUtils";
import {
    AlterationEnrichment,
    Group,
    MolecularProfileCasesGroup
} from "../../shared/api/generated/CBioPortalAPIInternal";
import { Session, SessionGroupData } from "../../shared/api/ComparisonGroupClient";
import { calculateQValues } from "shared/lib/calculation/BenjaminiHochbergFDRCalculator";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import onMobxPromise from "../../shared/lib/onMobxPromise";
import ComplexKeyGroupsMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap";
import {GroupComparisonURLQuery} from "./GroupComparisonPage";
import {AppStore} from "../../AppStore";

export enum OverlapStrategy {
    INCLUDE = "Include overlapping samples and patients",
    EXCLUDE = "Exclude overlapping samples and patients",
}

export default class GroupComparisonStore {

    @observable private _currentTabId:GroupComparisonTab|undefined = undefined;
    @observable private _overlapStrategy:OverlapStrategy = OverlapStrategy.EXCLUDE;
    @observable private sessionId:string;
    private unsavedGroups = observable.shallowArray<SessionGroupData>([]);

    constructor(sessionId:string, private appStore:AppStore) {
        this.sessionId = sessionId;
    }

    public get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    public addUnsavedGroup(group:SessionGroupData, saveToUser:boolean) {
        this.unsavedGroups.push(group);

        if (saveToUser && this.isLoggedIn) {
            comparisonClient.addGroup(group);
        }
    }

    public isGroupUnsaved(group:ComparisonGroup) {
        return !group.savedInSession;
    }

    public get unsavedGroupNames() {
        return this.unsavedGroups.map(g=>g.name);
    }

    get currentTabId() {
        return this._currentTabId;
    }

    @autobind
    public setTabId(id:GroupComparisonTab) {
        this._currentTabId = id;
    }

    get overlapStrategy() {
        return this._overlapStrategy;
    }

    @autobind
    public setOverlapStrategy(v:OverlapStrategy) {
        this._overlapStrategy = v;
    }

    private _selectedGroupIds = observable.shallowMap<boolean>();

    readonly _session = remoteData<Session>({
        invoke:()=>{
            return comparisonClient.getComparisonSession(this.sessionId);
        }
    });

    readonly origin = remoteData({
        await:()=>[this._session],
        invoke:()=>Promise.resolve(this._session.result!.origin)
    });

    @computed get sessionClinicalAttribute() {
        if (this._session.isComplete) {
            return this._session.result.clinicalAttribute;
        } else {
            return undefined;
        }
    }

    readonly existingGroupNames = remoteData({
        await:()=>[
            this._originalGroups,
            this.origin
        ],
        invoke:async()=>{
            const ret = {
                session:this._originalGroups.result!.map(g=>g.name),
                user:[] as string[]
            };
            if (this.isLoggedIn) {
                // need to add all groups belonging to this user for this origin
                ret.user = (await comparisonClient.getGroupsForStudies(this.origin.result!)).map(g=>g.data.name);
            }
            return ret;
        }
    });

    readonly _originalGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this._session, this.sampleSet],
        invoke:()=>{
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            const ret:ComparisonGroup[] = [];
            const sampleSet = this.sampleSet.result!;

            let defaultGroupColors = pickClinicalDataColors(
                _.map(
                    this._session.result!.groups.concat(this.unsavedGroups.slice()),
                        group=>({value: group.name})
                ) as any);

            const finalizeGroup = (savedInSession:boolean, groupData:SessionGroupData, index:number)=>{
                // assign color to group if no color given
                let color = groupData.color || defaultGroupColors[groupData.name];

                const { nonExistentSamples, studies} = finalizeStudiesAttr(groupData, sampleSet);

                return Object.assign({}, groupData, {
                    color,
                    studies,
                    nonExistentSamples,
                    uid: index.toString(),
                    savedInSession
                });
            };

            this._session.result!.groups.forEach((groupData, index)=>{
                ret.push(finalizeGroup(true, groupData, index));
            });

            this.unsavedGroups.slice().forEach((groupData, index)=>{
                ret.push(finalizeGroup(false, groupData, index+this._session.result!.groups.length));
            });
            return Promise.resolve(ret);
        }
    });

    readonly _selectionInfo = remoteData<{
        groups:ComparisonGroup[],
        overlappingSamples:SampleIdentifier[],
        overlappingPatients:PatientIdentifier[],
        overlappingSamplesSet:ComplexKeySet,
        overlappingPatientsSet:ComplexKeySet
    }>({
        await:()=>[this._originalGroups],
        invoke:()=>{
            // no overlap filter
            const groups = this._originalGroups.result!.filter(group=>this.isGroupSelected(group.uid));
            const overlappingSamples = getOverlappingSamples(groups);
            const overlappingPatients = getOverlappingPatients(groups);
            const overlappingSamplesSet = new ComplexKeySet();
            const overlappingPatientsSet = new ComplexKeySet();
            for (const sample of overlappingSamples) {
                overlappingSamplesSet.add({ studyId: sample.studyId, sampleId: sample.sampleId });
            }
            for (const patient of overlappingPatients) {
                overlappingPatientsSet.add({ studyId: patient.studyId, patientId: patient.patientId });
            }
            return Promise.resolve({groups, overlappingSamples, overlappingPatients, overlappingSamplesSet, overlappingPatientsSet});
        }
    });

    readonly availableGroups = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this._originalGroups, this._originalGroupsOverlapRemoved],
        invoke:()=>{
            let ret:OverlapFilteredComparisonGroup[];
            switch (this.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    ret = this._originalGroups.result!.map(group=>Object.assign({}, group, {
                        hasOverlappingSamples: false,
                        hasOverlappingPatients: false
                    }));
                    break;
                case OverlapStrategy.EXCLUDE:
                default:
                    ret = this._originalGroupsOverlapRemoved.result!;
                    break;
            }
            return Promise.resolve(ret);
        }
    });

    readonly activeGroups = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this.availableGroups],
        invoke:()=>Promise.resolve(this.availableGroups.result!.filter(group=>this.isGroupSelected(group.uid) && !isGroupEmpty(group)))
    });

    readonly _originalGroupsOverlapRemoved = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this._selectionInfo, this._originalGroups],
        invoke:()=>{
            const selectionInfo = this._selectionInfo.result!;
            let ret:OverlapFilteredComparisonGroup[];
                ret = getOverlapFilteredGroups(this._originalGroups.result!, selectionInfo);
            return Promise.resolve(ret);
        }
    });

    readonly _activeGroupsOverlapRemoved = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this._originalGroupsOverlapRemoved],
        invoke:()=>Promise.resolve(this._originalGroupsOverlapRemoved.result!.filter(group=>this.isGroupSelected(group.uid) && !isGroupEmpty(group)))
    });

    readonly _activeGroupsNotOverlapRemoved = remoteData({
        await:()=>[this._originalGroups],
        invoke:()=>Promise.resolve(this._originalGroups.result!.filter(group=>this.isGroupSelected(group.uid)))
    });

    readonly enrichmentsGroup1 = remoteData({
        await:()=>[this.activeGroups],
        invoke:()=>Promise.resolve(this.activeGroups.result![0])
    });

    readonly enrichmentsGroup2 = remoteData({
        await:()=>[this.activeGroups],
        invoke:()=>Promise.resolve(this.activeGroups.result![1])
    });

    @autobind
    @action public toggleGroupSelected(uid:string) {
        this._selectedGroupIds.set(uid, !this.isGroupSelected(uid));
    }

    @autobind
    @action public selectAllGroups() {
        const groups = this.availableGroups.result!; // assumed complete
        for (const group of groups) {
            this._selectedGroupIds.set(group.uid, true);
        }
    }

    @autobind
    @action public deselectAllGroups() {
        const groups = this.availableGroups.result!; // assumed complete
        for (const group of groups) {
            this._selectedGroupIds.set(group.uid, false);
        }
    }

    @autobind
    @action
    public async saveAndGoToNewSession() {
        if (!this._session.isComplete || this.unsavedGroups.length === 0) {
            return;
        }

        // save unsavedGroups to new session, and go to it
        const newSession = _.cloneDeep(this._session.result!);
        newSession.groups.push(...this.unsavedGroups);

        const {id } = await comparisonClient.addComparisonSession(newSession);
        (window as any).routingStore.updateRoute({ sessionId: id} as GroupComparisonURLQuery);
    }

    @autobind
    @action public clearUnsavedGroups() {
        onMobxPromise(
            this.availableGroups,
            availableGroups=>{
                for (const group of availableGroups) {
                    if (!group.savedInSession) {
                        this._selectedGroupIds.delete(group.uid);
                    }
                }
            }
        )
        this.unsavedGroups.clear();
    }

    public isGroupSelected(uid:string) {
        if (!this._selectedGroupIds.has(uid)) {
            return true; // selected by default, until user toggles and thus adds a value to the map
        } else {
            return this._selectedGroupIds.get(uid);
        }
    }

    readonly samples = remoteData({
        await:()=>[this._session],
        invoke:()=>{
            const sampleIdentifiers = [];
            for (const groupData of this._session.result!.groups) {
                for (const studySpec of groupData.studies) {
                    const studyId = studySpec.id;
                    for (const sampleId of studySpec.samples) {
                        sampleIdentifiers.push({
                            studyId, sampleId
                        });
                    }
                }
            }
            return client.fetchSamplesUsingPOST({
                sampleFilter:{
                    sampleIdentifiers
                } as SampleFilter,
                projection: "DETAILED"
            });
        }
    });

    readonly activeSamplesNotOverlapRemoved = remoteData({
        await:()=>[this.sampleSet, this._activeGroupsNotOverlapRemoved],
        invoke:()=>{
            const activeSampleIdentifiers = getSampleIdentifiers(this._activeGroupsNotOverlapRemoved.result!);
            const sampleSet = this.sampleSet.result!;
            return Promise.resolve(
                activeSampleIdentifiers.map(sampleIdentifier=>sampleSet.get(sampleIdentifier)!)
            );
        }
    });

    readonly activePatientKeysNotOverlapRemoved = remoteData({
        await:()=>[this.activeSamplesNotOverlapRemoved],
        invoke:()=>Promise.resolve(
            _.uniq(this.activeSamplesNotOverlapRemoved.result!.map(s=>s.uniquePatientKey))
        )
    });

    readonly studies = remoteData({
        await: ()=>[this._session],
        invoke: () => {
            const studyIds = getStudyIds(this._session.result!.groups);
            return client.fetchStudiesUsingPOST({
                studyIds,
                projection:'DETAILED'
            })
        }
    }, []);

    readonly activeStudyIds = remoteData({
        await:()=>[this.activeGroups],
        invoke:()=>Promise.resolve(getStudyIds(this.activeGroups.result!))
    });

    readonly molecularProfilesInActiveStudies = remoteData<MolecularProfile[]>({
        await:()=>[this.activeStudyIds],
        invoke: async () => {
            if (this.activeStudyIds.result!.length > 0) {
                return client.fetchMolecularProfilesUsingPOST({
                    molecularProfileFilter: { studyIds:this.activeStudyIds.result! } as MolecularProfileFilter
                });
            } else {
                return Promise.resolve([]);
            }
        }
    }, []);

    public readonly mutationEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInActiveStudies],
        invoke:()=>Promise.resolve(pickMutationEnrichmentProfiles(this.molecularProfilesInActiveStudies.result!))
    });

    public readonly copyNumberEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInActiveStudies],
        invoke:()=>Promise.resolve(pickCopyNumberEnrichmentProfiles(this.molecularProfilesInActiveStudies.result!))
    });

    public readonly mRNAEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInActiveStudies],
        invoke:()=>Promise.resolve(pickMRNAEnrichmentProfiles(this.molecularProfilesInActiveStudies.result!))
    });

    public readonly proteinEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInActiveStudies],
        invoke:()=>Promise.resolve(pickProteinEnrichmentProfiles(this.molecularProfilesInActiveStudies.result!))
    });

    @observable.ref private _mutationEnrichmentProfile:MolecularProfile|undefined = undefined;
    readonly mutationEnrichmentProfile = remoteData({
        await:()=>[this.mutationEnrichmentProfiles],
        invoke:()=>{
            if (!this._mutationEnrichmentProfile && this.mutationEnrichmentProfiles.result!.length > 0) {
                return Promise.resolve(this.mutationEnrichmentProfiles.result![0]);
            } else {
                return Promise.resolve(this._mutationEnrichmentProfile);
            }
        }
    });
    @action
    public setMutationEnrichmentProfile(profile:MolecularProfile|undefined) {
        this._mutationEnrichmentProfile = profile;
    }

    @observable.ref private _copyNumberEnrichmentProfile:MolecularProfile|undefined = undefined;
    readonly copyNumberEnrichmentProfile = remoteData({
        await:()=>[this.copyNumberEnrichmentProfiles],
        invoke:()=>{
            if (!this._copyNumberEnrichmentProfile && this.copyNumberEnrichmentProfiles.result!.length > 0) {
                return Promise.resolve(this.copyNumberEnrichmentProfiles.result![0]);
            } else {
                return Promise.resolve(this._copyNumberEnrichmentProfile);
            }
        }
    });
    @action
    public setCopyNumberEnrichmentProfile(profile:MolecularProfile|undefined) {
        this._copyNumberEnrichmentProfile = profile;
    }

    @observable.ref private _mRNAEnrichmentProfile:MolecularProfile|undefined = undefined;
    readonly mRNAEnrichmentProfile = remoteData({
        await:()=>[this.mRNAEnrichmentProfiles],
        invoke:()=>{
            if (!this._mRNAEnrichmentProfile && this.mRNAEnrichmentProfiles.result!.length > 0) {
                return Promise.resolve(this.mRNAEnrichmentProfiles.result![0]);
            } else {
                return Promise.resolve(this._mRNAEnrichmentProfile);
            }
        }
    });
    @action
    public setMRNAEnrichmentProfile(profile:MolecularProfile|undefined) {
        this._mRNAEnrichmentProfile = profile;
    }

    @observable.ref private _proteinEnrichmentProfile:MolecularProfile|undefined = undefined;
    readonly proteinEnrichmentProfile = remoteData({
        await:()=>[this.proteinEnrichmentProfiles],
        invoke:()=>{
            if (!this._proteinEnrichmentProfile && this.proteinEnrichmentProfiles.result!.length > 0) {
                return Promise.resolve(this.proteinEnrichmentProfiles.result![0]);
            } else {
                return Promise.resolve(this._proteinEnrichmentProfile);
            }
        }
    });
    @action
    public setProteinEnrichmentProfile(profile:MolecularProfile|undefined) {
        this._proteinEnrichmentProfile = profile;
    }

    public readonly mutationEnrichmentData = makeEnrichmentDataPromise({
        await: () => [this.mutationEnrichmentProfile, this._activeGroupsOverlapRemoved],
        getSelectedProfile: () => this.mutationEnrichmentProfile.result,
        fetchData: () => {
            let molecularProfile = this.mutationEnrichmentProfile.result!;
            if (this._activeGroupsOverlapRemoved.result!.length > 1) {
                let groups: MolecularProfileCasesGroup[] = _.map(this._activeGroupsOverlapRemoved.result, group => {
                    const molecularProfileCaseIdentifiers = _.flatMap(group.studies, study => {
                        return _.map(study.samples, sampleId => {
                            return {
                                caseId: sampleId,
                                molecularProfileId: molecularProfile.molecularProfileId
                            }
                        })
                    });
                    return {
                        name: group.name,
                        molecularProfileCaseIdentifiers
                    }
                });

                return internalClient.fetchMutationEnrichmentsUsingPOST({
                    enrichmentType: "SAMPLE",
                    groups
                });
            } else {
                return Promise.resolve([]);
            }

        }
    });

    readonly copyNumberEnrichmentDataRequestGroups = remoteData({
        await: () => [this.copyNumberEnrichmentProfile, this._activeGroupsOverlapRemoved],
        invoke: async () => {
            let molecularProfile = this.copyNumberEnrichmentProfile.result!;
            let groups: MolecularProfileCasesGroup[] = _.map(this._activeGroupsOverlapRemoved.result, group => {
                const molecularProfileCaseIdentifiers = _.flatMap(group.studies, study => {
                    return _.map(study.samples, sampleId => {
                        return {
                            caseId: sampleId,
                            molecularProfileId: molecularProfile.molecularProfileId
                        }
                    });
                });
                return {
                    name: group.name,
                    molecularProfileCaseIdentifiers
                }
            });
            return groups;
        }
    });

    readonly copyNumberHomdelEnrichmentData = remoteData<AlterationEnrichment[]>({
        await:()=>[this.copyNumberEnrichmentDataRequestGroups],
        invoke:()=>{
            // assumes single study for now
            if (this.copyNumberEnrichmentDataRequestGroups.result && this.copyNumberEnrichmentDataRequestGroups.result.length>1) {
                return this.getCopyNumberEnrichmentData(
                    this.copyNumberEnrichmentDataRequestGroups.result!,
                    "HOMDEL"
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly copyNumberAmpEnrichmentData = remoteData<AlterationEnrichment[]>({
        await:()=>[this.copyNumberEnrichmentDataRequestGroups, this.copyNumberEnrichmentProfile],
        invoke:()=>{
            // assumes single study for now
            if (this.copyNumberEnrichmentDataRequestGroups.result && this.copyNumberEnrichmentDataRequestGroups.result.length>1) {
                return this.getCopyNumberEnrichmentData(
                    this.copyNumberEnrichmentDataRequestGroups.result!,
                    "AMP"
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    public readonly copyNumberData = makeEnrichmentDataPromise({
        await:()=>[this.copyNumberHomdelEnrichmentData, this.copyNumberAmpEnrichmentData],
        getSelectedProfile:()=>this.copyNumberEnrichmentProfile.result,
        fetchData:()=>{
            const ampData = this.copyNumberAmpEnrichmentData.result!.map(d=>{
                (d as CopyNumberEnrichment).value = 2;
                return d as CopyNumberEnrichment;
            });
            const homdelData = this.copyNumberHomdelEnrichmentData.result!.map(d=>{
                (d as CopyNumberEnrichment).value = -2;
                return d as CopyNumberEnrichment;
            });
            return Promise.resolve(ampData.concat(homdelData));
        }
    });

    private getCopyNumberEnrichmentData(
        groups:MolecularProfileCasesGroup[],
        copyNumberEventType: "HOMDEL" | "AMP")
    : Promise<AlterationEnrichment[]> {

        return internalClient.fetchCopyNumberEnrichmentsUsingPOST({
            copyNumberEventType: copyNumberEventType,
            enrichmentType: "SAMPLE",
            groups
        });
    }

    readonly mRNAEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.mRNAEnrichmentProfile],
        getSelectedProfile:()=>this.mRNAEnrichmentProfile.result,// returns an empty array if the selected study doesn't have any mRNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.mRNAEnrichmentProfile.result) {
                return internalClient.fetchExpressionEnrichmentsUsingPOST({
                    molecularProfileId: this.mRNAEnrichmentProfile.result.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {
                        alteredIds: _.flattenDeep<string>(this.enrichmentsGroup1.result.studies.map(study=>study.samples)),
                        unalteredIds: _.flattenDeep<string>(this.enrichmentsGroup2.result.studies.map(study=>study.samples))
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly proteinEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.proteinEnrichmentProfile],
        getSelectedProfile:()=>this.proteinEnrichmentProfile.result,// returns an empty array if the selected study doesn't have any mRNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.proteinEnrichmentProfile.result) {            
                return internalClient.fetchExpressionEnrichmentsUsingPOST({
                    molecularProfileId: this.proteinEnrichmentProfile.result.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {
                        alteredIds: _.flattenDeep<string>(this.enrichmentsGroup1.result.studies.map(study=>study.samples)),
                        unalteredIds: _.flattenDeep<string>(this.enrichmentsGroup2.result.studies.map(study=>study.samples))
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    @computed get survivalTabGrey() {
        // grey out if more than 10 active groups
        return (this.activeGroups.isComplete && this.activeGroups.result.length > 10);
    }

    @computed get mutationsTabGrey() {
        return (this.activeGroups.isComplete && this.activeGroups.result.length < 2) //less than two active groups 
        || (this.activeStudyIds.isComplete && this.activeStudyIds.result.length > 1) //more than one active study;
    }

    @computed get clinicalTabGrey() {
        // grey out if active groups is less than 2
        return (this.activeGroups.isComplete && this.activeGroups.result.length < 2);
    }

    @computed get hasOverlappingSamplesInActiveGroups() {
        return getOverlappingSamples(this.activeGroups.result!).length > 0;
    }
    
    @computed get copyNumberTabGrey() {
        return (this.activeGroups.isComplete && this.activeGroups.result.length < 2) //less than two active groups 
        || (this.activeStudyIds.isComplete && this.activeStudyIds.result.length > 1) //more than one active study;
    }

    @computed get mRNATabGrey() {
        // grey out if
        return (this.activeStudyIds.isComplete && this.activeStudyIds.result.length > 1) // more than one active study
            || (this.activeGroups.isComplete && this.activeGroups.result.length !== 2); // not two active groups
    }

    @computed get proteinTabGrey() {
        // grey out if
        return (this.activeStudyIds.isComplete && this.activeStudyIds.result.length > 1) // more than one active study
            || (this.activeGroups.isComplete && this.activeGroups.result.length !== 2); // not two active groups
    }

    public readonly sampleSet = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            const sampleSet = new ComplexKeyMap<Sample>();
            for (const sample of this.samples.result!) {
                sampleSet.set({ studyId: sample.studyId, sampleId: sample.sampleId}, sample);
            }
            return Promise.resolve(sampleSet);
        }
    });

    readonly patientKeys = remoteData({
        await:()=>[this.samples],
        invoke:()=>{
            return Promise.resolve(_.uniq(this.samples.result!.map(s=>s.uniquePatientKey)));
        }
    });

    public readonly patientToSamplesSet = remoteData({
        await:()=>[this.samples],
        invoke:()=>{
            const ret = new ComplexKeyGroupsMap<Sample>();
            for (const sample of this.samples.result!) {
                ret.add({ studyId: sample.studyId, patientId: sample.patientId}, sample);
            }
            return Promise.resolve(ret);
        }
    });

    public readonly patientKeyToSamples = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            return Promise.resolve(_.groupBy(this.samples.result!, sample => sample.uniquePatientKey));
        }
    });

    public readonly sampleKeyToSample = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            let sampleSet = _.reduce(this.samples.result!, (acc, sample) => {
                acc[sample.uniqueSampleKey] = sample;
                return acc;
            }, {} as { [uniqueSampleKey: string]: Sample });
            return Promise.resolve(sampleSet);
        }
    });

    public readonly sampleKeyToActiveGroups = remoteData({
        await:()=>[
            this.activeGroups,
            this.sampleSet
        ],
        invoke:()=>{
            const sampleKeyToGroups:{[sampleKey:string]:string[]} = {};
            const sampleSet = this.sampleSet.result!;
            for (const group of this.activeGroups.result!) {
                for (const studyEntry of group.studies) {
                    for (const sampleId of studyEntry.samples) {
                        const sample = sampleSet.get({ studyId: studyEntry.id, sampleId });
                        if (sample) {
                            sampleKeyToGroups[sample.uniqueSampleKey] = sampleKeyToGroups[sample.uniqueSampleKey] || [];
                            sampleKeyToGroups[sample.uniqueSampleKey].push(group.uid);
                        }
                    }
                }
            }
            return Promise.resolve(sampleKeyToGroups);
        }
    });

    public readonly patientsVennPartition = remoteData({
        await:()=>[
            this._originalGroups,
            this.patientToSamplesSet,
            this.patientKeys
        ],
        invoke:()=>{
            const partitionMap = new ComplexKeyGroupsMap<string>();
            const patientToSamplesSet = this.patientToSamplesSet.result!;
            const groupToPatientKeys = this._originalGroups.result!.reduce((map, group)=>{
                map[group.uid] = _.keyBy(getPatientIdentifiers([group]).map(id=>{
                    return patientToSamplesSet.get({ studyId: id.studyId, patientId: id.patientId })![0].uniquePatientKey;
                }));
                return map;
            }, {} as {[uid:string]:{[uniquePatientKey:string]:any}});

            for (const patientKey of this.patientKeys.result!) {
                const key:any = {};
                for (const group of this._originalGroups.result!) {
                    key[group.uid] = patientKey in groupToPatientKeys[group.uid];
                }
                partitionMap.add(key, patientKey);
            }
            return Promise.resolve(partitionMap.entries());
        }
    });

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [
            this.activeSamplesNotOverlapRemoved
        ],
        invoke: async () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: SURVIVAL_CHART_ATTRIBUTES,
                identifiers: this.activeSamplesNotOverlapRemoved.result!.map((s: any) => ({ entityId: s.patientId, studyId: s.studyId }))
            };
            const count = await client.fetchClinicalDataUsingPOSTWithHttpInfo({
                clinicalDataType: "PATIENT",
                clinicalDataMultiStudyFilter: filter,
                projection: "META"
            }).then(function (response: request.Response) {
                return parseInt(response.header["total-count"], 10);
            });
            return count > 0;
        }
    });

    @computed get showSurvivalTab() {
        return this.survivalClinicalDataExists.isComplete && this.survivalClinicalDataExists.result;
    }

    readonly survivalClinicalData = remoteData<ClinicalData[]>({
        await: () => [
            this.activeSamplesNotOverlapRemoved
        ],
        invoke: () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: SURVIVAL_CHART_ATTRIBUTES,
                identifiers: this.activeSamplesNotOverlapRemoved.result!.map((s: any) => ({ entityId: s.patientId, studyId: s.studyId }))
            };
            return client.fetchClinicalDataUsingPOST({
                clinicalDataType: 'PATIENT',
                clinicalDataMultiStudyFilter: filter
            });
        }
    }, []);

    readonly survivalClinicalDataGroupByUniquePatientKey = remoteData<{ [key: string]: ClinicalData[] }>({
        await: () => [
            this.survivalClinicalData,
        ],
        invoke: async () => {
            return _.groupBy(this.survivalClinicalData.result, 'uniquePatientKey');
        }
    });

    readonly overallPatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.activePatientKeysNotOverlapRemoved,
        ],
        invoke: async () => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.activePatientKeysNotOverlapRemoved.result!, 'OS_STATUS', 'OS_MONTHS', s => s === 'DECEASED');
        }
    }, []);

    readonly diseaseFreePatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.activePatientKeysNotOverlapRemoved,
        ],
        invoke: async () => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.activePatientKeysNotOverlapRemoved.result!, 'DFS_STATUS', 'DFS_MONTHS', s => s === 'Recurred/Progressed' || s === 'Recurred')
        }
    }, []);

    readonly uidToGroup = remoteData({
        await:()=>[this._originalGroups],
        invoke:()=>{
            return Promise.resolve(_.keyBy(this._originalGroups.result!, group=>group.uid));
        }
    });

    public readonly clinicalDataEnrichments = remoteData({
        await: () => [this.activeGroups],
        invoke: () => {
            if (this.clinicalTabGrey) {
                return Promise.resolve([]);
            }
            let groups: Group[] = _.map(this.activeGroups.result, group => {
                const sampleIdentifiers = [];
                for (const studySpec of group.studies) {
                    const studyId = studySpec.id;
                    for (const sampleId of studySpec.samples) {
                        sampleIdentifiers.push({
                            studyId, sampleId
                        });
                    }
                }
                return {
                    name: group.name ? group.name : group.uid,
                    sampleIdentifiers: sampleIdentifiers
                }
            });
            if (groups.length > 1) {
                return internalClient.fetchClinicalEnrichmentsUsingPOST({
                    'groupFilter': {
                        groups: groups
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    }, []);

    readonly clinicalDataEnrichmentsWithQValues = remoteData<ClinicalDataEnrichmentWithQ[]>({
        await:()=>[this.clinicalDataEnrichments],
        invoke:()=>{
            const clinicalDataEnrichments = this.clinicalDataEnrichments.result!;
            const sortedByPvalue = _.sortBy(clinicalDataEnrichments, c=>c.pValue);
            const qValues = calculateQValues(sortedByPvalue.map(c=>c.pValue));
            qValues.forEach((qValue, index)=>{
                (sortedByPvalue[index] as ClinicalDataEnrichmentWithQ).qValue = qValue;
            });
            return Promise.resolve(sortedByPvalue as ClinicalDataEnrichmentWithQ[]);
        }
    }, []);
}