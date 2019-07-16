import * as _ from 'lodash';
import {
    SimpleLazyMobXTableApplicationDataStore
} from "shared/lib/ILazyMobXTableApplicationDataStore";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import Immutable from "seamless-immutable";
import {countDuplicateMutations, groupMutationsByGeneAndPatientAndProteinChange} from "shared/lib/MutationUtils";

type MutationCluster = {[clusterId:string]:boolean};
type ImmutableMutationCluster = MutationCluster & Immutable.ImmutableObject<MutationCluster>;

export default class EvolutionDataStore extends SimpleLazyMobXTableApplicationDataStore<Mutation[]>{
    @observable.ref private selectedMutationCluster:ImmutableMutationCluster;
    @observable.ref private highlightedPositions:ImmutableMutationCluster;
    @observable private dataSelectFilter: (d: Mutation[]) => boolean = () => true;
    @observable private dataHighlightFilter: (d: Mutation[]) => boolean = () => true;

    @action public setMutationClusterSelected(clusterId:number, newVal:boolean) {
      debugger;
        const toMerge:MutationCluster = {};
        toMerge[clusterId+""] = newVal;
        this.selectedMutationCluster= this.selectedMutationCluster.merge(toMerge) as ImmutableMutationCluster;
    }

    @action public clearSelectedMutationCluster() {
        if (!_.isEmpty(this.selectedMutationCluster)) {
            this.selectedMutationCluster = Immutable.from<MutationCluster>({});
        }
    }

    @action public setDataSelectFilter(dataSelectorFilter: (d: Mutation[]) => boolean) {
        this.dataSelectFilter = dataSelectorFilter;
    }

    @action public clearDataSelectFilter() {
        this.dataSelectFilter = () => true;
    }

    constructor(data:Mutation[][]) {
        super(data);
    }
}
