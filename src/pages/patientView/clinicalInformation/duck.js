import Immutable from 'seamless-immutable';
import getClinicalInformationData from './getClinicalInformationData';

// ACTION TYPE CONSTANTS
export const actionTypes = {

    FETCH: 'clinical_information_table/FETCH',
    SET_TAB: 'clinical_information_table/SET_TAB',

};

export const initialState = Immutable({
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
                       patient: action.payload.patient,
                        nodes: action.payload.nodes,
                        status: 'complete',
                        samples: action.payload.samples
                    });

                case 'error':

                    return state.set('status', 'error');

                default:

                    return state;

            }

        case actionTypes.SET_TAB:

            return state.set('activeTab', action.payload);

        default:

            return state;
    }
}

// Action Creators
export function loadClinicalInformationTableData() {
    // this is a thunk
    return (dispatch) => {
        getClinicalInformationData().then(
            (data) => {
                dispatch({
                    type: actionTypes.FETCH,
                    meta: { status: 'success' },
                    payload: data,
                });
            }
        );

        dispatch({
            type: actionTypes.FETCH,
            meta: { status: 'fetching' },
        });
    };
}

export function setTab(tabId) {
    return {
        type: actionTypes.SET_TAB,
        payload: tabId,
    };
}

export const actionCreators = {

    loadClinicalInformationTableData,
    setTab,

};

export const mapStateToProps = function mapStateToProps(state) {
    return {
        samples: state.clinicalInformation.samples,
        status: state.clinicalInformation.status,
        activeTab: state.clinicalInformation.activeTab,
        patient: state.clinicalInformation.patient,
        nodes: state.clinicalInformation.nodes,
    };
};
