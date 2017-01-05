import * as React from 'react';
import Tracks from './Tracks';

export default class GenomicOverview extends React.Component<{ data: any }, {}> {

    public render() {

        return (
            <div>
                <Tracks mutations={this.props.data[0]} cnaSegments={this.props.data[1]} />
            </div>
        );
    }
}
