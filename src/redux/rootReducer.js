//import { combineReducers } from 'redux';
import { routerReducer as routing, push } from 'react-router-redux';
import clinical_information from 'features/patient_view/clinical_information/duck';
import customRoutingReducer from './customRouterReducer';
import { combineReducers } from 'redux-immutable';
import Immutable from 'immutable';




// Require your modules here
const modules = {
    clinical_information
}

export let actions = {
    routing: {
        navigateTo: path => dispatch => dispatch(push(path))
    }
}

export let initialState = Immutable.Map({});

export let reducers = {customRoutingReducer};


Object.keys(modules).forEach(key => {
    const reducer = modules[key];
    //initialState[key] = module.initialState || Immutable.Map({});

    // if (module.initialstate) {
    //     initialState = initialState.set(key, module.initialState || Immutable.Map({}));
    // }

    //actions[key] = module.actions;
    reducers[key] = reducer;
});

export const rootReducer = combineReducers(reducers);
