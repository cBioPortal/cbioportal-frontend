import React from 'react';
import { TimelineTrack } from './types';
import _ from 'lodash';

interface ITrackHeaderProps {
    track: TimelineTrack;
    level?: number;
}

const TrackHeader: React.FunctionComponent<ITrackHeaderProps> = function({
    track,
    level = 5,
}) {
    const label = track.label || track.type;
    if (track.tracks) {
        // we want to sort by first item start date
        let sortedRows = _.sortBy(track.tracks, t =>
            t.items && t.items.length ? t.items[0].start : 0
        );

        return (
            <>
                <div style={{ paddingLeft: level }}>
                    {label.toLowerCase().replace(/_/g, '')}
                </div>
                {sortedRows.map(track => (
                    <TrackHeader level={level + 17} track={track} />
                ))}
            </>
        );
    } else {
        return (
            <div style={{ paddingLeft: level }}>
                {label.toLowerCase().replace(/_/g, '')}
            </div>
        );
    }
};

export default TrackHeader;
