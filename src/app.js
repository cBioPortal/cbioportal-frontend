import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/App/App';
import { hashHistory, createMemoryHistory } from 'react-router';
import { configureStore } from './redux/configureStore';
import makeRoutes from './routes';

const defaultRoute = window.defaultRoute || "/home";

const memoryHistory = createMemoryHistory(defaultRoute);

// expose router so it can be manipulated in console
if (window) {
    window.reactRouter = memoryHistory;
}

const initialState = {};
const { store, actions, history } = configureStore({ initialState, historyType: memoryHistory });

let render = (routerKey = null) => {

    const routes = makeRoutes(store);

    const rootNode = document.getElementById("reactRoot");

    ReactDOM.render(
    <App
      store={store}
      actions={actions}
      routes={routes}
      history={history}
      routerKey={routerKey}
    />, rootNode);


};

if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    module.hot.accept('./routes', () => render());
}

render();
