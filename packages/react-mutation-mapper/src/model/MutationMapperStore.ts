import {MobxPromise} from "mobxpromise";

import DataStore from "./DataStore";
import {Gene} from "./Gene";
import {EnsemblTranscript} from "./EnsemblTranscript";
import {PfamDomain} from "./Pfam";
import {Mutation} from "./Mutation";

export interface MutationMapperStore {
    gene: Gene;
    dataStore: DataStore;
    uniprotId: MobxPromise<string>;
    activeTranscript?: string;
    mutationAlignerLinks: MobxPromise<{[pfamAccession:string]:string}>;
    pfamDomainData: MobxPromise<PfamDomain[] | undefined>;
    allTranscripts: MobxPromise<EnsemblTranscript[] | undefined>;
    transcriptsByTranscriptId: {[transcriptId: string]: EnsemblTranscript};
    mutationsByPosition: {[pos:number]: Mutation[]};
    uniqueMutationCountsByPosition: {[pos: number]: number};
}

export default MutationMapperStore;
