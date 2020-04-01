import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';

import MyCancerGenome, { myCancerGenomeLinks } from './MyCancerGenome';

describe('MyCancerGenome', () => {
    it('component icon', () => {
        const component = render(
            <MyCancerGenome linksHTML={['link1, link2']} />
        );
        assert.isAbove(
            component.container.getElementsByTagName('img').length,
            0,
            'There should be an image icon for a valid list of links'
        );

        const emptyListComponent = render(<MyCancerGenome linksHTML={[]} />);
        assert.equal(
            emptyListComponent.container.getElementsByTagName('img').length,
            0,
            'There should not be an image icon for an invalid list of links'
        );
    });

    it('tooltip content', () => {
        const tooltip = render(myCancerGenomeLinks(['link1, link2']));
        assert.isAbove(
            tooltip.container.getElementsByTagName('li').length,
            0,
            'There should be a list element for a valid list of links'
        );

        const emptyListTooltip = render(myCancerGenomeLinks([]));
        assert.equal(
            emptyListTooltip.container.getElementsByTagName('li').length,
            0,
            'There should not be a list element for an invalid list of links'
        );
    });
});
