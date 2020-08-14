import React, { useCallback } from 'react';
import { TimelineTrackSpecification } from './types';
import { TICK_AXIS_HEIGHT } from './TickAxis';
import { CustomTrackSpecification } from './CustomTrack';
import { TimelineStore } from './TimelineStore';
import { useLocalStore, useObserver } from 'mobx-react-lite';
import { observer } from 'mobx-react';

interface ITrackHeaderProps {
    store: TimelineStore;
    track: TimelineTrackSpecification;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
    height: number;
    paddingLeft?: number;
}

export function getTrackLabel(track: TimelineTrackSpecification) {
    return (track.label || track.type).toLowerCase().replace(/_/g, '');
}

const TrackHeader: React.FunctionComponent<ITrackHeaderProps> = function({
    store,
    track,
    handleTrackHover,
    height,
    paddingLeft = 5,
}) {
    const collapseCallback = useCallback(
        () => store.toggleTrackCollapse(track.uid),
        [track] // todo: would this work or do i have to use a normal props and dereference the prop here?
    );

    return useObserver(() => (
        <>
            <div
                style={{
                    paddingLeft,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
                onMouseEnter={handleTrackHover}
                onMouseLeave={handleTrackHover}
            >
                <span
                    style={{
                        opacity: store.isTrackCollapsed(track.uid) ? 0.5 : 1,
                    }}
                >
                    {getTrackLabel(track)}
                </span>
                {track.tracks && track.tracks.length > 0 && (
                    <button
                        onClick={collapseCallback}
                        className={'btn btn-xs btn-default'}
                        style={{
                            fontSize: 10,
                            lineHeight: 0.5,
                            padding: 3,
                        }}
                    >
                        {store.isTrackCollapsed(track.uid) ? (
                            <i className={'fa fa-plus fa-sm'} />
                        ) : (
                            <i className={'fa fa-minus fa-sm'} />
                        )}
                    </button>
                )}
            </div>
        </>
    ));
};

export const EXPORT_TRACK_HEADER_STYLE =
    'font-size: 12px;text-transform: uppercase; font-family:Arial';
export const EXPORT_TRACK_HEADER_BORDER_CLASSNAME = 'track-header-border';

export function getTrackHeadersG(
    store: TimelineStore,
    customTracks?: CustomTrackSpecification[]
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

    const tracks = store.data;
    for (const t of tracks) {
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
