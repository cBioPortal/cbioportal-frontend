import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import AnchorLollipopTrack, {
    LollipopTooltipContent,
} from './AnchorLollipopTrack';
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

    it('uses a styled tooltip instead of a native <title>', () => {
        const w = mount(
            <svg>
                <AnchorLollipopTrack sticks={sticks} colorOf={() => '#000'} />
            </svg>
        );
        assert.lengthOf(w.find('g[data-key="intron:19-20"] title'), 0);
        assert.isTrue(w.find('DefaultTooltip').exists());
    });

    it('tooltip shows gene + slot, chr span, total and per-category rows', () => {
        const w = mount(
            <LollipopTooltipContent
                stick={sticks[0]}
                gene="ALK"
                chromosome="2"
                colorOf={c => (c === 'EML4' ? '#123456' : '#654321')}
                categoryLabel={c => c.toLowerCase()}
            />
        );
        const t = w.text();
        assert.include(t, 'ALK · intron 19-20');
        assert.notInclude(t, 'intron:19-20');
        assert.include(
            t,
            `chr2:${(1000).toLocaleString()}–${(2000).toLocaleString()}`
        );
        assert.include(t, '15 samples');
        const rows = w.find('[data-testid="lollipop-tip-row"]');
        assert.lengthOf(rows, 2);
        assert.include(rows.at(0).text(), 'eml4');
        assert.include(rows.at(0).text(), '15');
        assert.include(rows.at(1).text(), 'kif5b');
        assert.equal(
            rows
                .at(0)
                .find('[data-testid="lollipop-tip-swatch"]')
                .prop('style')!.background,
            '#123456'
        );
        assert.notInclude(t, 'Click');
    });

    it('caps the partner rows and offers the click hint when selectable', () => {
        const many = stick(
            'exon:E20',
            0,
            Array.from({ length: 11 }, (_, i): [string, number] => [
                `G${i + 10}`,
                11 - i,
            ])
        );
        const w = mount(
            <LollipopTooltipContent
                stick={many}
                colorOf={() => '#000'}
                selectable
            />
        );
        assert.lengthOf(w.find('[data-testid="lollipop-tip-row"]'), 8);
        assert.include(w.text(), '+3 more');
        assert.include(w.text(), 'Click to filter to these 11 samples');
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
