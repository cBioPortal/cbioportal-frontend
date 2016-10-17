import React from 'react';

import 'shared/oncoprint/oncoprint-bundle';

import { createCBioPortalOncoprintWithToolbar } from 'shared/oncoprint/setup';

export default class SampleLabelSVG extends React.Component {
    render() {

         return (<div><div className="oncoprint">fdfas</div></div>);
    }

    componentDidMount(){


        this.oncoprint = createCBioPortalOncoprintWithToolbar('.oncoprint', '#oncoprint #oncoprint-diagram-toolbar-buttons');
        console.log("yup", $(".oncoprint").text());



    }
}
