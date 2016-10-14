/* eslint-disable */
import React from 'react';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import Spinner from 'react-spinkit';
import { actionCreators, mapStateToProps } from './duck';
import { connect } from 'react-redux';
import ClinicalInformationSamples from './ClinicalInformationSamples';
import PatientHeaderUnconnected from '../patientHeader/PatientHeader';

import './style/local-styles.scss';


export class ClinicalInformationContainerUnconnected extends React.Component {

    componentDidMount(ar1, ar2) { 
        this.props.loadClinicalInformationTableData();
    }

    buildButtonGroups() {
        return (

            <ButtonGroup>
                <Button>Copy</Button>
                <Button>CSV</Button>
                <Button>Show/Hide Columns</Button>
            </ButtonGroup>

        );
    }

    selectTab(tabId) {
        this.props.setTab(tabId);
    }

    buildTabs() {
        return (
            <div>
                <h4>Samples</h4>

                <ClinicalInformationSamples data={this.props.samples} />

                <h4>Patient</h4>
                <ClinicalInformationPatientTable data={this.props.patient.get('clinicalData')} />
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

export const PatientHeader = connect(mapStateToProps,
    actionCreators)(PatientHeaderUnconnected);

export default connect(mapStateToProps, actionCreators)(ClinicalInformationContainerUnconnected);
