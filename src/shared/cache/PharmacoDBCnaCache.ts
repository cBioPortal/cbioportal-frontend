import LazyMobXCache from "../lib/LazyMobXCache";
import request from "superagent";
import {IPharmacoDBCnaRequest, IPharmacoDBCnaEntry, IPharmacoDBViewList, IPharmacoDBViewListDataWrapper } from 'shared/model/PharmacoDB';
import {fetchPharmacoDBCnaDetails} from 'shared/lib/PharmacoDBUtils.ts';
import data from "pages/patientView/genomicOverview/mockData";


export function fetch(queries: IPharmacoDBCnaRequest[]):Promise<IPharmacoDBCnaEntry[]> {
     
    if (queries.length > 0) {
        return fetchPharmacoDBCnaDetails(queries);
        //fetchPharmacoDBCnaDetails(queries).then((resp) => {if(resp) return resp; else return []});
    } else {
        return Promise.resolve([]);
    }
    
}

export default class PharmacoDBCnaCache extends LazyMobXCache<IPharmacoDBCnaEntry,IPharmacoDBCnaRequest>
{
    constructor()
    {
        super(
            (q:IPharmacoDBCnaRequest)=>(q.gene + q.oncotreecode + q.cna).toUpperCase(),
            (d:IPharmacoDBCnaEntry)=>(d.gene + d.onco_tree_code + d.status).toUpperCase(),
            fetch
        );
    }
}