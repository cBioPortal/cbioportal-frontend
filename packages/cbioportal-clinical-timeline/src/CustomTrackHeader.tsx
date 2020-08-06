import * as React from 'react';
import { TimelineTrackSpecification } from './types';
import { CustomTrackSpecification } from './CustomTrack';
import { TimelineStore } from './TimelineStore';

interface ICustomTrackHeaderProps {
    store: TimelineStore;
    specification: CustomTrackSpecification;
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
