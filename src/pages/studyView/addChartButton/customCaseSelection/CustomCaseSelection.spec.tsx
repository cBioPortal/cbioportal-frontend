import * as React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import CustomCaseSelection from './CustomCaseSelection';
import {
    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT,
    normalizeCustomCaseSelection,
} from './CustomCaseSelectionUtils';
import { Sample } from 'cbioportal-ts-api-client';
import { CustomChartData } from 'shared/api/session-service/sessionServiceModels';
import { act } from 'react-dom/test-utils';
import $ from 'jquery';

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

    describe('custom selection delimiters', () => {
        let jqueryDescriptor: PropertyDescriptor | undefined;

        beforeEach(() => {
            jqueryDescriptor = Object.getOwnPropertyDescriptor(global, '$');
            Object.defineProperty(global, '$', {
                configurable: true,
                writable: true,
                value: $,
            });
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
            if (jqueryDescriptor) {
                Object.defineProperty(global, '$', jqueryDescriptor);
            } else {
                Reflect.deleteProperty(global, '$');
            }
        });

        function renderSelection(samples: Sample[] = [s1, s2, s3]) {
            const onSubmit = jest.fn<void, [CustomChartData]>();
            wrapper = mount(
                <CustomCaseSelection
                    allSamples={samples}
                    selectedSamples={[]}
                    queriedStudies={Array.from(
                        new Set(samples.map(sample => sample.studyId))
                    )}
                    disableGrouping={true}
                    contentNormalizer={normalizeCustomCaseSelection}
                    onSubmit={onSubmit}
                />
            );
            return onSubmit;
        }

        function enterContent(content: string) {
            act(() => {
                const textarea = wrapper.find(
                    '[data-test="CustomCaseSetInput"]'
                );
                textarea.getDOMNode<HTMLTextAreaElement>().value = content;
                textarea.simulate('change');
                jest.runOnlyPendingTimers();
            });
            wrapper.update();
        }

        function submitSelection() {
            wrapper
                .find('[data-test="CustomCaseSetSubmitButton"]')
                .simulate('click');
        }

        it.each([' ', ',', '\n', '\t', '\t\t'])(
            'submits every sample separated by %j',
            delimiter => {
                const onSubmit = renderSelection([s1, s2]);
                enterContent(['sample1', 'sample2'].join(delimiter));
                submitSelection();

                expect(onSubmit).toHaveBeenCalledTimes(1);
                expect(
                    onSubmit.mock.calls[0][0].data.map(row => row.sampleId)
                ).toEqual(['sample1', 'sample2']);
            }
        );

        it('submits study-qualified samples with mixed delimiters', () => {
            const onSubmit = renderSelection();
            enterContent(
                '  study1:sample1,\tstudy2:sample3\tstudy1:sample2 \n study1:sample1  '
            );
            submitSelection();

            expect(
                onSubmit.mock.calls[0][0].data.map(row => [
                    row.studyId,
                    row.sampleId,
                ])
            ).toEqual([
                ['study1', 'sample1'],
                ['study2', 'sample3'],
                ['study1', 'sample2'],
            ]);
        });

        it('ignores empty entries and duplicate identifiers in mixed input', () => {
            const onSubmit = renderSelection([s1, s2]);
            enterContent('sample1\t\t, sample1 \n sample2');
            submitSelection();

            expect(
                onSubmit.mock.calls[0][0].data.map(row => row.sampleId)
            ).toEqual(['sample1', 'sample2']);
        });

        it('submits all samples belonging to tab-separated patient IDs', () => {
            const secondPatientSample = makeSample(
                'study1',
                'sample4',
                'patient1'
            );
            const onSubmit = renderSelection([s1, s2, secondPatientSample]);
            const patientInput = wrapper.find('input[data-value="PATIENT"]');
            patientInput.simulate('change', {
                target: patientInput.getDOMNode(),
            });
            enterContent('patient1\tpatient2');
            submitSelection();

            expect(onSubmit.mock.calls[0][0].patientAttribute).toBe(true);
            expect(
                onSubmit.mock.calls[0][0].data.map(row => row.sampleId)
            ).toEqual(['sample1', 'sample4', 'sample2']);
        });

        it('respects study qualification for tab-separated patient IDs', () => {
            const sharedPatient = makeSample('study2', 'sample4', 'patient1');
            const onSubmit = renderSelection([s1, s2, s3, sharedPatient]);
            const patientInput = wrapper.find('input[data-value="PATIENT"]');
            patientInput.simulate('change', {
                target: patientInput.getDOMNode(),
            });
            enterContent('study2:patient1\tstudy1:patient2');
            submitSelection();

            expect(
                onSubmit.mock.calls[0][0].data.map(row => [
                    row.studyId,
                    row.sampleId,
                ])
            ).toEqual([
                ['study2', 'sample4'],
                ['study1', 'sample2'],
            ]);
        });

        it('warns about an invalid ID after a tab and submits the valid sample', () => {
            const onSubmit = renderSelection([s1, s2]);
            enterContent('sample1\tmissing');

            expect(
                wrapper
                    .find('[data-test="ValidationResultWarning"]')
                    .map(warning => warning.text())
                    .join(' ')
            ).toContain('missing');
            submitSelection();
            expect(
                onSubmit.mock.calls[0][0].data.map(row => row.sampleId)
            ).toEqual(['sample1']);
        });

        it.each(['Group1', '0'])(
            'preserves tab-separated custom data values without the selection normalizer: %s',
            value => {
                const onSubmit = jest.fn<void, [CustomChartData]>();
                wrapper = mount(
                    <CustomCaseSelection
                        allSamples={[s1, s2]}
                        selectedSamples={[]}
                        queriedStudies={['study1']}
                        onSubmit={onSubmit}
                    />
                );
                if (value === '0') {
                    const numericalInput = wrapper.find(
                        'input[data-value="NUMERICAL"]'
                    );
                    numericalInput.simulate('change', {
                        target: numericalInput.getDOMNode(),
                    });
                }
                enterContent(
                    `study1:sample1\t${value}\nstudy1:sample2\t${value}`
                );
                submitSelection();

                expect(
                    onSubmit.mock.calls[0][0].data.map(row => row.value)
                ).toEqual([value, value]);
                expect(onSubmit.mock.calls[0][0].datatype).toBe(
                    value === '0' ? 'NUMBER' : 'STRING'
                );
            }
        );
    });
});
