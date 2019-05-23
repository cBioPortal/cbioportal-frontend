import {DataFilter} from "./DataFilter";

export interface DataStore {
    sortedFilteredData: any[]; // TODO find a better way to define/access this data
    setHighlightFilters: (filters: DataFilter[]) => void;
    setSelectionFilters: (filters: DataFilter[]) => void;
    clearHighlightFilters: () => void;
    clearSelectionFilters: () => void;
    selectionFilters: DataFilter[];
    highlightFilters: DataFilter[];
    isPositionSelected: (position:number) => boolean;
    isPositionHighlighted: (position:number) => boolean;
}

export default DataStore;
