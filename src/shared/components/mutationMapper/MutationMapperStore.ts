import * as _ from "lodash";
import {computed} from "mobx";
import MobxPromise, {cached, labelMobxPromises} from "mobxpromise";

import {
    DataFilter, defaultHotspotFilter,
    DefaultMutationMapperDataFetcher,
    DefaultMutationMapperStore, defaultOncoKbFilter,
    getMutationsToTranscriptId,
    groupOncoKbIndicatorDataByMutations,
    IHotspotIndex, isHotspot
} from "react-mutation-mapper";

import genomeNexusClient from "shared/api/genomeNexusClientInstance";
import internalGenomeNexusClient from "shared/api/genomeNexusInternalClientInstance";
import oncoKBClient from "shared/api/oncokbClientInstance";
import {Gene, Mutation} from "shared/api/generated/CBioPortalAPI";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {ICivicGene, ICivicVariant} from "shared/model/Civic";
import {ITrialMatchGene, ITrialMatchVariant} from "shared/model/TrialMatch";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import ResidueMappingCache from "shared/cache/ResidueMappingCache";
import {remoteData} from "public-lib/api/remoteData";
import {
    fetchCosmicData, fetchOncoKbData,
    fetchMutationData, generateUniqueSampleKeyToTumorTypeMap, generateDataQueryFilter,
    ONCOKB_DEFAULT, fetchSwissProtAccession, fetchUniprotId, indexPdbAlignmentData,
    fetchPfamDomainData, fetchCivicGenes, fetchCivicVariants, fetchTrialMatchGenes, fetchTrialMatchVariants,
    IDataQueryFilter, fetchCanonicalTranscriptWithFallback, fetchEnsemblTranscriptsByEnsemblFilter,
    fetchPdbAlignmentData
} from "shared/lib/StoreUtils";
import {
    EnsemblTranscript,
    VariantAnnotation
} from "public-lib/api/generated/GenomeNexusAPI";
import {CancerGene} from "public-lib/api/generated/OncoKbAPI";
import {IPdbChain, PdbAlignmentIndex} from "shared/model/Pdb";
import {calcPdbIdNumericalValue, mergeIndexedPdbAlignments, PDB_IGNORELIST} from "shared/lib/PdbUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";

import PdbChainDataStore from "./PdbChainDataStore";
import MutationMapperDataStore from "./MutationMapperDataStore";
import {
    groupMutationsByProteinStartPos,
    countUniqueMutations
} from "shared/lib/MutationUtils";
import {defaultOncoKbIndicatorFilter} from "shared/lib/OncoKbUtils";

import {IMutationMapperConfig} from "./MutationMapper";
import autobind from "autobind-decorator";
import {normalizeMutation, normalizeMutations} from "./MutationMapperUtils";

export interface IMutationMapperStoreConfig {
    filterMutationsBySelectedTranscript?:boolean
}


export default class MutationMapperStore
{
    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: () => fetchCosmicData(this.mutationData)
    });

    readonly mutationData = remoteData({
        await: () => {
            if (this.mutationMapperStoreConfig.filterMutationsBySelectedTranscript) {
                return [this.canonicalTranscript, this.indexedVariantAnnotations];
            } else {
                return [this.canonicalTranscript];
            }
        },
        invoke: async () => {
            return this.mutations as Mutation[];
        }
    }, []);

    readonly alignmentData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: async () => {
            if (this.activeTranscript) {
                return fetchPdbAlignmentData(this.activeTranscript);
            }
            else {
                return [];
            }
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, []);

    public countUniqueMutations(mutations: Mutation[]): number
    {
        return countUniqueMutations(mutations);
    }

    @autobind
    protected getDefaultTumorType(mutation: Mutation): string {
        return this.uniqueSampleKeyToTumorType[mutation.uniqueSampleKey];
    }

    @autobind
    protected getDefaultEntrezGeneId(mutation: Mutation): number {
        return mutation.gene.entrezGeneId;
    }

    @autobind
    protected customFilterApplier(filter: DataFilter,
                                  mutation: Mutation,
                                  positions: {[position: string]: {position: number}})
    {

        mutation = normalizeMutation(mutation);

        let pick = false;

        if (filter.position) {
            pick = !!positions[mutation.proteinPosStart+""];
        }

        if (pick &&
            filter.hotspot &&
            this.indexedHotspotData.result)
        {
            // TODO for now ignoring the actual filter value and treating as a boolean
            pick = isHotspot(mutation, this.indexedHotspotData.result, defaultHotspotFilter);
        }

        if (pick &&
            filter.oncokb &&
            this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error))
        {
            // TODO for now ignoring the actual filter value and treating as a boolean
            pick = defaultOncoKbFilter(mutation,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId);
        }

        return pick;
    }

    // TODO remove when done refactoring react-mutation-mapper
    @computed get unfilteredMutationsByPosition(): {[pos: number]: Mutation[]} {
        return groupMutationsByProteinStartPos(this.dataStore.sortedData);
    }

    // TODO remove when done refactoring react-mutation-mapper
    @computed get oncoKbDataByProteinPosStart()
    {
        if (this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error))
        {
            return groupOncoKbIndicatorDataByMutations(
                this.unfilteredMutationsByPosition,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                defaultOncoKbIndicatorFilter);
        }
        else {
            return {};
        }
    readonly civicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.mutationData
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


    readonly trialMatchGenes = remoteData<ITrialMatchGene | undefined>({
        await: () => [
            this.mutationData
        ],
        invoke: async() => this.config.showCivic? fetchTrialMatchGenes(this.mutationData) : {},
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

    readonly trialMatchVariants = remoteData<ITrialMatchVariant | undefined>({
        await: () => [
            this.trialMatchGenes,
            this.mutationData
        ],
        invoke: async() => {
            if (this.config.showCivic && this.trialMatchGenes.result) {
                return fetchTrialMatchVariants(this.trialMatchGenes.result as ITrialMatchGene, this.mutationData);
            }
            else {
                return {};
            }
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

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

    @computed get isoformOverrideSource(): string {
        return this.config.isoformOverrideSource || "uniprot";
    }

    @computed get processedMutationData(): Mutation[][] {
        // just convert Mutation[] to Mutation[][]
        return (this.mutationData.result || []).map(mutation => [mutation]);
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

    @computed get transcriptsByTranscriptId(): {[transcriptId:string]: EnsemblTranscript} {
        return _.keyBy(this.allTranscripts.result as EnsemblTranscript[], (transcript  => transcript.transcriptId));
    }

    @computed get mutationsByTranscriptId(): {[transcriptId:string]: Mutation[]} {
        if (this.indexedVariantAnnotations.result && this.transcriptsWithAnnotations.result) {
            return _.fromPairs(
                this.transcriptsWithAnnotations.result.map((t:string) => (
                    [t,
                    getMutationsToTranscriptId(this.getMutations(),
                                               t,
                                               this.indexedVariantAnnotations.result!!)
                    ]
                ))
            );
        } else {
            return {};
        }
    }

    @computed get numberOfMutationsTotal(): number {
        // number of mutations regardless of transcript
        return this.getMutations().length;
    }

    @cached get dataStore(): MutationMapperDataStore {
        return new MutationMapperDataStore(this.processedMutationData, this.customFilterApplier);
    }

    @cached get downloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(this.mutationData);
    }

    @cached get pdbChainDataStore(): PdbChainDataStore {
        // initialize with sorted merged alignment data
        return new PdbChainDataStore(this.sortedMergedAlignmentData.filter(
            // TODO temporary workaround for problematic pdb structures
            chain => !PDB_IGNORELIST.includes(chain.pdbId.toLowerCase())));
    }

    @cached get residueMappingCache()
    {
        return new ResidueMappingCache();
    }
}
