import ClinicalDataCache from "./ClinicalDataCache";

export default class CancerTypeCache extends ClinicalDataCache {
    constructor(studyId:string) {
        super(studyId, ["CANCER_TYPE_DETAILED"], "SAMPLE", "SUMMARY");
    }
}