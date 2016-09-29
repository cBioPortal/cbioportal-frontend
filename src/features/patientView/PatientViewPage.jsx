import React from 'react';
import ReactDOM from 'react-dom';
import {Button, Overlay, Tooltip, Popover} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import { connect } from 'react-redux';

const Example = React.createClass({
  getInitialState() {
    return { show: false };
  },

  toggle() {
    this.setState({ show: !this.state.show });
  },

  show() {
    this.setState({ show: true });
  },

  hide() {
    this.setState({ show: false });
  },

  render() {
    const sharedProps = {
      show: this.state.show,
      container: this,
      target: () => ReactDOM.findDOMNode(this.refs.target)
    };

    return (
      <div style={{ height: 100, paddingLeft: 150, position: 'relative' }}>
        <Button onMouseOver={this.show} onMouseOut={this.hide} ref="target" onClick={this.toggle}>
          Click me!
        </Button>

        <Overlay {...sharedProps} placement="bottom">
          <Tooltip onMouseOver={this.show} onMouseOut={this.hide} id="overload-bottom">Tooltip overload!</Tooltip>
        </Overlay>
      </div>
    );
  }
});

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
            <ClinicalInformationContainer />
        );
    }
}

export default PatientViewPage;
