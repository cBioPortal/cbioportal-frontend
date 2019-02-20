import {
    ComparisonSampleGroup,
    getPatientIdentifiers,
    getCombinations,
    ComparisonGroup,
    getOverlappingSamples
} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
import {
    MolecularProfile,
    MolecularProfileFilter,
    SampleFilter,
    ClinicalDataMultiStudyFilter,
    ClinicalData, Sample, SampleIdentifier,PatientIdentifier
} from "../../shared/api/generated/CBioPortalAPI";
import { computed, observable, action } from "mobx";
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
import { COLORS } from "pages/studyView/StudyViewUtils";
import {AlterationEnrichment} from "../../shared/api/generated/CBioPortalAPIInternal";
import ListIndexedMap from "shared/lib/ListIndexedMap";
import {getLSChartGroupsSpec, getLSGroups} from "./GroupPersistenceUtils";
import {GroupComparisonTab} from "./GroupComparisonPage";

export type GroupComparisonURLQuery = {
    localGroups:string; // comma separated list

    // OR

    fromChart:string; //"true" or "false"
    unshareableLocalKey:string;
};

export default class GroupComparisonStore {

    @observable currentTabId:GroupComparisonTab|undefined = undefined;
    @observable excludeOverlapping:boolean = false;
    @observable localGroupIds:string[] = [];
    @observable fromChart:boolean = false;
    @observable unshareableLocalKey:string = "";

    public updateStoreFromURL(query:Partial<GroupComparisonURLQuery>) {
        if (query.localGroups) {
            this.localGroupIds = query.localGroups.split(",");
        }
        if (query.fromChart !== undefined) {
            this.fromChart = Boolean(query.fromChart);
            this.unshareableLocalKey = query.unshareableLocalKey!;
        }
    }

    @autobind
    public setTabId(id:GroupComparisonTab) {
        this.currentTabId = id;
    }

    @autobind
    public toggleExcludeOverlapping() {
        this.excludeOverlapping = !this.excludeOverlapping;
    }

    private _selectedComparisonGroupIds = observable.shallowMap<boolean>();

    @computed get fromChartSpec() {
        if (this.fromChart && this.unshareableLocalKey) {
            return getLSChartGroupsSpec(this.unshareableLocalKey);
        } else {
            return null;
        }
    }

    readonly remoteSampleGroups = remoteData<ComparisonSampleGroup[]>({
        invoke:async()=>{
            if (this.fromChart) {
                // fetch chart groups from filters
                const spec = this.fromChartSpec;
                if (spec) {
                    const ret:ComparisonSampleGroup[] = [];
                    for (const value of spec.values) {
                        const categoryFilters = Object.assign({}, spec.filters);
                        categoryFilters.clinicalDataEqualityFilters = categoryFilters.clinicalDataEqualityFilters || [];
                        categoryFilters.clinicalDataEqualityFilters.push({
                            attributeId: spec.clinicalAttribute.clinicalAttributeId,
                            clinicalDataType:spec.clinicalAttribute.patientAttribute ? "PATIENT" : "SAMPLE",
                            values:[value]
                        });
                        const categorySamples = await internalClient.fetchFilteredSamplesUsingPOST({
                            studyViewFilter:categoryFilters
                        });
                        ret.push({
                            id: value, name: value,
                            sampleIdentifiers: categorySamples.map(s=>({ studyId: s.studyId, sampleId:s.sampleId}))
                        });
                    }
                    //id:string, // unique identifier
                    //sampleIdentifiers:SampleIdentifier[], // samples in the group
                    //name:string, // display name
                    return ret;
                } else {
                    throw new Error("fromChart specified, but no chart filters found in localStorage.");
                }
            } else {
                // TODO: get from session service
                return [];
            }
        }
    });

    @computed get localSampleGroups() {
        if (this.fromChart) {
            return [];
        } else {
            const groupsMap = _.keyBy(getLSGroups(), group=>group.id);
            return this.localGroupIds.map(id=>groupsMap[id]);
        }
    }

    readonly allSampleGroups_Unfiltered = remoteData<ComparisonSampleGroup[]>({
        await:()=>[this.remoteSampleGroups],
        invoke:()=>{
            return Promise.resolve(this.localSampleGroups.concat(this.remoteSampleGroups.result!));
        }
    });

    readonly allComparisonGroups_Unfiltered = remoteData<ComparisonGroup[]>({
       await:()=>[this.allSampleGroups_Unfiltered, this.sampleSet],
       invoke:()=>{
           const sampleSet = this.sampleSet.result!;
           return Promise.resolve(this.allSampleGroups_Unfiltered.result!.map(group=>(
                Object.assign({ 
                    patientIdentifiers: getPatientIdentifiers(group.sampleIdentifiers, sampleSet)
                }, group)
           )));
       } 
    });

    readonly selectedComparisonGroups_Unfiltered = remoteData<ComparisonGroup[]>({
        await:()=>[this.allComparisonGroups_Unfiltered],
        invoke:()=>Promise.resolve(
            this.allComparisonGroups_Unfiltered.result!.filter(group=>this.isComparisonGroupSelected(group.id))
        )
    });

    readonly overlappingSelectedSamples = remoteData<SampleIdentifier[]>({
        await:()=>[this.selectedComparisonGroups_Unfiltered],
        invoke:()=>Promise.resolve(getOverlappingSamples(this.selectedComparisonGroups_Unfiltered.result!))
    });

    readonly overlappingSelectedPatients = remoteData<PatientIdentifier[]>({
        await:()=>[this.sampleSet, this.overlappingSelectedSamples],
        invoke:()=>Promise.resolve(getPatientIdentifiers(this.overlappingSelectedSamples.result!, this.sampleSet.result!))
    });

    readonly allComparisonGroups_Filtered = remoteData<ComparisonGroup[]>({
        await:()=>[ 
            this.allComparisonGroups_Unfiltered,
            this.overlappingSelectedSamples, 
            this.overlappingSelectedPatients
         ],
         invoke:()=>{
             if (this.excludeOverlapping) {
                 // filter out overlapping samples and patients
                 const overlappingSamples = ListIndexedMap.from(this.overlappingSelectedSamples.result!, s=>[s.studyId, s.sampleId]);
                 const overlappingPatients = ListIndexedMap.from(this.overlappingSelectedPatients.result!, s=>[s.studyId, s.patientId]);
                 return Promise.resolve(this.allComparisonGroups_Unfiltered.result!.map(group=>{
                     const ret:Partial<ComparisonGroup> = Object.assign({}, group);
                     ret.sampleIdentifiers = group.sampleIdentifiers.filter(s=>!overlappingSamples.has(s.studyId, s.sampleId));
                     ret.patientIdentifiers = group.patientIdentifiers.filter(p=>!overlappingPatients.has(p.studyId, p.patientId));
                     ret.hasOverlappingSamples = (ret.sampleIdentifiers.length !== group.sampleIdentifiers.length);
                     ret.hasOverlappingPatients = (ret.patientIdentifiers.length !== group.patientIdentifiers.length);
                     return ret as ComparisonGroup;
                 }));
             } else {
                 return Promise.resolve(this.allComparisonGroups_Unfiltered.result!);
             }
         } 
    });

    readonly activeComparisonGroups = remoteData<ComparisonGroup[]>({
        // ** these are the groups, in final, filtered form, that are, in this form, used for analysis! **
        await:()=>[
           this.allComparisonGroups_Filtered,
           this.selectedComparisonGroups_Unfiltered
        ],
        invoke:()=>{
            const selected = _.keyBy(this.selectedComparisonGroups_Unfiltered.result!, g=>g.id);
            // filter out groups that are not selected, or are empty
            return Promise.resolve(this.allComparisonGroups_Filtered.result!.filter(group=>(
                selected[group.id] && (group.sampleIdentifiers.length > 0 || group.patientIdentifiers.length > 0)
            )));
        }
    });

    readonly enrichmentsGroup1 = remoteData({
        await:()=>[this.activeComparisonGroups],
        invoke:()=>Promise.resolve(this.activeComparisonGroups.result![0])
    });

    readonly enrichmentsGroup2 = remoteData({
        await:()=>[this.activeComparisonGroups],
        invoke:()=>Promise.resolve(this.activeComparisonGroups.result![1])
    });

    @autobind
    @action public toggleComparisonGroupSelected(groupId:string) {
        this._selectedComparisonGroupIds.set(groupId, !this.isComparisonGroupSelected(groupId));
    }

    public groupSelectionCanBeToggled(group:ComparisonGroup) {
        return (
            this.activeComparisonGroups.isComplete && // dont allow toggling until we know what the current active groups are
            !(group.sampleIdentifiers.length === 0 && group.patientIdentifiers.length === 0) // cant be toggled if no cases in it
        );
    }

    private isComparisonGroupSelected(groupId:string) {
        if (!this._selectedComparisonGroupIds.has(groupId)) {
            return true; // selected by default, until user toggles and thus adds a value to the map
        } else {
            return this._selectedComparisonGroupIds.get(groupId);
        }
    }

    readonly samples = remoteData({
        await:()=>[this.allSampleGroups_Unfiltered],
        invoke:()=>client.fetchSamplesUsingPOST({
            sampleFilter:{
                sampleIdentifiers: _.flatten(this.allSampleGroups_Unfiltered.result!.map(group=>group.sampleIdentifiers))
            } as SampleFilter,
            projection: "DETAILED"
        })
    });

    readonly studies = remoteData({
        await: ()=>[this.allSampleGroups_Unfiltered],
        invoke: () => {
            const studyIds = _.uniqBy(
                _.flatten(
                    this.allSampleGroups_Unfiltered.result!.map(group=>group.sampleIdentifiers)
                ),
                id=>id.studyId
            ).map(id=>id.studyId);
            return client.fetchStudiesUsingPOST({
                studyIds,
                projection:'DETAILED'
            })
        }
    }, []);

    readonly activeStudyIds = remoteData({
        await:()=>[this.activeComparisonGroups],
        invoke:()=>Promise.resolve(
            _.uniqBy(
                _.flatten(
                    this.activeComparisonGroups.result!.map(group=>group.sampleIdentifiers)
                ),
                id=>id.studyId
            ).map(id=>id.studyId)
        )
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

    private _mutationEnrichmentProfile:MolecularProfile|undefined = undefined;
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

    private _copyNumberEnrichmentProfile:MolecularProfile|undefined = undefined;
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

    private _mRNAEnrichmentProfile:MolecularProfile|undefined = undefined;
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

    private _proteinEnrichmentProfile:MolecularProfile|undefined = undefined;
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
        shouldFetchData:()=>!!this.mutationEnrichmentProfile,
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.mutationEnrichmentProfile.result) {
                return internalClient.fetchMutationEnrichmentsUsingPOST({
                    molecularProfileId: this.mutationEnrichmentProfile.result.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {
                        alteredIds: this.enrichmentsGroup1.result.sampleIdentifiers.map(s=>s.sampleId),
                        unalteredIds: this.enrichmentsGroup2.result.sampleIdentifiers.map(s=>s.sampleId),
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    public readonly copyNumberHomdelEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.copyNumberEnrichmentProfile],
        shouldFetchData:()=>!!this.copyNumberEnrichmentProfile,// returns an empty array if the selected study doesn't have any CNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.copyNumberEnrichmentProfile.result) {
                return this.getCopyNumberEnrichmentData(
                    this.copyNumberEnrichmentProfile.result.molecularProfileId,
                    this.enrichmentsGroup1.result.sampleIdentifiers,
                    this.enrichmentsGroup2.result.sampleIdentifiers,
                    "HOMDEL"
                );
            } else {
                return Promise.resolve([]);
            }
        }
    });

    public readonly copyNumberAmpEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.copyNumberEnrichmentProfile],
        shouldFetchData:()=>!!this.copyNumberEnrichmentProfile,// returns an empty array if the selected study doesn't have any CNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.copyNumberEnrichmentProfile.result) {
                return this.getCopyNumberEnrichmentData(
                    this.copyNumberEnrichmentProfile.result.molecularProfileId,
                    this.enrichmentsGroup1.result.sampleIdentifiers,
                    this.enrichmentsGroup2.result.sampleIdentifiers,
                    "AMP"
                );
            } else {
                return Promise.resolve([]);
            }
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
        shouldFetchData:()=>!!this.mRNAEnrichmentProfile,// returns an empty array if the selected study doesn't have any mRNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.mRNAEnrichmentProfile.result) {
                return internalClient.fetchExpressionEnrichmentsUsingPOST({
                    molecularProfileId: this.mRNAEnrichmentProfile.result.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {
                        alteredIds: this.enrichmentsGroup1.result.sampleIdentifiers.map(s=>s.sampleId),
                        unalteredIds: this.enrichmentsGroup2.result.sampleIdentifiers.map(s=>s.sampleId),
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    readonly proteinEnrichmentData = makeEnrichmentDataPromise({
        await:()=>[this.enrichmentsGroup1, this.enrichmentsGroup2,this.proteinEnrichmentProfile],
        shouldFetchData:()=>!!this.proteinEnrichmentProfile,// returns an empty array if the selected study doesn't have any mRNA profiles
        fetchData:()=>{
            // assumes single study for now
            if (this.enrichmentsGroup1.result && this.enrichmentsGroup2.result && this.proteinEnrichmentProfile.result) {            
                return internalClient.fetchExpressionEnrichmentsUsingPOST({
                    molecularProfileId: this.proteinEnrichmentProfile.result.molecularProfileId,
                    enrichmentType: "SAMPLE",
                    enrichmentFilter: {
                        alteredIds: this.enrichmentsGroup1.result.sampleIdentifiers.map(s=>s.sampleId),
                        unalteredIds: this.enrichmentsGroup2.result.sampleIdentifiers.map(s=>s.sampleId),
                    }
                });
            } else {
                return Promise.resolve([]);
            }
        }
    });

    @computed get mutationsTabGrey() {
        // grey out unless two active groups
        return (this.activeComparisonGroups.isComplete && this.activeComparisonGroups.result.length !== 2);
    }

    @computed get copyNumberTabGrey() {
        // grey out unless two active groups
        return (this.activeComparisonGroups.isComplete && this.activeComparisonGroups.result.length !== 2);
    }

    @computed get mRNATabGrey() {
        // grey out if
        return (this.activeStudyIds.isComplete && this.activeStudyIds.result.length > 1) // more than one active study
            || (this.activeComparisonGroups.isComplete && this.activeComparisonGroups.result.length !== 2); // not two active groups
    }

    @computed get proteinTabGrey() {
        // grey out if
        return (this.activeStudyIds.isComplete && this.activeStudyIds.result.length > 1) // more than one active study
            || (this.activeComparisonGroups.isComplete && this.activeComparisonGroups.result.length !== 2); // not two active groups
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
            this.allSampleGroups_Unfiltered,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!
            let patientToAnalysisGroups = _.reduce(this.allSampleGroups_Unfiltered.result, (acc, next) => {
                next.sampleIdentifiers.forEach(sampleIdentifier => {
                    let sample = sampleSet.get(sampleIdentifier.studyId, sampleIdentifier.sampleId);
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
            this.activeComparisonGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!;
            let groupsWithSamples = _.map(this.activeComparisonGroups.result, group => {
                let samples = group.sampleIdentifiers.map(sampleIdentifier => sampleSet.get(sampleIdentifier.studyId, sampleIdentifier.sampleId));
                return {
                    name: group.name ? group.name : group.id,
                    cases: _.map(samples, sample => sample!.uniqueSampleKey)
                }
            })
            return Promise.resolve(getCombinations(groupsWithSamples));
        }
    }, []);

    public readonly patientGroupsCombinationSets = remoteData({
        await: () => [
            this.activeComparisonGroups,
            this.sampleSet
        ],
        invoke: () => {
            let sampleSet = this.sampleSet.result!;
            let groupsWithPatients = _.map(this.activeComparisonGroups.result, group => {
                let samples = group.sampleIdentifiers.map(sampleIdentifier => sampleSet.get(sampleIdentifier.studyId, sampleIdentifier.sampleId));
                return {
                    name: group.name ? group.name : group.id,
                    cases: _.uniq(_.map(samples, sample => sample!.uniquePatientKey))
                }
            })
            return Promise.resolve(getCombinations(groupsWithPatients));
        }
    }, []);

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

    @computed get categoryToColor() {
        let colorIndex = 0;
        return _.reduce(this.allSampleGroups_Unfiltered.result, (acc, next) => {
            acc[next.name? next.name : next.id] = next.color ? next.color : COLORS[colorIndex++]
            return acc;
        }, {} as { [id: string]: string})
    }

}