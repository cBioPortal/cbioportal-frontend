import React from 'react';
import { TimelineTrack } from './types';
import _ from 'lodash';
import { sortNestedTracks } from './lib/helpers';
import { TIMELINE_ROW_HEIGHT } from './TimelineRow';
import { TICK_ROW_HEIGHT } from './TickRow';
import { CustomRowSpecification } from './CustomRow';
import { TimelineStore } from './TimelineStore';

interface ITrackHeaderProps {
    track: TimelineTrack;
    level?: number;
}

export function getTrackLabel(track: TimelineTrack) {
    return (track.label || track.type).toLowerCase().replace(/_/g, '');
}

const TrackHeader: React.FunctionComponent<ITrackHeaderProps> = function({
    track,
    level = 5,
}) {
    if (track.tracks) {
        // we want to sort by first item start date
        let sortedRows = _.sortBy(track.tracks, t =>
            t.items && t.items.length ? t.items[0].start : 0
        );

        return (
            <>
                <div
                    style={{ paddingLeft: level, height: TIMELINE_ROW_HEIGHT }}
                >
                    {getTrackLabel(track)}
                </div>
                {sortedRows.map(track => (
                    <TrackHeader level={level + 17} track={track} />
                ))}
            </>
        );
    } else {
        return (
            <div style={{ paddingLeft: level, height: TIMELINE_ROW_HEIGHT }}>
                {getTrackLabel(track)}
            </div>
        );
    }
};

function expandTrack(
    track: TimelineTrack,
    indent: number
): { track: TimelineTrack; indent: number }[] {
    const ret = [{ track, indent }];
    if (track.tracks) {
        // we want to sort nested tracks by start date of first item
        const sortedNestedTracks = sortNestedTracks(track.tracks);
        ret.push(
            ..._.flatMap(sortedNestedTracks, t => expandTrack(t, indent + 17))
        );
    }
    return ret;
}

export function expandTracks(
    tracks: TimelineTrack[],
    leftPadding: number | undefined = 5
) {
    return _.flatMap(tracks, t => expandTrack(t, leftPadding));
}

export const EXPORT_TRACK_HEADER_STYLE =
    'font-size: 12px;text-transform: capitalize; font-family:Arial';
export const EXPORT_TRACK_HEADER_BORDER_CLASSNAME = 'track-header-border';

export function getTrackHeadersG(
    store: TimelineStore,
    customRows?: CustomRowSpecification[],
    leftPadding: number | undefined = 5
) {
    const g = (document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
    ) as unknown) as SVGGElement;

    function makeTextElement(x: number, y: number) {
        const text = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        ) as unknown) as SVGTextElement;
        text.setAttribute('style', EXPORT_TRACK_HEADER_STYLE);
        text.setAttribute('x', `${x}px`);
        text.setAttribute('y', `${y}px`);
        text.setAttribute('dy', '1em');
        return text;
    }

    function makeBorderLineElement(y: number, rowHeight: number) {
        const line = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
        ) as unknown) as SVGLineElement;
        line.classList.add(EXPORT_TRACK_HEADER_BORDER_CLASSNAME);
        line.setAttribute('x1', '0');
        line.setAttribute('x2', '0'); // x2 is set by caller
        line.setAttribute('y1', `${y + rowHeight - 0.5}`);
        line.setAttribute('y2', `${y + rowHeight - 0.5}`);
        line.setAttribute('stroke', '#eee');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3,2');
        return line;
    }

    let y = TICK_ROW_HEIGHT;

    const expandedTracks = expandTracks(store.data, leftPadding);
    for (const t of expandedTracks) {
        const text = makeTextElement(t.indent, y);
        text.textContent = getTrackLabel(t.track);
        g.appendChild(text);

        g.appendChild(makeBorderLineElement(y, TIMELINE_ROW_HEIGHT));

        y += TIMELINE_ROW_HEIGHT;
    }

    if (customRows) {
        for (const t of customRows) {
            const text = makeTextElement(5, y);
            text.textContent = t.labelForExport;
            g.appendChild(text);

            const height = t.height(store);
            g.appendChild(makeBorderLineElement(y, height));

            y += height;
        }
    }

    return g;
}

export default TrackHeader;
