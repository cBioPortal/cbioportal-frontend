import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Component } from 'react';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from '../../redux/rootReducer';
import exposeComponentRenderer from '../../shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';
import mockData from './mock/sampleData.json';
import Connector, { ClinicalInformationData } from "./Connector";
import { ClinicalData } from "shared/api/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../shared/api/api-types-extended";
import { RequestStatus } from "../../shared/api/api-types-extended";


export interface IPatientViewPageProps {
    store?: RootState;
    samples?: Array<ClinicalDataBySampleId>;
    loadClinicalInformationTableData?: () => void;
    patient?: {
        id: string,
        clinicalData: Array<ClinicalData>
    };
    clinicalDataStatus?: RequestStatus;
}

@Connector.decorator
export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {

    // private static mapStateToProps(state: RootState): IPatientHeaderProps {
    //
    //     let ci = state.clinicalInformation;
    //     return {
    //         patient: ci.patient,
    //         samples: ci.samples,
    //         status: ci.status,
    //     };
    // }

    public componentDidMount() {
        // const PatientHeader = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected);
        //
        // // Don't try to render clinical_div_prototype in parent cbioportal
        // // project context
        // // let clinicalDiv: Element | null = document.getElementById('clinical_div_prototype');
        // // if (clinicalDiv) {
        // //     ReactDOM.render(
        // //         <PatientHeader {...{store: this.props.store}} />,
        // //         clinicalDiv
        // //     );
        // // } //
        

        let mutationDiv: Element | null = document.getElementById('mutations_div_prototype');
        if (mutationDiv) {
            ReactDOM.render(
                <MutationInformationContainer
                    sampleOrder={mockData.order}
                    sampleLabels={mockData.labels}
                    sampleColors={mockData.colors}
                    sampleTumorType={mockData.tumorType}
                    sampleCancerType={mockData.cancerType}
                    {...{store: this.props.store}}
                />,
                mutationDiv
            );
        }
        
        this.props.loadClinicalInformationTableData && this.props.loadClinicalInformationTableData();

        this.exposeComponentRenderersToParentScript();


    }

    // this gives the parent (legacy) cbioportal code control to mount
    // these components whenever and wherever it wants
    exposeComponentRenderersToParentScript() {

        exposeComponentRenderer('renderClinicalInformationContainer', ClinicalInformationContainer,
            { store:this.props.store }
        );

        exposeComponentRenderer('renderGenomicOverview', GenomicOverview);

    }

    public render() {
        return (
            <div>
                <ClinicalInformationContainer status={ this.props.clinicalDataStatus } patient={this.props.patient} samples={this.props.samples} />
            </div>
        );
    }
}
