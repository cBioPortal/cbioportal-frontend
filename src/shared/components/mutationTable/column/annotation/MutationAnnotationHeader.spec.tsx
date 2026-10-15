import * as React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import { setServerConfig } from 'config/config';
import MutationAnnotationHeader, {
    AnnotationSourcesTooltip,
} from './MutationAnnotationHeader';

describe('MutationAnnotationHeader', () => {
    beforeAll(() => {
        setServerConfig({
            show_oncokb: true,
            show_civic: true,
            show_hotspot: true,
            show_revue: false,
        });
    });

    it('lists the sources, with the legend of the hovered one', () => {
        const tooltip = mount(
            <AnnotationSourcesTooltip
                name="Annotation"
                enableFunctionalImpact={true}
            />
        );
        assert.include(tooltip.text(), 'OncoKB');
        assert.include(tooltip.text(), 'Cancer Hotspots');
        assert.include(tooltip.text(), 'Functional impact (hidden)');
        tooltip
            .find('[data-test="annotation-source-cancerHotspots"]')
            .simulate('click');
        assert.include(tooltip.text(), 'recurrent mutational hotspots');
    });

    it('leaves out functional impact when it is not available', () => {
        const tooltip = mount(<AnnotationSourcesTooltip name="Annotation" />);
        assert.notInclude(tooltip.text(), 'Functional impact');
    });

    it('shows the predictor icons only with the predictions', () => {
        const icons = '[data-test="annotation-functional-impact-icons"]';
        const hidden = mount(
            <MutationAnnotationHeader
                name="Annotation"
                enableFunctionalImpact={true}
            />
        );
        assert.equal(hidden.find(icons).length, 0);
        const shown = mount(
            <MutationAnnotationHeader
                name="Annotation"
                enableFunctionalImpact={true}
                showFunctionalImpact={true}
            />
        );
        assert.equal(shown.find(icons).length, 1);
    });
});
