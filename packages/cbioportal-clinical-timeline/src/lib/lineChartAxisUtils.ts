import { TimelineTrackSpecification } from '../types';
import {
    getLineChartYCoordinateForValue,
    getTrackValueRange,
} from '../TimelineTrack';
import { getTrackHeight } from './helpers';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';

export function getTicksForLineChartAxis(track: TimelineTrackSpecification) {
    const range = getTrackValueRange(track);
    const trackHeight = getTrackHeight(track);
    const rawTickValues = [range.min, (range.min + range.max) / 2, range.max];
    return rawTickValues.map(v => ({
        label: tickFormatNumeral(v, rawTickValues),
        offset: getLineChartYCoordinateForValue(v, track, trackHeight, range),
    }));
}
