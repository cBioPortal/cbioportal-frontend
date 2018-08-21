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
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import CNSegments from "./cnSegments/CNSegments";
import 'react-select/dist/react-select.css';
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
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import RightBar from "../../shared/components/rightbar/RightBar";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";


const win = (window as any);

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

export function createQueryStore() {

    const win:any = window;

    // lets make query Store since it's used in a lot of places
    const queryStore = new QueryStore(win, getBrowserWindow().routingStore.query);

    queryStore.singlePageAppSubmitRoutine = function(path:string, query:CancerStudyQueryUrlParams) {

        // normalize this
        query.cancer_study_list = query.cancer_study_list || query.cancer_study_id;
        delete query.cancer_study_id;

        // need to come up with better place to put app globals (things used by different routes)
        win.currentQueryStore = queryStore;

        win.routingStore.updateRoute(query, "results");

    };

    return queryStore;

}

@inject('routing')
@observer
export default class SinglePageApp extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;
    private resultsViewPageStore: ResultsViewPageStore;
    @observable showQuerySelector = true;

    @observable currentQuery:boolean;

    queryStore:QueryStore;

    constructor(props: IResultsViewPageProps) {
        super(props);
    }

    componentWillMount(){
        this.queryStore = createQueryStore();
    }

    private handleTabChange(id: string) {

        this.props.routing.updateRoute({ tab: id });

    }

    public render() {

        return (

            <PageLayout rightBar={<RightBar queryStore={this.queryStore} />}>
                <div style={{padding:"0 15px"}}>
                    <p style={{marginBottom:15}}>The cBioPortal for Cancer Genomics provides <b>visualization</b>, <b>analysis</b> and <b>download</b> of large-scale <b>cancer genomics</b> data sets.
                        <br />
                        <b>Please cite</b> <a href="http://www.ncbi.nlm.nih.gov/pubmed/23550210">Gao et al. <i>Sci. Signal.</i> 2013</a> &amp;  <a href="http://cancerdiscovery.aacrjournals.org/content/2/5/401.abstract"> Cerami et al. <i>Cancer Discov.</i> 2012</a> when publishing results based on cBioPortal.</p>
                    <QueryAndDownloadTabs store={this.queryStore}/>
                </div>
                <hr />
            </PageLayout>
        )

    }
}