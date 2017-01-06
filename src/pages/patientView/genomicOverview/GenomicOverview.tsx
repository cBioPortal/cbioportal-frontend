import * as React from 'react';
import Tracks from './Tracks';

export default class GenomicOverview extends React.Component<{ data: any, plotComponent: any }, {}> {

    public render() {

        return (
            <div className="clearfix" style={{ display:'flex', alignItems:'center' }}>
                <div className="pull-left">
                    <Tracks mutations={this.props.data[0]} cnaSegments={this.props.data[1]} />
                </div>
                <div className="pull-left" style={{ marginLeft:30 }}>{ this.props.plotComponent }</div>
            </div>
        );
    }
}
