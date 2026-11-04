import { action, makeObservable, observable } from 'mobx';
import { LinkMatcher } from '../data/linkAggregation';

/**
 * View-local linked-hover state (D23). Owned by FusionComparisonView and
 * passed to the ruler, the arcs and the strips; never stored in the cohort store.
 */
export class LinkHover {
    @observable.ref public matcher: LinkMatcher | undefined = undefined;

    constructor() {
        makeObservable(this);
    }

    @action
    public set(m: LinkMatcher | undefined): void {
        this.matcher = m;
    }

    @action
    public clear(): void {
        this.matcher = undefined;
    }
}
