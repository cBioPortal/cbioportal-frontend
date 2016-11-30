import ClinicalInformationPatientTable from "./ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./ClinicalInformationSamplesTable";
import * as React from "react";
import Spinner from "react-spinkit";
import Connector, {ClinicalInformationData} from "./Connector";

type TODO = any;

let _ClinicalInformationData:ClinicalInformationData = null as any;

export interface IClinicalInformationContainerProps {
    status?: typeof _ClinicalInformationData.status;
    patient?: typeof _ClinicalInformationData.patient;
    samples?: typeof _ClinicalInformationData.samples;
    nodes?: TODO;//PDXNode[];
    loadClinicalInformationTableData?: () => void;
    setTab?: (activeTab:number) => void;
    store?: any;
};

@Connector.decorator
export default class ClinicalInformationContainer extends React.Component<IClinicalInformationContainerProps, {}> {

    componentDidMount() {
        if (this.props.loadClinicalInformationTableData)
            this.props.loadClinicalInformationTableData();
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

    public render() {
        switch (this.props.status) {
            case 'fetching':
                return <div><Spinner spinnerName="three-bounce" /></div>;

            case 'complete':
                return <div>{ this.buildTabs() }</div>;

            case 'error':
                return <div>There was a loading error. Please try refreshing your browser.</div>;

            default:
                return <div />;
        }
    }
}
