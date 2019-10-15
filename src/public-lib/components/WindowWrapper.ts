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
    @observable public sizeByMs:{
        _0: WindowSize,
        _500: WindowSize
    } = {
        _0: { width:-1, height:-1},
        _500: { width:-1, height:-1}
    };

    private setWindowSize = _.debounce(this._setWindowSize, 200);
    private setWindowSize500Ms = _.debounce(this._setWindowSize500Ms, 500);
    private windowObj: any;

    constructor() {
        if (typeof window === 'object') {
            this.windowObj = window;
            this._setWindowSize();
            this._setWindowSize500Ms();
            this.setWindowSize0Ms();
            this.windowObj.addEventListener("resize", this.handleWindowResize);
        }
    }

    @autobind
    @action
    private handleWindowResize() {
        this.setWindowSize();
        this.setWindowSize0Ms();
        this.setWindowSize500Ms();
    }

    @autobind
    @action
    private _setWindowSize() {
        this.size = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight
        };
    }

    @autobind
    @action
    private setWindowSize0Ms() {
        this.sizeByMs._0 = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight
        };
    }

    @autobind
    @action
    private _setWindowSize500Ms() {
        this.sizeByMs._500 = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight
        };
    }
}
