import {AggregatedHotspots} from "shared/api/generated/GenomeNexusAPIInternal";

export interface IHotspotIndex {
    [genomicLocation: string]: AggregatedHotspots;
}

export interface IHotspotDataWrapper {
    status: "pending" | "error" | "complete";
    result?: IHotspotIndex;
}
