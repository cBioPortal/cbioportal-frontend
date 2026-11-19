import { action, computed, makeObservable, observable } from 'mobx';
import {
    MapPoint,
    MapSelection,
    MapSelectionOutline,
    MapSelectionSummary,
    SELECTION_COLORS,
} from './MapSelection';

/**
 * The selections held beside a map, in the order they were drawn.
 *
 * Numbering and colour both follow the selection's id, so they stay in step
 * with the chips. The id restarts once the list is empty: a fresh set of
 * selections reads "Selection 1" again rather than carrying on from whatever
 * the last session reached.
 */
export class MapSelectionList {
    @observable.ref private selections: MapSelection[] = [];
    private nextId = 1;

    constructor() {
        makeObservable(this);
    }

    @computed get all(): MapSelection[] {
        return this.selections;
    }

    @computed get isEmpty(): boolean {
        return this.selections.length === 0;
    }

    @computed get length(): number {
        return this.selections.length;
    }

    /** The union of every selection, or null when there are none. */
    @computed get keys(): Set<string> | null {
        if (this.isEmpty) {
            return null;
        }
        const keys = new Set<string>();
        this.selections.forEach(selection =>
            selection.keys.forEach(key => keys.add(key))
        );
        return keys;
    }

    /**
     * Which selection's colour each point takes. A point in two selections
     * takes the colour of the later one, matching the order the chips read in.
     */
    @computed get colorByKey(): Map<string, string> {
        const colors = new Map<string, string>();
        this.selections.forEach(selection =>
            selection.keys.forEach(key => colors.set(key, selection.color))
        );
        return colors;
    }

    /** What the chips beside the map show: no key set to re-render on. */
    @computed get summaries(): MapSelectionSummary[] {
        return this.selections.map(({ id, name, color, keys }) => ({
            id,
            name,
            color,
            count: keys.size,
        }));
    }

    /** The outlines to draw over the map, one per selection drawn with one. */
    @computed get outlines(): MapSelectionOutline[] {
        return this.selections
            .filter(s => s.path && s.path.length > 2)
            .map(({ id, color, path }) => ({ id, color, path: path! }));
    }

    @action.bound
    add(keys: Set<string>, path?: MapPoint[]): void {
        if (keys.size === 0) {
            return;
        }
        const id = this.nextId++;
        this.selections = [
            ...this.selections,
            {
                id,
                name: `Selection ${id}`,
                color: SELECTION_COLORS[(id - 1) % SELECTION_COLORS.length],
                keys,
                path,
            },
        ];
    }

    @action.bound
    clear(): void {
        this.selections = [];
        this.nextId = 1;
    }

    @action.bound
    remove(id: number): void {
        this.selections = this.selections.filter(s => s.id !== id);
        if (this.isEmpty) {
            this.nextId = 1;
        }
    }

    @action.bound
    rename(id: number, name: string): void {
        this.selections = this.selections.map(s =>
            s.id === id ? { ...s, name } : s
        );
    }
}
