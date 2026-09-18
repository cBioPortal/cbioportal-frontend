import { PatientViewPageInner } from './PatientViewPage';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';
import { getServerConfig } from 'config/config';

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

        it('returns false when only the legacy H&E resource is present', () => {
            const config = getServerConfig() as any;
            const savedUrl = config.msk_wsi_tile_server_url;
            config.msk_wsi_tile_server_url = 'https://slides.example.com';

            try {
                const result = descriptor.get!.call({
                    pageStore: {
                        resourceIdToResourceData: {
                            isComplete: true,
                            result: {
                                MSK_HNE: [
                                    {
                                        resourceId: 'MSK_HNE',
                                        resourceDefinition: {
                                            displayName: 'H&E Slides',
                                        },
                                    },
                                ],
                            },
                        },
                    },
                });

                assert.isFalse(result);
            } finally {
                config.msk_wsi_tile_server_url = savedUrl;
            }
        });
    });

});
