import * as React from 'react';
import Tracks from './Tracks';


export default class GenomicOverview extends React.Component<{ mutations: any, cnaSegments:any }, {}> {


    public render() {

        return (
            <div>
                <Tracks mutations={this.props.mutations} cnaSegments={this.props.cnaSegments} />
            </div>
        );
    }
}
