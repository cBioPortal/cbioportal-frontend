import * as React from 'react';
import {fromPairs} from 'lodash';
import {OverlayTrigger, Popover} from 'react-bootstrap';

import ClinicalInformationPatientTable from '../clinicalInformation/ClinicalInformationPatientTable';
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';

import styles from './styles.module.scss';
import DefaultTooltip from "../../../shared/components/DefaultTooltip";

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
            <div key={patient.id} style={{ maxHeight:400, overflow:'auto' }}>
                <h5>{ patient.id }</h5>
                <ClinicalInformationPatientTable showTitleBar={false} data={patient.clinicalData} />
            </div>
        );
    }

    private getOverlayTriggerPatient(patient: any) {
        return patient &&
        (
            <DefaultTooltip
                placement='bottom'
                trigger={['hover', 'focus']}
                overlay={this.getPopoverPatient(patient)}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={true}
            >
                 <span>
                    <a href="javascript:void(0)" onClick={()=>this.props.handlePatientClick(patient.id)}>{patient.id}</a>
                    <span className='clinical-spans' id='patient-attributes' dangerouslySetInnerHTML={{__html:
                        getSpans(fromPairs(patient.clinicalData.map((x: any) => [x.clinicalAttributeId, x.value])), 'lgg_ucsf_2014')}}>
                    </span>
                </span>
            </DefaultTooltip>
        );
    }
}
