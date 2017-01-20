import * as React from 'react';
import * as _ from 'underscore';
import {OverlayTrigger, Popover} from 'react-bootstrap';

import ClinicalInformationPatientTable from '../clinicalInformation/ClinicalInformationPatientTable';
import SampleInline from './SampleInline';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {ClinicalInformationData} from "../Connector";
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';

import styles from './styles.module.scss';

export type IPatientHeaderProps = Partial<Pick<ClinicalInformationData, 'clinicalDataStatus' | 'patient' | 'samples'>>;

export default class PatientHeader extends React.Component<IPatientHeaderProps, {}> {
    public render() {

        return (
            <div className={styles.patientHeader}>
                <div>
                    <i className="fa fa-female fa-2 genderIcon hidden" aria-hidden="true"></i>
                    {this.props.patient && this.getOverlayTriggerPatient(this.props.patient)}
                </div>
                {this.props.samples && this.props.samples.map((s, n) => this.getOverlayTriggerSample(s, n))}
            </div>
        );

    }

    private getPopoverSample(sample: ClinicalDataBySampleId, sampleNumber: number) {
        return (
            <Popover key={sampleNumber} id={'popover-sample-' + sampleNumber}>
                <ClinicalInformationPatientTable showTitleBar={false} data={sample.clinicalData} />
            </Popover>
        );
    }

    private getPopoverPatient(patient: ClinicalInformationData['patient']) {
        return patient && (
            <Popover key={patient.id} id={'popover-sample-' + patient.id}>
                <ClinicalInformationPatientTable showTitleBar={false} data={patient.clinicalData} />
            </Popover>
        );
    }

    private getOverlayTriggerPatient(patient: ClinicalInformationData['patient']) {
        return patient && (
            <OverlayTrigger
                delayHide={100}
                key={patient.id}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverPatient(patient)}
            >
                <span>
                    {patient.id}
                    <span dangerouslySetInnerHTML={{__html:
                        getSpans(_.object(patient.clinicalData.map((x) => [x.clinicalAttributeId, x.value])), 'lgg_ucsf_2014')}}>
                    </span>
                </span>
            </OverlayTrigger>
        );
    }

    private getOverlayTriggerSample(sample: ClinicalDataBySampleId, sampleNumber: number) {
        return (
            <OverlayTrigger
                delayHide={100}
                key={sampleNumber}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverSample(sample, sampleNumber + 1)}
            >
                <span>
                    <SampleInline sample={sample} sampleNumber={sampleNumber + 1} showClinical={true} />
                </span>
            </OverlayTrigger>
        );
    }
}
