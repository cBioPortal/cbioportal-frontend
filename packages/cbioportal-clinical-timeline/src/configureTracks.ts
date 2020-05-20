import React from 'react';
import { TimelineEvent, TimelineTrack } from './types';
import _ from 'lodash';

export type ITrackEventConfig = {
    trackTypeMatch: RegExp;
    configureTrack: (track: TimelineTrack) => any;
};

export const configureTracks = function(
    tracks: TimelineTrack[],
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
