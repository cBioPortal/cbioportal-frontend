import React from 'react';
import ReactDOM from 'react-dom';
import App from 'appShell/App/App';
import { Provider } from 'mobx-react';
import { hashHistory, createMemoryHistory, browserHistory, Route, Router } from 'react-router';
import { RouterStore, syncHistoryWithStore  } from 'mobx-react-router';
import { computed, extendObservable } from 'mobx';
import makeRoutes from './routes';
import lodash from 'lodash';

let RT = require('route-parser');

// make sure lodash doesn't overwrite (or set) global underscore
lodash.noConflict();

const defaultRoute = window.defaultRoute || "/home";

const memoryHistory = createMemoryHistory(defaultRoute);

// expose router so it can be manipulated in console
if (window) {
    window.reactRouter = memoryHistory;
}

const routingStore = new RouterStore();

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    // ...other stores
};

extendObservable(routingStore, {
    // also valid:
    query: computed(function() {
        // var route = new RT(stores.routing.location.pathname);
            var queryString = {};
            stores.routing.location.search.replace(
                    new RegExp("([^?=&]+)(=([^&]*))?", "g"),
                    function($0, $1, $2, $3) { queryString[$1] = $3;}
            )
            return queryString;
        })
});


// stores.routing.me = computed(function(){
//
//     var route = new RT(stores.routingStore.location);
//     return route.match('/my/fancy/route/page/7');
//     //route.reverse({page: 3}) // -> '/my/fancy/route/page/3'
// });

const history = syncHistoryWithStore(hashHistory, routingStore);

let render = () => {

    const routes = makeRoutes();

    const rootNode = document.getElementById("reactRoot");

    ReactDOM.render(
        <Provider {...stores}>
            <Router
                history={history} routes={makeRoutes()} >
            </Router>
        </Provider>
    , rootNode);


};

if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    module.hot.accept('./routes', () => render());
}

render();
