import analytics from 'universal-ga';
import $ from 'jquery';
import * as _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import AppConfig from "appConfig";

interface trackingCodes {
  ga?:string;
  mixpanel?:string;
};

export function getGAInstance(){
    return analytics.name('newGA');
}

const win = (window as any);

function setCustomTrackingEvents(){

    // tabs on result page

    $('#tabs').on('click','.ui-tabs-nav a', function(){
        getGAInstance().screenview($(this).text() + ' tab');
        getGAInstance().event('results tab', 'show', { eventLabel: $(this).text()  });
        const studies = _.map(win.resultsViewPageStore.studies.result,'studyId').join(',');
        mixpanel.track(`results tab clicked (${$(this).text()})`,{ tab:$(this).text() ,studyIds:studies });
    });

    $("#pancancer_study_summary").on('click','.pillTabs a', (e)=>{
        const text = $(e.currentTarget).text();
        const studies = _.map(win.resultsViewPageStore.studies.result,'studyId').join(',');
        mixpanel.track(`cancer type summary gene tab (${text})`,{ tab:text, studyIds:studies });
    });


    if ($(".studyContainer").length > 0) {

        const matches = window.location.search.match(/id=([a-z_]*)/);
        const studyName = (matches && matches[1]) ? matches[1] : "";

        let interactionCount = 0;

        $(".studyContainer").on("click",".dc-chart",(e)=>{

            getGAInstance().event('study view filter', 'click', {
                eventLabel: e.currentTarget.id,
                dimension1: studyName,
                metric1:interactionCount
            });
            interactionCount++;
        });

        $("body").on("click","div[id^='qtip-chart-']",(e)=>{
            getGAInstance().event('study view filter', 'click', {
                eventLabel: e.currentTarget.id,
                dimension1: studyName,
                metric1: interactionCount
            });
            interactionCount++;
        });

        $(".studyContainer").on("click",
            "#iviz-header-left-patient-select, .share-virtual-study, #iviz-header-left-patient-select, #iviz-header-left-case-download, #iviz-header-left-1, #custom-case-input-button, #iviz_add_chart_chosen",
            (e)=>{
                var name = e.currentTarget.id || e.currentTarget.className;
                getGAInstance().event('study view button', 'click', {
                    eventLabel: name,
                    dimension1: studyName
                });
            }
        );


    }


}

const conditions = [

    {
        condition: ()=>{
            return (AppConfig.apiRoot === 'www.cbioportal.org/beta' && window.location.href.includes('www.cbioportal.org/beta'));
        },
        trackingCodes: ()=>{
            return {
                ga:'UA-85438068-2',
                mixpanel:'fe5a4629e3391288f7853a40a5e42add'
            }
        }
    },

    {
        condition: ()=>{
            return (window.location.hostname.includes('localhost'));
        },
        trackingCodes: ()=>{
            return {
                ga:'UA-85438068-2',
                mixpanel:'fe5a4629e3391288f7853a40a5e42add'
            }
        }
    },

    {
        condition: ()=>{
            return AppConfig.apiRoot === 'www.cbioportal.org' && window.location.href.includes('www.cbioportal.org')
        },
        trackingCodes: (location:string)=>{
            return {
                ga:'UA-85438068-1',
                mixpanel:'aa2957fc9e25a02b338b9624e285dcc3'
            }
        }
    },

];


let trackingEnabled = false;

/*
 * for simplicity all tracking code fires on all instances of portal
 * but actual calls to google api are only made for given hosts
 */
function activateAnalytics(){
    let trackingCodes: trackingCodes | undefined;

    conditions.forEach((config:any)=>{ trackingCodes = trackingCodes || ((config.condition()) ? config.trackingCodes() : undefined) });

    if (trackingCodes && !localStorage.e2etest) {

        trackingEnabled = true;
        const debugTracking = localStorage.debugTracking;

        //mixpanel
        mixpanel.init(trackingCodes.mixpanel, { debug:!!debugTracking });
        var userId = localStorage.getItem('mixPanelUserId');
        if (!userId){
            userId = 'anonymous' + Math.round(Math.random() * 1000000000)
            userId = userId.toString()
            localStorage.setItem('mixPanelUserId', userId)
        }
        mixpanel.identify(userId);
        mixpanel.people.set_once('$first_name', userId);

        // google analytics
        analytics.initialize(trackingCodes.ga,{ debug:!!debugTracking });
        analytics.create(trackingCodes.ga, { name:'newGA', debug:!!debugTracking });

        $(document).ready(function(){
            setCustomTrackingEvents();
        });

    }

}

activateAnalytics();
