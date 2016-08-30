import React from 'react';
import {ClinicalInformationTable} from './ClinicalInformationTable';
import {Link} from 'react-router';
import {Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {default as $} from 'jquery';
import PDXTree from './PDXTree'
import Spinner from 'react-spinkit';
import {actionTypes} from './duck';

import styles from './test.scss';

//import './test.css';

export default class ClinicalInformationContainer extends React.Component {


    componentDidMount() {

        this.getDispatcher()(this.fetchData);

    }

    // this belongs in a datalayer
    fetchData(dispatch) {

        const type = 'clinical_information_table/FETCH';

        const mockData = {

            patient: [
                ['OS_MONTHS', '58'],
                ['AGE', '28'],
                ['OS_STATUS', 'DECEASED'],
                ['GENDER', 'Male'],
                ['CANCER_TYPE', 'Glioma']
            ],
            samples: [
                ['anti_O_viverrini_IgG', 'Negative'], ['Anatomical Subtype', 'Extrahepatic']
            ],
            nodes: {
                "name": "Top Node",
                "label": "1",
                "children": [
                    {
                        "name": "Bob: Child of Top Node",
                        "label": "1.1",
                        "parent": "Top Node",
                        "children": [
                            {
                                "name": "Son of Bob",
                                "label": "1.1.1",
                                "parent": "Bob: Child of Top Node"
                            },
                            {
                                "name": "Daughter of Bob",
                                "label": "1.1.2",
                                "parent": "Bob: Child of Top Node"
                            }
                        ]
                    },
                    {
                        "name": "Sally: Child of Top Node",
                        "label": "1.2",
                        "parent": "Top Node",
                        "children": [
                            {
                                "name": "Son of Sally",
                                "label": "1.2.1",
                                "parent": "Sally: Child of Top Node"
                            },
                            {
                                "name": "Daughter of Sally",
                                "label": "1.2.2",
                                "parent": "Sally: Child of Top Node"
                            },
                            {
                                "name": "Daughter #2 of Sally",
                                "label": "1.2.3",
                                "parent": "Sally: Child of Top Node",
                                "children": [
                                    {
                                        "name": "Daughter of Daughter #2 of Sally",
                                        "label": "1.2.3.1",
                                        "parent": "Daughter #2 of Sally"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "Dirk: Child of Top Node",
                        "label": "1.3",
                        "parent": "Top Node",
                        "children": [
                            {
                                "name": "Son of Dirk",
                                "label": "1.3.1",
                                "parent": "Dirk: Child of Top Node"
                            },
                        ]
                    }
                ]
            }
        };

        $.get('/').then(
            data => {

                setTimeout(()=> {
                    dispatch({
                        type,
                        status: 'success',
                        payload: mockData
                    });
                }, 6000);


            },
            error => {
                dispatch({
                    type,
                    status: 'error',
                    error
                });
            }
        );

        // tell the store that we've initated a fetch
        return {
            type: 'clinical_information_table/FETCH',
            status: 'fetching'
        };

    }

    getStoreState() {
        return this.context.store.getState();
    }

    getDispatcher() {
        return this.context.store.dispatch;
    }

    render() {

        const storeState = this.getStoreState();

        switch (storeState.getIn(['clinical_information', 'status'])) {

            case 'fetching':

                return <div><Spinner spinnerName="three-bounce"/></div>;

            case 'complete':

                return <div>{ this.buildTabs(storeState) }</div>;

            case 'error':

                return <div>There was an error.</div>;

            default:
                return <div></div>;

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
            payload: tabId
        });

    }

    buildTabs(storeState) {
        return (

            <Tabs defaultActiveKey={1} activeKey={ storeState.get('clinical_information').get('activeTab') } id="clinical-information-tabs" onSelect={ this.selectTab.bind(this) }>
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
                    <PDXTree
                        width={800}
                        height={300}
                        nodes={ storeState.get('clinical_information').get('nodes').toJS() }
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
