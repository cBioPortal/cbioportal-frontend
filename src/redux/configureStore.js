import { browserHistory } from 'react-router';
import { bindActionCreatorsToStore } from 'redux-module-builder';
import { routerMiddleware, syncHistoryWithStore } from 'react-router-redux';
import thunkMiddleware from 'redux-thunk';
import { createStore, compose, applyMiddleware } from 'redux';
import { rootReducer, actions, initialState } from './rootReducer';
//import Immutable from 'immutable';

export const configureStore = ({
        historyType = browserHistory,
    }) => {
    const middleware = [
        thunkMiddleware,
        routerMiddleware(historyType),
    ];

    const tools = [];
    if (__DEBUG__) {
        const DevTools = require('../appShell/DevTools/DevTools').default;
        const devTools = window.devToolsExtension ? window.devToolsExtension : DevTools.instrument;
        if (typeof devTools === 'function') {
            tools.push(devTools({

                deserializeState: (state) => {
                    return state;
                },

                deserializeAction: (action) => {
                    return action;
                },

            }));
        }
    }

    let finalCreateStore;
    finalCreateStore = compose(
        applyMiddleware(...middleware),
        ...tools
    )(createStore);

    const store = finalCreateStore(
        rootReducer,
        initialState
    );

    const history = syncHistoryWithStore(historyType, store, {
        adjustUrlOnReplay: true,
        selectLocationState(state) {
            return state.routing;
        },
    });

    if (module.hot) {
        module.hot.accept('./rootReducer', () => {
            const { rootReducer } = require('./rootReducer');
            store.replaceReducer(rootReducer);
        });
    }

    const boundActions = bindActionCreatorsToStore(actions, store);
    return { store, actions: boundActions, history };
};
