import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import AnchorLollipopTrack from './AnchorLollipopTrack';
import { LollipopStick } from '../data/linkAggregation';

const stick = (
    key: string,
    x: number,
    cats: [string, number][]
): LollipopStick => ({
    key,
    x,
    width: 20,
    span: { gStart: 1000, gEnd: 2000 },
    sampleIds: [],
    sampleCount: Math.max(...cats.map(c => c[1])),
    byCategory: cats.map(([category, sampleCount]) => ({
        category,
        sampleCount,
    })),
});

describe('AnchorLollipopTrack', () => {
    const sticks = [
        stick('intron:19-20', 300, [
            ['EML4', 15],
            ['KIF5B', 3],
        ]),
        stick('exon:E20', 320, [['EML4', 2]]),
    ];

    it('one stick per slot; taller for more samples; pie only when mixed', () => {
        const w = mount(
            <svg>
                <AnchorLollipopTrack sticks={sticks} colorOf={() => '#000'} />
            </svg>
        );
        assert.lengthOf(w.find('g[data-testid="lollipop-stick"]'), 2);
        const y = (k: string) =>
            Number(w.find(`g[data-key="${k}"] line`).prop('y2'));
        assert.isBelow(y('intron:19-20'), y('exon:E20')); // higher on screen
        assert.lengthOf(
            w.find(
                'g[data-key="intron:19-20"] path[data-testid="lollipop-slice"]'
            ),
            2
        );
        assert.lengthOf(
            w.find(
                'g[data-key="exon:E20"] circle[data-testid="lollipop-head"]'
            ),
            1
        );
    });

    it('click selects the stick', () => {
        let picked = '';
        const w = mount(
            <svg>
                <AnchorLollipopTrack
                    sticks={sticks}
                    colorOf={() => '#000'}
                    onSelect={s => (picked = s.key)}
                />
            </svg>
        );
        w.find('g[data-key="exon:E20"]').simulate('click');
        assert.equal(picked, 'exon:E20');
    });

    it('tooltip shows slot label, genomic span, total and category counts', () => {
        const w = mount(
            <svg>
                <AnchorLollipopTrack
                    sticks={sticks}
                    colorOf={() => '#000'}
                    categoryLabel={c => c.toLowerCase()}
                />
            </svg>
        );
        const t = w.find('g[data-key="intron:19-20"] title').text();
        assert.include(t, 'intron 19-20');
        assert.notInclude(t, 'intron:19-20');
        assert.include(
            t,
            `${(1000).toLocaleString()}–${(2000).toLocaleString()}`
        );
        assert.include(t, '15 samples');
        assert.include(t, 'eml4 15');
        assert.include(t, 'kif5b 3');
    });

    it('head radius is bounded by the slot width and heads are outlined', () => {
        const narrow = { ...stick('exon:E1', 50, [['EML4', 100]]), width: 10 };
        const w = mount(
            <svg>
                <AnchorLollipopTrack sticks={[narrow]} colorOf={() => '#eee'} />
            </svg>
        );
        const head = w.find('circle[data-testid="lollipop-head"]');
        assert.equal(head.prop('r'), 6);
        assert.equal(head.prop('stroke'), '#999');
    });
});
