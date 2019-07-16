import {HotspotFilter} from "./HotspotFilter";
import {OncoKbFilter} from "./OncoKbFilter";
import {MutationFilter} from "./MutationFilter";

export type DataFilter = {
    position?: number[];
    hotspot?: HotspotFilter[];
    oncokb?: OncoKbFilter[];
    mutation?: MutationFilter[];
}

export type CustomFilterApplier = (filter: DataFilter,
                                   datum: any,
                                   positions: {[position: string]: {position: number}}) => boolean;
