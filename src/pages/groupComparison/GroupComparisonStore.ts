import {
    ComparisonGroup,
    CopyNumberEnrichment,
    getOverlapFilteredGroups,
    getOverlappingPatients,
    getOverlappingSamples,
    getStudyIds,
    isGroupEmpty,
    OverlapFilteredComparisonGroup
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
import {COLORS} from "pages/studyView/StudyViewUtils";
import {AlterationEnrichment} from "../../shared/api/generated/CBioPortalAPIInternal";
import ListIndexedMap from "shared/lib/ListIndexedMap";
import {GroupComparisonTab} from "./GroupComparisonPage";
import {Session} from "../../shared/api/ComparisonGroupClient";

export default class GroupComparisonStore {

    @observable currentTabId:GroupComparisonTab|undefined = undefined;
    @observable excludeOverlapping:boolean = false;
    @observable sessionId:string;

    constructor(sessionId:string) {
        this.sessionId = sessionId;
    }

    @autobind
    public setTabId(id:GroupComparisonTab) {
        this.currentTabId = id;
    }

    @autobind
    public toggleExcludeOverlapping() {
        this.excludeOverlapping = !this.excludeOverlapping;
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

    readonly unfilteredGroups = remoteData<ComparisonGroup[]>({
        await:()=>[this._session, this.sampleSet],
        invoke:()=>{
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            const ret:ComparisonGroup[] = [];
            const sampleSet = this.sampleSet.result!;
            let colorIndex = 0;

            this._session.result!.groups.forEach((groupData, index)=>{
                // assign color to group if no color given
                let color = groupData.color;
                if (!color) {
                    color = COLORS[colorIndex];
                    colorIndex += 1;
                }

                // keep track of nonexisting samples, existing patients
                const nonExistentSamples = [];
                const studies = [];

                for (const study of groupData.studies) {
                    const studyId = study.id;
                    const samples = [];
                    const patients = [];
                    for (const sampleId of study.samples) {
                        const sample = sampleSet.get(studyId, sampleId);
                        if (!sample) {
                            // filter out, and keep track of, nonexisting sample
                            nonExistentSamples.push({ studyId, sampleId });
                        } else {
                            // add sample and corresponding patient
                            samples.push(sampleId);
                            patients.push(sample.patientId);
                        }
                    }
                    studies.push({
                        id: studyId,
                        samples,
                        patients: _.uniq(patients)
                    });
                }

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

    readonly selectionInfo = remoteData<{
        groups:ComparisonGroup[],
        overlappingSamples:SampleIdentifier[],
        overlappingPatients:PatientIdentifier[],
        overlappingSamplesSet:ListIndexedMap<boolean>,
        overlappingPatientsSet:ListIndexedMap<boolean>
    }>({
        await:()=>[this.unfilteredGroups],
        invoke:()=>{
            // no overlap filter
            const groups = this.unfilteredGroups.result!.filter(group=>this.isGroupSelected(group.uid));
            const overlappingSamples = getOverlappingSamples(groups);
            const overlappingPatients = getOverlappingPatients(groups);
            const overlappingSamplesSet = new ListIndexedMap<boolean>();
            const overlappingPatientsSet = new ListIndexedMap<boolean>();
            for (const sample of overlappingSamples) {
                overlappingSamplesSet.set(true, sample.studyId, sample.sampleId);
            }
            for (const patient of overlappingPatients) {
                overlappingPatientsSet.set(true, patient.studyId, patient.patientId);
            }
            return Promise.resolve({groups, overlappingSamples, overlappingPatients, overlappingSamplesSet, overlappingPatientsSet});
        }
    });

    readonly filteredGroups = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this.selectionInfo, this.unfilteredGroups],
        invoke:()=>{
            if (this.excludeOverlapping) {
                return Promise.resolve(getOverlapFilteredGroups(this.unfilteredGroups.result!, this.selectionInfo.result!));
            } else {
                return Promise.resolve(this.unfilteredGroups.result!.map(group=>Object.assign({}, group, {
                    hasOverlappingSamples: false,
                    hasOverlappingPatients: false
                })));
            }
        }
    });

    readonly activeGroups = remoteData<OverlapFilteredComparisonGroup[]>({
        await:()=>[this.filteredGroups],
        invoke:()=>Promise.resolve(this.filteredGroups.result!.filter(group=>this.isGroupActive(group)))
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
                return internalClient.fetchMutationEnrichmentsUsingPOST({
                    molecularProfileId: this.mutationEnrichmentProfile.result.molecularProfileId,
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

    readonly copyNumberHomdelEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.copyNumberEnrichmentProfile],
        getSelectedProfile:()=>this.copyNumberEnrichmentProfile.result,// returns an empty array if the selected study doesn't have any CNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.copyNumberEnrichmentProfile.result) {
                return this.getCopyNumberEnrichmentData(
                    this.copyNumberEnrichmentProfile.result.molecularProfileId,
                    _.flattenDeep<SampleIdentifier>(this.enrichmentsGroup1.result.studies.map(study=>study.samples.map(sampleId=>({ sampleId, studyId: study.id})))),
                    _.flattenDeep<SampleIdentifier>(this.enrichmentsGroup2.result.studies.map(study=>study.samples.map(sampleId=>({ sampleId, studyId: study.id})))),
                    "HOMDEL"
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly copyNumberAmpEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.copyNumberEnrichmentProfile],
        getSelectedProfile:()=>this.copyNumberEnrichmentProfile.result,// returns an empty array if the selected study doesn't have any CNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.copyNumberEnrichmentProfile.result) {
                return this.getCopyNumberEnrichmentData(
                    this.copyNumberEnrichmentProfile.result.molecularProfileId,
                    _.flattenDeep<SampleIdentifier>(this.enrichmentsGroup1.result.studies.map(study=>study.samples.map(sampleId=>({ sampleId, studyId: study.id})))),
                    _.flattenDeep<SampleIdentifier>(this.enrichmentsGroup2.result.studies.map(study=>study.samples.map(sampleId=>({ sampleId, studyId: study.id})))),
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
        molecularProfileId:string,
        group1Samples: SampleIdentifier[], group2Samples: SampleIdentifier[],
        copyNumberEventType: "HOMDEL" | "AMP")
    : Promise<AlterationEnrichment[]> {
        return internalClient.fetchCopyNumberEnrichmentsUsingPOST({
            molecularProfileId,
            copyNumberEventType: copyNumberEventType,
            enrichmentType: "SAMPLE",
            enrichmentFilter: {
                alteredIds: group1Samples.map(s => s.sampleId),
                unalteredIds: group2Samples.map(s => s.sampleId),
            }
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
            const sampleSet = new ListIndexedMap<Sample>();
            for (const sample of this.samples.result!) {
                sampleSet.set(sample, sample.studyId, sample.sampleId);
            }
            return Promise.resolve(sampleSet);
        }
    });

    public readonly patientToAnalysisGroups = remoteData({
        await: () => [
            this.unfilteredGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!;
            let patientToAnalysisGroups = _.reduce(this.unfilteredGroups.result, (acc, next) => {
                next.studies.forEach(study=>{
                    const studyId = study.id;
                    study.samples.forEach(sampleId => {
                        let sample = sampleSet.get(studyId, sampleId);
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
            this.samples
        ],
        invoke: async () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: SURVIVAL_CHART_ATTRIBUTES,
                identifiers: this.samples.result!.map((s: any) => ({ entityId: s.patientId, studyId: s.studyId }))
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
            this.samples
        ],
        invoke: () => {
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: SURVIVAL_CHART_ATTRIBUTES,
                identifiers: this.samples.result!.map((s: any) => ({ entityId: s.patientId, studyId: s.studyId }))
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

    readonly patientKeys = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            return Promise.resolve(
                _.uniq(this.samples.result!.map(s => s.uniquePatientKey))
            );
        }
    }, []);

    readonly overallPatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.patientKeys,
        ],
        invoke: async () => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.patientKeys.result, 'OS_STATUS', 'OS_MONTHS', s => s === 'DECEASED');
        }
    }, []);

    readonly diseaseFreePatientSurvivals = remoteData<PatientSurvival[]>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.patientKeys,
        ],
        invoke: async () => {
            return getPatientSurvivals(this.survivalClinicalDataGroupByUniquePatientKey.result,
                this.patientKeys.result!, 'DFS_STATUS', 'DFS_MONTHS', s => s === 'Recurred/Progressed' || s === 'Recurred')
        }
    }, []);

    readonly uidToGroup = remoteData({
        await:()=>[this.unfilteredGroups],
        invoke:()=>{
            return Promise.resolve(_.keyBy(this.unfilteredGroups.result!, group=>group.uid));
        }
    });
}