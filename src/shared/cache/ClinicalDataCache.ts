import client from "../api/cbioportalClientInstance";
import LazyMobXCache from "../lib/LazyMobXCache";
import {ClinicalDataIdentifier, ClinicalData} from "../api/generated/CBioPortalAPI";

function fetch(queries:ClinicalDataIdentifier[],
               attributeId:string,
               clinicalDataType:"SAMPLE"|"PATIENT",
               projection:"ID" | "SUMMARY" | "DETAILED" | "META"):Promise<ClinicalData[]> {
    return client.fetchClinicalDataUsingPOST({
        attributeId,
        clinicalDataType,
        identifiers: queries,
        projection
    });
}

export default class ClinicalDataCache extends LazyMobXCache<ClinicalData, ClinicalDataIdentifier> {
    constructor(studyId:string,
                attributeId:string,
                clinicalDataType:"SAMPLE"|"PATIENT",
                projection:"ID" | "SUMMARY" | "DETAILED" | "META") {
        super(
            q=>q.studyId+"~"+q.entityId,
            d=>studyId+"~"+d.entityId,
            fetch,
            attributeId, clinicalDataType, projection);
    }
}