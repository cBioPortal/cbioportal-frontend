import { Sample, Slide } from './wsiViewerTypes';

// A normalized hierarchy is never mutated, so the per-sample value is
// memoized by object identity.
const earliestServableSlideTimepointCache = new WeakMap<
    Sample,
    number | undefined
>();

export function formatDaysSinceDiagnosis(days: number): string {
    if (days === 0) return 'd0';
    return days > 0 ? `d+${days}` : `d${days}`;
}

/** Explains the day notation wherever a slide or sample day is shown. */
export const DAY_ZERO_TOOLTIP =
    "Days are counted from the patient's first tumor sequencing (d0): " +
    'd-242 is 242 days before it, d+7 is 7 days after.';

/** Tooltip for a slide's procedure timepoint. */
export function procedureTooltip(
    procedureDays: number | null | undefined
): string | undefined {
    return procedureDays == null
        ? undefined
        : `Procedure on ${formatDaysSinceDiagnosis(
              procedureDays
          )}. ${DAY_ZERO_TOOLTIP}`;
}

function timepointSourceAbbreviation(source: string): string {
    const normalizedSource = source.toLowerCase();
    return normalizedSource.includes('procedure')
        ? 'Proc'
        : normalizedSource.includes('sample acquisition')
        ? 'Acq'
        : normalizedSource.includes('sequencing')
        ? 'Seq'
        : 'Proc';
}

function asFiniteNumber(value: number | null | undefined): number | undefined {
    return value != null && Number.isFinite(value) ? value : undefined;
}

export function timepointText(
    days: number | null | undefined,
    source: string | null | undefined
): string | null {
    const normalizedDays = asFiniteNumber(days);
    if (normalizedDays == null || !source) {
        return null;
    }
    const normalizedSource = source.toLowerCase();
    if (
        !normalizedSource.includes('procedure') &&
        normalizedSource.includes('sequencing')
    ) {
        return null;
    }
    return `${timepointSourceAbbreviation(source)} ${formatDaysSinceDiagnosis(
        normalizedDays
    )}`;
}

export function getSlideTimepointDays(
    slide: Pick<Slide, 'slide_timepoint_days'>
): number | undefined {
    return asFiniteNumber(slide.slide_timepoint_days);
}

export function procedureSlideTimepointText(
    slide: Pick<Slide, 'slide_timepoint_days' | 'slide_timepoint_source'>
): string | null {
    return slide.slide_timepoint_source?.toLowerCase().includes('procedure')
        ? timepointText(
              slide.slide_timepoint_days,
              slide.slide_timepoint_source
          )
        : null;
}

function computeEarliestServableSlideTimepoint(
    sample: Sample
): number | undefined {
    let earliest: number | undefined;
    for (const part of sample.parts) {
        for (const block of part.blocks) {
            for (const slide of block.slides) {
                if (
                    !slide.can_serve_tiles ||
                    !slide.slide_key ||
                    (!slide.is_hne && !slide.is_ihc)
                ) {
                    continue;
                }
                const days = asFiniteNumber(slide.slide_timepoint_days);
                if (days != null) {
                    earliest =
                        earliest == null ? days : Math.min(earliest, days);
                }
            }
        }
    }
    return earliest;
}

function getEarliestServableSlideTimepoint(sample: Sample): number | undefined {
    if (!earliestServableSlideTimepointCache.has(sample)) {
        earliestServableSlideTimepointCache.set(
            sample,
            computeEarliestServableSlideTimepoint(sample)
        );
    }
    return earliestServableSlideTimepointCache.get(sample);
}

export function compareSamplesByTimepoint(a: Sample, b: Sample): number {
    const aIsUnmatched = a.sample_id === 'UNMATCHED';
    const bIsUnmatched = b.sample_id === 'UNMATCHED';
    if (aIsUnmatched !== bIsUnmatched) {
        return aIsUnmatched ? 1 : -1;
    }

    const aDays = getEarliestServableSlideTimepoint(a);
    const bDays = getEarliestServableSlideTimepoint(b);
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
