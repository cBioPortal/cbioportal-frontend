import * as React from 'react';
import Tracks from './Tracks';

export default class GenomicOverview extends React.Component<{ mutations: any, cnaSegments:any, plotComponent: any }, {}> {

    public render() {

        return (
            <div className="clearfix" style={{ display:'flex', alignItems:'center' }}>
                <div className="pull-left">
                    <Tracks mutations={this.props.mutations} cnaSegments={this.props.cnaSegments} />
                </div>
                <div className="pull-left" style={{ marginLeft:30 }}>{ this.props.plotComponent }</div>
            </div>
        );
    }
}
