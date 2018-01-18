import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {If, Then, Else} from 'react-if';
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
import {QueryStore} from "../../shared/components/query/QueryStore";
import ExpressionWrapper from "./expression/ExpressionWrapper";
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {molecularProfileParams} from "../../shared/components/query/QueryStoreUtils";


const win = (window as any);

function initStore(queryStore: QueryStore) {



    //const serverVars: any = (window as any).serverVars;

    //const oqlQuery = serverVars.theQuery;

    //const parsedOQL = (window as any).oql_parser.parse(oqlQuery);

    const resultsViewPageStore = new ResultsViewPageStore();


    queryStore.singlePageSubmitRoutine = function() {

        console.log("RESTORE CUSTOM QUERY FUNCTIONALITY!!!!");

        if (queryStore.selectedStudyIds.length > 1) {
            resultsViewPageStore.samplesSpecification = _.map(queryStore.selectedStudyIds,(studyId:string)=>{
                return {
                    studyId,
                    sampleListId:`${studyId}_all`,
                    sampleId:undefined
                }
            })
        } else {
            resultsViewPageStore.samplesSpecification = [{
                studyId:queryStore.selectedStudyIds[0],
                sampleListId:queryStore.selectedSampleListId,
                sampleId:undefined
            }];
        }

        const profs = _.values(molecularProfileParams(queryStore));



        resultsViewPageStore.hugoGeneSymbols = queryStore.oql.query.map((gene) => gene.gene);
        resultsViewPageStore.selectedMolecularProfileIds = profs;
        resultsViewPageStore.rppaScoreThreshold = parseFloat(queryStore.rppaScoreThreshold);
        resultsViewPageStore.zScoreThreshold = parseFloat(queryStore.zScoreThreshold);
        resultsViewPageStore.oqlQuery = queryStore.geneQuery

        resultsViewPageStore.currentQuery = 1;


    };

    resultsViewPageStore.queryStore = queryStore;

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


class OQLEditor extends React.Component<{ oqlQuery: string, onChange: (newOQL: string) => void }, {}> {

    public oqlInput: HTMLInputElement;


    render() {

        return (
            <div>
                <form className="form-inline" style={{marginBottom: 0}} onSubmit={(e) => {
                    e.preventDefault();
                    this.props.onChange(this.oqlInput.value)
                }}>
                    <div className="form-group form-group-sm" style={{marginRight: 10}}>
                        <input type="text" defaultValue={this.props.oqlQuery}
                               ref={(el: HTMLInputElement) => this.oqlInput = el} className="form-control"/>
                    </div>
                    <button type="submit" className="btn btn-default btn-sm">Go</button>
                </form>
            </div>
        );

    }

}

@inject('routing')
@inject('queryStore')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;
    private resultsViewPageStore: ResultsViewPageStore;
    @observable showQuerySelector = true;

    constructor(props: IResultsViewPageProps) {
        super(props);

        const resultsViewPageStore = initStore(props.queryStore);
        this.resultsViewPageStore = resultsViewPageStore;
        (window as any).resultsViewPageStore = resultsViewPageStore;

        //this.exposeComponentRenderersToParentScript(props);

        //win.renderQuerySummary(document.getElementById('main_smry_info_div'));
    }

    componentDidMount() {

        //this.mountOverlappingStudiesWarning();

        //this.mountOQLTextEditor();

        //this.mountExpressionTab();


    }

    private mountOQLTextEditor() {

        const target = $('<div class="cbioportal-frontend"></div>').insertBefore("#tabs");

        ReactDOM.render(
            <Observer>
                {
                    () => {
                        return <OQLEditor
                            oqlQuery={this.resultsViewPageStore.oqlQuery}
                            onChange={(oql: string) => this.resultsViewPageStore.setOQL(oql)}
                        />
                    }
                }
            </Observer>
            ,
            target[0]
        );

    }

    private mountExpressionTab() {
        const target = $('<div class="cbioportal-frontend"></div>').insertBefore("#tabs");

        ReactDOM.render(
            (<Observer>
                {
                    () => {
                        if (this.resultsViewPageStore.studies.isComplete && this.resultsViewPageStore.genes.isComplete) {
                            return <ExpressionWrapper
                                genes={this.resultsViewPageStore.genes.result.map((gene: Gene) => gene.hugoGeneSymbol)}
                                studyIds={this.resultsViewPageStore.studyIds.result!}></ExpressionWrapper>
                        } else {
                            return <span>Loading Expression</span>;
                        }
                    }
                }
            </Observer>)
            ,
            target[0]
        );
    }

    private mountOverlappingStudiesWarning() {

        const target = $('<div class="cbioportal-frontend"></div>').insertBefore("#tabs");

        ReactDOM.render(
            <Observer>
                {
                    () => {
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

    private handleTabChange(id: string) {

        this.props.routing.updateRoute({ tab: id });

    }

    public exposeComponentRenderersToParentScript(props: IResultsViewPageProps) {

        exposeComponentRenderer('renderQuerySummary',
            () => {
                return <QuerySummary queryStore={props.queryStore} store={this.resultsViewPageStore}/>
            }
        );

        exposeComponentRenderer('renderMutExTab', () => {

            return (<div>
                <MutualExclusivityTab store={this.resultsViewPageStore}/>
            </div>)
        });

    }

    public render() {

        return (

            <div>

                <If condition={this.resultsViewPageStore.currentQuery}>
                    <div>

                        <div style={{marginBottom:8}}>
                            <QuerySummary queryStore={this.props.queryStore} className={'contentWidth'} onSubmit={()=>alert('nora')} store={this.resultsViewPageStore}/>
                        </div>

                    <MSKTabs activeTabId={this.props.routing.location.query.tab}  onTabClick={(id:string)=>this.handleTabChange(id)} className="mainTabs">
                        <MSKTab key={0} id="oncoprintTab" linkText="Oncoprint">
                                <ResultsViewOncoprint
                                    divId={'oncoprintContainer'}
                                    store={this.resultsViewPageStore}
                                    routing={this.props.routing}
                                />
                        </MSKTab>
                        <MSKTab key={1} id="cancerTypesSummaryTab" linkText="Cancer Types Summary">
                            <CancerSummaryContainer store={this.resultsViewPageStore}/>
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
                    </MSKTabs>
                    </div>
                </If>

                <If condition={this.showQuerySelector}>
                    <QueryAndDownloadTabs onSubmit={()=>this.showQuerySelector = false} store={this.props.queryStore}/>
                </If>

            </div>
        )

    }
}
