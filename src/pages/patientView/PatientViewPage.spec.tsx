import { PatientViewPageInner } from './PatientViewPage';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';
import * as PatientViewPageUtils from './PatientViewPageUtils';

const componentUnderTest: PatientViewPageInner = (PatientViewPageInner as any)
    .wrappedComponent;

describe('PatientViewPage', () => {
    describe('componentDidMount', () => {
        const normalizeBasePatientRoute = (componentUnderTest as any).prototype
            .normalizeBasePatientRoute;

        it('redirects bare /patient routes to /patient/summary', () => {
            const updateRoute = sinon.stub();
            normalizeBasePatientRoute.call({
                props: {
                    routing: {
                        location: { pathname: '/patient' },
                        updateRoute,
                    },
                },
            });

            assert.isTrue(updateRoute.calledOnceWithExactly(
                {},
                'patient/summary',
                false,
                true
            ));
        });

        it('does not redirect when a patient tab is already present in the path', () => {
            const updateRoute = sinon.stub();
            normalizeBasePatientRoute.call({
                props: {
                    routing: {
                        location: { pathname: '/patient/pathways' },
                        updateRoute,
                    },
                },
            });

            assert.isFalse(updateRoute.called);
        });
    });

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

    describe('shouldShowResources', () => {
        const descriptor = Object.getOwnPropertyDescriptor(
            (componentUnderTest as any).prototype,
            'shouldShowResources'
        )!;

        it('returns false when resource data has not finished loading', () => {
            const result = descriptor.get!.call({
                pageStore: {
                    resourceIdToResourceData: {
                        isComplete: false,
                    },
                },
            });

            assert.isFalse(result);
        });

        it('returns true when any visible resource is present', () => {
            const result = descriptor.get!.call({
                pageStore: {
                    resourceIdToResourceData: {
                        isComplete: true,
                        result: {
                            resourceA: [
                                {
                                    displayName: 'Visible',
                                    resourceType: 'LINK',
                                },
                            ],
                        },
                    },
                },
            });

            assert.isTrue(result);
        });
    });

    describe('gene filter menu helpers', () => {
        const mutationTableShowGeneFilterMenu = (
            componentUnderTest as any
        ).prototype.mutationTableShowGeneFilterMenu;
        const cnaTableShowGeneFilterMenu = (componentUnderTest as any).prototype
            .cnaTableShowGeneFilterMenu;

        it('returns false for mutation gene filter when fewer than two samples are present', () => {
            const checkStub = sinon.stub(
                PatientViewPageUtils,
                'checkNonProfiledGenesExist'
            );

            const result = mutationTableShowGeneFilterMenu.call(
                {
                    pageStore: {
                        mergedMutationDataIncludingUncalled: [],
                    },
                },
                ['S-1']
            );

            assert.isFalse(result);
            assert.isFalse(checkStub.called);
            checkStub.restore();
        });

        it('deduplicates mutation entrez gene ids before checking profiling gaps', () => {
            const checkStub = sinon
                .stub(PatientViewPageUtils, 'checkNonProfiledGenesExist')
                .returns(true);
            const pageStore = {
                mergedMutationDataIncludingUncalled: [
                    [{ entrezGeneId: 1 }],
                    [{ entrezGeneId: 2 }],
                    [{ entrezGeneId: 1 }],
                ],
                sampleToMutationGenePanelId: { result: { 'S-1': 'panel' } },
                genePanelIdToEntrezGeneIds: { result: { panel: [1, 2] } },
            };

            const result = mutationTableShowGeneFilterMenu.call(
                { pageStore },
                ['S-1', 'S-2']
            );

            assert.isTrue(result);
            assert.deepEqual(checkStub.firstCall.args[1], [1, 2]);
            checkStub.restore();
        });

        it('returns false for cna gene filter when fewer than two samples are present', () => {
            const checkStub = sinon.stub(
                PatientViewPageUtils,
                'checkNonProfiledGenesExist'
            );

            const result = cnaTableShowGeneFilterMenu.call(
                {
                    pageStore: {
                        mergedDiscreteCNAData: [],
                    },
                },
                ['S-1']
            );

            assert.isFalse(result);
            assert.isFalse(checkStub.called);
            checkStub.restore();
        });

        it('deduplicates cna entrez gene ids before checking profiling gaps', () => {
            const checkStub = sinon
                .stub(PatientViewPageUtils, 'checkNonProfiledGenesExist')
                .returns(true);
            const pageStore = {
                mergedDiscreteCNAData: [
                    [{ entrezGeneId: 5 }],
                    [{ entrezGeneId: 7 }],
                    [{ entrezGeneId: 5 }],
                ],
                sampleToDiscreteGenePanelId: {
                    result: { 'S-1': 'panel' },
                },
                genePanelIdToEntrezGeneIds: { result: { panel: [5, 7] } },
            };

            const result = cnaTableShowGeneFilterMenu.call(
                { pageStore },
                ['S-1', 'S-2']
            );

            assert.isTrue(result);
            assert.deepEqual(checkStub.firstCall.args[1], [5, 7]);
            checkStub.restore();
        });
    });
});
