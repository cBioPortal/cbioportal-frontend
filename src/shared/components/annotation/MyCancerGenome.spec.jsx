import MyCancerGenome from './MyCancerGenome';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('MyCancerGenome', () => {

    let component, emptyListComponent, tooltip, emptyListTooltip;

    before(()=>{
        component = mount(<MyCancerGenome linksHTML={["link1, link2"]}/>);
        emptyListComponent = mount(<MyCancerGenome linksHTML={[]}/>);
        tooltip = mount(MyCancerGenome.myCancerGenomeLinks(["link1, link2"]));
        emptyListTooltip = mount(MyCancerGenome.myCancerGenomeLinks([]));

    });

    it('component icon', () => {
        assert.isTrue(component.find("img").exists(),
            "There should be an image icon for a valid list of links");
        assert.isFalse(emptyListComponent.find("img").exists(),
            "There should not be an image icon for an invalid list of links");
    });

    it('tooltip content', () => {
        assert.isTrue(tooltip.find("li").exists(),
            "There should be a list element for a valid list of links");
        assert.isFalse(emptyListTooltip.find("li").exists(),
            "There should not be a list element for an invalid list of links");
    });

    after(()=>{

    });
});
