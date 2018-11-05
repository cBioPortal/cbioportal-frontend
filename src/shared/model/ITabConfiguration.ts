import {ResultsViewTab} from "../../pages/resultsView/ResultsViewPageHelpers";
export interface ITabConfiguration {
    id:ResultsViewTab;
    getTab:()=>JSX.Element;
    hide?:()=>boolean;
}

export interface ICustomTabConfiguration {
    title: string,
    location: string,
    mountCallbackName: string,
    pathsToJs:string[],
    showWithMultipleStudies: boolean,
    customParameters: {[key:string]:any},
    unmountOnHide:boolean,
    dependencyPromise?: Promise<any>
}