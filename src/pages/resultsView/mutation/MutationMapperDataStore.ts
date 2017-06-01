import {
    SimpleMobXApplicationDataStore
} from "../../../shared/lib/IMobXApplicationDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import Immutable from "seamless-immutable";

type SelectedPositions = {[position:string]:boolean};
type ImmutableSelectedPositions = SelectedPositions & Immutable.ImmutableObject<SelectedPositions>;

export default class MutationMapperDataStore extends SimpleMobXApplicationDataStore<Mutation[]>{
    @observable.ref private selectedPositions:ImmutableSelectedPositions;

    @action public setPositionSelected(position:number, newVal:boolean) {
        const toMerge:SelectedPositions = {};
        toMerge[position+""] = newVal;
        this.selectedPositions = this.selectedPositions.merge(toMerge) as ImmutableSelectedPositions;
    }

    @action public clearSelectedPositions() {
        this.selectedPositions = Immutable.from<SelectedPositions>({});
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
        this.selectedPositions = Immutable.from<SelectedPositions>({});
        this.dataSelector = (d:Mutation[])=>!!this.selectedPositions[d[0].proteinPosStart+""];
    }
}