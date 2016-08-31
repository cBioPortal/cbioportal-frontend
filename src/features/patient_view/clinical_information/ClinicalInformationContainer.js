import React from 'react';
import {ClinicalInformationTable} from './ClinicalInformationTable';
import {Link} from 'react-router';
import {Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {default as $} from 'jquery';
import PDXTree from './PDXTree';
import Spinner from 'react-spinkit';
import Immutable from 'immutable';
import {actionTypes} from './duck';
import {mockData} from './mockData';
import getClinicalInformationData from './dataLayer';
import PurifyComponent from 'shared/PurifyComponent';

import './style/local-styles.scss';

export default class ClinicalInformationContainer extends React.Component {

    componentDidMount() {

        const dispatch = this.getDispatcher();

        dispatch(this.fetchData);
    }

    // this belongs in a datalayer
    fetchData(dispatch) {
        // IN PRACTICE, WE SHOULD MOVE NETWORK CALLS TO A DATA LAYER WHICH EXPOSES PROMISES
        // TO COMPONENTS

        getClinicalInformationData().then(
            ()=> {
                setTimeout(() => {
                    dispatch({
                        type: actionTypes.FETCH,
                        status: 'success',
                        payload: mockData,
                    });
                }, 3000);

                setTimeout(() => {
                    console.log("another dispatch");

                    mockData.nodes.children = [];

                    dispatch({
                        type: actionTypes.FETCH,
                        status: 'success',
                        payload: mockData,
                    });
                }, 15000);


            }
        );

        return {
            type: 'clinical_information_table/FETCH',
            status: 'fetching',
        };
    }

    getClinicalInformationData() {
        return getClinicalInformationData();
    }

    getStoreState() {
        return this.context.store.getState();
    }

    getDispatcher() {
        return this.context.store.dispatch;
    }

    render() {
        const storeState = this.getStoreState();

        console.log("container render");

        switch (storeState.getIn(['clinical_information', 'status'])) {

            case 'fetching':

                return <div><Spinner spinnerName="three-bounce"/></div>;

            case 'complete':

                return <div>{ this.buildTabs(storeState) }</div>;

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
        this.getDispatcher()({
            type: actionTypes.SET_TAB,
            payload: tabId,
        });
    }

    buildTabs(storeState) {

        return (

            <Tabs defaultActiveKey={1} animation={false}
                  activeKey={storeState.get('clinical_information').get('activeTab')} id="clinical-information-tabs"
                  onSelect={this.selectTab.bind(this)}>
                <Tab eventKey={1} title="Patient">
                    { this.buildButtonGroups() }
                    <ClinicalInformationTable
                        data={storeState.get('clinical_information').get('patient')}
                        title1="Attribute" title2="Value"
                    />
                </Tab>
                <Tab eventKey={2} title="Samples">
                    { this.buildButtonGroups() }
                    <ClinicalInformationTable
                        data={storeState.get('clinical_information').get('samples')}
                        title1="Attribute" title2="1202"
                    />

                    <PurifyComponent
                        component={PDXTree}
                        width={800}
                        height={300}
                        data={ storeState.get('clinical_information').get('nodes') }
                    />

                </Tab>
            </Tabs>

        );
    }


}

// grant access to the store via context
ClinicalInformationContainer.contextTypes = {
    store: React.PropTypes.object.isRequired,
};
