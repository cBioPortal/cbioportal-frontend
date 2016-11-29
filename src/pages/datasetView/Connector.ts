import {RootState} from "../../redux/rootReducer";
import {IDispatch, Connector} from "../../shared/lib/ConnectorAPI";
import { IDatasetPageUnconnectedProps } from './DatasetPage';
import getDatasetsInfo from './getDatasetsInfo';

export type DatasetDownloads = {
    datasets: null | Array<any>,
    status?: 'fetching' | 'complete' | 'error'
};

const FETCH:'datasetDownloads/fetch' = 'datasetDownloads/fetch';

export type ActionTypes = (
    { type: typeof FETCH, status: 'complete', payload: Array<any> } |
    { type: typeof FETCH, status: 'fetching' }

);

export default new class DatasetConnector extends Connector<RootState, DatasetDownloads, ActionTypes, IDatasetPageUnconnectedProps>
{

    initialState:DatasetDownloads = {
        datasets:null,
        status:'fetching'
    };

    mapDispatchToProps = {
        loadDatasetsInfo: () => (dispatch:IDispatch<ActionTypes>) => {

            getDatasetsInfo().then((data: Array<any>) => {

                dispatch({
                    type:FETCH,
                    status:'complete',
                    payload:data,
                });

            });

        },
    };

    mapStateToProps(state:RootState):IDatasetPageUnconnectedProps {
        return {
            datasets:state.datasetDownloads.datasets,
        };
    }

    reducer(state:DatasetDownloads, action: ActionTypes){

        switch(action.type) {

            case FETCH:
                switch( action.status ){

                    case 'complete':
                        return this.mergeState(state, {
                            status: 'complete',
                            datasets: action.payload,
                        });
                }

            
            default:

                return state;
        }

    }


};

