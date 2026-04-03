export interface Exon {
    number: number;
    start: number;
    end: number;
    ensemblId?: string;
}

export interface ProteinDomain {
    name: string;
    pfamId: string;
    startGenomic: number;
    endGenomic: number;
    startAA: number;
    endAA: number;
    source: string;
}

export interface TranscriptData {
    transcriptId: string;
    displayName: string;
    gene: string;
    biotype: string;
    exons: Exon[];
    strand: '+' | '-';
    txStart: number;
    txEnd: number;
    isForteSelected: boolean;
    proteinLength?: number;
    domains: ProteinDomain[];
}

export interface GenePartner {
    symbol: string;
    chromosome: string;
    position: number;
    strand: '+' | '-';
    selectedTranscriptId: string;
    siteDescription: string;
}

export interface FusionEvent {
    id: string;
    tumorId: string;
    gene1: GenePartner;
    gene2: GenePartner | null;
    fusion: string;
    totalReadSupport: number;
    callMethod: string;
    frameCallMethod: string;
    annotation: string;
    position: string;
    significance: string;
    note: string;
}

export const COLOR_5PRIME = '#5A73B3';
export const COLOR_3PRIME = '#60187D';
export const COLOR_BREAKPOINT = '#FF6B6B';
