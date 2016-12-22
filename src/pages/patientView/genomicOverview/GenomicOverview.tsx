import * as React from 'react';
import Tracks from './Tracks';

export default class GenomicOverview extends React.Component<{ data: any }, {}> {

    public render() {

        return (
            <div>
                <Tracks data={this.props.data} />
                <div>adam's component</div>
            </div>
        );
    }
}
