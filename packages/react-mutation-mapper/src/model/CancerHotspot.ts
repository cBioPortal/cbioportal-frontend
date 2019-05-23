export type AggregatedHotspots = {
    genomicLocation: GenomicLocation;
    hotspots: Hotspot[];
};

export type GenomicLocation = {
    chromosome: string;
    start: number;
    end: number;
    referenceAllele: string;
    variantAllele: string;
};

export type Hotspot = {
    hugoSymbol: string;
    inframeCount: number;
    missenseCount: number;
    residue: string;
    spliceCount: number;
    transcriptId: string;
    truncatingCount: number;
    tumorCount: number;
    type: string;
    proteinPosStart?: number;
    proteinPosEnd?: number;
};

export interface IHotspotIndex {
    [genomicLocation: string]: AggregatedHotspots;
}
