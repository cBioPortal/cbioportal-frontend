import {
    DiscreteCopyNumberFilter, DiscreteCopyNumberData, ClinicalData, ClinicalDataMultiStudyFilter, Sample,
    SampleIdentifier, MolecularProfile, Mutation, Gene
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable, action} from "mobx";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import {labelMobxPromises, cached, MobxPromise} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    findMolecularProfileIdDiscrete, fetchMyCancerGenomeData,
    fetchDiscreteCNAData, findMutationMolecularProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalDataInStudy, generateDataQueryFilter,
    fetchSamplesWithoutCancerTypeClinicalData, fetchStudiesForSamplesWithoutCancerTypeClinicalData, IDataQueryFilter,
    isMutationProfile
} from "shared/lib/StoreUtils";
import {MutationMapperStore} from "./mutation/MutationMapperStore";
import AppConfig from "appConfig";
import * as _ from 'lodash';
import {stringListToIndexSet, stringListToSet} from "../../shared/lib/StringUtils";
import {toSampleUuid} from "../../shared/lib/UuidUtils";
import MutationDataCache from "../../shared/cache/MutationDataCache";
import MutationMapper from "./mutation/MutationMapper";
import {CacheData} from "../../shared/lib/LazyMobXCache";

export type SamplesSpecificationElement = { studyId:string, sampleId:string, sampleListId:undefined } |
                                    { studyId:string, sampleId:undefined, sampleListId:string};
export class ResultsViewPageStore {

    constructor() {
        labelMobxPromises(this);

        addErrorHandler((error:any) => {
            this.ajaxErrors.push(error);
        });
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable hugoGeneSymbols: string[]|null = null;
    @observable samplesSpecification:SamplesSpecificationElement[] = [];

    readonly studyToSampleIds = remoteData<{[studyId:string]:{[sampleId:string]:boolean}}>(async()=>{
        const sampleListsToQuery:{studyId:string, sampleListId:string}[] = [];
        const ret:{[studyId:string]:{[sampleId:string]:boolean}} = {};
        for (const sampleSpec of this.samplesSpecification) {
            if (sampleSpec.sampleId) {
                ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || {};
                ret[sampleSpec.studyId][sampleSpec.sampleId] = true;
            } else if (sampleSpec.sampleListId) {
                sampleListsToQuery.push(sampleSpec as {studyId:string, sampleListId:string});
            }
        }
        const results:string[][] = await Promise.all(sampleListsToQuery.map(spec=>{
            return client.getAllSampleIdsInSampleListUsingGET({
                sampleListId: spec.sampleListId
            });
        }));
        for (let i=0; i<results.length; i++) {
            ret[sampleListsToQuery[i].studyId] = ret[sampleListsToQuery[i].studyId] || {};
            const sampleMap = ret[sampleListsToQuery[i].studyId];
            results[i].map(sampleId=>{
                sampleMap[sampleId] = true;
            });
        }
        return ret;
    }, {});

    @computed get studyToSampleListId():{[studyId:string]:string} {
        return this.samplesSpecification.reduce((map, next)=>{
            if (next.sampleListId) {
                map[next.studyId] = next.sampleListId;
            }
            return map;
        }, {} as {[studyId:string]:string});
    }

    readonly studyToMutationMolecularProfile = remoteData<{[studyId:string]:MolecularProfile}>({
        await: () => [
            this.molecularProfilesInStudies
        ],
        invoke: ()=>{
            const ret:{[studyId:string]:MolecularProfile} = {};
            for (const profile of this.molecularProfilesInStudies.result) {
                const studyId = profile.studyId;
                if (!ret[studyId] && isMutationProfile(profile)) {
                    ret[studyId] = profile;
                }
            }
            return Promise.resolve(ret);
        }
    }, {});

    @computed get studyIds():string[] {
        return Object.keys(this.studyToSampleIds.result);
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    readonly mutationMapperStores = remoteData<{[hugoGeneSymbol: string]: MutationMapperStore}>({
        await: ()=>[this.genes],
        invoke: ()=>{
            if (this.genes.result) {
                // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                return Promise.resolve(_.reduce(this.genes.result, (map:{[hugoGeneSymbol:string]:MutationMapperStore}, gene:Gene)=>{
                    map[gene.hugoGeneSymbol] = new MutationMapperStore(AppConfig,
                        gene,
                        this.samples,
                        ()=>(this.mutationDataCache),
                        this.molecularProfileIdToMolecularProfile,
                        this.clinicalDataForSamples,
                        this.studiesForSamplesWithoutCancerTypeClinicalData,
                        this.samplesWithoutCancerTypeClinicalData,
                        this.germlineConsentedSamples);
                    return map;
                }, {}));
            } else {
                return Promise.resolve({});
            }
        }
    }, {});

    public getMutationMapperStore(hugoGeneSymbol:string): MutationMapperStore|undefined
    {
        return this.mutationMapperStores.result[hugoGeneSymbol];
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
                sampleHasData[toSampleUuid(data.clinicalAttribute.studyId, data.sampleId)] = true;
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

    readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>({
        invoke:async()=>{
            return _.flatten(await Promise.all(this.studyIds.map(studyId=>{
                return client.getAllMolecularProfilesInStudyUsingGET({
                    studyId
                });
            })));
        }
    }, []);

    readonly molecularProfileIdToMolecularProfile = remoteData<{[molecularProfileId:string]:MolecularProfile}>({
        await:()=>[this.molecularProfilesInStudies],
        invoke:()=>{
            return Promise.resolve(this.molecularProfilesInStudies.result.reduce((map:{[molecularProfileId:string]:MolecularProfile}, next:MolecularProfile)=>{
                map[next.molecularProfileId] = next;
                return map;
            }, {}));
        }
    }, {});

    readonly studyToMolecularProfileDiscrete = remoteData<{[studyId:string]:MolecularProfile}>({
        await: () => [
            this.molecularProfilesInStudies
        ],
        invoke: async () => {
            const ret:{[studyId:string]:MolecularProfile} = {};
            for (const molecularProfile of this.molecularProfilesInStudies.result) {
                if (molecularProfile.datatype === "DISCRETE") {
                    ret[molecularProfile.studyId] = molecularProfile;
                }
            }
            return ret;
        }
    }, {});

    readonly discreteCNAData = remoteData<DiscreteCopyNumberData[]>({
        await: () => [
            this.studyToMolecularProfileDiscrete,
            this.studyToDataQueryFilter
        ],
        invoke: async () => {
            const studies = this.studyIds;
            const results:DiscreteCopyNumberData[][] = await Promise.all(studies.map(studyId=>{
                const filter = this.studyToDataQueryFilter.result[studyId];
                const profile = this.studyToMolecularProfileDiscrete.result[studyId];
                if (filter && profile) {
                    return client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST({
                        projection: "DETAILED",
                        discreteCopyNumberFilter: filter as DiscreteCopyNumberFilter,
                        molecularProfileId: profile.molecularProfileId
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
                ret[studyId] = generateDataQueryFilter(this.studyToSampleListId[studyId]||null, Object.keys(this.studyToSampleIds.result[studyId] || {}))
            }
            return Promise.resolve(ret);
        }
    }, {});

    readonly genes = remoteData<Gene[]>(async()=>{
        if (this.hugoGeneSymbols && this.hugoGeneSymbols.length) {
            const order = stringListToIndexSet(this.hugoGeneSymbols);
            return _.sortBy(await client.fetchGenesUsingPOST({
                geneIdType: "HUGO_GENE_SYMBOL",
                geneIds: this.hugoGeneSymbols.slice(),
                projection: "ID"
            }), (gene:Gene)=>order[gene.hugoGeneSymbol]);
        } else {
            return [];
        }
    });

    @computed get geneToMutationData():{[hugoGeneSymbol:string]:CacheData<Mutation[]>|null} {
        if (this.genes.result) {
            return this.genes.result.reduce((map:{[hugoGeneSymbol:string]:CacheData<Mutation[]>|null}, gene:Gene)=>{
                map[gene.hugoGeneSymbol] = this.mutationDataCache.get({ entrezGeneId: gene.entrezGeneId });
                return map;
            }, {});
        } else {
            return {};
        }
    }

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
        return new DiscreteCNACache(this.studyToMolecularProfileDiscrete.result);
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
        return new MutationDataCache(this.studyToMutationMolecularProfile.result,
                                    this.studyToDataQueryFilter.result);
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }
}
