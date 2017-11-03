import CivicCard from './CivicCard';
import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { getCivicVariantData } from '../../../test/CivicMockUtils';

describe('CivicCard', () => {
    const props = {
        title: 'fooTitle',
        geneName: 'fooGeneName',
        geneDescription: 'fooGeneDesc',
        geneUrl: 'http://fooGeneURL',
        variants: {}
    };

    const props_2 = {
        title: 'fooTitle',
        geneName: 'fooGeneName',
        geneDescription: 'fooGeneDesc',
        geneUrl: 'http://fooGeneURL',
        variants: {
            'var1' : getCivicVariantData(),
            'var2' : getCivicVariantData()
        }
    };

    before(() => {

    });

    it('should render civic-card', () => {
        const wrapper = shallow(<CivicCard {...props}/>);
        expect(wrapper.find('.civic-card')).to.have.length(1);
    });

    it('should not have variant', () => {
        const wrapper = shallow(<CivicCard {...props}/>);
        expect(wrapper.find('.civic-card-variant-header')).to.have.length(0);
        expect(wrapper.find('.civic-card-variant-name')).to.have.length(0);
        expect(wrapper.find('.civic-card-variant-entry-types')).to.have.length(0);
    });

    it('should have two variants', () => {
        const wrapper = shallow(<CivicCard {...props_2}/>);
        expect(wrapper.find('.civic-card-variant-header')).to.have.length(2);
        expect(wrapper.find('.civic-card-variant-name')).to.have.length(2);
        expect(wrapper.find('.civic-card-variant-entry-types')).to.have.length(2);
    });

    after(() => {

    });
});
