/**
 * Data utilities for the ASCN hackathon genome-wide visualization prototype.
 *
 * JS/TS translation of `ascn_hackathon_genomewide_viz_repro.R`: takes
 * per-sample ASCN "cncf" segmentation output (`tcn.em`/`lcn.em`/`cf.em`)
 * plus sample purity, lays segments along a concatenated genome-wide
 * x-axis, and derives (1) a per-sample CN call heatmap and (2) a
 * cohort-wide gain/loss (or LOH) frequency track binned across the genome.
 *
 * The underlying patient-derived data is never part of this repo. Instead,
 * `scripts/generate_ascn_hackathon_prototype_data.py` is run manually by a
 * developer who has access to it, producing the git-ignored
 * `shared/static-data/ascnHackathonPrototypeData.json`. `loadAscnPrototypeData()`
 * below loads that JSON if present, or returns an empty dataset otherwise
 * (fresh checkout, CI). Not wired to live study/sample data -- standalone
 * prototype tab.
 */

export interface AscnSample {
    tumorSampleId: string;
    purity: number;
}

export interface AscnSegment {
    tumorSampleId: string;
    // String (not number) to mirror the backend's `AbstractAscnRecord.chr`
    // field, which also allows non-autosome values (X/Y/M).
    chromosome: string;
    start: number;
    end: number;
    tcn: number | null;
    mcn: number | null;
    lcn: number | null;
    // Raw ASCN cellular fraction (cf.em). `cfRatio` (cellularFraction /
    // sample purity) is derived once at load time -- see `loadAscnPrototypeData()`.
    cellularFraction: number | null;
    cfRatio: number | null;
    call?: string;
}

export interface AscnGenomeLayout {
    chrLengths: { [chr: string]: number };
    chrOffsets: { [chr: string]: number };
    chrMids: { [chr: string]: number };
    totalGenome: number;
    chromosomes: number[];
}

export interface AscnPrototypeData {
    samples: AscnSample[];
    segments: AscnSegment[];
    layout: AscnGenomeLayout;
}

const CHROMOSOMES = Array.from({ length: 22 }, (_, i) => i + 1);

// GRCh38 autosome lengths (bp), mirroring the `chr_lengths` vector in
// ascn_hackathon_genomewide_viz_repro.R.
export const CHR_LENGTHS: { [chr: string]: number } = {
    '1': 248956422,
    '2': 242193529,
    '3': 198295559,
    '4': 190214555,
    '5': 181538259,
    '6': 170805979,
    '7': 159345973,
    '8': 145138636,
    '9': 138394717,
    '10': 133797422,
    '11': 135086622,
    '12': 133275309,
    '13': 114364328,
    '14': 107043718,
    '15': 101991189,
    '16': 90338345,
    '17': 83257441,
    '18': 80373285,
    '19': 58617616,
    '20': 64444167,
    '21': 46709983,
    '22': 50818468,
};

// String-keyed set of autosome chromosome names ("1".."22"), matching
// `AscnSegment.chromosome`'s string type.
export const AUTOSOME_KEYS = new Set(Object.keys(CHR_LENGTHS));

// Shared left/right chart margins so both charts' genome-wide x-axes
// (and per-chromosome gridlines) stay pixel-aligned when stacked.
export const ASCN_CHART_HORIZONTAL_MARGIN = { left: 70, right: 150 };

function buildLayout(chrLengths: { [chr: string]: number }): AscnGenomeLayout {
    const chrOffsets: { [chr: string]: number } = {};
    const chrMids: { [chr: string]: number } = {};
    let cumulative = 0;
    for (const chr of CHROMOSOMES) {
        const key = String(chr);
        const length = chrLengths[key];
        chrOffsets[key] = cumulative;
        chrMids[key] = cumulative + length / 2;
        cumulative += length;
    }
    return {
        chrLengths,
        chrOffsets,
        chrMids,
        totalGenome: cumulative,
        chromosomes: CHROMOSOMES,
    };
}

interface RawAscnSegment {
    tumorSampleId: string;
    chromosome: string;
    start: number;
    end: number;
    tcn: number | null;
    mcn: number | null;
    lcn: number | null;
    cellularFraction: number | null;
}

interface AscnPrototypeDataJson {
    samples: AscnSample[];
    segments: RawAscnSegment[];
}

let cachedData: AscnPrototypeData | undefined;

/**
 * Loads the ASCN hackathon prototype dataset from the git-ignored
 * `shared/static-data/ascnHackathonPrototypeData.json` (see
 * `scripts/generate_ascn_hackathon_prototype_data.py` to produce it
 * locally). Returns an empty dataset if that file doesn't exist (fresh
 * checkout, CI) -- callers must handle the empty case gracefully.
 */
export function loadAscnPrototypeData(): AscnPrototypeData {
    if (!cachedData) {
        const layout = buildLayout(CHR_LENGTHS);
        let samples: AscnSample[] = [];
        let segments: AscnSegment[] = [];

        // Rooted at the always-present `shared/static-data` directory, so
        // the build never fails whether or not the JSON has been
        // generated locally. Only exercised in the browser bundle --
        // ts-jest/Node has no `require.context` support.
        // prettier-ignore
        const context = (require as any).context(
            '../../../../shared/static-data',
            false,
            /^\.\/ascnHackathonPrototypeData\.json$/
        );
        const key = context
            .keys()
            .find((k: string) => k.endsWith('ascnHackathonPrototypeData.json'));

        if (key) {
            const json: AscnPrototypeDataJson = context(key);
            samples = json.samples;
            // cellularFraction and purity live on separate records
            // (segment vs. sample); join them once here to derive cfRatio.
            const purityByTumorOnly = new Map(
                samples.map(s => [s.tumorSampleId, s.purity])
            );
            segments = json.segments.map(raw => {
                const purity = purityByTumorOnly.get(raw.tumorSampleId);
                const cfRatio =
                    raw.cellularFraction !== null && purity && purity > 0
                        ? raw.cellularFraction / purity
                        : null;
                return { ...raw, cfRatio };
            });
        }

        cachedData = { samples, segments, layout };
    }
    return cachedData;
}

// direct (tcn, mcn, lcn) -> call lookup, used when lcn.em is known
const CN_CALL_LOOKUP_KNOWN_LCN: { [key: string]: string } = {
    '0|0|0': 'HOMDEL',
    '1|1|0': 'HETLOSS',
    '2|2|0': 'CNLOH',
    '3|3|0': 'LOH_HIGH',
    '4|4|0': 'LOH_HIGH',
    '5|5|0': 'LOH_HIGH',
    '6|6|0': 'LOH_HIGH',
    '2|1|1': 'DIPLOID',
    '3|2|1': 'GAIN',
    '4|3|1': 'GAIN',
    '5|4|1': 'AMP',
    '6|5|1': 'AMP',
    '7|6|1': 'AMP',
    '4|2|2': 'AMP',
    '5|3|2': 'AMP',
    '6|4|2': 'AMP',
    '7|5|2': 'AMP',
    '8|6|2': 'AMP',
    '6|3|3': 'AMP',
    '7|4|3': 'AMP',
    '8|5|3': 'AMP',
    '9|6|3': 'AMP',
};

// tcn-only fallback lookup, used when lcn.em (and therefore mcn.em) is NA
const CN_CALL_LOOKUP_UNKNOWN_LCN: { [tcn: string]: string } = {
    '0': 'HOMDEL',
    '1': 'HETLOSS',
    '2': 'DIPLOID',
    '3': 'GAIN',
    '4': 'GAIN',
    '5': 'AMP',
    '6': 'AMP',
};

/**
 * Assigns a discrete CN call ("HOMDEL", "HETLOSS", "DIPLOID", "CNLOH",
 * "LOH_HIGH", "GAIN", "AMP") to every segment, mirroring `assign_cn_call()`.
 */
export function assignCnCall(segments: AscnSegment[]): AscnSegment[] {
    return segments.map(seg => {
        let call = 'NA';
        if (seg.tcn !== null) {
            if (seg.lcn !== null && seg.mcn !== null) {
                const key = `${seg.tcn}|${seg.mcn}|${seg.lcn}`;
                call = CN_CALL_LOOKUP_KNOWN_LCN[key] || 'NA';
            } else {
                call = CN_CALL_LOOKUP_UNKNOWN_LCN[String(seg.tcn)] || 'NA';
            }
        }
        return { ...seg, call };
    });
}

/**
 * Samples whose total homozygous-deletion footprint exceeds 400 Mb are
 * treated as failed ASCN fits and excluded from the frequency plot,
 * mirroring `bad_homdel_samples` in the R script.
 */
export function getBadHomdelSamples(segments: AscnSegment[]): Set<string> {
    const homdelMbBySample: { [tumorSampleId: string]: number } = {};
    for (const seg of segments) {
        if (seg.tcn === 0) {
            const segLenMb = (seg.end - seg.start) / 1e6;
            homdelMbBySample[seg.tumorSampleId] =
                (homdelMbBySample[seg.tumorSampleId] || 0) + segLenMb;
        }
    }
    const bad = new Set<string>();
    for (const tumorSampleId of Object.keys(homdelMbBySample)) {
        if (homdelMbBySample[tumorSampleId] > 400) {
            bad.add(tumorSampleId);
        }
    }
    return bad;
}

export type AscnFrequencyMode = 'gain' | 'loh';

export const FREQ_LEVELS: { [mode in AscnFrequencyMode]: string[] } = {
    gain: ['HOMDEL', 'HETLOSS', 'GAIN', 'AMP'],
    loh: ['HOMDEL', 'HETLOSS', 'CNLOH', 'RLOH'],
};

// Stacking order from the zero baseline outward (most severe call farthest
// from zero), split by direction, mirroring the mirrored bar chart look of
// the reference SVGs.
export const FREQ_STACK_ORDER: {
    [mode in AscnFrequencyMode]: { loss: string[]; gain: string[] };
} = {
    gain: { loss: ['HETLOSS', 'HOMDEL'], gain: ['GAIN', 'AMP'] },
    loh: { loss: ['HETLOSS', 'HOMDEL'], gain: ['CNLOH', 'RLOH'] },
};

export const FREQ_COLORS: { [call: string]: string } = {
    HOMDEL: '#08306B',
    HETLOSS: '#6BAED6',
    GAIN: '#FC4E2A',
    AMP: '#99000D',
    CNLOH: '#C9A0DC',
    RLOH: '#7B2D8B',
};

// Full call palette used by the per-sample CN call heatmap, extending
// FREQ_COLORS with the two calls that never appear in the frequency plot.
export const CALL_COLORS: { [call: string]: string } = {
    ...FREQ_COLORS,
    DIPLOID: '#F7F7F7',
    NA: '#BDBDBD',
};

export const CALL_LEGEND_ORDER: { [mode in AscnFrequencyMode]: string[] } = {
    gain: ['HOMDEL', 'HETLOSS', 'CNLOH', 'DIPLOID', 'GAIN', 'AMP', 'NA'],
    loh: ['HOMDEL', 'HETLOSS', 'CNLOH', 'DIPLOID', 'RLOH', 'GAIN', 'AMP', 'NA'],
};

// Per-mode call heatmap title: mirrors `build_mode_svg()`'s per-mode
// LOH_HIGH reclassification (tcn=3-6,lcn=0; gain mode splits at
// tcn<=5 -> GAIN vs tcn>=6 -> AMP).
export const CALL_HEATMAP_TITLES: { [mode in AscnFrequencyMode]: string } = {
    gain:
        'CN Call (gain-focused: tcn=2,lcn=0 → CNLOH; tcn=3-5,lcn=0 → GAIN; tcn≥6,lcn=0 → AMP)',
    loh: 'CN Call (loh-focused: tcn=2,lcn=0 → CNLOH; tcn≥3,lcn=0 → RLOH)',
};

// Per-mode frequency track title: mirrors the `freq_levels` filter in
// `build_mode_svg()` -- gain mode excludes CNLOH/RLOH, loh mode excludes
// GAIN/AMP entirely.
export const FREQUENCY_CHART_TITLES: { [mode in AscnFrequencyMode]: string } = {
    gain:
        'CN Alteration Frequency (gain-focused: LOH=neutral; GAIN/AMP up, losses down)',
    loh:
        'LOH Frequency (loh-focused: CNLOH + RLOH up, losses down; GAIN/AMP ignored)',
};

const LOSS_CALLS = new Set(['HOMDEL', 'HETLOSS']);

/**
 * Reclassifies a segment's base CN call by plotting mode and cf threshold,
 * mirroring `build_mode_svg()`. Shared by the call heatmap and frequency
 * track so the two views stay in sync.
 */
export function reclassifyCall(
    seg: AscnSegment,
    mode: AscnFrequencyMode,
    cfThreshold: number
): string {
    let call = seg.call || 'NA';
    if (call === 'LOH_HIGH') {
        call =
            mode === 'gain'
                ? seg.tcn !== null && seg.tcn <= 5
                    ? 'GAIN'
                    : 'AMP'
                : 'RLOH';
    }
    if (cfThreshold > 0 && seg.cfRatio !== null && seg.cfRatio < cfThreshold) {
        call = 'DIPLOID';
    }
    return call;
}

/**
 * Applies `reclassifyCall` across a list of segments, returning new segment
 * objects with an updated `call` field.
 */
export function reclassifySegments(
    segments: AscnSegment[],
    mode: AscnFrequencyMode,
    cfThreshold: number
): AscnSegment[] {
    return segments.map(seg => ({
        ...seg,
        call: reclassifyCall(seg, mode, cfThreshold),
    }));
}

export interface FrequencyBinCallValue {
    call: string;
    freq: number; // fraction of samples with this call in this bin (unsigned)
    freqSigned: number; // negative for loss-direction calls
}

export interface FrequencyBin {
    bin: number;
    xmid: number;
    values: FrequencyBinCallValue[];
}

export interface FrequencyResult {
    bins: FrequencyBin[];
    freqLevels: string[];
    freqColors: { [call: string]: string };
    nSamples: number;
}

/**
 * Reclassifies LOH_HIGH/threshold calls per plotting mode and cf threshold,
 * then bins segments across the genome and computes, per bin and call, the
 * fraction of samples carrying that call. Mirrors `build_mode_svg()`.
 */
export function computeFrequencyData(
    segmentsWithCall: AscnSegment[],
    layout: AscnGenomeLayout,
    mode: AscnFrequencyMode,
    cfThreshold: number,
    badHomdelSamples: Set<string>,
    nBins: number = 500
): FrequencyResult {
    const binSize = layout.totalGenome / nBins;

    const relevantSegments = segmentsWithCall.filter(
        seg =>
            AUTOSOME_KEYS.has(seg.chromosome) &&
            !badHomdelSamples.has(seg.tumorSampleId)
    );
    const reclassified = reclassifySegments(
        relevantSegments,
        mode,
        cfThreshold
    );

    const nSamples = new Set(reclassified.map(seg => seg.tumorSampleId)).size;

    const freqLevels = FREQ_LEVELS[mode];
    const freqLevelSet = new Set(freqLevels);

    // bin -> call -> set of tumorSampleId with that call present in that bin
    const binCallSamples: Map<number, Map<string, Set<string>>> = new Map();

    for (const seg of reclassified) {
        if (!freqLevelSet.has(seg.call!)) {
            continue;
        }
        const offset = layout.chrOffsets[seg.chromosome];
        const xminPlot = offset + seg.start;
        const xmaxPlot = offset + seg.end;
        const binStart = Math.max(0, Math.floor(xminPlot / binSize));
        const binEnd = Math.min(nBins - 1, Math.floor(xmaxPlot / binSize));
        for (let bin = binStart; bin <= binEnd; bin++) {
            let callMap = binCallSamples.get(bin);
            if (!callMap) {
                callMap = new Map();
                binCallSamples.set(bin, callMap);
            }
            let sampleSet = callMap.get(seg.call!);
            if (!sampleSet) {
                sampleSet = new Set();
                callMap.set(seg.call!, sampleSet);
            }
            sampleSet.add(seg.tumorSampleId);
        }
    }

    const bins: FrequencyBin[] = [];
    for (let bin = 0; bin < nBins; bin++) {
        const xmid = bin * binSize + binSize / 2;
        const callMap = binCallSamples.get(bin);
        const values: FrequencyBinCallValue[] = freqLevels.map(call => {
            const nWithCall = callMap?.get(call)?.size || 0;
            const freq = nSamples > 0 ? nWithCall / nSamples : 0;
            const signed = LOSS_CALLS.has(call) ? -freq : freq;
            return { call, freq, freqSigned: signed };
        });
        bins.push({ bin, xmid, values });
    }

    return { bins, freqLevels, freqColors: FREQ_COLORS, nSamples };
}
