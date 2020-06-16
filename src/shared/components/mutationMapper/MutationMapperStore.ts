import * as _ from 'lodash';
import { computed } from 'mobx';
import MobxPromise, { cached, labelMobxPromises } from 'mobxpromise';

import {
    applyDataFilters,
    DataFilterType,
    DefaultMutationMapperDataFetcher,
    groupDataByProteinImpactType,
    groupOncoKbIndicatorDataByMutations,
    DefaultMutationMapperStore,
} from 'react-mutation-mapper';

import {
    defaultOncoKbIndicatorFilter,
    IHotspotIndex,
    getMutationsByTranscriptId,
    Mutation as SimpleMutation,
} from 'cbioportal-utils';

import defaultGenomeNexusClient from 'shared/api/genomeNexusClientInstance';
import defaultInternalGenomeNexusClient from 'shared/api/genomeNexusInternalClientInstance';
import oncoKBClient from 'shared/api/oncokbClientInstance';
import { Gene, Mutation } from 'cbioportal-ts-api-client';

import ResidueMappingCache from 'shared/cache/ResidueMappingCache';
import {
    fetchPdbAlignmentData,
    indexPdbAlignmentData,
} from 'shared/lib/StoreUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    EnsemblTranscript,
    VariantAnnotation,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { CancerGene, OncoKBInfo } from 'oncokb-ts-api-client';
import { IPdbChain, PdbAlignmentIndex } from 'shared/model/Pdb';
import {
    calcPdbIdNumericalValue,
    mergeIndexedPdbAlignments,
    PDB_IGNORELIST,
} from 'shared/lib/PdbUtils';
import { lazyMobXTableSort } from 'shared/components/lazyMobXTable/LazyMobXTable';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';

import PdbChainDataStore from './PdbChainDataStore';
import MutationMapperDataStore from './MutationMapperDataStore';
import {
    groupMutationsByProteinStartPos,
    countUniqueMutations,
    indexMutationsByGenomicLocation,
} from 'shared/lib/MutationUtils';

import { IMutationMapperConfig } from './MutationMapperConfig';
import autobind from 'autobind-decorator';
import { normalizeMutation, normalizeMutations } from './MutationMapperUtils';
import { getOncoKbApiUrl } from 'shared/api/urls';
import {
    ONCOKB_DEFAULT_INFO,
    USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
} from 'react-mutation-mapper';

export interface IMutationMapperStoreConfig {
    filterMutationsBySelectedTranscript?: boolean;
}

export default class MutationMapperStore extends DefaultMutationMapperStore {
    constructor(
        protected mutationMapperConfig: IMutationMapperConfig,
        protected mutationMapperStoreConfig: IMutationMapperStoreConfig,
        public gene: Gene,
        protected getMutations: () => Mutation[],
        // TODO: we could merge indexedVariantAnnotations and indexedHotspotData
        public indexedHotspotData: MobxPromise<IHotspotIndex | undefined>,
        public indexedVariantAnnotations: MobxPromise<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        public oncoKbCancerGenes: MobxPromise<CancerGene[] | Error>,
        public uniqueSampleKeyToTumorType: {
            [uniqueSampleKey: string]: string;
        },
        protected genomenexusClient?: GenomeNexusAPI,
        protected genomenexusInternalClient?: GenomeNexusAPIInternal
    ) {
        super(
            gene,
            {
                isoformOverrideSource:
                    mutationMapperConfig.isoformOverrideSource,
                filterMutationsBySelectedTranscript:
                    mutationMapperStoreConfig.filterMutationsBySelectedTranscript,
                enableCivic: mutationMapperConfig.show_civic,
                enableOncoKb: mutationMapperConfig.show_oncokb,
            },
            getMutations
        );

        const unnormalizedGetMutations = this.getMutations;
        this.getMutations = () =>
            normalizeMutations(unnormalizedGetMutations());
        labelMobxPromises(this);
    }

    @computed
    public get dataFetcher(): DefaultMutationMapperDataFetcher {
        return new DefaultMutationMapperDataFetcher(
            {
                myGeneUrlTemplate:
                    this.mutationMapperConfig.mygene_info_url || undefined,
                uniprotIdUrlTemplate:
                    this.mutationMapperConfig.uniprot_id_url || undefined,
                genomeNexusUrl:
                    this.mutationMapperConfig.genomenexus_url || undefined,
                oncoKbUrl: getOncoKbApiUrl() || undefined,
            },
            this.genomenexusClient || defaultGenomeNexusClient,
            this.genomenexusInternalClient || defaultInternalGenomeNexusClient,
            oncoKBClient
        );
    }

    readonly oncoKbInfo: MobxPromise<OncoKBInfo> = remoteData(
        {
            invoke: () => this.dataFetcher.fetchOncoKbInfo(),
            onError: () => ONCOKB_DEFAULT_INFO,
        },
        ONCOKB_DEFAULT_INFO
    );

    @computed get usingPublicOncoKbInstance() {
        return this.oncoKbInfo.result
            ? this.oncoKbInfo.result.publicInstance
            : USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB;
    }

    readonly mutationData = remoteData(
        {
            await: () => {
                if (
                    this.mutationMapperStoreConfig
                        .filterMutationsBySelectedTranscript
                ) {
                    return [
                        this.canonicalTranscript,
                        this.indexedVariantAnnotations,
                    ];
                } else {
                    return [this.canonicalTranscript];
                }
            },
            invoke: async () => {
                return this.mutations as Mutation[];
            },
        },
        []
    );

    readonly alignmentData = remoteData(
        {
            await: () => [this.mutationData, this.activeTranscript],
            invoke: async () => {
                if (this.activeTranscript.result) {
                    return fetchPdbAlignmentData(this.activeTranscript.result);
                } else {
                    return [];
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        []
    );

    public countUniqueMutations(mutations: Mutation[]): number {
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

    // TODO remove when done refactoring react-mutation-mapper
    @computed get unfilteredMutationsByPosition(): {
        [pos: number]: Mutation[];
    } {
        return groupMutationsByProteinStartPos(this.dataStore.sortedData);
    }

    // TODO remove when done refactoring react-mutation-mapper
    @computed get oncoKbDataByProteinPosStart() {
        if (
            this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error)
        ) {
            return groupOncoKbIndicatorDataByMutations(
                this.unfilteredMutationsByPosition,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                defaultOncoKbIndicatorFilter
            );
        } else {
            return {};
        }
    }

    @computed
    protected get mutationsGroupedByProteinImpactType() {
        const filtersWithoutProteinImpactTypeFilter = this.dataStore.dataFilters.filter(
            f => f.type !== DataFilterType.PROTEIN_IMPACT_TYPE
        );

        // apply filters excluding the protein impact type filters
        // this prevents number of unchecked protein impact types from being counted as zero
        let sortedFilteredData = applyDataFilters(
            this.dataStore.allData,
            filtersWithoutProteinImpactTypeFilter,
            this.dataStore.applyFilter
        );

        // also apply lazy mobx table search filter
        sortedFilteredData = sortedFilteredData.filter(m =>
            this.dataStore.applyLazyMobXTableFilter(m)
        );

        return groupDataByProteinImpactType(sortedFilteredData);
    }

    @computed get processedMutationData(): Mutation[][] {
        // just convert Mutation[] to Mutation[][]
        return (this.mutationData.result || []).map(mutation => [mutation]);
    }

    @computed get indexedAnnotatedMutationsByGenomicLocation(): {
        [genomicLocation: string]: Mutation;
    } {
        if (
            this.activeTranscript.result &&
            !_.isEmpty(this.indexedVariantAnnotations.result)
        ) {
            // overwrite mutations with annotated mutations
            return indexMutationsByGenomicLocation(getMutationsByTranscriptId(
                this.mutationData.result,
                this.activeTranscript.result,
                this.indexedVariantAnnotations.result!,
                true
            ) as Mutation[]);
        } else {
            return {};
        }
    }

    @computed get mergedAlignmentData(): IPdbChain[] {
        return mergeIndexedPdbAlignments(this.indexedAlignmentData);
    }

    @computed get indexedAlignmentData(): PdbAlignmentIndex {
        return indexPdbAlignmentData(this.alignmentData);
    }

    @computed get sortedMergedAlignmentData(): IPdbChain[] {
        const sortMetric = (pdbChain: IPdbChain) => [
            pdbChain.identity, // first, sort by identity
            pdbChain.alignment.length, // then by alignment length
            pdbChain.identityPerc, // then by identity percentage
            // current sort metric cannot handle mixed values so generating numerical values for strings
            ...calcPdbIdNumericalValue(pdbChain.pdbId, true), // then by pdb id (A-Z): always returns an array of size 4
            -1 * pdbChain.chain.charCodeAt(0), // then by chain id (A-Z): chain id is always one char
        ];

        return lazyMobXTableSort(this.mergedAlignmentData, sortMetric, false);
    }

    @computed get transcriptsByTranscriptId(): {
        [transcriptId: string]: EnsemblTranscript;
    } {
        return _.keyBy(
            this.allTranscripts.result as EnsemblTranscript[],
            transcript => transcript.transcriptId
        );
    }

    @computed get mutationsByTranscriptId(): {
        [transcriptId: string]: SimpleMutation[];
    } {
        if (
            this.indexedVariantAnnotations.result &&
            this.transcriptsWithAnnotations.result
        ) {
            return _.fromPairs(
                this.transcriptsWithAnnotations.result.map((t: string) => [
                    t,
                    getMutationsByTranscriptId(
                        this.getMutations(),
                        t,
                        this.indexedVariantAnnotations.result!,
                        false
                    ),
                ])
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
        return new MutationMapperDataStore(
            this.processedMutationData,
            this.filterApplier,
            this.config.dataFilters,
            this.config.selectionFilters,
            this.config.highlightFilters,
            this.config.groupFilters
        );
    }

    @cached get downloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(this.mutationData);
    }

    @cached get pdbChainDataStore(): PdbChainDataStore {
        // initialize with sorted merged alignment data
        return new PdbChainDataStore(
            this.sortedMergedAlignmentData.filter(
                // TODO temporary workaround for problematic pdb structures
                chain => !PDB_IGNORELIST.includes(chain.pdbId.toLowerCase())
            )
        );
    }

    @cached get residueMappingCache() {
        return new ResidueMappingCache();
    }
}
