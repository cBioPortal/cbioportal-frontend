import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Button, Overlay, Tooltip, Popover} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import { connect } from 'react-redux';
import * as Immutable from "immutable";
import OrderedMap = Immutable.OrderedMap;
import {PatientHeaderProps} from "./patientHeader/PatientHeader";

type TODO = any;

interface PatientViewPageProps
{
    store?: TODO;
}

export default class PatientViewPage extends React.Component<PatientViewPageProps, {}>
{
    static mapStateToProps(state:OrderedMap<string, any>):PatientHeaderProps
    {
        let ci = state.get('clinicalInformation');
        return {
            samples: ci.get('samples'),
            status: ci.get('status'),
            patient: ci.get('patient'),
        };
    }

    componentDidMount()
    {
        const PatientHeader:TODO = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected as TODO);

        ReactDOM.render(
            <PatientHeader store={this.props.store} />,
            document.getElementById("clinical_div") as Element
        );
        //ReactDOM.render(<div><Example /><Example /></div>, document.getElementById("clinical_div") as Element);

    }

    render()
    {
        return (
            <ClinicalInformationContainer />
        );
    }
}
