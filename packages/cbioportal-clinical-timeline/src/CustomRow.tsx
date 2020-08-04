import { TimelineStore } from './TimelineStore';
import * as React from 'react';
import { REMOVE_FOR_DOWNLOAD_CLASSNAME } from './lib/helpers';
import { TIMELINE_ROW_HEIGHT } from './TimelineRow';

export type CustomRowSpecification = {
    renderHeader: (store: TimelineStore) => any; // any = react renderable, string or element or null or etc.
    renderRow: (store: TimelineStore) => React.ReactElement<SVGGElement>;
    height: (store: TimelineStore) => number;
    labelForExport: string;
};

export interface ICustomRowProps {
    store: TimelineStore;
    specification: CustomRowSpecification;
    width: number;
    y: number;
    handleRowHover: (e: React.MouseEvent<SVGGElement>) => void;
}

const CustomRow: React.FunctionComponent<ICustomRowProps> = function({
    store,
    specification,
    width,
    y,
    handleRowHover,
}: ICustomRowProps) {
    return (
        <g
            className={'tl-row'}
            style={{
                transform: `translate(0, ${y}px)`,
            }}
            onMouseEnter={handleRowHover}
            onMouseLeave={handleRowHover}
        >
            <rect
                className={`tl-row-highlight ${REMOVE_FOR_DOWNLOAD_CLASSNAME}`}
                x={0}
                y={0}
                height={specification.height(store)}
                width={width}
                // hide tooltip when mouse over the background rect
                onMouseMove={() => {
                    store.setTooltipContent(null);
                }}
            />
            {specification.renderRow(store)}
        </g>
    );
};

export default CustomRow;
