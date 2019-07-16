import {DataFilter} from "./DataFilter";

export interface DataStore {
    sortedFilteredData: any[]; // TODO find a better way to define/access this data
    sortedFilteredSelectedData: any[]; // TODO find a better way to define/access this data
    setHighlightFilters: (filters: DataFilter[]) => void;
    setSelectionFilters: (filters: DataFilter[]) => void;
    clearHighlightFilters: () => void;
    clearSelectionFilters: () => void;
    dataFilters: DataFilter[];
    selectionFilters: DataFilter[];
    highlightFilters: DataFilter[];
    isPositionSelected: (position: number) => boolean;
    isPositionHighlighted: (position: number) => boolean;
    dataSelectFilter: (datum: any) => boolean;
    dataHighlightFilter: (datum: any) => boolean;
    applyFilter: (filter: DataFilter, datum: any, positions: {[position: string]: {position: number}}) => void;
}

export default DataStore;
