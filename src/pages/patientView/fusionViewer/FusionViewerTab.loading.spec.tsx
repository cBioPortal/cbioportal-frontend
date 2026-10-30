import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { FusionViewerTab } from './FusionViewerTab';
import { FusionEvent, TranscriptData } from './data/types';

const mockFetchTranscripts = jest.fn();

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: (...args: any[]) =>
        mockFetchTranscripts(...args),
}));

jest.mock('./data/structuralVariantAdapter', () => ({
    convertStructuralVariantsToFusionEvents: jest.fn((svs: any[]) =>
        svs.map((sv: any) => sv as FusionEvent)
    ),
}));

// Render only what the test inspects: which transcripts reach the diagram.
jest.mock('./FusionDiagramSVG', () => ({
    FusionDiagramSVG: (props: any) => (
        <div className="mock-diagram">
            {props.forteTranscript5p.transcriptId}|
            {props.forteTranscript3p
                ? props.forteTranscript3p.transcriptId
                : ''}
        </div>
    ),
}));
jest.mock('./FusionListSidebar', () => ({ FusionListSidebar: () => null }));
jest.mock('./FusionInfoBar', () => ({ FusionInfoBar: () => null }));

function makeTranscript(gene: string, transcriptId: string): TranscriptData {
    return {
        transcriptId,
        displayName: transcriptId,
        gene,
        biotype: 'protein_coding',
        strand: '+',
        txStart: 100,
        txEnd: 500,
        exons: [{ number: 1, start: 100, end: 200 }],
        isForteSelected: true,
        isCallerSelected: false,
    } as TranscriptData;
}

function makeFusion(id: string, gene1: string, gene2: string): FusionEvent {
    return {
        id,
        tumorId: 'tumor-1',
        gene1: {
            symbol: gene1,
            chromosome: '1',
            position: 150,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        gene2: {
            symbol: gene2,
            chromosome: '2',
            position: 150,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        fusion: `${gene1}::${gene2}`,
    } as FusionEvent;
}

const flush = () => new Promise(r => setTimeout(r, 50));

describe('FusionViewerTab', () => {
    beforeEach(() => mockFetchTranscripts.mockReset());

    it('does not draw the previous fusion transcripts while the new selection loads', async () => {
        mockFetchTranscripts.mockImplementation((symbol: string) =>
            Promise.resolve([makeTranscript(symbol, `ENST_${symbol}`)])
        );
        const wrapper = mount(
            <FusionViewerTab
                structuralVariants={
                    [
                        makeFusion('f1', 'GENEA', 'GENEB'),
                        makeFusion('f2', 'GENEC', 'GENED'),
                    ] as any
                }
            />
        );
        await act(async () => {
            await flush();
        });
        wrapper.update();
        assert.include(wrapper.find('.mock-diagram').text(), 'ENST_GENEA');

        // The second fusion's transcript requests never resolve.
        mockFetchTranscripts.mockReturnValue(new Promise(() => {}));
        act(() => {
            (wrapper.instance() as any).store.selectFusion('f2');
        });
        wrapper.update();

        assert.notInclude(wrapper.text(), 'ENST_GENEA');
        assert.notInclude(wrapper.text(), 'ENST_GENEB');
        assert.include(wrapper.text(), 'Loading transcript data...');
        wrapper.unmount();
    });
});
