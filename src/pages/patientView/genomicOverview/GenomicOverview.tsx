import * as React from 'react';
import Tracks from './Tracks';

export default class GenomicOverview extends React.Component<{ mutationData: any, cnaSegmentData: any }, {}> {

    public render() {

        return (
            <div>
                <Tracks mutations={this.props.mutationData} cnaSegments={this.props.cnaSegmentData} />
            </div>
        );
    }
}
