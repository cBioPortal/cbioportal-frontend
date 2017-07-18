import * as React from 'react';
import client from '../../api/cbioportalClientInstance';
import {remoteData} from "../../api/remoteData";
import BarGraph from "../barGraph/BarGraph";
import {observer} from "mobx-react";
import Testimonials from "../testimonials/Testimonials";
import {ThreeBounce} from 'better-react-spinkit';
import AppConfig from "appConfig";

export class StudyStore {

    readonly data = remoteData({
        invoke: () => {
            return client.getAllStudiesUsingGET({projection: "DETAILED"});

        }
    });
}

@observer
export default class RightBar extends React.Component<{}, {}> {

    public studyStore = new StudyStore();

    static getExampleSection() {
        const title:string = 'Example Queries';
        const defaultExamples:JSX.Element =
            <div className="rightBarSection exampleQueries">
                <h3>{title}</h3>
                <ul>
                    <li>
                        <a href="index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit">RAS/RAF alterations in colorectal cancer</a>
                    </li>
                    <li>
                        <a href="index.do?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&case_ids=&gene_list=BRCA1+BRCA2&gene_set_choice=user-defined-list&Action=Submit#mutation_details">BRCA1 and BRCA2 mutations in ovarian cancer</a>
                    </li>
                    <li>
                        <a href="index.do?cancer_study_list=ucec_tcga_pub&cancer_study_id=ucec_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ucec_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=ucec_tcga_pub_sequenced&case_ids=&gene_set_choice=user-defined-list&gene_list=POLE%3A+MUT+%3D+P286+MUT+%3D+V411+MUT+%3D+L424+MUT+%3D+S297F&clinical_param_selection=null&tab_index=tab_visualize&Action=Submit">POLE hotspot mutations in endometrial cancer</a>
                    </li>
                    <li>
                        <a href="index.do?case_set_id=gbm_tcga_pub_sequenced&tab_index=tab_visualize&Action=Submit&genetic_profile_ids=gbm_tcga_pub_mutations&genetic_profile_ids=gbm_tcga_pub_cna_rae&case_ids=&Z_SCORE_THRESHOLD=1.0&cancer_study_list=gbm_tcga_pub&cancer_study_id=gbm_tcga_pub&gene_list=TP53+MDM2+MDM4&gene_set_choice=user-defined_list&Action=Submit#summary">TP53 and MDM2/4 alterations in GBM</a>
                    </li>
                    <li>
                        <a href="index.do?case_set_id=gbm_tcga_pub_sequenced&tab_index=tab_download&Action=Submit&genetic_profile_ids=gbm_tcga_pub_mutations&cancer_study_list=gbm_tcga_pub&cancer_study_id=gbm_tcga_pub&gene_list=PTEN&gene_set_choice=user-defined_list&transpose_matrix=on">PTEN mutations in GBM in text format</a>
                    </li>
                    <li>
                        <a href="ln?q=BRAF:MUT=V600E">BRAF V600E mutations across cancer types</a>
                    </li>
                    <li>
                        <a href="case.do#/patient?studyId=ucec_tcga_pub&caseId=TCGA-BK-A0CC">Patient view of an endometrial cancer case</a>
                    </li>
                </ul>
            </div>;

        if (AppConfig.skinRightNavExamplesHTML) {
            return (
                <div className="rightBarSection exampleQueries"
                    dangerouslySetInnerHTML={{__html:'<h3>' + title + '</h3>' + AppConfig.skinRightNavExamplesHTML}}>
                </div>
            );
        } else {
            return defaultExamples;
        }
    }

    render(){
        const datasets:JSX.Element | null = AppConfig.skinRightNavShowDatasets? 
            (
                <div className="rightBarSection">
                    <h3>Cancer Studies</h3>
                    {
                        (this.studyStore.data.isComplete) && (

                            <div>

                                <p>The portal contains {this.studyStore.data.result.length} cancer studies <a href="data_sets.jsp">(details)</a></p>

                                <BarGraph data={ this.studyStore.data.result }/>

                            </div>
                        )
                    }
                    {
                        (this.studyStore.data.isPending) && (
                            <ThreeBounce className="center-block text-center" />
                        )
                    }
                </div>
            ) : null;

        const examples:JSX.Element | null = AppConfig.skinRightNavShowExamples? RightBar.getExampleSection() : null;

        const testimonials:JSX.Element | null = AppConfig.skinRightNavShowTestimonials?
            (
                <div className="rightBarSection" style={{minHeight: '300px'}}>
                    <h3>Testimonials</h3>
                    <Testimonials/>
                </div>
                
            ) : null;

        return (
            <div>
                <div className="rightBarSection">
                    <h3>
                        What's New
                        <a href="http://www.twitter.com/cbioportal" className="pull-right">
                            @cbioportal <i className="fa fa-twitter" aria-hidden="true"></i>
                        </a>
                    </h3>
                    <p>Sign up for low-volume email news alerts:</p>
                    <a target="_blank" className="btn btn-default btn-sm" href="http://groups.google.com/group/cbioportal-news/boxsubscribe" style={{width: "100%"}}>Subscribe</a>
                </div>
                {datasets}
                {examples}
                {testimonials}
            </div>
        );
    }

}
