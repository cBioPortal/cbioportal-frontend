// TODO do not use generated models
import {VariantAnnotation} from "../generated/GenomeNexusAPI";

import {Hotspot, IHotspotIndex} from "./CancerHotspot";
import DataStore from "./DataStore";
import {Gene} from "./Gene";
import {EnsemblTranscript} from "./EnsemblTranscript";
import {Mutation} from "./Mutation";
import {CancerGene, IndicatorQueryResp, IOncoKbData} from "./OncoKb";
import {PfamDomain} from "./Pfam";
import {PostTranslationalModification} from "./PostTranslationalModification";
import {RemoteData} from "./RemoteData";
import {SimpleCache} from "./SimpleCache";

export interface MutationMapperStore {
    gene: Gene;
    dataStore: DataStore;
    uniprotId: RemoteData<string | undefined>;
    activeTranscript?: string;
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>,
    mutationAlignerLinks: RemoteData<{[pfamAccession:string]:string} | undefined>;
    mutationData: RemoteData<Mutation[]>;
    pfamDomainData: RemoteData<PfamDomain[] | undefined>;
    allTranscripts: RemoteData<EnsemblTranscript[] | undefined>;
    transcriptsByTranscriptId: {[transcriptId: string]: EnsemblTranscript};
    mutationsByPosition: {[pos:number]: Mutation[]};
    uniqueMutationCountsByPosition: {[pos: number]: number};
    ptmDataByProteinPosStart: RemoteData<{[pos: number]: PostTranslationalModification[]} | undefined>;
    ptmDataByTypeAndProteinPosStart: RemoteData<{[type: string] : {[position: number] : PostTranslationalModification[]}} | undefined>;
    indexedHotspotData: RemoteData<IHotspotIndex | undefined>;
    hotspotsByPosition: {[pos: number]: Hotspot[]};
    oncoKbCancerGenes: RemoteData<CancerGene[] | Error | undefined>;
    oncoKbData: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbDataByPosition: {[pos: number]: IndicatorQueryResp[]};
    oncoKbEvidenceCache?: SimpleCache;
    indexedVariantAnnotations: RemoteData<{[genomicLocation: string]: VariantAnnotation} | undefined>;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    mutationsByTranscriptId: {[transcriptId:string]: Mutation[]};
}

export default MutationMapperStore;
