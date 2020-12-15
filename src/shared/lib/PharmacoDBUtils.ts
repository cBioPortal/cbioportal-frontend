import * as _ from 'lodash';
import {
    IPharmacoDBGeneDrugAssociationData,
    IPharmacoDBView,
    IPharmacoDBViewList,
    IPharmacoDBCnaRequest,
} from 'shared/model/PharmacoDB.ts';
import pharmacoDBClient from 'shared/api/PharmacoDBClientInstance';
import { DiscreteCopyNumberData } from 'shared/api/generated/CBioPortalAPI';

/**
 * Asynchronously return a map with PharmacoDB information from the oncoTreeCode, genes and CNA Viewdata given.
 */
export function getPharmacoDBCnaView(
    oncoTreeCode: string,
    cnareqlist: Array<IPharmacoDBCnaRequest>
): Promise<IPharmacoDBViewList> {
    let pharmacoDBviewlist: IPharmacoDBViewList = {};
    let genes: Array<string> = [];
    let statuses: Array<string> = [];

    // Assemble a list of promises, each of which will retrieve a batch of genes
    let promises: Array<Promise<Array<IPharmacoDBView>>> = [];
    //Create promises for each batch
    //New batch is created when batch size>100

    cnareqlist.forEach(function(cnareq) {
        //todo: check if same gene already exists, if it exists, then error.
        genes.push(cnareq.gene);
        statuses.push(cnareq.cna);
        if (genes.length > 100) {
            promises.push(
                pharmacoDBClient.getCNAView(
                    oncoTreeCode,
                    genes.join(),
                    statuses.join()
                )
            );
            genes = [];
            statuses = [];
        }
    });
    if (genes.length > 0)
        promises.push(
            pharmacoDBClient.getCNAView(
                oncoTreeCode,
                genes.join(),
                statuses.join()
            )
        );

    //once promises are fulfilled, collect all responses and merge them and return
    return Promise.all(promises)
        .then(function(responses) {
            for (let res in responses) {
                let arrayPharmacoDBViews: Array<IPharmacoDBView> =
                    responses[res];
                arrayPharmacoDBViews.forEach(pharmacoDBView => {
                    pharmacoDBviewlist[pharmacoDBView.gene] = pharmacoDBView;
                });
            }
        })
        .then(function() {
            return pharmacoDBviewlist;
        });
}
