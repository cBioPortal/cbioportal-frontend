import {createAction} from 'redux-actions';
import Immutable from 'immutable';

// ACTION TYPE CONSTANTS
export const actionTypes = {

    LOAD: 'clinical_information_table/LOAD'

};

// Reducer
export default function reducer(state = Immutable.Map({}), action = {}) {

    switch (action.type) {
        // do reducer stuff

        case actionTypes.LOAD:

             return state.setIn(['table_data'],Immutable.fromJS(action.payload));

        default:
            return state;
    }
}

// Action Creators
export const loadClinicalInformationTableData = createAction(actionTypes.LOAD);
