import {SimpleGetterLazyMobXTableApplicationDataStore} from "../../../shared/lib/ILazyMobXTableApplicationDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import ComplexKeySet from "../../../shared/lib/complexKeyDataStructures/ComplexKeySet";

type MutationId = {
    proteinChange:string;
    hugoGeneSymbol:string;
};

function mutationMatch(d:Mutation[], id:MutationId) {
    return d[0].proteinChange === id.proteinChange &&
        d[0].gene.hugoGeneSymbol === id.hugoGeneSymbol;
}

function mutationIdKey(m:MutationId) {
    return `{ "proteinChange": "${m.proteinChange}", "hugoGeneSymbol": "${m.hugoGeneSymbol}" }`;
}

export default class PatientViewMutationsDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<Mutation[]> {
    @observable.ref private mouseOverMutation:Readonly<MutationId>|null = null;
    private selectedMutationsMap = observable.map<MutationId>();

    public getMouseOverMutation() {
        return this.mouseOverMutation;
    }

    @computed get sortedFilteredData() {
        const filterStringUpper = this.filterString.toUpperCase();
        const filterStringLower = this.filterString.toLowerCase();
        return this.sortedData.filter((d:Mutation[])=>{
            const stringFilter = this.dataFilter(d, this.filterString, filterStringUpper, filterStringLower);
            const selectionFilter = this.selectedMutations.length === 0 || _.some(this.selectedMutations, m=>mutationMatch(d, m));

            return stringFilter && selectionFilter;
        });
    }

    constructor(getData:()=>Mutation[][]) {
        super(getData);

        this.dataHighlighter = (d:Mutation[])=>{
            if (!this.mouseOverMutation || !d.length) {
                return false;
            } else {
                return mutationMatch(d, this.mouseOverMutation);
            }
        }
    }

    public setMouseOverMutation(m:Readonly<MutationId>|null) {
        this.mouseOverMutation = m;
    }

    @action
    public toggleSelectedMutation(m:Readonly<MutationId>) {
        const key = mutationIdKey(m);
        if (this.selectedMutationsMap.has(key)) {
            this.selectedMutationsMap.delete(key);
        } else {
            this.selectedMutationsMap.set(key, m);
        }
    }

    @action
    public setSelectedMutations(muts:Readonly<MutationId[]>) {
        this.selectedMutationsMap.clear();
        let count = 0;
        for (const m of muts) {
            this.toggleSelectedMutation(m);
            count += 1;
        }
    }

    @computed public get selectedMutations():Readonly<MutationId[]> {
        return this.selectedMutationsMap.entries().map(x=>x[1]);
    }
}