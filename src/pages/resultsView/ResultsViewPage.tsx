import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {observer, inject, Observer} from "mobx-react";
import {reaction, computed, observable, runInAction} from "mobx";
import validateParameters from 'shared/lib/validateParameters';
import ValidationAlert from "shared/components/ValidationAlert";
import AjaxErrorModal from "shared/components/AjaxErrorModal";
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import CancerSummaryContainer from "pages/resultsView/cancerSummary/CancerSummaryContainer";
import Mutations from "./mutation/Mutations";
import {stringListToSet} from "../../shared/lib/StringUtils";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import SurvivalTab from "./survival/SurvivalTab";
import DownloadTab from "./download/DownloadTab";
import Chart from 'chart.js';
import {CancerStudy, Sample} from "../../shared/api/generated/CBioPortalAPI";
import AppConfig from 'appConfig';
import AddThisBookmark from 'shared/components/addThis/AddThisBookmark';
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import CNSegments from "./cnSegments/CNSegments";
import './styles.scss';
import {genes, parseOQLQuery} from "shared/lib/oql/oqlfilter.js";

(Chart as any).plugins.register({
    beforeDraw: function (chartInstance: any) {
        const ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
});
import Oncoprint from "shared/components/oncoprint/Oncoprint";
import {QuerySession} from "../../shared/lib/QuerySession";
import ResultsViewOncoprint from "shared/components/oncoprint/ResultsViewOncoprint";
import QuerySummary from "./querySummary/QuerySummary";
import {QueryStore} from "../../shared/components/query/QueryStore";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import {getGAInstance} from "../../shared/lib/tracking";
import CoExpressionTabContainer from "./coExpression/CoExpressionTabContainer";
import EnrichmentsTab from 'pages/resultsView/enrichments/EnrichmentsTab';
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";


const win = (window as any);

function initStore(queryStore: QueryStore) {

    const resultsViewPageStore = new ResultsViewPageStore();

    resultsViewPageStore.queryStore = queryStore;

    const reaction1 = reaction(
        () => {
            return win.globalStores.routing.location.query
        },
        query => {

            const oql = decodeURIComponent(query.gene_list);

            let samplesSpecification: SamplesSpecificationElement[];

            if (query.case_set_id !== -1) {
                // by definition if there is a case_set_id, there is only one study
                samplesSpecification = [
                    {
                        studyId:query.cancer_study_list,
                        sampleListId:query.case_set_id,
                        sampleId:undefined
                    }
                ]
            } else {
                samplesSpecification = query.cancer_study_list.split(",").map((studyId)=>{
                    return {
                        studyId,
                        sampleListId:`${studyId}_all`,
                        sampleId:undefined
                    }
                });
            }



            function getMolecularProfiles(query){
                //if there's only one study, we read profiles from query params and filter out udfine
                const molecularProfiles = [
                    query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
                    query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
                    query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
                    query.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
                ].filter((profile:string|undefined)=>!!profile);

                if (molecularProfiles.length === 0) {
                        
                }

                return molecularProfiles;
            }

            console.log(getMolecularProfiles(query));

            runInAction(() => {
                resultsViewPageStore.samplesSpecification = samplesSpecification;
                resultsViewPageStore.hugoGeneSymbols = parseOQLQuery(oql).map((o: any) => o.gene);
                resultsViewPageStore.selectedMolecularProfileIds = getMolecularProfiles(query);
                resultsViewPageStore.rppaScoreThreshold = parseFloat(query.RPPA_SCORE_THRESHOLD);
                resultsViewPageStore.zScoreThreshold = parseFloat(query.Z_SCORE_THRESHOLD);
                resultsViewPageStore.oqlQuery = oql;
            });
        },
        {fireImmediately: true}
    );

    return resultsViewPageStore;
}


// // following is a bunch of dirty stuff necessary to read state from jsp page
// // ultimate we will phase this out and this information will be stored in router etc.
// //const qSession:any = (window as any).QuerySession;
// var samplesSpecification:any = [];
// if(_.includes(['all', 'w_mut_cna', 'w_mut', 'w_cna'],serverVars.caseSetProperties.case_set_id)){
//     var studyToSampleMap = serverVars.studySampleObj;
//     var studies = Object.keys(studyToSampleMap);
//     for (var i=0; i<studies.length; i++) {
//         var study = studies[i];
//         samplesSpecification = samplesSpecification.concat(studyToSampleMap[study].map(function(sampleId:string) {
//             return {
//                 sampleId: sampleId,
//                 studyId: study
//             };
//         }));
//     }
// } else if (serverVars.caseIds) {
//     // populated if custom case list
//     samplesSpecification = samplesSpecification.concat(serverVars.caseIds.trim().split(/\+/).map((c:string)=>{
//         const elts = c.split(":");
//         return {
//             studyId: elts[0],
//             sampleId: elts[1]
//         };
//     }));
// } else {
//     // case set
//     var studies = Object.keys(serverVars.studySampleListMap);
//     for (var i=0; i<studies.length; i++) {
//         samplesSpecification.push({
//             sampleListId: serverVars.studySampleListMap[studies[i]],
//             studyId: studies[i]
//         });
//     }
// }
//
// resultsViewPageStore.samplesSpecification = samplesSpecification;
// resultsViewPageStore.hugoGeneSymbols = _.map(parsedOQL, (o: any) => o.gene); //qSession.getQueryGenes();
// resultsViewPageStore.genesetIds = genesetIds;
// resultsViewPageStore.selectedMolecularProfileIds = serverVars.molecularProfiles; // qSession.getGeneticProfileIds();
// resultsViewPageStore.rppaScoreThreshold = serverVars.rppaScoreThreshold; // FIX!
// resultsViewPageStore.zScoreThreshold = serverVars.zScoreThreshold;
// resultsViewPageStore.oqlQuery = oqlQuery;
// resultsViewPageStore.queryStore = queryStore;
// resultsViewPageStore.cohortIdsList = serverVars.cohortIdsList;


export interface IResultsViewPageProps {
    routing: any;
    queryStore: QueryStore
}

type MutationsTabInitProps = {
    genes: string[];
    samplesSpecification: SamplesSpecificationElement[]
};

type OncoprintTabInitProps = {
    divId: string;
};

@inject('routing')
@inject('queryStore')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;
    private resultsViewPageStore: ResultsViewPageStore;

    constructor(props: IResultsViewPageProps) {
        super(props);

        const resultsViewPageStore = initStore(props.queryStore);
        this.resultsViewPageStore = resultsViewPageStore;
        (window as any).resultsViewPageStore = resultsViewPageStore;

        //this.exposeComponentRenderersToParentScript(props);

        //win.renderQuerySummary(document.getElementById('main_smry_info_div'));

        // // hide mutex tab
        // $(document).ready(()=>{
        //     if (!(window as any).serverVars.theQuery.trim().length || genes((window as any).serverVars.theQuery).length <= 1) {
        //         $('a#mutex-result-tab').parent().hide();
        //     }
        //     //hide gene-specific tabs when we only query gene sets (and no genes are queried)
        //     // TODO: this should probably be changed once we have single page
        //     // app
        //     if (!(window as any).serverVars.theQuery.trim().length || genes((window as any).serverVars.theQuery).length == 0) {
        //         $('a#cancer-types-result-tab').parent().hide();
        //         $('a#plots-result-tab').parent().hide();
        //         $('a#mutation-result-tab').parent().hide();
        //         $('a#coexp-result-tab').parent().hide();
        //         $('a#enrichments-result-tab').parent().hide();
        //         $('a#survival-result-tab').parent().hide();
        //         $('a#network-result-tab').parent().hide();
        //         $('a#igv-result-tab').parent().hide();
        //         $('a#data-download-result-tab').parent().hide();
        //     }
        //
        //     if (win.cancerStudyIdList !== 'null') {
        //         getGAInstance().event('results view', 'show', { eventLabel: win.cancerStudyIdList  });
        //     } else if (_.includes(['all','null'],win.cancerStudyId) === false) {
        //         getGAInstance().event('results view', 'show', { eventLabel: win.cancerStudyId  });
        //     }
        // });
    }

    get addThisParameters() {
        const passthrough = this.showTwitter ? {
            twitter: {
                hashtags: "cbioportal"
            }
        } : {};
        return {
            setup: function (url: string) {
                return {
                    url,
                    passthrough
                };
            },
            className: "addthis_inline_share_toolbox" + (!this.showTwitter ? '_ubww' : '')
        };

    }

    public exposeComponentRenderersToParentScript(props: IResultsViewPageProps) {


        exposeComponentRenderer('renderOncoprint',
            (props: OncoprintTabInitProps) => {
                function addOnBecomeVisibleListener(callback: () => void) {
                    $('#oncoprint-result-tab').click(callback);
                }

                return (
                    <ResultsViewOncoprint
                        divId={props.divId}
                        store={this.resultsViewPageStore}
                        routing={this.props.routing}
                        addOnBecomeVisibleListener={addOnBecomeVisibleListener}
                    />
                );
            });

        exposeComponentRenderer('renderCNSegments',
            () => {
                return <CNSegments store={this.resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderQuerySummary',
            () => {
                return <QuerySummary queryStore={props.queryStore} store={this.resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderMutationsTab',
            () => {
                return <div>
                    <AjaxErrorModal
                        show={(this.resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={() => {
                            this.resultsViewPageStore.clearErrors();
                        }}
                    />
                    <Mutations store={this.resultsViewPageStore}/>
                </div>
            });

        exposeComponentRenderer('renderCancerTypeSummary',
            () => {

                return <Observer>
                    {() => {

                        const isComplete = this.resultsViewPageStore.samplesExtendedWithClinicalData.isComplete && this.resultsViewPageStore.alterationsByGeneBySampleKey.isComplete;
                        const isPending = this.resultsViewPageStore.samplesExtendedWithClinicalData.isPending && this.resultsViewPageStore.alterationsByGeneBySampleKey.isPending;

                        if (isComplete) {
                            return (<div>
                                <AjaxErrorModal
                                    show={(this.resultsViewPageStore.ajaxErrors.length > 0)}
                                    onHide={() => {
                                        this.resultsViewPageStore.clearErrors();
                                    }}
                                />
                                <CancerSummaryContainer
                                    genes={this.resultsViewPageStore.genes.result!}
                                    samplesExtendedWithClinicalData={this.resultsViewPageStore.samplesExtendedWithClinicalData.result!}
                                    alterationsByGeneBySampleKey={this.resultsViewPageStore.alterationsByGeneBySampleKey.result!}
                                    studies={this.resultsViewPageStore.studies.result!}
                                    studyMap={this.resultsViewPageStore.physicalStudySet}
                                />
                            </div>)
                        } else if (isPending) {
                            return <Loader isLoading={true}/>
                        } else {
                            return <div></div>;
                        }

                    }}
                </Observer>

            });


        exposeComponentRenderer('renderMutExTab', () => {

            return (<div>
                <MutualExclusivityTab store={this.resultsViewPageStore}/>
            </div>)
        });

        exposeComponentRenderer('renderBookmark', () => {
            return (
                <div>
                    <AddThisBookmark store={this.resultsViewPageStore} getParameters={this.addThisParameters}/>
                </div>
            );
        });

        exposeComponentRenderer('renderSurvivalTab', () => {

            return (<div className="cbioportal-frontend">
                <SurvivalTab store={this.resultsViewPageStore}/>
            </div>)
        });

        exposeComponentRenderer('renderDownloadTab', () => {
            return (
                <div>
                    <DownloadTab store={this.resultsViewPageStore}/>
                </div>
            );
        });
        exposeComponentRenderer('renderCoExpressionTab', () => {
            return (
                <div className="cbioportal-frontend">
                    <CoExpressionTabContainer store={this.resultsViewPageStore}/>
                </div>
            );
        });

        exposeComponentRenderer('renderEnrichmentsTab', () => {

            return (
                <div className="cbioportal-frontend">
                    <EnrichmentsTab store={this.resultsViewPageStore}/>
                </div>);
        });
    }

    @observable currentQuery = true;

    private handleTabChange(id: string) {

        this.props.routing.updateRoute({ tab: id });

    }

    public render() {

        return (

            <div>
                {
                    (this.currentQuery) && (<div>

                        {/*<div style={{marginBottom:8}}>*/}
                        {/*<QuerySummary queryStore={this.props.queryStore} onSubmit={()=>this.showQuerySelector = true} store={this.resultsViewPageStore}/>*/}
                        {/*</div>*/}

                        {/*<Observer>*/}
                        {/*{*/}
                        {/*() => {*/}
                        {/*return <div className={"contentWidth"} style={{marginBottom:8}}><OQLEditor*/}
                        {/*oqlQuery={this.resultsViewPageStore.oqlQuery}*/}
                        {/*onChange={(oql: string) =>{*/}
                        {/*this.resultsViewPageStore.setOQL(oql);*/}
                        {/*$("#oncoprintContainer > span").css({minWidth:"auto"});*/}
                        {/*$(".oncoprintBody").removeClass("fadeIn");*/}
                        {/*$(".oncoprintLoadingIndicator").css("visibility","visible");*/}
                        {/*}}*/}
                        {/*/></div>*/}
                        {/*}*/}
                        {/*}*/}
                        {/*</Observer>*/}


                        <div style={{marginBottom:20}}>
                            <QuerySummary queryStore={this.props.queryStore} store={this.resultsViewPageStore}/>
                        </div>
                        <MSKTabs activeTabId={this.props.routing.location.query.tab} unmountOnHide={true}
                                 onTabClick={(id: string) => this.handleTabChange(id)} className="mainTabs">
                            <MSKTab key={0} id="oncoprintTab" linkText="Oncoprint">
                                <ResultsViewOncoprint
                                    divId={'oncoprintContainer'}
                                    store={this.resultsViewPageStore}
                                    routing={this.props.routing}
                                />
                            </MSKTab>
                            <MSKTab key={1} id="cancerTypesSummaryTab" linkText="Cancer Types Summary">
                                <CancerSummaryContainer
                                    genes={this.resultsViewPageStore.genes.result!}
                                    samplesExtendedWithClinicalData={this.resultsViewPageStore.samplesExtendedWithClinicalData.result!}
                                    alterationsByGeneBySampleKey={this.resultsViewPageStore.alterationsByGeneBySampleKey.result!}
                                    studies={this.resultsViewPageStore.studies.result!}
                                    studyMap={this.resultsViewPageStore.physicalStudySet}
                                />
                            </MSKTab>
                            <MSKTab key={3} id="mutationsTab" linkText="Mutations">
                                <Mutations store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={5} id="mutualExclusivityTab" linkText="Mutual Exclusivity">
                                <MutualExclusivityTab store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={4} id="survivalTab" linkText="Survival">
                                <SurvivalTab store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={6} id="copyNumberSegmentsTab" linkText="CN Segments">
                                <CNSegments store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={7} id="expressionTab" linkText="Expression">
                                {
                                    (this.resultsViewPageStore.studies.isComplete && this.resultsViewPageStore.genes.isComplete) && (
                                        <div>put expression here</div>
                                    )
                                }
                            </MSKTab>

                        </MSKTabs>
                    </div>)

                }


            </div>
        )

    }
}
