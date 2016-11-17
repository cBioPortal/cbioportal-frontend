import * as React from 'react';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import Spinner from 'react-spinkit';

import ClinicalInformationPatientTable from '../clinicalInformation/ClinicalInformationPatientTable';
import SampleInline from './SampleInline';
import {ClinicalDataBySampleId} from "../clinicalInformation/getClinicalInformationData";

type TODO = any;

type Sample = {clinicalData: TODO};
type Patient = {id: string, clinicalData: TODO};

export interface IPatientHeaderProps {
    samples: Array<ClinicalDataBySampleId>;
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

    private getPopoverSample(sample: Sample, sampleNumber: number) {
        return (
            <Popover key={sampleNumber} id={'popover-sample-' + sampleNumber}>
                <ClinicalInformationPatientTable showTitleBar={false} data={sample.clinicalData} />
            </Popover>
        );
    }

    private getPopoverPatient(patient: Patient) {
        return (
            <Popover key={patient.id} id={'popover-sample-' + patient.id}>
                <ClinicalInformationPatientTable showTitleBar={false} data={patient.clinicalData} />
            </Popover>
        );
    }

    private getOverlayTriggerPatient(patient: Patient) {
        return (
            <OverlayTrigger
                delayHide={100}
                key={patient.id}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverPatient(patient)}
            >
                <span>
                    {patient.id}
                </span>
            </OverlayTrigger>
        );
    }

    private getOverlayTriggerSample(sample: Sample, sampleNumber: number) {
        return (
            <OverlayTrigger
                delayHide={100}
                key={sampleNumber}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverSample(sample, sampleNumber + 1)}
            >
                <span>
                    <SampleInline sample={sample} sampleNumber={sampleNumber + 1} />
                </span>
            </OverlayTrigger>
        );
    }

    private drawHeader() {
        if (this.props.samples && this.props.samples.length > 0) {
            return (
                <div>
                    {this.getOverlayTriggerPatient(this.props.patient)}<br />
                    {this.props.samples.map((s, n) => this.getOverlayTriggerSample(s, n))}
                </div>
            );
        }
        else {
            return <div>There was an error.</div>;
        }
    }
}
