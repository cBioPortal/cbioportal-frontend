import {
    CanonicalMutationType,
    getCanonicalMutationType,
} from 'cbioportal-frontend-commons';

const CANONICAL_MUTATION_TYPE_LABELS: Partial<Record<
    CanonicalMutationType,
    string
>> = {
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
        CANONICAL_MUTATION_TYPE_LABELS[canonicalType] ?? t.replace(/_/g, ' ')
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
