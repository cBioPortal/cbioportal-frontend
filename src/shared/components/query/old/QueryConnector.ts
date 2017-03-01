import {TypeOfCancer, CancerStudy, default as CBioPortalAPI} from "../../../api/CBioPortalAPI";
import {Connector, IDispatch} from "../../../lib/ConnectorAPI";
import {RootState} from "../../../../redux/rootReducer";
import {IQueryContainerProps} from "./QueryContainer";

const FETCH = 'query/fetch';
const SELECT = 'query/select';
export const actionTypes = {FETCH, SELECT};

export type ActionTypes = (
    {type: typeof FETCH, status: 'fetching'}
    | {type: typeof FETCH, status: 'complete', payload: QueryData}
    | {type: typeof FETCH, status: 'error', error: Error}
    | {type: typeof SELECT, cancerStudyIdentifiers: string[] }
);

export type QueryData = {
    status?: 'fetching' | 'complete' | 'error',
    cancerTypes?: TypeOfCancer[],
    studies?: CancerStudy[],
};

const client = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);

export default new class QueryConnector extends Connector<RootState, QueryData, ActionTypes, IQueryContainerProps>
{
    initialState:QueryData = {
        status: 'fetching',
    };

    actions = {
        loadQueryData: () => {
            this.dispatch({
                type: FETCH,
                status: 'fetching',
            });

            Promise.all([
                client.getAllCancerTypesUsingGET({}),
                client.getAllStudiesUsingGET({})
            ]).then(
                ([cancerTypes, studies]) => {
                    this.dispatch({
                        type: FETCH,
                        status: 'complete',
                        payload: {
                            cancerTypes,
                            studies
                        }
                    });
                },
                reason => this.dispatch({
                    type: FETCH,
                    status: 'error',
                    error: reason
                })
            );
        }
    };

    mapStateToProps(state:RootState):IQueryContainerProps {
        return {data: state.old_query};
    }

    reducer(state:QueryData, action:ActionTypes) {
        switch (action.type) {
            case FETCH: {
                switch (action.status) {
                    case 'fetching':
                        return this.mergeState(state, {status: 'fetching'});

                    case 'complete':
                        state = this.mergeState(state, {status: 'complete'});
                        state = this.mergeState(state, action.payload);
                        return state;

                    case 'error':
                        return this.mergeState(state, {status: 'error'});

                    default:
                        return state;
                }
            }
            default: {
                return state;
            }
        }
    }
}();
