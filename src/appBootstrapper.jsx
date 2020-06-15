import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { Router, useRouterHistory } from 'react-router';
import { createHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import {
    fetchServerConfig,
    initializeAPIClients,
    initializeAppStore,
    initializeConfiguration,
    setConfigDefaults,
    setServerConfig,
} from './config/config';

import './shared/lib/ajaxQuiet';
import makeRoutes from './routes';
import * as _ from 'lodash';
import $ from 'jquery';
import * as superagent from 'superagent';
import { getHost, buildCBioPortalPageUrl } from './shared/api/urls';
import AppConfig from 'appConfig';
import browser from 'bowser';
import { setNetworkListener } from './shared/lib/ajaxQuiet';
import { initializeTracking } from 'shared/lib/tracking';
import superagentCache from 'superagent-cache';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { AppStore } from './AppStore';
import { handleLongUrls } from 'shared/lib/handleLongUrls';
import 'shared/polyfill/canvasToBlob';
import mobx from 'mobx';

superagentCache(superagent);

// this must occur before we initialize tracking
// it fixes the hash portion of url when cohort patient list is too long
handleLongUrls();

// YOU MUST RUN THESE initialize and then set the public path after

initializeConfiguration();
// THIS TELLS WEBPACK BUNDLE LOADER WHERE TO LOAD SPLIT BUNDLES
__webpack_public_path__ = AppConfig.frontendUrl;

if (!window.hasOwnProperty('$')) {
    window.$ = $;
}

if (!window.hasOwnProperty('jQuery')) {
    window.jQuery = $;
}

if (!window.hasOwnProperty('mobx')) {
    window.mobx = mobx;
}

// write browser name, version to brody tag
if (browser) {
    $(document).ready(() => {
        $('body').addClass(browser.name);
    });
}

// e2e test specific stuff
if (getBrowserWindow().navigator.webdriver) {
    $(document).ready(() => {
        $('body').addClass('e2etest');
        window.e2etest = true;
    });

    setNetworkListener();
}

// expose version on window
window.FRONTEND_VERSION = VERSION;
window.FRONTEND_COMMIT = COMMIT;

// this is special function allowing MSKCC CIS to hide login UI in
// portal header
window.postLoadForMskCIS = function() {
    AppConfig.hide_login = true;
};

// this is the only supported way to disable tracking for the $3Dmol.js
window.$3Dmol = { notrack: true };

// make sure lodash doesn't overwrite (or set) global underscore
_.noConflict();

const routingStore = new ExtendedRoutingStore();

const history = useRouterHistory(createHistory)({
    basename: AppConfig.basePath || '',
});

const syncedHistory = syncHistoryWithStore(history, routingStore);

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    appStore: new AppStore(),
};

window.globalStores = stores;

const end = superagent.Request.prototype.end;

let redirecting = false;

superagent.Request.prototype.end = function(callback) {
    return end.call(this, (error, response) => {
        if (redirecting) {
            return;
        }
        if (response && response.statusCode === 401) {
            var storageKey = `login-redirect`;

            localStorage.setItem(storageKey, window.location.href);

            // build URL with a reference to storage key so that /restore route can restore it after login
            const loginUrl = buildCBioPortalPageUrl({
                query: {
                    'spring-security-redirect': buildCBioPortalPageUrl({
                        pathname: 'restore',
                        query: { key: storageKey },
                    }),
                },
            });

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

    const rootNode = document.getElementById('reactRoot');

    ReactDOM.render(
        <Provider {...stores}>
            <Router history={syncedHistory} routes={makeRoutes()}></Router>
        </Provider>,
        rootNode
    );
};

if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    module.hot.accept('./routes', () => render());
}

$(document).ready(async () => {
    // we show blank page if the window.name is "blank"
    if (window.name === 'blank') {
        return;
    }
    // we use rawServerConfig (written by JSP) if it is present
    // or fetch from config service if not
    // need to use jsonp, so use jquery
    let config = window.rawServerConfig || (await fetchServerConfig());

    setServerConfig(config);

    setConfigDefaults();

    initializeAPIClients();

    initializeAppStore(stores.appStore, config);

    render();

    stores.appStore.setAppReady();
});
