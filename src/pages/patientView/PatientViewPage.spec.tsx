import { PatientViewPageInner } from './PatientViewPage';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';

const componentUnderTest: PatientViewPageInner = (PatientViewPageInner as any)
    .wrappedComponent;

describe('PatientViewPage', () => {
    describe('handleSampleClick', () => {
        const handleSampleClick = (componentUnderTest as any).prototype
            .handleSampleClick;

        let updateURLStub: sinon.SinonStub,
            preventDefaultStub: sinon.SinonStub,
            mock: any,
            ev: Partial<React.MouseEvent<HTMLAnchorElement>>;

        beforeEach(() => {
            updateURLStub = sinon.stub();

            preventDefaultStub = sinon.stub();

            mock = {
                urlWrapper: {
                    updateURL: updateURLStub,
                    query: { studyId: 'study_a', fusionId: 'F1' },
                },
            };

            ev = {
                preventDefault: preventDefaultStub,
                altKey: false,
            };
        });

        it('calls update route when no modifier keys are pressed', () => {
            handleSampleClick.call(mock, 1, ev);
            assert.isTrue(updateURLStub.calledOnce);
            assert.isTrue(preventDefaultStub.called);
        });

        it('clears the previous case params, keeping the study', () => {
            handleSampleClick.call(mock, 'S2', ev);
            assert.deepEqual(updateURLStub.firstCall.args, [
                { studyId: 'study_a', sampleId: 'S2' },
                undefined,
                true,
            ]);
        });

        it('does not call updateRoute or preventDefault if altKey is true', () => {
            ev.altKey = true;
            handleSampleClick.call(mock, 1, ev);
            assert.isFalse(updateURLStub.called);
            assert.isFalse(preventDefaultStub.called);
        });

        it('does not call updateRoute or preventDefault if metaKey is true', () => {
            ev.metaKey = true;
            handleSampleClick.call(mock, 1, ev);
            assert.isFalse(updateURLStub.called);
            assert.isFalse(preventDefaultStub.called);
        });

        it('does not call updateRoute or preventDefault if shiftKey is true', () => {
            ev.shiftKey = true;
            handleSampleClick.call(mock, 1, ev);
            assert.isFalse(updateURLStub.called);
            assert.isFalse(preventDefaultStub.called);
        });
    });

    describe('handlePatientClick', () => {
        const handlePatientClick = (componentUnderTest as any).prototype
            .handlePatientClick;

        let updateURLStub: sinon.SinonStub, mock: any;

        beforeEach(() => {
            updateURLStub = sinon.stub();
            mock = {
                urlWrapper: {
                    updateURL: updateURLStub,
                    query: { studyId: 'study_a', fusionId: 'F1' },
                },
            };
        });

        it('clears the previous patient params, keeping the study', () => {
            handlePatientClick.call(mock, 'PATIENT_2');
            assert.deepEqual(updateURLStub.firstCall.args, [
                { studyId: 'study_a', caseId: 'PATIENT_2' },
                undefined,
                true,
            ]);
        });

        it('uses the study of a study-qualified patient id', () => {
            handlePatientClick.call(mock, 'study_b:PATIENT_2');
            assert.deepEqual(updateURLStub.firstCall.args, [
                { studyId: 'study_b', caseId: 'PATIENT_2' },
                undefined,
                true,
            ]);
        });
    });
});
