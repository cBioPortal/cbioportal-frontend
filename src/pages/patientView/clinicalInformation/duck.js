import Immutable from 'immutable';
import getClinicalInformationData from './getClinicalInformationData';

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

                    return state.withMutations((state) => {
                        state.set('patient', Immutable.fromJS(action.payload.patient));
                        state.set('nodes', Immutable.fromJS(action.payload.nodes));
                        state.set('status', 'complete');
                        state.set('samples', Immutable.List(action.payload.samples));
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
        samples: state.get('clinicalInformation').get('samples'),
        status: state.get('clinicalInformation').get('status'),
        activeTab: state.get('clinicalInformation').get('activeTab'),
        patient: state.get('clinicalInformation').get('patient'),
        nodes: state.get('clinicalInformation').get('nodes'),
    };
};
