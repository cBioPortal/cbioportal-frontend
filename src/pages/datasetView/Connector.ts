import {RootState} from "../../redux/rootReducer";
import {IDispatch, Connector} from "../../shared/lib/ConnectorAPI";
import { IDatasetPageUnconnectedProps } from './DatasetList';
import getDatasetsInfo from './getDatasetsInfo';
import {CancerStudy} from "../../shared/api/CBioPortalAPI";

export type DatasetDownloads = {
    datasets?: CancerStudy[],
    status?: 'fetching' | 'complete' | 'error'
};

const FETCH = 'datasetDownloads/fetch';

export type ActionTypes = (
    { type: typeof FETCH, status: 'complete', payload: CancerStudy[] } |
    { type: typeof FETCH, status: 'fetching' }
);

export default new class DatasetConnector extends Connector<RootState, DatasetDownloads, ActionTypes, IDatasetPageUnconnectedProps>
{

    initialState:DatasetDownloads = {
        status: 'fetching'
    };

    mapDispatchToProps = {
        loadDatasetsInfo: () => (dispatch:IDispatch<ActionTypes>) => {

            getDatasetsInfo().then((data: CancerStudy[]) => {

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
            datasets: state.datasetDownloads.datasets,
            status: state.datasetDownloads.status
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

