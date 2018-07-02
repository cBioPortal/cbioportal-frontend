import * as React from 'react';
import BarGraph from "../barGraph/BarGraph";
import {observer} from "mobx-react";
import {TypeOfCancer as CancerType} from "../../api/generated/CBioPortalAPI";
import Testimonials from "../testimonials/Testimonials";
import {ThreeBounce} from 'better-react-spinkit';
import AppConfig from "appConfig";
import {QueryStore} from "shared/components/query/QueryStore";
import { Timeline } from 'react-twitter-widgets';


interface IRightBarProps
{
    store:QueryStore;
}
interface IRightBarState
{
    twitterLoading: boolean;
}

@observer
export default class RightBar extends React.Component<IRightBarProps, IRightBarState> {
    constructor(props:IRightBarProps) {
        super(props);
        this.state = {
            twitterLoading: true // only used for default what's new
        };
    }


    get studyStore() {
      return this.props.store;
    }

    get logic() { return this.studyStore.studyListLogic; }

    private CancerTypeList() {
        return this.logic.cancerTypeListView.getChildCancerTypes(this.studyStore.treeData.rootCancerType);
    };

    private CancerTypeDescendantStudy({cancerType}: {cancerType:CancerType}) {
        return this.logic.cancerTypeListView.getDescendantCancerStudies(cancerType);
    };

    private CancerTypeDescendantStudies(cancerList:CancerType[]) {
        return cancerList.filter(cancer => (cancer.cancerTypeId !== "other" &&  cancer.cancerTypeId !== "mixed"))
                         .map((filteredCancer:CancerType) => (
            {
                shortName: filteredCancer.name,
                color: filteredCancer.dedicatedColor,
                studies:this.CancerTypeDescendantStudy({cancerType: filteredCancer})
            }
        ));
    }

    private getWhatsNew() {
        if (AppConfig.skinRightNavWhatsNewBlurb) {
            return (
                <div className="rightBarSection">
                    <h3>What's New</h3>
                    <div dangerouslySetInnerHTML={{__html:AppConfig.skinRightNavWhatsNewBlurb}}></div>
                </div>
            );
        } else {
            return (
                <div className="rightBarSection" style={{paddingBottom:20}}>
                    <h3 style={{borderBottom:0}}>
                        What's New
                        <a href="http://www.twitter.com/cbioportal" className="pull-right">
                            @cbioportal <i className="fa fa-twitter" aria-hidden="true"></i>
                        </a>
                    </h3>
                    <div style={{marginTop:3}}>
                        <Timeline
                            dataSource={{
                                sourceType: 'profile',
                                screenName: 'cbioportal'
                            }}
                            options={{
                                username: 'cbioportal',
                                height: '200',
                                chrome: 'noheader%20nofooter',
                            }}
                            onLoad={() => this.setState({twitterLoading:false})}
                        />
                    </div>
                    <div>
                        {this.state.twitterLoading &&
                             (<ThreeBounce className="center-block text-center" />) ||
                             (
                                <div style={{paddingTop:5}}>
                                    <p style={{textAlign:'center'}}>Sign up for low-volume email news alerts</p>
                                    <a target="_blank" className="btn btn-default btn-sm" href="http://groups.google.com/group/cbioportal-news/boxsubscribe" style={{width: "100%"}}>Subscribe</a>
                                 </div>
                             )
                        }
                    </div>
                </div>
            );
        }
    }

    static getExampleSection() {
        const title:string = 'Example Queries';
        const defaultExamples:JSX.Element = (
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
                        <a href="patient?studyId=ucec_tcga_pub&caseId=TCGA-BK-A0CC">Patient view of an endometrial cancer case</a>
                    </li>
                </ul>
            </div>
        );

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

    render() {
        const datasets:JSX.Element | null = AppConfig.skinRightNavShowDatasets? 
            (
                <div className="rightBarSection">
                    <h3>Cancer Studies</h3>
                    {
                        (this.studyStore.cancerStudies.isComplete && this.studyStore.cancerTypes.isComplete) && (

                            <div>

                                <p>The portal contains {this.studyStore.cancerStudies.result.length} cancer studies <a href="data_sets.jsp">(details)</a></p>

                                <BarGraph data={this.CancerTypeDescendantStudies(this.CancerTypeList())}
                                />

                            </div>
                        )
                    }
                    {
                        (this.studyStore.cancerStudies.isPending) && (
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
                {this.getWhatsNew()}
                {datasets}
                {examples}
                {testimonials}
            </div>
        );
    }

}
