import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { hashHistory, browserHistory, createMemoryHistory, Router, useRouterHistory } from 'react-router';
import { createHistory } from 'history'
import { RouterStore, syncHistoryWithStore  } from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import {
    fetchServerConfig,
    initializeAPIClients,
    initializeAppStore,
    initializeConfiguration,
    setServerConfig,
    setConfigDefaults
} from './config/config';

import './shared/lib/ajaxQuiet';
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
import { setNetworkListener } from './shared/lib/ajaxQuiet';
import {initializeTracking} from "shared/lib/tracking";
import {CancerStudyQueryUrlParams} from "shared/components/query/QueryStore";
import {MolecularProfile} from "shared/api/generated/CBioPortalAPI";
import {molecularProfileParams} from "shared/components/query/QueryStoreUtils";
import ExtendedRouterStore from "shared/lib/ExtendedRouterStore";
import superagentCache from 'superagent-cache';
import getBrowserWindow from "shared/lib/getBrowserWindow";
import {getConfigurationServiceApiUrl} from "shared/api/urls";
import {AppStore} from "./AppStore";

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

if (getBrowserWindow().navigator.webdriver) {
    setNetworkListener();
}

// expose version on window
window.FRONTEND_VERSION = VERSION;
window.FRONTEND_COMMIT = COMMIT;

// this is special function allowing MSKCC CIS to hide login UI in
// portal header
window.postLoadForMskCIS = function(){
    AppConfig.hide_login = true;
}

// make sure lodash doesn't overwrite (or set) global underscore
_.noConflict();

const routingStore = new ExtendedRoutingStore();

const history = useRouterHistory(createHistory)({
    basename: AppConfig.basePath || ""
});

const syncedHistory = syncHistoryWithStore(history, routingStore);

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    appStore:new AppStore()
};

window.globalStores = stores;

const end = superagent.Request.prototype.end;

let redirecting = false;

superagent.Request.prototype.end = function (callback) {
    return end.call(this, (error, response) => {

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

    if (!getBrowserWindow().navigator.webdriver) initializeTracking();

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
    let config = window.rawServerConfig || await fetchServerConfig();

    setServerConfig(config);

    setConfigDefaults();

    initializeAPIClients();

    initializeAppStore(stores.appStore,config);

    render();

});
