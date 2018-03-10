import * as _ from "lodash";
import {
    Mutation, MutationFilter, Gene, ClinicalData, CancerStudy, Sample, MolecularProfile, SampleIdentifier
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable} from "mobx";
import {remoteData} from "shared/api/remoteData";
import {labelMobxPromises, MobxPromise, cached} from "mobxpromise";
import {IOncoKbData, IOncoKbDataWrapper} from "shared/model/OncoKB";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {IPdbChain, PdbAlignmentIndex} from "shared/model/Pdb";
import {ICivicGene, ICivicVariant} from "shared/model/Civic";
import PdbPositionMappingCache from "shared/cache/PdbPositionMappingCache";
import ResidueMappingCache from "shared/cache/ResidueMappingCache";
import {calcPdbIdNumericalValue, mergeIndexedPdbAlignments} from "shared/lib/PdbUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {
    fetchCosmicData, fetchOncoKbData,
    fetchMutationData, generateUniqueSampleKeyToTumorTypeMap, generateDataQueryFilter,
    ONCOKB_DEFAULT, fetchPdbAlignmentData, fetchSwissProtAccession, fetchUniprotId, indexPdbAlignmentData,
    fetchPfamDomainData, fetchCivicGenes, fetchCivicVariants, IDataQueryFilter, fetchCanonicalTranscriptWithFallback,
    fetchEnsemblTranscriptsByEnsemblFilter
} from "shared/lib/StoreUtils";
import MutationMapperDataStore from "./MutationMapperDataStore";
import PdbChainDataStore from "./PdbChainDataStore";
import {IMutationMapperConfig} from "./MutationMapper";
import MutationDataCache from "shared/cache/MutationDataCache";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import MutationCountCache from "shared/cache/MutationCountCache";
import {EnsemblTranscript, PfamDomain, PfamDomainRange} from "shared/api/generated/GenomeNexusAPI";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";

export class MutationMapperStore {

    constructor(protected config: IMutationMapperConfig,
                public gene:Gene,
                public samples:MobxPromise<SampleIdentifier[]>,
                public oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                // getMutationDataCache needs to be a getter for the following reason:
                // when the input parameters to the mutationDataCache change, the cache
                // is recomputed. Mobx needs to respond to this. But if we pass the mutationDataCache
                // in as a value, then when using it we don't access the observable property mutationDataCache,
                // so that when it changes we won't react. Thus we need to access it as store.mutationDataCache
                // (which will be done in the getter thats passed in here) so that the cache itself is observable
                // and we will react when it changes to a new object.
                public mutations:Mutation[],
                private getMutationDataCache: ()=>MutationDataCache,
                private genomeNexusEnrichmentCache: ()=>GenomeNexusEnrichmentCache,
                private getMutationCountCache: ()=>MutationCountCache,
                public studyIdToStudy:MobxPromise<{[studyId:string]:CancerStudy}>,
                public molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
                public clinicalDataForSamples: MobxPromise<ClinicalData[]>,
                public studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<CancerStudy[]>,
                private samplesWithoutCancerTypeClinicalData: MobxPromise<Sample[]>,
                public germlineConsentedSamples:MobxPromise<SampleIdentifier[]>,
                public indexedHotspotData:MobxPromise<IHotspotIndex|undefined>,
                public uniqueSampleKeyToTumorType:{[uniqueSampleKey:string]:string},
                public oncoKbData:IOncoKbDataWrapper
    )
    {
        labelMobxPromises(this);
    }

    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: () => fetchCosmicData(this.mutationData)
    });

    readonly mutationData = remoteData({
        invoke: async () => {
            return this.mutations;
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
        invoke: async() => {
            // do not try fetching swissprot data for invalid entrez gene ids,
            // just return the default value
            if (this.gene.entrezGeneId < 1) {
                return "";
            }

            const accession:string|string[] = await fetchSwissProtAccession(this.gene.entrezGeneId);

            if (_.isArray(accession)) {
                return accession[0];
            }
            else {
                return accession;
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

    readonly pfamDomainData = remoteData<PfamDomain[] | undefined>({
        await: ()=>[
            this.canonicalTranscript
        ],
        invoke: async()=>{
            if (this.canonicalTranscript.result && this.canonicalTranscript.result.pfamDomains && this.canonicalTranscript.result.pfamDomains.length > 0) {
                return fetchPfamDomainData(this.canonicalTranscript.result.pfamDomains.map((x: PfamDomainRange) => x.pfamDomainId));
            } else {
                return undefined;
            }
        }
    }, undefined);

    readonly allTranscripts = remoteData<EnsemblTranscript[] | undefined>({
        invoke: async()=>{
            if (this.gene) {
                return fetchEnsemblTranscriptsByEnsemblFilter({"hugoSymbols":[this.gene.hugoGeneSymbol]});
            } else {
                return undefined;
            }
        },
        onError: (err: Error) => {
            throw new Error("Failed to fetch all transcripts");
        }
    }, undefined);

    readonly canonicalTranscript = remoteData<EnsemblTranscript | undefined>({
        await: () => [
            this.allTranscripts
        ],
        invoke: async()=>{
            if (this.gene) {
                return fetchCanonicalTranscriptWithFallback(this.gene.hugoGeneSymbol, this.isoformOverrideSource, this.allTranscripts.result);
            } else {
                return undefined;
            }
        },
        onError: (err: Error) => {
            throw new Error("Failed to get canonical transcript");
        }
    }, undefined);

    readonly civicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.mutationData,
            this.clinicalDataForSamples
        ],
        invoke: async() => this.config.showCivic ? fetchCivicGenes(this.mutationData) : {},
        onError: (err: Error) => {
            // fail silently
        }
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
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

    @computed get isoformOverrideSource(): string {
        return this.config.isoformOverrideSource || "uniprot";
    }

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

    @cached get dataStore():MutationMapperDataStore {
        return new MutationMapperDataStore(this.processedMutationData);
    }

    @cached get downloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(this.mutationData, this.genomeNexusEnrichmentCache, this.getMutationCountCache);
    }

    @cached get pdbChainDataStore(): PdbChainDataStore {
        // initialize with sorted merged alignment data
        return new PdbChainDataStore(this.sortedMergedAlignmentData);
    }

    @cached get pdbPositionMappingCache()
    {
        return new PdbPositionMappingCache();
    }

    @cached get residueMappingCache()
    {
        return new ResidueMappingCache();
    }
}
