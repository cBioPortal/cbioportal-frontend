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
    private highlightedMutationsMap = observable.map<MutationId>();
    @observable private _onlyShowHighlightedInTable = false;

    public getMouseOverMutation() {
        return this.mouseOverMutation;
    }

    public getOnlyShowHighlightedInTable() {
        return this._onlyShowHighlightedInTable;
    }

    public setMouseOverMutation(m:Readonly<MutationId>|null) {
        this.mouseOverMutation = m;
    }

    public setOnlyShowHighlightedInTable(o:boolean) {
        this._onlyShowHighlightedInTable = o;
    }

    @action
    public toggleHighlightedMutation(m:Readonly<MutationId>) {
        const key = mutationIdKey(m);
        if (this.highlightedMutationsMap.has(key)) {
            this.highlightedMutationsMap.delete(key);
        } else {
            this.highlightedMutationsMap.set(key, m);
        }
    }

    @action
    public setHighlightedMutations(muts:Readonly<MutationId[]>) {
        this.highlightedMutationsMap.clear();
        let count = 0;
        for (const m of muts) {
            this.toggleHighlightedMutation(m);
            count += 1;
        }
    }

    @computed public get highlightedMutations():Readonly<MutationId[]> {
        return this.highlightedMutationsMap.entries().map(x=>x[1]);
    }

    @computed get sortedFilteredData() {
        const filterStringUpper = this.filterString.toUpperCase();
        const filterStringLower = this.filterString.toLowerCase();
        return this.sortedData.filter((d:Mutation[])=>{
            const stringFilter = this.dataFilter(d, this.filterString, filterStringUpper, filterStringLower);

            // filter out non-highlighted mutations if onlyShowHighlighted is true, or if there are no highlighted mutations
            const highlightFilter = !this._onlyShowHighlightedInTable || this.highlightedMutations.length === 0 || _.some(this.highlightedMutations, m=>mutationMatch(d, m));

            return stringFilter && highlightFilter;
        });
    }

    constructor(getData:()=>Mutation[][]) {
        super(getData);

        this.dataHighlighter = (d:Mutation[])=>{
            const highlightedMutations = this.highlightedMutations.slice();
            if (this.mouseOverMutation) {
                highlightedMutations.push(this.mouseOverMutation);
            }
            return _.some(highlightedMutations, m=>mutationMatch(d,m));
        }
    }


}