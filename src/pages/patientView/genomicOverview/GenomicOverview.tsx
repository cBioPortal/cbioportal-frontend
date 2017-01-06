import * as React from 'react';
import Tracks from './Tracks';

export default class GenomicOverview extends React.Component<{ data: any, plotComponent: any }, {}> {

    public render() {

        return (
            <div style={{ position:'relative' }}>
                <Tracks mutations={this.props.data[0]} cnaSegments={this.props.data[1]} />
                { this.props.plotComponent }
            </div>
        );
    }
}
