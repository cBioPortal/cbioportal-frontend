import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionEvent, GenePartner } from './types';

/**
 * Safely extract a string value, treating null, undefined, and "NA" as empty.
 */
function safeString(value: string | null | undefined): string {
    if (value == null || value === 'NA' || value === 'N/A') {
        return '';
    }
    return value;
}

/**
 * Safely extract a numeric value, treating null, undefined, -1, and NaN as 0.
 */
function safeNumber(value: number | null | undefined): number {
    if (value == null || value === -1 || isNaN(value)) {
        return 0;
    }
    return value;
}

/**
 * Strip the version suffix from an Ensembl transcript ID (e.g., "ENST00000123.4" -> "ENST00000123").
 */
function stripTranscriptVersion(transcriptId: string): string {
    if (!transcriptId) {
        return '';
    }
    const dotIndex = transcriptId.indexOf('.');
    return dotIndex >= 0 ? transcriptId.substring(0, dotIndex) : transcriptId;
}

/**
 * Infer strand orientation for site1 and site2 from the connectionType field.
 *
 * connectionType values: '3to5', '5to3', '5to5', '3to3'
 * - Site1 strand: '5to*' -> '+', '3to*' -> '-'
 * - Site2 strand: '*to5' -> '+', '*to3' -> '-'
 */
function inferStrands(
    connectionType: string
): {
    site1Strand: '+' | '-';
    site2Strand: '+' | '-';
} {
    const ct = safeString(connectionType).toLowerCase();

    let site1Strand: '+' | '-' = '+';
    let site2Strand: '+' | '-' = '+';

    if (ct.startsWith('3')) {
        site1Strand = '-';
    }
    if (ct.endsWith('3')) {
        site2Strand = '-';
    }

    return { site1Strand, site2Strand };
}

/**
 * Build a position summary string from site descriptions.
 */
function buildPositionString(sv: StructuralVariant): string {
    const desc1 = safeString(sv.site1Description);
    const desc2 = safeString(sv.site2Description);

    if (desc1 && desc2) {
        return `${desc1} | ${desc2}`;
    }
    return desc1 || desc2 || '';
}

/**
 * Compute total read support from available count fields.
 * Prefers tumorVariantCount if it is a positive value; otherwise falls back
 * to the sum of tumorSplitReadCount and tumorPairedEndReadCount.
 */
function computeReadSupport(sv: StructuralVariant): number {
    const variantCount = safeNumber(sv.tumorVariantCount);
    if (variantCount > 0) {
        return variantCount;
    }

    const splitReads = safeNumber(sv.tumorSplitReadCount);
    const pairedEndReads = safeNumber(sv.tumorPairedEndReadCount);
    const sum = splitReads + pairedEndReads;

    return sum > 0 ? sum : 0;
}

/**
 * Determine whether site2 represents a real second gene partner.
 * Returns false if the symbol is missing, empty, "NA", or identical to site1
 * with no meaningful genomic distinction.
 */
function hasValidSite2Gene(sv: StructuralVariant): boolean {
    const gene2 = safeString(sv.site2HugoSymbol);
    if (!gene2) {
        return false;
    }

    // If site2 gene equals site1 gene, check whether positions differ
    // (intragenic rearrangements are still valid fusions)
    const gene1 = safeString(sv.site1HugoSymbol);
    if (gene2 === gene1) {
        const pos1 = safeNumber(sv.site1Position);
        const pos2 = safeNumber(sv.site2Position);
        const chr1 = safeString(sv.site1Chromosome);
        const chr2 = safeString(sv.site2Chromosome);

        // Same gene, same position, same chromosome -> not a real second partner
        if (pos1 === pos2 && chr1 === chr2) {
            return false;
        }
    }

    return true;
}

/**
 * Convert a single cBioPortal StructuralVariant into the FusionEvent format
 * used by the fusion viewer.
 */
export function convertStructuralVariantToFusionEvent(
    sv: StructuralVariant
): FusionEvent {
    const { site1Strand, site2Strand } = inferStrands(sv.connectionType);

    const gene1: GenePartner = {
        symbol: safeString(sv.site1HugoSymbol),
        chromosome: safeString(sv.site1Chromosome),
        position: safeNumber(sv.site1Position),
        strand: site1Strand,
        selectedTranscriptId: stripTranscriptVersion(
            safeString(sv.site1EnsemblTranscriptId)
        ),
        siteDescription: safeString(sv.site1Description),
    };

    const gene2: GenePartner | null = hasValidSite2Gene(sv)
        ? {
              symbol: safeString(sv.site2HugoSymbol),
              chromosome: safeString(sv.site2Chromosome),
              position: safeNumber(sv.site2Position),
              strand: site2Strand,
              selectedTranscriptId: stripTranscriptVersion(
                  safeString(sv.site2EnsemblTranscriptId)
              ),
              siteDescription: safeString(sv.site2Description),
          }
        : null;

    const gene1Symbol = safeString(sv.site1HugoSymbol);
    const gene2Symbol = safeString(sv.site2HugoSymbol);

    const fusion = safeString(sv.eventInfo)
        ? sv.eventInfo
        : gene2Symbol
        ? `${gene1Symbol}::${gene2Symbol}`
        : gene1Symbol;

    const id = [
        sv.sampleId || '',
        gene1Symbol,
        gene2Symbol,
        String(safeNumber(sv.site1Position)),
        String(safeNumber(sv.site2Position)),
    ].join('_');

    return {
        id,
        tumorId: sv.sampleId || '',
        gene1,
        gene2,
        fusion,
        totalReadSupport: computeReadSupport(sv),
        callMethod: safeString(sv.variantClass) || 'SV',
        frameCallMethod: safeString(sv.site2EffectOnFrame),
        annotation: safeString(sv.annotation),
        position: buildPositionString(sv),
        significance: 'NA',
        note: safeString(sv.comments),
    };
}

/**
 * Convert an array of cBioPortal StructuralVariant objects into FusionEvent[],
 * filtering out entries that lack a valid site1 gene symbol.
 */
export function convertStructuralVariantsToFusionEvents(
    svs: StructuralVariant[]
): FusionEvent[] {
    return svs
        .filter(sv => {
            const gene1 = safeString(sv.site1HugoSymbol);
            return gene1.length > 0;
        })
        .map(convertStructuralVariantToFusionEvent);
}
