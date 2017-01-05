import ClinicalInformationPatientTable from "./ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./ClinicalInformationSamplesTable";
import * as React from "react";
import Spinner from "react-spinkit";
import { ClinicalData } from "shared/api/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import { RequestStatus } from "../../../shared/api/api-types-extended";


export type IClinicalInformationContainerProps = {
    samples?: Array<ClinicalDataBySampleId>;
    patient?: {
        id: string,
        clinicalData: Array<ClinicalData>
    },
    status?:RequestStatus
};

export default class ClinicalInformationContainer extends React.Component<IClinicalInformationContainerProps, {}> {


    public render() {

        switch (this.props.status) {
            case 'pending':
                return <div><Spinner spinnerName="three-bounce" /></div>;

            case 'complete':
                return <div>{ this.buildTabs() }</div>;

            case 'error':
                return <div>There was a loading error. Please try refreshing your browser.</div>;

            default:
                return <div />;
        }
    }

    private buildTabs() {
        return (
            <div>
                <ClinicalInformationPatientTable showTitleBar={true} data={this.props.patient && this.props.patient.clinicalData} />
                <hr />
                <ClinicalInformationSamples samples={this.props.samples} />
            </div>
        );
    }
}
