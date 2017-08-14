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
    fetchMutationData, generateSampleIdToTumorTypeMap, generateDataQueryFilter,
    ONCOKB_DEFAULT, fetchPdbAlignmentData, fetchSwissProtAccession, fetchUniprotId, indexPdbAlignmentData,
    fetchPfamGeneData, fetchCivicGenes, fetchCivicVariants
} from "shared/lib/StoreUtils";
import MutationMapperDataStore from "./MutationMapperDataStore";
import PdbChainDataStore from "./PdbChainDataStore";
import {IMutationMapperConfig} from "./MutationMapper";

export class MutationMapperStore {

    constructor(config: IMutationMapperConfig,
                hugoGeneSymbol:string,
                mutationGeneticProfileId: MobxPromise<string>,
                sampleIds: MobxPromise<string[]>,
                clinicalDataForSamples: MobxPromise<ClinicalData[]>,
                studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<CancerStudy[]>,
                samplesWithoutCancerTypeClinicalData: MobxPromise<Sample[]>,
                sampleListId: string|null,
                patientIds: MobxPromise<string[]>,
                mskImpactGermlineConsentedPatientIds: MobxPromise<string[]>)
    {
        this.config = config;
        this.hugoGeneSymbol = hugoGeneSymbol;
        this.mutationGeneticProfileId = mutationGeneticProfileId;
        this.sampleIds = sampleIds;
        this.clinicalDataForSamples = clinicalDataForSamples;
        this.studiesForSamplesWithoutCancerTypeClinicalData = studiesForSamplesWithoutCancerTypeClinicalData;
        this.samplesWithoutCancerTypeClinicalData = samplesWithoutCancerTypeClinicalData;
        this.sampleListId = sampleListId;
        this.patientIds = patientIds;
        this.mskImpactGermlineConsentedPatientIds = mskImpactGermlineConsentedPatientIds;

        labelMobxPromises(this);
    }

    @observable protected sampleListId: string|null = null;
    @observable protected hugoGeneSymbol: string;

    protected config: IMutationMapperConfig;

    mutationGeneticProfileId: MobxPromise<string>;
    clinicalDataForSamples: MobxPromise<ClinicalData[]>;
    studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<CancerStudy[]>;
    samplesWithoutCancerTypeClinicalData: MobxPromise<Sample[]>;
    sampleIds: MobxPromise<string[]>;
    patientIds: MobxPromise<string[]>;
    mskImpactGermlineConsentedPatientIds: MobxPromise<string[]>;

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

    readonly mutationData = remoteData({
        await: () => [
            this.gene,
            this.dataQueryFilter
        ],
        invoke: async () => {
            if (this.gene.result)
            {
                const mutationFilter = {
                    ...this.dataQueryFilter.result,
                    entrezGeneIds: [this.gene.result.entrezGeneId]
                } as MutationFilter;

                return fetchMutationData(mutationFilter, this.mutationGeneticProfileId.result);
            }
            else {
                return [];
            }
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
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData
        ],
        invoke: async () => fetchOncoKbData(this.sampleIdToTumorType, this.mutationData),
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
            this.mutationData,
            this.clinicalDataForSamples
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

    readonly dataQueryFilter = remoteData({
        await: () => [
            this.sampleIds
        ],
        invoke: async () => generateDataQueryFilter(this.sampleListId, this.sampleIds.result)
    });

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

    @computed get sampleIdToTumorType(): {[sampleId: string]: string} {
        return generateSampleIdToTumorTypeMap(this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.samplesWithoutCancerTypeClinicalData);
    }

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
