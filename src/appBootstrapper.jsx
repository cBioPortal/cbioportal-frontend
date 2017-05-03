import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'mobx-react';
import {hashHistory, Router} from 'react-router';
import {RouterStore, syncHistoryWithStore} from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import {computed, extendObservable} from 'mobx';
import makeRoutes from './routes';
import * as _ from 'lodash';
import $ from 'jquery';
import URL from 'url';
import * as superagent from 'superagent';
import { getHost } from './shared/api/urls';

// make sure lodash doesn't overwrite (or set) global underscore
_.noConflict();

const routingStore = new ExtendedRoutingStore();

const history = syncHistoryWithStore(hashHistory, routingStore);

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    // ...other stores
};

const end = superagent.Request.prototype.end;

let redirecting = false;

const qs = URL.parse(window.location.href, true).query;

const newParams = {};

if ('cancer_study_id' in qs && _.isUndefined(routingStore.location.query.studyId)) {
    newParams['studyId'] = qs.cancer_study_id;
}
if ('case_id' in qs && _.isUndefined(routingStore.location.query.caseId)) {
    newParams['caseId'] = qs.case_id;
}

if ('sample_id' in qs && _.isUndefined(routingStore.location.query.sampleId)) {
    newParams['sampleId'] = qs.sample_id;
}

const navCaseIdsMatch = routingStore.location.pathname.match(/(nav_case_ids)=(.*)$/);
if (navCaseIdsMatch && navCaseIdsMatch.length > 2) {
    newParams['navCaseIds'] = navCaseIdsMatch[2];
}

routingStore.updateRoute(newParams);

superagent.Request.prototype.end = function (callback) {
    return end.call(this, (error, response) => {
        if (redirecting) {
            return;
        }
        if (response.statusCode === 401) {
            var storageKey = `redirect${Math.floor(Math.random() * 1000000000000)}`
            localStorage.setItem(storageKey, window.location.hash);
            const loginUrl = `//${getHost()}/?spring-security-redirect=${encodeURIComponent(window.location.pathname)}${encodeURIComponent(window.location.search)}${encodeURIComponent('#/restore?key=' + storageKey)}`;
            redirecting = true;
            window.location.href = loginUrl;
        } else {
            callback(error, response);
        }
    });
};

window.routingStore = routingStore;


let render = () => {

    const rootNode = document.getElementById("reactRoot");

    ReactDOM.render(
        <Provider {...stores}>
            <Router
                history={history} routes={makeRoutes()}>
            </Router>
        </Provider>
        , rootNode);


};

if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    module.hot.accept('./routes', () => render());
}

$(document).ready(() => render());
