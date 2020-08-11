import * as React from 'react';
import CustomTrack, { CustomTrackSpecification, ICustomTrackProps } from '../CustomTrack';
import { TimelineStore } from '../TimelineStore';

export interface ILineChartTrackProps {
    store: TimelineStore;
    width: number;
    y: number;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
}

export function makeLineChartTrackSpecification(

) {
}

    // TODO: memo?
    renderHeader:store=>{

    },
    renderTrack:store=>{

    },
    height:store=>{

    },
    labelForExport
}

const LineChartTrack: React.FunctionComponent<ILineChartTrackProps> = function({
     store,
     width,
     y,
     handleTrackHover,
}: ILineChartTrackProps) {
    return (
        <CustomTrack 
            store={store} 
            specification={} 
            width={width} 
            y={y} 
            handleTrackHover={handleTrackHover}
        />
    );
}