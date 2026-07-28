import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import ExonRuler from './ExonRuler';
import { TranscriptData } from '../data/types';

function tx(gene: string, strand: '+' | '-' = '+'): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand,
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

function render(t5: TranscriptData, t3?: TranscriptData) {
    return mount(
        <ExonRuler
            transcript5p={t5}
            transcript3p={t3}
            width={800}
            leftX={170}
            junctionX={400}
            rightX={700}
            pxPerBp5p={0.5}
            pxPerBp3p={0.5}
        />
    );
}

describe('ExonRuler', () => {
    it('labels every exon of both transcripts', () => {
        assert.equal(
            render(tx('TMPRSS2'), tx('ERG'))
                .find('[data-testid="ruler-exon-label"]')
                .hostNodes().length,
            6
        );
    });

    it('numbers ascending on the plus strand', () => {
        const labels = render(tx('TMPRSS2'))
            .find('[data-testid="ruler-exon-label"]')
            .hostNodes()
            .map(n => n.text());
        assert.deepEqual(labels, ['E1', 'E2', 'E3']);
    });

    it('numbers descending on the minus strand', () => {
        // On minus strand, exonDisplayNumbers assigns E1 to the highest-coordinate
        // exon, and exonsInOrder returns exons with highest-start first. The leftmost
        // drawn block (highest genomic coordinate) is therefore E1. Labels read E1→E3
        // left-to-right, matching FusionProductStrip's own exon ordering.
        const labels = render(tx('TMPRSS2', '-'))
            .find('[data-testid="ruler-exon-label"]')
            .hostNodes()
            .map(n => n.text());
        assert.deepEqual(labels, ['E1', 'E2', 'E3']);
    });

    it('ruler labels match exonDisplayNumbers for minus strand', () => {
        // Pin the property that matters: ruler labels align with the display numbers
        // used by FusionProductStrip. For each exon in transcription order, the label
        // must be the number assigned by exonDisplayNumbers.
        const transcript = tx('TMPRSS2', '-');
        const labels = render(transcript)
            .find('[data-testid="ruler-exon-label"]')
            .hostNodes()
            .map(n => n.text());
        const exons = require('./fusionProductHelpers').exonsInOrder(
            transcript
        );
        const nums = require('./fusionProductHelpers').exonDisplayNumbers(
            transcript
        );
        labels.forEach((label, idx) => {
            const exon = exons[idx];
            const expected = nums.get(`${exon.start}-${exon.end}`);
            assert.equal(label, `E${expected}`);
        });
    });

    it('renders without a 3-prime transcript', () => {
        assert.equal(
            render(tx('TMPRSS2'))
                .find('[data-testid="ruler-exon-label"]')
                .hostNodes().length,
            3
        );
    });
});
