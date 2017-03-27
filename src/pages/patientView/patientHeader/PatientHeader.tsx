import * as React from 'react';
import {fromPairs} from 'lodash';
import {OverlayTrigger, Popover} from 'react-bootstrap';

import ClinicalInformationPatientTable from '../clinicalInformation/ClinicalInformationPatientTable';
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';

import styles from './styles.module.scss';

export type IPatientHeaderProps = {
    patient:any;
    handlePatientClick:any;
}
export default class PatientHeader extends React.Component<IPatientHeaderProps, {}> {
    public render() {

        return (
            <div className={styles.patientHeader}>
                {this.props.patient && this.getOverlayTriggerPatient(this.props.patient)}
                {this.getDarwinAccessUrl()}
            </div>
        );

    }

    private getDarwinAccessUrl() {
        // use JSP injected Darwin URL window.darwinAccessUrl
        // TODO: use internal API service instead, once this exists
        let darwinAccessUrl: string | null | undefined = ((window as any).darwinAccessUrl);

        if (darwinAccessUrl !== undefined && darwinAccessUrl !== null && darwinAccessUrl !== '') {
            // add link to darwin
            let darwinImgSrc = require("./images/darwin_logo.png");
            return (<a target='_blank' href={darwinAccessUrl}><img style={{paddingLeft:'5px'}} src={darwinImgSrc} /></a>);
        } else {
            return null;
        }
    }

    private getPopoverPatient(patient: any) {
        return patient && (
            <Popover key={patient.id} id={'popover-sample-' + patient.id}>
                <ClinicalInformationPatientTable showTitleBar={false} data={patient.clinicalData} />
            </Popover>
        );
    }

    private getOverlayTriggerPatient(patient: any) {
        return patient && (
            <OverlayTrigger
                delayHide={100}
                key={patient.id}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverPatient(patient)}
            >
                <span>
                    <a href="javascript:void(0)" onClick={()=>this.props.handlePatientClick(patient.id)}>{patient.id}</a>
                    <span className='clinical-spans' id='patient-attributes' dangerouslySetInnerHTML={{__html:
                        getSpans(fromPairs(patient.clinicalData.map((x: any) => [x.clinicalAttributeId, x.value])), 'lgg_ucsf_2014')}}>
                    </span>
                </span>
            </OverlayTrigger>
        );
    }
}
