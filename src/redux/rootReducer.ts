import * as SeamlessImmutable from 'seamless-immutable';
import { routerReducer } from 'redux-seamless-immutable';
import { combineReducers } from 'redux-seamless-immutable';
import clinicalInformation from 'pages/patientView/clinicalInformation/Connector';
import {ClinicalInformationData} from "../pages/patientView/clinicalInformation/Connector";
import datasetDownloads from 'pages/datasetView/Connector';
import {DatasetDownloads} from "../pages/datasetView/Connector";
import {default as query, QueryData} from "../shared/components/query/QueryConnector";
import {Connector} from "../shared/lib/ConnectorAPI";
import {Reducer} from "redux";
import Action = Redux.Action;

//import customRoutingReducer from './customRouterReducer';

// Require your modules here
const modules:{[name:string]:Connector<any, any, any, any>} = {
    clinicalInformation,
    datasetDownloads,
    query,
};

// Add state nodes corresponding to your modules here
export type RootState = {
    datasetDownloads:DatasetDownloads,
    clinicalInformation:ClinicalInformationData,
    query: QueryData,
}

export const actions = {};

export const reducers:{[actionName:string]:Reducer<any>} = { routing: routerReducer };

for (let key in modules)
{
    let module = modules[key];
    let initialState = SeamlessImmutable.from(module.initialState);
    reducers[key] = function(state = initialState, action?:Action) {
        return action ? module.reducer(state, action) : state;
    };
}

export const rootReducer = combineReducers(reducers);
