import React from 'react';
import { TimelineTrackSpecification } from './types';
import _ from 'lodash';
import { sortNestedTracks } from './lib/helpers';
import { getTrackHeight, TIMELINE_TRACK_HEIGHT } from './TimelineTrack';
import { TICK_AXIS_HEIGHT } from './TickAxis';
import { CustomTrackSpecification } from './CustomTrack';
import { TimelineStore } from './TimelineStore';

interface ITrackHeaderProps {
    track: TimelineTrackSpecification;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
    height: number;
    paddingLeft?: number;
}

export function getTrackLabel(track: TimelineTrackSpecification) {
    return (track.label || track.type).toLowerCase().replace(/_/g, '');
}

const TrackHeader: React.FunctionComponent<ITrackHeaderProps> = function({
    track,
    handleTrackHover,
    height,
    paddingLeft = 5,
}) {
    return (
        <>
            <div
                style={{
                    paddingLeft,
                    height,
                }}
                onMouseEnter={handleTrackHover}
                onMouseLeave={handleTrackHover}
            >
                {getTrackLabel(track)}
            </div>
        </>
    );
};

function expandTrack(
    track: TimelineTrackSpecification,
    indent: number
): { track: TimelineTrackSpecification; indent: number; height: number }[] {
    const ret = [{ track, indent, height: getTrackHeight(track) }];
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
    tracks: TimelineTrackSpecification[],
    leftPadding: number | undefined = 5
) {
    return _.flatMap(tracks, t => expandTrack(t, leftPadding));
}

export const EXPORT_TRACK_HEADER_STYLE =
    'font-size: 12px;text-transform: capitalize; font-family:Arial';
export const EXPORT_TRACK_HEADER_BORDER_CLASSNAME = 'track-header-border';

export function getTrackHeadersG(
    store: TimelineStore,
    customTracks?: CustomTrackSpecification[],
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

    function makeBorderLineElement(y: number, trackHeight: number) {
        const line = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
        ) as unknown) as SVGLineElement;
        line.classList.add(EXPORT_TRACK_HEADER_BORDER_CLASSNAME);
        line.setAttribute('x1', '0');
        line.setAttribute('x2', '0'); // x2 is set by caller
        line.setAttribute('y1', `${y + trackHeight - 0.5}`);
        line.setAttribute('y2', `${y + trackHeight - 0.5}`);
        line.setAttribute('stroke', '#eee');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3,2');
        return line;
    }

    let y = TICK_AXIS_HEIGHT;

    const expandedTracks = expandTracks(store.data, leftPadding);
    for (const t of expandedTracks) {
        const text = makeTextElement(t.indent, y);
        text.textContent = getTrackLabel(t.track);
        g.appendChild(text);

        g.appendChild(makeBorderLineElement(y, t.height));

        y += t.height;
    }

    if (customTracks) {
        for (const t of customTracks) {
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
