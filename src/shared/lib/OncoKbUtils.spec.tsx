import { generateQueryVariantId } from './OncoKbUtils';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('OncoKbUtils', () => {

    before(() => {

    });

    after(() => {

    });

    it('what does it do?', () => {
        assert.equal(generateQueryVariantId(451,'two'), '451_two');
        assert.equal(generateQueryVariantId(451, null), '451');
    });

});

