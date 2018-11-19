import $ from 'jquery';
import AppConfig from "appConfig";
import getBrowserWindow from "./getBrowserWindow";
import * as _ from 'lodash';


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

export function sendSentryMessage(msg:string) {
    if ((window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(msg));
    }
}