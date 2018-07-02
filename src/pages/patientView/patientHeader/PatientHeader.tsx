import * as React from 'react';
import {fromPairs} from 'lodash';
import {OverlayTrigger, Popover} from 'react-bootstrap';

import ClinicalInformationPatientTable from '../clinicalInformation/ClinicalInformationPatientTable';
import {getSpanElements} from '../clinicalInformation/lib/clinicalAttributesUtil.js';
import {placeArrowBottomLeft} from "shared/components/defaultTooltip/DefaultTooltip";
import SampleManager from './../sampleManager';

import styles from './styles.module.scss';
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";

export type IPatientHeaderProps = {
    patient:any;
    studyId: string;
    sampleManager?:SampleManager | null;
    handlePatientClick:any;
    darwinUrl?: string;
}
export default class PatientHeader extends React.Component<IPatientHeaderProps, {}> {
    public render() {

        return (
            <div className={styles.patientHeader}>
                {this.props.patient && this.getOverlayTriggerPatient(this.props.patient, this.props.studyId, this.props.sampleManager)}
                {this.getDarwinUrl(this.props.darwinUrl)}
            </div>
        );

    }

    private getDarwinUrl(darwinUrl: string | null | undefined) {
        // use JSP injected Darwin URL window.frontendConfig.darwinAccessUrl
        // TODO: use internal API service instead, once this exists
        if (darwinUrl !== undefined && darwinUrl !== null && darwinUrl !== '') {
            // add link to darwin
            let darwinImgSrc = require("./images/darwin_logo.png");
            return (<a target='_blank' href={darwinUrl}><img style={{paddingLeft:'5px'}} src={darwinImgSrc} /></a>);
        } else {
            return null;
        }
    }

    private getPopoverPatient(patient: any) {
        return patient && (
            <div key={patient.id} style={{ maxHeight:400, maxWidth:600, overflow:'auto' }}>
                <h5>{ patient.id }</h5>
                <ClinicalInformationPatientTable showFilter={false} showCopyDownload={false} showTitleBar={false} data={patient.clinicalData} />
            </div>
        );
    }

    private getOverlayTriggerPatient(patient: any, studyId:string, sampleManager?: SampleManager|null) {
        const clinicalDataLegacy = fromPairs(patient.clinicalData.map(
            (x: any) => [x.clinicalAttributeId, x.value])
        );
        // get common clinical attributes in all samples
        if (sampleManager) {
            Object.keys(sampleManager.commonClinicalDataLegacyCleanAndDerived).forEach((attr:string) => {
                clinicalDataLegacy[attr] = sampleManager.commonClinicalDataLegacyCleanAndDerived[attr];
            });
        }

        return patient &&
        (
            <DefaultTooltip
                placement='bottomLeft'
                trigger={['hover', 'focus']}
                overlay={this.getPopoverPatient(patient)}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={true}
                onPopupAlign={placeArrowBottomLeft}
            >
                <span className='clinical-spans' id='patient-attributes'>
                    <a href="javascript:void(0)" onClick={()=>this.props.handlePatientClick(patient.id)}>{patient.id}</a>
                    {getSpanElements(clinicalDataLegacy, studyId)}
                </span>
            </DefaultTooltip>
        );
    }
}
