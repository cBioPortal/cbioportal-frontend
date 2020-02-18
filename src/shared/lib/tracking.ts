import $ from 'jquery';
import AppConfig from 'appConfig';
import { getBrowserWindow, isWebdriver } from 'cbioportal-frontend-commons';
import * as _ from 'lodash';
import { log } from './consoleLog';
import { StudyViewPageStore } from '../../pages/studyView/StudyViewPageStore';

export type GAEvent = {
    category:
        | 'studyPage'
        | 'resultsView'
        | 'quickSearch'
        | 'download'
        | 'groupComparison'
        | 'homePage'
        | 'patientView';
    action: string;
    label?: string | string[];
    fieldsObject?: { [key: string]: string | number };
};

export function initializeTracking() {
    if (!_.isEmpty(AppConfig.serverConfig.google_analytics_profile_id)) {
        embedGoogleAnalytics(AppConfig.serverConfig.google_analytics_profile_id!);
    }

    $('body').on('click', '[data-event]', el => {
        try {
            const event: GAEvent = JSON.parse($(el.currentTarget).attr('data-event')!) as GAEvent;
            trackEvent(event);
        } catch (ex) {}
    });
}

export function trackEvent(event: GAEvent) {
    getGAInstance()('send', 'event', event.category, event.action, event.label, event.fieldsObject);
}

export function serializeEvent(gaEvent: GAEvent) {
    // when we send arrays of values as single event properties to google analytics
    // we want to send them as comma delimitted strings WITH trailing commas to allow us to filter in analytics
    // without risk of catching substring matches (e.g. tcga_brca, tcga_brca_2018)
    // this is annoying to do on one off basis, so this is a little helper transform
    const arraysToString = _.mapValues(gaEvent, val => {
        if (_.isArray(val)) {
            return val.join(',') + ','; // add trailing comma
        } else {
            return val;
        }
    });

    try {
        return JSON.stringify(arraysToString);
    } catch (ex) {}
}

function sendToLoggly() {
    try {
        if (window.location.hostname === 'www.cbioportal.org') {
            const LOGGLY_TOKEN = 'b7a422a1-9878-49a2-8a30-2a8d5d33518f';

            $.ajax({
                url: `//logs-01.loggly.com/inputs/${LOGGLY_TOKEN}.gif`,
                data: {
                    location: window.location.href.replace(/#.*$/, ''),
                    message: 'PAGE_VIEW',
                    e2e: isWebdriver() ? 'true' : 'false',
                },
            });
        }
    } catch (ex) {
        // do nothing
    }
}

export function embedGoogleAnalytics(ga_code: string) {
    $(document).ready(function() {
        $('<script async src="https://www.google-analytics.com/analytics.js"></script>').appendTo(
            'body'
        );
        $(
            '<script async src="https://cdnjs.cloudflare.com/ajax/libs/autotrack/2.4.1/autotrack.js"></script>'
        ).appendTo('body');
        getBrowserWindow().ga =
            getBrowserWindow().ga ||
            function() {
                (ga.q = ga.q || []).push(arguments);
            };
        const ga: UniversalAnalytics.ga = getBrowserWindow().ga;
        ga.l = +new Date();
        ga('create', ga_code, 'auto');

        ga('require', 'urlChangeTracker', {
            hitFilter: function(model: any) {
                sendToLoggly();
            },
        });

        ga('require', 'cleanUrlTracker', {
            stripQuery: true,
            trailingSlash: 'remove',
        });
        ga('send', 'pageview');
        sendToLoggly();
    });
}

export function sendSentryMessage(msg: string) {
    log('sentry message', msg);
    if ((window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(msg));
    }
}

export function getGAInstance(): UniversalAnalytics.ga {
    const ga: UniversalAnalytics.ga = getBrowserWindow().ga;

    return ga || function() {};
}

let queryCount = 0;

export enum GACustomFieldsEnum {
    QueryCount = 'metric1',
    OQL = 'dimension1',
    StudyCount = 'metric2',
    Genes = 'dimension2',
    VirtualStudy = 'dimension3',
    StudyId = 'dimension4',
    GroupCount = 'metric3',
}

export function trackQuery(
    cancerStudyIds: string[],
    oql: string,
    geneSymbols: string[],
    isVirtualStudy: boolean
) {
    const qCount = queryCount++;

    getGAInstance()('send', 'event', 'resultsView', 'queryCount', qCount);

    getGAInstance()('send', 'event', 'resultsView', 'query', cancerStudyIds.join(',') + ',', {
        [GACustomFieldsEnum.QueryCount]: qCount,
        [GACustomFieldsEnum.OQL]: oql,
        [GACustomFieldsEnum.StudyCount]: cancerStudyIds.length,
        [GACustomFieldsEnum.Genes]: geneSymbols.join(',') + ',',
        [GACustomFieldsEnum.VirtualStudy]: isVirtualStudy.toString(),
    });
}

export function trackPatient(studyId: string): void {
    trackEvent({
        category: 'patientView',
        action: 'patientViewed',
        label: studyId,
    });
}

export function trackStudyViewFilterEvent(label: string, store: StudyViewPageStore) {
    trackEvent({
        category: 'studyPage',
        action: 'addFilter',
        label: label,
        fieldsObject: {
            [GACustomFieldsEnum.StudyId]: store.queriedPhysicalStudyIds.result.join(',') + ',',
        },
    });
}
