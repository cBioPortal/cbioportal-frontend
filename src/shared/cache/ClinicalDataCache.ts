import client from "../api/cbioportalClientInstance";
import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {ClinicalDataIdentifier, ClinicalData, ClinicalDataMultiStudyFilter} from "../api/generated/CBioPortalAPI";
import {collectByStudy, getStudyToSamples} from "../lib/CacheUtils";

function key(d:{studyId?:string, entityId:string}, m?:string) {
    const studyId = d.studyId ? d.studyId : m;
    return `${studyId}~${d.entityId}`;
}
async function fetch(queries:ClinicalDataIdentifier[],
               attributeIds:string[],
               clinicalDataType:"SAMPLE"|"PATIENT",
               projection:"ID" | "SUMMARY" | "DETAILED" | "META"):Promise<AugmentedData<ClinicalData, string>[]> {

    const studyToIdentifiers = collectByStudy(queries, query=>query);
    const studies = Object.keys(studyToIdentifiers);
    const results:ClinicalData[][] = await Promise.all(studies.map(studyId=>{
        return client.fetchClinicalDataUsingPOST({
            clinicalDataType,
            clinicalDataMultiStudyFilter: {attributeIds, identifiers: studyToIdentifiers[studyId]},
            projection
        });
    }));
    return results.map((data:ClinicalData[], index:number)=>({ data, meta:studies[index] }));
}

export default class ClinicalDataCache extends LazyMobXCache<ClinicalData, ClinicalDataIdentifier> {
    constructor(attributeIds:string[],
                clinicalDataType:"SAMPLE"|"PATIENT",
                projection:"ID" | "SUMMARY" | "DETAILED" | "META") {
        super(
            key,
            key,
            fetch,
            attributeIds, clinicalDataType, projection);
    }
}