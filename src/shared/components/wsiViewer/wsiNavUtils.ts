import { Sample } from './wsiViewerTypes';

export function formatDaysSinceDiagnosis(days: number): string {
    if (days === 0) return 'd0';
    return days > 0 ? `d+${days}` : `d${days}`;
}

export function sampleTimepointText(
    sample: Pick<Sample, 'sample_timepoint_days' | 'sample_timepoint_source'>
): string | null {
    if (sample.sample_timepoint_days == null || !sample.sample_timepoint_source) {
        return null;
    }
    const source =
        sample.sample_timepoint_source === 'Sample acquisition' ? 'Acq' : 'Seq';
    return `${source} ${formatDaysSinceDiagnosis(sample.sample_timepoint_days)}`;
}

export function compareSamplesByTimepoint(a: Sample, b: Sample): number {
    const aDays = a.sample_timepoint_days;
    const bDays = b.sample_timepoint_days;
    const aHasDays = aDays != null && Number.isFinite(aDays);
    const bHasDays = bDays != null && Number.isFinite(bDays);

    if (aHasDays && bHasDays && aDays !== bDays) {
        return aDays - bDays;
    }
    if (aHasDays !== bHasDays) {
        return aHasDays ? -1 : 1;
    }

    const sampleTypeCmp = (a.sample_type || '').localeCompare(
        b.sample_type || '',
        undefined,
        { sensitivity: 'base' }
    );
    if (sampleTypeCmp !== 0) {
        return sampleTypeCmp;
    }

    return a.sample_id.localeCompare(b.sample_id, undefined, {
        numeric: true,
        sensitivity: 'base',
    });
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

export function barcodeSection(
    barcode: string | null | undefined
): string | null {
    const m = barcode?.match(/-T\d+-[^-]+-(\d+)-(\d+)$/i);
    return m ? `${m[1]}.${m[2]}` : null;
}

export function barcodeAccession(
    barcode: string | null | undefined
): string | null {
    const m = barcode?.match(/^(S-\d+)/i);
    return m ? m[1] : null;
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

export function decodeBlockCode(label: string | null | undefined): string | null {
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
