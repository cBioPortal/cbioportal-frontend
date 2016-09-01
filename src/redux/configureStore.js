import { browserHistory } from 'react-router';
import { bindActionCreatorsToStore } from 'redux-module-builder';
import { createApiMiddleware } from 'redux-module-builder/api';
import { routerMiddleware, syncHistoryWithStore } from 'react-router-redux';
import thunkMiddleware from 'redux-thunk';
import { createStore, compose, applyMiddleware } from 'redux';
import { rootReducer, actions, initialState } from './rootReducer';
import Immutable from 'immutable';
import { apiMiddleware } from 'redux-api-middleware';

export const configureStore = ({
    historyType = browserHistory,
    userInitialState = {} }) => {
    const middleware = [
        // createApiMiddleware({
        //     baseUrl: __ROOT_URL__,
        //     headers: {
        //         'X-Requested-By': 'wordtwist client'
        //     }
        // }),
        thunkMiddleware,
        //apiMiddleware,
        routerMiddleware(historyType),
    ];

    const tools = [];
    if (__DEBUG__) {
        const DevTools = require('containers/DevTools/DevTools').default;
        const devTools = window.devToolsExtension ? window.devToolsExtension : DevTools.instrument;
        if (typeof devTools === 'function') {
            tools.push(devTools({

                deserializeState: (state) => {
                    return Immutable.fromJS(state);
                },

                deserializeAction: (action) => {
                    if (action.noteObj) {
                        action.noteObj = Immutable.fromJS(action.noteObj);
                        return action;
                    } else {
                        return action;
                    }
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
            return state.get('customRoutingReducer').toJS();
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
