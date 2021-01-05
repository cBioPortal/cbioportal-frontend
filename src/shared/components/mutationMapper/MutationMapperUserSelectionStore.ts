import { observable, makeObservable } from 'mobx';
import {
    initDefaultTrackVisibility,
    TrackVisibility,
} from 'react-mutation-mapper';

export default class MutationMapperUserSelectionStore {
    @observable trackVisibility: TrackVisibility;

    constructor() {
        makeObservable(this);
        this.trackVisibility = initDefaultTrackVisibility();
    }
}
