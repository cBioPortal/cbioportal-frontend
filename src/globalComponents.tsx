import React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import RightBar from "./shared/components/rightbar/RightBar";
import {QueryStore} from "./shared/components/query/QueryStore";
import QueryModal from "./shared/components/query/QueryModal";
import QueryAndDownloadTabs from "./shared/components/query/QueryAndDownloadTabs";

const queryStore = new QueryStore(window.location.href);

(window as any).addGenesAndSubmitQuery = queryStore.addGenesAndSubmit.bind(queryStore);

exposeComponentRenderer('renderRightBar', ()=>{
    return <RightBar/>
});

exposeComponentRenderer('renderQuerySelectorInModal', ()=><QueryModal store={queryStore} />);

exposeComponentRenderer('renderQuerySelector', (props:{[k:string]:string|boolean|number})=>{
    return <QueryAndDownloadTabs {...props} store={queryStore} />
});

// exposeComponentRenderer('renderMutationsTab', (props:{genes:string[], studyId:string, samples:string[]|string})=>{
//     const resultsViewPageStore = new ResultsViewPageStore();
//     resultsViewPageStore.hugoGeneSymbols = props.genes;
//     resultsViewPageStore.studyId = props.studyId;
//     if (typeof props.samples === "string") {
//         resultsViewPageStore.sampleListId = props.samples;
//     } else {
//         resultsViewPageStore.sampleList = props.samples;
//     }
//
//     return <Mutations genes={props.genes} store={resultsViewPageStore}/>
// });