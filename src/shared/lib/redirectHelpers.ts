import ExtendedRouterStore from "./ExtendedRouterStore";

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