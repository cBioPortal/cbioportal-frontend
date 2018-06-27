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
import RightBar from "../../shared/components/rightbar/RightBar";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import autobind from "autobind-decorator";
import client from "../../shared/api/cbioportalClientInstance";


const win = (window as any);

function initStore() {


    console.log("INIT RESULTS VIEW STORE");

    const resultsViewPageStore = new ResultsViewPageStore();

    const reaction1 = reaction(
        () => {
            return win.globalStores.routing.location.query
        },
        query => {

            if (!win.globalStores.routing.location.pathname.includes("/results")) {
               return;
            }

            console.log("running reaction for results");


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
                samplesSpecification = query.cancer_study_list.split(",").map((studyId:string)=>{
                    return {
                        studyId,
                        sampleListId:`${studyId}_all`,
                        sampleId:undefined
                    }
                });
            }



            function getMolecularProfiles(query:any){
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

            runInAction(() => {

                if (!resultsViewPageStore.samplesSpecification || !_.isEqual(resultsViewPageStore.samplesSpecification.slice(), samplesSpecification)) {
                    resultsViewPageStore.samplesSpecification = samplesSpecification;
                }

                const geneSymbols = parseOQLQuery(oql).map((o: any) => o.gene);
                if (!resultsViewPageStore.hugoGeneSymbols || !_.isEqual(resultsViewPageStore.hugoGeneSymbols.slice(), geneSymbols)) {
                    console.log("settings genes");
                    resultsViewPageStore.hugoGeneSymbols = geneSymbols;
                }

                const profiles = getMolecularProfiles(query);
                if (!resultsViewPageStore.selectedMolecularProfileIds || !_.isEqual(resultsViewPageStore.selectedMolecularProfileIds.slice(), profiles)) {
                    resultsViewPageStore.selectedMolecularProfileIds = profiles;
                }

                if (_.isEqual(query.RPPA_SCORE_THRESHOLD, resultsViewPageStore.rppaScoreThreshold)) {
                    resultsViewPageStore.rppaScoreThreshold = parseFloat(query.RPPA_SCORE_THRESHOLD);
                }

                if (_.isEqual(query.Z_SCORE_THRESHOLD, resultsViewPageStore.zScoreThreshold)) {
                    resultsViewPageStore.zScoreThreshold = parseFloat(query.Z_SCORE_THRESHOLD);
                }


                //resultsViewPageStore.cohortIdsList = serverVars.cohortIdsList;
                //resultsViewPageStore.genesetIds = genesetIds;
                resultsViewPageStore.oqlQuery = oql;
            });
        },
        {fireImmediately: true}
    );

    return resultsViewPageStore;
}


const resultsViewPageStore = initStore();

(window as any).resultsViewPageStore = resultsViewPageStore;

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

        this.resultsViewPageStore = resultsViewPageStore;

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

    @observable currentQuery = true;

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    @autobind
    private customTabMountCallback(div:HTMLDivElement,tab:any){
        if (typeof win[tab.mountCallbackName] === 'function'){
            win[tab.mountCallbackName](div, this.props.routing.location, this.resultsViewPageStore, client, tab.customParameters || {});
        } else {
            alert(`Tab mount callback not implemented for ${tab.title}`)
        }
    }

    public render() {

        return (
            <PageLayout showRightBar={false}>
                {
                    (this.currentQuery) && (<div>

                        <div style={{margin:"0 20px 10px 20px"}}>
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
                            <MSKTab key={7} id="coexpression" linkText={'Coexpression'}>
                                <CoExpressionTabContainer store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={8} id="enrichment" linkText={'Enrichment'}>
                                <EnrichmentsTab store={this.resultsViewPageStore}/>
                            </MSKTab>

                            <MSKTab key={9} id="download" linkText={'Download'}>
                                <DownloadTab store={this.resultsViewPageStore}/>
                            </MSKTab>

                            {
                                (AppConfig.customTabs) && AppConfig.customTabs.filter((tab)=>tab.location==="RESULTS_PAGE").map((tab:any, i:number)=>{
                                    return (<MSKTab key={100+i} id={'customTab'+1} unmountOnHide={(tab.unmountOnHide===true)}
                                                   onTabDidMount={(div)=>{ this.customTabMountCallback(div, tab) }} linkText={tab.title}>

                                    </MSKTab>)
                                })
                            }

                        </MSKTabs>
                    </div>)
                }
            </PageLayout>
        )

    }
}
