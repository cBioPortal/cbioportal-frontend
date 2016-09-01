import React from 'react';
import {ClinicalInformationTable} from './ClinicalInformationTable';
import {Link} from 'react-router';
import {Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {default as $} from 'jquery';
import PDXTree from './PDXTree';
import Spinner from 'react-spinkit';
import Immutable from 'immutable';
import { actionTypes, actionCreators } from './duck';

import {mockData} from './mockData';
import getClinicalInformationData from './dataLayer';
import PurifyComponent from 'shared/PurifyComponent';
import { connect } from 'react-redux';

import './style/local-styles.scss';


export class ClinicalInformationContainerUnconnected extends React.Component {

    componentDidMount() {

        //this.props.loadClinicalInformationTableData();
        this.fetchData();
    }

    // this belongs in a datalayer
    fetchData(dispatch) {
        // IN PRACTICE, WE SHOULD MOVE NETWORK CALLS TO A DATA LAYER WHICH EXPOSES PROMISES
        // TO COMPONENTS

        getClinicalInformationData().then(
            function(){

                this.props.dispatch({
                    type: actionTypes.FETCH,
                    status: 'success',
                    payload: mockData,
                });
            }.bind(this)
        );

        return {
            type: 'clinical_information_table/FETCH',
            status: 'fetching',
        };
    }

    getClinicalInformationData() {
        return getClinicalInformationData();
    }

    render() {

        switch (this.props.status) {

            case 'fetching':

                return <div><Spinner spinnerName="three-bounce"/></div>;

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
        this.props.dispatch({
            type: actionTypes.SET_TAB,
            payload: tabId,
        });
    }

    buildTabs() {

        return (

            <Tabs defaultActiveKey={1} animation={false}
                  activeKey={this.props.activeTab} id="clinical-information-tabs"
                  onSelect={this.selectTab.bind(this)}>
                <Tab eventKey={1} title="Patient">
                    { this.buildButtonGroups() }
                    <ClinicalInformationTable
                        data={this.props.patient}
                        title1="Attribute" title2="Value"
                    />
                </Tab>
                <Tab eventKey={2} title="Samples">
                    { this.buildButtonGroups() }
                    <ClinicalInformationTable
                        data={this.props.samples}
                        title1="Attribute" title2="1202"
                    />

                    <PurifyComponent
                        component={PDXTree}
                        width={800}
                        height={300}
                        data={ this.props.nodes }
                    />

                </Tab>
            </Tabs>

        );
    }


}

const mapStateToProps = function mapStateToProps(state) {
    return {
        samples:state.get('clinical_information').get('samples'),
        status:state.get('clinical_information').get('status'),
        activeTab:state.get('clinical_information').get('activeTab'),
        patient:state.get('clinical_information').get('patient'),
        nodes:state.get('clinical_information').get('nodes')
    };
}

const mapDispatchToProps = {

    fetchData:function(){
        return {
            type: 'clinical_information_table/FETCH',
            status: 'fetching',
        };
    }

};

export default connect(mapStateToProps)(ClinicalInformationContainerUnconnected);

