import * as React from 'react';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import Spinner from 'react-spinkit';
import { actionCreators, mapStateToProps } from './duck';
import { connect } from 'react-redux';
import ClinicalInformationSamples from './ClinicalInformationSamplesTable';
import PatientHeaderUnconnected from '../patientHeader/PatientHeader';
import {ClinicalDataBySampleId} from "./getClinicalInformationData";

type TODO = any;

interface IClinicalInformationContainerProps {
    status: TODO;
    patient: TODO;
    samples: Array<ClinicalDataBySampleId>;
    loadClinicalInformationTableData: void;
    nodes:any;
    setTab: void;
}

export class ClinicalInformationContainerUnconnected extends React.Component<IClinicalInformationContainerProps, {}> {

    componentDidMount() {
        this.props.loadClinicalInformationTableData();
    }

    buildTabs() {
        return (
            <div>
                <h3 style={{ color: 'black' }}>Patient</h3>
                <p style={{ margin: '20px' }}>
                    <ClinicalInformationPatientTable data={this.props.patient.clinicalData} />
                </p>

                <h3 style={{ color: 'black' }}>Samples</h3>
                <p style={{ margin: '20px' }}>
                    <ClinicalInformationSamples samples={this.props.samples} />
                </p>
            </div>
        );
    }

    render() {

        switch (this.props.status) {

            case 'fetching':

                return <div><Spinner spinnerName="three-bounce" /></div>;

            case 'complete':

                return <div>{ this.buildTabs() }</div>;

            case 'error':

                return <div>There was an error.</div>;

            default:

                return <div />;

        }
    }

}

export default connect(mapStateToProps, actionCreators)(ClinicalInformationContainerUnconnected);
