import $ from 'jquery';
import AppConfig from "appConfig";
import getBrowserWindow from "./getBrowserWindow";
import * as _ from 'lodash';
import {log} from "./consoleLog";


export function initializeTracking(){

    if (!_.isEmpty(AppConfig.serverConfig.google_analytics_profile_id)) {
        embedGoogleAnalytics(AppConfig.serverConfig.google_analytics_profile_id!);
    }

}

export function embedGoogleAnalytics(ga_code:string){

    $(document).ready(function() {
        $('<script async src="https://www.google-analytics.com/analytics.js"></script>').appendTo("body");
        $('<script async src="https://cdnjs.cloudflare.com/ajax/libs/autotrack/2.4.1/autotrack.js"></script>').appendTo("body");
        getBrowserWindow().ga=getBrowserWindow().ga||function(){(ga.q=ga.q||[]).push(arguments)};
        const ga:UniversalAnalytics.ga = getBrowserWindow().ga;
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

export function sendSentryMessage(msg:string) {
    log("sentry message", msg);
    if ((window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(msg));
    }
}

export function getGAInstance(): UniversalAnalytics.ga {

    const ga:UniversalAnalytics.ga = getBrowserWindow().ga;

    return ga || function(){};

}

let queryCount = 0;

enum GACustomFieldsEnum {
  QueryCount = "metric1",
  OQL = "dimension1",
  StudyCount = "metric2",
  Genes = "dimension2",
  VirtualStudy = "dimension3"
};


export function trackQuery(cancerStudyIds:string[], oql:string, geneSymbols:string[], isVirtualStudy:boolean){

    const qCount = queryCount++;

    getGAInstance()('send','event','resultsView','queryCount',qCount);

    getGAInstance()('send', 'event', 'resultsView', 'query', cancerStudyIds.join(",")+",", {
        [GACustomFieldsEnum.QueryCount]:qCount,
        [GACustomFieldsEnum.OQL]:oql,
        [GACustomFieldsEnum.StudyCount]:cancerStudyIds.length,
        [GACustomFieldsEnum.Genes]:geneSymbols.join(",")+",",
        [GACustomFieldsEnum.VirtualStudy]: isVirtualStudy.toString()
    });
}