import React from 'react';
import { TimelineEvent, TimelineTrackSpecification } from './types';
import _ from 'lodash';

export type ITrackEventConfig = {
    trackTypeMatch: RegExp;
    configureTrack: (track: TimelineTrackSpecification) => any;
};

export const configureTracks = function(
    tracks: TimelineTrackSpecification[],
    trackConfigs: ITrackEventConfig[]
) {
    tracks.forEach(track => {
        const conf = trackConfigs.find(conf =>
            conf.trackTypeMatch.test(track.type)
        );

        if (conf) {
            conf.configureTrack(track);
        }

        if (track.tracks && track.tracks.length) {
            configureTracks(track.tracks, trackConfigs);
        }
    });
};
