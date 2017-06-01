import {
    SimpleMobXApplicationDataStore
} from "../../../shared/lib/IMobXApplicationDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import Immutable from "seamless-immutable";

type PositionAttr = {[position:string]:boolean};
type ImmutablePositionAttr = PositionAttr & Immutable.ImmutableObject<PositionAttr>;

export default class MutationMapperDataStore extends SimpleMobXApplicationDataStore<Mutation[]>{
    @observable.ref private selectedPositions:ImmutablePositionAttr;
    @observable.ref private highlightedPositions:ImmutablePositionAttr;

    @action public setPositionSelected(position:number, newVal:boolean) {
        const toMerge:PositionAttr = {};
        toMerge[position+""] = newVal;
        this.selectedPositions = this.selectedPositions.merge(toMerge) as ImmutablePositionAttr;
    }

    @action public setPositionHighlighted(position:number, newVal:boolean) {
        const toMerge:PositionAttr = {};
        toMerge[position+""] = newVal;
        this.highlightedPositions = this.highlightedPositions.merge(toMerge) as ImmutablePositionAttr;
    }

    @action public clearSelectedPositions() {
        this.selectedPositions = Immutable.from<PositionAttr>({});
    }

    @action public clearHighlightedPositions() {
        this.highlightedPositions = Immutable.from<PositionAttr>({});
    }

    public isPositionSelected(position:number) {
        return !!this.selectedPositions[position+""];
    }

    @action public resetFilterAndSelection() {
        super.resetFilter();
        this.clearSelectedPositions();
    }

    constructor(data:Mutation[][]) {
        super(data);
        this.selectedPositions = Immutable.from<PositionAttr>({});
        this.highlightedPositions = Immutable.from<PositionAttr>({});
        this.dataSelector = (d:Mutation[])=>!!this.selectedPositions[d[0].proteinPosStart+""];
        this.dataHighlighter = (d:Mutation[])=>!!this.highlightedPositions[d[0].proteinPosStart+""];
    }
}