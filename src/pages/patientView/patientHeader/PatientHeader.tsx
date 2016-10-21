import {List} from 'immutable';
import * as Immutable from 'immutable';
import * as React from 'react';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import Spinner from 'react-spinkit';

import TooltipTable from '../clinicalInformation/ClinicalInformationPatientTable';
import SampleInline from './SampleInline';

type TODO = any;

type Sample = {clinicalData: TODO};

export interface IPatientHeaderProps {
    samples: List<Sample>;
    status: 'fetching'|'complete'|'error';
    patient: TODO;
}

export default class PatientHeader extends React.Component<IPatientHeaderProps, {}> {
    public render() {
        switch (this.props.status) {
            case 'fetching':
                return <div><Spinner spinnerName='three-bounce' /></div>;

            case 'complete':
                return this.drawHeader();

            case 'error':
                return <div>There was an error.</div>;

            default:
                return <div />;
        }
    }

    private getPopover(sample: Sample, sampleNumber: number) {
        return (
            <Popover key={sampleNumber} id={'popover-sample-' + sampleNumber}>
                <TooltipTable data={Immutable.fromJS(sample.clinicalData)} />
            </Popover>
        );
    }

    private getOverlayTrigger(sample: Sample, sampleNumber: number) {
        return (
            <OverlayTrigger
                delayHide={100}
                key={sampleNumber}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopover(sample, sampleNumber + 1)}
            >
                <span>
                    <SampleInline sample={sample} sampleNumber={sampleNumber + 1} />
                </span>
            </OverlayTrigger>
        );
    }

    private drawHeader() {
        if (this.props.samples && this.props.samples.size > 0) {
            return (
                <div>
                    {this.props.samples.map((sample:Sample, sampleNumber: number) => this.getOverlayTrigger)}
                </div>
            );
        }
        else {
            return <div>There was an error.</div>;
        }
    }
}
