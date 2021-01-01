import * as _ from 'lodash';
import {IPharmacoDBGeneDrugAssociationData, IPharmacoDBView,IPharmacoDBViewList, IPharmacoDBCnaRequest,IPharmacoDBCnaEntry} from "shared/model/PharmacoDB.ts";
import pharmacoDBClient from "shared/api/PharmacoDBClientInstance";
import { DiscreteCopyNumberData } from "shared/api/generated/CBioPortalAPI";

export function getPharmacoDBCnaDetails(cnareq: IPharmacoDBCnaRequest): Promise<IPharmacoDBCnaEntry> {
    return pharmacoDBClient.getCNACardData(cnareq.oncotreecode,cnareq.gene,cnareq.cna);
}


/**
 * Asynchronously return a map with PharmacoDB information from the oncoTreeCode, genes and CNA Viewdata given.
 */
export function getPharmacoDBCnaView(cnareqlist: Array<IPharmacoDBCnaRequest>): Promise<IPharmacoDBViewList> {
    let pharmacoDBviewlist: IPharmacoDBViewList = {};
    let genes: Array<string> = [];
    let statuses: Array<string> = [];

    // Assemble a list of promises, each of which will retrieve a batch of genes
    let promises: Array<Promise<Array<IPharmacoDBView>>> = [];
    //Create promises for each batch
    //New batch is created when batch size>100

    let prevOncoTreeCode:string ='';
    let curOncoTreeCode:string='';
    cnareqlist.forEach(function(cnareq){

        //todo: check if same gene already exists, if it exists, then error.
        //looping in the same order of the original CNA Data request, whenever OncoTreeCode changes create a new API request
        //todo: optimize number of calls made by grouping by OncoTreeCode
        //todo: many corner cases; will CNA table group if gene and status are same but OTC is different?
        genes.push(cnareq.gene);
        statuses.push(cnareq.cna);
        curOncoTreeCode = cnareq.oncotreecode;
        if(genes.length > 100 || (curOncoTreeCode != prevOncoTreeCode) && prevOncoTreeCode != '')
        {
            promises.push(pharmacoDBClient.getCNAView(prevOncoTreeCode,genes.join(),statuses.join()));
            genes = [];
            statuses = [];
        }
        prevOncoTreeCode = curOncoTreeCode;
        curOncoTreeCode = '';
    });
    if (genes.length > 0)
        promises.push(pharmacoDBClient.getCNAView(prevOncoTreeCode,genes.join(),statuses.join()));


    //once promises are fulfilled, collect all responses and merge them and return
    return Promise.all(promises).then(function(responses) {
        for (let res in responses) {
            let arrayPharmacoDBViews: Array<IPharmacoDBView> = responses[res];
            arrayPharmacoDBViews.forEach((pharmacoDBView) => {
                let key:string = pharmacoDBView.gene + pharmacoDBView.onco_tree_code + pharmacoDBView.status;
                pharmacoDBviewlist[key] = pharmacoDBView;
            });
        }
    }).then(function() {
        return pharmacoDBviewlist;
    });

 
}
 