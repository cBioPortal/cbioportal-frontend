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
import CBioPortalAPI from "../../shared/api/CBioPortalAPI";
import renderIf from 'render-if';

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
export default class PatientViewPage extends React.Component<IPatientViewPageProps, { mutationData:any }> {

    // private static mapStateToProps(state: RootState): IPatientHeaderProps {
    //
    //     let ci = state.clinicalInformation;
    //     return {
    //         patient: ci.patient,
    //         samples: ci.samples,
    //         status: ci.status,
    //     };
    // }

    constructor(){

        super();

        this.state = {
            mutationData: undefined
        };

    }

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

        const tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);

        tsClient.fetchMutationsInGeneticProfileUsingPOST({ geneticProfileId:'lgg_ucsf_2014_mutations', sampleIds:["P04_Pri", "P04_Rec1", "P04_Rec2", "P04_Rec3"] })
            .then((mutationData)=>{

                this.setState({ mutationData: mutationData });

                // let mutationDiv: Element | null = document.getElementById('mutations_div_prototype');
                // if (mutationDiv) {
                //     ReactDOM.render(
                //         <MutationInformationContainer
                //             mutations={mutationData}
                //             sampleOrder={mockData.order}
                //             sampleLabels={mockData.labels}
                //             sampleColors={mockData.colors}
                //             sampleTumorType={mockData.tumorType}
                //             sampleCancerType={mockData.cancerType}
                //             {...{store: this.props.store}}
                //         />,
                //         mutationDiv
                //     );
                // }

            });



        
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

                { renderIf(this.state.mutationData)(
                    < MutationInformationContainer
                        mutations={this.state.mutationData}
                        sampleOrder={mockData.order}
                        sampleLabels={mockData.labels}
                        sampleColors={mockData.colors}
                        sampleTumorType={mockData.tumorType}
                        sampleCancerType={mockData.cancerType}
                        {...{store: this.props.store}}
                    />
                )
                }

                <ClinicalInformationContainer status={ this.props.clinicalDataStatus } patient={this.props.patient} samples={this.props.samples} />

            </div>
        );
    }
}
