import MyCancerGenome, {parseMyCancerGenomeLink} from './MyCancerGenome';
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';

describe('MyCancerGenome', () => {
    let component: ReactWrapper<any, any>;
    let emptyListComponent: ReactWrapper<any, any>;
    let tooltip: ReactWrapper<any, any>;
    let emptyListTooltip: ReactWrapper<any, any>;

    before(() => {
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

    it('extracts URL and text from a pre-formatted my cancer genome HTML string', () => {
        const htmlLink =
            '<a href="http://mycancergenome.org/content/disease/colorectal-cancer/kras/38/">KRAS c.37G>T (G13C) Mutation in Colorectal Cancer</a>';

        const parsed = parseMyCancerGenomeLink(htmlLink);

        assert.isNotNull(parsed);
        assert.equal(parsed!.text, "KRAS c.37G>T (G13C) Mutation in Colorectal Cancer");
        assert.equal(parsed!.url, "http://mycancergenome.org/content/disease/colorectal-cancer/kras/38/");
    });

    after(() => {

    });
});
