import _ from "lodash";
import {action, computed, observable} from "mobx";

import {DataFilter} from "../model/DataFilter";
import DataStore from "../model/DataStore";
import {Mutation} from "../model/Mutation";
import {findAllUniquePositions} from "../util/FilterUtils";

export class DefaultMutationMapperDataStore implements DataStore
{
    @observable public selectionFilters: DataFilter[] = [];
    @observable public highlightFilters: DataFilter[] = [];

    // TODO simplify data if possible
    private data: Array<Mutation | Mutation[]>;

    constructor(data: Array<Mutation | Mutation[]>) {
        this.data = data;
    }

    @computed
    public get sortedFilteredData() {
        return this.data;
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
        this.highlightFilters = [];
    }

    @action
    public clearSelectionFilters() {
        this.selectionFilters = [];
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
}

export default DefaultMutationMapperDataStore;
