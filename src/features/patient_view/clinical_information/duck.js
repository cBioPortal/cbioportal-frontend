import {createAction} from 'redux-actions';
import Immutable from 'immutable';

// ACTION TYPE CONSTANTS
export const actionTypes = {

    FETCH: 'clinical_information_table/FETCH'

};

// Reducer
export default function reducer(state = Immutable.Map({ status:'fetching'}), action = {}) {

    switch (action.type) {
        // do reducer stuff

    case actionTypes.FETCH:

        switch (action.status) {
        case 'fetching':

            return state.set('status', 'fetching');

        case 'success':

            return state.merge({
                'patient':action.payload.patient,
                'samples' : action.payload.samples,
                'status': 'complete'
            });

        case 'error':

            return state.merge({
                'table_data': null,
                'status': 'error'
            });
        }

        return state.setIn(['table_data'], Immutable.fromJS(action.payload));


    default:

        return state;
    }
}

// Action Creators
export const loadClinicalInformationTableData = createAction(actionTypes.LOAD);
