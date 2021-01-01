import * as request from 'superagent';
import {IPharmacoDBGeneDrugAssociationData, IPharmacoDBmRnaEntry, IPharmacoDBCnaEntry,IPharmacoDBView} from "shared/model/PharmacoDB.ts";


/**
 * PharmacoDB
 */
export default class PharmacoDBAPI {
    
    getCNAView(oncoTreeCode: string, geneName: string, cna: string): Promise<Array<IPharmacoDBView>> {
        return request.get('https://cbioapi.pharmacodb.ca/v1/genes/cna/' + oncoTreeCode)
        .query({gene: geneName})
        .query({cna: cna})
        .query({retrieveData: 'false'})
               .then((res) => {
                   let result = res.body;
                   return result;
              });
    }
    
    getCNACardData(oncoTreeCode: string, geneName: string, cna: string): Promise<IPharmacoDBCnaEntry> {
        return request.get('https://cbioapi.pharmacodb.ca/v1/genes/cna/' + oncoTreeCode)
        .query({gene: geneName})
        .query({cna: cna})
        .query({retrieveData: 'true'})
                      .then((res) => {
                   let result = res.body;
                   return result;
              });
    }

    /**
     * Returns a promise that resolves with the variants for the parameters given.
     */
    getmRNAView(oncoTreeCode: string, geneName: string, direction: number): Promise<Array<IPharmacoDBView>> {
        return request.get('https://cbioapi.pharmacodb.ca/v1/genes/mrna/' + oncoTreeCode)
        .query({gene: geneName})
        .query({direction: direction})
        .query({retrieveData: 'false'})
               .then((res) => {
                   let result = res.body;
                   return result;
              });
    }

    /**
     * Returns a promise that resolves with the variants for the parameters given.
     */
    getmRNACardData(oncoTreeCode: string, geneName: string, direction: number): Promise<IPharmacoDBmRnaEntry> {
        return request.get('https://cbioapi.pharmacodb.ca/v1/genes/mrna/' + oncoTreeCode)
        .query({gene: geneName})
        .query({direction: direction})
        .query({retrieveData: 'true'})
               .then((res) => {
                   let result = res.body;
                   return result;
              });
    }
}