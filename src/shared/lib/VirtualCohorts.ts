export type LocalStorageVirtualCohort = {
    created: number,
    description: string,
    filters: any,
    studies:{samples:string[], id:string}[],
    name: string,
    userID: string,
    id: string
};

export const VIRTUAL_COHORTS_LOCAL_STORAGE_KEY = "virtual-cohorts";
export default class VirtualCohorts {
    public static delete(id:string) {
        let localStorageVirtualCohorts:LocalStorageVirtualCohort[] = JSON.parse(localStorage.getItem(VIRTUAL_COHORTS_LOCAL_STORAGE_KEY) || "[]");
        localStorageVirtualCohorts = localStorageVirtualCohorts.filter(x=>(x.id !== id));
        localStorage.setItem(VIRTUAL_COHORTS_LOCAL_STORAGE_KEY, JSON.stringify(localStorageVirtualCohorts));
    }
    public static get() {
        return JSON.parse(localStorage.getItem(VIRTUAL_COHORTS_LOCAL_STORAGE_KEY) || "[]");
    }
}