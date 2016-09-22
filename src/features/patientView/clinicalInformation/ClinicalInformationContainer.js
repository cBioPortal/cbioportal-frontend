import React from 'react';
import ReactDOM from 'react-dom';
import ClinicalInformationSamplesTable from './ClinicalInformationSamplesTable';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import { Link } from 'react-router';
import { Tabs, Tab, ButtonGroup, Button } from 'react-bootstrap';
import { default as $ } from 'jquery';
import PDXTree from './PDXTree';
import Spinner from 'react-spinkit';
import Immutable from 'immutable';
import { actionTypes, actionCreators, mapStateToProps } from './duck';
import PurifyComponent from 'shared/components/PurifyComponent';
import { connect } from 'react-redux';
import { getSamples } from 'shared/api/oldAPIWrapper';
import FixedExample from './FixedDataTableExample';
import PatientHeaderUnconnected from '../patientHeader/PatientHeader';
import ReactZeroClipboard from 'react-zeroclipboard';

import './style/local-styles.scss';


export class ClinicalInformationContainerUnconnected extends React.Component {

    componentDidMount() {
        this.props.loadClinicalInformationTableData();
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
        <FixedExample data={this.props.samples} />

        <h4>Clinical Data</h4>
            <ClinicalInformationPatientTable data={this.props.patient.get('clinicalData')} />

            </div>

    //     <ClinicalInformationPatientTable data={this.props.patient.get('clinicalData')} />
    //
    //         <Tabs defaultActiveKey={1} animation={false}
    //           activeKey={this.props.activeTab} id="clinical-information-tabs"
    //           onSelect={this.selectTab.bind(this)}
    //         >
    //             <Tab eventKey={2} title="Patient">
    //                 { this.buildButtonGroups() }
    //                 <ClinicalInformationPatientTable data={this.props.patient.get('clinicalData')} />
    //             </Tab>
    //             <Tab eventKey={1} title="Samples">
    //
    //         <ClinicalInformationSamplesTable
    //     data={this.props.samples}
    // />
    // <ClinicalInformationPatientTable data={this.props.patient.get('clinicalData')} />
    //
    //                 <FixedExample data={this.props.samples} />
    //
    //                 <div style={{ display:'none' }}>
    //
    //                 </div>
    //             </Tab>
    //         </Tabs>

        );
    }


}


export const PatientHeader = connect(mapStateToProps,
                            actionCreators)(PatientHeaderUnconnected);

export default connect(mapStateToProps, actionCreators)(ClinicalInformationContainerUnconnected);
