import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import {IPatientHeaderProps} from './patientHeader/PatientHeader';

type TODO = any;

interface IPatientViewPageProps {
    store?: TODO;
}

export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {
    private static mapStateToProps(state: any): IPatientHeaderProps {
        let ci = state.clinicalInformation;
        return {
            patient: ci.patient,
            samples: ci.samples,
            status: ci.status,
        };
    }

    public componentDidMount() {
        const PatientHeader: TODO = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected as TODO);

        ReactDOM.render(
            <PatientHeader store={this.props.store} />,
            document.getElementById('clinical_div') as Element
        );
    }

    public render() {
        return (
            <ClinicalInformationContainer />
        );
    }
}
