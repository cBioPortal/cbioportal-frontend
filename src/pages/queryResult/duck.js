import Immutable from 'immutable';

// ACTION TYPE CONSTANTS
export const actionTypes = {

    FETCH: 'queryResult/FETCH'

};

export const initialState = Immutable.fromJS({
    status: 'fetching'
});


// Reducer
export default function reducer(state = initialState, action = {}) {
    switch (action.type) {
        // do reducer stuff

        case 'queryResult/dataLoaded':

            return state.withMutations((state) => {
                state.set('oncoprintData', Immutable.fromJS(action.payload));
                state.set('status','complete');
            });

        default:

            return state;
    }
}


export function oncoprintDataLoaded(data){

    return function(dispatch){

        dispatch({
            type:"queryResult/dataLoaded",
            payload:data
        });

    };

}

export const actionCreators = {

    oncoprintDataLoaded,

};

export const mapStateToProps = function mapStateToProps(state) {
    return {
        oncoprintData: state.get('queryResult').get('oncoprintData'),
        status: state.get('queryResult').get('status'),
    };
};
