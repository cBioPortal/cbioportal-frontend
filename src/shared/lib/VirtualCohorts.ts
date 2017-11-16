export type LocalStorageVirtualCohort = {
    created: number,
    description: string,
    filters: any,
    selectedCases:{patients:string[], samples:string[], studyID:string}[],
    studyName: string,
    userID: string,
    virtualCohortID: string
};

export const VIRTUAL_COHORTS_LOCAL_STORAGE_KEY = "virtual-cohorts";
export default class VirtualCohorts {
    public static delete(virtualCohortID:string) {
        let localStorageVirtualCohorts:LocalStorageVirtualCohort[] = JSON.parse(localStorage.getItem(VIRTUAL_COHORTS_LOCAL_STORAGE_KEY) || "[]");
        localStorageVirtualCohorts = localStorageVirtualCohorts.filter(x=>(x.virtualCohortID !== virtualCohortID));
        localStorage.setItem(VIRTUAL_COHORTS_LOCAL_STORAGE_KEY, JSON.stringify(localStorageVirtualCohorts));
    }
    public static get() {
        return JSON.parse(localStorage.getItem(VIRTUAL_COHORTS_LOCAL_STORAGE_KEY) || "[]");
    }
}