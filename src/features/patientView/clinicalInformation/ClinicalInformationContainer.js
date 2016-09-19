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

            <Tabs defaultActiveKey={1} animation={false}
              activeKey={this.props.activeTab} id="clinical-information-tabs"
              onSelect={this.selectTab.bind(this)}
            >
                <Tab eventKey={2} title="Patient">
                    { this.buildButtonGroups() }
                    <ClinicalInformationPatientTable data={this.props.patient.get('clinicalData')} />
                </Tab>
                <Tab eventKey={1} title="Samples" style={{ height:500 }}>


                    <FixedExample data={this.props.samples} />

                    <div style={{ display:'block' }}>
                    <ClinicalInformationSamplesTable
                      data={this.props.samples}
                    />




                    <h4 style={{ color: 'black' }}>PDX Hierarchy</h4>
                    <PurifyComponent
                      component={PDXTree}
                      width={400}
                      height={300}
                      data={this.props.nodes}
                    />
                    </div>
                </Tab>
            </Tabs>

        );
    }


}



export const PatientHeader = connect(mapStateToProps,
                            actionCreators)(PatientHeaderUnconnected);

export default connect(mapStateToProps, actionCreators)(ClinicalInformationContainerUnconnected);
