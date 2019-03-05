import {observable} from "mobx";
import {TrackNames, TrackVisibility} from "../tracks/TrackSelector";

export function initDefaultTrackVisibility(): TrackVisibility {
    return {
        [TrackNames.OncoKB]: 'hidden',
        [TrackNames.CancerHotspots]: 'hidden',
        [TrackNames.PTM]: 'hidden',
        [TrackNames.PDB]: 'hidden'
    };
}

export default class MutationMapperUserSelectionStore
{
    @observable trackVisibility: TrackVisibility;

    constructor() {
        this.trackVisibility = initDefaultTrackVisibility();
    }
}
