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

function initStore(){

    const serverVars: any = (window as any).serverVars;

    const oqlQuery = serverVars.theQuery;

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

    return resultsViewPageStore;

}

const resultsViewPageStore = initStore();
(window as any).resultsViewPageStore = resultsViewPageStore;


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
    customDriverMetadata:{
        hasDriverAnnotations: boolean,
        customDriverTiers: string[]
    }
};

@inject('routing')
@inject('queryStore')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;

    constructor(props: IResultsViewPageProps) {
        super(props);
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
                        if (resultsViewPageStore.studies.isComplete) {
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
                return (
                    <ResultsViewOncoprint
                        divId={props.divId}
                        store={resultsViewPageStore}
                        routing={this.props.routing}
                        customDriverMetadata={props.customDriverMetadata}
                    />
                );
            });

        exposeComponentRenderer('renderCNSegments',
            ()=>{
                return <CNSegments store={resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderQuerySummary',
            ()=>{
                return <QuerySummary queryStore={props.queryStore} store={resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderMutationsTab',
             ()=>{
                return <div>
                    <AjaxErrorModal
                        show={(resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={() => {
                            resultsViewPageStore.clearErrors()
                        }}
                    />
                    <Mutations store={resultsViewPageStore}/>
                </div>
            });

        exposeComponentRenderer('renderCancerTypeSummary',
            (props: MutationsTabInitProps) => {
                return <div>
                    <AjaxErrorModal
                        show={(resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={() => {
                            resultsViewPageStore.clearErrors()
                        }}
                    />
                    <CancerSummaryContainer store={resultsViewPageStore}/>
                </div>
            });


        exposeComponentRenderer('renderMutExTab', () => {

            return (<div>
                <MutualExclusivityTab store={resultsViewPageStore}/>
            </div>)
        });

        exposeComponentRenderer('renderBookmark', () => {
            return (
                <div>
                    <AddThisBookmark store={resultsViewPageStore} getParameters={this.addThisParameters}/>
                </div>
            );
        });

        exposeComponentRenderer('renderSurvivalTab', () => {

            return (<div>
                <SurvivalTab store={resultsViewPageStore}/>
            </div>)
        });
    }

    public render() {

        return null;
    }
}
