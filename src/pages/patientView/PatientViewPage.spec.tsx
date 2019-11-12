import  PatientViewPage from './PatientViewPage';
import React from 'react';
import {assert} from 'chai';
import sinon from 'sinon';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';

const componentUnderTest: PatientViewPage = (PatientViewPage as any).wrappedComponent;


describe('PatientViewPage', () => {

    describe('handleSampleClick', () => {

        const handleSampleClick = (componentUnderTest as any).prototype.handleSampleClick;

        let updateRouteStub: sinon.SinonStub,
        urlWrapper: PatientViewUrlWrapper,
        preventDefaultStub: sinon.SinonStub,
        mock: any,
        ev: Partial<React.MouseEvent<HTMLAnchorElement>>;

        beforeEach(() => {
            updateRouteStub = sinon.stub();
            urlWrapper = new PatientViewUrlWrapper(new ExtendedRouterStore());
            urlWrapper.updateQuery = updateRouteStub;
            preventDefaultStub = sinon.stub();

            mock = {
                props: {
                    routing: {
                        updateRoute: updateRouteStub
                    }
                },
                urlWrapper: urlWrapper,
            };

            ev = {
                preventDefault: preventDefaultStub,
                altKey: false,
            };
        })

        it('calls update route when no modifier keys are pressed', () => {
            handleSampleClick.call(mock, 1, ev);
            assert.isTrue(updateRouteStub.calledOnce);
            assert.isTrue(preventDefaultStub.called);
        });

        it('does not call updateRoute or preventDefault if altKey is true', () => {
            ev.altKey = true;
            handleSampleClick.call(mock, 1, ev);
            assert.isFalse(updateRouteStub.called);
            assert.isFalse(preventDefaultStub.called);
        });


        it('does not call updateRoute or preventDefault if metaKey is true', () => {
            ev.metaKey = true;
            handleSampleClick.call(mock, 1, ev);
            assert.isFalse(updateRouteStub.called);
            assert.isFalse(preventDefaultStub.called);
        });

        it('does not call updateRoute or preventDefault if shiftKey is true', () => {
            ev.shiftKey = true;
            handleSampleClick.call(mock, 1, ev);
            assert.isFalse(updateRouteStub.called);
            assert.isFalse(preventDefaultStub.called);
        });

    })

});
