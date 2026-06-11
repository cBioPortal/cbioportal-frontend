/**
 * @jest-environment jsdom
 */
import MrnaExprColumnFormatter from './MrnaExprColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'seamless-immutable';

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

    it('adds count and median context to raw histogram output', () => {
        const histogram = (MrnaExprColumnFormatter as any).getExpressionHistogram(
            [
                { sampleId: 'S1', value: 1 },
                { sampleId: 'S2', value: 2 },
                { sampleId: 'S3', value: 3 },
            ],
            'S2'
        );

        const wrapper = shallow(<div>{histogram}</div>);
        assert.include(wrapper.text(), 'n=3');
        assert.include(wrapper.text(), 'median 2');
    });

    it('renders histogram from immutable raw values without throwing', () => {
        const histogram = (MrnaExprColumnFormatter as any).getExpressionHistogram(
            Immutable.from([
                { sampleId: 'S1', value: 1 },
                { sampleId: 'S2', value: 2 },
                { sampleId: 'S3', value: 3 },
            ]) as any,
            'S2'
        );

        assert.isNotNull(histogram);
        const wrapper = shallow(<div>{histogram}</div>);
        assert.include(wrapper.text(), 'n=3');
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
        assert.notInclude(
            wrapper.text(),
            'Distribution of expression across samples in this study for this gene:'
        );
        assert.notInclude(wrapper.text(), 'mRNA z-score');
    });

    it('renders 3 distribution sections when cancer type maps are provided', () => {
        const allData = [
            { sampleId: 'S1', uniqueSampleKey: 'UK1', value: 1 },
            { sampleId: 'S2', uniqueSampleKey: 'UK2', value: 2 },
            { sampleId: 'S3', uniqueSampleKey: 'UK3', value: 3 },
            { sampleId: 'S4', uniqueSampleKey: 'UK4', value: 4 },
        ];
        const sourceCache = {
            peek: sinon.stub().returns({
                status: 'complete',
                data: allData,
            }),
        } as any;
        const cancerTypeMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
            UK3: 'Lung Cancer',
            UK4: 'Breast Cancer',
        };
        const cancerTypeDetailedMap: { [key: string]: string } = {
            UK1: 'Invasive Breast Carcinoma',
            UK2: 'Breast Cancer NOS',
            UK3: 'Lung Adenocarcinoma',
            UK4: 'Invasive Breast Carcinoma',
        };

        const tooltip = (MrnaExprColumnFormatter as any).getTooltipContents(
            {
                status: 'complete',
                data: { zScore: -0.5, percentile: 25 },
            },
            'S1',
            1017,
            sourceCache,
            'study_mrna',
            cancerTypeMap,
            cancerTypeDetailedMap
        );

        const wrapper = shallow(<div>{tooltip}</div>);
        const text = wrapper.text();
        assert.include(text, 'Breast Cancer:');
        assert.include(text, 'Invasive Breast Carcinoma:');
        assert.include(text, 'All samples:');
    });

    it('skips cancer type detailed when it matches cancer type', () => {
        const allData = [
            { sampleId: 'S1', uniqueSampleKey: 'UK1', value: 1 },
            { sampleId: 'S2', uniqueSampleKey: 'UK2', value: 2 },
        ];
        const sourceCache = {
            peek: sinon.stub().returns({
                status: 'complete',
                data: allData,
            }),
        } as any;
        const cancerTypeMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
        };
        const cancerTypeDetailedMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
        };

        const tooltip = (MrnaExprColumnFormatter as any).getTooltipContents(
            {
                status: 'complete',
                data: { zScore: 0, percentile: 50 },
            },
            'S1',
            1017,
            sourceCache,
            'study_mrna',
            cancerTypeMap,
            cancerTypeDetailedMap
        );

        const wrapper = shallow(<div>{tooltip}</div>);
        const text = wrapper.text();
        assert.include(text, 'Breast Cancer:');
        assert.include(text, 'All samples:');
        // cancer type detailed section should be skipped since it matches cancer type
        const matches = text.match(/Breast Cancer:/g);
        assert.equal(matches?.length, 1);
    });

    it('uses shared x and y scales across raw tooltip histograms for a gene', () => {
        const allData = [
            { sampleId: 'S1', uniqueSampleKey: 'UK1', value: 1 },
            { sampleId: 'S2', uniqueSampleKey: 'UK2', value: 2 },
            { sampleId: 'S3', uniqueSampleKey: 'UK3', value: 3 },
            { sampleId: 'S4', uniqueSampleKey: 'UK4', value: 8 },
            { sampleId: 'S5', uniqueSampleKey: 'UK5', value: 8 },
            { sampleId: 'S6', uniqueSampleKey: 'UK6', value: 8 },
        ];
        const sourceCache = {
            peek: sinon.stub().returns({
                status: 'complete',
                data: allData,
            }),
        } as any;
        const cancerTypeMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
            UK3: 'Breast Cancer',
            UK4: 'Lung Cancer',
            UK5: 'Lung Cancer',
            UK6: 'Lung Cancer',
        };
        const cancerTypeDetailedMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
            UK3: 'Breast Cancer',
            UK4: 'Lung Cancer',
            UK5: 'Lung Cancer',
            UK6: 'Lung Cancer',
        };

        const tooltip = (MrnaExprColumnFormatter as any).getTooltipContents(
            {
                status: 'complete',
                data: { zScore: -0.5, percentile: 25 },
            },
            'S1',
            1017,
            sourceCache,
            'study_mrna',
            cancerTypeMap,
            cancerTypeDetailedMap
        );

        const wrapper = shallow(<div>{tooltip}</div>);
        const svgs = wrapper.find('svg');
        assert.isAtLeast(svgs.length, 2);

        const breastText = svgs.at(0).text();
        assert.include(breastText, '8');

        const getMaxRectHeight = (svgIndex: number) =>
            Math.max(
                ...svgs
                    .at(svgIndex)
                    .find('rect')
                    .map(r => Number(r.prop('height') || 0))
            );
        assert.isBelow(getMaxRectHeight(0), getMaxRectHeight(1));

        const extractAxisBounds = (svgIndex: number) => {
            const labels = svgs
                .at(svgIndex)
                .find('text')
                .map(node => node.text())
                .filter(label => label !== 'median');
            return {
                min: labels[0],
                max: labels[labels.length - 1],
            };
        };
        const bounds0 = extractAxisBounds(0);
        const bounds1 = extractAxisBounds(1);
        assert.equal(bounds0.min, bounds1.min);
        assert.equal(bounds0.max, bounds1.max);
    });

    it('allows selecting cancer-type reference for shared histogram scaling', () => {
        const allData = [
            { sampleId: 'S1', uniqueSampleKey: 'UK1', value: 1 },
            { sampleId: 'S2', uniqueSampleKey: 'UK2', value: 2 },
            { sampleId: 'S3', uniqueSampleKey: 'UK3', value: 3 },
            { sampleId: 'S4', uniqueSampleKey: 'UK4', value: 100 },
        ];
        const sourceCache = {
            peek: sinon.stub().returns({
                status: 'complete',
                data: allData,
            }),
        } as any;
        const cancerTypeMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
            UK3: 'Breast Cancer',
            UK4: 'Lung Cancer',
        };
        const cancerTypeDetailedMap: { [key: string]: string } = {
            UK1: 'Breast Cancer',
            UK2: 'Breast Cancer',
            UK3: 'Breast Cancer',
            UK4: 'Lung Cancer',
        };

        const tooltip = (MrnaExprColumnFormatter as any).getTooltipContents(
            {
                status: 'complete',
                data: { zScore: -0.5, percentile: 25 },
            },
            'S1',
            1017,
            sourceCache,
            'study_mrna',
            cancerTypeMap,
            cancerTypeDetailedMap,
            'cancer-type'
        );

        const wrapper = shallow(<div>{tooltip}</div>);
        const firstHistogramText = wrapper.find('svg').at(0).text();
        assert.include(firstHistogramText, '3');
        assert.notInclude(firstHistogramText, '100');
    });
});
