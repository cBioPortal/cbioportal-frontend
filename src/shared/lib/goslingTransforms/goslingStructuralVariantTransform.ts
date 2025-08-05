/**
 * Data transformation utilities for converting cBioPortal structural variant data to Gosling.js format
 * Transforms StructuralVariant objects into format compatible with genome visualization components
 */
import { StructuralVariant } from 'cbioportal-ts-api-client';

/**
 * Mapping from cBioPortal variant class names to standardized SV type names
 * Used for consistent visualization across different data sources
 */
const SV_TYPE_MAPPING: { [key: string]: string } = {
    DELETION: 'Deletion',
    DUPLICATION: 'Duplication',
    TRANSLOCATION: 'Translocation',
    INVERSION: 'Inversion (TtT)',
    INSERTION: 'Duplication',
};

/**
 * Structural variant data format compatible with genome visualization components
 * Extends cBioPortal data with fields required by Gosling.js
 */
export interface GenomeVisualizationSV {
    /** First breakpoint chromosome */
    chrom1: string;
    /** First breakpoint start position */
    start1: number;
    /** First breakpoint end position */
    end1: number;
    /** Second breakpoint chromosome */
    chrom2: string;
    /** Second breakpoint start position */
    start2: number;
    /** Second breakpoint end position */
    end2: number;
    /** DNA strand orientation at first breakpoint */
    strand1: string;
    /** DNA strand orientation at second breakpoint */
    strand2: string;
    /** Unique identifier for this structural variant */
    sv_id: string;
    /** Standardized structural variant classification */
    svclass: string;
    /** Sample identifier */
    sampleId: string;
    /** Patient identifier */
    patientId: string;
    /** Gene symbol at first breakpoint */
    site1HugoSymbol: string;
    /** Gene symbol at second breakpoint */
    site2HugoSymbol: string;
    /** Original variant classification from cBioPortal */
    variantClass: string;
    /** Additional event information */
    eventInfo: string;
}

/**
 * Transform cBioPortal StructuralVariant array to genome visualization format
 * @param structuralVariants Array of structural variants from cBioPortal API
 * @returns Array of structural variants formatted for genome visualization
 */
export function transformStructuralVariantsForVisualization(
    structuralVariants: StructuralVariant[]
): GenomeVisualizationSV[] {
    return structuralVariants.map((sv, index) => {
        const svId = generateSVId(sv, index);
        const svclass = mapVariantClass(sv.variantClass);
        const { strand1, strand2 } = inferStrandOrientations(sv.breakpointType);
        const end1 = sv.site1Position + 1;
        const end2 = sv.site2Position + 1;

        return {
            chrom1: normalizeChromosomeName(sv.site1Chromosome),
            start1: sv.site1Position,
            end1: end1,
            chrom2: normalizeChromosomeName(sv.site2Chromosome),
            start2: sv.site2Position,
            end2: end2,
            strand1: strand1,
            strand2: strand2,
            sv_id: svId,
            svclass: svclass,
            sampleId: sv.sampleId,
            patientId: sv.patientId,
            site1HugoSymbol: sv.site1HugoSymbol || '',
            site2HugoSymbol: sv.site2HugoSymbol || '',
            variantClass: sv.variantClass,
            eventInfo: sv.eventInfo || '',
        };
    });
}

/**
 * Filter structural variants by gene involvement
 * @param svData Array of genome visualization SV data
 * @param geneSymbol Gene symbol to filter by
 * @returns Filtered array containing only SVs involving the specified gene
 */
export function filterStructuralVariantsByGene(
    svData: GenomeVisualizationSV[],
    geneSymbol: string
): GenomeVisualizationSV[] {
    return svData.filter(
        sv =>
            sv.site1HugoSymbol === geneSymbol ||
            sv.site2HugoSymbol === geneSymbol
    );
}

/**
 * Generate unique identifier for structural variant
 */
function generateSVId(sv: StructuralVariant, index: number): string {
    return `${sv.sampleId}_${sv.site1Chromosome}_${sv.site1Position}_${sv.site2Chromosome}_${sv.site2Position}_${index}`;
}

/**
 * Map cBioPortal variant class to standardized SV type
 */
function mapVariantClass(variantClass: string | undefined): string {
    if (!variantClass) return 'Translocation';

    const mappedClass = SV_TYPE_MAPPING[variantClass.toUpperCase()];
    return mappedClass || variantClass;
}

/**
 * Ensure chromosome name has standard 'chr' prefix
 */
function normalizeChromosomeName(chromosome: string): string {
    if (!chromosome) return 'chr1';
    return chromosome.startsWith('chr') ? chromosome : `chr${chromosome}`;
}

/**
 * Infer DNA strand orientations from breakpoint type description
 */
function inferStrandOrientations(
    breakpointType: string | undefined
): { strand1: string; strand2: string } {
    if (!breakpointType) {
        return { strand1: '+', strand2: '+' };
    }

    const type = breakpointType.toLowerCase();

    if (type.includes('head')) {
        return { strand1: '+', strand2: '-' };
    } else if (type.includes('tail')) {
        return { strand1: '-', strand2: '+' };
    }

    return { strand1: '+', strand2: '+' };
}
