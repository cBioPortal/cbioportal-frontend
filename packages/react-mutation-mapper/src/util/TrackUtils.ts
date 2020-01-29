import { TrackName, TrackVisibility } from '../component/track/TrackSelector';

export function initDefaultTrackVisibility(): TrackVisibility {
    return {
        [TrackName.OncoKB]: 'hidden',
        [TrackName.CancerHotspots]: 'hidden',
        [TrackName.PTM]: 'hidden',
        [TrackName.PDB]: 'hidden',
    };
}
