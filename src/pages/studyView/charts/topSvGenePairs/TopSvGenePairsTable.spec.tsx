import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import TopSvGenePairsTable from './TopSvGenePairsTable';
import { SvGenePairRow } from './svGenePairData';

function makeRow(
    key: string,
    count: number,
    studyId = 'study1'
): SvGenePairRow {
    const [gene1, gene2] = key.split('::');
    return {
        uniqueKey: key,
        gene1,
        gene2,
        sampleCount: count,
        sampleIdentifiers: [{ studyId, sampleId: 'S1' }],
    };
}

describe('TopSvGenePairsTable', () => {
    it('renders rows for each pair in promise result', () => {
        const rows = [makeRow('ERG::TMPRSS2', 5), makeRow('BCR::ABL1', 3)];
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        assert.equal(
            wrapper.find('[data-testid="sv-pair-row"]').hostNodes().length,
            2
        );
    });

    it('calls onSelectPair with the correct row when clicked', () => {
        const rows = [makeRow('ERG::TMPRSS2', 5), makeRow('BCR::ABL1', 3)];
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        let picked: SvGenePairRow | null = null;
        const wrapper = mount(
            <TopSvGenePairsTable
                promise={promise}
                onSelectPair={r => (picked = r)}
            />
        );
        wrapper
            .find('[data-testid="sv-pair-row"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.isNotNull(picked);
        assert.equal(picked!.uniqueKey, 'ERG::TMPRSS2');
    });

    it('shows loading text when promise is pending', () => {
        const promise = {
            isComplete: false,
            isPending: true,
            result: undefined,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        assert.include(wrapper.text(), 'Loading');
        assert.equal(
            wrapper.find('[data-testid="sv-pair-row"]').hostNodes().length,
            0
        );
    });

    it('limits display to 15 rows', () => {
        const rows = Array.from({ length: 20 }, (_, i) =>
            makeRow(`GENE${i}A::GENE${i}B`, 20 - i)
        );
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        assert.equal(
            wrapper.find('[data-testid="sv-pair-row"]').hostNodes().length,
            15
        );
    });
});
