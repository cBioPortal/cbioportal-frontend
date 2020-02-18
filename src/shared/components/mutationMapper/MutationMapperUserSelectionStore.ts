import { observable } from 'mobx';
import { initDefaultTrackVisibility, TrackVisibility } from 'react-mutation-mapper';

export default class MutationMapperUserSelectionStore {
    @observable trackVisibility: TrackVisibility;

    constructor() {
        this.trackVisibility = initDefaultTrackVisibility();
    }
}
