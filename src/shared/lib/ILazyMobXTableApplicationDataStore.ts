import {SortMetric} from "./ISortMetric";
import {observable, computed, action} from "mobx";
import {lazyMobXTableSort} from "../components/lazyMobXTable/LazyMobXTable";
export interface ILazyMobXTableApplicationDataStore<T> {
    // setter
    setFilter:(fn:(d:T, filterString?:string, filterStringUpper?:string, filterStringLower?:string)=>boolean)=>void;

    // mobX computed getters
    allData:T[];
    sortedData:T[];
    sortedFilteredData:T[];
    sortedFilteredSelectedData:T[];
    tableData:T[];

    // exposed methods for interacting with data
    isHighlighted:(d:T)=>boolean;

    // mobX observable public properties (note you can still implement with getter and setter)
    filterString:string;
    sortAscending:boolean|undefined;
    sortMetric:SortMetric<T>|undefined;
};

export class SimpleGetterLazyMobXTableApplicationDataStore<T> implements ILazyMobXTableApplicationDataStore<T> {
    @observable protected dataFilter:(d:T, filterString?:string, filterStringUpper?:string, filterStringLower?:string)=>boolean;
    @observable protected dataSelector:(d:T)=>boolean;
    @observable protected dataHighlighter:(d:T)=>boolean;

    @observable public filterString:string;
    @observable public sortMetric:SortMetric<T>|undefined;
    @observable public sortAscending:boolean|undefined;

    @computed get allData() {
        return this.getData();
    }
    @computed get sortedData() {
        // if not defined, use default values for sortMetric and sortAscending
        const sortMetric = this.sortMetric || (() => 0);
        const sortAscending = this.sortAscending !== undefined ? this.sortAscending : true;

        return lazyMobXTableSort(this.allData, sortMetric, sortAscending);
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

    public isHighlighted(d:T) {
        return this.dataHighlighter(d);
    }


    constructor(private getData:()=>T[]) {
        this.filterString = "";
        this.dataHighlighter = ()=>false;
        this.dataSelector = ()=>false;
        this.dataFilter = ()=>true;
    }
}

export class SimpleLazyMobXTableApplicationDataStore<T> extends SimpleGetterLazyMobXTableApplicationDataStore<T> {
    constructor(data:T[]) {
        super(()=>data);
    }
}