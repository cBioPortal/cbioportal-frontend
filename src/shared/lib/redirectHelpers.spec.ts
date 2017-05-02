import { restoreRouteAfterRedirect } from './redirectHelpers';
import sinon from 'sinon';
import ExtendedRouterStore from "./ExtendedRouterStore";
import { assert } from 'chai';

describe('restoreRouteAfterRedirect', ()=>{

    let getItemStub: sinon.SinonStub;
    let removeItemStub: sinon.SinonStub;
    let stores:any;

    beforeEach(()=>{

        stores = {
            routing:{
                location: {
                    query: {
                        key: "mooo"
                    }
                },
                push:sinon.stub(),
                updateRoute:()=>{}
            }

        };

        removeItemStub = sinon.stub(window.localStorage, 'removeItem');
        getItemStub = sinon.stub(window.localStorage, 'getItem');
    });

    afterEach(()=>{
        getItemStub.restore();
        removeItemStub.restore();
    });

    it('calls getItem with appropriate key', ()=>{
        restoreRouteAfterRedirect(stores as any);
        assert.isTrue(getItemStub.calledOnce);
        assert.equal(getItemStub.args[0][0], "mooo");
    });

    it('if no key is available, we redirect to root route', ()=>{
        getItemStub.returns(undefined);
        restoreRouteAfterRedirect(stores as any);
        assert.isTrue((stores.routing.push as sinon.SinonStub).calledWith("/"));
        assert.isFalse(removeItemStub.called);

    });

    it('if key is available, we redirect to it, sans #, delete key', ()=>{
        getItemStub.returns("#one/two");
        restoreRouteAfterRedirect(stores as any);
        assert.isTrue(removeItemStub.calledOnce);
        assert.isTrue(stores.routing.push.calledWith("one/two"));
    });

});


// const key = injected.routing.location.query.key;
// let restoreRoute = window.localStorage.getItem(key);
// if (restoreRoute) {
//     restoreRoute = restoreRoute.replace(/^#/, '');
//     window.localStorage.removeItem(key);
//     injected.routing.push(restoreRoute);
//     return null;
// } else {
//     injected.routing.push('/');
// }