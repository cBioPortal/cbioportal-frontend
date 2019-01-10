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

type MobxView_await = ()=>({status:"complete"|"error"|"pending"}[]);
type MobxView_forcePending = ()=>boolean;
type MobxView_render = ()=>JSX.Element;
export type MobxViewAlwaysComponent = MobxView & { component:JSX.Element };

export function MakeMobxView(params:{
    await: MobxView_await,
    render: MobxView_render,
    renderError:MobxView_render,
    renderPending:MobxView_render,
    forcePending?:MobxView_forcePending
}):MobxViewAlwaysComponent;

export function MakeMobxView(params:{
    await: MobxView_await,
    render: MobxView_render,
    renderError?:MobxView_render,
    renderPending?:MobxView_render,
    forcePending?:MobxView_forcePending
}):MobxView;

export function MakeMobxView(params:{
    await: MobxView_await,
    render: MobxView_render,
    renderError?:MobxView_render,
    renderPending?:MobxView_render,
    forcePending?:MobxView_forcePending
}):MobxView {
    return observable({
        get status() {
            const awaitElements = params.await();
            const promiseStatus = getMobxPromiseGroupStatus(...awaitElements) as any;
            if (params.forcePending && params.forcePending() && promiseStatus === "complete") {
                return "pending";
            } else {
                return promiseStatus;
            }
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