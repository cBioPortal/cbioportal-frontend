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
        // Transcription order runs right-to-left in genomic coordinates, so the
        // leftmost drawn block is the highest-numbered exon.
        const labels = render(tx('TMPRSS2', '-'))
            .find('[data-testid="ruler-exon-label"]')
            .hostNodes()
            .map(n => n.text());
        assert.deepEqual(labels, ['E3', 'E2', 'E1']);
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
