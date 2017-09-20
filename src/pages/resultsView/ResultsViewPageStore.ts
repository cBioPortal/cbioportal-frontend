import {
    DiscreteCopyNumberFilter, DiscreteCopyNumberData, ClinicalData, ClinicalDataMultiStudyFilter, Sample,
    SampleIdentifier, MolecularProfile, Mutation, GeneMolecularData, MolecularDataFilter, Gene
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
import accessors from "../../shared/lib/oql/accessors";
import {filterCBioPortalWebServiceData} from "../../shared/lib/oql/oqlfilter.js";
import {keepAlive} from "mobx-utils";
import MutationMapper from "./mutation/MutationMapper";
import {CacheData} from "../../shared/lib/LazyMobXCache";

export type SamplesSpecificationElement = {studyId: string, sampleId: string, sampleListId: undefined} |
    {studyId: string, sampleId: undefined, sampleListId: string};

export const AlterationTypeConstants = {
    MUTATION_EXTENDED: 'MUTATION_EXTENDED',
    COPY_NUMBER_ALTERATION: 'COPY_NUMBER_ALTERATION',
    MRNA_EXPRESSION: 'MRNA_EXPRESSION',
    PROTEIN_LEVEL: 'PROTEIN_LEVEL',
    FUSION: 'FUSION'
}

interface ExtendedAlteration extends Mutation, GeneMolecularData {
    alterationType: string
    alterationSubType: string
};

export function buildDefaultOQLProfile(profilesTypes: string[], zScoreThreshold: number, rppaScoreThreshold: number) {

    var default_oql_uniq: any = {};
    for (var i = 0; i < profilesTypes.length; i++) {
        var type = profilesTypes[i];
        switch (type) {
            case "MUTATION_EXTENDED":
                default_oql_uniq["MUT"] = true;
                default_oql_uniq["FUSION"] = true;
                break;
            case "COPY_NUMBER_ALTERATION":
                default_oql_uniq["AMP"] = true;
                default_oql_uniq["HOMDEL"] = true;
                break;
            case "MRNA_EXPRESSION":
                default_oql_uniq["EXP>=" + zScoreThreshold] = true;
                default_oql_uniq["EXP<=-" + zScoreThreshold] = true;
                break;
            case "PROTEIN_LEVEL":
                default_oql_uniq["PROT>=" + rppaScoreThreshold] = true;
                default_oql_uniq["PROT<=-" + rppaScoreThreshold] = true;
                break;
        }
    }
    return Object.keys(default_oql_uniq).join(" ");

}


export function countAlterationOccurences(samplesByCancerType: {[cancerType: string]: Sample[]}, alterationsBySampleId: {[id: string]: ExtendedAlteration[]}) {

    return _.mapValues(samplesByCancerType, (samples: Sample[], cancerType: string) => {

        const counts = {
            mutated: 0,
            amplified: 0,
            deleted: 0,
            fusion: 0,
            mrnaExpressionUp: 0,
            mrnaExpressionDown: 0,
            protExpressionUp: 0,
            protExpressionDown: 0,
            multiple: 0,
            total: samples.length
        };
        // for each sample in cancer type
        _.forIn(samples, (sample: Sample) => {
            // there are alterations corresponding to that sample
            if (sample.uniqueSampleKey in alterationsBySampleId) {

                const alterations = alterationsBySampleId[sample.uniqueSampleKey];

                //a sample could have multiple mutations.  we only want to to count one
                const uniqueAlterations = _.uniqBy(alterations, (alteration) => alteration.alterationType);

                // if we have multiple alterations, we just register this as "multiple" and do NOT add
                // individual alterations to their respective counts
                if (alterations.length > 1) {
                    counts.multiple++;
                } else {

                    // for each alteration, determine what it's type is and increment the counts for this set of samples
                    _.forEach(uniqueAlterations, (alteration: ExtendedAlteration) => {
                        switch (alteration.alterationType) {
                            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                                if (alteration.alterationSubType === 'amp') counts.amplified++;
                                if (alteration.alterationSubType === 'homdel') counts.deleted++;
                                break;
                            case AlterationTypeConstants.MRNA_EXPRESSION:
                                if (alteration.alterationSubType === 'up') counts.mrnaExpressionUp++;
                                if (alteration.alterationSubType === 'down') counts.mrnaExpressionDown++;
                                break;
                            case AlterationTypeConstants.PROTEIN_LEVEL:
                                if (alteration.alterationSubType === 'up') counts.protExpressionUp++;
                                if (alteration.alterationSubType === 'down') counts.protExpressionDown++;
                                break;
                            case AlterationTypeConstants.MUTATION_EXTENDED:
                                counts.mutated++;
                                break;
                            case AlterationTypeConstants.FUSION:
                                counts.fusion++;
                                break;

                        }

                    });
                }

            }

        });
        return counts;

    });

}


export class ResultsViewPageStore {

    constructor() {
        labelMobxPromises(this);

        addErrorHandler((error: any) => {
            this.ajaxErrors.push(error);
        });
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable hugoGeneSymbols: string[]|null = null;
    @observable samplesSpecification: SamplesSpecificationElement[] = [];

    @observable zScoreThreshold: number;

    @observable rppaScoreThreshold: number;

    @observable oqlQuery: string = '';

    @observable selectedMolecularProfileIds: string[] = [];

    readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>(() => {
        return Promise.all(this.selectedMolecularProfileIds.map((id) => client.getMolecularProfileUsingGET({molecularProfileId: id})));
    });

    //NOTE: this can only be invoked after mutationMapperStores is populated.  not great.
    readonly allMutations = remoteData({
        await: () =>
            _.flatMap(this.mutationMapperStores, (store: MutationMapperStore) => store.mutationData)
        ,
        invoke: async() => {
            return _.mapValues(this.mutationMapperStores, (store: MutationMapperStore) => store.mutationData.result);
        }
    });

    readonly molecularData = remoteData({
        await: () => [
            this.studyToDataQueryFilter,
            this.genes,
            this.selectedMolecularProfiles
        ],
        invoke: async() => {
            // we get mutations with mutations endpoint, all other alterations with this one, so filter out mutation genetic profile
            const profilesWithoutMutationProfile = _.filter(this.selectedMolecularProfiles.result, (profile: MolecularProfile) => profile.molecularAlterationType !== 'MUTATION_EXTENDED');
            if (profilesWithoutMutationProfile) {
                const promises: Promise<GeneMolecularData[]>[] = profilesWithoutMutationProfile.map((profile: MolecularProfile) => {
                    const filter: MolecularDataFilter = (Object.assign(
                            {},
                            {
                                entrezGeneIds: this.genes.result!.map(gene => gene.entrezGeneId)
                            },
                            this.studyToDataQueryFilter.result![profile.studyId]
                        ) as MolecularDataFilter
                    );
                    return client.fetchAllMolecularDataInMolecularProfileUsingPOST({
                        molecularProfileId: profile.molecularProfileId,
                        molecularDataFilter: filter,
                        projection: 'DETAILED'
                    });
                });
                return Promise.all(promises).then((arrs: GeneMolecularData[][]) => _.concat([], ...arrs));
            } else {
                return [];
            }
        }
    });

    readonly filteredAlterations = remoteData({
        await: () => [
            this.genes,
            this.selectedMolecularProfiles,
            this.mutationMapperStores,
            this.molecularData,
            this.defaultOQLQuery,
            this.mutationDataReady
        ],
        invoke: async() => {

            const filteredMolecularDataByGene = _.groupBy(this.molecularData.result, (item: GeneMolecularData) => item.gene.hugoGeneSymbol);

            const genesAsDictionary = _.keyBy(this.genes.result, (gene: Gene) => gene.hugoGeneSymbol);

            //TODO must check state
            // now merge alterations with mutations by gene
            const mergedAlterationsByGene = _.mapValues(genesAsDictionary, (gene: Gene) => {
                // if for some reason it doesn't exist, assign empty array;
                return _.concat(([] as (Mutation|GeneMolecularData)[]), this.geneToMutationData[gene.hugoGeneSymbol]!.data!,
                    filteredMolecularDataByGene![gene.hugoGeneSymbol!]!);
            });
            const ret = _.mapValues(mergedAlterationsByGene, (mutations: (Mutation|GeneMolecularData)[]) => {
                return filterCBioPortalWebServiceData(this.oqlQuery, mutations, (new accessors(this.selectedMolecularProfiles.result!)), this.defaultOQLQuery.result!, undefined, true);
            });

            return ret;
        }
    });

    readonly mutationDataReady = remoteData({
        await: ()=>[this.genes],
        invoke: ()=>this.mutationDataCache.getPromise(this.genes.result)
    });

    readonly defaultOQLQuery = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profileTypes = _.map(this.selectedMolecularProfiles.result, (profile) => profile.molecularAlterationType);
            return Promise.resolve(buildDefaultOQLProfile(profileTypes, this.zScoreThreshold, this.rppaScoreThreshold));
        }

    });

    readonly samplesByDetailedCancerType = remoteData<{[cancerType:string]:Sample[]}>({
        await: () => [
            this.samples,
            this.clinicalDataForSamples
        ],
        invoke: () => {
            // first group samples by type
            const sampleKeyToCancerTypeClinicalDataMap = _.reduce(this.clinicalDataForSamples.result, (memo: any, clinicalData: ClinicalData) => {
                if (clinicalData.clinicalAttributeId === 'CANCER_TYPE_DETAILED') {
                    memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                }
                // we only use CANCER_TYPE (more general than CANCNER_TYPE_DETAILED) IF
                // if we haven't yet found a detailed type
                // this way, detailed can override not-detailed, but not vice-versa
                if (!memo[clinicalData.uniqueSampleKey]) {
                    memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                }

                return memo;
            }, {});
            let ret = _.reduce(this.samples.result, (memo:{[cancerType:string]:Sample[]} , sample: Sample) => {
                if (sample.uniqueSampleKey in sampleKeyToCancerTypeClinicalDataMap) {
                    memo[sampleKeyToCancerTypeClinicalDataMap[sample.uniqueSampleKey]] = memo[sampleKeyToCancerTypeClinicalDataMap[sample.uniqueSampleKey]] || [];
                    memo[sampleKeyToCancerTypeClinicalDataMap[sample.uniqueSampleKey]].push(sample);
                }
                return memo;
            }, {});
            return Promise.resolve(ret);
        }
    });

    readonly alterationsBySampleIdByGene = remoteData({
        await: () => [
            this.filteredAlterations,
            this.samples
        ],
        invoke: async() => {
            return _.mapValues(this.filteredAlterations.result, (alterations: ExtendedAlteration[]) => {
                return _.groupBy(alterations, (alteration: ExtendedAlteration) => alteration.uniqueSampleKey);
            });
        }
    });

    readonly alterationCountsForCancerTypesByGene = remoteData({
        await: () => [
            this.samplesByDetailedCancerType,
            this.filteredAlterations,
            this.selectedMolecularProfiles,
            this.alterationsBySampleIdByGene
        ],
        invoke: () => {
            // look through list of alterations for each gene
            const ret = _.mapValues(this.alterationsBySampleIdByGene.result, (alterationsBySampleId: {[sampleId: string]: ExtendedAlteration[]}, gene: string) => {
                return countAlterationOccurences(this.samplesByDetailedCancerType.result!, alterationsBySampleId);
            });
            return Promise.resolve(ret);
        }
    });

    readonly alterationCountsForCancerTypesForAllGenes = remoteData({
        await: () => [
            this.samplesByDetailedCancerType,
            this.filteredAlterations,
            this.selectedMolecularProfiles,
            this.alterationsBySampleIdByGene
        ],
        invoke: () => {
            // look through list of alterations for each gene
            //const ret = _.mapValues(this.alterationsBySampleIdByGene.result, (alterationsBySampleId: {[sampleId: string]: ExtendedAlteration[]}, gene: string) => {

            const flattened = _.flatMap(this.alterationsBySampleIdByGene.result, (map)=>map);
            // NEED TO FLATTEN and then merge this to get all alteration by sampleId
            function customizer(objValue:any, srcValue:any) {
                if (_.isArray(objValue)) {
                    return objValue.concat(srcValue);
                }
            }
            const merged: {[uniqueSampleKey:string]: ExtendedAlteration[] } =
                (_.mergeWith({},...flattened, customizer) as {[uniqueSampleKey:string]: ExtendedAlteration[] });
            const ret = countAlterationOccurences(this.samplesByDetailedCancerType.result!, merged);
            return Promise.resolve(ret);
        }
    });

    readonly filteredAlterationsAsSampleIdArrays = remoteData({
        await: () => [
            this.filteredAlterations
        ],
        invoke: async() => {
            return _.mapValues(this.filteredAlterations.result, (mutations: Mutation[]) => _.map(mutations, 'sampleId'));
        }
    });

    readonly isSampleAlteredMap = remoteData({
        await: () => [this.filteredAlterationsAsSampleIdArrays, this.samples],
        invoke: async() => {
            return _.mapValues(this.filteredAlterationsAsSampleIdArrays.result, (sampleIds: string[]) => {
                return this.samples.result.map((sample: Sample) => {
                    return _.includes(sampleIds, sample.sampleId);
                });
            });
        }
    });

    // readonly genes = remoteData(async() => {
    //     if (this.hugoGeneSymbols) {
    //         return client.fetchGenesUsingPOST({
    //             geneIds: this.hugoGeneSymbols.slice(),
    //             geneIdType: "HUGO_GENE_SYMBOL"
    //         });
    //     }
    //     return undefined;
    // });

    readonly studyToSampleIds = remoteData<{[studyId: string]: {[sampleId: string]: boolean}}>(async() => {
        const sampleListsToQuery: {studyId: string, sampleListId: string}[] = [];
        const ret: {[studyId: string]: {[sampleId: string]: boolean}} = {};
        for (const sampleSpec of this.samplesSpecification) {
            if (sampleSpec.sampleId) {
                ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || {};
                ret[sampleSpec.studyId][sampleSpec.sampleId] = true;
            } else if (sampleSpec.sampleListId) {
                sampleListsToQuery.push(sampleSpec as {studyId: string, sampleListId: string});
            }
        }
        const results: string[][] = await Promise.all(sampleListsToQuery.map(spec => {
            return client.getAllSampleIdsInSampleListUsingGET({
                sampleListId: spec.sampleListId
            });
        }));
        for (let i = 0; i < results.length; i++) {
            ret[sampleListsToQuery[i].studyId] = ret[sampleListsToQuery[i].studyId] || {};
            const sampleMap = ret[sampleListsToQuery[i].studyId];
            results[i].map(sampleId => {
                sampleMap[sampleId] = true;
            });
        }
        return ret;
    }, {});

    @computed get studyToSampleListId(): {[studyId: string]: string} {
        return this.samplesSpecification.reduce((map, next) => {
            if (next.sampleListId) {
                map[next.studyId] = next.sampleListId;
            }
            return map;
        }, {} as {[studyId: string]: string});
    }

    readonly studyToMutationMolecularProfile = remoteData<{[studyId: string]: MolecularProfile}>({
        await: () => [
            this.molecularProfilesInStudies
        ],
        invoke: () => {
            const ret: {[studyId: string]: MolecularProfile} = {};
            for (const profile of this.molecularProfilesInStudies.result) {
                const studyId = profile.studyId;
                if (!ret[studyId] && isMutationProfile(profile)) {
                    ret[studyId] = profile;
                }
            }
            return Promise.resolve(ret);
        }
    }, {});

    @computed get studyIds(): string[] {
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
            const filter: ClinicalDataMultiStudyFilter = {
                attributeIds: ["CANCER_TYPE", "CANCER_TYPE_DETAILED"],
                identifiers: this.samples.result.map((s: Sample) => ({entityId: s.sampleId, studyId: s.studyId}))
            };
            return client.fetchClinicalDataUsingPOST({
                clinicalDataType: "SAMPLE",
                clinicalDataMultiStudyFilter: filter,
                projection: "DETAILED"
            });
        }
    }, []);

    readonly germlineConsentedSamples = remoteData<SampleIdentifier[]>({
        invoke: async() => {
            const studies: string[] = this.studyIds;
            const ids: string[][] = await Promise.all(studies.map(studyId => {
                return client.getAllSampleIdsInSampleListUsingGET({
                    sampleListId: this.getGermlineSampleListId(studyId)
                });
            }));
            return _.flatten(ids.map((sampleIds: string[], index: number) => {
                const studyId = studies[index];
                return sampleIds.map(sampleId => ({sampleId, studyId}));
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
            let sampleIdentifiers: SampleIdentifier[] = [];
            _.each(this.studyToSampleIds.result, (sampleIds: {[sampleId: string]: boolean}, studyId: string) => {
                sampleIdentifiers = sampleIdentifiers.concat(Object.keys(sampleIds).map(sampleId => ({
                    sampleId,
                    studyId
                })));
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
            const sampleHasData: {[sampleUid: string]: boolean} = {};
            for (const data of this.clinicalDataForSamples.result) {
                sampleHasData[toSampleUuid(data.clinicalAttribute.studyId, data.sampleId)] = true;
            }
            return Promise.resolve(this.samples.result.filter(sample => {
                return !sampleHasData[toSampleUuid(sample.studyId, sample.sampleId)];
            }));
        }
    }, []);

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.samplesWithoutCancerTypeClinicalData
        ],
        invoke: async() => fetchStudiesForSamplesWithoutCancerTypeClinicalData(this.samplesWithoutCancerTypeClinicalData)
    }, []);

    readonly studies = remoteData({
        invoke: () => Promise.all(this.studyIds.map(studyId => client.getStudyUsingGET({studyId})))
    }, []);

    private getGermlineSampleListId(studyId: string): string {
        return `${studyId}_germline`;
    }

    readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>({
        invoke: async() => {
            return _.flatten(await Promise.all(this.studyIds.map(studyId => {
                return client.getAllMolecularProfilesInStudyUsingGET({
                    studyId
                });
            })));
        }
    }, []);

    readonly molecularProfileIdToMolecularProfile = remoteData<{[molecularProfileId: string]: MolecularProfile}>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () => {
            return Promise.resolve(this.molecularProfilesInStudies.result.reduce((map: {[molecularProfileId: string]: MolecularProfile}, next: MolecularProfile) => {
                map[next.molecularProfileId] = next;
                return map;
            }, {}));
        }
    }, {});

    readonly studyToMolecularProfileDiscrete = remoteData<{[studyId: string]: MolecularProfile}>({
        await: () => [
            this.molecularProfilesInStudies
        ],
        invoke: async() => {
            const ret: {[studyId: string]: MolecularProfile} = {};
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
        invoke: async() => {
            const studies = this.studyIds;
            const results: DiscreteCopyNumberData[][] = await Promise.all(studies.map(studyId => {
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
        onResult: (result: DiscreteCopyNumberData[]) => {
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            this.discreteCNACache.addData(result);
        }

    }, []);

    readonly studyToDataQueryFilter = remoteData<{[studyId: string]: IDataQueryFilter}>({
        await: () => [this.studyToSampleIds],
        invoke: () => {
            const studies = this.studyIds;
            const ret: {[studyId: string]: IDataQueryFilter} = {};
            for (const studyId of studies) {
                ret[studyId] = generateDataQueryFilter(this.studyToSampleListId[studyId] || null, Object.keys(this.studyToSampleIds.result[studyId] || {}))
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
