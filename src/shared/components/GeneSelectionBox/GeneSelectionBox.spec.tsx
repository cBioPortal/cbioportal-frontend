import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import OQLTextArea, { IGeneSelectionBoxProps, GeneBoxType } from './OQLTextArea';
import client from 'shared/api/cbioportalClientInstance';
import sinon from 'sinon';

describe('GeneSelectionBox', () => {
    beforeEach(() => {
        sinon.stub(client, 'getAllGenesUsingGET');
        sinon.stub(client, 'fetchGenesUsingPOST');
    });
    afterEach(() => {
        (client.getAllGenesUsingGET as sinon.SinonStub).restore();
        (client.fetchGenesUsingPOST as sinon.SinonStub).restore();
    });

    it('textarea value - default view', () => {
        const props = {
            inputGeneQuery: 'CDKN2A CDKN2A-AS1 CDKN2B',
        } as IGeneSelectionBoxProps;

        let wrapper = mount(<OQLTextArea {...props} />);
        assert.equal(wrapper.find({ 'data-test': 'geneSet' }).text(), 'CDKN2A CDKN2A-AS1 CDKN2B');
    });

    it('textarea value - study view', () => {
        const props = {
            inputGeneQuery: 'CDKN2A CDKN2A-AS1 CDKN2B',
            location: GeneBoxType.STUDY_VIEW_PAGE,
        } as IGeneSelectionBoxProps;

        let wrapper = mount(<OQLTextArea {...props} />);
        assert.equal(wrapper.find({ 'data-test': 'geneSet' }).text(), 'CDKN2A and 2 more');
    });
});
