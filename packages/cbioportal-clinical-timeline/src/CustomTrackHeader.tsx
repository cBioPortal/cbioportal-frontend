import * as React from 'react';
import { TimelineTrackSpecification } from './types';
import { CustomTrackSpecification } from './CustomTrack';
import { TimelineStore } from './TimelineStore';

interface ICustomTrackHeaderProps {
    store: TimelineStore;
    specification: CustomTrackSpecification;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
}

const CustomTrackHeader: React.FunctionComponent<
    ICustomTrackHeaderProps
> = function({
    store,
    specification,
    handleTrackHover,
}: ICustomTrackHeaderProps) {
    return (
        <div
            style={{ paddingLeft: 5, height: specification.height(store) }}
            onMouseEnter={handleTrackHover}
            onMouseLeave={handleTrackHover}
        >
            {specification.renderHeader(store)}
        </div>
    );
};

export default CustomTrackHeader;
