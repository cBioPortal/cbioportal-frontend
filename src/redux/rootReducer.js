// import { combineReducers } from 'redux';
import { routerReducer as push } from 'react-router-redux';
import { combineReducers } from 'redux-immutable';
import Immutable from 'immutable';
import clinicalInformation from 'features/patient_view/clinicalInformation/duck';
import customRoutingReducer from './customRouterReducer';

// Require your modules here
const modules = {
    clinicalInformation,
};

export const actions = {
    routing: {
        navigateTo: path => dispatch => dispatch(push(path)),
    },
};

export const initialState = Immutable.Map({});

export const reducers = { customRoutingReducer };


Object.keys(modules).forEach(key => {
    const reducer = modules[key];
    // initialState[key] = module.initialState || Immutable.Map({});

    // if (module.initialstate) {
    //     initialState = initialState.set(key, module.initialState || Immutable.Map({}));
    // }

    // actions[key] = module.actions;
    reducers[key] = reducer;
});

export const rootReducer = combineReducers(reducers);
