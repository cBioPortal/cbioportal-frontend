import * as _ from "lodash";
import {computed, observable} from "mobx";
import MobxPromise, {cached, labelMobxPromises} from "mobxpromise";

import {
    DataFilter,
    defaultHotspotFilter,
    DefaultMutationMapperDataFetcher,
    DefaultMutationMapperStore,
    defaultOncoKbFilter,
    getMutationsToTranscriptId,
    groupOncoKbIndicatorDataByMutations,
    IHotspotIndex,
    isHotspot
} from "react-mutation-mapper";

import {Gene, Mutation} from "shared/api/generated/CBioPortalAPI";
import {IOncoKbData} from "shared/model/OncoKB";
import ResidueMappingCache from "shared/cache/ResidueMappingCache";
import {remoteData} from "public-lib/api/remoteData";
import {
    fetchPdbAlignmentData, indexPdbAlignmentData
} from "shared/lib/StoreUtils";
import {
    EnsemblTranscript,
    VariantAnnotation,
    GenomicLocation,
    TranscriptConsequence
} from "shared/api/generated/GenomeNexusAPI";
import {CancerGene} from "shared/api/generated/OncoKbAPI";
import {IPdbChain, PdbAlignmentIndex} from "shared/model/Pdb";
import {calcPdbIdNumericalValue, mergeIndexedPdbAlignments, PDB_IGNORELIST} from "shared/lib/PdbUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";

import PdbChainDataStore from "./PdbChainDataStore";
import MutationMapperDataStore from "./MutationMapperDataStore";
import {
    uniqueGenomicLocations,
    genomicLocationString,
    groupMutationsByProteinStartPos,
    countUniqueMutations
} from "shared/lib/MutationUtils";
import {defaultOncoKbIndicatorFilter} from "shared/lib/OncoKbUtils";

import {IMutationMapperConfig} from "./MutationMapper";
import autobind from "autobind-decorator";

export interface IMutationMapperStoreConfig {
    filterMutationsBySelectedTranscript?:boolean
}

export default class MutationMapperStore extends DefaultMutationMapperStore
{
    @observable public activeTranscript: string | undefined = undefined;

    constructor(
        protected mutationMapperConfig: IMutationMapperConfig,
        protected mutationMapperStoreConfig: IMutationMapperStoreConfig,
        public gene: Gene,
        protected getMutations: () => Mutation[],
        // TODO: we could merge indexedVariantAnnotations and indexedHotspotData
        public indexedHotspotData:MobxPromise<IHotspotIndex|undefined>,
        public indexedVariantAnnotations:MobxPromise<{[genomicLocation: string]: VariantAnnotation}|undefined>,
        public oncoKbCancerGenes:MobxPromise<CancerGene[] | Error>,
        public oncoKbData:MobxPromise<IOncoKbData | Error>,
        public uniqueSampleKeyToTumorType:{[uniqueSampleKey:string]:string},
    )
    {
        super(
            gene,
            {
                isoformOverrideSource: mutationMapperConfig.isoformOverrideSource,
                filterMutationsBySelectedTranscript: mutationMapperStoreConfig.filterMutationsBySelectedTranscript
            },
            getMutations);
        labelMobxPromises(this);
    }

    @computed
    public get dataFetcher(): DefaultMutationMapperDataFetcher {
        return new DefaultMutationMapperDataFetcher({
            myGeneUrlTemplate: this.mutationMapperConfig.mygene_info_url || undefined,
            uniprotIdUrlTemplate: this.mutationMapperConfig.uniprot_id_url || undefined,
            genomeNexusUrl: this.mutationMapperConfig.genomenexus_url || undefined,
            oncoKbUrl: this.mutationMapperConfig.oncokb_public_api_url || undefined
        });
    }

    public get mutations(): Mutation[] {
        const canonicalTranscriptId = this.canonicalTranscript.result &&
            this.canonicalTranscript.result.transcriptId;

        if (this.canonicalTranscript.isPending || (this.mutationMapperStoreConfig.filterMutationsBySelectedTranscript && (this.transcriptsWithAnnotations.isPending || this.indexedVariantAnnotations.isPending))) {
            return [];
        } else {
            if (this.mutationMapperStoreConfig.filterMutationsBySelectedTranscript) {
                // pick default transcript if not activeTranscript
                if (this.activeTranscript === undefined) {
                    if (this.transcriptsWithAnnotations.result && this.transcriptsWithAnnotations.result.length > 0 && canonicalTranscriptId && !this.transcriptsWithAnnotations.result.includes(canonicalTranscriptId)) {
                        // if there are annotated transcripts and activeTranscipt does
                        // not have any, change the active transcript
                        this.activeTranscript = this.transcriptsWithAnnotations.result[0];
                    } else {
                        this.activeTranscript = canonicalTranscriptId;
                    }
                }
                if (this.activeTranscript && this.indexedVariantAnnotations.result && !_.isEmpty(this.indexedVariantAnnotations.result)) {
                    return getMutationsToTranscriptId(this.getMutations(), this.activeTranscript, this.indexedVariantAnnotations.result) as Mutation[];
                } else {
                    // this shouldn't happen unless error occurs with annotation
                    // TODO: handle error in annotation more gracefully instead
                    // of just showing all mutations
                    return this.getMutations();
                }
            } else {
                try {
                    if (this.activeTranscript === undefined) {
                        this.activeTranscript = canonicalTranscriptId;
                    }
                } catch (ex) {}
                return this.getMutations();
            }
        }
    }

    readonly mutationData = remoteData({
        await: () => {
            if (this.mutationMapperStoreConfig.filterMutationsBySelectedTranscript) {
                return [this.canonicalTranscript, this.indexedVariantAnnotations];
            } else {
                return [this.canonicalTranscript];
            }
        },
        invoke: async () => {
            return this.mutations;
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

    readonly transcriptsWithAnnotations = remoteData<string[] | undefined>({
        await: () => [
            this.indexedVariantAnnotations,
            this.allTranscripts,
            this.transcriptsWithProteinLength
        ],
        invoke: async()=>{
            if (this.indexedVariantAnnotations.result && this.allTranscripts.result && this.transcriptsWithProteinLength.result && this.transcriptsWithProteinLength.result.length > 0) {
                // ignore transcripts without protein length
                // TODO: better solution is to show only mutations table, not lollipop plot for those transcripts
                const transcripts:string[] = _.uniq([].concat.apply([], uniqueGenomicLocations(this.getMutations()).map(
                    (gl:GenomicLocation) => {
                        if (this.indexedVariantAnnotations.result && this.indexedVariantAnnotations.result[genomicLocationString(gl)]) {
                            return this.indexedVariantAnnotations.result[genomicLocationString(gl)].transcript_consequences.map(
                                (tc:TranscriptConsequence) => tc.transcript_id
                            ).filter(
                                (transcriptId: string) => this.transcriptsWithProteinLength.result!!.includes(transcriptId)
                            );
                        } else {
                            return [];
                        }
                })));
                // makes sure the annotations are actually of the form we are
                // displaying (e.g. nonsynonymous)
                return transcripts.filter((t:string) => (
                    getMutationsToTranscriptId(this.getMutations(),
                                            t,
                                            this.indexedVariantAnnotations.result!!).length > 0
                ));
            } else {
                return [];
            }
        },
        onError: (err: Error) => {
            throw new Error("Failed to get transcriptsWithAnnotations");
        }
    }, undefined);

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

    @computed get unfilteredMutationsByPosition(): {[pos: number]: Mutation[]} {
        return groupMutationsByProteinStartPos(this.dataStore.sortedData);
    }

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