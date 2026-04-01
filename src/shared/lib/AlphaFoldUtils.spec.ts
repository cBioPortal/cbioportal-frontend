import { assert } from 'chai';
import { getAlphaFoldEntryUrl } from './AlphaFoldUtils';

describe('AlphaFoldUtils', () => {
    it('builds the AlphaFold DB entry URL from the UniProt accession', () => {
        assert.equal(
            getAlphaFoldEntryUrl('P04637'),
            'https://alphafold.ebi.ac.uk/entry/P04637'
        );
    });

    it('encodes special characters in the UniProt accession', () => {
        assert.equal(
            getAlphaFoldEntryUrl('Q9H0H5-2'),
            'https://alphafold.ebi.ac.uk/entry/Q9H0H5-2'
        );
    });
});
