import client from "shared/api/pdbAnnotationClientInstance";
import LazyMobXCache from "shared/lib/LazyMobXCache";
import {PdbHeader} from "shared/api/generated/PdbAnnotationAPI";

function fetch(pdbIds:string[]):Promise<PdbHeader[]> {
    if (pdbIds.length === 0) {
        return Promise.reject("No pdb ids given");
    } else {
        // TODO PdbAnnotationAPI needs to be updated to support post body parameters
        return client.postPdbHeader({
            pdbIds: pdbIds
        });
    }
}
export default class PdbHeaderCache extends LazyMobXCache<PdbHeader, string> {
    constructor() {
        super(q=>q, (d:PdbHeader)=>d.pdbId, fetch);
    }
}
