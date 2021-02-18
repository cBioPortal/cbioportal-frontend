import {
    filterCaseSetOptions,
    ReactSelectOptionWithName,
} from './CaseSetSelector';
import React from 'react';
import { assert } from 'chai';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import sinon from 'sinon';

Enzyme.configure({ adapter: new Adapter() });

describe('CaseSetSelector', () => {
    describe('filterCaseSetOptions', () => {
        it('lambda filters without case sensitivity', () => {
            let opt = {
                textLabel: 'this is the Haystack',
            } as ReactSelectOptionWithName;

            assert.isTrue(filterCaseSetOptions(opt, 'haystack'));
            assert.isTrue(filterCaseSetOptions(opt, 'Haystack'));
            assert.isFalse(filterCaseSetOptions(opt, 'Maystack'));
        });
    });
});
