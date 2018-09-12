import {buildCBioPortalPageUrl} from "../api/urls";
import getBrowserWindow from "./getBrowserWindow";

export function openSocialAuthWindow() {

    var _window = getBrowserWindow().open(buildCBioPortalPageUrl('login.jsp'), '', 'width=1000, height=800')!;
    var interval = setInterval(function() {
        try {
            if (_window.closed) {
                clearInterval(interval);
            } else if (_window.document.URL.includes(location.origin) &&
                !_window.document.URL.includes(location.origin + '/auth') &&
                !_window.document.URL.includes('login.jsp')) {
                _window.close();

                setTimeout(function() {
                    clearInterval(interval);
                    if(getBrowserWindow().location.pathname.includes('/study')) {
                        $('#rightHeaderContent').load(' #rightHeaderContent');
                        (getBrowserWindow().iViz as any).vue.manage.getInstance().showSaveButton=true;
                    } else {
                        location.reload();
                    }
                }, 500);
            }
        } catch (err) {
            console.log('Error while monitoring the Login window: ', err);
        }
    }, 1000);
};