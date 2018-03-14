import React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import RightBar from "./shared/components/rightbar/RightBar";
import QueryAndDownloadTabs from "./shared/components/query/QueryAndDownloadTabs";
import {QueryStore} from "./shared/components/query/QueryStore";
import formSubmit from "shared/lib/formSubmit";
import {getStudySummaryUrl} from "./shared/api/urls";
import {genes} from "shared/lib/oql/oqlfilter.js"

class GlobalStores {

    public static get queryStore() : QueryStore {
        return (window as any).globalStores.queryStore;
    }

}
(window as any).frontendVars = {};

(window as any).getStudySummaryUrl = getStudySummaryUrl;
(window as any).frontendVars.oqlGenes = (oqlQuery:string)=>{
    return genes(oqlQuery);
};

exposeComponentRenderer('renderRightBar', ()=> {
    return <RightBar store={GlobalStores.queryStore} />;
});

exposeComponentRenderer('renderQuerySelector', (props:{[k:string]:string|boolean|number})=> {
    (window as any).addGenesAndSubmitQuery = GlobalStores.queryStore.addGenesAndSubmit.bind(GlobalStores.queryStore);
    return <QueryAndDownloadTabs {...props} store={GlobalStores.queryStore} />;
});

(window as any).formSubmit = formSubmit;
