import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { hashHistory, browserHistory, createMemoryHistory, Router, useRouterHistory } from 'react-router';
import { createHistory } from 'history'
import { RouterStore, syncHistoryWithStore  } from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import {initializeAPIClients, initializeConfiguration, setServerConfig} from './config/config';

import {computed, extendObservable} from 'mobx';
import makeRoutes from './routes';
import * as _ from 'lodash';
import $ from 'jquery';
import URL from 'url';
import * as superagent from 'superagent';
import { getHost } from './shared/api/urls';
import { validateParametersPatientView } from './shared/lib/validateParameters';
import AppConfig from "appConfig";
import browser from 'bowser';

import 'script-loader!raven-js/dist/raven.js';
import {correctPatientUrl} from "shared/lib/urlCorrection";
import {activateAnalytics} from "shared/lib/tracking";
import {CancerStudyQueryUrlParams} from "shared/components/query/QueryStore";
import {MolecularProfile} from "shared/api/generated/CBioPortalAPI";
import {molecularProfileParams} from "shared/components/query/QueryStoreUtils";
import ExtendedRouterStore from "shared/lib/ExtendedRouterStore";
import superagentCache from 'superagent-cache';
import getBrowserWindow from "shared/lib/getBrowserWindow";
import {getConfigurationServiceApiUrl} from "shared/api/urls";

superagentCache(superagent);

// YOU MUST RUN THESE initialize and then set the public path after
initializeConfiguration();
// THIS TELLS WEBPACK BUNDLE LOADER WHERE TO LOAD SPLIT BUNDLES
__webpack_public_path__ = AppConfig.frontendUrl;

if (!window.hasOwnProperty("$")) {
    window.$ = $;
}

if (!window.hasOwnProperty("jQuery")) {
    window.jQuery = $;
}

// write browser name, version to brody tag
if (browser) {
    $(document).ready(()=>{
        $("body").addClass(browser.name);
    });
}

if (localStorage.e2etest) {
    $(document).ready(()=>{
        $("body").addClass("e2etest");
        window.e2etest = true;
    });
}

// expose version on window
window.FRONTEND_VERSION = VERSION;
window.FRONTEND_COMMIT = COMMIT;


// this is to support old hash fragment style urls (from first round of 2017 refactoring)
// we want to convert hash fragment route to HTML5 style route
if (/#[^\?]*\?/.test(window.location.hash)) {
    window.history.replaceState(null,null,correctPatientUrl(window.location.href));
}

if (/cbioportal\.mskcc\.org|www.cbioportal\.org/.test(window.location.hostname) || window.localStorage.getItem('sentry') === 'true') {
    Raven.config('https://c93645c81c964dd284436dffd1c89551@sentry.io/164574', {
        tags:{
          fullUrl:window.location.href
        },
        release:window.FRONTEND_COMMIT || '',
        ignoreErrors: ['_germline', 'symlink_by_patient'],
        serverName: window.location.hostname
    }).install();
}

// make sure lodash doesn't overwrite (or set) global underscore
_.noConflict();

const routingStore = new ExtendedRoutingStore();

if (/index\.do/.test(window.location.pathname)){
    if (/Action=Submit/i.test(window.location.search)) {
        window.history.replaceState(null, "", window.location.href.replace(/index.do/i,'results'));
    } else if (/session_id/i.test(window.location.search)) {
        window.history.replaceState(null, "", window.location.href.replace(/index.do/i,'results'));
    } else {
        window.history.replaceState(null, "", window.location.href.replace(/index.do/i,''));
    }
}


const history = useRouterHistory(createHistory)({
    basename: AppConfig.basePath || ""
});

const syncedHistory = syncHistoryWithStore(history, routingStore);

const stores = {
    // Key can be whatever you want
    routing: routingStore,
//    queryStore
    // ...other stores
};

window.globalStores = stores;

const end = superagent.Request.prototype.end;

let redirecting = false;

// check if valid hash parameters for patient view, otherwise convert old style
// querystring for backwards compatibility
if (/\/patient$/.test(window.location.pathname)) {
    const validationResult = validateParametersPatientView(routingStore.location.query);
    if (!validationResult.isValid) {
        const newParams = {};
        const qs = URL.parse(window.location.href, true).query;

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
    }
}

superagent.Request.prototype.end = function (callback) {
    return end.call(this, (error, response) => {

        if (error) {

            Raven.captureException(((response && response.error) || error),{
                tags: { network:true }
            });
        }

        if (redirecting) {
            return;
        }
        if (response && response.statusCode === 401) {
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

    activateAnalytics();

    const rootNode = document.getElementById("reactRoot");

    ReactDOM.render(
        <Provider {...stores}>
            <Router
                history={syncedHistory} routes={makeRoutes()} >
            </Router>
        </Provider>
    , rootNode);


};

if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    module.hot.accept('./routes', () => render());
}

$(document).ready(async () => {

    // we use rawServerConfig (written by JSP) if it is present
    // or fetch from config service if not
    // need to use jsonp, so use jquery
    let config = window.rawServerConfig || await $.ajax({
        url: window.frontendConfig.configurationServiceUrl,
        dataType: "jsonp",
        jsonpCallback: "callback"
    });

    setServerConfig(config);
    initializeAPIClients();

    render();


});
