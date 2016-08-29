import React from 'react';
import ReactDOM from 'react-dom';

import App from 'containers/App/App';

import { hashHistory, createMemoryHistory } from 'react-router';

import makeRoutes from './routes';

const memoryHistory = createMemoryHistory('/monkey');

const initialState = {};
import { configureStore } from './redux/configureStore';
const { store, actions, history } = configureStore({ initialState, historyType: memoryHistory });

let render = (routerKey = null) => {
    const makeRoutes = require('./routes').default;
    const routes = makeRoutes(store);

    const mountNode = document.querySelector('#root');
    ReactDOM.render(
    <App
      store={store}
      actions={actions}
      routes={routes}
      history={history}
      routerKey={routerKey}
    />, mountNode);
};

if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    module.hot.accept('./routes', () => render());
}

render();
