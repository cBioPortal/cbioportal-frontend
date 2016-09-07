import { createAction } from 'redux-actions';
import Immutable from 'immutable';
import getClinicalInformationData from './dataLayer';
import { mockData } from './mockData';
import convertSamplesData from './lib/convertSamplesData';

// ACTION TYPE CONSTANTS
export const actionTypes = {

    FETCH: 'clinical_information_table/FETCH',
    SET_TAB: 'clinical_information_table/SET_TAB',

};

export const initialState = Immutable.fromJS({
    status: 'fetching', activeTab: 1,
});


// Reducer
export default function reducer(state = initialState, action = {}) {
    switch (action.type) {
        // do reducer stuff

    case actionTypes.FETCH:

        switch (action.meta.status) {
        case 'fetching':

            return state.set('status', 'fetching');

        case 'success':

            return state.merge({
                'patient': action.payload.patient,
                'samples': Immutable.fromJS(convertSamplesData(action.payload.samples)),
                'nodes': Immutable.fromJS(action.payload.nodes),
                'status': 'complete',
            });

        case 'error':

            return state.merge({
                'table_data': null,
                'status': 'error',
            });
        }

        return state.setIn(['table_data'], Immutable.fromJS(action.payload));

    case actionTypes.SET_TAB:

        return state.set('activeTab', action.payload);

    default:

        return state;
    }
}

// Action Creators
export function loadClinicalInformationTableData() {

    // this is a thunk
    return (dispatch)=>{

        getClinicalInformationData().then(
            function(data){

                dispatch({
                    type: actionTypes.FETCH,
                    meta: { status: 'success' },
                    payload: mockData,
                });
            }.bind(this)
        );

        dispatch({
            type: actionTypes.FETCH,
            meta: { status:'fetching' }
        });


    }

};

export function setTab(tabId){

    return {
        type: actionTypes.SET_TAB,
        payload: tabId,
    }

}

export const actionCreators = {

    loadClinicalInformationTableData,
    setTab

};
