export class ClinicalDataPageCache<T> {
    private readonly entries = new Map<number, T>();
    private _version = 0;

    constructor(private readonly maxEntries: number) {
        if (maxEntries < 1) {
            throw new Error(
                'Clinical data page cache must hold at least one page'
            );
        }
    }

    get version(): number {
        return this._version;
    }

    get(pageNumber: number): T | undefined {
        const value = this.entries.get(pageNumber);
        if (value !== undefined) {
            this.entries.delete(pageNumber);
            this.entries.set(pageNumber, value);
        }
        return value;
    }

    set(pageNumber: number, value: T): void {
        this.entries.delete(pageNumber);
        this.entries.set(pageNumber, value);

        while (this.entries.size > this.maxEntries) {
            const oldestPage = this.entries.keys().next().value;
            if (oldestPage !== undefined) {
                this.entries.delete(oldestPage);
            }
        }
    }

    clear(): void {
        this.entries.clear();
        this._version += 1;
    }

    get size(): number {
        return this.entries.size;
    }
}
