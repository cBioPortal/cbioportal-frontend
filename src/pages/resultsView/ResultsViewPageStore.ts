import {
    DiscreteCopyNumberFilter, DiscreteCopyNumberData, ClinicalData, ClinicalDataMultiStudyFilter, Sample,
    SampleIdentifier, GeneticProfile, Mutation
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable, action} from "mobx";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import {labelMobxPromises, cached} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    findGeneticProfileIdDiscrete, fetchMyCancerGenomeData,
    fetchDiscreteCNAData, findMutationGeneticProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalDataInStudy, generateDataQueryFilter,
    fetchSamplesWithoutCancerTypeClinicalData, fetchStudiesForSamplesWithoutCancerTypeClinicalData, IDataQueryFilter,
    isMutationProfile
} from "shared/lib/StoreUtils";
import {MutationMapperStore} from "./mutation/MutationMapperStore";
import AppConfig from "appConfig";
import * as _ from 'lodash';
import {stringListToSet} from "../../shared/lib/StringUtils";
import {toSampleUuid} from "../../shared/lib/UuidUtils";
import MutationDataCache from "../../shared/cache/MutationDataCache";

export class ResultsViewPageStore {

    constructor() {
        labelMobxPromises(this);

        addErrorHandler((error:any) => {
            this.ajaxErrors.push(error);
        });
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    //@observable studyId: string = '';
    //@observable sampleListId: string|null = null;
    @observable hugoGeneSymbols: string[]|null = null;
    //@observable sampleList: string[]|null = null;
    @observable _studyToSampleIds:{[studyId:string]:{[sampleId:string]:boolean}}|null = null;
    @observable studyToSampleListId:{[studyId:string]:string}|null = null;

    readonly studyToSampleIds = remoteData<{[studyId:string]:{[sampleId:string]:boolean}}>(async()=>{
        if (this._studyToSampleIds) {
            // first priority: user provided custom sample list
            return this._studyToSampleIds;
        } else if (this.studyToSampleListId) {
            // if no custom sample list try to fetch sample ids from the API
            const studyToSampleListId = this.studyToSampleListId;
            const studies = Object.keys(studyToSampleListId);
            const results:string[][] = await Promise.all(studies.map(studyId=>{
                return client.getAllSampleIdsInSampleListUsingGET({
                    sampleListId: studyToSampleListId[studyId]
                });
            }));
            return results.reduce((map:{[studyId:string]:{[sampleId:string]:boolean}}, next:string[], index:number)=>{
                const correspondingStudy = studies[index];
                map[correspondingStudy] = stringListToSet(next);
                return map;
            }, {});
        } else {
            return {};
        }
    }, {});

    readonly studyToMutationGeneticProfile = remoteData<{[studyId:string]:GeneticProfile}>({
        await: () => [
            this.geneticProfilesInStudies
        ],
        invoke: ()=>{
            const ret:{[studyId:string]:GeneticProfile} = {};
            for (const profile of this.geneticProfilesInStudies.result) {
                const studyId = profile.studyId;
                if (!ret[studyId] && isMutationProfile(profile)) {
                    ret[studyId] = profile;
                }
            }
            return Promise.resolve(ret);
        }
    }, {});

    @computed get studyIds():string[] {
        if (this._studyToSampleIds) {
            return Object.keys(this._studyToSampleIds);
        } else if (this.studyToSampleListId) {
            return Object.keys(this.studyToSampleListId);
        } else {
            return [];
        }
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    protected mutationMapperStores: {[hugoGeneSymbol: string]: MutationMapperStore} = {};

    public getMutationMapperStore(hugoGeneSymbol:string): MutationMapperStore|undefined
    {
        if (this.mutationMapperStores[hugoGeneSymbol]) {
            return this.mutationMapperStores[hugoGeneSymbol];
        }
        else if (!this.hugoGeneSymbols || !this.hugoGeneSymbols.find((gene:string) => gene === hugoGeneSymbol)) {
            return undefined;
        }
        else {
            const store = new MutationMapperStore(AppConfig,
                hugoGeneSymbol,
                this.samples,
                ()=>(this.mutationDataCache),
                this.geneticProfileIdToGeneticProfile,
                this.clinicalDataForSamples,
                this.studiesForSamplesWithoutCancerTypeClinicalData,
                this.samplesWithoutCancerTypeClinicalData,
                this.germlineConsentedSamples);

            this.mutationMapperStores[hugoGeneSymbol] = store;

            return store;
        }
    }

    readonly clinicalDataForSamples = remoteData<ClinicalData[]>({
        await: () => [
            this.samples
        ],
        invoke: () => {
            const filter:ClinicalDataMultiStudyFilter = {
                attributeIds: ["CANCER_TYPE", "CANCER_TYPE_DETAILED"],
                identifiers: this.samples.result.map((s:Sample)=>({entityId:s.sampleId, studyId:s.studyId}))
            };
            return client.fetchClinicalDataUsingPOST({
                clinicalDataType: "SAMPLE",
                clinicalDataMultiStudyFilter: filter,
                projection: "DETAILED"
            });
        }
    }, []);

    readonly germlineConsentedSamples = remoteData<SampleIdentifier[]>({
        invoke: async () => {
            const studies:string[] = this.studyIds;
            const ids:string[][] = await Promise.all(studies.map(studyId=>{
                return client.getAllSampleIdsInSampleListUsingGET({
                    sampleListId: this.getGermlineSampleListId(studyId)
                });
            }));
            return _.flatten(ids.map((sampleIds:string[], index:number)=>{
                const studyId = studies[index];
                return sampleIds.map(sampleId=>({sampleId, studyId}));
            }));
        },
        onError: () => {
            // fail silently
        }
    }, []);

    readonly samples = remoteData({
        await: () => [
            this.studyToSampleIds
        ],
        invoke: () => {
            let sampleIdentifiers:SampleIdentifier[] = [];
            _.each(this.studyToSampleIds.result, (sampleIds:{[sampleId:string]:boolean}, studyId:string)=>{
                sampleIdentifiers = sampleIdentifiers.concat(Object.keys(sampleIds).map(sampleId=>({sampleId, studyId})));
            });
            return client.fetchSamplesUsingPOST({
                sampleIdentifiers,
                projection: "DETAILED"
            });
        }
    }, []);

    readonly samplesWithoutCancerTypeClinicalData = remoteData<Sample[]>({
        await: () => [
            this.samples,
            this.clinicalDataForSamples
        ],
        invoke: () => {
            const sampleHasData:{[sampleUid:string]:boolean} = {};
            for (const data of this.clinicalDataForSamples.result) {
                sampleHasData[toSampleUuid(data.clinicalAttribute.studyId, data.entityId)] = true;
            }
            return Promise.resolve(this.samples.result.filter(sample=>{
                return !sampleHasData[toSampleUuid(sample.studyId, sample.sampleId)];
            }));
        }
    }, []);

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.samplesWithoutCancerTypeClinicalData
        ],
        invoke: async () => fetchStudiesForSamplesWithoutCancerTypeClinicalData(this.samplesWithoutCancerTypeClinicalData)
    }, []);

    readonly studies = remoteData({
        invoke: ()=>Promise.all(this.studyIds.map(studyId=>client.getStudyUsingGET({studyId})))
    }, []);

    private getGermlineSampleListId(studyId:string):string {
        return `${studyId}_germline`;
    }

    readonly geneticProfilesInStudies = remoteData<GeneticProfile[]>({
        invoke:async()=>{
            return _.flatten(await Promise.all(this.studyIds.map(studyId=>{
                return client.getAllGeneticProfilesInStudyUsingGET({
                    studyId
                });
            })));
        }
    }, []);

    readonly geneticProfileIdToGeneticProfile = remoteData<{[geneticProfileId:string]:GeneticProfile}>({
        await:()=>[this.geneticProfilesInStudies],
        invoke:()=>{
            return Promise.resolve(this.geneticProfilesInStudies.result.reduce((map:{[geneticProfileId:string]:GeneticProfile}, next:GeneticProfile)=>{
                map[next.geneticProfileId] = next;
                return map;
            }, {}));
        }
    }, {});

    readonly studyToGeneticProfileDiscrete = remoteData<{[studyId:string]:GeneticProfile}>({
        await: () => [
            this.geneticProfilesInStudies
        ],
        invoke: async () => {
            const ret:{[studyId:string]:GeneticProfile} = {};
            for (const geneticProfile of this.geneticProfilesInStudies.result) {
                if (geneticProfile.datatype === "DISCRETE") {
                    ret[geneticProfile.studyId] = geneticProfile;
                }
            }
            return ret;
        }
    }, {});

    readonly discreteCNAData = remoteData<DiscreteCopyNumberData[]>({
        await: () => [
            this.studyToGeneticProfileDiscrete,
            this.studyToDataQueryFilter
        ],
        invoke: async () => {
            const studies = this.studyIds;
            const results:DiscreteCopyNumberData[][] = await Promise.all(studies.map(studyId=>{
                const filter = this.studyToDataQueryFilter.result[studyId];
                const profile = this.studyToGeneticProfileDiscrete.result[studyId];
                if (filter && profile) {
                    return client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
                        projection: "DETAILED",
                        discreteCopyNumberFilter: filter as DiscreteCopyNumberFilter,
                        geneticProfileId: profile.geneticProfileId
                    });
                } else {
                    return Promise.resolve([]);
                }
            }));
            return _.flatten(results);
        },
        onResult: (result:DiscreteCopyNumberData[]) => {
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            this.discreteCNACache.addData(result);
        }

    }, []);

    readonly studyToDataQueryFilter = remoteData<{[studyId:string]:IDataQueryFilter}>({
        await: ()=>[this.studyToSampleIds],
        invoke:()=>{
            const studies = this.studyIds;
            const ret:{[studyId:string]:IDataQueryFilter} = {};
            for (const studyId of studies) {
                ret[studyId] = generateDataQueryFilter((this.studyToSampleListId && this.studyToSampleListId[studyId])||null, Object.keys(this.studyToSampleIds.result[studyId]))
            }
            return Promise.resolve(ret);
        }
    }, {});

    @computed get mergedDiscreteCNAData():DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.studyToGeneticProfileDiscrete.result);
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache();
    }

    @cached get mutationCountCache() {
        return new MutationCountCache();
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @cached get mutationDataCache() {
        return new MutationDataCache(this.studyToMutationGeneticProfile.result,
                                    this.studyToDataQueryFilter.result);
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }
}
