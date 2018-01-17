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
import CancerSummaryContainer from "shared/components/cancerSummary/CancerSummaryContainer";
import Mutations from "./mutation/Mutations";
import {stringListToSet} from "../../shared/lib/StringUtils";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import SurvivalTab from "./survival/SurvivalTab";
import Chart from 'chart.js';
import {CancerStudy, Sample} from "../../shared/api/generated/CBioPortalAPI";
import AppConfig from 'appConfig';
import AddThisBookmark from 'shared/components/addThis/AddThisBookmark';
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import CNSegments from "./cnSegments/CNSegments";
import './styles.scss';

(Chart as any).plugins.register({
    beforeDraw: function(chartInstance:any) {
        const ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
});
import Oncoprint, {GeneticTrackDatum} from "shared/components/oncoprint/Oncoprint";
import {QuerySession} from "../../shared/lib/QuerySession";
import ResultsViewOncoprint from "shared/components/oncoprint/ResultsViewOncoprint";
import QuerySummary from "./querySummary/QuerySummary";
import {QueryStore} from "../../shared/components/query/QueryStore";


const win = (window as any);

function initStore(queryStore: QueryStore) {

    const serverVars: any = (window as any).serverVars;

    const oqlQuery = decodeURIComponent(serverVars.theQuery);

    const parsedOQL = (window as any).oql_parser.parse(oqlQuery);

    const resultsViewPageStore = new ResultsViewPageStore();

    // following is a bunch of dirty stuff necessary to read state from jsp page
    // ultimate we will phase this out and this information will be stored in router etc.
    //const qSession:any = (window as any).QuerySession;
    var samplesSpecification:any = [];
    if (["-1", "all"].indexOf(serverVars.caseSetProperties.case_set_id) > -1) {
        // "-1" means custom case id, "all" means all cases in the queried stud(y/ies). Neither is an actual case set that could eg be queried
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
    } else {
        var studies = Object.keys(serverVars.studySampleListMap);
        for (var i=0; i<studies.length; i++) {
            samplesSpecification.push({
                sampleListId: serverVars.studySampleListMap[studies[i]],
                studyId: studies[i]
            });
        }
    }

    resultsViewPageStore.samplesSpecification = samplesSpecification;
    resultsViewPageStore.hugoGeneSymbols = _.map(parsedOQL,(o:any)=>o.gene); //qSession.getQueryGenes();
    resultsViewPageStore.selectedMolecularProfileIds = serverVars.molecularProfiles; // qSession.getGeneticProfileIds();
    resultsViewPageStore.rppaScoreThreshold = serverVars.rppaScoreThreshold; // FIX!
    resultsViewPageStore.zScoreThreshold = serverVars.zScoreThreshold;
    resultsViewPageStore.oqlQuery = oqlQuery;
    resultsViewPageStore.queryStore = queryStore;

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
    }

    componentDidMount(){

        this.mountOverlappingStudiesWarning();

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

        exposeComponentRenderer('renderCancerTypeSummary',
            (props: MutationsTabInitProps) => {
                return <div>
                    <AjaxErrorModal
                        show={(this.resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={() => {
                            this.resultsViewPageStore.clearErrors();
                        }}
                    />
                    <CancerSummaryContainer store={this.resultsViewPageStore}/>
                </div>
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
    }

    public render() {

        return null;
    }
}
