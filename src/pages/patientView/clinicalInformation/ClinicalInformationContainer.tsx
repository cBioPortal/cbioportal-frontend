import { ClinicalDataBySampleId } from './getClinicalInformationData';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import ClinicalInformationSamples from './ClinicalInformationSamplesTable';
import * as React from 'react';
import Spinner from 'react-spinkit';
import { actionCreators, mapStateToProps } from './duck';
import { connect } from 'react-redux';

type TODO = any;

interface IClinicalInformationContainerProps {
    status: TODO;
    patient: TODO;
    samples: Array<ClinicalDataBySampleId>;
    loadClinicalInformationTableData: void;
    nodes:any;
    setTab: void;
}

export class ClinicalInformationContainerUnconnected extends React.Component<IClinicalInformationContainerProps, {}> {

    private componentDidMount() {
        this.props.loadClinicalInformationTableData();
    }

    private buildTabs() {
        return (
            <div>

                <ClinicalInformationPatientTable showTitleBar={true} data={this.props.patient.clinicalData} />

                <ClinicalInformationSamples samples={this.props.samples} />

            </div>
        );
    }

    public render() {

        switch (this.props.status) {

            case 'fetching':

                return <div><Spinner spinnerName="three-bounce" /></div>;

            case 'complete':

                return <div>{ this.buildTabs() }</div>;

            case 'error':

                return <div>There was an error.</div>;

            default:

                return <div />;

        }
    }

}

export default connect(mapStateToProps, actionCreators)(ClinicalInformationContainerUnconnected);
