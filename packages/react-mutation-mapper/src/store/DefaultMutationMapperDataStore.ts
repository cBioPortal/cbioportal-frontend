import _ from "lodash";
import {action, computed, observable} from "mobx";

import {CustomFilterApplier, DataFilter} from "../model/DataFilter";
import DataStore from "../model/DataStore";
import {Mutation} from "../model/Mutation";
import {findAllUniquePositions} from "../util/FilterUtils";

export class DefaultMutationMapperDataStore implements DataStore
{
    @observable public dataFilters: DataFilter[] = [];
    @observable public selectionFilters: DataFilter[] = [];
    @observable public highlightFilters: DataFilter[] = [];

    // TODO simplify data if possible
    private data: Array<Mutation | Mutation[]>;

    // this custom filter applier allows us to interpret selection and highlight filters in a customized way,
    // by default only position filters are taken into account
    protected applyCustomFilter: CustomFilterApplier | undefined;

    constructor(data: Array<Mutation | Mutation[]>,
                applyCustomFilter?: CustomFilterApplier)
    {
        this.data = data;
        this.applyCustomFilter = applyCustomFilter;
    }

    @computed
    public get allData() {
        return this.data;
    }

    @computed
    public get filteredData() {
        return this.dataFilters.length > 0 ?
            this.data.filter(m => this.dataMainFilter(_.flatten([m])[0])): this.data;
    }

    @computed
    public get sortedFilteredData() {
        return this.filteredData;
    }

    @computed
    public get sortedFilteredSelectedData() {
        return this.selectionFilters.length > 0 ?
            // TODO simplify array flatten if possible
            this.data.filter(m => this.dataSelectFilter(_.flatten([m])[0])) : [];
    }

    @computed
    public get selectedPositions() {
        return _.keyBy(findAllUniquePositions(this.selectionFilters).map(p => ({position: p})), 'position');
    }

    @computed
    public get highlightedPositions() {
        return _.keyBy(findAllUniquePositions(this.highlightFilters).map(p => ({position: p})), 'position');
    }

    @action
    public clearHighlightFilters() {
        if (this.highlightFilters.length > 0) {
            this.highlightFilters = [];
        }
    }

    @action
    public clearSelectionFilters() {
        if (this.selectionFilters.length > 0) {
            this.selectionFilters = [];
        }
    }

    @action
    public clearDataFilters() {
        if (this.dataFilters.length > 0) {
            this.dataFilters = [];
        }
    }

    @action
    public setHighlightFilters(filters: DataFilter[]) {
        this.highlightFilters = filters;
    }

    @action
    public setSelectionFilters(filters: DataFilter[]) {
        this.selectionFilters = filters;
    };

    public isPositionSelected(position: number) {
        return !!this.selectedPositions[position+""];
    }

    public isPositionHighlighted(position: number) {
        return !!this.highlightedPositions[position+""];
    }

    public dataMainFilter(mutation: Mutation): boolean
    {
        return (
            this.dataFilters.length > 0 &&
            !this.dataFilters
                .map(dataFilter => this.applyFilter(dataFilter, mutation, this.selectedPositions))
                .includes(false)
        );
    }

    public dataSelectFilter(mutation: Mutation): boolean
    {
        return (
            this.selectionFilters.length > 0 &&
            !this.selectionFilters
                .map(dataFilter => this.applyFilter(dataFilter, mutation, this.selectedPositions))
                .includes(false)
        );
    }

    public dataHighlightFilter(mutation: Mutation): boolean
    {
        return (
            this.highlightFilters.length > 0 &&
            !this.highlightFilters
                .map(dataFilter => this.applyFilter(dataFilter, mutation, this.highlightedPositions))
                .includes(false)
        );
    }

    public applyFilter(filter: DataFilter, mutation: Mutation, positions: {[position: string]: {position: number}})
    {
        if (this.applyCustomFilter) {
            // let the custom filter applier decide how to apply the given filter
            return this.applyCustomFilter(filter, mutation, positions);
        }
        else {
            // by default only filter by position
            return !!positions[mutation.proteinPosStart+""];
        }
    }
}

export default DefaultMutationMapperDataStore;
