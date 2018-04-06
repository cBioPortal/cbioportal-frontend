import _ from "lodash";

function getFolderKey(key:string[]) {
    return JSON.stringify(key);
}

type Entry<R> = { key:string[], value: R };

export default class ListIndexedMap<R> {
    private map:{[folderKey:string]:Entry<R>[]} = {};

    public set(key:string[], value:R):boolean {
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

    public get(key:string[]):R|undefined {
        const entry = this.getEntry(key);
        if (!entry) {
            return undefined;
        } else {
            return entry.value;
        }
    }

    private getEntry(key:string[]):Entry<R> {
        return this.getFolder(key).find(entry => _.isEqual(entry.key, key));
    }

    private getFolder(key:string[]):Entry<R>[] {
        const folderKey = getFolderKey(key);
        this.map[folderKey] = this.map[folderKey] || [];
        return this.map[folderKey];
    }
}