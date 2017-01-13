import getClinicalInformationData from './getClinicalInformationData';
import {RootState} from "../../../redux/rootReducer";
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {ClinicalDataBySampleId} from "./getClinicalInformationData";
import {IDispatch, Connector} from "../../../shared/lib/ConnectorAPI";
import {IClinicalInformationContainerProps} from "./ClinicalInformationContainer";

declare type TODO = any;

const FETCH = 'clinicalInformation/fetch';
const SET_TAB = 'clinicalInformation/setTab';
export const actionTypes = {FETCH, SET_TAB};

export type ActionTypes = (
    {type: typeof FETCH, status: 'fetching'}
    | {type: typeof FETCH, status: 'error', error: Error}
    | {type: typeof FETCH, status: 'success', payload: ClinicalInformationData}
    | {type: typeof SET_TAB, activeTab: number }
);

export type ClinicalInformationData = {
    status?: 'fetching' | 'complete' | 'error',
    activeTab?: number,
    patient?: {
        id: string,
        clinicalData: Array<ClinicalData>
    },
    samples?: Array<ClinicalDataBySampleId>,
    nodes?: TODO[]//PDXNode[],
};

export default new class ClinicalInformationConnector extends Connector<RootState, ClinicalInformationData, ActionTypes, IClinicalInformationContainerProps>
{
    initialState:ClinicalInformationData = {
        status: 'fetching',
        activeTab: 1,
    };

    actions = {};
    mapDispatchToProps = {
        loadClinicalInformationTableData: () => (dispatch:IDispatch<ActionTypes>) => { // this is a thunk
            getClinicalInformationData().then(
                (data) => {
                    dispatch({
                        type: FETCH,
                        status: 'success',
                        payload: data,
                    });
                }
            );

            dispatch({
                type: FETCH,
                status: 'fetching',
            });
        }
    };

    mapStateToProps(state:RootState):IClinicalInformationContainerProps {
        return {
            samples: state.clinicalInformation.samples,
            status: state.clinicalInformation.status,
            patient: state.clinicalInformation.patient,
            nodes: state.clinicalInformation.nodes,
        };
    }

    reducer(state:ClinicalInformationData, action:ActionTypes) {
        switch (action.type) {
            case FETCH: {
                switch (action.status) {
                    case 'fetching':
                        return this.mergeState(state, {'status': 'fetching'});

                    case 'success':
                        return this.mergeState(state, {
                            status: 'complete',
                            patient: action.payload.patient,
                            nodes: action.payload.nodes,
                            samples: action.payload.samples
                        });

                    case 'error':
                        return this.mergeState(state, {'status': 'error'});

                    default:
                        return state;
                }
            }
            case SET_TAB: {
                return this.mergeState(state, {'activeTab': action.activeTab});
            }
            default: {
                return state;
            }
        }
    }
};
