import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Component } from 'react';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from '../../redux/rootReducer';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';

interface IPatientViewPageProps {
    store?: RootState;
}

export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {

    private static mapStateToProps(state: RootState): IPatientHeaderProps {

        let ci = state.clinicalInformation;
        return {
            patient: ci.patient,
            samples: ci.samples,
            status: ci.status,
        };
    }

    public componentDidMount() {
        const PatientHeader = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected);

        // Don't try to render clinical_div_prototype in parent cbioportal
        // project context
        // let clinicalDiv: Element | null = document.getElementById('clinical_div_prototype');
        // if (clinicalDiv) {
        //     ReactDOM.render(
        //         <PatientHeader {...{store: this.props.store}} />,
        //         clinicalDiv
        //     );
        // } //

        let samples = ["string", "TCGA-24-2024-01", "TCGA-24-2024-01 (deliberately elongated id)"];
        let mutationDiv: Element | null = document.getElementById('mutations_div_prototype');
        if (mutationDiv) {
            ReactDOM.render(
                <MutationInformationContainer sampleOrder={samples}
                                             sampleLabels={samples.reduce((map, sample, i) => {map[sample] = i+""; return map;}, {})}
                                            sampleColors={samples.reduce((map, sample) => {map[sample] = (Math.random() > 0.5 ? "black": "red"); return map;}, {})}
                                              sampleTumorType={samples.reduce((map, sample) => {map[sample] = (Math.random() > 0.5 ? "Primary": "Metastasis"); return map;},{})}
                                              sampleCancerType={samples.reduce((map, sample) => {map[sample] = "Cancer Type of " + sample; return map;}, {})}
                                            {...{store: this.props.store}} />,
                mutationDiv
            );
        }

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
                <ClinicalInformationContainer />
            </div>
        );
    }
}
