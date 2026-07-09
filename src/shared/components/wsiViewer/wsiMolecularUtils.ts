import {
    CanonicalMutationType,
    getCanonicalMutationType,
} from 'cbioportal-frontend-commons';

/** Build an OncoKB gene/variant URL. */
export function buildOncoKbUrl(gene: string, variant?: string): string {
    return `https://www.oncokb.org/gene/${encodeURIComponent(gene)}${
        variant ? '/' + encodeURIComponent(variant) : ''
    }`;
}

/** Split a `"GENE variant"` mutation token into `{ gene, variant }`. */
export function parseMutationToken(token: string): {
    gene: string;
    variant: string;
} {
    const spaceIdx = token.indexOf(' ');
    return spaceIdx > 0
        ? { gene: token.slice(0, spaceIdx), variant: token.slice(spaceIdx + 1) }
        : { gene: token, variant: '' };
}

/** Split a semicolon/comma-delimited mutation list into individual tokens. */
export function parseMutationTokens(
    value: string | null | undefined
): string[] {
    return (value ?? '')
        .split(/[;,]\s*/)
        .map(s => s.trim())
        .filter(Boolean);
}

const CANONICAL_MUTATION_TYPE_LABELS: Partial<
    Record<CanonicalMutationType, string>
> = {
    [CanonicalMutationType.MISSENSE]: 'Missense',
    [CanonicalMutationType.NONSENSE]: 'Nonsense',
    [CanonicalMutationType.FRAME_SHIFT_DEL]: 'Frameshift del',
    [CanonicalMutationType.FRAME_SHIFT_INS]: 'Frameshift ins',
    [CanonicalMutationType.FRAMESHIFT]: 'Frameshift',
    [CanonicalMutationType.IN_FRAME_DEL]: 'In-frame del',
    [CanonicalMutationType.IN_FRAME_INS]: 'In-frame ins',
    [CanonicalMutationType.INFRAME]: 'In-frame',
    [CanonicalMutationType.SPLICE_SITE]: 'Splice site',
    [CanonicalMutationType.NONSTART]: 'Start site',
    [CanonicalMutationType.NONSTOP]: 'Nonstop',
    [CanonicalMutationType.TRUNCATING]: 'Truncating',
    [CanonicalMutationType.FUSION]: 'Fusion',
    [CanonicalMutationType.SILENT]: 'Silent',
    [CanonicalMutationType.OTHER]: 'Other',
};

/**
 * Convert cBioPortal mutation type string to a short human-readable label.
 * e.g. "Missense_Mutation" → "Missense", "Frame_Shift_Del" → "Frameshift del"
 */
export function formatMutationType(t: string): string {
    if (!t) return '';
    const canonicalType = getCanonicalMutationType(t);
    if (canonicalType === CanonicalMutationType.OTHER) {
        return t.replace(/_/g, ' ');
    }

    return (
        CANONICAL_MUTATION_TYPE_LABELS[canonicalType] ??
        t.replace(/_/g, ' ')
    );
}

/** Labels for discrete CNA values (GISTIC encoding). */
export function cnaLabel(value: number): string {
    if (value === -2) return 'HOMDEL';
    if (value === -1) return 'HETLOSS';
    if (value === 1) return 'GAIN';
    if (value === 2) return 'AMP';
    return String(value);
}
