import React from 'react';
import ReactDOM from 'react-dom';
import {Button, Overlay, Tooltip, Popover} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import Oncoprint from './Oncoprint';
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

        ReactDOM.render(<PatientHeader store={this.props.store} />,
          document.getElementById("clinical_div"));
        //ReactDOM.render(<div><Example /><Example /></div>, document.getElementById("clinical_div"));

    }
    render() {
        return (
            <Oncoprint />
        );
    }
}


export default PatientViewPage;









