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
import {CancerStudy, Gene, MolecularProfile, Sample} from "../../shared/api/generated/CBioPortalAPI";
import AppConfig from 'appConfig';
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import CNSegments from "./cnSegments/CNSegments";
import './styles.scss';
import {genes, parseOQLQuery} from "shared/lib/oql/oqlfilter.js";
import Network from "./network/Network";

(Chart as any).plugins.register({
    beforeDraw: function(chartInstance:any) {
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
import ExpressionWrapper from "./expression/ExpressionWrapper";
import CoExpressionTabContainer from "./coExpression/CoExpressionTabContainer";
import EnrichmentsTab from 'pages/resultsView/enrichments/EnrichmentsTab';
import {Bookmark} from "./bookmark/Bookmark";
import PlotsTab from "./plots/PlotsTab";
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import RightBar from "../../shared/components/rightbar/RightBar";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import {createQueryStore} from "./SPA";

const win = (window as any);

function initStore() {

    const resultsViewPageStore = new ResultsViewPageStore();

    if (!win.currentQueryStore) {
        win.currentQueryStore = createQueryStore();
    }

    const reaction1 = reaction(
        () => {
            return win.globalStores.routing.location.query
        },
        query => {

            if (!win.globalStores.routing.location.pathname.includes("/results")) {
               return;
            }

            console.log("running reaction for results");
            console.log("submitted query", query);

            const oql = decodeURIComponent(query.gene_list);


            let samplesSpecification: SamplesSpecificationElement[];

            if (query.case_set_id !== "all") {
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

                return molecularProfiles;
            }

            runInAction(() => {

                if (!resultsViewPageStore.samplesSpecification || !_.isEqual(resultsViewPageStore.samplesSpecification.slice(), samplesSpecification)) {
                    resultsViewPageStore.samplesSpecification = samplesSpecification;
                }

                if (query.data_priority && query.data_priority !== resultsViewPageStore.profileFilter) {
                    resultsViewPageStore.profileFilter = parseInt(query.data_priority,10);
                }

                const geneSymbols = parseOQLQuery(oql).map((o: any) => o.gene);
                if (!resultsViewPageStore.hugoGeneSymbols || !_.isEqual(resultsViewPageStore.hugoGeneSymbols.slice(), geneSymbols)) {
                    console.log("settings genes");
                    resultsViewPageStore.hugoGeneSymbols = geneSymbols;
                }

                // note that this could be zero length if we have multiple studies
                // in that case we derive default selected profiles
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

                resultsViewPageStore.cohortIdsList = query.cancer_study_list.split(",");

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
}

type MutationsTabInitProps = {
    genes: string[];
    samplesSpecification: SamplesSpecificationElement[]
};

type OncoprintTabInitProps = {
    divId: string;
};

function getDirtyServerVar(varName:string){
    return (window as any).serverVars[varName]
}

@inject('routing')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;
    private resultsViewPageStore: ResultsViewPageStore;

    constructor(props: IResultsViewPageProps) {
        super(props);

        this.resultsViewPageStore = resultsViewPageStore;
        //this.resultsViewPageStore.queryStore = this.props.queryStore;

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

    // this needs to be replaced.  we shouldn't need queryStore reference
    // because queryStore and results store should only interact via url
    get queryStore(){
        return win.currentQueryStore;
    }

    public get showPlotsTab(){
        return !this.queryStore.isVirtualStudyQuery;
    }

    public get showExpressionTab(){
        return this.queryStore.isVirtualStudyQuery;
    }

    public get showCoexpressionTab(){
        return !this.queryStore.isVirtualStudyQuery;
    }

    public get showSurvivalTab(){
        return !this.queryStore.isVirtualStudyQuery;
    }

    public get showEnrichmentsTab(){
        return !this.queryStore.isVirtualStudyQuery;
    }

    public get showNetworkTab(){
        return !this.queryStore.isVirtualStudyQuery;
    }

    public get showCNSegmentsTab(){
        return !this.queryStore.isVirtualStudyQuery;
    }



    // if(isVirtualStudy){
    //     showCoexpTab = false;
    //     showIGVtab = false;
    //     showEnrichmentsTab = false;
    //     has_survival = false;
    //     includeNetworks = false;
    //     showPlotsTab = false;
    // }




    @observable currentQuery = true;

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    public render() {

        const store = this.resultsViewPageStore;

        function addOnBecomeVisibleListener(callback:()=>void) {
            $('#oncoprint-result-tab').click(callback);
        }

        return (
            <PageLayout>
                {
                    (this.currentQuery) && (<div>

                        <div style={{margin:"0 20px 10px 20px"}}>
                            <QuerySummary queryStore={win.currentQueryStore} store={this.resultsViewPageStore}/>
                        </div>
                        <MSKTabs activeTabId={this.props.routing.location.query.tab} unmountOnHide={true}
                                 onTabClick={(id: string) => this.handleTabChange(id)} className="mainTabs">
                            <MSKTab key={0} id="oncoprintTab" linkText="Oncoprint">
                                <ResultsViewOncoprint
                                    divId={'oncoprintContainer'}
                                    store={this.resultsViewPageStore}
                                    routing={this.props.routing}
                                    isVirtualStudy={win.currentQueryStore.isVirtualStudyQuery}
                                    addOnBecomeVisibleListener={addOnBecomeVisibleListener}
                                />
                            </MSKTab>
                            <MSKTab key={1} id="cancerTypesSummaryTab" linkText="Cancer Types Summary">
                                <CancerSummaryContainer
                                    store={this.resultsViewPageStore}
                                    genes={this.resultsViewPageStore.genes.result!}
                                    samplesExtendedWithClinicalData={this.resultsViewPageStore.samplesExtendedWithClinicalData.result!}
                                    alterationsByGeneBySampleKey={this.resultsViewPageStore.alterationsByGeneBySampleKey.result!}
                                    studies={this.resultsViewPageStore.studies.result!}
                                    studyMap={this.resultsViewPageStore.physicalStudySet}
                                />
                            </MSKTab>
                            <MSKTab key={5} id="mutualExclusivityTab" linkText="Mutual Exclusivity">
                                <MutualExclusivityTab store={this.resultsViewPageStore}/>
                            </MSKTab>

                            <MSKTab key={12} id="plots" hide={!this.showPlotsTab} linkText={'Plots'}>
                                <PlotsTab store={this.resultsViewPageStore}/>
                            </MSKTab>

                            <MSKTab key={3} id="mutationsTab" linkText="Mutations">
                                <Mutations store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={7} id="coexpression" hide={!this.showCoexpressionTab} linkText={'Coexpression'}>
                                <CoExpressionTabContainer store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={10} id="enrichment" hide={!this.showEnrichmentsTab} linkText={'Enrichment'}>
                                <EnrichmentsTab store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={6} id="copyNumberSegmentsTab" hide={!this.showCNSegmentsTab} linkText="CN Segments">
                                <CNSegments store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={4} id="survivalTab" hide={!this.showSurvivalTab} linkText="Survival">
                                <SurvivalTab store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={9} id="network"
                                    loading={store.studies.isPending || store.sampleLists.isPending}
                                    linkText={'Network'}
                                    hide={!this.showNetworkTab}
                            >
                                {
                                    (store.studies.isComplete && store.sampleLists.isComplete) &&
                                    (<Network genes={store.genes.result!}
                                              profileIds={store.selectedMolecularProfileIds}
                                              cancerStudyId={store.studies.result[0].studyId}
                                              zScoreThreshold={store.zScoreThreshold}
                                              caseSetId={(store.sampleLists.result!.length > 0) ? store.sampleLists.result![0].sampleListId : "-1"}
                                              caseIdsKey={""}
                                    />)
                                }
                            </MSKTab>
                            <MSKTab key={8} id="expression"
                                    loading={(store.rnaSeqMolecularData.isPending || store.studyIdToStudy.isPending || store.mutations.isPending || store.genes.isPending || store.coverageInformation.isPending)}
                                    linkText={'Expression'}
                                    hide={!this.showExpressionTab}
                            >
                                {
                                    (store.studyIdToStudy.isComplete
                                    && store.putativeDriverAnnotatedMutations.isComplete &&
                                    store.genes.isComplete && store.coverageInformation.isComplete) {
                                    return <ExpressionWrapper store={store}
                                    studyMap={store.studyIdToStudy.result}
                                    genes={store.genes.result}
                                    expressionProfiles={store.expressionProfiles}
                                    numericGeneMolecularDataCache={store.numericGeneMolecularDataCache}
                                    mutations={store.putativeDriverAnnotatedMutations.result}
                                    RNASeqVersion={store.expressionTabSeqVersion}
                                    coverageInformation={store.coverageInformation.result}
                                    onRNASeqVersionChange={(version:number)=>store.expressionTabSeqVersion=version}
                                    />)
                                }
                            </MSKTab>
                            <MSKTab key={11} id="download" linkText={'Download'}>
                                <DownloadTab store={this.resultsViewPageStore}/>
                            </MSKTab>
                            <MSKTab key={11} id="bookmark" linkText={'Bookmark'}>
                                <Bookmark urlPromise={ this.resultsViewPageStore.bookmarkLinks } />
                            </MSKTab>
                        </MSKTabs>
                    </div>)
                }
            </PageLayout>
        )

    }


}
