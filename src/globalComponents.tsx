import React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import RightBar from "./shared/components/rightbar/RightBar";
import {QueryStore} from "./shared/components/query/QueryStore";
import QueryModal from "./shared/components/query/QueryModal";
import QueryAndDownloadTabs from "./shared/components/query/QueryAndDownloadTabs";

const queryStore = new QueryStore(window.location.href);

exposeComponentRenderer('renderRightBar', ()=>{
    return <RightBar/>
});

exposeComponentRenderer('renderQuerySelectorInModal', ()=><QueryModal store={queryStore} />);

exposeComponentRenderer('renderQuerySelector', (props:{[k:string]:string|boolean|number})=>{
    return <QueryAndDownloadTabs {...props} store={queryStore} />
});
