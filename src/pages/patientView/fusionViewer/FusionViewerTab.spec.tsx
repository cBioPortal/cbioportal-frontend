import * as React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionViewerTab } from './FusionViewerTab';

const mockFetchTranscripts = jest.fn();

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: (...args: any[]) =>
        mockFetchTranscripts(...args),
}));

function makeSV(): StructuralVariant {
    return ({
        sampleId: 'SAMPLE_001',
        site1HugoSymbol: 'GENE_A',
        site1Chromosome: '1',
        site1Position: 5000,
        site2HugoSymbol: 'GENE_B',
        site2Chromosome: '2',
        site2Position: 8000,
        variantClass: 'SV',
        dnaSupport: 'yes',
        rnaSupport: 'no',
    } as unknown) as StructuralVariant;
}

describe('FusionViewerTab', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetchTranscripts.mockResolvedValue([]);
    });

    it('a referenceGenome that arrives after the SVs drives later transcript queries', async () => {
        const wrapper = shallow(
            <FusionViewerTab structuralVariants={[makeSV()]} />
        );
        const store = (wrapper.instance() as any).store;
        assert.equal(store.genomeBuild, 'GRCh38');

        wrapper.setProps({ referenceGenome: 'hg19' });
        // Force the transcript remote to (re)invoke under the new build.
        void store.gene1TranscriptsRemote.result;
        await new Promise(r => setTimeout(r, 50));

        assert.equal(store.genomeBuild, 'GRCh37');
        const calls = mockFetchTranscripts.mock.calls;
        assert.isAbove(calls.length, 0);
        assert.equal(calls[calls.length - 1][2], 'GRCh37');
    });
});
