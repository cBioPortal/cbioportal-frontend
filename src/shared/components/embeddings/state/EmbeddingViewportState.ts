import { action, makeObservable, observable } from 'mobx';
import { EmbeddingPoint, ViewState } from '../EmbeddingTypes';
import { calculateDataBounds } from '../utils/dataUtils';

export const EMBEDDING_MIN_ZOOM = -5;
export const EMBEDDING_MAX_ZOOM = 10;

/**
 * Pan and zoom for an embedding plot.
 *
 * `set` is the panel's own move and reports it; `adopt` takes a move made
 * elsewhere and stays silent, which is what a panel following another one
 * needs so the two do not drive each other in a loop.
 */
export class EmbeddingViewportState {
    @observable.ref current: ViewState = {
        target: [0, 0, 0],
        zoom: 0,
        minZoom: EMBEDDING_MIN_ZOOM,
        maxZoom: EMBEDDING_MAX_ZOOM,
    };

    constructor(private onChange?: (viewState: ViewState) => void) {
        makeObservable(this);
    }

    @action.bound
    set(viewState: ViewState) {
        this.current = viewState;
        if (this.onChange) {
            this.onChange(viewState);
        }
    }

    @action.bound
    adopt(viewState: ViewState) {
        this.current = viewState;
    }

    /** Frames these points. Does nothing for an empty set, which has no centre. */
    @action.bound
    centerOn(points: EmbeddingPoint[]) {
        if (!points || points.length === 0) {
            return;
        }
        const bounds = calculateDataBounds(points);
        this.set({
            target: [bounds.centerX, bounds.centerY, 0],
            zoom: bounds.zoom,
            minZoom: EMBEDDING_MIN_ZOOM,
            maxZoom: EMBEDDING_MAX_ZOOM,
        });
    }
}
