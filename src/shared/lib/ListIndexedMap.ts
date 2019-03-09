import _ from "lodash";

function getFolderKey<KE extends KeyElementType>(key:KeyElementType[]) {
    return key.join(",");
}

type KeyElementType = string|number|boolean|undefined|null;
type Entry<KE, R> = { key:KE[], value: R };

export default class ListIndexedMap<KE extends KeyElementType, R> {
    private map:{[folderKey:string]:Entry<KE, R>[]} = {};

    public entries():Entry<KE, R>[] {
        const ret = [];
        for (const folderKey of Object.keys(this.map)) {
            for (const entry of this.map[folderKey]) {
                ret.push(entry);
            }
        }
        return ret;
    }

    public set(value:R, ...key:KE[]):boolean {
        // returns true if an entry was added, false if entry already present and modified
        const entry = this.getEntry(key);
        if (!entry) {
            this.getFolder(key).push({ key, value });
            return true;
        } else {
            entry.value = value;
            return false;
        }
    }

    public get(...key:KE[]):R|undefined {
        const entry = this.getEntry(key);
        if (!entry) {
            return undefined;
        } else {
            return entry.value;
        }
    }

    public has(...key:KE[]):boolean {
        return !!this.getEntry(key);
    }

    private getEntry(key:KE[]):Entry<KE, R>|undefined {
        return this.getFolder(key).find(entry => _.isEqual(entry.key, key));
    }

    private getFolder(key:KE[]):Entry<KE, R>[] {
        const folderKey = getFolderKey(key);
        this.map[folderKey] = this.map[folderKey] || [];
        return this.map[folderKey];
    }
}

export class StringListIndexedMap<R> extends ListIndexedMap<string, R>{}

export class ListIndexedMapOfCounts<KE extends KeyElementType> extends ListIndexedMap<KE, number> {
    public increment(...key:KE[]) {
        if (this.has(...key)) {
            this.set(
                this.get(...key)!+1,
                ...key
            );
        } else {
            this.set(1, ...key);
        }
    }
}