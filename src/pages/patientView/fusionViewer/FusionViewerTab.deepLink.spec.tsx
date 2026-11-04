import { assert } from 'chai';
import * as React from 'react';
import { shallow } from 'enzyme';
import { FusionViewerTab } from './FusionViewerTab';

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => new Promise(() => {})),
}));

jest.mock('./data/structuralVariantAdapter', () => ({
    convertStructuralVariantsToFusionEvents: jest.fn((svs: any[]) => svs),
}));

const fusions = [
    { id: 'f1', gene1: { symbol: 'A' }, gene2: null },
    { id: 'f2', gene1: { symbol: 'B' }, gene2: null },
] as any[];

function storeOf(wrapper: any) {
    return (wrapper.instance() as any).store;
}

describe('FusionViewerTab URL deep link', () => {
    it('opens on the fusionId prop', () => {
        const w = shallow(
            <FusionViewerTab structuralVariants={fusions} fusionId="f2" />
        );
        assert.equal(storeOf(w).selectedFusionId, 'f2');
    });

    it('reports user selections but not the initial one', () => {
        const onFusionSelected = jest.fn();
        const w = shallow(
            <FusionViewerTab
                structuralVariants={fusions}
                fusionId="f1"
                onFusionSelected={onFusionSelected}
            />
        );
        assert.equal(onFusionSelected.mock.calls.length, 0);
        storeOf(w).selectFusion('f2');
        assert.deepEqual(onFusionSelected.mock.calls, [['f2']]);
    });

    it('follows a fusionId prop change (back/forward)', () => {
        const w = shallow(
            <FusionViewerTab structuralVariants={fusions} fusionId="f1" />
        );
        w.setProps({ fusionId: 'f2' });
        assert.equal(storeOf(w).selectedFusionId, 'f2');
    });
});
