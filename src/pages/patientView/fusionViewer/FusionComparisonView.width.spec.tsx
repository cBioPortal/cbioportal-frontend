import { assert } from 'chai';
import { mount } from 'enzyme';
import { runInAction } from 'mobx';
import * as React from 'react';
import FusionComparisonView from './FusionComparisonView';
import { FusionCohortStore } from './FusionCohortStore';
import { TranscriptData } from './data/types';

// Separate file so the WindowStore mock cannot disturb the other view specs.
jest.mock('shared/components/window/WindowStore', () => {
    const { observable: obs } = require('mobx');
    return {
        __esModule: true,
        default: { size: obs({ width: 1200, height: 800 }) },
    };
});
jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => Promise.resolve([])),
}));

function tx(gene: string): TranscriptData {
    return {
        genomeBuild: 'GRCh38',
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 200, end: 300 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

describe('FusionComparisonView width change', () => {
    it('clears linked hover when the window width changes', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 50,
                site2Position: 250,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
        ] as any);
        store.mergeTranscripts([
            ['GRCh38|TMPRSS2|', tx('TMPRSS2')],
            ['GRCh38|ERG|', tx('ERG')],
        ]);
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        w.find('rect[data-testid="feature-bar"]')
            .first()
            .simulate('mouseenter');
        assert.isDefined(view.linkHover.matcher);
        // jest.mock factories can't close over imports; re-import the mock.
        const WindowStore = require('shared/components/window/WindowStore')
            .default;
        runInAction(() => {
            WindowStore.size.width = 1000;
        });
        assert.isUndefined(view.linkHover.matcher);
        w.unmount();
    });
});
