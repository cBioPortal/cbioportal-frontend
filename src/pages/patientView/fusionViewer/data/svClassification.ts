import { StructuralVariant } from 'cbioportal-ts-api-client';
import { SvIdiom, FramePlausibility } from './types';

// ---------------------------------------------------------------------------
// variantClass synonym maps
// ---------------------------------------------------------------------------

/** Normalized DEL synonyms (uppercase). */
const DEL_CLASSES = new Set(['DEL', 'DELETION']);

/** Normalized DUP synonyms. */
const DUP_CLASSES = new Set([
    'DUP',
    'DUPLICATION',
    'TANDEM-DUP',
    'ITD',
    'TANDEMDUPLICATION',
]);

/** Normalized INV synonyms. */
const INV_CLASSES = new Set(['INV', 'INVERSION']);

/** Normalized INS synonyms. */
const INS_CLASSES = new Set(['INS', 'INSERTION']);

/** Normalized translocation/BND synonyms that are cross-chromosome by definition. */
const TRA_CLASSES = new Set(['TRA', 'BND', 'TRANSLOCATION']);

// ---------------------------------------------------------------------------
// frame plausibility synonym map
// ---------------------------------------------------------------------------

/** site2EffectOnFrame values that map to IN_FRAME */
const IN_FRAME_VALUES = new Set([
    'In_frame',
    'in_frame',
    'IN_FRAME',
    'Inframe',
    'inframe',
    'in frame',
    'In frame',
]);

/** site2EffectOnFrame values that map to OUT_OF_FRAME */
const OUT_OF_FRAME_VALUES = new Set([
    'Out_of_frame',
    'out_of_frame',
    'OUT_OF_FRAME',
    'Frameshift',
    'frameshift',
    'Out of frame',
    'out of frame',
]);

/** site2EffectOnFrame values that map to UTR */
const UTR_VALUES = new Set(['UTR', "5'UTR", "3'UTR", 'utr', 'UTR5', 'UTR3']);

/** site2EffectOnFrame values that map to NONCODING */
const NONCODING_VALUES = new Set([
    'Intron',
    'intron',
    'INTRONIC',
    'Promoter',
    'promoter',
    'PROMOTER',
    'Noncoding',
    'noncoding',
    'non_coding',
    'IGR',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeString(v: string | null | undefined): string {
    if (v == null || v === 'NA' || v === 'N/A') return '';
    return v;
}

function safeNumber(v: number | null | undefined): number {
    if (v == null || v === -1 || isNaN(v as number)) return 0;
    return v;
}

function normalizeClass(raw: string): string {
    return raw
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-');
}

/**
 * Determine whether site2 represents a real second gene partner distinct from
 * site1. Mirrors the logic in structuralVariantAdapter.ts so classification
 * sees the same "has a partner gene" signal.
 */
function isDistinctSite2Gene(sv: StructuralVariant): boolean {
    const gene2 = safeString(sv.site2HugoSymbol);
    if (!gene2) return false;

    const gene1 = safeString(sv.site1HugoSymbol);
    if (gene2 === gene1) {
        const pos1 = safeNumber(sv.site1Position);
        const pos2 = safeNumber(sv.site2Position);
        const chr1 = safeString(sv.site1Chromosome);
        const chr2 = safeString(sv.site2Chromosome);
        if (pos1 === pos2 && chr1 === chr2) return false;
    }
    return true;
}

/**
 * True when site1 and site2 are on different chromosomes OR the variantClass
 * is an explicit cross-chromosome type (TRA/BND/TRANSLOCATION).
 */
/**
 * True when both gene symbols are the same (intragenic event).
 * Does NOT require different positions — use isDistinctSite2Gene for that.
 */
function isSameGene(sv: StructuralVariant): boolean {
    const gene1 = safeString(sv.site1HugoSymbol);
    const gene2 = safeString(sv.site2HugoSymbol);
    return Boolean(gene1 && gene2 && gene1 === gene2);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SvClassification {
    svIdiom: SvIdiom;
    frame: FramePlausibility;
}

/**
 * Classify a StructuralVariant into an `SvIdiom` and `FramePlausibility`.
 *
 * Priority rules (gene relationship beats variantClass for idiom selection):
 *   1. No valid site2 gene  → INTERGENIC_REGION  (or INSERTION if class ≈ INS)
 *   2. Insertion class      → INSERTION  (single-anchored)
 *   3. Same gene symbol     → INTRAGENIC_{DELETION|DUPLICATION|INVERSION|UNKNOWN}
 *   4. Different genes, cross-chrom or TRA/BND → INTERGENIC_FUSION
 *   5. Different genes, same chrom → INTRACHROM_FUSION
 */
export function classifySv(sv: StructuralVariant): SvClassification {
    const rawClass = safeString(sv.variantClass);
    const normClass = normalizeClass(rawClass);

    // ---- Frame plausibility ------------------------------------------------
    const rawFrame = safeString(sv.site2EffectOnFrame);
    let frame: FramePlausibility = 'UNKNOWN';
    if (rawFrame) {
        if (IN_FRAME_VALUES.has(rawFrame)) {
            frame = 'IN_FRAME';
        } else if (OUT_OF_FRAME_VALUES.has(rawFrame)) {
            frame = 'OUT_OF_FRAME';
        } else if (UTR_VALUES.has(rawFrame)) {
            frame = 'UTR';
        } else if (NONCODING_VALUES.has(rawFrame)) {
            frame = 'NONCODING';
        }
    }

    // ---- SvIdiom -----------------------------------------------------------

    // Explicit insertion class is handled before gene-partner check so that a
    // single-gene insertion is not confused with INTERGENIC_REGION.
    if (INS_CLASSES.has(normClass)) {
        return { svIdiom: 'INSERTION', frame };
    }

    const hasPartner = isDistinctSite2Gene(sv);

    if (!hasPartner) {
        return { svIdiom: 'INTERGENIC_REGION', frame };
    }

    // Genuinely different chromosomes → inter-genic. Trust the coordinates over
    // any class hint, so a same-symbol paralog on a different chromosome is an
    // inter-genomic fusion, not intragenic.
    const chr1 = safeString(sv.site1Chromosome);
    const chr2 = safeString(sv.site2Chromosome);
    if (chr1 && chr2 && chr1 !== chr2) {
        return { svIdiom: 'INTERGENIC_FUSION', frame };
    }

    // Same chromosome (or unknown): a same-gene event is intragenic, and this
    // MUST win over the TRA/BND class hint — otherwise a same-gene event tagged
    // TRANSLOCATION would misclassify as INTERGENIC_FUSION and render a spurious
    // two-gene product.
    if (isSameGene(sv)) {
        if (DEL_CLASSES.has(normClass)) {
            return { svIdiom: 'INTRAGENIC_DELETION', frame };
        }
        if (DUP_CLASSES.has(normClass)) {
            return { svIdiom: 'INTRAGENIC_DUPLICATION', frame };
        }
        if (INV_CLASSES.has(normClass)) {
            return { svIdiom: 'INTRAGENIC_INVERSION', frame };
        }
        // Same gene but class unclear → UNKNOWN_SV
        return { svIdiom: 'UNKNOWN_SV', frame };
    }

    // Different genes on the same (or unknown) chromosome. A TRA/BND class is a
    // rearrangement joining two genes → inter-genic; anything else (DEL etc.) is
    // an intra-chromosomal fusion, not intragenic.
    if (TRA_CLASSES.has(normClass)) {
        return { svIdiom: 'INTERGENIC_FUSION', frame };
    }
    return { svIdiom: 'INTRACHROM_FUSION', frame };
}

// ---------------------------------------------------------------------------
// Rendering predicate (pure, exportable for tests)
// ---------------------------------------------------------------------------

/**
 * Returns true when a protein product should be rendered for this SV.
 * Gated ONLY on SV type (idiom):
 *   - INTERGENIC_FUSION / INTRACHROM_FUSION → chimeric two-gene product
 *   - INTRAGENIC_DELETION → single-gene product with internal exons removed
 *     (e.g. EGFRvIII, BRAF exon-deletion). The 5′+3′ join machinery represents
 *     this accurately: 5′ exons up to breakpoint 1 + 3′ exons from breakpoint 2
 *     on the same transcript = the internal deletion.
 *   - INTRAGENIC_DUPLICATION → single-gene product with a tandem-duplicated
 *     segment (e.g. EGFR-KDD). Rendered by FEEDING SWAPPED BREAKPOINTS to the
 *     same machinery: 5′ extends through the downstream breakpoint and 3′ starts
 *     at the upstream one, so the duplicated exons appear twice. See
 *     FusionDiagramSVG (productBp5/productBp3).
 * Suppressed for INTRAGENIC_INVERSION (ORF-disrupting) and
 * INTERGENIC_REGION / INSERTION / UNKNOWN_SV.
 *
 * We deliberately do NOT suppress on OUT_OF_FRAME / NONCODING. The frame value
 * comes from the caller's single `site2EffectOnFrame` annotation, which is tied
 * to one upstream-accepted transcript and is NOT recomputed for the transcript
 * the user has selected — so it cannot be confirmed per displayed transcript.
 * Hiding the product on an unconfirmable frame call would be misleading; the
 * junction glyph still surfaces the annotated frame (with that caveat).
 */
export function shouldRenderChimericProtein(svIdiom: SvIdiom): boolean {
    return (
        svIdiom === 'INTERGENIC_FUSION' ||
        svIdiom === 'INTRACHROM_FUSION' ||
        svIdiom === 'INTRAGENIC_DELETION' ||
        svIdiom === 'INTRAGENIC_DUPLICATION'
    );
}
