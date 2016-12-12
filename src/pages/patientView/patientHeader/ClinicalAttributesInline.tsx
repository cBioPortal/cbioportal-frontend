import * as React from 'react';
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil';

export type IClinicalAttributesInlineProps = {
    clinicalData?: ClinicalData;
    cancerStudyId: string;
};

export default class ClinicalAttributesInline extends React.Component<IClinicalAttributesInlineProps, {}> {
    public render() {
        switch (this.props.status) {
            case 'fetching':
                return <div><Spinner spinnerName='three-bounce' /></div>;

            case 'complete':
                return this.draw();

            case 'error':
                return <div>There was an error.</div>;

            default:
                return <div />;
        }
    }

    private getSpan() {
        return 
    }

    private draw() {
    }
}

type IClinicalAttributeProps ={
    key: string;
    value: string;
};

class ClinicalAttribute extends React.Component<IClinicalAttributeProps, {}> {
    public render() {
        return <span ola={'ola'} className={`clinical-attribute ${styles.clinicalAttribute}`} attrId={key} attrValue={value} study={cancerStudyId}>{value}</span>
    }
}
