import React, { PropTypes as T } from 'react';
import { loadClinicalInformationTableData } from './duck';
import { ClinicalInformationTable } from './ClinicalInformationTable';
import { Link } from 'react-router';
import { Tabs, Tab } from 'react-bootstrap';
import { default as $ } from 'jquery';

import styles from './test.scss';

import './test.css';

export default class ClinicalInformationContainer extends React.Component {

    componentDidMount(){

        this.context.store.dispatch(this.fetchData);

    }

    fetchData(dispatch){

        const type = 'clinical_information_table/FETCH';

        const mockData = [
            [ 'OS_MONTHS' , '58' ],
            [ 'AGE' ,  '28' ],
            [ 'OS_STATUS' , 'DECEASED' ],
            [ 'GENDER', 'Male' ],
            [ 'CANCER_TYPE', 'Glioma' ]
        ];

        $.get('/').then(
            data => {
                dispatch({
                    type,
                    status:'success',
                    payload:mockData
                });
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

                return <div>Loading ...</div>;

            case 'complete':

                return <div>{ this.buildTabs(storeState) }</div>;

            case 'error':

                return <div>There was an error.</div>;

            default:
                return null;

        }

    }

    buildTabs(storeState){

        return (

            <Tabs defaultActiveKey={1} id="clinical-information-tabs">
                <Tab eventKey={1} title="Patient"><ClinicalInformationTable data={ storeState.get('clinical_information').get('table_data') } /></Tab>
                <Tab eventKey={2} title="Samples">Tab 2 content</Tab>
            </Tabs>

        );

    }



}

// grant access to the store via context
ClinicalInformationContainer.contextTypes = {
    store: React.PropTypes.object.isRequired
};
