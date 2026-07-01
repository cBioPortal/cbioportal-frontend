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

const MUTATION_TYPE_MAP: Record<string, string> = {
    Missense_Mutation: 'Missense',
    Nonsense_Mutation: 'Nonsense',
    Frame_Shift_Del: 'Frameshift del',
    Frame_Shift_Ins: 'Frameshift ins',
    In_Frame_Del: 'In-frame del',
    In_Frame_Ins: 'In-frame ins',
    Splice_Site: 'Splice site',
    Translation_Start_Site: 'Start site',
    Nonstop_Mutation: 'Nonstop',
    Silent: 'Silent',
};

/**
 * Convert cBioPortal mutation type string to a short human-readable label.
 * e.g. "Missense_Mutation" → "Missense", "Frame_Shift_Del" → "Frameshift del"
 */
export function formatMutationType(t: string): string {
    if (!t) return '';
    return MUTATION_TYPE_MAP[t] ?? t.replace(/_/g, ' ');
}

/** Labels for discrete CNA values (GISTIC encoding). */
export function cnaLabel(value: number): string {
    if (value === -2) return 'HOMDEL';
    if (value === -1) return 'HETLOSS';
    if (value === 1) return 'GAIN';
    if (value === 2) return 'AMP';
    return String(value);
}
