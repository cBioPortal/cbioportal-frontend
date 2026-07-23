import { assert } from 'chai';
import { mount } from 'enzyme';
import { runInAction } from 'mobx';
import * as React from 'react';
import FusionComparisonView, {
    FUSION_BREAKPOINT_FILTER_KEY,
} from './FusionComparisonView';
import { sampleFusionViewerHref } from './data/cohortLinks';
import { FusionCohortStore } from './FusionCohortStore';
import { TranscriptData } from './data/types';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => Promise.resolve([])),
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function tx(gene: string): TranscriptData {
    return {
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
            { number: 3, start: 400, end: 500 },
        ],
        isForteSelected: true,
        domains: [],
        utrs: [],
    };
}

describe('FusionComparisonView', () => {
    it('renders the histogram-mode toggle and reacts to store anchor', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 100,
            } as any,
        ]);
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(
            wrapper.find('[data-testid="trackmode-feature"]').hostNodes(),
            1
        );
    });

    it('the histogram mode toggle switches the store between feature and genomic', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.equal(store.trackMode, 'feature');
        wrapper
            .find('[data-testid="trackmode-genomic"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.trackMode, 'genomic');
        wrapper
            .find('[data-testid="trackmode-feature"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.trackMode, 'feature');
    });

    it('clicking a fusion-summary-row sets store.anchor to the pair', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 100,
            } as any,
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S2',
                site1Position: 100,
            } as any,
        ]);
        const wrapper = mount(<FusionComparisonView store={store} />);
        const row = wrapper
            .find('[data-testid="fusion-summary-row"]')
            .hostNodes()
            .first();
        row.simulate('click');
        assert.isDefined(store.anchor);
        assert.equal(store.anchor!.mode, 'pair');
    });

    it('maps a clicked bar to distinct SampleIdentifiers (with studyId) and calls the filter callback', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S2',
                studyId: 'study_b',
                site1Position: 200,
            } as any,
        ]);
        const spy = jest.fn();
        const wrapper = mount(
            <FusionComparisonView store={store} onFilterCohortBySamples={spy} />
        );
        const instance = wrapper.instance() as any;

        // Rows for this pair anchor, in the same order the ruler bins them.
        const rows = store.comparisonRows;
        const sampleIds = rows.map(r => r.sampleId);
        // Click a bar whose members are row indices 0 and 1.
        instance.handleSelectBar(
            sampleIds,
            { members: [0, 1], label: 'E1' },
            'TMPRSS2'
        );

        assert.isTrue(spy.mock.calls.length === 1);
        const [filterKey, label, samples] = spy.mock.calls[0];
        assert.equal(filterKey, FUSION_BREAKPOINT_FILTER_KEY);
        assert.include(label, 'E1');
        assert.deepEqual(
            samples
                .slice()
                .sort((a: any, b: any) => a.sampleId.localeCompare(b.sampleId)),
            [
                { studyId: 'study_a', sampleId: 'S1' },
                { studyId: 'study_b', sampleId: 'S2' },
            ]
        );
    });

    it('dedupes samples and skips out-of-range member indices', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
        ]);
        const spy = jest.fn();
        const wrapper = mount(
            <FusionComparisonView store={store} onFilterCohortBySamples={spy} />
        );
        const instance = wrapper.instance() as any;
        // members reference the same sample twice + an undefined index.
        instance.handleSelectBar(
            ['S1', 'S1'],
            { members: [0, 1, 99], label: 'E1' },
            'TMPRSS2'
        );
        const [, , samples] = spy.mock.calls[0];
        assert.deepEqual(samples, [{ studyId: 'study_a', sampleId: 'S1' }]);
    });

    it('does not spin-loop when a gene resolves to nothing (bounded fetch, retry deferred)', async () => {
        // The mocked fetch returns [] for every gene (the "unresolved" path).
        const mockFetch = (fetchTranscriptsForGeneWithFallback as unknown) as jest.Mock;
        mockFetch.mockClear();
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 100,
            } as any,
        ]);
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        await flush();
        await flush();
        const calls = mockFetch.mock.calls.length;
        assert.isAbove(calls, 0, 'fetched on mount');
        // No synchronous refetch spin: bounded to ~the distinct requests, and
        // the no-progress retry is deferred behind a backoff timer (not fired
        // in this short window). The old infinite-loop bug blew this up.
        assert.isBelow(calls, 20, 'no synchronous spin-loop');
        await flush();
        assert.isBelow(mockFetch.mock.calls.length, 20);
        // Clear the pending backoff timer.
        wrapper.unmount();
    });

    it('the strip-mode toggle switches store.stripMode (default collapsed)', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.equal(store.stripMode, 'collapsed');
        wrapper
            .find('[data-testid="stripmode-dense"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.stripMode, 'dense');
        wrapper
            .find('[data-testid="stripmode-sample"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.stripMode, 'sample');
    });

    it('junction-mode buttons update store.junctionLabelMode', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        wrapper
            .find('[data-testid="junctionmode-gutter"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.junctionLabelMode, 'gutter');
    });

    it('collapsedGroups groups structurally-identical rows into one ×N group', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 250,
                site2Position: 250,
            } as any,
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S2',
                site1Position: 260,
                site2Position: 240,
            } as any,
        ]);
        store.setCollapseKindOverride('exonStructure');
        const wrapper = mount(<FusionComparisonView store={store} />);
        const instance = wrapper.instance() as any;
        // Provide the canonical transcripts the exon-structure key needs.
        runInAction(() => {
            instance.transcriptsByKey = new Map([
                ['GRCh38|TMPRSS2|', tx('TMPRSS2')],
                ['GRCh38|ERG|', tx('ERG')],
            ]);
        });
        const groups = instance.collapsedGroups;
        // Both samples retain the same exon sets → one group of 2.
        assert.lengthOf(groups, 1);
        assert.equal(groups[0].count, 2);
        assert.deepEqual(groups[0].sampleIds.slice().sort(), ['S1', 'S2']);
    });

    it('handleSelectGroup maps a group to distinct SampleIdentifiers and filters', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
        ]);
        const spy = jest.fn();
        const wrapper = mount(
            <FusionComparisonView store={store} onFilterCohortBySamples={spy} />
        );
        const instance = wrapper.instance() as any;
        instance.handleSelectGroup({
            key: '5p:1|3p:1',
            count: 2,
            sampleIds: ['S1', 'S1'],
            representative: {} as any,
            frames: { inFrame: 2, outOfFrame: 0, unknown: 0 },
        });
        assert.equal(spy.mock.calls.length, 1);
        const [filterKey, , samples] = spy.mock.calls[0];
        assert.equal(filterKey, FUSION_BREAKPOINT_FILTER_KEY);
        assert.deepEqual(samples, [{ studyId: 'study_a', sampleId: 'S1' }]);
    });

    it('does not throw when no filter callback is provided', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
        ]);
        const wrapper = mount(<FusionComparisonView store={store} />);
        const instance = wrapper.instance() as any;
        instance.handleSelectBar(
            ['S1'],
            { members: [0], label: 'E1' },
            'TMPRSS2'
        );
        // no throw, nothing to assert beyond reaching here
        assert.isTrue(true);
    });

    it('histogramTranscriptForGene returns the override when set and loaded', () => {
        const store = new FusionCohortStore();
        const view = new FusionComparisonView({ store } as any);
        const canonical = {
            transcriptId: 'ENST_CANON',
            displayName: 'ENST_CANON (canonical)',
        } as any;
        const alt = {
            transcriptId: 'ENST_ALT',
            displayName: 'ENST_ALT',
        } as any;
        view.transcriptOptionsByGene = new Map([
            [`${store.genomeBuild}|TMPRSS2`, [canonical, alt]],
        ]);
        // No override → undefined (caller falls back to canonical anchorTranscript).
        assert.isUndefined(view.histogramTranscriptForGene('TMPRSS2'));
        store.setHistogramTranscript('TMPRSS2', 'ENST_ALT');
        assert.equal(view.histogramTranscriptForGene('TMPRSS2'), alt);
    });

    it('renderTranscriptPicker changes the histogram transcript override', () => {
        const store = new FusionCohortStore();
        const view = new FusionComparisonView({ store } as any);
        const canonical = {
            transcriptId: 'ENST_CANON',
            displayName: 'ENST_CANON (canonical)',
        } as any;
        const alt = {
            transcriptId: 'ENST_ALT',
            displayName: 'ENST_ALT',
        } as any;
        view.transcriptOptionsByGene = new Map([
            [`${store.genomeBuild}|TMPRSS2`, [canonical, alt]],
        ]);
        const picker = mount(
            view.renderTranscriptPicker('TMPRSS2') as React.ReactElement
        );
        picker
            .find('[data-testid="histogram-tx-TMPRSS2"]')
            .hostNodes()
            .simulate('change', { target: { value: 'ENST_ALT' } });
        assert.equal(
            store.histogramTranscriptIdByGene.get('TMPRSS2'),
            'ENST_ALT'
        );
    });

    it('renderTranscriptPicker returns null for a single-transcript gene', () => {
        const store = new FusionCohortStore();
        const view = new FusionComparisonView({ store } as any);
        view.transcriptOptionsByGene = new Map([
            [
                `${store.genomeBuild}|SOLO`,
                [{ transcriptId: 'X', displayName: 'X' } as any],
            ],
        ]);
        assert.isNull(view.renderTranscriptPicker('SOLO'));
    });

    it('hides the "Histogram transcript:" label row when neither gene has a picker', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 250,
                site2Position: 250,
            } as any,
        ]);
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        const instance = wrapper.instance() as any;
        // Canonical transcripts loaded (so anchorTranscript is truthy and the
        // tracks render), but no transcriptOptionsByGene entries — so both
        // renderTranscriptPicker calls return null and the label row must be
        // gated off entirely.
        runInAction(() => {
            instance.transcriptsByKey = new Map([
                ['GRCh38|TMPRSS2|', tx('TMPRSS2')],
                ['GRCh38|ERG|', tx('ERG')],
            ]);
        });
        wrapper.update();
        assert.isNull(instance.renderTranscriptPicker('TMPRSS2'));
        assert.isNull(instance.renderTranscriptPicker('ERG'));
        assert.lengthOf(
            wrapper.findWhere(
                n => n.type() === 'span' && n.text() === 'Histogram transcript:'
            ),
            0
        );
    });

    it('renderTranscriptPicker defaults to transcriptForGene when neither option is tagged (canonical)', () => {
        const store = new FusionCohortStore();
        const view = new FusionComparisonView({ store } as any);
        const first = {
            transcriptId: 'ENST_FIRST',
            displayName: 'ENST_FIRST',
        } as any;
        const second = {
            transcriptId: 'ENST_SECOND',
            displayName: 'ENST_SECOND',
        } as any;
        view.transcriptOptionsByGene = new Map([
            [`${store.genomeBuild}|GENE`, [first, second]],
        ]);
        // transcriptForGene resolves via transcriptsByKey under the
        // canonical-keyed (empty transcriptId) txKey.
        view.transcriptsByKey = new Map([
            [`${store.genomeBuild}|GENE|`, second],
        ]);
        const picker = mount(
            view.renderTranscriptPicker('GENE') as React.ReactElement
        );
        assert.equal(
            picker
                .find('[data-testid="histogram-tx-GENE"]')
                .hostNodes()
                .prop('value'),
            'ENST_SECOND'
        );
    });

    it('expanded panel shows a header with sample name, gene pair, frame, and a fusion-viewer link', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
        ]);
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        const view = wrapper.instance() as any;
        runInAction(() => {
            view.expandedSampleId = 'S1';
        });
        wrapper.update();

        const header = wrapper
            .find('[data-testid="expanded-header"]')
            .hostNodes();
        assert.equal(header.length, 1);
        assert.include(header.text(), 'S1');
        assert.include(header.text(), 'TMPRSS2'); // gene pair 5′ symbol
        // Unknown frame reads with explicit context, not a bare "Unknown".
        assert.include(header.text(), 'Unknown frame status');

        const link = wrapper
            .find('[data-testid="expanded-fusion-link"]')
            .hostNodes();
        assert.equal(link.length, 1);
        assert.equal(link.prop('target'), '_blank');
        assert.equal(
            link.prop('href'),
            sampleFusionViewerHref('study_a', 'S1')
        );
    });

    it('expanded header omits the link when studyId is unresolved', () => {
        const store = new FusionCohortStore();
        const view = new FusionComparisonView({ store } as any);
        // No structuralVariants → studyIdBySampleId is empty → helper method
        // returns undefined for any sample.
        assert.isUndefined(view.expandedSampleLink('UNKNOWN_SAMPLE'));
    });
});
