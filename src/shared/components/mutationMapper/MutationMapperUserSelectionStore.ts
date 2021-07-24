import { action, observable, makeObservable } from 'mobx';
import {
    initDefaultTrackVisibility,
    TrackVisibility,
} from 'react-mutation-mapper';

export default class MutationMapperUserSelectionStore {
    @observable trackVisibility: TrackVisibility;
    @observable columnVisibility: {
        [columnId: string]: boolean;
    };

    constructor() {
        makeObservable(this);
        this.trackVisibility = initDefaultTrackVisibility();
    }

    @action.bound
    public storeColumnVisibility(columnVisibility: {
        [columnId: string]: boolean;
    }) {
        if (
            JSON.stringify(this.columnVisibility) !==
            JSON.stringify(columnVisibility)
        ) {
            this.columnVisibility = columnVisibility;
        }
    }
}
