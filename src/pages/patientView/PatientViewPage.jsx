import React from 'react';
import ReactDOM from 'react-dom';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import { connect } from 'react-redux';

class PatientViewPage extends React.Component {

    componentDidMount() {
        const mapStateToProps = function mapStateToProps(state) {
            return {
                samples: state.get('clinicalInformation').get('samples'),
                status: state.get('clinicalInformation').get('status'),
                patient: state.get('clinicalInformation').get('patient'),
            };
        };

        const PatientHeader = connect(mapStateToProps)(PatientHeaderUnconnected);

        // eslint-disable-next-line
        ReactDOM.render(<PatientHeader store={this.props.store} />,
          document.getElementById('clinical_div'));
        // ReactDOM.render(<div><Example /><Example /></div>, document.getElementById("clinical_div"));

    }
    render() {
        return (
            <ClinicalInformationContainer />
        );
    }
}


export default PatientViewPage;

