import { Sample } from './wsiViewerTypes';

/**
 * Orders samples for the slide list: matched samples in hierarchy order (as
 * the backend sends them), then the unmatched group. Use with a stable sort.
 */
export function compareSamplesForNavigation(a: Sample, b: Sample): number {
    const aIsUnmatched = a.sample_id === 'UNMATCHED';
    const bIsUnmatched = b.sample_id === 'UNMATCHED';
    if (aIsUnmatched !== bIsUnmatched) {
        return aIsUnmatched ? 1 : -1;
    }
    return 0;
}

export function cleanStain(name: string): string {
    return (name || '')
        .replace(/\b(stain|slide|section)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeBlockLabel(
    label: string | null | undefined,
    number?: string | number | null
): string {
    return (label || '').trim() || (number != null ? String(number) : '');
}

export function abbreviatePartDesc(
    desc: string | null | undefined
): string | null {
    if (!desc) return null;
    return desc
        .replace(/\b(left|lt)\b/gi, 'L')
        .replace(/\b(right|rt)\b/gi, 'R')
        .replace(/\bupper\b/gi, 'Upper')
        .replace(/\blower\b/gi, 'Lower');
}

export function fmtMB(bytes: string | number | null | undefined): string {
    const n = Number(bytes);
    if (!isFinite(n) || n <= 0) return '—';
    return `${(n / (1024 * 1024)).toFixed(n >= 1_000_000_000 ? 0 : 1)} MB`;
}

const BLOCK_CODE_MAP: Record<string, string> = {
    P: 'Proximal',
    D: 'Distal',
    M: 'Margin',
    RS: 'Representative Section',
    PL: 'Proximal Level',
    DL: 'Distal Level',
    R: 'Random',
    T: 'Tumor',
    N: 'Normal',
    C: 'Center',
    S: 'Surface',
    DEEP: 'Deep Margin',
    SUP: 'Superior Margin',
    INF: 'Inferior Margin',
    ANT: 'Anterior Margin',
    POST: 'Posterior Margin',
    MED: 'Medial Margin',
    LAT: 'Lateral Margin',
    PROX: 'Proximal Margin',
    DIST: 'Distal Margin',
    ADD: 'Additional Section',
    FSC: 'Frozen Section',
    INK: 'Inked Margin',
    LN: 'Lymph Node',
    ALN: 'Axillary Lymph Node',
    BLN: 'Bench Lymph Node',
    CLN: 'Central Lymph Node',
    DLN: 'Distal Lymph Node',
    ILN: 'Inguinal Lymph Node',
    LLN: 'Left Lymph Node',
    MLN: 'Mesenteric Lymph Node',
    NTLN: 'Non-Tumor Lymph Node',
    PLN: 'Pelvic Lymph Node',
    RLN: 'Right Lymph Node',
    SLN: 'Sentinel Lymph Node',
    SSLN: 'Sub-Site Lymph Node',
    TLN: 'Thoracic Lymph Node',
    RBL: 'Right Bowel Lumen',
};

export function decodeBlockCode(
    label: string | null | undefined
): string | null {
    if (!label) return null;
    const m = label.match(/^\d+\s+([A-Z]+)\d*$/);
    if (!m) return null;
    return BLOCK_CODE_MAP[m[1]] || null;
}

export const BLOCK_LABEL_TIP =
    'Block label: number = block within case; letter code = tissue region (P=Proximal, D=Distal, M=Margin, RS=Rep. Section, LN=Lymph Node, RLN=Right Lymph Node, …)';

export function stainQualifier(group: string | null | undefined): string {
    const g = (group || '').toLowerCase();
    if (g.includes('frozen')) return 'frozen';
    if (g.includes('initial')) return 'H&E';
    return 'H&E recut';
}
