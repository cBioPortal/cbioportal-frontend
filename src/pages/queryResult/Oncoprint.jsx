import React from 'react';
import ReactDOM from 'react-dom';

import 'shared/oncoprint/oncoprint-bundle';

import { createCBioPortalOncoprintWithToolbar } from 'shared/oncoprint/setup';


class Oncoprint extends React.Component {

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


export default Oncoprint;









