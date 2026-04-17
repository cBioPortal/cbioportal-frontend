import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { GeneTrack } from './GeneTrack';
import { TranscriptData } from '../data/types';

function makeTranscript(
    overrides: Partial<TranscriptData> = {}
): TranscriptData {
    return {
        transcriptId: 'ENST_DEFAULT',
        displayName: 'ENST_DEFAULT',
        gene: 'GENE_A',
        biotype: 'protein_coding',
        strand: '+' as const,
        txStart: 100,
        txEnd: 500,
        exons: [
            { number: 1, start: 100, end: 200 },
            { number: 2, start: 300, end: 400 },
        ],
        isForteSelected: false,
        domains: [],
        ...overrides,
    };
}

function renderGeneTrack(
    props: Partial<React.ComponentProps<typeof GeneTrack>> = {}
) {
    const forte = makeTranscript({
        transcriptId: 'ENST_FORTE',
        isForteSelected: true,
    });
    const user = makeTranscript({ transcriptId: 'ENST_USER' });
    return mount(
        <svg>
            <GeneTrack
                symbol="GENE_A"
                chromosome="1"
                position={250}
                strand="+"
                siteDescription=""
                forteTranscript={forte}
                userTranscripts={[user]}
                color="#1864ab"
                x={0}
                y={0}
                width={400}
                is5Prime={true}
                activeTranscriptId="ENST_FORTE"
                onActivateTranscript={() => {}}
                {...props}
            />
        </svg>
    );
}

describe('GeneTrack click-to-activate', () => {
    it('calls onActivateTranscript with the FORTE transcript ID when its row is clicked', () => {
        const spy = sinon.spy();
        const wrapper = renderGeneTrack({
            activeTranscriptId: 'ENST_USER',
            onActivateTranscript: spy,
        });

        wrapper
            .find('[data-testid="gene-track-row-ENST_FORTE"]')
            .first()
            .simulate('click');

        assert.isTrue(spy.calledOnce);
        assert.equal(spy.firstCall.args[0], 'ENST_FORTE');
    });

    it('calls onActivateTranscript with the user transcript ID when its row is clicked', () => {
        const spy = sinon.spy();
        const wrapper = renderGeneTrack({
            activeTranscriptId: 'ENST_FORTE',
            onActivateTranscript: spy,
        });

        wrapper
            .find('[data-testid="gene-track-row-ENST_USER"]')
            .first()
            .simulate('click');

        assert.equal(spy.firstCall.args[0], 'ENST_USER');
    });

    it('renders the DRIVING FUSION badge on the active row only', () => {
        const wrapper = renderGeneTrack({ activeTranscriptId: 'ENST_FORTE' });

        const forteBadge = wrapper.find(
            '[data-testid="gene-track-badge-ENST_FORTE"]'
        );
        const userBadge = wrapper.find(
            '[data-testid="gene-track-badge-ENST_USER"]'
        );

        assert.isAtLeast(forteBadge.length, 1);
        assert.equal(userBadge.length, 0);
    });

    it('renders the active-outline rect on the active row only', () => {
        const wrapper = renderGeneTrack({ activeTranscriptId: 'ENST_USER' });

        const forteOutline = wrapper.find(
            '[data-testid="gene-track-active-outline-ENST_FORTE"]'
        );
        const userOutline = wrapper.find(
            '[data-testid="gene-track-active-outline-ENST_USER"]'
        );

        assert.equal(forteOutline.length, 0);
        assert.isAtLeast(userOutline.length, 1);
    });
});
