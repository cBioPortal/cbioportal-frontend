import * as _ from 'lodash';
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {
    DataFilter,
    DataStore,
    findAllUniquePositions
} from "react-mutation-mapper";
import {
    SimpleLazyMobXTableApplicationDataStore
} from "shared/lib/ILazyMobXTableApplicationDataStore";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {countDuplicateMutations, groupMutationsByGeneAndPatientAndProteinChange} from "shared/lib/MutationUtils";


type CustomFilterApplier = (filter: DataFilter,
                            mutation: Mutation,
                            positions: {[position: string]: {position: number}}) => boolean;

// TODO this is now mostly duplicate of DefaultMutationMapperDataStore in react-mutation-mapper
export default class MutationMapperDataStore
    extends SimpleLazyMobXTableApplicationDataStore<Mutation[]>
    implements DataStore
{
    @observable public selectionFilters: DataFilter[] = [];
    @observable public highlightFilters: DataFilter[] = [];

    // this custom filter applier allows us to interpret selection and highlight filters in a customized way,
    // by default only position filters are taken into account
    protected applyCustomFilter: CustomFilterApplier | undefined;

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

    @action
    public resetFilterAndSelection() {
        super.resetFilter();
        this.clearPositionFilters();
    }

    @computed
    get tableDataGroupedByPatients() {
        return groupMutationsByGeneAndPatientAndProteinChange(_.flatten(this.tableData));
    }

    @computed
    get duplicateMutationCountInMultipleSamples(): number {
        return countDuplicateMutations(this.tableDataGroupedByPatients);
    }

    constructor(data: Mutation[][], applyCustomFilter?: CustomFilterApplier) {
        super(data);
        this.dataSelector = (d: Mutation[]) => this.dataSelectFilter(d);
        this.dataHighlighter = (d:Mutation[]) => this.dataHighlightFilter(d);
        this.applyCustomFilter = applyCustomFilter;
    }

    @action
    private clearPositionFilters() {
        // remove only filters with defined position field
        this.selectionFilters = this.selectionFilters.filter(f => f.position === undefined);
    }

    @autobind
    private dataSelectFilter(d: Mutation[]): boolean
    {
        return (
            this.selectionFilters.length > 0 &&
            !this.selectionFilters
                .map(dataFilter => this.applyFilter(dataFilter, d[0], this.selectedPositions))
                .includes(false)
        );
    }

    @autobind
    private dataHighlightFilter(d: Mutation[]): boolean
    {
        return (
            this.highlightFilters.length > 0 &&
            !this.highlightFilters
                .map(dataFilter => this.applyFilter(dataFilter, d[0], this.highlightedPositions))
                .includes(false)
        );
    }

    @autobind
    private applyFilter(filter: DataFilter, mutation: Mutation, positions: {[position: string]: {position: number}})
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