import { assert } from 'chai';
import {
    assignBreakpointsToFeatures,
    featureSlotLayout,
    featureSlotKey,
    pixelBinLayout,
} from './trackGeometry';
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
});
