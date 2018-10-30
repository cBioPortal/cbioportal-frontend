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
import { uniqueGenomicLocations, genomicLocationString } from "shared/lib/MutationUtils";
import { getMutationsToTranscriptId } from "shared/lib/MutationAnnotator";
import Mutations from "pages/resultsView/mutation/Mutations";
import {IServerConfig} from "../../../config/IAppConfig";


export interface IMutationMapperStoreConfig {
    filterMutationsBySelectedTranscript?:boolean
}

export default class MutationMapperStore
{
    @observable public activeTranscript: string | undefined = undefined;

    constructor(
        protected config: IServerConfig,
        protected mutationMapperStoreConfig:IMutationMapperStoreConfig,
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
                    return getMutationsToTranscriptId(this.getMutations(), this.activeTranscript, this.indexedVariantAnnotations.result);
                } else {
                    // this shouldn't happen unless error occurs with annotation
                    // TODO: handle error in annotation more gracefully instead
                    // of just showing all mutations
                    return this.getMutations();
                }
            } else {
                if (this.activeTranscript === undefined) {
                    this.activeTranscript = canonicalTranscriptId;
                }
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
        await: ()=> [
                this.canonicalTranscript,
                this.transcriptsWithProteinLength
        ],
        invoke: async()=>{
            if (this.canonicalTranscript.result && this.canonicalTranscript.result.pfamDomains && this.canonicalTranscript.result.pfamDomains.length > 0) {
                let domainRanges = this.canonicalTranscript.result.pfamDomains;
                if (this.mutationMapperStoreConfig.filterMutationsBySelectedTranscript && this.transcriptsWithProteinLength.result && this.transcriptsWithProteinLength.result.length > 0) {
                    // add domain ranges for all transcripts to this call
                    domainRanges = [].concat.apply([domainRanges], _.compact(this.transcriptsWithProteinLength.result.map((transcriptId:string) => this.transcriptsByTranscriptId[transcriptId].pfamDomains)));
                }
                return fetchPfamDomainData(domainRanges.map((x: PfamDomainRange) => x.pfamDomainId));
            } else {
                return undefined;
            }
        }
    }, undefined);

    readonly transcriptsByHugoSymbol = remoteData<EnsemblTranscript[] | undefined>({
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
            this.transcriptsByHugoSymbol
        ],
        invoke: async()=>{
            if (this.gene) {
                return fetchCanonicalTranscriptWithFallback(this.gene.hugoGeneSymbol, this.isoformOverrideSource, this.transcriptsByHugoSymbol.result);
            } else {
                return undefined;
            }
        },
        onError: (err: Error) => {
            throw new Error("Failed to get canonical transcript");
        }
    }, undefined);

    readonly allTranscripts = remoteData<EnsemblTranscript[] | undefined>({
        await: () => [
            this.transcriptsByHugoSymbol,
            this.canonicalTranscript
        ],
        invoke: async()=> {
            return _.compact(_.unionBy(
                this.transcriptsByHugoSymbol.result,
                [this.canonicalTranscript.result],
                (t) => t && t.transcriptId
            ));
        },
        onError: (err: Error) => {
            throw new Error("Failed to get all transcripts");
        }
    }, undefined);

    readonly transcriptsWithAnnotations = remoteData<string[] | undefined>({
        await: () => [
            this.indexedVariantAnnotations,
            this.allTranscripts,
            this.transcriptsWithProteinLength
        ],
        invoke: async()=>{
            if (this.indexedVariantAnnotations.result && this.allTranscripts.result && this.transcriptsWithProteinLength.result && this.transcriptsWithProteinLength.result.length > 0) {
                // ignore transcripts without protein length
                // TODO: better solution is to show only mutations table, not
                // lollipop plot for those transcripts
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

    readonly transcriptsWithProteinLength = remoteData<string[] | undefined>({
        await: () => [
            this.allTranscripts,
            this.canonicalTranscript
        ],
        invoke: async()=>{
            if (this.allTranscripts.result && this.canonicalTranscript.result) {
                // ignore transcripts without protein length
                // TODO: better solution is to show only mutations table, not
                // lollipop plot for those transcripts
                return _.compact(this.allTranscripts.result.map((et: EnsemblTranscript) => et.proteinLength && et.transcriptId));
            } else {
                return [];
            }
        },
        onError: (err: Error) => {
            throw new Error("Failed to get transcriptsWithProteinLength");
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

    @computed get transcriptsByTranscriptId(): {[transcriptId:string]: EnsemblTranscript} {
        return _.keyBy(this.allTranscripts.result, ((transcript: EnsemblTranscript) => transcript.transcriptId));
    }

    @computed get mutationsByTranscriptId(): {[transcriptId:string]: Mutations[]} {
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