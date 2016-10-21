import * as Immutable from 'immutable';
import OrderedMap = Immutable.OrderedMap;
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
    private static mapStateToProps(state: OrderedMap<string, any>): IPatientHeaderProps {
        let ci = state.get('clinicalInformation');
        return {
            patient: ci.get('patient'),
            samples: ci.get('samples'),
            status: ci.get('status'),
        };
    }

    public componentDidMount() {
        const PatientHeader: TODO = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected as TODO);

        ReactDOM.render(
            <PatientHeader store={this.props.store} />,
            document.getElementById('clinical_div') as Element
        );
        // ReactDOM.render(<div><Example /><Example /></div>, document.getElementById('clinical_div') as Element);

    }

    public render() {
        return (
            <ClinicalInformationContainer />
        );
    }
}
