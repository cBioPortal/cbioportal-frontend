import { action, makeObservable, observable } from 'mobx';

export interface EmbeddingCategoryVisibilityOptions {
    /**
     * Categories "hide all" leaves alone. The study view's cohort categories
     * are tracked by their own control, so hiding them here would fight it.
     */
    alwaysVisible?: string[];
    /**
     * Runs when a single category is hidden, for state that may not name a
     * hidden category. Hiding everything at once does not call it: that is
     * reversible in one click, and dropping a selection there would not be.
     */
    onHide?: (category: string) => void;
}

/** Which legend categories are hidden from an embedding plot. */
export class EmbeddingCategoryVisibility {
    @observable.ref hidden = new Set<string>();

    constructor(private options: EmbeddingCategoryVisibilityOptions = {}) {
        makeObservable(this);
    }

    private get alwaysVisible(): string[] {
        return this.options.alwaysVisible ?? [];
    }

    @action.bound
    toggle(category: string) {
        const next = new Set(this.hidden);
        if (next.has(category)) {
            next.delete(category);
        } else {
            next.add(category);
            if (this.options.onHide) {
                this.options.onHide(category);
            }
        }
        this.hidden = next;
    }

    /** Hides every category when all are shown, and shows all otherwise. */
    @action.bound
    toggleAll(allCategories: Iterable<string>) {
        if (this.hidden.size === 0) {
            const next = new Set<string>();
            for (const category of allCategories) {
                if (!this.alwaysVisible.includes(category)) {
                    next.add(category);
                }
            }
            this.hidden = next;
        } else {
            const next = new Set<string>();
            this.hidden.forEach(category => {
                if (this.alwaysVisible.includes(category)) {
                    next.add(category);
                }
            });
            this.hidden = next;
        }
    }

    @action.bound
    reset() {
        this.hidden = new Set();
    }
}
