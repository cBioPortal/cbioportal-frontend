import { TimelineStore } from './TimelineStore';
import * as React from 'react';
import { REMOVE_FOR_DOWNLOAD_CLASSNAME } from './lib/helpers';

export type CustomTrackSpecification = {
    renderHeader: (store: TimelineStore) => any; // any = react renderable, string or element or null or etc.
    renderTrack: (store: TimelineStore) => React.ReactElement<SVGGElement>;
    height: (store: TimelineStore) => number;
    labelForExport: string;
};

export interface ICustomTrackProps {
    store: TimelineStore;
    specification: CustomTrackSpecification;
    width: number;
    y: number;
    handleTrackHover: (e: React.MouseEvent<SVGGElement>) => void;
}

const CustomTrack: React.FunctionComponent<ICustomTrackProps> = function({
    store,
    specification,
    width,
    y,
    handleTrackHover,
}: ICustomTrackProps) {
    return (
        <g
            className={'tl-track'}
            style={{
                transform: `translate(0, ${y}px)`,
            }}
            onMouseEnter={handleTrackHover}
            onMouseLeave={handleTrackHover}
        >
            <rect
                className={`tl-track-highlight ${REMOVE_FOR_DOWNLOAD_CLASSNAME}`}
                x={0}
                y={0}
                height={specification.height(store)}
                width={width}
                // hide tooltip when mouse over the background rect
                onMouseMove={() => {
                    store.setTooltipModel(null);
                }}
            />
            {specification.renderTrack(store)}
        </g>
    );
};

export default CustomTrack;
