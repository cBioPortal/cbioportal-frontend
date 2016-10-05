import React from 'react';
import ReactDOM from 'react-dom';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import { connect } from 'react-redux';

class PatientViewPage extends React.Component {

    componentDidMount() {
        const mapStateToProps = function mapStateToProps(state) {
            return {
                status: state.get('clinicalInformation').get('status')
            };
        };

        const PatientHeader = connect(mapStateToProps)(PatientHeaderUnconnected);

        // ReactDOM.render(<PatientHeader store={this.props.store} />,
        //     document.getElementById("clinical_div"));
    }
    render() {
        return (
            <ClinicalInformationContainer />
        );
    }
}


export default PatientViewPage;









