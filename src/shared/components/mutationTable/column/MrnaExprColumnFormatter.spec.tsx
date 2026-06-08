import MrnaExprColumnFormatter from './MrnaExprColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

describe('MrnaExprColumnFormatter', () => {
    it('renders a histogram when all raw values are identical', () => {
        const histogram = (MrnaExprColumnFormatter as any).getExpressionHistogram(
            [
                { sampleId: 'S1', value: 5 },
                { sampleId: 'S2', value: 5 },
            ],
            'S1'
        );

        assert.isNotNull(histogram);
        const wrapper = shallow(<div>{histogram}</div>);
        assert.isTrue(wrapper.find('rect').exists());
    });

    it('does not prefetch source expression data during render', () => {
        const rankCache = { get: sinon.stub().returns(null) } as any;
        const sourceCache = {
            get: sinon.stub(),
            peek: sinon.stub().returns(null),
        } as any;

        MrnaExprColumnFormatter.renderFunction(
            [{ sampleId: 'S1', entrezGeneId: 1017 } as any],
            rankCache,
            sourceCache,
            'study_mrna'
        );

        sinon.assert.notCalled(sourceCache.get);
    });

    it('shows loading state instead of Gaussian fallback while raw distribution is loading', () => {
        const tooltip = (MrnaExprColumnFormatter as any).getTooltipContents(
            {
                status: 'complete',
                data: {
                    zScore: -0.8672,
                    percentile: 30.5,
                },
            },
            'S1',
            1017,
            { peek: sinon.stub().returns(null) } as any,
            'study_mrna'
        );

        const wrapper = shallow(<div>{tooltip}</div>);
        assert.include(wrapper.text(), 'Loading expression distribution...');
        assert.notInclude(wrapper.text(), 'mean');
        assert.notInclude(wrapper.text(), 'Distribution of expression across all samples in this study for this gene:');
        assert.notInclude(wrapper.text(), 'mRNA z-score');
    });
});
