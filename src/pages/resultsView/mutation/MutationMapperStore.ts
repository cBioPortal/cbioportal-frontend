import * as _ from "lodash";
import {
    Mutation, MutationFilter, Gene, ClinicalData, CancerStudy, Sample
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable} from "mobx";
import {remoteData} from "shared/api/remoteData";
import {labelMobxPromises, MobxPromise, cached} from "mobxpromise";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotData} from "shared/model/CancerHotspots";
import {IPdbChain, PdbAlignmentIndex} from "shared/model/Pdb";
import {ICivicGene, ICivicVariant} from "shared/model/Civic";
import PdbPositionMappingCache from "shared/cache/PdbPositionMappingCache";
import {calcPdbIdNumericalValue, mergeIndexedPdbAlignments} from "shared/lib/PdbUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {
    indexHotspotData, fetchHotspotsData, fetchCosmicData, fetchOncoKbData,
    fetchMutationData, generateStudyToSampleToTumorTypeMap, generateDataQueryFilter,
    ONCOKB_DEFAULT, fetchPdbAlignmentData, fetchSwissProtAccession, fetchUniprotId, indexPdbAlignmentData,
    fetchPfamGeneData, fetchCivicGenes, fetchCivicVariants, IDataQueryFilter
} from "shared/lib/StoreUtils";
import MutationMapperDataStore from "./MutationMapperDataStore";
import PdbChainDataStore from "./PdbChainDataStore";
import {IMutationMapperConfig} from "./MutationMapper";

export class MutationMapperStore {

    constructor(protected config: IMutationMapperConfig,
                protected hugoGeneSymbol:string,
                public studies: MobxPromise<CancerStudy[]>,
                private studyToMutationGeneticProfileId: MobxPromise<{[studyId:string]:string|undefined}>,
                private studyToSampleIds: MobxPromise<{[studyId:string]:{[sampleId:string]:boolean}}>,
                public studyToClinicalDataForSamples: MobxPromise<{[studyId:string]:ClinicalData[]}>,
                public studyToSamplesWithoutCancerTypeClinicalData: MobxPromise<{[studyId:string]:Sample[]}>,
                private studyToSampleListId: {[studyId:string]:string}|null,
                private studyToPatientIds: MobxPromise<{[studyId:string]:{[patientId:string]:boolean}}>,
                public studyToMskImpactGermlineConsentedPatientIds: MobxPromise<{[studyId:string]:{[patientId:string]:boolean}}>,
                private studyToDataQueryFilter:MobxPromise<{[studyId:string]:IDataQueryFilter|undefined}>)
    {
        labelMobxPromises(this);
    }

    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: () => fetchCosmicData(this.mutationData)
    });


    readonly hotspotData = remoteData({
        await: ()=> [
            this.mutationData
        ],
        invoke: async () => {
            return fetchHotspotsData(this.mutationData);
        },
        onError: () => {
            // fail silently
        }
    });

    readonly gene = remoteData(async () => {
        if (this.hugoGeneSymbol) {
            let genes = await client.fetchGenesUsingPOST({
                geneIds: [this.hugoGeneSymbol],
                geneIdType: "HUGO_GENE_SYMBOL"
            });

            if (genes.length > 0) {
                return genes[0];
            }
        }

        return undefined;
    });

    readonly studyToMutationData = remoteData({
        await: ()=>[
            this.gene,
            this.studyToDataQueryFilter,
            this.studyToMutationGeneticProfileId
        ],
        invoke: async ()=>{
            const gene = this.gene.result;
            if (gene) {
                const studyToMutationGeneticProfileId = this.studyToMutationGeneticProfileId.result!;
                const studyToDataQueryFilter = this.studyToDataQueryFilter.result!;
                const studies = Object.keys(studyToDataQueryFilter);
                const results:Mutation[][] = await Promise.all(studies.filter(studyId=>!!studyToDataQueryFilter[studyId]).map(studyId=>{
                    const mutationFilter = {
                        ...studyToDataQueryFilter[studyId],
                        entrezGeneIds: [gene.entrezGeneId]
                    } as MutationFilter;
                    return fetchMutationData(mutationFilter, studyToMutationGeneticProfileId[studyId])
                }));
                return results.reduce((map:{[studyId:string]:Mutation[]}, next:Mutation[], index:number)=>{
                    map[studies[index]] = next;
                    return map;
                }, {});
            } else {
                return {};
            }
        }
    }, {});

    readonly mutationData = remoteData<Mutation[]>({
        await: ()=>[this.studyToMutationData],
        invoke:()=>{
            return Promise.resolve(_.flatten(_.values(this.studyToMutationData.result)));
        }
    }, []);

    readonly alignmentData = remoteData({
        await: () => [
            this.uniprotId
        ],
        invoke: async () => {
            if (this.uniprotId.result) {
                return fetchPdbAlignmentData(this.uniprotId.result);
            }
            else {
                return [];
            }
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, []);

    readonly swissProtId = remoteData({
        await: () => [
            this.gene
        ],
        invoke: async() => {
            if (this.gene.result) {
                const accession:string|string[] = await fetchSwissProtAccession(this.gene.result.entrezGeneId);

                if (_.isArray(accession)) {
                    return accession[0];
                }
                else {
                    return accession;
                }
            }
            else {
                return "";
            }
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, "");

    readonly uniprotId = remoteData({
        await: () => [
            this.swissProtId
        ],
        invoke: async() => {
            if (this.swissProtId.result) {
                return fetchUniprotId(this.swissProtId.result);
            }
            else {
                return "";
            }
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, "");

    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.mutationData,
            this.studyToSampleToTumorType
        ],
        invoke:async()=>fetchOncoKbData(this.studyToSampleToTumorType.result, this.studyToMutationData),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly pfamGeneData = remoteData({
        await: ()=>[
            this.swissProtId
        ],
        invoke: async()=>{
            if (this.swissProtId.result) {
                return fetchPfamGeneData(this.swissProtId.result);
            } else {
                return {};
            }
        }
    }, {});

    readonly civicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.mutationData
        ],
        invoke: async() => this.config.showCivic ? fetchCivicGenes(this.mutationData) : {}
    }, undefined);

    readonly civicVariants = remoteData<ICivicVariant | undefined>({
        await: () => [
            this.civicGenes,
            this.mutationData
        ],
        invoke: async() => {
            if (this.config.showCivic && this.civicGenes.result) {
                return fetchCivicVariants(this.civicGenes.result as ICivicGene, this.mutationData);
            }
            else {
                return {};
            }
        }
    }, undefined);

    @computed get processedMutationData(): Mutation[][] {
        // just convert Mutation[] to Mutation[][]
        return (this.mutationData.result || []).map((mutation:Mutation) => [mutation]);
    }

    @computed get mergedAlignmentData(): IPdbChain[] {
        return mergeIndexedPdbAlignments(this.indexedAlignmentData);
    }

    @computed get indexedAlignmentData(): PdbAlignmentIndex {
        return indexPdbAlignmentData(this.alignmentData);
    }

    @computed get sortedMergedAlignmentData(): IPdbChain[] {
        const sortMetric = (pdbChain: IPdbChain) => [
            pdbChain.identity,         // first, sort by identity
            pdbChain.alignment.length, // then by alignment length
            pdbChain.identityPerc,     // then by identity percentage
            // current sort metric cannot handle mixed values so generating numerical values for strings
            ...calcPdbIdNumericalValue(pdbChain.pdbId, true), // then by pdb id (A-Z): always returns an array of size 4
            -1 * pdbChain.chain.charCodeAt(0)                 // then by chain id (A-Z): chain id is always one char
        ];

        return lazyMobXTableSort(this.mergedAlignmentData, sortMetric, false);
    }

    @computed get indexedHotspotData(): IHotspotData|undefined {
        return indexHotspotData(this.hotspotData);
    }

    readonly studyToSampleToTumorType = remoteData({
        await:()=>[
            this.studyToClinicalDataForSamples,
            this.studies,
            this.studyToSamplesWithoutCancerTypeClinicalData
        ],
        invoke:()=>{
            return Promise.resolve(generateStudyToSampleToTumorTypeMap(
                this.studyToClinicalDataForSamples,
                this.studies,
                this.studyToSamplesWithoutCancerTypeClinicalData
            ));
        }
    }, {});

    @cached get dataStore():MutationMapperDataStore {
        return new MutationMapperDataStore(this.processedMutationData);
    }

    @cached get pdbChainDataStore(): PdbChainDataStore {
        // initialize with sorted merged alignment data
        return new PdbChainDataStore(this.sortedMergedAlignmentData);
    }

    @cached get pdbPositionMappingCache()
    {
        return new PdbPositionMappingCache();
    }
}
