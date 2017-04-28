import {HotspotMutation} from "shared/api/generated/CancerHotspotsAPI";
import HotspotSet from "shared/lib/HotspotSet";

export interface IHotspotIndex {
    [gene:string]: {
        [hotspotType:string]: IHotspotLookup
    }
}

export interface IHotspotLookup {
    hotspotMutations: HotspotMutation[],
    hotspotSet: HotspotSet;
}

export interface IHotspotData {
    single: IHotspotIndex,
    clustered: IHotspotIndex
}

export interface ICancerHotspotData {
    single: HotspotMutation[],
    clustered: HotspotMutation[]
}
