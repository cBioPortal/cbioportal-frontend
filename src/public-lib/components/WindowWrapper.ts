import autobind from "autobind-decorator";
import _ from 'lodash';
import {action, observable} from 'mobx';

export interface WindowSize {
    width: number,
    height: number
}

export default class WindowWrapper
{
    @observable public size: WindowSize;
    @observable public size500Ms: WindowSize;

    private handleWindowResize = _.debounce(this.setWindowSize, 200);
    private handleWindowResize500Ms = _.debounce(this.setWindowSize500Ms, 500);
    private windowObj: any;

    constructor() {
        if (typeof window === 'object') {
            this.windowObj = window;
            this.setWindowSize();
            this.setWindowSize500Ms();
            this.windowObj.addEventListener("resize", this.handleWindowResize);
            this.windowObj.addEventListener("resize", this.handleWindowResize500Ms);
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

    @autobind
    @action
    private setWindowSize500Ms() {
        this.size500Ms = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight
        };
    }
}
