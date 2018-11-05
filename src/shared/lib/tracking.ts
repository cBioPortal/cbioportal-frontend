import $ from 'jquery';
import AppConfig from "appConfig";
import getBrowserWindow from "./getBrowserWindow";
import * as _ from 'lodash';
import {CancerStudyQueryUrlParams} from "../components/query/QueryStore";
import {ResultsViewPageStore} from "../../pages/resultsView/ResultsViewPageStore";


export function initializeTracking(){

    if (!_.isEmpty(AppConfig.serverConfig.google_analytics_profile_id)) {
        embedGoogleAnalytics(AppConfig.serverConfig.google_analytics_profile_id!);
    }

    if (!_.isEmpty(AppConfig.serverConfig.loggly_api_key)) {
        embedLoggly(AppConfig.serverConfig.loggly_api_key!);
    }
    //

}

export function embedGoogleAnalytics(ga_code:string){

    $(document).ready(function() {
        $('<script async src="https://www.google-analytics.com/analytics.js"></script>').appendTo("body");
        $('<script async src="https://cdnjs.cloudflare.com/ajax/libs/autotrack/2.4.1/autotrack.js"></script>').appendTo("body");
        getBrowserWindow().ga=getBrowserWindow().ga||function(){(ga.q=ga.q||[]).push(arguments)};
        const ga:any = getBrowserWindow().ga;
        ga.l=+new Date;
        ga('create', ga_code, 'auto');
        ga('require', 'urlChangeTracker');
        ga('require', 'cleanUrlTracker', {
            stripQuery:true,
            trailingSlash:'remove'
        });
        ga('send', 'pageview');
    });
}

export function embedLoggly(logglyKey:string){

    $('<script async src="https://cloudfront.loggly.com/js/loggly.tracker-latest.min.js"></script>').appendTo("body");
    getBrowserWindow()._LTracker = getBrowserWindow()._LTracker || [];
    getBrowserWindow()._LTracker.push({'logglyKey': logglyKey,
        'sendConsoleErrors' : true,
        'tag' : 'loggly-jslogger'  });

}

export function trackLoggyEvent(obj:any){
    if (getBrowserWindow()._LTracker) {
        if (!obj.name) {
            throw("cannot track event with name");
        } else {
            getBrowserWindow()._LTracker.push(obj);
        }
    }
}




export function getGA(){
    return getBrowserWindow().ga;
}

let queryCount = 0;

export function trackQuerySubmission(store:ResultsViewPageStore){
    try {
            //getGA().event('query submission', 'show', { eventLabel: store.  });
            trackLoggyEvent({
                name:"QUERY_SUBMISSION",
                studies:store._selectedStudyIds,
                oql:store.oqlQuery,
                genes:store.hugoGeneSymbols,
                profiles:store.selectedMolecularProfileIds,
                dataPriority:store.profileFilter,
                queryNumber:queryCount++,
                geneCount:store.hugoGeneSymbols.length,
                studyCount:store._selectedStudyIds.length,

            });

    } catch(ex) {}

}