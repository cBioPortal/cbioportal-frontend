import * as React from 'react';
import Tracks from './Tracks';


export default class GenomicOverview extends React.Component<{ mutations: any, cnaSegments:any, plotComponent: any }, {}> {


    public render() {

        return (
            <div>
                <Tracks mutations={this.props.mutationData} cnaSegments={this.props.cnaSegmentData} />
            </div>
        );
    }
}
