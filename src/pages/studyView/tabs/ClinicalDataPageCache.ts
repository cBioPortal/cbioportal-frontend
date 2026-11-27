export class ClinicalDataPageCache<T> {
    private readonly entries = new Map<number, T>();
    private _version = 0;
    private queryKey: string | undefined;

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

    get(queryKey: string, pageNumber: number): T | undefined {
        this.ensureQuery(queryKey);
        const value = this.entries.get(pageNumber);
        if (value !== undefined) {
            this.entries.delete(pageNumber);
            this.entries.set(pageNumber, value);
        }
        return value;
    }

    set(queryKey: string, pageNumber: number, value: T): void {
        this.ensureQuery(queryKey);
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

    private ensureQuery(queryKey: string): void {
        if (this.queryKey !== queryKey) {
            this.entries.clear();
            this.queryKey = queryKey;
            this._version += 1;
        }
    }

    get size(): number {
        return this.entries.size;
    }
}
