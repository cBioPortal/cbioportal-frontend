import { assert } from 'chai';
import { updateGeneQuery } from 'pages/studyView/StudyViewUtils';

describe('StudyViewUtils', () => {
    it('when gene selected in table', () => {
        assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TTN'), 'TP53;\nTTN;',);
        assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'ALK'), 'TP53;\nTTN;\nALK;',);
    });
    it('when gene unselected in table', () => {
        assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TP53'), '');
        assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'TP53'), 'TTN;',);
        assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'ALK'), 'TP53;\nTTN;\nALK;',);
    });
});
