import * as React from 'react';
import {observer, inject } from "mobx-react";
import {reaction, computed} from "mobx";
import validateParameters from 'shared/lib/validateParameters';
import ValidationAlert from "shared/components/ValidationAlert";
import AjaxErrorModal from "shared/components/AjaxErrorModal";
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {ResultsViewPageStore} from "./ResultsViewPageStore";
import Mutations from "./mutation/Mutations";

const resultsViewPageStore = new ResultsViewPageStore();

(window as any).resultsViewPageStore = resultsViewPageStore;

export interface IResultsViewPageProps {
    routing: any;
}

type MutationsTabInitProps = {
    genes: string[];
} & ({
    studyToSampleMap:{[studyId:string]:{[sampleId:string]:boolean}};
    studyToSampleListIdMap:{[studyId:string]:string};
} | {
    studyToSampleMap:undefined;
    studyToSampleListIdMap:{[studyId:string]:string};
});

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

    public exposeComponentRenderersToParentScript(){

        exposeComponentRenderer('renderMutationsTab',
            (props:MutationsTabInitProps)=>{
            resultsViewPageStore.hugoGeneSymbols = props.genes;
            if (props.studyToSampleMap) {
                resultsViewPageStore._studyToSampleIds = props.studyToSampleMap;
            } else if (props.studyToSampleListIdMap) {
                resultsViewPageStore.studyToSampleListId = props.studyToSampleListIdMap;
            }

            return <div>
                         <AjaxErrorModal
                           show={(resultsViewPageStore.ajaxErrors.length > 0)}
                           onHide={()=>{ resultsViewPageStore.clearErrors() }}
                         />
                        <Mutations genes={props.genes} store={resultsViewPageStore}/>
                  </div>
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
