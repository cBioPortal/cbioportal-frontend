import {PfamDomainRange} from "./Pfam";

export type EnsemblTranscript = {
    transcriptId: string;
    proteinLength: number;
    pfamDomains: PfamDomainRange[];
};
