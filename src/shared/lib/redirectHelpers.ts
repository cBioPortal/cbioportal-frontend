import ExtendedRouterStore from "./ExtendedRouterStore";
import getBrowserWindow from "./getBrowserWindow";

export function restoreRouteAfterRedirect(injected: { routing:ExtendedRouterStore }){

    const key = injected.routing.location.query.key;
    let restoreRoute = window.localStorage.getItem(key);
    if (restoreRoute) {
        restoreRoute = restoreRoute.replace(/^#/, '');
        window.localStorage.removeItem(key);
        injected.routing.push(restoreRoute);
    } else {
        injected.routing.push('/');
    }
    return null;

}


export function handleLegacySubmission(){
    const legacySubmission = localStorage.getItem("legacyStudySubmission");
    localStorage.removeItem("legacyStudySubmission");
    if (legacySubmission) {
        const parsedSubmission:any = JSON.parse(legacySubmission);
        if (parsedSubmission.Action) {
            (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(parsedSubmission, "results");
        }
    }
}
