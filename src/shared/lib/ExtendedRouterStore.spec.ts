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

    it('Updating route with clear=true will clear all params and except new ones', () => {

        routingStore.updateRoute({
            param3: 'cleared'
        }, undefined, true);


        assert.deepEqual(routingStore.query, {param3: 'cleared'},'removes param1');
        assert.deepEqual(routingStore.location.pathname,'/results');

    });

});


