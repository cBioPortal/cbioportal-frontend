import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Component } from 'react';
import * as _ from 'lodash';
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
import { default as CBioPortalAPI, Mutation }  from "../../shared/api/CBioPortalAPI";
import renderIf from 'render-if';
import queryString from "query-string";
import {mockData as vafPlotMockData, mockColors as vafPlotMockColors, mockOrder as vafPlotMockOrder, mockLabels as vafPlotMockLabels} from './vafPlot/mockData';
import {ThumbnailExpandVAFPlot} from './vafPlot/ThumbnailExpandVAFPlot';

export interface IPatientViewPageProps {
    store?: RootState;
    samples?: Array<ClinicalDataBySampleId>;
    loadClinicalInformationTableData?: () => Promise<any>;
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

    private studyId:string;

    private patientId:string;

    private geneticProfileId:string;

    constructor(){

        super();

        this.state = {
            mutationData: undefined
        };

        //TODO: this should be done by a module so that it can be reused on other pages
        const qs = queryString.parse((window as any).location.search);
        this.studyId = qs.cancer_study_id;
        this.patientId = qs.case_id;
        this.geneticProfileId = `${this.studyId}_mutations`;

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



        this.props.loadClinicalInformationTableData && this.props.loadClinicalInformationTableData().then(() => {

            if (this.props.samples) {
                let sampleIds: Array<string> = this.props.samples.map((item: ClinicalDataBySampleId)=>item.id);

                tsClient.fetchMutationsInGeneticProfileUsingPOST({
                    projection: "DETAILED",
                    geneticProfileId: this.geneticProfileId,
                    sampleIds: sampleIds
                })
                    .then((mutationData: Array<Mutation>) => {
                        this.setState({mutationData: mutationData});
                    });
            }

        });

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
                    />
                )
                }

                <ClinicalInformationContainer status={ this.props.clinicalDataStatus } patient={this.props.patient} samples={this.props.samples} />
                <ThumbnailExpandVAFPlot
                    data={vafPlotMockData}
                    colors={vafPlotMockColors}
                    labels={vafPlotMockLabels}
                    order={vafPlotMockOrder}
                    overlayPlacement="right"
                />
            </div>
        );
    }
}
