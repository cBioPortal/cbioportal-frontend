

//export function filterCBioPortalWebServiceData(oql_query, data, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction) {

//export declare function filterCBioPortalWebServiceData(oql_query:string, data:any, opt_default_oql:string, opt_mark_oql_regulation_direction: string ): any;

//var filterData = function (oql_query, data, _accessors, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction)

import {SingleGeneQuery, MergedGeneQuery} from "./oql-parser";
import {AnnotatedMutation, ExtendedAlteration} from "../../../pages/resultsView/ResultsViewPageStore";
import {NumericGeneMolecularData, Mutation} from "../../api/generated/CBioPortalAPI";

type OQLAlterationFilterString = string;

export type OQLLineFilterOutput<T> = {
    gene: string;
    parsed_oql_line: SingleGeneQuery;
    oql_line: string;
    data: T[];
};

export type MergedTrackLineFilterOutput<T> = {
    list: OQLLineFilterOutput<T>[],
    label?: string
};
export type UnflattenedOQLLineFilterOutput<T> = (
    OQLLineFilterOutput<T> | MergedTrackLineFilterOutput<T>
);

export declare function isMergedTrackFilter<T>(
    oqlFilter: UnflattenedOQLLineFilterOutput<T>
): oqlFilter is MergedTrackLineFilterOutput<T>;

/* Interprets datatypes statements and flattens out merged track queries. */
export declare function parseOQLQuery(
    oql_query: string,
    opt_default_oql?: OQLAlterationFilterString
): SingleGeneQuery[];

export declare function filterCBioPortalWebServiceData(oql_query:string, data:(Mutation | NumericGeneMolecularData)[], accessors:any, default_oql:string): ExtendedAlteration[];

export declare function filterCBioPortalWebServiceDataByOQLLine(oql_query:string, data:(AnnotatedMutation | NumericGeneMolecularData)[], accessors:any, default_oql:string): OQLLineFilterOutput<ExtendedAlteration&AnnotatedMutation>[];
export declare function filterCBioPortalWebServiceDataByOQLLine(oql_query:string, data:(Mutation | NumericGeneMolecularData)[], accessors:any, default_oql:string): OQLLineFilterOutput<ExtendedAlteration>[];

export declare function filterCBioPortalWebServiceDataByUnflattenedOQLLine(
    oql_query: string,
    data: (AnnotatedMutation|NumericGeneMolecularData)[],
    accessors:any,
    default_oql:string
): UnflattenedOQLLineFilterOutput<ExtendedAlteration&AnnotatedMutation>[];
