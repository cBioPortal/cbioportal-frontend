import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from "../../redux/rootReducer";

interface IPatientViewPageProps {
    store?: RootState;
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
        const PatientHeader = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected);

        // Don't try to render clinical_div_prototype in parent cbioportal
        // project context
        let clinicalDiv: Element | null = document.getElementById('clinical_div_prototype');
        if (clinicalDiv) {
            ReactDOM.render(
                <PatientHeader {...{store: this.props.store}} />,
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
