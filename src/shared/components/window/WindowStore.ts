import {action, observable} from 'mobx';
import _ from 'lodash';

export interface WindowSize {
    width: number,
    height: number
}

class WindowStore {
    constructor() {
        if (typeof window === 'object') {
            this.window = window;
            this.getWindowSize();
            this.window.addEventListener("resize", this.handleWindowResize)
        }
    }

    @action
    private getWindowSize() {
        this.size = {
            width: this.window.innerWidth,
            height: this.window.innerHeight
        };
    }

    private handleWindowResize = _.debounce(this.getWindowSize, 1000);

    @observable size: WindowSize
    @observable window: any;
}

export default new WindowStore();