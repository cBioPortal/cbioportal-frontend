import {SampleGroup, TEMP_localStorageGroupsKey, getCombinations} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
import {
    MolecularProfile,
    MolecularProfileFilter,
    SampleFilter,
    ClinicalDataMultiStudyFilter,
    ClinicalData,
    Sample
} from "../../shared/api/generated/CBioPortalAPI";
import { computed, observable } from "mobx";
import client from "../../shared/api/cbioportalClientInstance";
import _ from "lodash";
import {
    pickCopyNumberEnrichmentProfiles, pickMRNAEnrichmentProfiles,
    pickMutationEnrichmentProfiles, pickProteinEnrichmentProfiles
} from "../resultsView/enrichments/EnrichmentsUtil";
import {makeEnrichmentDataPromise} from "../resultsView/ResultsViewPageStoreUtils";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import autobind from "autobind-decorator";
import { PatientSurvival } from "shared/model/PatientSurvival";
import request from "superagent";
import { getPatientSurvivals } from "pages/resultsView/SurvivalStoreHelper";
import { SURVIVAL_CHART_ATTRIBUTES } from "pages/resultsView/survival/SurvivalChart";

export default class GroupComparisonStore {

    @observable currentTabId:string;

    @autobind
    public setTabId(id:string) {
        this.currentTabId = id;
    }

    readonly sampleGroups = remoteData<SampleGroup[]>({
        // only for development purposes, until we get the actual group service going
        invoke:()=>Promise.resolve(JSON.parse(localStorage.getItem(TEMP_localStorageGroupsKey) || "[]"))
    });

    @observable private _enrichmentsGroup1:SampleGroup;
    @observable private _enrichmentsGroup2:SampleGroup;

    @computed get enrichmentsGroup1() {
        if (!this._enrichmentsGroup1 && this.sampleGroups.isComplete && this.sampleGroups.result.length > 0) {
            return this.sampleGroups.result[0];
        } else {
            return this._enrichmentsGroup1;
        }
    }
    set enrichmentsGroup1(group:SampleGroup) {
        this._enrichmentsGroup1 = group;
    }

    @computed get enrichmentsGroup2() {
        if (!this._enrichmentsGroup2 && this.sampleGroups.isComplete && this.sampleGroups.result.length > 1) {
            return this.sampleGroups.result[1];
        } else {
            return this._enrichmentsGroup2;
        }
    }
    set enrichmentsGroup2(group:SampleGroup) {
        this._enrichmentsGroup2 = group;
    }

    readonly samples = remoteData({
        await:()=>[this.sampleGroups],
        invoke:()=>client.fetchSamplesUsingPOST({
            sampleFilter:{
                sampleIdentifiers: _.flatten(this.sampleGroups.result!.map(group=>group.sampleIdentifiers))
            } as SampleFilter,
            projection: "DETAILED"
        })
    });

    readonly studyIds = remoteData({
        await:()=>[this.sampleGroups],
        invoke:()=>Promise.resolve(
            _.uniqBy(
                _.flatten(
                    this.sampleGroups.result!.map(group=>group.sampleIdentifiers)
                ),
                id=>id.studyId
            ).map(id=>id.studyId)
        )
    });

    readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>({
        await:()=>[this.studyIds],
        invoke: async () => {
            return client.fetchMolecularProfilesUsingPOST({
                molecularProfileFilter: { studyIds:this.studyIds.result! } as MolecularProfileFilter
            })
        }
    }, []);

    public readonly mutationEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInStudies],
        invoke:()=>Promise.resolve(pickMutationEnrichmentProfiles(this.molecularProfilesInStudies.result!))
    });

    public readonly copyNumberEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInStudies],
        invoke:()=>Promise.resolve(pickCopyNumberEnrichmentProfiles(this.molecularProfilesInStudies.result!))
    });

    public readonly mRNAEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInStudies],
        invoke:()=>Promise.resolve(pickMRNAEnrichmentProfiles(this.molecularProfilesInStudies.result!))
    });

    public readonly proteinEnrichmentProfiles = remoteData({
        await:()=>[this.molecularProfilesInStudies],
        invoke:()=>Promise.resolve(pickProteinEnrichmentProfiles(this.molecularProfilesInStudies.result!))
    });

    private _mutationEnrichmentProfile:MolecularProfile|undefined = undefined;
    @computed public get mutationEnrichmentProfile() {
        if (!this._mutationEnrichmentProfile && this.mutationEnrichmentProfiles.isComplete) {
            return this.mutationEnrichmentProfiles.result[0];
        } else {
            return this._mutationEnrichmentProfile;
        }
    }
    public set mutationEnrichmentProfile(profile:MolecularProfile|undefined) {
        this._mutationEnrichmentProfile = profile;
    }

    public mutationEnrichmentData = makeEnrichmentDataPromise({
        shouldFetchData:()=>!!this.mutationEnrichmentProfile,
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1 && this.enrichmentsGroup2) {
                return internalClient.fetchMutationEnrichmentsUsingPOST({
                    molecularProfileId: this.mutationEnrichmentProfile!.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {
                        alteredIds: this.enrichmentsGroup1.sampleIdentifiers.map(s=>s.sampleId),
                        unalteredIds: this.enrichmentsGroup2.sampleIdentifiers.map(s=>s.sampleId),
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    public readonly sampleSet = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            return Promise.resolve(_.keyBy(this.samples.result!, sample => sample.studyId + sample.sampleId));
        }
    });

    public readonly patientToAnalysisGroups = remoteData({
        await: () => [
            this.sampleGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!
            let patientToAnalysisGroups = _.reduce(this.sampleGroups.result, (acc, next) => {
                next.sampleIdentifiers.forEach(sampleIdentifier => {
                    let sample = sampleSet[sampleIdentifier.studyId + sampleIdentifier.sampleId];
                    if (sample) {
                        let groups = acc[sample.uniquePatientKey] || [];
                        groups.push(next.id);
                        acc[sample.uniquePatientKey] = groups;
                    }
                })
                return acc;
            }, {} as { [id: string]: string[] })
            return Promise.resolve(patientToAnalysisGroups);
        }
    });

    public readonly sampleGroupsCombinationSets = remoteData({
        await: () => [
            this.sampleGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!
            let groupsWithSamples = _.map(this.sampleGroups.result, group => {
                let samples = group.sampleIdentifiers.map(sampleIdentifier => sampleSet[sampleIdentifier.studyId + sampleIdentifier.sampleId]);
                return {
                    name: group.name ? group.name : group.id,
                    cases: _.map(samples, sample => sample.uniqueSampleKey)
                }
            })
            return Promise.resolve(getCombinations(groupsWithSamples));
        }
    }, []);

    public readonly patientGroupsCombinationSets = remoteData({
        await: () => [
            this.sampleGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!;
            let groupsWithPatients = _.map(this.sampleGroups.result, group => {
                let samples = group.sampleIdentifiers.map(sampleIdentifier => sampleSet[sampleIdentifier.studyId + sampleIdentifier.sampleId]);
                return {
                    name: group.name ? group.name : group.id,
                    cases: _.uniq(_.map(samples, sample => sample.uniquePatientKey))
                }
            })
            return Promise.resolve(getCombinations(groupsWithPatients));
        }
    }, []);

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [
            this.studyIds,
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
}