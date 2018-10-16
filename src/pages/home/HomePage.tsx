import * as React from 'react';
import * as _ from 'lodash';
import {If, Then, Else} from 'react-if';
import {observer, inject, Observer } from "mobx-react";
import { observable } from 'mobx';
import Chart from 'chart.js';
import AppConfig from 'appConfig';
import 'react-select/dist/react-select.css';
import {CancerStudyQueryUrlParams, QueryStore} from "../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import RightBar from "../../shared/components/rightbar/RightBar";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import {SampleList} from "../../shared/api/generated/CBioPortalAPI";
import setWindowVariable from "../../shared/lib/setWindowVariable";

(Chart as any).plugins.register({
    beforeDraw: function (chartInstance: any) {
        const ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
});

const win = (window as any);

export interface IResultsViewPageProps {
    routing: any;
}

export function createQueryStore() {

    const win:any = window;

    // lets make query Store since it's used in a lot of places
    const queryStore = new QueryStore(win, getBrowserWindow().routingStore.query);

    queryStore.singlePageAppSubmitRoutine = function(path:string, query:CancerStudyQueryUrlParams) {

        // normalize this
        query.cancer_study_list = query.cancer_study_list || query.cancer_study_id;
        delete query.cancer_study_id;

        // // sometimes the submitted case_set_id is not actually a case_set_id but
        // // a category of case set ids (e.g. selected studies > 1 and case category selected)
        // // in that case, note that on the query
        // if (["w_mut","w_cna","w_mut_cna"].includes(query.case_set_id)) {
        //     query.sample_list_category = query.case_set_id;
        // }

        // need to come up with better place to put app globals (things used by different routes)
        win.currentQueryStore = queryStore;
        win.routingStore.updateRoute(query, "results", true);

    };

    return queryStore;

}

@inject('routing')
@observer
export default class HomePage extends React.Component<IResultsViewPageProps, {}> {

    @observable showQuerySelector = true;

    queryStore:QueryStore;

    constructor(props: IResultsViewPageProps) {
        super(props);
    }

    componentWillMount(){
        this.queryStore = createQueryStore();
        setWindowVariable("homePageQueryStore", this.queryStore);
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    public render() {

        return (
            <PageLayout noMargin={true} rightBar={<RightBar queryStore={this.queryStore} />}>
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