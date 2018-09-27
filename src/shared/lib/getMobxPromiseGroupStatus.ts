import * as _ from "lodash";
import MobxPromise from "mobxpromise/dist/src/MobxPromise";

export function getMobxPromiseGroupStatus(...promises:MobxPromise<any>[]): "complete" | "error" | "pending" {
    if (_.some(promises,(p)=>p.isError)){
        return "error";
    }
    else if (_.some(promises,(p)=>p.isPending)){
        return "pending";
    } else {
        return "complete";
    }
}