

//export function filterCBioPortalWebServiceData(oql_query, data, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction) {

//export declare function filterCBioPortalWebServiceData(oql_query:string, data:any, opt_default_oql:string, opt_mark_oql_regulation_direction: string ): any;

//var filterData = function (oql_query, data, _accessors, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction)

import {OQLQuery} from "./oql-parser";
import {ExtendedAlteration} from "../../../pages/resultsView/ResultsViewPageStore";
import {GeneMolecularData, Mutation} from "../../api/generated/CBioPortalAPI";

export type OQLLineFilterOutput = {
    gene: string;
    parsed_oql_line: OQLQuery;
    oql_line: string;
    data: ExtendedAlteration[];
}

export declare function filterCBioPortalWebServiceData(oql_query:string, data:(Mutation | GeneMolecularData)[], accessors:any, default_oql:string): ExtendedAlteration[];
export declare function filterCBioPortalWebServiceDataByOQLLine<T>(oql_query:string, data:(Mutation | GeneMolecularData)[], accessors:any, default_oql:string): OQLLineFilterOutput[];