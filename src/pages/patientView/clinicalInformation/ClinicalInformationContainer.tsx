import ClinicalInformationPatientTable from "./ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./ClinicalInformationSamplesTable";
import * as React from "react";
import Spinner from "react-spinkit";
import { Alert } from 'react-bootstrap'
import Connector, {ClinicalInformationData} from "./Connector";
import queryString from 'query-string';

type TODO = any;

export type IClinicalInformationContainerProps = {
    nodes?: TODO;//PDXNode[];
    loadClinicalInformationTableData?: () => void;
    setTab?: (activeTab:number) => void;
    store?: any;
} & PartialPick<ClinicalInformationData, 'status' | 'patient' | 'samples'>;

const qs = queryString.parse(location.search);

const studyId: string = qs.cancer_study_id;
const patientId: string = qs.case_id;


@Connector.decorator
export default class ClinicalInformationContainer extends React.Component<IClinicalInformationContainerProps, {}> {

    componentDidMount() {
        if (this.props.loadClinicalInformationTableData)
            this.props.loadClinicalInformationTableData();
    }

    public render() {
        switch (this.props.status) {
            case 'fetching':
                return <div><Spinner spinnerName="three-bounce" /></div>;

            case 'complete':
                return <div>{ this.buildTabs() }</div>;

            case 'error':
                return <div>There was a loading error. Please try refreshing your browser.</div>;

            case 'not found':
                return (
                      <Alert bsStyle="danger">
                        <div>No patient found with case id "{patientId}" and study id "{studyId}" </div>
                      </Alert>
                )

            default:
                return <div />;
        }
    }

    private buildTabs() {
        return (
            <div>
                <ClinicalInformationPatientTable showTitleBar={true} data={this.props.patient && this.props.patient.clinicalData} />
                <hr />
                <ClinicalInformationSamples samples={this.props.samples} />
            </div>
        );
    }
}
