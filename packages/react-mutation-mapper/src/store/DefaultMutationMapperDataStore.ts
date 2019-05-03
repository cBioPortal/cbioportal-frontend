import _ from "lodash";
import {action, computed, observable} from "mobx";
import Immutable from "seamless-immutable";

import DataStore from "../model/DataStore";
import {Mutation} from "../model/Mutation";

type PositionAttr = {[position:string]:boolean};
type ImmutablePositionAttr = PositionAttr & Immutable.ImmutableObject<PositionAttr>;

export class DefaultMutationMapperDataStore implements DataStore
{
    // TODO simplify data if possible
    constructor(
        private data: Array<Mutation | Mutation[]>
    )
    {
        this.selectedPositions = Immutable.from<PositionAttr>({});
        this.highlightedPositions = Immutable.from<PositionAttr>({});
        // this.dataSelector = (d:Mutation[]) =>
        //     (!!this.selectedPositions[d[0].proteinPosStart+""] && this.dataSelectFilter(d));
        // this.dataHighlighter = (d:Mutation[]) =>
        //     (!!this.highlightedPositions[d[0].proteinPosStart+""] && this.dataHighlightFilter(d));
    }

    @observable.ref private selectedPositions: ImmutablePositionAttr;
    @observable.ref private highlightedPositions: ImmutablePositionAttr;
    // @observable private dataSelectFilter: (d: Mutation[]) => boolean = () => true;
    // @observable private dataHighlightFilter: (d: Mutation[]) => boolean = () => true;

    @computed
    public get sortedFilteredData() {
        return this.data;
    }

    @action
    public setPositionSelected(position:number, newVal:boolean)
    {
        const toMerge:PositionAttr = {};
        toMerge[position+""] = newVal;
        this.selectedPositions = this.selectedPositions.merge(toMerge) as ImmutablePositionAttr;
    }

    @action
    public setPositionHighlighted(position:number, newVal:boolean)
    {
        const toMerge:PositionAttr = {};
        toMerge[position+""] = newVal;
        this.highlightedPositions = this.highlightedPositions.merge(toMerge) as ImmutablePositionAttr;
    }

    @action public clearSelectedPositions()
    {
        if (!_.isEmpty(this.selectedPositions)) {
            this.selectedPositions = Immutable.from<PositionAttr>({});
        }
    }

    @action public clearHighlightedPositions() {
        if (!_.isEmpty(this.highlightedPositions)) {
            this.highlightedPositions = Immutable.from<PositionAttr>({});
        }
    }

    @action public setDataSelectFilter(/*dataSelectorFilter: (d: Mutation) => boolean*/) {
        // this.dataSelectFilter = dataSelectorFilter;
    }

    @action public clearDataSelectFilter() {
        // this.dataSelectFilter = () => true;
    }

    @action public setDataHighlightFilter(/*dataHighlightFilter: (d: Mutation) => boolean*/) {
        // this.dataHighlightFilter = dataHighlightFilter;
    }

    @action public clearDataHighlightFilter() {
        // this.dataHighlightFilter = () => true;
    }

    public isPositionSelected(position:number) {
        return !!this.selectedPositions[position+""];
    }

    public isPositionHighlighted(position:number) {
        return !!this.highlightedPositions[position+""];
    }
}

export default DefaultMutationMapperDataStore;
