import {ResultsViewPageStore} from "../resultsView/ResultsViewPageStore";
import {SampleGroup, TEMP_localStorageGroupsKey} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
import ListIndexedMap from "../../shared/lib/ListIndexedMap";
import {
    MolecularProfile,
    MolecularProfileFilter,
    Sample, SampleFilter,
    SampleIdentifier
} from "../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import client from "../../shared/api/cbioportalClientInstance";
import _ from "lodash";
import {
    pickCopyNumberEnrichmentProfiles, pickMRNAEnrichmentProfiles,
    pickMutationEnrichmentProfiles, pickProteinEnrichmentProfiles
} from "../resultsView/enrichments/EnrichmentsUtil";
import MobxPromiseCache from "../../shared/lib/MobxPromiseCache";
import {AlterationEnrichment} from "../../shared/api/generated/CBioPortalAPIInternal";
import {makeEnrichmentDataPromise} from "../resultsView/ResultsViewPageStoreUtils";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import autobind from "autobind-decorator";

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
}