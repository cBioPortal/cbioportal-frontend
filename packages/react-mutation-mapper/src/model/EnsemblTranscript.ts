import { PfamDomainRange } from './Pfam';

export type EnsemblTranscript = {
    transcriptId: string;
    proteinLength: number;
    refseqMrnaId: string;
    ccdsId: string;
    pfamDomains: PfamDomainRange[];
};
