import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionEvent, GenePartner } from './types';
import { classifySv, hasValidSite2Gene } from './svClassification';

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
 * Classify whether a structural-variant record represents an RNA-derived
 * fusion call (the caller chose the transcripts) or a DNA-level SV.
 *
 * This is the single source-abstraction point. Today the signal is:
 *   1. rnaSupport / dnaSupport — the caller's own detection support fields
 *      (rnaSupport present and truthy → RNA; dnaSupport present and truthy →
 *      DNA), and when they disagree, RNA support wins (fusion callers set it).
 *   2. Fallback (both support fields empty): the molecular profile id, but
 *      ONLY a /fusion/ match implies RNA. We deliberately do NOT treat
 *      "_structural_variants" as DNA, because cBioPortal stores RNA-derived
 *      fusions in "<study>_structural_variants" profiles too — so that suffix
 *      cannot distinguish the two.
 *   3. Default when nothing is conclusive: false (treat as DNA SV — the
 *      conservative choice, so a caller-selected transcript is never honored,
 *      and no genuine DNA SV is ever mislabeled "Called", for an event we
 *      can't confirm is RNA-derived).
 *
 * When the data moves to different ClickHouse tables, only this function
 * changes; everything downstream reads FusionEvent.isRnaDerived.
 */
function isRnaDerivedFusion(sv: StructuralVariant): boolean {
    const truthy = (v: string): boolean => {
        const s = v.trim().toLowerCase();
        return s !== '' && s !== 'no' && s !== 'false' && s !== '0';
    };
    const rna = truthy(safeString(sv.rnaSupport));
    const dna = truthy(safeString(sv.dnaSupport));
    if (rna || dna) {
        return rna;
    }

    // Fallback: only an explicit /fusion/ profile implies RNA. Everything else
    // (including the ambiguous "_structural_variants") defaults to DNA SV.
    return /fusion/.test(safeString(sv.molecularProfileId).toLowerCase());
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
 * Convert a single cBioPortal StructuralVariant into the FusionEvent format
 * used by the fusion viewer.
 */
export function convertStructuralVariantToFusionEvent(
    sv: StructuralVariant
): FusionEvent {
    const gene1: GenePartner = {
        symbol: safeString(sv.site1HugoSymbol),
        chromosome: safeString(sv.site1Chromosome),
        position: safeNumber(sv.site1Position),
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

    const { svIdiom, frame } = classifySv(sv);

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
        connectionType: safeString(sv.connectionType),
        svIdiom,
        frame,
        isRnaDerived: isRnaDerivedFusion(sv),
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
