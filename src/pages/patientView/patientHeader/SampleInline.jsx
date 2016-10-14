import React from 'react';
import { SampleLabelHTML } from '../SampleLabel';

export default class SampleInline extends React.Component {
    render() {

        const { sample, number } = this.props;

        return (
            <span style={{ paddingRight: '10px' }}>
                <SampleLabelHTML color={'black'} label={(number).toString()} />
                {` ${sample.id}`}
            </span>
        );
    }
}
SampleInline.propTypes = {
    // eslint-disable-next-line
    sample: React.PropTypes.object.isRequired,
    number: React.PropTypes.number.isRequired
};
