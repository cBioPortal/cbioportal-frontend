import React from 'react';
import ReactDOM from 'react-dom';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import PDXTree from './PDXTree';
import Spinner from 'react-spinkit';
import { actionCreators, mapStateToProps } from './duck';
import PurifyComponent from 'shared/components/PurifyComponent';
import { connect } from 'react-redux';
import ClinicalInformationSamples from './ClinicalInformationSamples';
import PatientHeaderUnconnected from '../patientHeader/PatientHeader';

import styles from './style/local.module.scss';


export class ClinicalInformationContainerUnconnected extends React.Component {

    componentDidMount(ar1, ar2) {
        this.props.loadClinicalInformationTableData();
    }

    selectTab(tabId) {
        this.props.setTab(tabId);
    }

    buildTabs() {
        return (
            <div>
                <h4 className={ styles.color }>Samples</h4>

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
