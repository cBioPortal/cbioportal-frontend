/**
 * Decode the RNA fusion "source" code (the CallMethod / `tool` column emitted by
 * the RNA fusion pipeline) into the fusion callers that identified the event.
 *
 * The code is a concatenation of single-letter caller tags — one per caller that
 * called the fusion within the cluster:
 *   A = Arriba, F = FusionCatcher, S = StarFusion
 * e.g. "AFS" = all three callers agreed; "F" = FusionCatcher only.
 *
 * (Applies to RNA-derived fusions. For DNA structural variants the CallMethod
 * field carries the variant class instead, which does not decode here.)
 */

const CALLER_NAMES: Record<string, string> = {
    A: 'Arriba',
    F: 'FusionCatcher',
    S: 'StarFusion',
};

/** Legend line for the source tooltip, derived from CALLER_NAMES (single source). */
export const CALLER_SOURCE_LEGEND: string = Object.entries(CALLER_NAMES)
    .map(([code, name]) => `${code} = ${name}`)
    .join(', ');

/**
 * Return the human-readable caller names encoded in `code`, in code order.
 *
 * The code must consist *entirely* of caller letters to be treated as a caller
 * source — anything else (e.g. a DNA SV variant class like "TRANSLOCATION",
 * which incidentally contains an "A") returns [] rather than a spurious match.
 * Duplicate letters are collapsed (e.g. "AA" → just Arriba).
 */
export function describeCallerSource(
    code: string | null | undefined
): string[] {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return [];
    const chars = trimmed.split('');
    if (!chars.every(c => c in CALLER_NAMES)) return [];
    const seen = new Set<string>();
    return chars
        .filter(c => !seen.has(c) && (seen.add(c), true))
        .map(c => CALLER_NAMES[c]);
}
