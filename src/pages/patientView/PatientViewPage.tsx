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

        // Don't try to render clinical_div_prototype in parent cbioportal
        // project context
        let clinicalDiv: Element | null = document.getElementById('clinical_div_prototype');
        if (clinicalDiv) {
            ReactDOM.render(
                <PatientHeader store={this.props.store} />,
                clinicalDiv
            );
        }
    }

    public render() {
        return (
            <ClinicalInformationContainer />
        );
    }
}
