import load from 'little-loader';
import getBrowserWindow from "./getBrowserWindow";
import {ICustomTabConfiguration} from "../model/ITabConfiguration";
import {autorun} from "mobx";

export function loadCustomTabDeps(tab:any){
    if (tab.pathsToJs) {
        const proms:Promise<any>[] = [];
        tab.pathsToJs.forEach((str:string)=>{
            const p = new Promise(function(resolve, reject){
                load(str,(err:any)=>{
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
            proms.push(p);
        });

        return Promise.all(proms);
    }
}

export function showCustomTab(div:HTMLDivElement, tab:ICustomTabConfiguration, url:string, store:any){
    tab.dependencyPromise = tab.dependencyPromise || loadCustomTabDeps(tab);

    const runCallback = (tab:ICustomTabConfiguration)=>{
        if (getBrowserWindow()[tab.mountCallbackName]) {
            getBrowserWindow()[tab.mountCallbackName](div, tab, url, store, autorun);
        } else {
            alert(`Callback for tab ${tab.title} not found`);
        }
    }

    tab.dependencyPromise!.then(()=>{
        runCallback(tab);
    });
}