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
import AnchorGeneTrackRuler from './components/AnchorGeneTrackRuler';
import FusionStripList from './components/FusionStripList';
import { computeComparisonFrame } from './components/comparisonFrame';
import WindowStore from 'shared/components/window/WindowStore';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => Promise.resolve([])),
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

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
            { number: 3, start: 400, end: 500 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
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
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(
            wrapper.find('[data-testid="trackmode-feature"]').hostNodes(),
            1
        );
    });

    it('the histogram mode toggle switches the store between feature and genomic', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
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

    it('clicking a pair row sets store.anchor to the pair', () => {
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
            .find('[data-test="pair-row-ERG::TMPRSS2"]')
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
        const rows = store.anchorRows;
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
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
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
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
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
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
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
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
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

// Mounts with a resolved anchor transcript (injected synchronously, same
// pattern as the 'collapsedGroups' test above) so `anchorTranscript` is
// defined without waiting on the mocked async fetch.
function mountView() {
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
    store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
    const wrapper = mount(<FusionComparisonView store={store} />);
    const instance = wrapper.instance() as any;
    runInAction(() => {
        instance.transcriptsByKey = new Map([
            ['GRCh38|TMPRSS2|', tx('TMPRSS2')],
            ['GRCh38|ERG|', tx('ERG')],
        ]);
    });
    wrapper.update();
    return { wrapper, store };
}

describe('FusionComparisonView exon ladder controls', () => {
    it('the exon mode toggle writes to the store', () => {
        const { wrapper, store } = mountView();
        wrapper
            .find('[data-testid="exonmode-full"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.exonMode, 'full');
    });

    it('hides the ladder toggle while exonMode is retained', () => {
        const { wrapper } = mountView();
        assert.equal(
            wrapper.find('[data-testid="laddermode-reference"]').hostNodes()
                .length,
            0
        );
    });

    it('shows the ladder toggle once full transcript is selected', () => {
        const { wrapper, store } = mountView();
        store.setExonMode('full');
        wrapper.update();
        assert.isAbove(
            wrapper.find('[data-testid="laddermode-reference"]').hostNodes()
                .length,
            0
        );
    });

    it('renders the exon ruler only for the reference ladder', () => {
        const { wrapper, store } = mountView();
        store.setExonMode('full');
        wrapper.update();
        assert.isAbove(wrapper.find('ExonRuler').length, 0);
        store.setLadderMode('perRow');
        wrapper.update();
        assert.equal(wrapper.find('ExonRuler').length, 0);
    });
});

describe('FusionComparisonView gene mode', () => {
    function alkStore() {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'EML4',
                site2HugoSymbol: 'ALK',
                sampleId: 'S1',
                site1Position: 100,
                site2Position: 450,
                site1Chromosome: '2',
                site2Chromosome: '2',
            },
            {
                site1HugoSymbol: 'KIF5B',
                site2HugoSymbol: 'ALK',
                sampleId: 'S2',
                site1Position: 120,
                site2Position: 250,
                site1Chromosome: '10',
                site2Chromosome: '2',
            },
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S3',
                site1Position: 100,
                site2Position: 900,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
        ] as any);
        store.mergeTranscripts([
            ['GRCh38|ALK|', tx('ALK')],
            ['GRCh38|EML4|', tx('EML4')],
            ['GRCh38|KIF5B|', tx('KIF5B')],
        ]);
        return store;
    }

    it('3′ gene anchor: no TMPRSS2-ERG rows, partner half captioned, no dominant partner', () => {
        const store = alkStore();
        store.setAnchor({ mode: 'gene', gene: 'ALK', side: 'auto' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        const view = wrapper.instance() as any;
        assert.equal(view.anchorSide, '3p');
        assert.isNull(view.partnerGene);
        assert.notInclude(
            view.orientedRows.map((r: any) => r.sampleId),
            'S3'
        );
        assert.isTrue(
            wrapper.find('[data-testid="partners-vary-caption"]').exists()
        );
    });

    const exonSum = (t: TranscriptData) =>
        t.exons.reduce((n, e) => n + Math.max(1, e.end - e.start), 0);
    const withExons = (
        gene: string,
        exons: [number, number][]
    ): TranscriptData => ({
        ...tx(gene),
        exons: exons.map(([start, end], i) => ({
            number: i + 1,
            start,
            end,
        })),
    });
    const alk3pStore = () => {
        const store = alkStore();
        store.mergeTranscripts([
            [
                'GRCh38|KIF5B|',
                withExons('KIF5B', [
                    [0, 300],
                    [400, 900],
                ]),
            ],
            ['GRCh38|EML4|', withExons('EML4', [[0, 150]])],
            [
                'GRCh38|ALK|',
                withExons('ALK', [
                    [0, 70],
                    [200, 300],
                    [400, 500],
                ]),
            ],
        ]);
        store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
        return store;
    };

    it('3′ anchor scale goes to bp3; 5′ scale is the longest partner transcript', () => {
        const store = alk3pStore();
        const view = mount(
            <FusionComparisonView store={store} />
        ).instance() as any;
        const { bp5, bp3 } = view.maxRetainedBp;
        assert.equal(bp3, exonSum(store.transcriptForGene('ALK')!));
        assert.equal(bp5, exonSum(store.transcriptForGene('KIF5B')!));
        assert.notEqual(bp3, bp5);
    });

    it('3′ anchor ruler sits in the right half with 3′ breakpoints', () => {
        const store = alk3pStore();
        const wrapper = mount(<FusionComparisonView store={store} />);
        const view = wrapper.instance() as any;
        const width = Math.max(900, WindowStore.size.width - 90);
        const frame = computeComparisonFrame(width);
        const ruler = wrapper
            .find(AnchorGeneTrackRuler)
            .filterWhere(n => n.prop('symbol') === 'ALK');
        assert.lengthOf(ruler, 1);
        assert.equal(ruler.prop('drawX'), frame.junctionX + 8);
        assert.equal(ruler.prop('labelAnchor'), 'start');
        const expected = view.orientedRows.map((r: any) => r.partnerBreakpoint);
        assert.sameMembers(expected, [450, 250]);
        assert.deepEqual(ruler.prop('breakpoints'), expected);
    });

    it('strip list gets the anchor transcript in the 3′ reference slot only', () => {
        const store = alk3pStore();
        const wrapper = mount(<FusionComparisonView store={store} />);
        const strips = wrapper.find(FusionStripList);
        assert.equal(
            strips.prop('referenceTranscript3p'),
            store.transcriptForGene('ALK')
        );
        assert.isUndefined(strips.prop('referenceTranscript5p'));
    });

    function collapseView(alkPositions: [number, number]) {
        const store = new FusionCohortStore();
        store.setStructuralVariants(
            [
                ['EML4', 'S1', alkPositions[0]],
                ['KIF5B', 'S2', alkPositions[1]],
            ].map(([g, id, pos]) => ({
                site1HugoSymbol: g,
                site2HugoSymbol: 'ALK',
                sampleId: id,
                site1Position: 50,
                site2Position: pos,
                site1Chromosome: '2',
                site2Chromosome: '2',
            })) as any
        );
        store.mergeTranscripts([
            ['GRCh38|ALK|', tx('ALK')],
            ['GRCh38|EML4|', tx('EML4')],
            ['GRCh38|KIF5B|', tx('KIF5B')],
        ]);
        store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
        return {
            store,
            view: mount(
                <FusionComparisonView store={store} />
            ).instance() as any,
        };
    }

    it('exon-structure collapse keeps different partners apart in Gene mode', () => {
        const { store, view } = collapseView([450, 450]);
        store.setCollapseKindOverride('exonStructure');
        const keys = view.collapsedGroups.map((g: any) => g.key).sort();
        assert.lengthOf(keys, 2);
        assert.match(keys[0], /^EML4\|/);
        assert.match(keys[1], /^KIF5B\|/);
    });

    it('breakpoint-feature collapse groups by the ALK (3′) breakpoint', () => {
        const { store, view } = collapseView([450, 250]);
        store.setCollapseKindOverride('breakpointFeature');
        // Partner breakpoints are identical (50); only the ALK side differs.
        assert.lengthOf(view.collapsedGroups, 2);
        const same = collapseView([450, 450]);
        same.store.setCollapseKindOverride('breakpointFeature');
        assert.lengthOf(same.view.collapsedGroups, 1);
    });

    it.skip('does not replace a pending seed with an auto pair anchor', () => {
        const store = new FusionCohortStore();
        (store as any).seedFromStudyFilter(['ALK'], false); // Task 8 API; data not ready
        mount(<FusionComparisonView store={store} />);
        assert.isFalse(store.hasAnchorSelection);
    });
});
