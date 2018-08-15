import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {observer, inject, Observer} from "mobx-react";
import {reaction, computed, observable} from "mobx";
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


const win = (window as any);

function initStore(queryStore: QueryStore) {

    const serverVars: any = (window as any).serverVars;

    const oqlQuery = serverVars.theQuery;

    const parsedOQL = parseOQLQuery(oqlQuery);

    const genesetIds = (serverVars.genesetIds.length
        ? serverVars.genesetIds.split(/\s+/)
        : []
    );

    const resultsViewPageStore = new ResultsViewPageStore();

    // following is a bunch of dirty stuff necessary to read state from jsp page
    // ultimate we will phase this out and this information will be stored in router etc.
    //const qSession:any = (window as any).QuerySession;
    var samplesSpecification:any = [];
    if(_.includes(['all', 'w_mut_cna', 'w_mut', 'w_cna'],serverVars.caseSetProperties.case_set_id)){
        var studyToSampleMap = serverVars.studySampleObj;
        var studies = Object.keys(studyToSampleMap);
        for (var i=0; i<studies.length; i++) {
            var study = studies[i];
            samplesSpecification = samplesSpecification.concat(studyToSampleMap[study].map(function(sampleId:string) {
                return {
                    sampleId: sampleId,
                    studyId: study
                };
            }));
        }
    } else if (serverVars.caseIds) {
        // populated if custom case list
        samplesSpecification = samplesSpecification.concat(serverVars.caseIds.trim().split(/\+/).map((c:string)=>{
            const elts = c.split(":");
            return {
                studyId: elts[0],
                sampleId: elts[1]
            };
        }));
    } else {
        // case set
        var studies = Object.keys(serverVars.studySampleListMap);
        for (var i=0; i<studies.length; i++) {
            samplesSpecification.push({
                sampleListId: serverVars.studySampleListMap[studies[i]],
                studyId: studies[i]
            });
        }
    }

    resultsViewPageStore.samplesSpecification = samplesSpecification;
    resultsViewPageStore.hugoGeneSymbols = _.map(parsedOQL, (o: any) => o.gene); //qSession.getQueryGenes();
    resultsViewPageStore.genesetIds = genesetIds;
    resultsViewPageStore.selectedMolecularProfileIds = serverVars.molecularProfiles; // qSession.getGeneticProfileIds();
    resultsViewPageStore.rppaScoreThreshold = serverVars.rppaScoreThreshold; // FIX!
    resultsViewPageStore.zScoreThreshold = serverVars.zScoreThreshold;
    resultsViewPageStore.oqlQuery = oqlQuery;
    resultsViewPageStore.queryStore = queryStore;
    resultsViewPageStore.cohortIdsList = serverVars.cohortIdsList;

    return resultsViewPageStore;

}

export interface IResultsViewPageProps {
    routing: any;
    queryStore: QueryStore
}

type MutationsTabInitProps = {
    genes: string[];
    samplesSpecification:SamplesSpecificationElement[]
};

type OncoprintTabInitProps = {
    divId: string;
};

function getDirtyServerVar(varName:string){
    return (window as any).serverVars[varName]
}

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

        this.exposeComponentRenderersToParentScript(props);

        win.renderQuerySummary(document.getElementById('main_smry_info_div'));

        // hide mutex tab
        $(document).ready(()=>{
            if (!(window as any).serverVars.theQuery.trim().length || genes((window as any).serverVars.theQuery).length <= 1) {
                $('a#mutex-result-tab').parent().hide();
            }
            //hide gene-specific tabs when we only query gene sets (and no genes are queried)
            // TODO: this should probably be changed once we have single page
            // app
            if (!(window as any).serverVars.theQuery.trim().length || genes((window as any).serverVars.theQuery).length == 0) {
                $('a#cancer-types-result-tab').parent().hide();
                $('a#plots-result-tab').parent().hide();
                $('a#mutation-result-tab').parent().hide();
                $('a#coexp-result-tab').parent().hide();
                $('a#enrichments-result-tab').parent().hide();
                $('a#survival-result-tab').parent().hide();
                $('a#network-result-tab').parent().hide();
                $('a#igv-result-tab').parent().hide();
                $('a#data-download-result-tab').parent().hide();
            }

            if (win.cancerStudyIdList !== 'null') {
                getGAInstance().event('results view', 'show', { eventLabel: win.cancerStudyIdList  });
            } else if (_.includes(['all','null'],win.cancerStudyId) === false) {
                getGAInstance().event('results view', 'show', { eventLabel: win.cancerStudyId  });
            }
        });
    }

    private mountOverlappingStudiesWarning(){

        const target = $('<div class="cbioportal-frontend"></div>').insertBefore("#tabs");

        ReactDOM.render(
            <Observer>
                {
                    ()=> {
                        if (this.resultsViewPageStore.studies.isComplete) {
                            //return <OverlappingStudiesWarning studies={resultsViewPageStore.studies.result!}/>
                            // disable overlapping studies warning until #3395
                            // is implemented
                            return <span></span>;
                        } else {
                            return <span></span>;
                        }
                    }
                }
            </Observer>
            ,
            target[0]
        );

    }

    private mountNetworkTab(){

        const target = $('<div class="cbioportal-frontend"></div>').appendTo("#network");

        ReactDOM.render(
            <Observer>
                {
                    ()=> {
                        if (this.resultsViewPageStore.studies.isComplete && this.resultsViewPageStore.sampleLists.isComplete) {
                            return <Network genes={this.resultsViewPageStore.genes.result!}
                                                   profileIds={this.resultsViewPageStore.selectedMolecularProfileIds}
                                                   cancerStudyId={this.resultsViewPageStore.studies.result[0].studyId}
                                                   zScoreThreshold={this.resultsViewPageStore.zScoreThreshold}
                                                   caseSetId={(this.resultsViewPageStore.sampleLists.result!.length > 0) ? this.resultsViewPageStore.sampleLists.result![0].sampleListId : "-1"}
                                                   caseIdsKey={getDirtyServerVar("caseSetProperties").case_ids_key}
                            />
                        } else {
                            return <div />;
                        }
                    }
                }
            </Observer>
            ,
            target[0]
        );

    }

    get addThisParameters() {
        const passthrough = this.showTwitter ? {
            twitter: {
                hashtags: "cbioportal"
            }
        } : {};
        return {
            setup: function(url:string){
                return {
                    url,
                    passthrough
                };
            },
            className:"addthis_inline_share_toolbox" + (!this.showTwitter ? '_ubww' : '')
        };

    }

    public exposeComponentRenderersToParentScript(props: IResultsViewPageProps){


        exposeComponentRenderer('renderExpression',()=>{

                return <Observer>
                    {
                        ()=> {

                            const store = this.resultsViewPageStore;

                            if (store.rnaSeqMolecularData.isComplete && store.studyIdToStudy.isComplete
                                && store.mutations.isComplete && store.genes.isComplete && store.coverageInformation.isComplete) {
                                return <ExpressionWrapper store={store}
                                                        studyMap={store.studyIdToStudy.result}
                                                          genes={store.genes.result}
                                                          data={store.rnaSeqMolecularData.result}
                                                          mutations={store.mutations.result}
                                                          RNASeqVersion={store.expressionTabSeqVersion}
                                                          coverageInformation={store.coverageInformation.result}
                                                          onRNASeqVersionChange={(version:number)=>store.expressionTabSeqVersion=version}
                                />
                            } else {
                                return <div><Loader isLoading={true}/></div>
                            }


                        }
                    }
                </Observer>

        });


        exposeComponentRenderer('renderOncoprint',
            (props:OncoprintTabInitProps)=>{
                function addOnBecomeVisibleListener(callback:()=>void) {
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
            ()=>{
                return <CNSegments store={this.resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderQuerySummary',
            ()=>{
                return <QuerySummary queryStore={props.queryStore} store={this.resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderMutationsTab',
             ()=>{
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


        exposeComponentRenderer('renderNetworkTab',
            ()=>{
                return <Observer>
                    {
                        ()=> {
                            if (this.resultsViewPageStore.studies.isComplete && this.resultsViewPageStore.sampleLists.isComplete) {
                                return <Network genes={this.resultsViewPageStore.genes.result!}
                                                profileIds={this.resultsViewPageStore.selectedMolecularProfileIds}
                                                cancerStudyId={this.resultsViewPageStore.studies.result[0].studyId}
                                                zScoreThreshold={this.resultsViewPageStore.zScoreThreshold}
                                                caseSetId={(this.resultsViewPageStore.sampleLists.result!.length > 0) ? this.resultsViewPageStore.sampleLists.result![0].sampleListId : "-1"}
                                                caseIdsKey={getDirtyServerVar("caseSetProperties").case_ids_key}
                                />
                            } else {
                                return <div></div>;
                            }
                        }
                    }
                </Observer>
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

        exposeComponentRenderer('renderBookmarkTab', () => {
            return <Bookmark urlPromise={ this.resultsViewPageStore.bookmarkLinks } />
        });

        exposeComponentRenderer('renderSurvivalTab', () => {
            return (<div className="cbioportal-frontend">
                <SurvivalTab store={this.resultsViewPageStore}/>
            </div>)
        });

        exposeComponentRenderer('renderDownloadTab', () => {
            return (
                <div>
                    <DownloadTab store={this.resultsViewPageStore} />
                </div>
            );
        });
        exposeComponentRenderer('renderCoExpressionTab', ()=>{
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

        exposeComponentRenderer('renderPlotsTab', ()=>{
            return (<div className="cbioportal-frontend">
                <PlotsTab store={this.resultsViewPageStore}/>
            </div>);
        });
    }

    public render() {

        return null;
    }
}
