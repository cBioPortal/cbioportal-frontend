import * as React from 'react';

import { SampleLabelHTML } from '../SampleLabel';

type TODO = any;

interface ISampleInlineProps {
    sample: TODO;
    sampleNumber: number;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber } = this.props;

        return (
            <span style={{paddingRight: '10px'}}>
                <SampleLabelHTML color={'black'} label={(sampleNumber).toString()} />
                {' ' + sample.id}
            </span>
        );
    }
}
