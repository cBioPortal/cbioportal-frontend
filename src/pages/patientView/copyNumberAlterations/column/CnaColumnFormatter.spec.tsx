import { default as CnaColumnFormatter, AlterationTypes } from './CnaColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('CnaColumnFormatter', () => {

    before(() => {

    });

    after(() => {

    });

    it('CNA column renderer shows correct text based on alteration value', () => {

        let output = mount(CnaColumnFormatter.renderAlterationTypes(-2));

        assert.equal(output.text(), 'DeepDel');

        output = mount(CnaColumnFormatter.renderAlterationTypes(2));

        assert.equal(output.text(), 'AMP');

    });

});
