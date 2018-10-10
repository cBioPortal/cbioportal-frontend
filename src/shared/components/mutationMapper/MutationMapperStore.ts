import * as _ from "lodash";
import {computed, observable} from "mobx";
import MobxPromise, {cached, labelMobxPromises} from "mobxpromise";

import {Gene, Mutation} from "shared/api/generated/CBioPortalAPI";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import ResidueMappingCache from "shared/cache/ResidueMappingCache";
import {remoteData} from "shared/api/remoteData";
import {
    fetchPdbAlignmentData, fetchSwissProtAccession, fetchUniprotId, indexPdbAlignmentData,
    fetchPfamDomainData, fetchCanonicalTranscriptWithFallback,
    fetchEnsemblTranscriptsByEnsemblFilter
} from "shared/lib/StoreUtils";
import {EnsemblTranscript, PfamDomain, PfamDomainRange, VariantAnnotation, GenomicLocation, TranscriptConsequence} from "shared/api/generated/GenomeNexusAPI";
import {IPdbChain, PdbAlignmentIndex} from "shared/model/Pdb";
import {calcPdbIdNumericalValue, mergeIndexedPdbAlignments} from "shared/lib/PdbUtils";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";

import PdbChainDataStore from "./PdbChainDataStore";
import MutationMapperDataStore from "./MutationMapperDataStore";
import {IMutationMapperConfig} from "./MutationMapper";
import { uniqueGenomicLocations, genomicLocationString } from "shared/lib/MutationUtils";
import { getMutationsToTranscriptId } from "shared/lib/MutationAnnotator";
import Mutations from "pages/resultsView/mutation/Mutations";

export default class MutationMapperStore
{
    @observable public activeTranscript: string | undefined = undefined;

    constructor(
        protected config: IMutationMapperConfig,
        public gene:Gene,
        private getMutations:()=>Mutation[],
        // TODO: we could merge indexedVariantAnnotations and indexedHotspotData
        public indexedHotspotData:MobxPromise<IHotspotIndex|undefined>,
        public indexedVariantAnnotations:MobxPromise<{[genomicLocation: string]: VariantAnnotation}|undefined>,
        public oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
        public oncoKbData:IOncoKbDataWrapper,
        public uniqueSampleKeyToTumorType:{[uniqueSampleKey:string]:string},
    )
    {
        labelMobxPromises(this);
    }


    public get mutations() {
        const canonicalTranscriptId = this.canonicalTranscript.result &&
            this.canonicalTranscript.result.transcriptId;
        
        if (canonicalTranscriptId && this.activeTranscript === undefined) {
            this.activeTranscript = canonicalTranscriptId;
        }

        if (this.config.filterMutationsBySelectedTranscript && this.indexedVariantAnnotations.result && !_.isEmpty(this.indexedVariantAnnotations.result) && this.activeTranscript) {
            if (this.transcriptsWithAnnotations && this.transcriptsWithAnnotations.length > 0 && !this.transcriptsWithAnnotations.includes(this.activeTranscript)) {
                // if there are annotated transcripts and activeTranscipt does
                // not have any, change the active transcript
                this.activeTranscript = this.transcriptsWithAnnotations[0];
            }
            return getMutationsToTranscriptId(this.getMutations(), this.activeTranscript, this.indexedVariantAnnotations.result);
        } else {
            return this.getMutations();
        }
    }


    readonly mutationData = remoteData({
        await: () => [
            this.canonicalTranscript,
            this.indexedVariantAnnotations
        ],
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
            this.canonicalTranscript,
            this.allTranscripts,
            this.indexedVariantAnnotations,
        ],
        invoke: async()=>{
            if (this.allTranscripts.result && this.indexedVariantAnnotations.result) {
                const domainRanges = [].concat.apply([], _.compact(this.transcriptsWithProteinLength.map((transcriptId:string) => this.transcriptsByTranscriptId[transcriptId].pfamDomains)));
                return fetchPfamDomainData(domainRanges.map((x: PfamDomainRange) => x.pfamDomainId));
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

    @computed get transcriptsWithAnnotations(): string[] {
        if (this.indexedVariantAnnotations.result && this.allTranscripts.result && this.transcriptsWithProteinLength.length > 0) {
            // ignore transcripts without protein length
            // TODO: better solution is to show only mutations table, not
            // lollipop plot for those transcripts
            let transcripts:string[] = _.uniq([].concat.apply([], (uniqueGenomicLocations(this.getMutations()).map((gl:GenomicLocation) => {
                return this.indexedVariantAnnotations.result && this.indexedVariantAnnotations.result[genomicLocationString(gl)]? this.indexedVariantAnnotations.result[genomicLocationString(gl)].transcript_consequences.map((tc:TranscriptConsequence) => tc.transcript_id).filter((transcriptId: string) => this.transcriptsWithProteinLength.includes(transcriptId)) : [];
            }))));
            // makes sure the annotations are actually of the form we are
            // displaying (e.g. nonsynonymous)
            transcripts = transcripts.filter((t:string) => (
                getMutationsToTranscriptId(this.getMutations(),
                                           t,
                                           this.indexedVariantAnnotations.result!!).length > 0
            ));
            transcripts = _.orderBy(
                transcripts,
                [
                    (t) => t === this.canonicalTranscript.result!!.transcriptId,
                    (t) => this.transcriptsByTranscriptId[t].hasOwnProperty("refseqMrnaId"),
                    (t) => this.transcriptsByTranscriptId[t].proteinLength,
                    (t) => t
                ],
                ['desc','desc','desc','asc']
            );
            return transcripts;
        } else {
            return [];
        }
    }

    @computed get transcriptsWithProteinLength(): string[] {
        if (this.indexedVariantAnnotations.result && this.allTranscripts.result && this.canonicalTranscript.result) {
            // ignore transcripts without protein length
            // TODO: better solution is to show only mutations table, not
            // lollipop plot for those transcripts
            let transcripts:string[] = _.compact(this.allTranscripts.result.map((et: EnsemblTranscript) => et.proteinLength && et.transcriptId));
            transcripts = _.orderBy(
                transcripts,
                [
                    (t) => t === this.canonicalTranscript.result!!.transcriptId,
                    (t) => this.transcriptsByTranscriptId[t].hasOwnProperty("refseqMrnaId"),
                    (t) => this.transcriptsByTranscriptId[t].proteinLength,
                    (t) => t
                ],
                ['desc','desc','desc','asc']
            );
            return transcripts;
        } else {
            return [];
        }
    }

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

    @computed get transcriptsByTranscriptId(): {[transcriptId:string]: EnsemblTranscript} {
        return _.keyBy(this.allTranscripts.result, ((transcript: EnsemblTranscript) => transcript.transcriptId));
    }

    @computed get mutationsByTranscriptId(): {[transcriptId:string]: Mutations[]} {
        if (this.indexedVariantAnnotations.result) {
            return _.fromPairs(this.transcriptsWithAnnotations.map((t:string) => (
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

    @cached get dataStore():MutationMapperDataStore {
        return new MutationMapperDataStore(this.processedMutationData);
    }

    @cached get downloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(this.mutationData);
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