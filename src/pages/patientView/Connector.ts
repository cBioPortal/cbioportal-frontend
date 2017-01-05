import getClinicalInformationData from './clinicalInformation/getClinicalInformationData';
import {RootState} from "../../redux/rootReducer";
import {ClinicalData} from "../../shared/api/CBioPortalAPI";
import { ClinicalDataBySampleId, RequestStatus } from "../../shared/api/api-types-extended";
import {IDispatch, Connector} from "../../shared/lib/ConnectorAPI";
import { IPatientViewPageProps } from "./PatientViewPage";

declare type TODO = any;

const FETCH = 'clinicalInformation/fetch';
const SET_TAB = 'clinicalInformation/setTab';
export const actionTypes = {FETCH, SET_TAB};

export type ActionTypes = (
    {type: typeof FETCH, status: 'pending'}
    | {type: typeof FETCH, status: 'error', error: Error}
    | {type: typeof FETCH, status: 'complete', payload: ClinicalInformationData}
    | {type: typeof SET_TAB, activeTab: number }
);

export type ClinicalInformationData = {
    clinicalDataStatus?: RequestStatus,
    patient?: {
        id: string,
        clinicalData: Array<ClinicalData>
    },
    samples?: Array<ClinicalDataBySampleId>,
    nodes?: TODO[]//PDXNode[],
};

export default new class ClinicalInformationConnector extends Connector<RootState, ClinicalInformationData, ActionTypes, IPatientViewPageProps>
{
    initialState:ClinicalInformationData = {
        clinicalDataStatus: 'pending'
    };

    mapDispatchToProps = {
        loadClinicalInformationTableData: () => (dispatch:IDispatch<ActionTypes>) => { // this is a thunk

            dispatch({
                type: FETCH,
                status: 'pending',
            });

            return getClinicalInformationData().then(
                (data) => {
                    dispatch({
                        type: FETCH,
                        status: 'complete',
                        payload: data,
                    });
                }
            );
        }
    };

    mapStateToProps(state:RootState):IPatientViewPageProps {
        return {
            samples: state.clinicalInformation.samples,
            clinicalDataStatus: state.clinicalInformation.clinicalDataStatus,
            patient: state.clinicalInformation.patient
        };
    }

    reducer(state:ClinicalInformationData, action:ActionTypes) {
        switch (action.type) {
            case FETCH: {
                switch (action.status) {
                    case 'pending':
                        return this.mergeState(state, {'clinicalDataStatus': 'pending'});

                    case 'complete':
                        return this.mergeState(state, {
                            clinicalDataStatus: 'complete',
                            patient: action.payload.patient,
                            nodes: action.payload.nodes,
                            samples: action.payload.samples
                        });

                    case 'error':
                        return this.mergeState(state, {'clinicalDataStatus': 'error'});

                    default:
                        return state;
                }
            }
            default: {
                return state;
            }
        }
    }
};
