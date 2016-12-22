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

        var fetchJSON = function(url) {
            return new Promise((resolve, reject) => {
                $.getJSON(url)
                    .done((json) => resolve(json))
                    .fail((xhr, status, err) => reject(status + err.message));
            });
        }
        var itemUrls = [
                "http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=ov_tcga_pub&chromosome=17&sampleIds=TCGA-24-2024-01",
                "https://raw.githubusercontent.com/onursumer/cbioportal-frontend/enhanced-react-table/src/pages/patientView/mutation/mock/mutationData.json"
            ],
            itemPromises = _.map(itemUrls, fetchJSON);
        return Promise.all(itemPromises);

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
