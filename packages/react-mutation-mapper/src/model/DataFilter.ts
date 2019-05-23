import {HotspotFilter} from "./HotspotFilter";
import {OncoKbFilter} from "./OncoKbFilter";

export type DataFilter = {
    position?: number[];
    hotspot?: HotspotFilter[];
    oncokb?: OncoKbFilter[];
}
