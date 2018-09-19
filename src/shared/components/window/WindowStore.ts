import {action, observable} from 'mobx';
import _ from 'lodash';
import { bind } from 'bind-decorator';

export interface WindowSize {
    width: number,
    height: number
}

class WindowStore {
    constructor() {
        if (typeof window === 'object') {
            this.windowObj = window;
            this.setWindowSize();
            this.windowObj.addEventListener("resize", this.handleWindowResize)
        }
    }

    @bind
    @action
    private setWindowSize() {
        this.size = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight
        };
    }

    private handleWindowResize = _.debounce(this.setWindowSize, 200);
    private windowObj: any;

    @observable size: WindowSize
}

export default new WindowStore();