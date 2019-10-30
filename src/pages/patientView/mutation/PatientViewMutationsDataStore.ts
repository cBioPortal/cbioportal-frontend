import {SimpleGetterLazyMobXTableApplicationDataStore} from "../../../shared/lib/ILazyMobXTableApplicationDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import ComplexKeySet from "../../../shared/lib/complexKeyDataStructures/ComplexKeySet";

function mutationMatch(d:Mutation[], id:Mutation) {
    return d[0].proteinChange === id.proteinChange &&
        d[0].gene.hugoGeneSymbol === id.gene.hugoGeneSymbol;
}

function mutationIdKey(m:Mutation) {
    return `{ "proteinChange": "${m.proteinChange}", "hugoGeneSymbol": "${m.gene.hugoGeneSymbol}" }`;
}

export default class PatientViewMutationsDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<Mutation[]> {
    @observable.ref private mouseOverMutation:Readonly<Mutation>|null = null;
    private highlightedMutationsMap = observable.map<Mutation>();
    @observable private _onlyShowHighlightedInTable = false;
    @observable private _onlyShowHighlightedInVAFChart = false;

    public getMouseOverMutation() {
        return this.mouseOverMutation;
    }

    public get onlyShowHighlightedInTable() {
        return this._onlyShowHighlightedInTable;
    }

    public get onlyShowHighlightedInVAFChart() {
        return this._onlyShowHighlightedInVAFChart;
    }

    public setMouseOverMutation(m:Readonly<Mutation>|null) {
        this.mouseOverMutation = m;
    }

    public setOnlyShowHighlightedInTable(o:boolean) {
        this._onlyShowHighlightedInTable = o;
    }

    public setOnlyShowHighlightedInVAFChart(o:boolean) {
        this._onlyShowHighlightedInVAFChart = o;
    }

    @action
    public toggleHighlightedMutation(m:Readonly<Mutation>) {
        const key = mutationIdKey(m);
        if (this.highlightedMutationsMap.has(key)) {
            this.highlightedMutationsMap.delete(key);
        } else {
            this.highlightedMutationsMap.set(key, m);
        }
    }

    @action
    public setHighlightedMutations(muts:Readonly<Mutation[]>) {
        this.highlightedMutationsMap.clear();
        let count = 0;
        for (const m of muts) {
            this.toggleHighlightedMutation(m);
            count += 1;
        }
    }

    @computed public get highlightedMutations():Readonly<Mutation[]> {
        return this.highlightedMutationsMap.entries().map(x=>x[1]);
    }

    public isMutationHighlighted(m:Mutation) {
        return this.highlightedMutationsMap.has(mutationIdKey(m));
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