import {
    ComparisonGroup,
    CopyNumberEnrichment, finalizeStudiesAttr,
    getOverlapFilteredGroups,
    getOverlappingPatients,
    getOverlappingSamples,
    getStudyIds,
    isGroupEmpty,
    ClinicalDataEnrichmentWithQ,
    OverlapFilteredComparisonGroup, OVERLAP_GROUP_COLOR, getSampleIdentifiers,
    GroupComparisonTab
} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
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
import {action, computed, observable} from "mobx";
import client from "../../shared/api/cbioportalClientInstance";
import comparisonClient from "../../shared/api/comparisonGroupClientInstance";
import _ from "lodash";
import {
    pickCopyNumberEnrichmentProfiles,
    pickMRNAEnrichmentProfiles,
    pickMutationEnrichmentProfiles,
    pickProteinEnrichmentProfiles
} from "../resultsView/enrichments/EnrichmentsUtil";
import {makeEnrichmentDataPromise} from "../resultsView/ResultsViewPageStoreUtils";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import autobind from "autobind-decorator";
import {PatientSurvival} from "shared/model/PatientSurvival";
import request from "superagent";
import {getPatientSurvivals} from "pages/resultsView/SurvivalStoreHelper";
import {SURVIVAL_CHART_ATTRIBUTES} from "pages/resultsView/survival/SurvivalChart";
import {COLORS, pickClinicalDataColors} from "pages/studyView/StudyViewUtils";
import {
    AlterationEnrichment,
    Group,
    MolecularProfileCaseIdentifier,
    ClinicalDataCount
} from "../../shared/api/generated/CBioPortalAPIInternal";
import {Session} from "../../shared/api/ComparisonGroupClient";
import { calculateQValues } from "shared/lib/calculation/BenjaminiHochbergFDRCalculator";
import {getStudiesAttr} from "./comparisonGroupManager/ComparisonGroupManagerUtils";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import { STUDY_VIEW_CONFIG } from "pages/studyView/StudyViewConfig";

export enum OverlapStrategy {
    INCLUDE = "Include overlapping samples",
    EXCLUDE = "Exclude overlapping samples",
    GROUP = "Treat overlapping samples as a separate group"
}

export default class GroupComparisonStore {

    @observable private _currentTabId:GroupComparisonTab|undefined = undefined;
    @observable private _overlapStrategy:OverlapStrategy = OverlapStrategy.INCLUDE;
    @observable private sessionId:string;

    constructor(sessionId:string) {
        this.sessionId = sessionId;
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

    @computed get sessionClinicalAttribute() {
        if (this._session.isComplete) {
            return this._session.result.clinicalAttribute;
        } else {
            return undefined;
        }
    }

    readonly _remoteGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this._session, this.sampleSet],
        invoke:()=>{
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            const ret:ComparisonGroup[] = [];
            const sampleSet = this.sampleSet.result!;

            let defaultGroupColors = pickClinicalDataColors(
                _.map(this._session.result!.groups,group=>({value: group.name})) as any);

            this._session.result!.groups.forEach((groupData, index)=>{
                // assign color to group if no color given
                let color = groupData.color || defaultGroupColors[groupData.name];

                const { nonExistentSamples, studies} = finalizeStudiesAttr(groupData, sampleSet);

                ret.push(Object.assign({}, groupData, {
                    color,
                    studies,
                    nonExistentSamples,
                    uid: index.toString()
                }));
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
        await:()=>[this._remoteGroups],
        invoke:()=>{
            // no overlap filter
            const groups = this._remoteGroups.result!.filter(group=>this.isGroupSelected(group.uid));
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
        await:()=>[this._selectionInfo, this._remoteGroups],
        invoke:()=>{
            const selectionInfo = this._selectionInfo.result!;
            let ret:OverlapFilteredComparisonGroup[];
            switch (this.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    ret = this._remoteGroups.result!.map(group=>Object.assign({}, group, {
                        hasOverlappingSamples: false,
                        hasOverlappingPatients: false
                    }));
                    break;
                case OverlapStrategy.EXCLUDE:
                    ret = getOverlapFilteredGroups(this._remoteGroups.result!, selectionInfo);
                    break;
                case OverlapStrategy.GROUP:
                default:
                    ret = getOverlapFilteredGroups(this._remoteGroups.result!, selectionInfo);
                    if (selectionInfo.overlappingSamples.length > 0 || selectionInfo.overlappingPatients.length > 0) {
                        ret.push({
                            name: "Overlap in selection",
                            description: "",
                            studies: getStudiesAttr(
                                selectionInfo.overlappingSamples,
                                selectionInfo.overlappingPatients
                            ),
                            origin:[],
                            studyViewFilter:{} as any,
                            color:OVERLAP_GROUP_COLOR,
                            uid:ret.map(g=>g.uid).join("")+"x", // guarantee unique id by joining all others together, and add something
                            nonExistentSamples:[],
                            hasOverlappingSamples:false,
                            hasOverlappingPatients:false
                        });
                    }
                    break;
            }
            return Promise.resolve(ret);
        }
    });

    readonly activeGroups = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this.availableGroups],
        invoke:()=>Promise.resolve(this.availableGroups.result!.filter(group=>this.isGroupActive(group)))
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

    public groupSelectionCanBeToggled(group:ComparisonGroup) {
        return (
            this.activeGroups.isComplete && // dont allow toggling until we know what the current active groups are
            !isGroupEmpty(group) // cant be toggled if no cases in it
        );
    }

    private isGroupSelected(uid:string) {
        if (!this._selectedGroupIds.has(uid)) {
            return true; // selected by default, until user toggles and thus adds a value to the map
        } else {
            return this._selectedGroupIds.get(uid);
        }
    }

    public isGroupActive(group:ComparisonGroup) {
        return this.isGroupSelected(group.uid) && !isGroupEmpty(group);
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

    readonly activeSamples = remoteData({
        await:()=>[this.sampleSet, this.activeGroups],
        invoke:()=>{
            const activeSampleIdentifiers = getSampleIdentifiers(this.activeGroups.result!);
            const sampleSet = this.sampleSet.result!;
            return Promise.resolve(
                activeSampleIdentifiers.map(sampleIdentifier=>sampleSet.get(sampleIdentifier)!)
            );
        }
    });

    readonly activePatientKeys = remoteData({
        await:()=>[this.activeSamples],
        invoke:()=>Promise.resolve(
            _.uniq(this.activeSamples.result!.map(s=>s.uniquePatientKey))
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
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.mutationEnrichmentProfile],
        getSelectedProfile:()=>this.mutationEnrichmentProfile.result,
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.mutationEnrichmentProfile.result) {
                const molecularProfile = this.mutationEnrichmentProfile.result;
                return internalClient.fetchMutationEnrichmentsUsingPOST({
                    enrichmentType: "SAMPLE",
                    multipleStudiesEnrichmentFilter: {
                        molecularProfileCaseSet1: _.flattenDeep<MolecularProfileCaseIdentifier>(
                            this.enrichmentsGroup1.result.studies
                                .filter(studyElt=>studyElt.id === molecularProfile.studyId)
                                .map(study=>study.samples.map(
                                    caseId=>({ caseId, molecularProfileId: molecularProfile.molecularProfileId })
                                ))
                        ),
                        molecularProfileCaseSet2: _.flattenDeep<MolecularProfileCaseIdentifier>(
                            this.enrichmentsGroup2.result.studies
                                .filter(studyElt=>studyElt.id === molecularProfile.studyId)
                                .map(study=>study.samples.map(
                                    caseId=>({ caseId, molecularProfileId: molecularProfile.molecularProfileId })
                                ))
                        ),
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly copyNumberHomdelEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.copyNumberEnrichmentProfile],
        getSelectedProfile:()=>this.copyNumberEnrichmentProfile.result,
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.copyNumberEnrichmentProfile.result) {
                const molecularProfile = this.copyNumberEnrichmentProfile.result;
                return this.getCopyNumberEnrichmentData(
                    molecularProfile,
                    this.enrichmentsGroup1.result,
                    this.enrichmentsGroup2.result,
                    "HOMDEL"
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly copyNumberAmpEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.copyNumberEnrichmentProfile],
        getSelectedProfile:()=>this.copyNumberEnrichmentProfile.result,
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.copyNumberEnrichmentProfile.result) {
                const molecularProfile = this.copyNumberEnrichmentProfile.result;
                return this.getCopyNumberEnrichmentData(
                    molecularProfile,
                    this.enrichmentsGroup1.result,
                    this.enrichmentsGroup2.result,
                    "AMP"
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    public readonly copyNumberData = remoteData<CopyNumberEnrichment[]>({
        await:()=>[this.copyNumberAmpEnrichmentData, this.copyNumberHomdelEnrichmentData],
        invoke:()=>{
            return Promise.resolve(
                this.copyNumberAmpEnrichmentData.result!.map(d=>{
                    (d as CopyNumberEnrichment).value = 2;
                    return d as CopyNumberEnrichment;
                }).concat(this.copyNumberHomdelEnrichmentData.result!.map(d=>{
                    (d as CopyNumberEnrichment).value = -2;
                    return d as CopyNumberEnrichment;
                }))
            );
        }
    });

    private getCopyNumberEnrichmentData(
        molecularProfile:MolecularProfile,
        group1:Pick<ComparisonGroup, "studies">,
        group2:Pick<ComparisonGroup, "studies">,
        copyNumberEventType: "HOMDEL" | "AMP")
    : Promise<AlterationEnrichment[]> {
        const group1Samples = group1.studies
            .find(studyElt=>studyElt.id === molecularProfile.studyId);
        const group2Samples = group2.studies
            .find(studyElt=>studyElt.id === molecularProfile.studyId);

        if (group1Samples && group2Samples) {
            return internalClient.fetchCopyNumberEnrichmentsUsingPOST({
                copyNumberEventType: copyNumberEventType,
                enrichmentType: "SAMPLE",
                multipleStudiesEnrichmentFilter: {
                    molecularProfileCaseSet1: group1Samples.samples.map(caseId=>({ caseId, molecularProfileId: molecularProfile.molecularProfileId })),
                    molecularProfileCaseSet2: group2Samples.samples.map(caseId=>({ caseId, molecularProfileId: molecularProfile.molecularProfileId })),
                }
            });
        } else {
            return Promise.resolve([]);
        }
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
        // grey out unless two active groups
        return (this.activeGroups.isComplete && this.activeGroups.result.length !== 2);
    }

    @computed get copyNumberTabGrey() {
        // grey out unless two active groups
        return (this.activeGroups.isComplete && this.activeGroups.result.length !== 2);
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

    public readonly patientToAnalysisGroups = remoteData({
        await: () => [
            this.availableGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!;
            let patientToAnalysisGroups = _.reduce(this.availableGroups.result, (acc, next) => {
                next.studies.forEach(study=>{
                    const studyId = study.id;
                    study.samples.forEach(sampleId => {
                        let sample = sampleSet.get({studyId, sampleId});
                        if (sample) {
                            let groups = acc[sample.uniquePatientKey] || [];
                            groups.push(next.uid);
                            acc[sample.uniquePatientKey] = groups;
                        }
                    });
                });
                return acc;
            }, {} as { [patientKey: string]: string[] })
            return Promise.resolve(patientToAnalysisGroups);
        }
    });

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [
            this.activeSamples
        ],
        invoke: async () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: SURVIVAL_CHART_ATTRIBUTES,
                identifiers: this.activeSamples.result!.map((s: any) => ({ entityId: s.patientId, studyId: s.studyId }))
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
            this.activeSamples
        ],
        invoke: () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: SURVIVAL_CHART_ATTRIBUTES,
                identifiers: this.activeSamples.result!.map((s: any) => ({ entityId: s.patientId, studyId: s.studyId }))
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
            this.activePatientKeys,
        ],
        invoke: async () => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.activePatientKeys.result!, 'OS_STATUS', 'OS_MONTHS', s => s === 'DECEASED');
        }
    }, []);

    readonly diseaseFreePatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.activePatientKeys,
        ],
        invoke: async () => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.activePatientKeys.result!, 'DFS_STATUS', 'DFS_MONTHS', s => s === 'Recurred/Progressed' || s === 'Recurred')
        }
    }, []);

    readonly uidToGroup = remoteData({
        await:()=>[this.availableGroups],
        invoke:()=>{
            return Promise.resolve(_.keyBy(this.availableGroups.result!, group=>group.uid));
        }
    });

    public readonly clinicalDataEnrichments = remoteData({
        await: () => [this.activeGroups],
        invoke: () => {
            
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
            return internalClient.fetchClinicalEnrichmentsUsingPOST({
                'groupFilter': {
                    groups: groups
                }
            });
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