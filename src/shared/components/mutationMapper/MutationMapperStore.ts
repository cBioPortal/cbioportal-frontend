import * as _ from "lodash";
import {computed} from "mobx";
import MobxPromise, {cached, labelMobxPromises} from "mobxpromise";

import {Gene, Mutation} from "shared/api/generated/CBioPortalAPI";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import ResidueMappingCache from "shared/cache/ResidueMappingCache";
import {remoteData} from "shared/api/remoteData";
import {
    fetchPdbAlignmentData, fetchSwissProtAccession, fetchUniprotId, indexPdbAlignmentData,
    fetchPfamDomainData, fetchCanonicalTranscriptWithFallback,
    fetchEnsemblTranscriptsByEnsemblFilter
} from "shared/lib/StoreUtils";
import {EnsemblTranscript, PfamDomain, PfamDomainRange} from "shared/api/generated/GenomeNexusAPI";
import {IPdbChain, PdbAlignmentIndex} from "shared/model/Pdb";
import {calcPdbIdNumericalValue, mergeIndexedPdbAlignments} from "shared/lib/PdbUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";

import PdbChainDataStore from "./PdbChainDataStore";
import MutationMapperDataStore from "./MutationMapperDataStore";
import {IMutationMapperConfig} from "./MutationMapper";

export default class MutationMapperStore
{
    constructor(
        protected config: IMutationMapperConfig,
        public gene:Gene,
        public mutations:Mutation[],
        public indexedHotspotData:MobxPromise<IHotspotIndex|undefined>,
        public oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
        public oncoKbData:IOncoKbDataWrapper,
        public uniqueSampleKeyToTumorType:{[uniqueSampleKey:string]:string},
        protected genomeNexusEnrichmentCache: () => GenomeNexusEnrichmentCache,
    )
    {
        labelMobxPromises(this);
    }

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
        return new MutationTableDownloadDataFetcher(this.mutationData, this.genomeNexusEnrichmentCache);
    }

    @cached get pdbChainDataStore(): PdbChainDataStore {
        // initialize with sorted merged alignment data
        return new PdbChainDataStore(this.sortedMergedAlignmentData);
    }

    @cached get residueMappingCache()
    {
        return new ResidueMappingCache();
    }
}