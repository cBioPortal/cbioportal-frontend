import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { hashHistory, browserHistory, createMemoryHistory, Router } from 'react-router';
import { RouterStore, syncHistoryWithStore  } from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import {QueryStore} from "./shared/components/query/QueryStore";
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
import './shared/lib/tracking';
import 'script-loader!raven-js/dist/raven.js';
import {correctPatientUrl} from "shared/lib/urlCorrection";


if (localStorage.localdev === 'true' || localStorage.localdist === 'true') {
    __webpack_public_path__ = "//localhost:3000/"
    localStorage.setItem("e2etest", "true");
} else if (localStorage.heroku) {
    __webpack_public_path__ = ['//',localStorage.heroku,'.herokuapp.com','/'].join('');
    localStorage.setItem("e2etest", "true");
} else if (AppConfig.frontendUrl) {
    // use given frontendUrl as base (use when deploying frontend on external
    // CDN instead of cbioportal backend)
    __webpack_public_path__ = AppConfig.frontendUrl;
}

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

// this is to support old hash fragment style urls (from first round of 2017 refactoring)
// we want to convert hash fragment route to HTML5 style route
if (/#[^\?]*\?/.test(window.location.hash)) {
    window.history.replaceState(null,null,correctPatientUrl(window.location.href));
}

// expose version on window
window.FRONTEND_VERSION = VERSION;
window.FRONTEND_COMMIT = COMMIT;

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

//determine history type
let history;
switch (window.defaultRoute) {
    case "/patient":
        // these pages are going to use state of-the-art browser history
        // when refactoring is done, all pages will use this
        history = browserHistory;
        break;
    case "/study":
        // these pages are going to use state of-the-art browser history
        // when refactoring is done, all pages will use this
        history = browserHistory;
        break;
    default:
        // legacy pages will use memory history so as not to interfere
        // with old url params
        history = createMemoryHistory();
        break;
}

const syncedHistory = syncHistoryWithStore(history, routingStore);

// lets make query Store since it's used in a lot of places
const queryStore = new QueryStore(window, window.location.href);

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    queryStore
    // ...other stores
};

window.globalStores = stores;

const end = superagent.Request.prototype.end;

let redirecting = false;

// check if valid hash parameters for patient view, otherwise convert old style
// querystring for backwards compatibility
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

$(document).ready(() => render());
