import {
    ComparisonGroup,
    CopyNumberEnrichment, finalizeStudiesAttr,
    getOverlapFilteredGroups,
    getOverlappingPatients,
    getOverlappingSamples,
    getStudyIds,
    isGroupEmpty,
    ClinicalDataEnrichmentWithQ,
    getSampleIdentifiers,
    GroupComparisonTab, getOrdinals, partitionCasesByGroupMembership,
    defaultGroupOrder, getOverlapComputations, IOverlapComputations
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
    SampleIdentifier,
    ClinicalAttribute,
    CancerStudy
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
    MolecularProfileCasesGroupFilter
} from "../../shared/api/generated/CBioPortalAPIInternal";
import { Session, SessionGroupData } from "../../shared/api/ComparisonGroupClient";
import { calculateQValues } from "shared/lib/calculation/BenjaminiHochbergFDRCalculator";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import onMobxPromise from "../../shared/lib/onMobxPromise";
import ComplexKeyGroupsMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap";
import {GroupComparisonURLQuery} from "./GroupComparisonPage";
import {AppStore} from "../../AppStore";
import {stringListToIndexSet} from "../../shared/lib/StringUtils";
import {GACustomFieldsEnum, trackEvent} from "shared/lib/tracking";
import ifndef from "../../shared/lib/ifndef";
import { ISurvivalDescription } from "pages/resultsView/survival/SurvivalDescriptionTable";

export enum OverlapStrategy {
    INCLUDE = "Include overlapping samples and patients",
    EXCLUDE = "Exclude overlapping samples and patients",
}

export default class GroupComparisonStore {

    @observable private _currentTabId:GroupComparisonTab|undefined = undefined;
    @observable private _overlapStrategy:OverlapStrategy = OverlapStrategy.EXCLUDE;
    @observable private sessionId:string;
    @observable dragNameOrder:string[]|undefined = undefined;
    private _unsavedGroups = observable.shallowArray<SessionGroupData>([]);
    private deletedGroupNames = observable.shallowMap<string>();

    constructor(sessionId:string, private appStore:AppStore) {
        this.sessionId = sessionId;
    }

    @action public deleteGroup(name:string) {
        this.deletedGroupNames.set(name, name);
    }

    @computed get existsDeletedGroup() {
        return this.deletedGroupNames.keys().length > 0;
    }

    private isGroupDeleted(name:string) {
        return this.deletedGroupNames.has(name);
    }

    @action public updateDragOrder(oldIndex:number, newIndex:number) {
        if (!this.dragNameOrder) {
            this.dragNameOrder = this._originalGroups.result!.map(g=>g.name);
        }
        const poppedUid = this.dragNameOrder.splice(oldIndex, 1)[0];
        this.dragNameOrder.splice(newIndex, 0, poppedUid);
    }

    public get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    public addUnsavedGroup(group:SessionGroupData, saveToUser:boolean) {
        this._unsavedGroups.push(group);

        if (saveToUser && this.isLoggedIn) {
            comparisonClient.addGroup(group);
        }
    }

    public isGroupUnsaved(group:ComparisonGroup) {
        return !group.savedInSession;
    }

    @computed public get unsavedGroups() {
        if (this._originalGroups.isComplete) {
            return this._originalGroups.result.filter(g=>this.isGroupUnsaved(g));
        } else {
            return [];
        }
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
        },
        onResult(data:Session){
            try {
                const studies = _.chain(data.groups).flatMap(group => group.studies).map((study=>study.id)).uniq().value();
                trackEvent({
                               category: 'groupComparison',
                               action: 'comparisonSessionViewed',
                               label: studies.join(',') + ',',
                               fieldsObject:{
                                   [GACustomFieldsEnum.GroupCount]:data.groups.length
                               }
                           });
            } catch (ex) {
                throw("Failure to track comparisonSessionViewed");
            }
        }
    });

    readonly origin = remoteData({
        await:()=>[this._session],
        invoke:()=>Promise.resolve(this._session.result!.origin)
    });

    @computed get sessionClinicalAttributeName() {
        if (this._session.isComplete) {
            return this._session.result.clinicalAttributeName;
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

    readonly _unsortedOriginalGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this._session, this.sampleSet],
        invoke:()=>{
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            let ret:ComparisonGroup[] = [];
            const sampleSet = this.sampleSet.result!;

            let defaultGroupColors = pickClinicalDataColors(
                _.map(
                    this._session.result!.groups.concat(this._unsavedGroups.slice()),
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
                    uid: groupData.name,
                    nameWithOrdinal: "", // fill in later
                    ordinal: "", // fill in later
                    savedInSession
                });
            };

            this._session.result!.groups.forEach((groupData, index)=>{
                ret.push(finalizeGroup(true, groupData, index));
            });

            this._unsavedGroups.slice().forEach((groupData, index)=>{
                ret.push(finalizeGroup(false, groupData, index+this._session.result!.groups.length));
            });

            // filter out deleted groups
            ret = ret.filter(g=>!this.isGroupDeleted(g.name));
            return Promise.resolve(ret);
        }
    });

    readonly _originalGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this._session, this._unsortedOriginalGroups],
        invoke:()=>{
            // sort and add ordinals
            let sorted:ComparisonGroup[];
            if (this.dragNameOrder) {
                const order = stringListToIndexSet(this.dragNameOrder);
                sorted = _.sortBy<ComparisonGroup>(this._unsortedOriginalGroups.result!, g=>ifndef<number>(order[g.name], Number.POSITIVE_INFINITY));
            } else if (this._session.result!.groupNameOrder) {
                const order = stringListToIndexSet(this._session.result!.groupNameOrder!);
                sorted = _.sortBy<ComparisonGroup>(this._unsortedOriginalGroups.result!, g=>ifndef<number>(order[g.name], Number.POSITIVE_INFINITY));
            } else {
                sorted = defaultGroupOrder(this._unsortedOriginalGroups.result!);
            }

            const ordinals = getOrdinals(sorted.length, 26);
            sorted.forEach((group, index)=>{
                const ordinal = ordinals[index];
                group.nameWithOrdinal = `(${ordinal}) ${group.name}`;
                group.ordinal = ordinal;
            });
            return Promise.resolve(sorted);
        }
    });

    readonly overlapComputations = remoteData<IOverlapComputations<ComparisonGroup>>({
        await:()=>[this._originalGroups],
        invoke:()=>{
            return Promise.resolve(getOverlapComputations(
                this._originalGroups.result!,
                this.isGroupSelected
            ));
        }
    });

    readonly availableGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this._originalGroups, this._originalGroupsOverlapRemoved],
        invoke:()=>{
            let ret:ComparisonGroup[];
            switch (this.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    ret = this._originalGroups.result!;
                    break;
                case OverlapStrategy.EXCLUDE:
                default:
                    ret = this._originalGroupsOverlapRemoved.result!;
                    break;
            }
            return Promise.resolve(ret);
        }
    });

    readonly activeGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this.availableGroups],
        invoke:()=>Promise.resolve(this.availableGroups.result!.filter(group=>this.isGroupSelected(group.uid) && !isGroupEmpty(group)))
    });

    readonly _originalGroupsOverlapRemoved = remoteData<ComparisonGroup[]>({
        await:()=>[this.overlapComputations, this._originalGroups],
        invoke:()=>Promise.resolve(this.overlapComputations.result!.groups)
    });

    readonly _activeGroupsOverlapRemoved = remoteData<ComparisonGroup[]>({
        await:()=>[this._originalGroupsOverlapRemoved],
        invoke:()=>Promise.resolve(this._originalGroupsOverlapRemoved.result!.filter(group=>this.isGroupSelected(group.uid) && !isGroupEmpty(group)))
    });

    readonly _activeGroupsNotOverlapRemoved = remoteData({
        await:()=>[this._originalGroups, this.overlapComputations],
        invoke:()=>{
            let excludedGroups = this.overlapComputations.result!.excludedFromAnalysis;
            if (this.overlapStrategy === OverlapStrategy.INCLUDE) {
                excludedGroups = {};
            }
            return Promise.resolve(
                this._originalGroups.result!.filter(group=>this.isGroupSelected(group.uid) && !(group.uid in excludedGroups))
            );
        }
    });

    readonly _selectedGroups = remoteData({
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
    public async saveUnsavedChangesAndGoToNewSession() {
        const newSession = _.cloneDeep(this._session.result!);
        if (this._unsavedGroups.length > 0) {
            newSession.groups.push(...this._unsavedGroups);
        }
        if (this.dragNameOrder) {
            newSession.groupNameOrder = this.dragNameOrder.slice(); // get rid of mobx baggage with .slice()
        }
        newSession.groups = newSession.groups.filter(g=>!this.isGroupDeleted(g.name));

        const {id} = await comparisonClient.addComparisonSession(newSession);
        (window as any).routingStore.updateRoute({ sessionId: id} as GroupComparisonURLQuery);
    }

    @autobind
    @action
    public clearUnsavedChanges() {
        // clear unsaved groups
        onMobxPromise(
            this.availableGroups,
            availableGroups=>{
                for (const group of availableGroups) {
                    if (!group.savedInSession) {
                        this._selectedGroupIds.delete(group.uid);
                    }
                }
            }
        );
        this._unsavedGroups.clear();

        // clear drag order
        this.dragNameOrder = undefined;

        // restore deleted groups
        this.deletedGroupNames.clear();
    }

    @autobind
    public isGroupSelected(uid:string) {
        if (!this._selectedGroupIds.has(uid)) {
            return true; // selected by default, until user toggles and thus adds a value to the map
        } else {
            return !!this._selectedGroupIds.get(uid);
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
                let groups: MolecularProfileCasesGroupFilter[] = _.map(this._activeGroupsOverlapRemoved.result, group => {
                    const molecularProfileCaseIdentifiers = _.flatMap(group.studies, study => {
                        return _.map(study.samples, sampleId => {
                            return {
                                caseId: sampleId,
                                molecularProfileId: molecularProfile.molecularProfileId
                            }
                        })
                    });
                    return {
                        name: group.nameWithOrdinal,
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
            let groups: MolecularProfileCasesGroupFilter[] = _.map(this._activeGroupsOverlapRemoved.result, group => {
                const molecularProfileCaseIdentifiers = _.flatMap(group.studies, study => {
                    return _.map(study.samples, sampleId => {
                        return {
                            caseId: sampleId,
                            molecularProfileId: molecularProfile.molecularProfileId
                        }
                    });
                });
                return {
                    name: group.nameWithOrdinal,
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
        groups:MolecularProfileCasesGroupFilter[],
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
            this._activeGroupsNotOverlapRemoved,
            this.patientToSamplesSet,
            this.activePatientKeysNotOverlapRemoved
        ],
        invoke:()=>{
            const patientToSamplesSet = this.patientToSamplesSet.result!;
            return Promise.resolve(
                partitionCasesByGroupMembership(
                    this._activeGroupsNotOverlapRemoved.result!,
                    (group)=>getPatientIdentifiers([group]),
                    (patientIdentifier)=>patientToSamplesSet.get({ studyId: patientIdentifier.studyId, patientId: patientIdentifier.patientId })![0].uniquePatientKey,
                    this.activePatientKeysNotOverlapRemoved.result!
                ) as { key:{[uid:string]:boolean}, value:string[] }[]
            );
        }
    });

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [
            this.activeSamplesNotOverlapRemoved
        ],
        invoke: async () => {
            if (this.activeSamplesNotOverlapRemoved.result!.length === 0) {
                return false;
            }
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

    readonly activeStudiesClinicalAttributes = remoteData<ClinicalAttribute[]>({
        await: () => [
            this.activeStudyIds
        ],
        invoke: () => {
            return client.fetchClinicalAttributesUsingPOST({
                studyIds:this.activeStudyIds.result!
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
                    name: group.nameWithOrdinal || group.uid,
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
        },
        onError:()=>{
            // suppress failsafe error handler
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
        },
        onError:()=>{
            // suppress failsafe error handler
        }
    }, []);

    readonly activeStudyIdToStudy = remoteData({
        await: ()=>[
            this.studies,
            this.activeStudyIds
        ],
        invoke:()=>Promise.resolve(_.keyBy(_.filter(this.studies.result, (study) => this.activeStudyIds.result!.includes(study.studyId)), x=>x.studyId))
    }, {});

    readonly overallSurvivalDescriptions = remoteData({
        await:() => [
            this.activeStudiesClinicalAttributes,
            this.activeStudyIdToStudy
        ],
        invoke: () => {
            const overallSurvivalClinicalAttributeId = 'OS_STATUS';
            const clinicalAttributeMap = _.groupBy(this.activeStudiesClinicalAttributes.result, "clinicalAttributeId");
            const result : ISurvivalDescription[] = [];
            const studyIdToStudy : {[studyId:string]:CancerStudy} = this.activeStudyIdToStudy.result;
            if (clinicalAttributeMap && clinicalAttributeMap[overallSurvivalClinicalAttributeId] && clinicalAttributeMap[overallSurvivalClinicalAttributeId].length > 0) {
                clinicalAttributeMap[overallSurvivalClinicalAttributeId].forEach((attr) => {
                    result.push({
                            studyName: studyIdToStudy[attr.studyId].name,
                            description: attr.description
                    } as ISurvivalDescription);
                });
                return Promise.resolve(result);
            }
            return Promise.resolve([]);
        }
    });

    readonly diseaseFreeSurvivalDescriptions = remoteData({
        await:() => [
            this.activeStudiesClinicalAttributes,
            this.activeStudyIdToStudy
        ],
        invoke: () => {
            const diseaseFreeSurvivalClinicalAttributeId = 'DFS_STATUS';
            const clinicalAttributeMap = _.groupBy(this.activeStudiesClinicalAttributes.result, "clinicalAttributeId");
            const result : ISurvivalDescription[] = [];
            const studyIdToStudy : {[studyId:string]:CancerStudy} = this.activeStudyIdToStudy.result;
            if (clinicalAttributeMap && clinicalAttributeMap[diseaseFreeSurvivalClinicalAttributeId] && clinicalAttributeMap[diseaseFreeSurvivalClinicalAttributeId].length > 0) {
                clinicalAttributeMap[diseaseFreeSurvivalClinicalAttributeId].forEach((attr) => {
                    result.push({
                            studyName: studyIdToStudy[attr.studyId].name,
                            description: attr.description
                    } as ISurvivalDescription);
                });
                return Promise.resolve(result);
            }
            return Promise.resolve([]);
        }
    });
}
