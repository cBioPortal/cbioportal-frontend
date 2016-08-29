import React from 'react';
import { ClinicalInformationTable } from './ClinicalInformationTable';
import { Link } from 'react-router';
import { Tabs, Tab, ButtonGroup, Button } from 'react-bootstrap';
import { default as $ } from 'jquery';
import Spinner from 'react-spinkit';

import styles from './test.scss';

import './test.css';

export default class ClinicalInformationContainer extends React.Component {

    componentDidMount(){

        this.context.store.dispatch(this.fetchData);

    }

    // this belongs in a datalayer
    fetchData(dispatch){

        const type = 'clinical_information_table/FETCH';

        const mockData = {

            patient:[
                [ 'OS_MONTHS' , '58' ],
                [ 'AGE' ,  '28' ],
                [ 'OS_STATUS' , 'DECEASED' ],
                [ 'GENDER', 'Male' ],
                [ 'CANCER_TYPE', 'Glioma' ]
            ],
            samples:[
                [ 'anti_O_viverrini_IgG' , 'Negative' ], [ 'Anatomical Subtype' ,  'Extrahepatic' ]
            ]

        };

        $.get('/').then(
            data => {

                setTimeout(()=>{
                    dispatch({
                        type,
                        status:'success',
                        payload:mockData
                    });
                },3000);


            },
            error => {
                dispatch({
                    type,
                    status:'error',
                    error
                });
            }
        );

        // tell the store that we've initated a fetch
        return {
            type:'clinicalInformationTable/FETCH',
            status:'fetching'
        };

    }

    getStoreState(){

        return this.context.store.getState();

    }

    render() {

        const storeState = this.getStoreState();

        switch (storeState.getIn(['clinical_information','status'])) {

        case 'fetching':

            return <div><Spinner spinnerName="three-bounce" /></div>;

        case 'complete':

            return <div>{ this.buildTabs(storeState) }</div>;

        case 'error':

            return <div>There was an error.</div>;

        default:
            return null;

        }

    }

    buildButtonGroups(){

        return (

            <ButtonGroup>
                <Button>Copy</Button>
                <Button>CSV</Button>
                <Button>Show/Hide Columns</Button>
            </ButtonGroup>

        );

    }

    buildTabs(storeState){

        return (

            <Tabs defaultActiveKey={1} id="clinical-information-tabs">
                <Tab eventKey={1} title="Patient">
                    { this.buildButtonGroups() }
                    <ClinicalInformationTable
                        data={ storeState.get('clinical_information').get('patient') }
                        title1="Attribute" title2="Value"
                    />
                </Tab>
                <Tab eventKey={2} title="Samples">
                    { this.buildButtonGroups() }
                    <ClinicalInformationTable
                        data={ storeState.get('clinical_information').get('samples') }
                        title1="Attribute" title2="1202"
                    />

                </Tab>
            </Tabs>

        );

    }



}

// grant access to the store via context
ClinicalInformationContainer.contextTypes = {
    store: React.PropTypes.object.isRequired
};
