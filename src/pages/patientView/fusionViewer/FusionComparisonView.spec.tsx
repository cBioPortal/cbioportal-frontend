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
import { frameStatusStyle } from './components/frameStatusStyle';
import AnchorGeneTrackRuler from './components/AnchorGeneTrackRuler';
import FusionStripList from './components/FusionStripList';
import { PARTNER_TEXT_OFFSET } from './components/FusionProductStrip';
import {
    computeComparisonFrame,
    PARTNER_RIGHT_GUTTER,
} from './components/comparisonFrame';
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
        // Entering Gene mode selects Lollipop (Phase 3).
        assert.equal(store.trackMode, 'lollipop');
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

    it('has no junction-label toggle (labels are always inline)', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.notInclude(wrapper.text(), 'Junction labels');
        assert.lengthOf(
            wrapper.find('[data-testid^="junctionmode-"]').hostNodes(),
            0
        );
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
            members: [],
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
// The lollipop's styled tooltip only renders on hover; read its overlay.
function lollipopTip(w: any, key: string): React.ReactElement {
    return w
        .find('DefaultTooltip')
        .filterWhere((t: any) => t.find(`g[data-key="${key}"]`).exists())
        .first()
        .prop('overlay');
}

function lollipopTipText(w: any, key: string): string {
    return mount(lollipopTip(w, key)).text();
}

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

    it('renders lollipop sticks instead of histogram bars in Gene mode', () => {
        const store = alkStore();
        store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
        const w = mount(<FusionComparisonView store={store} />);
        assert.isAbove(w.find('g[data-testid="lollipop-stick"]').length, 0);
        assert.lengthOf(w.find('rect[data-testid="feature-bar"]'), 0);
        assert.isTrue(
            w.find('select[data-testid="lollipop-colorby"]').exists()
        );
    });

    it('Genomic axis hides the lollipop; Pair mode has no Lollipop button', () => {
        const store = alkStore();
        store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
        const w = mount(<FusionComparisonView store={store} />);
        runInAction(() => store.setTrackMode('genomic'));
        w.update();
        assert.lengthOf(w.find('g[data-testid="lollipop-stick"]'), 0);
        assert.isTrue(
            w.find('button[data-testid="trackmode-lollipop"]').exists()
        );
        runInAction(() => store.setAnchorMode('pair'));
        w.update();
        assert.isFalse(
            w.find('button[data-testid="trackmode-lollipop"]').exists()
        );
    });

    function lolliStore(side: '5p' | '3p', evs: any[]) {
        const store = new FusionCohortStore();
        store.setStructuralVariants(
            evs.map(e =>
                side === '3p'
                    ? {
                          site1HugoSymbol: e.partner,
                          site2HugoSymbol: 'ALK',
                          sampleId: e.id,
                          site1Position: 100,
                          site2Position: e.pos,
                          site1Chromosome: '2',
                          site2Chromosome: '2',
                          variantClass: e.sv,
                          site2EffectOnFrame: e.frame,
                      }
                    : {
                          site1HugoSymbol: 'ALK',
                          site2HugoSymbol: e.partner,
                          sampleId: e.id,
                          site1Position: e.pos,
                          site2Position: 100,
                          site1Chromosome: '2',
                          site2Chromosome: '2',
                          variantClass: e.sv,
                          site2EffectOnFrame: e.frame,
                      }
            ) as any
        );
        store.mergeTranscripts([
            ['GRCh38|ALK|', tx('ALK')],
            ['GRCh38|EML4|', tx('EML4')],
            ['GRCh38|KIF5B|', tx('KIF5B')],
        ]);
        store.setAnchor({ mode: 'gene', gene: 'ALK', side });
        return store;
    }
    const EVS = [
        { id: 'S1', partner: 'EML4', pos: 450, sv: 'DEL', frame: 'in_frame' },
        { id: 'S1', partner: 'KIF5B', pos: 450, sv: 'INV', frame: 'in_frame' },
        { id: 'S2', partner: 'EML4', pos: 450, sv: 'DEL', frame: 'in_frame' },
        { id: 'S3', partner: 'EML4', pos: 250, sv: 'DEL', frame: '' },
    ];

    it('stick tooltip has slot label and span; click filters with a histogram-style label and unique samples', () => {
        const spy = jest.fn();
        const w = mount(
            <FusionComparisonView
                store={lolliStore('3p', EVS)}
                onFilterCohortBySamples={spy}
            />
        );
        const stick = w.find('g[data-key="exon:E3"]');
        const t = lollipopTipText(w, 'exon:E3');
        assert.include(t, 'ALK · E3');
        assert.notInclude(t, 'exon:');
        assert.include(
            t,
            `${(400).toLocaleString()}–${(500).toLocaleString()}`
        );
        stick.simulate('click');
        assert.equal(spy.mock.calls.length, 1);
        assert.equal(spy.mock.calls[0][1], 'ALK breakpoint: E3');
        assert.sameMembers(
            spy.mock.calls[0][2].map((x: any) => x.sampleId),
            ['S1', 'S2']
        );
    });

    it('frame colour-by uses frameStatusStyle colours and labels', () => {
        const store = lolliStore('3p', EVS.slice(0, 1));
        store.setLollipopColorBy('frame');
        const w = mount(<FusionComparisonView store={store} />);
        assert.equal(
            w
                .find(
                    'g[data-key="exon:E3"] circle[data-testid="lollipop-head"]'
                )
                .prop('fill'),
            frameStatusStyle('inFrame').fill
        );
        const rows = mount(lollipopTip(w, 'exon:E3')).find(
            '[data-testid="lollipop-tip-row"]'
        );
        assert.lengthOf(rows, 1);
        assert.include(rows.text(), 'In-frame');
        assert.include(rows.text(), '1');
    });

    it('legend appears for frame and SV-type colouring only', () => {
        const store = lolliStore('3p', EVS);
        const w = mount(<FusionComparisonView store={store} />);
        const legend = () => w.find('[data-testid="lollipop-legend"]');
        assert.isFalse(legend().exists());
        runInAction(() => store.setLollipopColorBy('frame'));
        w.update();
        assert.include(legend().text(), 'In-frame');
        runInAction(() => store.setLollipopColorBy('svType'));
        w.update();
        assert.include(legend().text(), 'DEL');
        assert.include(legend().text(), 'INV');
        runInAction(() => store.setLollipopColorBy('partner'));
        w.update();
        assert.isFalse(legend().exists());
    });

    it('SV-type colours do not shift when partner boxes are toggled', () => {
        const store = lolliStore('3p', EVS);
        store.setLollipopColorBy('svType');
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        const before = ['DEL', 'INV'].map(c => view.lollipopColorOf(c));
        runInAction(() => store.togglePartnerFacet('KIF5B'));
        w.update();
        const after = ['DEL', 'INV'].map(c => view.lollipopColorOf(c));
        assert.deepEqual(after, before);
    });

    it.each(['5p', '3p'] as const)(
        'D25: %s anchor sticks sit at the centre of their exon rects',
        side => {
            const w = mount(
                <FusionComparisonView store={lolliStore(side, EVS)} />
            );
            const rects = w
                .find(AnchorGeneTrackRuler)
                .filterWhere(n => n.prop('symbol') === 'ALK')
                .find('rect[data-testid="feature-exon"]');
            const sticks = w.find('g[data-testid="lollipop-stick"]');
            assert.isAbove(sticks.length, 0);
            sticks.forEach(st => {
                const label = String(st.prop('data-key')).replace('exon:', '');
                const rect = rects.filterWhere(
                    r =>
                        r
                            .find('title')
                            .text()
                            .indexOf(label + ' ') === 0
                );
                assert.lengthOf(rect, 1);
                const cx =
                    Number(rect.prop('x')) + Number(rect.prop('width')) / 2;
                const x1 = Number(st.find('line').prop('x1'));
                assert.closeTo(x1, cx, 0.5);
            });
        }
    );

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
        const frame = computeComparisonFrame(width, PARTNER_RIGHT_GUTTER);
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

    describe('groupLabel', () => {
        const label = (side: '5p' | '3p', key: string) => {
            const store = alkStore();
            store.setAnchor({ mode: 'gene', gene: 'ALK', side });
            store.setCollapseKindOverride('exonStructure');
            const view = mount(
                <FusionComparisonView store={store} />
            ).instance() as any;
            return view.groupLabel({ key });
        };
        it('5′ anchor reads ALK→partner', () => {
            assert.equal(label('5p', 'EML4|5p:1|3p:2'), 'ALK→EML4 5′E1 · 3′E2');
        });
        it('3′ anchor reads partner→ALK', () => {
            assert.equal(label('3p', 'EML4|5p:1|3p:2'), 'EML4→ALK 5′E1 · 3′E2');
        });
        it('no partner reads gene plus category', () => {
            assert.equal(
                label('3p', '(no partner)|5p:1|3p:2'),
                'ALK (no partner) 5′E1 · 3′E2'
            );
        });
    });

    it('does not replace a pending seed with an auto pair anchor', () => {
        // Events WITH a pair, so only the seedPending guard can block the
        // auto pair anchor (an empty store would be blocked by pairSummaries).
        const store = alkStore();
        store.seedFromStudyFilter(['ALK'], false); // data not ready: stays pending
        assert.isAbove(store.pairSummaries.length, 0);
        assert.isTrue(store.seedPending);
        mount(<FusionComparisonView store={store} />);
        assert.isFalse(store.hasAnchorSelection);
    });
});

describe('FusionComparisonView link arcs', () => {
    function pairStore() {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 50,
                site2Position: 450,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S2',
                site1Position: 250,
                site2Position: 450,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
        ] as any);
        store.mergeTranscripts([
            ['GRCh38|TMPRSS2|', tx('TMPRSS2')],
            ['GRCh38|ERG|', tx('ERG')],
        ]);
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        return store;
    }

    it('draws arcs in Pair mode and hides them with the Links toggle', () => {
        const store = pairStore();
        const w = mount(<FusionComparisonView store={store} />);
        assert.isAbove(w.find('path[data-testid="link-arc"]').length, 0);
        w.find('button[data-testid="links-toggle"]').simulate('click');
        w.update();
        assert.lengthOf(w.find('path[data-testid="link-arc"]'), 0);
    });

    it('no arcs in Gene mode', () => {
        const store = pairStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        const w = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(w.find('path[data-testid="link-arc"]'), 0);
    });

    it('no partner transcript, no arcs', () => {
        const store = pairStore();
        store.setTranscriptsByKey(
            new Map([['GRCh38|TMPRSS2|', tx('TMPRSS2')]])
        );
        const w = mount(<FusionComparisonView store={store} />);
        assert.isFalse(w.find('[data-testid="link-arcs"]').exists());
    });

    it('hovering a bar lights its arcs; axis change and unmount clear hover', () => {
        const store = pairStore();
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        w.find('rect[data-testid="feature-bar"]')
            .first()
            .simulate('mouseenter');
        assert.isDefined(view.linkHover.matcher);
        runInAction(() => store.setTrackMode('genomic'));
        assert.isUndefined(view.linkHover.matcher);
        w.update();
        w.find('rect[data-testid="breakpoint-bin"]')
            .first()
            .simulate('mouseenter');
        assert.isDefined(view.linkHover.matcher);
        w.unmount();
        assert.isUndefined(view.linkHover.matcher);
    });

    function offTrackStore() {
        const store = pairStore();
        store.setStructuralVariants([
            ...(store.structuralVariants as any[]),
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S3',
                site1Position: 50,
                site2Position: 90_000_000,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
        ] as any);
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        return store;
    }

    const rowOf = (view: any, id: string) =>
        view.orientedRows.find((r: any) => r.sampleId === id);

    it('hovering a genuinely off-track strip leaves everything at rest', () => {
        const w = mount(<FusionComparisonView store={offTrackStore()} />);
        const view = w.instance() as any;
        const row = rowOf(view, 'S3');
        assert.isDefined(row);
        assert.isFalse(view.linkData.idByRow.has(row));
        view.onRowHover(row);
        assert.isUndefined(view.linkHover.matcher);
    });

    it('strip hover lights its link and bars, dims others', () => {
        const w = mount(<FusionComparisonView store={pairStore()} />);
        const view = w.instance() as any;
        const r1 = rowOf(view, 'S1');
        const r2 = rowOf(view, 'S2');
        const g1 = view.linkData.groups.find(
            (g: any) => g.id === view.linkData.idByRow.get(r1)
        );
        const g2 = view.linkData.groups.find(
            (g: any) => g.id === view.linkData.idByRow.get(r2)
        );
        assert.notEqual(g1.id, g2.id);
        view.onRowHover(r1);
        assert.isTrue(view.linkHover.matcher(g1));
        assert.isFalse(view.linkHover.matcher(g2));
        assert.equal(view.rowOpacity(r1), 1);
        assert.equal(view.rowOpacity(r2), 0.2);
        assert.equal(view.barOpacity('5p')(g1.key5), 1);
        assert.equal(view.barOpacity('5p')(g2.key5), 0.2);
        view.onRowHover(undefined);
        assert.isUndefined(view.barOpacity('5p')(g1.key5));
    });

    it('collapsed-group hover lights the union of member links (D22)', () => {
        const w = mount(<FusionComparisonView store={pairStore()} />);
        const view = w.instance() as any;
        const r1 = rowOf(view, 'S1');
        const r2 = rowOf(view, 'S2');
        const ids = [r1, r2].map(r => view.linkData.idByRow.get(r));
        const group = { representative: r1, members: [r1, r2] } as any;
        view.onRowHover(r1, group);
        view.linkData.groups.forEach((g: any) =>
            assert.isTrue(view.linkHover.matcher(g), g.id)
        );
        assert.equal(view.rowOpacity(r2, group), 1);
        assert.notEqual(ids[0], ids[1]);
        // single-row hover must NOT light the second link
        view.onRowHover(r1);
        assert.isFalse(
            view.linkHover.matcher(
                view.linkData.groups.find((g: any) => g.id === ids[1])
            )
        );
    });

    it('Gene mode keeps strip-mode controls; Pair mode has both, links group isolated', () => {
        const gene = pairStore();
        gene.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        const wg = mount(<FusionComparisonView store={gene} />);
        assert.isTrue(
            wg.find('button[data-testid="stripmode-dense"]').exists()
        );
        assert.isFalse(wg.find('button[data-testid="links-toggle"]').exists());
        const wp = mount(<FusionComparisonView store={pairStore()} />);
        assert.isTrue(
            wp.find('button[data-testid="stripmode-dense"]').exists()
        );
        const links = wp.find('button[data-testid="links-toggle"]');
        assert.lengthOf(links, 1);
        const grp = links.closest('.btn-group');
        assert.lengthOf(grp.find('button'), 1);
    });

    it('hovering a bar with no links leaves everything at rest', () => {
        const store = pairStore();
        store.setStructuralVariants([
            ...(store.structuralVariants as any[]),
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S4',
                site1Position: 450,
                site2Position: 90_000_000,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
        ] as any);
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        assert.isFalse(
            view.linkData.groups.some((g: any) => g.key5 === 'exon:E3')
        );
        view.onBarHover('5p')('exon:E3');
        assert.isUndefined(view.linkHover.matcher);
        assert.isUndefined(view.barOpacity('5p')('exon:E1'));
        // a bar that does have links still sets a matcher
        view.onBarHover('5p')('exon:E1');
        assert.isDefined(view.linkHover.matcher);
    });

    it('no arcs when only the histogram override (not the canonical) partner transcript exists', () => {
        const store = pairStore();
        store.setTranscriptsByKey(
            new Map([['GRCh38|TMPRSS2|', tx('TMPRSS2')]])
        );
        store.setTranscriptOptionsByGene(
            new Map([[`${store.genomeBuild}|ERG`, [tx('ERG')]]])
        );
        store.setHistogramTranscript('ERG', 'ERG');
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        assert.isDefined(view.histogramPartnerTranscript);
        assert.isUndefined(view.partnerTranscript);
        assert.isFalse(w.find('[data-testid="link-arcs"]').exists());
        assert.isUndefined(view.linkData);
    });
});

describe('FusionComparisonView partner column', () => {
    function partnerStore() {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 100,
                site2Position: 450,
                site1Chromosome: '21',
                site2Chromosome: '21',
            },
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ETV1',
                sampleId: 'S2',
                site1Position: 120,
                site2Position: 250,
                site1Chromosome: '21',
                site2Chromosome: '7',
            },
        ] as any);
        store.mergeTranscripts([
            ['GRCh38|TMPRSS2|', tx('TMPRSS2')],
            ['GRCh38|ERG|', tx('ERG')],
            ['GRCh38|ETV1|', tx('ETV1')],
        ]);
        return store;
    }

    it('Gene mode: header plus a coloured partner label per sample strip', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        runInAction(() => store.setStripMode('sample'));
        const w = mount(<FusionComparisonView store={store} />);
        assert.isTrue(w.find('[data-testid="partner-header"]').exists());
        const labels = w.find('text[data-testid="partner-label"]');
        assert.sameMembers(
            labels.map(l => l.text()),
            ['ERG', 'ETV1']
        );
        const dots = w.find('circle[data-testid="partner-dot"]');
        assert.lengthOf(dots, labels.length);
        labels.forEach((l, k) => {
            assert.equal(
                dots.at(k).prop('fill'),
                store.partnerColorMap.get(l.text())
            );
        });
    });

    it('Gene mode: strips use the same widened right gutter as the view frame', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        runInAction(() => store.setStripMode('sample'));
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        const strips = w.find('FusionProductStrip');
        assert.isAbove(strips.length, 0);
        strips.forEach(s => assert.equal(s.prop('rightX'), view.frame.rightX));
        assert.isBelow(
            view.frame.rightX,
            computeComparisonFrame(view.contentWidth).rightX
        );
    });

    it('collapsed mode shows the group category', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        runInAction(() => store.setStripMode('collapsed'));
        const w = mount(<FusionComparisonView store={store} />);
        const t = w
            .find('text[data-testid="partner-label"]')
            .map(l => l.text());
        assert.isAbove(t.length, 0);
        t.forEach(x =>
            assert.match(x, /^(ERG|ETV1|2 partners \(top: (ERG|ETV1)\))$/)
        );
    });

    it('Gene mode defaults to Product grouping even without frame calls', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        assert.isFalse(view.hasFusionAnnotation);
        assert.equal(view.collapseKind, 'exonStructure');
        store.setCollapseKindOverride('breakpointFeature');
        assert.equal(view.collapseKind, 'breakpointFeature');
    });

    it('Pair mode keeps the data-driven grouping default', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        assert.equal(view.collapseKind, 'breakpointFeature');
    });

    it('a mixed collapsed group names the partner count, top partner and breakdown', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        const rows = view.orientedRows;
        const label = view.partnerLabelFor(rows[0], {
            members: rows,
        } as any);
        assert.match(label.text, /^2 partners \(top: (ERG|ETV1)\)$/);
        assert.match(label.title, /^2 partners: (ERG|ETV1) ×1, (ERG|ETV1) ×1$/);
        assert.equal(
            label.color,
            store.partnerColorMap.get(label.text.match(/top: (\w+)/)[1])
        );
    });

    it('the Partner header lines up with the partner label text', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        runInAction(() => store.setStripMode('sample'));
        const w = mount(<FusionComparisonView store={store} />);
        const view = w.instance() as any;
        const header = w.find('[data-testid="partner-header"]').hostNodes();
        const label = w.find('text[data-testid="partner-label"]').first();
        assert.equal(header.prop('style')!.left, Number(label.prop('x')));
        assert.equal(
            header.prop('style')!.left,
            view.frame.rightX + PARTNER_TEXT_OFFSET
        );
    });

    it('dense mode: no partner text, partner in the strip title', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
        runInAction(() => store.setStripMode('dense'));
        const w = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(w.find('text[data-testid="partner-label"]'), 0);
        assert.isFalse(w.find('[data-testid="partner-header"]').exists());
        const titles = w.find('FusionProductStrip').map(s =>
            s
                .find('title')
                .first()
                .text()
        );
        assert.isTrue(titles.some(t => t.includes('· ERG')));
        assert.isTrue(titles.some(t => t.includes('· ETV1')));
    });

    it('Pair mode has no Partner header or text', () => {
        const store = partnerStore();
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        runInAction(() => store.setStripMode('sample'));
        const w = mount(<FusionComparisonView store={store} />);
        assert.isFalse(w.find('[data-testid="partner-header"]').exists());
        assert.lengthOf(w.find('text[data-testid="partner-label"]'), 0);
        const view = w.instance() as any;
        assert.equal(
            view.frame.rightX,
            computeComparisonFrame(view.contentWidth).rightX
        );
    });
});

describe('FusionComparisonView caller-confirmed reciprocals (pair mode)', () => {
    const FORWARD =
        'ENST00000318522.10(EML4):e.1_13::ENST00000389048.8(ALK):e.20_29';
    const RECIPROCAL =
        'ENST00000389048.8(ALK):e.1_19::ENST00000318522.10(EML4):e.22_23';
    const sv = (sampleId: string, g1: string, g2: string, annotation: string) =>
        ({
            site1HugoSymbol: g1,
            site2HugoSymbol: g2,
            sampleId,
            site1Position: 250,
            site2Position: 250,
            annotation,
        } as any);

    function mountPair() {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            sv('S1', 'EML4', 'ALK', FORWARD),
            sv('S2', 'EML4', 'ALK', FORWARD),
            sv('S3', 'ALK', 'EML4', RECIPROCAL),
        ]);
        store.setAnchor({ mode: 'pair', key: 'EML4::ALK' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        const view = wrapper.instance() as any;
        runInAction(() => {
            view.transcriptsByKey = new Map([
                ['GRCh38|EML4|', tx('EML4')],
                ['GRCh38|ALK|', tx('ALK')],
            ]);
        });
        wrapper.update();
        return { wrapper, store, view };
    }

    it('draws only the anchored orientation', () => {
        const { view } = mountPair();
        assert.equal(view.anchorGene, 'EML4');
        assert.deepEqual(view.orientedRows.map((r: any) => r.sampleId).sort(), [
            'S1',
            'S2',
        ]);
    });

    it('links to the reciprocal pair row', () => {
        const { wrapper, store } = mountPair();
        const note = wrapper
            .find('[data-testid="pair-reciprocal-note"]')
            .hostNodes();
        assert.lengthOf(note, 1);
        assert.include(note.text(), 'Reciprocal ALK::EML4');
        assert.include(note.text(), '1 sample');
        note.simulate('click');
        assert.deepEqual(store.anchor, { mode: 'pair', key: 'ALK::EML4' });
    });

    it('shows no note when the pair has no reciprocal row', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([sv('S1', 'EML4', 'ALK', FORWARD)]);
        store.setAnchor({ mode: 'pair', key: 'EML4::ALK' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(
            wrapper.find('[data-testid="pair-reciprocal-note"]').hostNodes(),
            0
        );
    });
});
