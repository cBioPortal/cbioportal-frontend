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

        it('clears the fusion-viewer fusionId when switching sample', () => {
            handleSampleClick.call(mock, 'S2', ev);
            assert.deepEqual(updateURLStub.firstCall.args[0], {
                caseId: undefined,
                sampleId: 'S2',
                fusionId: undefined,
            });
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
            mock = { urlWrapper: { updateURL: updateURLStub } };
        });

        it('clears the fusion-viewer fusionId when switching patient', () => {
            handlePatientClick.call(mock, 'PATIENT_2');
            assert.deepEqual(updateURLStub.firstCall.args[0], {
                caseId: 'PATIENT_2',
                sampleId: undefined,
                fusionId: undefined,
            });
        });

        it('clears fusionId for a study-qualified patient id', () => {
            handlePatientClick.call(mock, 'study_b:PATIENT_2');
            assert.deepEqual(updateURLStub.firstCall.args[0], {
                studyId: 'study_b',
                caseId: 'PATIENT_2',
                sampleId: undefined,
                fusionId: undefined,
            });
        });
    });
});
