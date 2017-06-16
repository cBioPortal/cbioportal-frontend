import  PatientViewPage from './PatientViewPage';
import React from 'react';
import {assert} from 'chai';
import {shallow, mount} from 'enzyme';
import sinon from 'sinon';

const componentUnderTest: PatientViewPage = (PatientViewPage as any).wrappedComponent;


describe('PatientViewPage', () => {

    describe('handleSampleClick', () => {

        const handleSampleClick = (componentUnderTest as any).prototype.handleSampleClick;

        let updateRouteStub: sinon.SinonStub, preventDefaultStub: sinon.SinonStub, mock: any, ev: Partial<React.MouseEvent<HTMLAnchorElement>>;

        beforeEach(() => {
            updateRouteStub = sinon.stub();
            preventDefaultStub = sinon.stub();

            mock = {
                props: {
                    routing: {
                        updateRoute: updateRouteStub
                    }
                }
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
