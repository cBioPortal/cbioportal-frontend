import * as React from 'react';
import {Button, OverlayTrigger, Popover} from 'react-bootstrap';
import { SampleLabelHTML } from '../SampleLabel';

type TODO = any;

interface SampleInlineProps
{
    sample: TODO;
    number: number;
}

export default class SampleInline extends React.Component<SampleInlineProps, {}>
{
    render()
    {
        const { sample, number } = this.props;
        return (
            <span style={{"paddingRight":"10px"}}>
                <SampleLabelHTML color={'black'} label={(number).toString()} />
                {' ' + sample.id}
            </span>
        );
    }
}
