import * as React from 'react';
import { TimelineTrack } from './types';
import { CustomRowSpecification } from './CustomRow';
import { TimelineStore } from './TimelineStore';

interface ICustomTrackHeaderProps {
    store: TimelineStore;
    specification: CustomRowSpecification;
}

const CustomTrackHeader: React.FunctionComponent<
    ICustomTrackHeaderProps
> = function({ store, specification }: ICustomTrackHeaderProps) {
    return (
        <div style={{ paddingLeft: 5, height: specification.height(store) }}>
            {specification.renderHeader(store)}
        </div>
    );
};

export default CustomTrackHeader;
