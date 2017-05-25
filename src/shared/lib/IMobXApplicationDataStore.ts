import {SortMetric} from "./ISortMetric";
import {observable, computed, action} from "mobx";
import {lazyMobXTableSort} from "../components/lazyMobXTable/LazyMobXTable";
export interface IMobXApplicationDataStore<T> {
    // setter
    setFilter:(fn:(d:T, filterString?:string, filterStringUpper?:string, filterStringLower?:string)=>boolean)=>void;
    // mobX computed getters
    allData:T[];
    sortedData:T[];
    sortedFilteredData:T[];
    sortedFilteredSelectedData:T[];
    tableData:T[];

    // mobX observable public properties (note you can still implement with getter and setter)
    filterString:string;
    highlight:(d:T)=>boolean;
    sortAscending:boolean;
    sortMetric:SortMetric<T>;
};

export class SimpleMobXApplicationDataStore<T> implements IMobXApplicationDataStore<T> {
    @observable.ref protected data:T[];
    @observable protected dataFilter:(d:T, filterString?:string, filterStringUpper?:string, filterStringLower?:string)=>boolean;
    @observable protected dataSelector:(d:T)=>boolean;

    @observable public filterString:string;
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
        const filterStringUpper = this.filterString.toUpperCase();
        const filterStringLower = this.filterString.toLowerCase();
        return this.sortedData.filter((d:T)=>this.dataFilter(d, this.filterString, filterStringUpper, filterStringLower));
    }

    @computed get sortedFilteredSelectedData() {
        return this.sortedFilteredData.filter(this.dataSelector);
    }

    @computed get tableData() {
        if (this.sortedFilteredSelectedData.length) {
            return this.sortedFilteredSelectedData;
        } else {
            return this.sortedFilteredData;
        }
    }

    @computed get showingAllData() {
        return this.tableData.length === this.allData.length;
    }

    @action public setFilter(fn:(d:T, filterString?:string, filterStringUpper?:string, filterStringLower?:string)=>boolean) {
        this.dataFilter = fn;
    }

    @action public resetFilter() {
        this.dataFilter = ()=>true;
        this.filterString = "";
    }


    constructor(data:T[]) {
        this.data = data;
        this.filterString = "";
        this.highlight = ()=>false;
        this.dataSelector = ()=>false;
        this.dataFilter = ()=>true;
        this.sortMetric = ()=>0;
        this.sortAscending = true;
    }
}