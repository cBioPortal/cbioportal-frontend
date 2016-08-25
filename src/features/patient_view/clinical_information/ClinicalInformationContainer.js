import React, { PropTypes as T } from 'react';
import { loadClinicalInformationTableData } from './duck';
import { ClinicalInformationTable } from './ClinicalInformationTable';


export default class ClinicalInformationContainer extends React.Component {

    componentDidMount() {

        const data = [
            [ "OS_MONTHS" , "58" ],
            [ "AGE" ,  "28" ],
            [ "OS_STATUS" , "DECEASED" ],
            [ "GENDER", "Male" ],
            [ "CANCER_TYPE", "Glioma" ]
        ];


        this.context.store.dispatch(loadClinicalInformationTableData(data));

    }

    getStoreState(){

        return this.context.store.getState();

    }

    render() {

        const storeState = this.getStoreState();

        const data = storeState.get('clinical_information').get('table_data');

        if (data === undefined) {
            return <div>Loading ...</div>;
        } else {
            return <div>{ <ClinicalInformationTable data={ data } />  }</div>;
        }

    }
}

// grant access to the store via context
ClinicalInformationContainer.contextTypes = {
    store: React.PropTypes.object.isRequired
};
