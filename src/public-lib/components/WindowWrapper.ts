import autobind from "autobind-decorator";
import _ from 'lodash';
import {action, observable} from 'mobx';
import {isWebdriver} from "../lib/webdriverUtils";

export interface WindowSize {
    width: number,
    height: number
}

export default class WindowWrapper
{
    @observable public size: WindowSize;

    private handleWindowResize = isWebdriver() ? this.setWindowSize : _.debounce(this.setWindowSize, 500);
    private windowObj: any;

    constructor() {
        if (typeof window === 'object') {
            this.windowObj = window;
            this.setWindowSize();
            this.windowObj.addEventListener("resize", this.handleWindowResize)
        }
    }

    @autobind
    @action
    private setWindowSize() {
        this.size = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight
        };
    }
}
