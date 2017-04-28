import {SortMetric} from "./ISortMetric";
export interface IMobXApplicationDataStore<T> {
    // Setters
    setFilter:(filterFn:(d:T)=>boolean)=>void;

    // mobX computed getters
    allData:T[];
    sortedData:T[];
    sortedFilteredData:T[];

    // mobX observable public properties (note you can still implement with getter and setter)
    highlight:(d:T)=>boolean;
    sortAscending:boolean;
    sortMetric:SortMetric<T>;
};