import ClinicalDataCache from "./ClinicalDataCache";

export default class CancerTypeCache extends ClinicalDataCache {
    constructor() {
        super(["CANCER_TYPE_DETAILED"], "SAMPLE", "SUMMARY");
    }
}
