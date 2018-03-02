import {AggregatedHotspots} from "shared/api/generated/GenomeNexusAPIInternal";

export interface IHotspotIndex {
    [genomicLocation: string]: AggregatedHotspots;
}
