import * as React from 'react';
import * as _ from 'lodash';
import {observer, inject, Observer} from "mobx-react";
import {reaction, computed} from "mobx";
import validateParameters from 'shared/lib/validateParameters';
import ValidationAlert from "shared/components/ValidationAlert";
import AjaxErrorModal from "shared/components/AjaxErrorModal";
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import CancerSummaryContainer from "shared/components/cancerSummary/CancerSummaryContainer";
import Mutations from "./mutation/Mutations";
import {stringListToSet} from "../../shared/lib/StringUtils";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import Chart from 'chart.js';

(Chart as any).plugins.register({
    beforeDraw: function(chartInstance:any) {
        const ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
});

function initStore(){

    const resultsViewPageStore = new ResultsViewPageStore();

    // following is a bunch of dirty stuff necessary to read state from jsp page
    // ultimate we will phase this out and this information will be stored in router etc.
    const qSession:any = (window as any).QuerySession;
    var props = {
        genes: qSession.getQueryGenes()
    };
    var samplesSpecification:any = [];
    if (["-1", "all"].indexOf(qSession.getCaseSetId()) > -1) {
        // "-1" means custom case id, "all" means all cases in the queried stud(y/ies). Neither is an actual case set that could eg be queried
        var studyToSampleMap = qSession.getStudySampleMap();
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
        var studyToSampleListIdMap = qSession.getStudySampleListMap();
        var studies = Object.keys(studyToSampleListIdMap);
        for (var i=0; i<studies.length; i++) {
            samplesSpecification.push({
                sampleListId: studyToSampleListIdMap[studies[i]],
                studyId: studies[i]
            });
        }
    }

    resultsViewPageStore.samplesSpecification = samplesSpecification;
    resultsViewPageStore.hugoGeneSymbols = qSession.getQueryGenes();
    resultsViewPageStore.selectedMolecularProfileIds = qSession.getGeneticProfileIds();
    resultsViewPageStore.rppaScoreThreshold = qSession.getRppaScoreThreshold();
    resultsViewPageStore.zScoreThreshold = qSession.getZScoreThreshold();
    resultsViewPageStore.oqlQuery = qSession.oql_query;

    return resultsViewPageStore;

}

const resultsViewPageStore = initStore();
(window as any).resultsViewPageStore = resultsViewPageStore;


export interface IResultsViewPageProps {
    routing: any;
}

type MutationsTabInitProps = {
    genes: string[];
    samplesSpecification:SamplesSpecificationElement[]
};

@inject('routing')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    constructor(props: IResultsViewPageProps) {
        super();
        this.exposeComponentRenderersToParentScript();
    }

    componentDidMount(){


    }

    public exposeComponentRenderersToParentScript(){

        exposeComponentRenderer('renderMutationsTab',
            (props:MutationsTabInitProps)=>{
                return <div>
                    <AjaxErrorModal
                        show={(resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={()=>{ resultsViewPageStore.clearErrors() }}
                    />
                    <Mutations genes={props.genes} store={resultsViewPageStore}/>
                </div>
        });

        exposeComponentRenderer('renderCancerTypeSummary',
            (props:MutationsTabInitProps)=>{
                return <div>
                    <AjaxErrorModal
                        show={(resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={()=>{ resultsViewPageStore.clearErrors() }}
                    />
                    <CancerSummaryContainer store={resultsViewPageStore} />
                </div>
            });


        exposeComponentRenderer('renderMutExTab', () => {

            return (<div>
                <MutualExclusivityTab store={resultsViewPageStore}/>
            </div>)
        });



    }

    public render() {

        return null;

    }
}
