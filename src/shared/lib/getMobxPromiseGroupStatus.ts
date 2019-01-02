import * as _ from "lodash";

export function getMobxPromiseGroupStatus(...promises:{ status:"complete"|"error"|"pending"}[]): "complete" | "error" | "pending" {
    if (_.some(promises,(p)=>p.status === "error")){
        return "error";
    }
    else if (_.some(promises,(p)=>p.status === "pending")){
        return "pending";
    } else {
        return "complete";
    }
}