

//export function filterCBioPortalWebServiceData(oql_query, data, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction) {

//export declare function filterCBioPortalWebServiceData(oql_query:string, data:any, opt_default_oql:string, opt_mark_oql_regulation_direction: string ): any;

//var filterData = function (oql_query, data, _accessors, opt_default_oql, opt_by_oql_line, opt_mark_oql_regulation_direction)

export declare function filterCBioPortalWebServiceData<T>(oql_query:string, data:T[], accessors:any, default_oql:string, by_oql_line:string | undefined, mark_oql_regulation_direction:boolean): T[];