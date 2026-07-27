import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { FusionInfoBar } from './FusionInfoBar';
import { FusionEvent } from './data/types';

function makeFusion(): FusionEvent {
    return {
        id: 'fusion-1',
        tumorId: 'tumor-1',
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 42880000,
            selectedTranscriptId: 'ENST_A',
            siteDescription: 'exon',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 39956000,
            selectedTranscriptId: 'ENST_B',
            siteDescription: 'exon',
        },
        fusion: 'TMPRSS2::ERG',
        totalReadSupport: 10,
        callMethod: '',
        frameCallMethod: '',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '5to3',
        svIdiom: 'INTRACHROM_FUSION',
        frame: 'UNKNOWN',
        isRnaDerived: true,
    };
}

function makeStore() {
    const fusion = makeFusion();
    return {
        canonicalFusion: fusion,
        fusions: [fusion],
        selectedFusionId: fusion.id,
        genomeBuild: 'GRCh38' as const,
        selectFusion: () => {},
        canonicalTranscripts5p: [],
        canonicalTranscripts3p: [],
        effectiveSelected5pIds: new Set<string>(),
        effectiveSelected3pIds: new Set<string>(),
        transcriptsLoading: false,
        showPromoter: false,
        toggleShowPromoter: () => {},
        toggleTranscript5p: () => {},
        toggleTranscript3p: () => {},
    };
}

describe('FusionInfoBar', () => {
    it('mounts a FusionCircos inside the transcript row', () => {
        const wrapper = mount(<FusionInfoBar store={makeStore() as any} />);
        assert.equal(wrapper.find('FusionCircos').length, 1);
    });

    it('passes the store fusions/selection through to FusionCircos', () => {
        const store = makeStore();
        const wrapper = mount(<FusionInfoBar store={store as any} />);
        const circos = wrapper.find('FusionCircos');
        assert.equal(circos.prop('selectedFusionId'), store.selectedFusionId);
        assert.equal(circos.prop('genomeBuild'), store.genomeBuild);
        assert.deepEqual(circos.prop('fusions'), store.fusions);
    });
});
