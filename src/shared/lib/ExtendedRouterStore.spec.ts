import ExtendedRouterStore, {PortalSession} from './ExtendedRouterStore';
import {assert} from 'chai';
import * as React from 'react';
import * as _ from 'lodash';
import * as $ from 'jquery';
import * as sinon from 'sinon';
import * as mobx from 'mobx';
import {syncHistoryWithStore, SynchronizedHistory} from "mobx-react-router";
import createMemoryHistory from "react-router/lib/createMemoryHistory";
import {MemoryHistory} from "history";
import {SinonStub} from "sinon";
import {sleep} from "./TimeUtils";
import {computed} from "mobx";
import AppConfig from "appConfig";
import {setServerConfig} from "../../config/config";




describe('ExtendedRouterStore', () => {

    let history: SynchronizedHistory;
    let routingStore: ExtendedRouterStore;
    let saveRemoteSessionStub: SinonStub;
    let getRemoteSessionStub: SinonStub;


    beforeEach(()=>{
        routingStore = new ExtendedRouterStore();
        routingStore.urlLengthThresholdForSession = 1000;
        history = syncHistoryWithStore(createMemoryHistory(), routingStore);
        saveRemoteSessionStub = sinon.stub(routingStore,'saveRemoteSession').callsFake(function(){
            return Promise.resolve({ id:'somekey'});
        });
        setServerConfig({ sessionServiceEnabled: true });
        routingStore.location.pathname = '/results';
        routingStore.location.query = {param1: 1, param2: 2, param3: 3};

    });

    afterEach(()=>{
        history.unsubscribe!()
    });

    it('Updating route results in changed location/query when we are under url length limit, does not use session when threshold not met', () => {

        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        });

        assert.equal(routingStore.location.pathname, '/results', 'sets path appropriately');
        assert.deepEqual(routingStore.location.query, {param2: 'altered', param3: 'new'},'removes param1');

    });

    it('Updating route with clear=true will clear all params and except new ones', () => {

        routingStore.updateRoute({
            param3: 'cleared'
        }, undefined, true);


        assert.deepEqual(routingStore.query, {param3: 'cleared'},'removes param1');
        assert.deepEqual(routingStore.location.pathname,'/results');

    });


    it('Updating route results in new session with id in url and data in _session when session is enabled', (done) => {

        // we WILL exceed this limit because it's basically serialized url params
        routingStore.urlLengthThresholdForSession = 4;

        assert.isUndefined(routingStore._session, 'we start with undefined _session');

        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        });

        assert.equal(routingStore.location.pathname, '/results', 'path is the same');
        assert.deepEqual(routingStore.location.query, {session_id:'pending'}, 'sets session id in url to pending');

        assert.isTrue(saveRemoteSessionStub.calledOnce, 'called saveRemote session');

        assert.deepEqual(mobx.toJS(routingStore._session),{
            id:'pending',
            path:'/results',
            query: {
                param2:'altered',
                param3:'new',

            },
            version:routingStore.sessionVersion,
        });

        setTimeout(()=>{
            assert.equal(routingStore.location.query.session_id , 'somekey', 'when session service response it updates url with id');

            assert.deepEqual(mobx.toJS(routingStore._session),{
                id:'somekey',
                path:'/results',
                query: {
                    param2:'altered',
                    param3:'new',

                },
                version:routingStore.sessionVersion,
            });

            done();
        },0);

    });

    it('Does NOT use session when path is not session enabled', () => {

        routingStore.urlLengthThresholdForSession = 4;

        routingStore.location.pathname = '/notEnabled';
        routingStore.location.query = {param1: 1, param2: 2, param3: 3};

        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        });

        assert.isUndefined(routingStore._session,'did not set _session')

        assert.equal(routingStore.location.pathname, '/notEnabled', 'sets path appropriately');
        assert.deepEqual(routingStore.location.query, {param2: 'altered', param3: 'new'},'removes param1');

    });


    it('Restores non-session behavior', () => {

        assert.isUndefined(routingStore._session);

        routingStore.urlLengthThresholdForSession = 4;

        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        });

        assert.isDefined(routingStore._session);
        assert.isDefined(routingStore.location.query.session_id);

        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        },'/notEnabled');

        assert.deepEqual(mobx.toJS(routingStore.location.query),{ param2:'altered', param3:'new'}, 'using url again');
        assert.isUndefined(routingStore.location.query.session_id);

    });


    it('Produces new session when query changes', async () => {

        assert.isUndefined(routingStore._session);

        routingStore.urlLengthThresholdForSession = 4;

        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        });

        assert.isDefined(routingStore._session);
        assert.isDefined(routingStore.location.query.session_id);

        await sleep(0);

        assert.equal(routingStore.location.query.session_id, 'somekey','we have non-pending session_id');

        saveRemoteSessionStub.returns(Promise.resolve({id:'monkeys'}));

        // now change route again
        routingStore.updateRoute({
            param1: undefined,
            param2: 'blah',
            param3: 'another'
        });

        assert.equal(routingStore.location.query.session_id, 'pending', 'goes to pending');

        await sleep(0);

        assert.equal(routingStore.location.query.session_id, 'monkeys','we have a new session id');

    });

    it('#sessionEnabledForPath handles deep routes', ()=>{

        assert.isTrue(routingStore.sessionEnabledForPath('/results'), 'shallow');
        assert.isTrue(routingStore.sessionEnabledForPath('/results/'), 'trailing slash');
        assert.isTrue(routingStore.sessionEnabledForPath('/results/oncoprint'), 'deep');
        assert.isFalse(routingStore.sessionEnabledForPath('/notEnabled'), 'no match');

    });

    it('#query getter gets query from _session or url depending on session status', ()=>{

        routingStore.urlLengthThresholdForSession = 4;

        assert.deepEqual(mobx.toJS(routingStore.query),{param1: 1, param2: 2, param3: 3});

        //make a sesssion
        routingStore.updateRoute({
            param1: undefined,
            param2: 'altered',
            param3: 'new'
        });

        assert.isUndefined(routingStore.location.query.param2);
        assert.deepEqual(mobx.toJS(routingStore.query),{ param2: 'altered', param3: 'new'}, 'can still get it even though not in location anymore');

    });

    it('#query getter gets query from _session or url depending on session status', ()=>{

        assert.isFalse(routingStore.needsRemoteSessionLookup, 'false by default');

        routingStore.location.query.session_id = undefined;
        assert.isFalse(routingStore.needsRemoteSessionLookup, 'undefined session_id');

        routingStore.location.query.session_id = "pending";
        assert.isFalse(routingStore.needsRemoteSessionLookup, 'session_id = pending');

        routingStore.location.query.session_id = "12345";
        assert.isTrue(routingStore.needsRemoteSessionLookup, '_session is undefined');

        routingStore.location.query.session_id = "12345";
        routingStore._session = {
            id:"12345"
        } as PortalSession;
        assert.isFalse(routingStore.needsRemoteSessionLookup, 'session DOES match existing session_id');

        routingStore.location.query.session_id = "12345";
        routingStore._session = {
            id:"54321"
        } as PortalSession;
        assert.isTrue(routingStore.needsRemoteSessionLookup, 'session DOES NOT match existing session_id');


    });





});


