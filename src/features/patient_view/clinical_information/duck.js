import {createAction} from 'redux-actions';
import Immutable from 'immutable';

// ACTION TYPE CONSTANTS
export const actionTypes = {

    FETCH: 'clinical_information_table/FETCH',
    SET_TAB: 'clinical_information_table/SET_TAB'

};

export const initialState = Immutable.fromJS({
    status: 'fetching', activeTab:1
});


// Reducer
export default function reducer(state = initialState, action = {}) {
    switch (action.type) {
        // do reducer stuff

        case actionTypes.FETCH:

            switch (action.status) {
                case 'fetching':

                    return state.set('status', 'fetching');

                case 'success':

                    return state.merge({
                        'patient': action.payload.patient,
                        'samples': action.payload.samples,
                        'nodes': action.payload.nodes,
                        'status': 'complete'
                    });

                case 'error':

                    return state.merge({
                        'table_data': null,
                        'status': 'error'
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
export const loadClinicalInformationTableData = createAction(actionTypes.LOAD);
