import GenomicOverview from './GenomicOverview';
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ShallowWrapper, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import SampleManager from "../sampleManager";
import {ThumbnailExpandVAFPlot} from "../vafPlot/ThumbnailExpandVAFPlot";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {MutationFrequenciesBySample} from "../vafPlot/VAFPlot";

describe('GenomicOverview', () => {
    let genomicOverview:ShallowWrapper<any,any>;
    let mergedMutations:any[][];
    function getVAFFrequencies(genomicOverview:ShallowWrapper<any, any>) {
        return genomicOverview.find(ThumbnailExpandVAFPlot).props().data;
    }
    function assertDeepEqualFrequencies(actual:MutationFrequenciesBySample, expected:MutationFrequenciesBySample, message:string) {
        assert.equal(Object.keys(actual).length, Object.keys(expected).length, message);
        for (const sample of Object.keys(actual)) {
            const actualList = actual[sample];
            const expectedList = expected[sample];
            for (let i=0; i<actualList.length; i++) {
                if (isNaN(actualList[i])) {
                    assert.isTrue(isNaN(expectedList[i]), message);
                } else {
                    assert.closeTo(actualList[i], expectedList[i], 0.0000001, message);
                }
            }
        }
    }


    describe("computing VAF plot frequencies", ()=>{
        it('computes the correct frequencies for a single sample', ()=>{
            mergedMutations = [];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            assert.deepEqual(getVAFFrequencies(genomicOverview), {}, "no frequencies with no mutations");

            mergedMutations = [
                [{sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30}]
            ];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            let frequencies = getVAFFrequencies(genomicOverview);
            assertDeepEqualFrequencies(frequencies, {sample1: [0.25]}, "correctly calculates variant allele frequencies")

            mergedMutations = [
                [{sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30}],
                [{sampleId: 'sample1', tumorAltCount: 1, tumorRefCount: 5}],
                [{sampleId: 'sample1', tumorAltCount: 2, tumorRefCount: 8}],
                [{sampleId: 'sample1', tumorAltCount: 100, tumorRefCount: 1000}]
            ];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            frequencies = getVAFFrequencies(genomicOverview);
            assertDeepEqualFrequencies(frequencies, {sample1: [1/4, 1/6, 1/5, 1/11]}, "correctly calculates, part 2");
        });
        it(`computes the correct frequencies for multiple samples, such that 
                the frequency lists are the same length, padded by NaNs for any 
                mutation which that sample does not have`, ()=>{

            // cases:
            // one mutation for one sample
            // one mutation for both samples
            // a few mutations with both, some with either one
            // a few mutations with both
            let frequencies;
            mergedMutations = [[{sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30}]];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{sample1:1, sample2:2}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            frequencies = getVAFFrequencies(genomicOverview);
            assertDeepEqualFrequencies(frequencies, {sample1:[1/4], sample2:[NaN]}, "case: one mutation for one sample");

            mergedMutations = [[
                {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30},
                {sampleId: 'sample2', tumorAltCount: 20, tumorRefCount: 30}
            ]];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{sample1:1, sample2:2}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            frequencies = getVAFFrequencies(genomicOverview);
            assertDeepEqualFrequencies(frequencies, {sample1:[1/4], sample2:[2/5]}, "case: one mutation for both samples");

            mergedMutations = [[
                {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30},
                {sampleId: 'sample2', tumorAltCount: 20, tumorRefCount: 30}
            ],
                [
                    {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30},
                    {sampleId: 'sample2', tumorAltCount: 20, tumorRefCount: 30}
                ],
                [
                    {sampleId: 'sample2', tumorAltCount: 30, tumorRefCount: 80}
                ],
                [
                    {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 40},
                ],
                [
                    {sampleId: 'sample1', tumorAltCount: 20, tumorRefCount: 40},
                ],];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{sample1:1, sample2:2}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            frequencies = getVAFFrequencies(genomicOverview);
            assertDeepEqualFrequencies(frequencies, {sample1:[1/4, 1/4, 1/5, 1/3, NaN], sample2:[2/5, 2/5, 3/11, NaN, NaN]}, "case: a few mutations for both, a few for only one");

            mergedMutations = [[
                {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30},
                {sampleId: 'sample2', tumorAltCount: 20, tumorRefCount: 30}
            ],
                [
                    {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30},
                    {sampleId: 'sample2', tumorAltCount: 20, tumorRefCount: 30}
                ],
                [
                    {sampleId: 'sample1', tumorAltCount: 30, tumorRefCount: 80},
                    {sampleId: 'sample2', tumorAltCount: 30, tumorRefCount: 80}
                ],
                [
                    {sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 40},
                    {sampleId: 'sample2', tumorAltCount: 10, tumorRefCount: 40}
                ],
                [
                    {sampleId: 'sample1', tumorAltCount: 20, tumorRefCount: 40},
                    {sampleId: 'sample2', tumorAltCount: 10, tumorRefCount: 40}
                ],];
            genomicOverview = shallow(<GenomicOverview
                mergedMutations={mergedMutations}
                sequencedSamples={{}}
                cnaSegments={[]}
                sampleOrder={{sample1:1, sample2:2}}
                sampleLabels={{}}
                sampleColors={{}}
                sampleManager={new SampleManager([])}
                getContainerWidth={()=>20}
            />);
            frequencies = getVAFFrequencies(genomicOverview);
            assertDeepEqualFrequencies(frequencies, {sample1:[1/4, 1/4, 3/11, 1/5, 1/3], sample2:[2/5, 2/5, 3/11, 1/5, 1/5]}, "case: all mutations for both");
        });
    });

});
