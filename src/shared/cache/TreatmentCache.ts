import LazyMobXCache from "../lib/LazyMobXCache";
import {Treatment} from "../api/generated/CBioPortalAPIInternal";
import internalClient from "../api/cbioportalInternalClientInstance";

type Query = {
    treatmentId:string;
};

function key(o:{treatmentId:string}) {
    return o.treatmentId.toUpperCase();
}

async function fetch(queries:Query[]) {
    return internalClient.fetchTreatmentsUsingPOST({treatmentIds: queries.map(q=>q.treatmentId.toUpperCase())});
}

export default class TreatmentCache extends LazyMobXCache<Treatment, Query> {

    constructor() {
        super(key, key, fetch);
    }
}