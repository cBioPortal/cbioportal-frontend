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

function initStore(){

    const resultsViewPageStore = new ResultsViewPageStore();

    // following is a bunch of dirty stuff necessary to read state from jsp page
    // ultimate we will phase this out and this information will be stored in router etc.
    const qSession:any = (window as any).QuerySession;
    var props = {
        genes: qSession.getQueryGenes()
    };
    var samplesSpecification = [];
    if (["-1", "all"].indexOf(qSession.getCaseSetId()) > -1) {
        // "-1" means custom case id, "all" means all cases in the queried stud(y/ies). Neither is an actual case set that could eg be queried
        var studyToSampleMap = qSession.getStudySampleMap();
        var studies = Object.keys(studyToSampleMap);
        for (var i=0; i<studies.length; i++) {
            var study = studies[i];
            samplesSpecification = samplesSpecification.concat(studyToSampleMap[study].map(function(sampleId) {
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

    _.each(props.genes, (gene:string)=>resultsViewPageStore.getMutationMapperStore(gene));

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

        // const reaction1 = reaction(
        //     () => props.routing.location.query,
        //     query => {
        //
        //         const validationResult = validateParameters(query, ['studyId']);
        //
        //         if (validationResult.isValid) {
        //             resultsViewPageStore.urlValidationError = null;
        //
        //             resultsViewPageStore.studyId = query.studyId;
        //
        //             if ('sampleListId' in query) {
        //                 resultsViewPageStore.sampleListId = query.sampleListId as string;
        //             }
        //
        //             // TODO we may want to split by ","
        //
        //             if ('sampleList' in query) {
        //                 resultsViewPageStore.sampleList = (query.sampleList as string).split(" ");
        //             }
        //
        //             if ('geneList' in query) {
        //                 resultsViewPageStore.hugoGeneSymbols = (query.geneList as string).split(" ");
        //             }
        //         }
        //         else {
        //             resultsViewPageStore.urlValidationError = validationResult.message;
        //         }
        //
        //     },
        //     { fireImmediately:true }
        // );
    }

    componentDidMount(){


    }

    public exposeComponentRenderersToParentScript(){

        exposeComponentRenderer('renderMutationsTab',
            (props:MutationsTabInitProps)=>{
                resultsViewPageStore.hugoGeneSymbols = props.genes;
                resultsViewPageStore.samplesSpecification = props.samplesSpecification;

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
                //resultsViewPageStore.hugoGeneSymbols = props.genes;
                //resultsViewPageStore.samplesSpecification = props.samplesSpecification;

                return <div>
                    <AjaxErrorModal
                        show={(resultsViewPageStore.ajaxErrors.length > 0)}
                        onHide={()=>{ resultsViewPageStore.clearErrors() }}
                    />
                    <CancerSummaryContainer store={resultsViewPageStore} />
                </div>
            });


        exposeComponentRenderer('renderMutExTab', () => {

            // const qSession:any = (window as any).QuerySession;
            //
            // var props:any = {
            //     genes: qSession.getQueryGenes()
            // };
            //
            // var samplesSpecification: any = [];
            // if (["-1", "all"].indexOf(qSession.getCaseSetId()) > -1) {
            //     // "-1" means custom case id, "all" means all cases in the queried stud(y/ies). Neither is an actual case set that could eg be queried
            //     var studyToSampleMap = qSession.getStudySampleMap();
            //     var studies = Object.keys(studyToSampleMap);
            //     for (var i=0; i<studies.length; i++) {
            //         var study: any = studies[i];
            //         samplesSpecification = samplesSpecification.concat(studyToSampleMap[study].map(function(sampleId:any) {
            //             return {
            //                 sampleId: sampleId,
            //                 studyId: study
            //             };
            //         }));
            //     }
            // } else {
            //     //var studyToSampleListIdMap = qSession.getStudySampleListMap();
            //
            //     var studyToSampleListIdMap:any = {};
            //     studyToSampleListIdMap[qSession.getCancerStudyIds()[0]] = qSession.getCaseSetId();
            //

                {/*var studies = Object.keys(studyToSampleListIdMap);*/}
                {/*for (var i=0; i<studies.length; i++) {*/}
                    {/*samplesSpecification.push({*/}
                        {/*sampleListId: studyToSampleListIdMap[studies[i]],*/}
                        {/*studyId: studies[i]*/}
                    {/*});*/}
                {/*}*/}
            {/*}*/}
            {/*resultsViewPageStore.samplesSpecification = samplesSpecification;*/}
            {/*resultsViewPageStore.hugoGeneSymbols = qSession.getQueryGenes();*/}
            {/*resultsViewPageStore.selectedMolecularProfileIds = qSession.getGeneticProfileIds();*/}
            {/*resultsViewPageStore.rppaScoreThreshold = qSession.getRppaScoreThreshold();*/}
            // resultsViewPageStore.zScoreThreshold = qSession.getZScoreThreshold();
            // resultsViewPageStore.oqlQuery = qSession.oql_query;
            //
            // _.each(props.genes, (gene:string)=>resultsViewPageStore.getMutationMapperStore(gene));

            return (<div>
                <MutualExclusivityTab store={resultsViewPageStore}/>
            </div>)
        });



    }

    public render() {

        return null;

        //
        // return null;
        //
        // if (resultsViewPageStore.urlValidationError) {
        //     return <ValidationAlert urlValidationError={resultsViewPageStore.urlValidationError} />;
        // }
        //
        // return (
        //     <div className="resultsViewPage">
        //         <AjaxErrorModal
        //             show={(resultsViewPageStore.ajaxErrors.length > 0)}
        //             onHide={()=>{ resultsViewPageStore.clearErrors() }}
        //         />
        //
        //         <Mutations
        //             genes={resultsViewPageStore.hugoGeneSymbols || []}
        //             store={resultsViewPageStore}
        //             routing={this.props.routing}
        //         />
        //     </div>
        // );
    }
}
