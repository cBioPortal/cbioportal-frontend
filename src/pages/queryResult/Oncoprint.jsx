import React from 'react';
import ReactDOM from 'react-dom';

import 'shared/oncoprint/oncoprint-bundle';

import { createCBioPortalOncoprintWithToolbar } from 'shared/oncoprint/setup';


class Oncoprint extends React.Component {

    shouldComponentUpdate(){
        return false;
    }

    componentDidMount() {
        createCBioPortalOncoprintWithToolbar(".oncoprint");
    }
    render() {
        return (
            <div className="oncoprint"></div>
        );
    }
}


export default Oncoprint;









