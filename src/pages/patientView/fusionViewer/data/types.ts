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
    utrs: { start: number; end: number; type: 'five_prime' | 'three_prime' }[];
}

export interface GenePartner {
    symbol: string;
    chromosome: string;
    position: number;
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
    /**
     * Direction of the SV breakpoint joining, as reported by the caller.
     * One of '5to3', '3to5', '3to3', '5to5', or '' when missing.
     * Used by the partner-orientation resolver to decide which site is
     * the canonical 5' partner.
     */
    connectionType: string;
}

export const COLOR_5PRIME = '#5A73B3';
export const COLOR_3PRIME = '#60187D';
export const COLOR_BREAKPOINT = '#FF6B6B';

/**
 * A domain projected onto one side of a fusion product, with clipping
 * applied when the breakpoint falls inside the domain's genomic footprint.
 * Produced by selectRetained5PrimeDomains / selectRetained3PrimeDomains.
 */
export interface RetainedDomain {
    domain: ProteinDomain;
    side: '5p' | '3p';
    /** Clipped lower bound in protein AA space (first retained residue). */
    retainedStartAA: number;
    /** Clipped upper bound in protein AA space (last retained residue). */
    retainedEndAA: number;
    /** True when the breakpoint genomic coordinate falls inside the domain. */
    isTruncated: boolean;
    /**
     * Fraction of the full domain retained: (retainedEndAA - retainedStartAA + 1)
     * / (domain.endAA - domain.startAA + 1). Clamped to [0, 1].
     */
    retainedFraction: number;
    /** Start of the cut-away span in AA space (for the ghost stub). */
    lostStartAA: number;
    /** End of the cut-away span in AA space. */
    lostEndAA: number;
}
