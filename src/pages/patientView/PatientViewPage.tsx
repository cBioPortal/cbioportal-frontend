import * as React from 'react';
import * as _ from 'lodash';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Component } from 'react';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from '../../redux/rootReducer';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';
import renderIf from 'render-if';
import CBioPortalAPI from "shared/api/CBioPortalAPI";
import queryString from "query-string";

interface IPatientViewPageProps {
    store?: RootState;
}

export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {

    constructor(){

        super();

        this.state = { genomicOverviewData: { status: 'loading', data:null }  };

    }

    private static mapStateToProps(state: any): IPatientHeaderProps {

        let ci = state.clinicalInformation;
        return {
            patient: ci.patient,
            samples: ci.samples,
            status: ci.status,
        };
    }


    fetchData() {

        //const qs = queryString.parse(location.search);
        //const studyId: string = qs.cancer_study_id;
        //const patientId: string = qs.case_id;
        const studyId: string = "ov_tcga_pub";
        const sampleIds: Array<any> = ["TCGA-24-2035-01"];

        const tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);
        let mutationDataPromise = tsClient.fetchMutationsInGeneticProfileUsingPOST({geneticProfileId: studyId + "_mutations", sampleIds: sampleIds, projection: "DETAILED"});
        let p = Promise.resolve(
            $.get("http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=ov_tcga_pub&chromosome=17&sampleIds=TCGA-24-2035-01")
        );
        return Promise.all([mutationDataPromise, p]);

    }

    public componentDidMount() {
        const PatientHeader = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected);

        // Don't try to render clinical_div_prototype in parent cbioportal
        // project context
        let clinicalDiv: Element | null = document.getElementById('clinical_div_prototype');
        if (clinicalDiv) {
            ReactDOM.render(
                <PatientHeader {...{store: this.props.store}} />,
                clinicalDiv
            );
        }


        this.exposeComponentRenderersToParentScript();


        this.fetchData().then((apiResult)=>{

            this.setState({ 'genomicOverviewData': { status:'complete', data:apiResult }});

        });

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

                {
                    renderIf(this.state.genomicOverviewData.status==='complete')(
                        <GenomicOverview data={this.state.genomicOverviewData.data } />
                    )
                }

            </div>
        );
    }
}
