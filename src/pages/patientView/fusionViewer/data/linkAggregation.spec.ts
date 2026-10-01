import { assert } from 'chai';
import {
    buildLinkGroups,
    litBarKeys,
    matchBar,
    matchLinkIds,
    slotLabel,
} from './linkAggregation';
import { TrackLayout } from './trackGeometry';
import { ComparisonRow } from './comparisonRows';
import { groupRows } from './collapseRows';

// Fake layouts: breakpoint 1xx → slot "A<bp/100>", off-track when >= 1000.
const fake = (prefix: string, x0: number): TrackLayout => ({
    slots: [],
    assign: bps =>
        bps.map(bp =>
            bp === null || bp >= 1000
                ? undefined
                : {
                      key: `${prefix}${Math.floor(bp / 100)}`,
                      x: x0 + Math.floor(bp / 100),
                      width: 1,
                  }
        ),
});
const L5 = fake('A', 0);
const L3 = fake('B', 500);

const r = (
    sample: string,
    bp5: number,
    bp3: number | null,
    frame: any = 'inFrame'
): ComparisonRow =>
    ({
        sampleId: sample,
        anchorBreakpoint: bp5,
        partnerBreakpoint: bp3,
        frame,
        fivePrimeSymbol: 'T',
        threePrimeSymbol: bp3 === null ? null : 'E',
        event: {},
    } as any);

describe('buildLinkGroups', () => {
    it('groups by (5′ slot, 3′ slot, frame) and counts unique samples', () => {
        const { groups, rowLinkIds } = buildLinkGroups(
            [
                r('S1', 150, 350),
                r('S1', 160, 340), // same sample, same link → counted once
                r('S2', 150, 350),
                r('S3', 150, 350, 'outOfFrame'),
                r('S4', 150, 2000), // 3′ off-track → no link
                r('S5', 150, null), // partnerless → no link
            ],
            L5,
            L3
        );
        assert.lengthOf(groups, 2);
        assert.equal(groups[0].id, 'A1|B3|inFrame');
        assert.equal(groups[0].sampleCount, 2);
        assert.isUndefined(rowLinkIds[4]);
        assert.isUndefined(rowLinkIds[5]);
    });

    it('many rows collapse to few groups', () => {
        const rows = Array.from({ length: 2000 }, (_, i) =>
            r(`S${i}`, 100 + (i % 3) * 100, 300)
        );
        assert.lengthOf(buildLinkGroups(rows, L5, L3).groups, 3);
    });
});

describe('hover predicates', () => {
    const { groups } = buildLinkGroups(
        [r('S1', 150, 350), r('S2', 250, 350), r('S3', 250, 450)],
        L5,
        L3
    );

    it('bar → every link touching that bar, plus bars at the other ends', () => {
        const { lit5, lit3 } = litBarKeys(groups, matchBar('3p', 'B3'));
        assert.sameMembers(Array.from(lit5), ['A1', 'A2']);
        assert.sameMembers(Array.from(lit3), ['B3']);
    });

    it('collapsed group with mixed partner slots → union of member links', () => {
        const rows = [r('S1', 250, 350), r('S2', 250, 450, 'unknown')];
        const { rowLinkIds } = buildLinkGroups(rows, L5, L3);
        const [group] = groupRows(rows, () => 'same-anchor-feature');
        const ids = group.members
            .map(m => rowLinkIds[rows.indexOf(m)])
            .filter((x): x is string => !!x);
        const m = matchLinkIds(ids);
        assert.isTrue(m({ key5: 'A2', key3: 'B3', frame: 'inFrame' }));
        assert.isTrue(m({ key5: 'A2', key3: 'B4', frame: 'unknown' }));
        assert.isFalse(m({ key5: 'A1', key3: 'B3', frame: 'inFrame' }));
    });
});

describe('slotLabel', () => {
    it('humanises feature and bin keys', () => {
        assert.equal(slotLabel('exon:E4'), 'E4');
        assert.equal(slotLabel('intron:3-4'), 'intron 3-4');
        assert.equal(slotLabel('promoter:P'), 'promoter');
        assert.equal(slotLabel('downstream:▸'), 'downstream');
        assert.equal(slotLabel('bin:37'), 'genomic bin');
        assert.equal(slotLabel('weird'), 'weird');
    });
});
