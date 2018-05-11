import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {If, Then, Else} from 'react-if';
import {observer, inject, Observer} from "mobx-react";
import {reaction, computed, observable, autorun, action, runInAction} from "mobx";
import validateParameters from 'shared/lib/validateParameters';
import ValidationAlert from "shared/components/ValidationAlert";
import AjaxErrorModal from "shared/components/AjaxErrorModal";
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import Mutations from "./mutation/Mutations";
import {stringListToSet} from "../../shared/lib/StringUtils";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import SurvivalTab from "./survival/SurvivalTab";
import Chart from 'chart.js';
import {CancerStudy, Gene, MolecularProfile, Sample} from "../../shared/api/generated/CBioPortalAPI";
import AppConfig from 'appConfig';
import AddThisBookmark from 'shared/components/addThis/AddThisBookmark';
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import CNSegments from "./cnSegments/CNSegments";
import './styles.scss';

(Chart as any).plugins.register({
    beforeDraw: function (chartInstance: any) {
        const ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
});
import Oncoprint, {GeneticTrackDatum} from "shared/components/oncoprint/Oncoprint";
import {QuerySession} from "../../shared/lib/QuerySession";
import ResultsViewOncoprint from "shared/components/oncoprint/ResultsViewOncoprint";
import QuerySummary from "./querySummary/QuerySummary";
import {CancerStudyQueryUrlParams, QueryStore} from "../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {molecularProfileParams} from "../../shared/components/query/QueryStoreUtils";
import CancerSummaryContainer from "./cancerSummary/CancerSummaryContainer";
import ExtendedRouterStore from "../../shared/lib/ExtendedRouterStore";
import {parseOQLQuery} from "../../shared/lib/oql/oqlfilter";


const win = (window as any);

function postQueryToRoute(query: CancerStudyQueryUrlParams){
    //console.log(query)
    (win.routingStore as ExtendedRouterStore).updateRoute(query);
}

function getRoutingStore(): ExtendedRouterStore{
    return (win as any);
}

// interface SampleSpec {
//     studyId:string;
//         sampleListId:string;
//     sampleId:undefined
// }

function initStore(queryStore: QueryStore, pageInstance:SinglePageApp) {



    //const serverVars: any = (window as any).serverVars;
    //const oqlQuery = serverVars.theQuery;
    //const parsedOQL = (window as any).oql_parser.parse(oqlQuery);
    const resultsViewPageStore = new ResultsViewPageStore();


    queryStore.singlePageAppSubmitRoutine = function(path:string, query:CancerStudyQueryUrlParams) {

        console.log("RESTORE CUSTOM QUERY FUNCTIONALITY!!!!");

        if (queryStore.selectableSelectedStudyIds.length > 1) {
            resultsViewPageStore.samplesSpecification = _.map(queryStore.selectableSelectedStudyIds,(studyId:string)=>{
                return {
                    studyId,
                    sampleListId:`${studyId}_all`,
                    sampleId:undefined
                }
            })
        } else {
            resultsViewPageStore.samplesSpecification = [{
                studyId:queryStore.selectableSelectedStudyIds[0],
                sampleListId:queryStore.selectedSampleListId!,
                sampleId:undefined
            }];
        }


        // 2. NOW DERIVE PROFILE IDS
        let profs:string[];

        if (queryStore.selectableSelectedStudyIds.length === 1) {
            profs = _.values(molecularProfileParams(queryStore));
        } else {
            const profiles = _.filter(queryStore.molecularProfilesInSelectedStudies.result,(profile:MolecularProfile)=>/MUTATION_EXTENDED|COPY/.test(profile.molecularAlterationType))
            profs = profiles.map((profile:MolecularProfile)=>profile.molecularProfileId);
        }

        pageInstance.currentQuery = true;

        postQueryToRoute(
            Object.assign({}, query, {})
        );

    };

    resultsViewPageStore.queryStore = queryStore;

    // // 3. NOW SET PARAMS


    const reaction1 = reaction(
        () =>{
            return win.globalStores.routing.location.query
        },
        query => {

           // debugger;

            const oql = decodeURIComponent(query.gene_list);

            let samplesSpecification: SamplesSpecificationElement[];

            if (queryStore.selectableSelectedStudyIds.length > 1) {
                samplesSpecification = _.map(queryStore.selectableSelectedStudyIds,(studyId:string)=>{
                    return {
                        studyId,
                        sampleListId:`${studyId}_all`,
                        sampleId:undefined
                    }
                })
            } else {
                samplesSpecification = [{
                    studyId:queryStore.selectableSelectedStudyIds[0],
                    sampleListId:queryStore.selectedSampleListId!,
                    sampleId:undefined
                }];
            }


            let profs:string[];

            if (queryStore.selectableSelectedStudyIds.length === 1) {
                profs = _.values(molecularProfileParams(queryStore));
            } else {
                const profiles = _.filter(queryStore.molecularProfilesInSelectedStudies.result,(profile:MolecularProfile)=>/MUTATION_EXTENDED|COPY/.test(profile.molecularAlterationType))
                profs = profiles.map((profile:MolecularProfile)=>profile.molecularProfileId);
            }

            runInAction(()=>{
                resultsViewPageStore.samplesSpecification = samplesSpecification;
                resultsViewPageStore.hugoGeneSymbols = parseOQLQuery(oql).map((o: any) => o.gene);
                resultsViewPageStore.selectedMolecularProfileIds = ["cellline_nci60_mutations"];
                resultsViewPageStore.rppaScoreThreshold = parseFloat(query.RPPA_SCORE_THRESHOLD);
                resultsViewPageStore.zScoreThreshold = parseFloat(query.Z_SCORE_THRESHOLD);
                resultsViewPageStore.oqlQuery = oql;
            });
        },
        { fireImmediately: false }
    );

    return resultsViewPageStore;

}

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
export default class SinglePageApp extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;
    private resultsViewPageStore: ResultsViewPageStore;
    @observable showQuerySelector = true;

    @observable currentQuery:boolean;

    constructor(props: IResultsViewPageProps) {
        super(props);
    }

    componentWillMount(){
        this.resultsViewPageStore = initStore(this.props.queryStore, this);
        (window as any).resultsViewPageStore = this.resultsViewPageStore;
    }

    private handleTabChange(id: string) {

        this.props.routing.updateRoute({ tab: id });

    }


    public render() {

        return (

            <div>

                <If condition={this.showQuerySelector}>
                    <div style={{padding:15}}>
                        <QueryAndDownloadTabs onSubmit={()=>{
                            this.showQuerySelector = false;
                            // $("#oncoprintContainer > span").css({minWidth:"auto"});
                            // $(".oncoprintBody").removeClass("fadeIn");
                            // $(".oncoprintLoadingIndicator").css("visibility","visible");
                        }} store={this.props.queryStore}/>
                    </div>
                    <hr />

                </If>

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


                        <QuerySummary queryStore={this.props.queryStore} store={this.resultsViewPageStore}/>

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