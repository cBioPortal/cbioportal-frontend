import {observable} from "mobx";
import {getMobxPromiseGroupStatus} from "../lib/getMobxPromiseGroupStatus";

export type MobxView = {
    isComplete: boolean;
    isError: boolean;
    isPending: boolean;
} &
({
    status:"pending"|"error";
    component:JSX.Element|undefined;
} | {
    status:"complete"
    component:JSX.Element;
});

export function MakeMobxView(params:{
    await: ()=>({status:"complete"|"error"|"pending"}[]),
    render: ()=>JSX.Element,
    renderError?:()=>JSX.Element,
    renderPending?:()=>JSX.Element
}):MobxView {
    return observable({
        get status() {
            const awaitElements = params.await();
            return getMobxPromiseGroupStatus(...awaitElements) as any;
        },
        get isComplete() {
            return this.status === "complete";
        },
        get isError() {
            return this.status === "error";
        },
        get isPending() {
            return this.status === "pending";
        },
        get component() {
            let ret = undefined;
            switch (this.status) {
                case "complete":
                    ret = params.render();
                    break;
                case "pending":
                    if (params.renderPending) {
                        ret = params.renderPending();
                    }
                    break;
                case "error":
                    if (params.renderError) {
                        ret = params.renderError();
                    }
                    break;
            }
            return ret;
        }
    });
}