// import { combineReducers } from 'redux';
import { routerReducer } from 'redux-seamless-immutable';
import { combineReducers } from 'redux-seamless-immutable';
import Immutable from 'seamless-immutable';
import clinicalInformation from 'pages/patientView/clinicalInformation/duck';
//import customRoutingReducer from './customRouterReducer';

// Require your modules here
const modules = {
    clinicalInformation,
};

export const actions = {
    routing: {
        navigateTo: path => dispatch => dispatch(push(path)),
    },
};

export const reducers = { routing: routerReducer };


Object.keys(modules).forEach(key => {
    const reducer = modules[key];
    reducers[key] = reducer;
});

export const rootReducer = combineReducers(reducers);
