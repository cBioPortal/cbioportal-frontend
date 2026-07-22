import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionStripList, { visibleWindow } from './FusionStripList';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData, FusionEvent } from '../data/types';

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
        totalReadSupport: 12,
        callMethod: '',
        frameCallMethod: '',
        annotation: '',
        position: '',
        significance: '',
        note: '',
        connectionType: '',
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

describe('FusionStripList', () => {
    const rows: ComparisonRow[] = [makeRow('S1')];
    const transcriptForRow = (row: ComparisonRow, is5p: boolean) =>
        is5p ? tx(row.fivePrimeSymbol) : tx(row.threePrimeSymbol || '');

    it('forwards junctionLabelMode to the product strips', () => {
        const wrapper = mount(
            <FusionStripList
                rows={rows}
                transcriptForRow={transcriptForRow}
                width={900}
                pxPerBp5p={0.5}
                pxPerBp3p={0.5}
                alignment="junction"
                mode="sample"
                junctionLabelMode="gutter"
            />
        );
        assert.isAbove(
            wrapper.find('[data-testid="junction-gutter"]').hostNodes().length,
            0
        );
    });
});
