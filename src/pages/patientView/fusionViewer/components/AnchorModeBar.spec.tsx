import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import ReactSelect from 'react-select';
import AnchorModeBar, { geneOptionFilter } from './AnchorModeBar';
import { FusionCohortStore } from '../FusionCohortStore';

jest.mock('../data/structuralVariantAdapter', () => ({
    convertStructuralVariantsToFusionEvents: jest.fn((svs: any[]) => svs),
}));

const site = (symbol: string) => ({
    symbol,
    chromosome: '2',
    position: 1,
    selectedTranscriptId: '',
    siteDescription: '',
});
const ev = (s: string, a: string, b: string | null) => ({
    id: `${s}${a}${b}`,
    tumorId: s,
    gene1: site(a),
    gene2: b ? site(b) : null,
    frameCallMethod: '',
    callMethod: '',
});

function store() {
    const st = new FusionCohortStore();
    st.setStructuralVariants([
        ev('S1', 'EML4', 'ALK'),
        ev('S2', 'KIF5B', 'ALK'),
        ev('S3', 'ALK', 'PTPN3'),
    ] as any);
    st.setAnchor({ mode: 'pair', key: 'ALK::EML4' });
    return st;
}

describe('AnchorModeBar', () => {
    it('hides gene and side controls in Pair mode', () => {
        const w = mount(<AnchorModeBar store={store()} />);
        assert.isFalse(w.find('[data-testid="anchor-gene-select"]').exists());
    });

    it('switching to Gene picks the busiest gene of the pair, auto side', () => {
        const st = store();
        const w = mount(<AnchorModeBar store={st} />);
        w.find('button[data-testid="anchor-mode-gene"]').simulate('click');
        assert.deepEqual(st.anchor, { mode: 'gene', gene: 'ALK', side: '3p' });
        w.update();
        assert.isTrue(w.find('[data-testid="anchor-gene-select"]').exists());
        const note = w.find('[data-testid="anchor-opposite-note"]');
        assert.include(note.text(), '1 event with ALK as 5′');
    });

    it('clicking the note flips the side', () => {
        const st = store();
        st.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
        const w = mount(<AnchorModeBar store={st} />);
        w.find('[data-testid="anchor-opposite-note"]').simulate('click');
        assert.equal((st.anchor as any).side, '5p');
    });

    it('geneOptionFilter matches the symbol prefix only, case-insensitively', () => {
        const alk = { value: 'ALK', label: 'ALK (1088 samples)' };
        const eml4 = { value: 'EML4', label: 'EML4 (3 samples)' };
        assert.isTrue(geneOptionFilter(alk, 'al'));
        assert.isFalse(geneOptionFilter(eml4, 'al'));
        assert.isFalse(geneOptionFilter(alk, '1'));
        assert.isFalse(geneOptionFilter(eml4, 'ml'));
        assert.isTrue(geneOptionFilter(alk, ''));
        assert.isTrue(geneOptionFilter(eml4, ''));
    });

    it('selecting an option in the gene picker sets the anchor gene', () => {
        const st = store();
        st.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
        const w = mount(<AnchorModeBar store={st} />);
        const sel = w.find(ReactSelect);
        assert.equal((sel.prop('value') as any).value, 'ALK');
        assert.deepEqual(
            (sel.prop('options') as any[]).map(o => o.value).sort(),
            ['ALK', 'EML4', 'KIF5B', 'PTPN3']
        );
        (sel.prop('onChange') as any)({ value: 'EML4', label: 'EML4' });
        assert.equal((st.anchor as any).gene, 'EML4');
    });
});
