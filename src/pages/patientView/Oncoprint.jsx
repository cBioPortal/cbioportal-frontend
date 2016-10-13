import React from 'react';
import ReactDOM from 'react-dom';
import { createCBioPortalOncoprintWithToolbar } from 'shared/oncoprint/setup';

import 'shared/oncoprint/oncoprint-bundle';

class PatientViewPage extends React.Component {

    shouldComponentUpdate(){
        return false;
    }

    componentDidMount() {
        createCBioPortalOncoprintWithToolbar(".moo");
    }
    render() {
        return (
            <div className="moo"></div>
        );
    }
}


export default PatientViewPage;









