import LazyMobXCache from "../lib/LazyMobXCache";
import _ from "lodash";
import { fetchTreatmentByTreatmentIds, Treatment } from "shared/lib/GenericAssayUtils";

type Query = {
    treatmentId:string;
};

function key(o:{treatmentId:string}) {
    return o.treatmentId.toUpperCase();
}

async function fetch(queries:Query[]) {
    return await fetchTreatmentByTreatmentIds(queries.map(q=>q.treatmentId.toUpperCase()));
}

export default class TreatmentCache extends LazyMobXCache<Treatment, Query> {

    constructor() {
        super(key, key, fetch);
    }
}
