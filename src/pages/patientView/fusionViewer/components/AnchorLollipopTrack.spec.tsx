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
});
