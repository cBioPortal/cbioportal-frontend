import * as React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import CustomCaseSelection from './CustomCaseSelection';
import { DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT } from './CustomCaseSelectionUtils';
import { Sample } from 'cbioportal-ts-api-client';
import { act } from 'react-dom/test-utils';

function makeSample(
    studyId: string,
    sampleId: string,
    patientId: string
): Sample {
    return ({
        studyId,
        sampleId,
        patientId,
        uniqueSampleKey: `${studyId}_${sampleId}`,
        uniquePatientKey: `${studyId}_${patientId}`,
        copyNumberSegmentPresent: false,
        sampleType: 'Primary Solid Tumor',
        sequenced: true,
    } as unknown) as Sample;
}

describe('CustomCaseSelection', () => {
    const s1 = makeSample('study1', 'sample1', 'patient1');
    const s2 = makeSample('study1', 'sample2', 'patient2');
    const s3 = makeSample('study2', 'sample3', 'patient3');

    let wrapper: ReactWrapper;

    afterEach(() => {
        wrapper.unmount();
    });

    describe('single-study mode', () => {
        it('auto-populates selected cases without study prefix', () => {
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={[s1, s2]}
                    selectedSamples={[s1]}
                    queriedStudies={['study1']}
                    onSubmit={() => {}}
                />
            );

            wrapper
                .find('[data-test="AddCurrentlySelectedCases"]')
                .simulate('click');
            wrapper.update();

            const textarea = wrapper.find('[data-test="CustomCaseSetInput"]');
            assert.equal(
                textarea.prop('value'),
                `sample1 ${DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT}`
            );
        });

        it('auto-populates unselected cases without study prefix', () => {
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={[s1, s2]}
                    selectedSamples={[s1]}
                    queriedStudies={['study1']}
                    onSubmit={() => {}}
                />
            );

            wrapper
                .find('[data-test="AddCurrentlyUnselectedCases"]')
                .simulate('click');
            wrapper.update();

            const textarea = wrapper.find('[data-test="CustomCaseSetInput"]');
            assert.equal(
                textarea.prop('value'),
                `sample2 ${DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT}`
            );
        });

        it('placeholder omits study_id prefix', () => {
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={[s1, s2]}
                    selectedSamples={[]}
                    queriedStudies={['study1']}
                    onSubmit={() => {}}
                />
            );

            const placeholder = wrapper
                .find('[data-test="CustomCaseSetInput"]')
                .prop('placeholder') as string;
            assert.isFalse(
                placeholder.includes('study_id:'),
                'single-study placeholder should not contain study_id:'
            );
        });
    });

    describe('multi-study mode', () => {
        it('shows actionable guidance for an ID shared by two studies', async () => {
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={[
                        s1,
                        makeSample('study2', 'sample1', 'patient1'),
                    ]}
                    selectedSamples={[]}
                    queriedStudies={['study1', 'study2']}
                    onSubmit={() => {}}
                />
            );

            await act(async () => {
                (wrapper.instance() as CustomCaseSelection).onChange('sample1');
            });
            wrapper.update();

            const warning = wrapper.find(
                '[data-test="ValidationResultWarning"]'
            );
            assert.lengthOf(warning, 1);
            assert.include(
                warning.text(),
                'By default, these samples will be included in all the studies in which they exist.'
            );
            assert.include(
                warning.text(),
                'study_id:sample_id. Sample IDs: sample1'
            );
            assert.isFalse(
                wrapper
                    .find('[data-test="CustomCaseSetSubmitButton"]')
                    .prop('disabled')
            );
        });

        it('auto-populates selected cases with study prefix', () => {
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={[s1, s2, s3]}
                    selectedSamples={[s1]}
                    queriedStudies={['study1', 'study2']}
                    onSubmit={() => {}}
                />
            );

            wrapper
                .find('[data-test="AddCurrentlySelectedCases"]')
                .simulate('click');
            wrapper.update();

            const textarea = wrapper.find('[data-test="CustomCaseSetInput"]');
            assert.equal(
                textarea.prop('value'),
                `study1:sample1 ${DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT}`
            );
        });

        it('placeholder includes study_id prefix', () => {
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={[s1, s2, s3]}
                    selectedSamples={[]}
                    queriedStudies={['study1', 'study2']}
                    onSubmit={() => {}}
                />
            );

            const placeholder = wrapper
                .find('[data-test="CustomCaseSetInput"]')
                .prop('placeholder') as string;
            assert.isTrue(
                placeholder.includes('study_id:'),
                'multi-study placeholder should contain study_id:'
            );
        });
    });
});
