export interface ITabConfiguration {
    id:string;
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