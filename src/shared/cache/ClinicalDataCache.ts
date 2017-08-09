import client from "../api/cbioportalClientInstance";
import LazyMobXCache from "../lib/LazyMobXCache";
import {ClinicalDataIdentifier, ClinicalData, ClinicalDataMultiStudyFilter} from "../api/generated/CBioPortalAPI";

function fetch(queries:ClinicalDataIdentifier[],
               attributeIds:string[],
               clinicalDataType:"SAMPLE"|"PATIENT",
               projection:"ID" | "SUMMARY" | "DETAILED" | "META"):Promise<ClinicalData[]> {

    const clinicalDataMultiStudyFilter = {attributeIds: attributeIds, identifiers: queries};
    return client.fetchClinicalDataUsingPOST({
        clinicalDataType,
        clinicalDataMultiStudyFilter,
        projection
    });
}

export default class ClinicalDataCache extends LazyMobXCache<ClinicalData, ClinicalDataIdentifier> {
    constructor(studyId:string,
                attributeIds:string[],
                clinicalDataType:"SAMPLE"|"PATIENT",
                projection:"ID" | "SUMMARY" | "DETAILED" | "META") {
        super(
            q=>q.studyId+"~"+q.entityId,
            d=>studyId+"~"+d.entityId,
            fetch,
            attributeIds, clinicalDataType, projection);
    }
}