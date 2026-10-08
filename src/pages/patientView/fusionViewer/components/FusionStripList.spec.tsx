import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionStripList, {
    visibleWindow,
    ladderTranscript,
} from './FusionStripList';
import { TranscriptData, FusionEvent } from '../data/types';
import { ComparisonRow } from '../data/comparisonRows';

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

function makeRow(sampleId: string): ComparisonRow {
    const event: FusionEvent = {
        id: sampleId,
        tumorId: sampleId,
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 250,
            selectedTranscriptId: 'TMPRSS2',
            siteDescription: '',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 250,
            selectedTranscriptId: 'ERG',
            siteDescription: '',
        },
        fusion: 'TMPRSS2-ERG',
        eventLabel: '',
        ncbiBuild: '',
        totalReadSupport: 12,
        callMethod: '',
        frameCallMethod: '',
        annotation: '',
        position: '',
        significance: '',
        note: '',
        connectionType: '',
        svIdiom: 'INTERGENIC_FUSION',
        frame: 'IN_FRAME',
        isRnaDerived: true,
    };
    return {
        event,
        sampleId,
        fivePrimeSymbol: 'TMPRSS2',
        threePrimeSymbol: 'ERG',
        anchorBreakpoint: 250,
        partnerBreakpoint: 250,
        frame: 'inFrame',
    };
}

describe('visibleWindow', () => {
    it('returns only the rows intersecting the viewport plus overscan', () => {
        // 100 rows, 50px each, 200px viewport, scrolled to 1000px
        const { start, end } = visibleWindow(100, 50, 200, 1000);
        // first visible row = 1000/50 = 20; overscan 2 → start 18
        assert.equal(start, 18);
        // last visible = (1000+200)/50 = 24; +overscan → 26 (exclusive)
        assert.equal(end, 26);
    });

    it('clamps to [0, total]', () => {
        const { start, end } = visibleWindow(5, 50, 400, 0);
        assert.equal(start, 0);
        assert.equal(end, 5);
    });
});

function t(
    gene: string,
    genomeBuild: 'GRCh37' | 'GRCh38' = 'GRCh38'
): TranscriptData {
    return {
        genomeBuild,
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [{ number: 1, start: 0, end: 100 }],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

describe('ladderTranscript', () => {
    it('uses the row transcript when not in reference mode', () => {
        assert.equal(ladderTranscript(t('ERG'), t('ETV1'), false)!.gene, 'ERG');
    });

    it('uses the reference transcript when the genes match', () => {
        const ref = t('ERG');
        assert.strictEqual(ladderTranscript(t('ERG'), ref, true), ref);
    });

    it('falls back to the row transcript for an off-reference partner', () => {
        // Driver-anchor mode: this row's partner is not the dominant partner,
        // so drawing it against the reference ladder would be wrong.
        assert.equal(ladderTranscript(t('FLI1'), t('ERG'), true)!.gene, 'FLI1');
    });

    it('returns the row transcript when there is no reference', () => {
        assert.equal(ladderTranscript(t('ERG'), undefined, true)!.gene, 'ERG');
    });

    it('falls back to the row transcript when the builds differ', () => {
        // A cohort can span builds (msktarget: GRCh37 DNA SVs alongside GRCh38
        // RNA fusions). The reference ladder is fetched at the COHORT build, so
        // measuring a row's breakpoint against it puts the breakpoint hundreds
        // of kb away -- every exon reads as lost and the row draws all-grey.
        const row = t('ALK', 'GRCh38');
        const ref = t('ALK', 'GRCh37');
        assert.strictEqual(ladderTranscript(row, ref, true), row);
    });

    it('still uses the reference when both are on the same build', () => {
        const ref = t('ALK', 'GRCh38');
        assert.strictEqual(
            ladderTranscript(t('ALK', 'GRCh38'), ref, true),
            ref
        );
    });

    it('returns undefined when the row has no transcript', () => {
        assert.isUndefined(ladderTranscript(undefined, undefined, true));
    });

    it('returns undefined when the row has no transcript even if a reference exists', () => {
        assert.isUndefined(ladderTranscript(undefined, t('ERG'), true));
    });
});

describe('FusionStripList height', () => {
    const list = (n: number, viewportHeight: number) =>
        mount(
            <FusionStripList
                rows={Array.from({ length: n }, (_, i) => makeRow(`S${i}`))}
                transcriptForRow={(_, is5p) =>
                    is5p ? tx('TMPRSS2') : tx('ERG')
                }
                width={800}
                viewportHeight={viewportHeight}
                pxPerBp5p={0.5}
                pxPerBp3p={0.5}
                alignment="junction"
            />
        );
    const height = (w: any) =>
        w
            .find('[data-testid="strip-scroll"]')
            .hostNodes()
            .prop('style').height;

    it('shrinks to its rows when they are shorter than the viewport', () => {
        // Two 50px rows: no empty space below them.
        assert.equal(height(list(2, 600)), 100);
    });

    it('caps at the viewport and scrolls when the rows are taller', () => {
        assert.equal(height(list(40, 600)), 600);
    });
});

describe('FusionStripList stale hover overlay', () => {
    function mountList() {
        return mount(
            <FusionStripList
                rows={[makeRow('S1')]}
                transcriptForRow={(_, is5p) =>
                    is5p ? tx('TMPRSS2') : tx('ERG')
                }
                width={800}
                pxPerBp5p={0.5}
                pxPerBp3p={0.5}
                alignment="junction"
                exonMode="full"
            />
        );
    }

    it('says "partially lost" with nt counts for a split exon', () => {
        const wrapper = mountList();
        // Breakpoint 250 splits exon 2; its lost half carries data-lost.
        const split = wrapper
            .find('rect[data-testid="strip-exon"][data-lost="true"]')
            .hostNodes()
            .first();
        split.simulate('mouseenter', { clientX: 10, clientY: 20 });
        const text = wrapper
            .find('[data-testid="exon-hover-readout"]')
            .hostNodes()
            .text();
        assert.include(text, 'partially lost');
        assert.include(text, '51 nt retained');
        assert.include(text, '50 nt lost');
    });

    it('shows the shared overlay on exon hover and clears it on scroll', () => {
        const wrapper = mountList();
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            1
        );

        wrapper
            .find('[data-testid="strip-scroll"]')
            .hostNodes()
            .simulate('scroll', { target: { scrollTop: 5 } });
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            0
        );
    });

    it('clears the overlay on mouseleave of the scroll container', () => {
        const wrapper = mountList();
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        wrapper
            .find('[data-testid="strip-scroll"]')
            .hostNodes()
            .simulate('mouseleave');
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            0
        );
    });

    it('clears the overlay when exonMode switches away from full', () => {
        const wrapper = mountList();
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        wrapper.setProps({ exonMode: 'retained' });
        wrapper.update();
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            0
        );
    });
});

describe('FusionStripList', () => {
    const rows: ComparisonRow[] = [makeRow('S1')];
    const transcriptForRow = (row: ComparisonRow, is5p: boolean) =>
        is5p ? tx(row.fivePrimeSymbol) : tx(row.threePrimeSymbol || '');

    it('product strips draw inline junction labels', () => {
        const wrapper = mount(
            <FusionStripList
                rows={rows}
                transcriptForRow={transcriptForRow}
                width={900}
                pxPerBp5p={0.5}
                pxPerBp3p={0.5}
                alignment="junction"
                mode="sample"
            />
        );
        assert.isAbove(
            wrapper.find('[data-testid="junction-label"]').hostNodes().length,
            0
        );
        assert.lengthOf(
            wrapper.find('[data-testid="junction-gutter"]').hostNodes(),
            0
        );
    });
});

describe('FusionStripList partnerless rows with a 3′ anchor (D33)', () => {
    const alkTx = {
        transcriptId: 'ALK',
        displayName: 'ALK',
        gene: 'ALK',
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 400, end: 500 },
            { number: 3, start: 800, end: 900 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        genomeBuild: 'GRCh38',
        domains: [],
        utrs: [],
    } as any;
    const lone = {
        event: { totalReadSupport: 3 },
        sampleId: 'S9',
        fivePrimeSymbol: 'ALK',
        threePrimeSymbol: null,
        anchorBreakpoint: 300, // intron 1-2 → exons 2..3 retained as a 3′ side
        partnerBreakpoint: null,
        frame: 'unknown',
    } as any;

    it('draws only right-of-junction exons and a "no partner" note', () => {
        const wrapper = mount(
            <FusionStripList
                rows={[lone]}
                transcriptForRow={() => alkTx}
                width={1000}
                pxPerBp5p={0.2}
                pxPerBp3p={0.2}
                alignment="junction"
                anchorSide="3p"
            />
        );
        const note = wrapper.find('[data-testid="strip-left-note"]');
        assert.isTrue(note.exists());
        assert.equal(note.text(), 'no partner');
        // Every exon rect sits right of the junction (frame junctionX = 170 + (880-170)/2 = 525).
        const rects = wrapper.find('rect[data-testid="strip-exon"]');
        assert.isAbove(rects.length, 0);
        rects.forEach(r => {
            assert.isAbove(Number(r.prop('x')), 525);
        });
    });

    it('side 5p keeps today’s behaviour (left of junction, no note)', () => {
        const wrapper = mount(
            <FusionStripList
                rows={[lone]}
                transcriptForRow={() => alkTx}
                width={1000}
                pxPerBp5p={0.2}
                pxPerBp3p={0.2}
                alignment="junction"
                anchorSide="5p"
            />
        );
        assert.isFalse(
            wrapper.find('[data-testid="strip-left-note"]').exists()
        );
        const rects = wrapper.find('rect[data-testid="strip-exon"]');
        assert.isAbove(rects.length, 0);
        rects.forEach(r => assert.isBelow(Number(r.prop('x')), 525));
    });

    it('treats a row with a partner symbol but no partner breakpoint as lone', () => {
        const noBp = { ...lone, threePrimeSymbol: 'EML4' };
        const wrapper = mount(
            <FusionStripList
                rows={[noBp]}
                transcriptForRow={() => alkTx}
                width={1000}
                pxPerBp5p={0.2}
                pxPerBp3p={0.2}
                alignment="junction"
                anchorSide="3p"
            />
        );
        assert.equal(
            wrapper.find('[data-testid="strip-left-note"]').text(),
            'no partner'
        );
    });
});

describe('FusionStripList linked hover', () => {
    const alkTx = {
        transcriptId: 'ALK',
        displayName: 'ALK',
        gene: 'ALK',
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 400, end: 500 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        genomeBuild: 'GRCh38',
        domains: [],
        utrs: [],
    } as any;
    const lone = {
        event: { totalReadSupport: 3 },
        sampleId: 'S9',
        fivePrimeSymbol: 'ALK',
        threePrimeSymbol: null,
        anchorBreakpoint: 300,
        partnerBreakpoint: null,
        frame: 'unknown',
    } as any;

    it('applies rowOpacity, reports hover, and clears hover on scroll', () => {
        const calls: any[] = [];
        const w = mount(
            <FusionStripList
                rows={[lone]}
                transcriptForRow={() => alkTx}
                width={1000}
                pxPerBp5p={0.2}
                pxPerBp3p={0.2}
                alignment="junction"
                rowOpacity={() => 0.2}
                onRowHover={(r: any) => calls.push(r)}
            />
        );
        const strip = () => w.find('g[data-testid="product-strip"]').first();
        assert.equal(Number(strip().prop('opacity')), 0.2);
        strip().simulate('mouseenter');
        assert.strictEqual(calls[calls.length - 1], lone);
        w.find('[data-testid="strip-scroll"]').simulate('scroll', {
            target: { scrollTop: 10 },
        });
        assert.isUndefined(calls[calls.length - 1]);
    });

    it('clears hover when mode or exonMode changes', () => {
        const calls: any[] = [];
        const w = mount(
            <FusionStripList
                rows={[lone]}
                transcriptForRow={() => alkTx}
                width={1000}
                pxPerBp5p={0.2}
                pxPerBp3p={0.2}
                alignment="junction"
                mode="sample"
                onRowHover={(r: any) => calls.push(r)}
            />
        );
        const strip = () => w.find('g[data-testid="product-strip"]').first();
        strip().simulate('mouseenter');
        assert.strictEqual(calls[calls.length - 1], lone);
        w.setProps({ mode: 'dense' });
        assert.isUndefined(calls[calls.length - 1]);
        strip().simulate('mouseenter');
        assert.strictEqual(calls[calls.length - 1], lone);
        w.setProps({ exonMode: 'full' });
        assert.isUndefined(calls[calls.length - 1]);
    });
});

describe('FusionStripList rows sharing a sample', () => {
    // Two events from one sample (e.g. two breakpoints of the same gene).
    const twin = (id: string): ComparisonRow => {
        const r = makeRow('S1');
        return { ...r, event: { ...r.event, id } };
    };
    const rows = [twin('ev-a'), twin('ev-b'), makeRow('S2')];
    const transcriptForRow = (row: ComparisonRow, is5p: boolean) =>
        is5p ? tx(row.fivePrimeSymbol) : tx(row.threePrimeSymbol || '');
    const props = {
        rows,
        transcriptForRow,
        width: 900,
        pxPerBp5p: 0.5,
        pxPerBp3p: 0.5,
        alignment: 'junction' as const,
    };

    it('switching Dense -> Per sample leaves exactly one full-size strip per row', () => {
        const errors: string[] = [];
        const spy = jest
            .spyOn(console, 'error')
            .mockImplementation((...a: any[]) => errors.push(String(a[0])));
        const wrapper = mount(<FusionStripList {...props} mode="dense" />);
        wrapper.setProps({ mode: 'sample' });
        wrapper.update();
        spy.mockRestore();
        const strips = wrapper.find('FusionProductStrip');
        assert.lengthOf(strips, 3);
        strips.forEach(s => assert.isFalse(!!s.prop('compact')));
        assert.lengthOf(
            wrapper.find('[data-testid="product-strip"]').hostNodes(),
            3
        );
        assert.isFalse(
            errors.some(e => /same key/i.test(e)),
            'duplicate React keys'
        );
    });
});
