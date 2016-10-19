import {RootState} from "../../redux/rootReducer";
import {IDispatch, Connector} from "../../shared/lib/ConnectorAPI";
import { IDatasetPageUnconnectedProps } from './DataSetPage';
import getDatasetsInfo from './getDatasetsInfo';

export type DatasetDownloads = {
    datasets: null | Array<any>,
    status?: 'fetching' | 'complete' | 'error'
};

const FETCH:'datasetDownloads/fetch' = 'datasetDownloads/fetch';

export type ActionTypes = (
    { type: typeof FETCH, stutus: 'fetching' }
    | { type: typeof FETCH, status: 'success', payload: Array<any> }
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
                    status:'success',
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

    reducer(state:DatasetDownloads, action:ActionTypes){

        switch(action.type) {

            case FETCH:

                return this.mergeState(state,{
                    status:'complete',
                    datasets:action.payload,
                });

            default:

                return state;
        }

    }


};

