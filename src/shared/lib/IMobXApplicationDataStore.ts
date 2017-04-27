import {SortMetric} from "./ISortMetric";
import {observable, computed, action} from "mobx";
import {lazyMobXTableSort} from "../components/lazyMobXTable/LazyMobXTable";
export interface IMobXApplicationDataStore<T> {
    // Setters
    setFilter:(filterFn:(d:T)=>boolean)=>void;
    setSelector:(selectorFn:(d:T)=>boolean)=>void;

    // mobX computed getters
    allData:T[];
    sortedData:T[];
    sortedFilteredData:T[];
    sortedFilteredSelectedData:T[];

    // mobX observable public properties (note you can still implement with getter and setter)
    highlight:(d:T)=>boolean;
    sortAscending:boolean;
    sortMetric:SortMetric<T>;
};

export class SimpleMobXApplicationDataStore<T> implements IMobXApplicationDataStore<T> {
    @observable.ref private data:T[];
    @observable private dataFilter:(d:T)=>boolean;
    @observable private dataSelector:(d:T)=>boolean;

    @observable public sortMetric:SortMetric<T>;
    @observable public sortAscending:boolean;
    @observable public highlight:(d:T)=>boolean;

    @computed get allData() {
        return this.data;
    }
    @computed get sortedData() {
        return lazyMobXTableSort(this.allData, this.sortMetric, this.sortAscending);
    }
    @computed get sortedFilteredData() {
        return this.sortedData.filter(this.dataFilter);
    }

    @computed get sortedFilteredSelectedData() {
        return this.sortedFilteredData.filter(this.dataSelector);
    }

    @action public setFilter(dataFilter:(d:T)=>boolean) {
        this.dataFilter = dataFilter;
    }

    @action public setSelector(selector:(d:T)=>boolean) {
        this.dataSelector = selector;
    }


    constructor(data:T[]) {
        this.data = data;
        this.highlight = ()=>false;
        this.dataSelector = ()=>false;
        this.dataFilter = ()=>true;
        this.sortMetric = ()=>0;
        this.sortAscending = true;
    }
}