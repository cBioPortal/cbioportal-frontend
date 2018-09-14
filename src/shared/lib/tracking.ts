import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import AppConfig from "appConfig";

interface trackingCodes {
  ga?:string;
  mixpanel?:string;
};

const win = (window as any);

function setCustomTrackingEvents(){


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

const tracking = {

    trackerName:'newGA',

    trackPageView(){
        if (win.ga && trackingEnabled)
        win.ga(`${this.trackerName}.send`, 'pageview');
    },

    createTracker(code:string){
        if (win.ga && trackingEnabled)
        win.ga('create', code, 'auto', this.trackerName);
    },

};

export default tracking;


/*
 * for simplicity all tracking code fires on all instances of portal
 * but actual calls to google api are only made for given hosts
 */
export function activateAnalytics(){

    let trackingCodes: trackingCodes | undefined;

    conditions.forEach((config:any)=>{ trackingCodes = trackingCodes || ((config.condition()) ? config.trackingCodes() : undefined) });

    if (trackingCodes && !window.navigator.webdriver) {

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

        tracking.createTracker(trackingCodes.ga!);
        tracking.trackPageView();

        $(document).ready(function(){
            setCustomTrackingEvents();
        });

    }

}



