import { assert } from 'chai';
import {
    assignBreakpointsToFeatures,
    featureSlotLayout,
    featureSlotKey,
    pixelBinLayout,
    genomicProjection,
    BIN_PX,
} from './trackGeometry';
import { binBreakpointsByPixel } from '../components/AnchorGeneTrackRuler';
import { TranscriptData } from './types';

const minusTx: TranscriptData = {
    transcriptId: 'T',
    displayName: 'T',
    gene: 'G',
    biotype: 'protein_coding',
    strand: '-',
    txStart: 1000,
    txEnd: 5000,
    exons: [
        { number: 1, start: 4500, end: 5000 },
        { number: 2, start: 2500, end: 3000 },
        { number: 3, start: 1000, end: 1500 },
    ],
    isForteSelected: true,
    isCallerSelected: true,
    isCanonical: true,
    genomeBuild: 'GRCh38',
    domains: [],
    utrs: [],
};

describe('trackGeometry', () => {
    it('feature layout assigns exactly like the ruler (negative strand)', () => {
        const bps = [4700, 3500, 1200, 999_999];
        const layout = featureSlotLayout(minusTx, 100, 400);
        const { features } = assignBreakpointsToFeatures(minusTx, bps);
        const expected = bps.map((_bp, i) =>
            features.find(f => f.members.includes(i))
        );
        layout.assign(bps).forEach((slot, i) => {
            const f = expected[i];
            assert.equal(
                slot ? slot.key : undefined,
                f ? featureSlotKey(f) : undefined
            );
        });
    });

    it('slot centres match the ruler formula drawX + i*slotW + slotW/2', () => {
        const layout = featureSlotLayout(minusTx, 100, 400);
        const slotW = 400 / layout.slots.length;
        layout.slots.forEach((s, i) =>
            assert.closeTo(s.x, 100 + i * slotW + slotW / 2, 1e-9)
        );
    });

    it('width change moves x but not the feature key', () => {
        const a = featureSlotLayout(minusTx, 100, 400).assign([3500])[0]!;
        const b = featureSlotLayout(minusTx, 100, 800).assign([3500])[0]!;
        assert.equal(a.key, b.key);
        assert.notEqual(a.x, b.x);
    });

    it('pixel bins drop out-of-range points and key by bin index', () => {
        const layout = pixelBinLayout(minusTx, 100, 400);
        const [inRange, outRange] = layout.assign([3000, 50_000_000]);
        assert.match(inRange!.key, /^bin:\d+$/);
        assert.isUndefined(outRange);
        assert.isUndefined(layout.assign([null])[0]);
    });

    it('pixel-bin keys match binBreakpointsByPixel indices (D25 parity, fractional drawX)', () => {
        const drawX = 100.37;
        const drawW = 413.6;
        const bps = [4999, 4700, 4500, 3500, 3000, 2999, 1200, 1001, 1000];
        const layout = pixelBinLayout(minusTx, drawX, drawW);
        const slots = layout.assign(bps);
        const xs = bps.map(genomicProjection(minusTx, drawX, drawW));
        const bins = binBreakpointsByPixel(xs, drawX, drawW, BIN_PX);
        const expected = new Map<number, string>();
        bins.forEach(b => {
            const idx = Math.round((b.x - drawX) / BIN_PX);
            b.members.forEach(m => expected.set(m, `bin:${idx}`));
        });
        assert.isAbove(expected.size, 0);
        bps.forEach((_bp, i) =>
            assert.equal(slots[i]?.key, expected.get(i), `bp #${i}`)
        );
    });
});
