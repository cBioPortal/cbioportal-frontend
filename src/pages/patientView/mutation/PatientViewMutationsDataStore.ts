import { SimpleGetterLazyMobXTableApplicationDataStore } from '../../../shared/lib/ILazyMobXTableApplicationDataStore';
import { Mutation } from 'cbioportal-ts-api-client';
import { action, computed, observable } from 'mobx';
import _ from 'lodash';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';

function mutationMatch(d: Mutation[], id: Mutation) {
    return (
        d[0].proteinChange === id.proteinChange &&
        d[0].gene.hugoGeneSymbol === id.gene.hugoGeneSymbol
    );
}

function mutationIdKey(m: Mutation) {
    return `{ "proteinChange": "${m.proteinChange}", "hugoGeneSymbol": "${m.gene.hugoGeneSymbol}" }`;
}

export default class PatientViewMutationsDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    Mutation[]
> {
    @observable.ref private mouseOverMutation: Readonly<Mutation> | null = null;
    private selectedMutationsMap = observable.map<Mutation>();

    public getMouseOverMutation() {
        return this.mouseOverMutation;
    }

    public get onlyShowSelectedInTable() {
        return (
            this.urlWrapper.query.genomicEvolutionSettings
                .showOnlySelectedMutationsInTable === 'true'
        );
    }

    public get onlyShowSelectedInVAFChart() {
        return (
            this.urlWrapper.query.genomicEvolutionSettings
                .showOnlySelectedMutationsInChart === 'true'
        );
    }

    @action
    public setMouseOverMutation(m: Readonly<Mutation> | null) {
        this.mouseOverMutation = m;
    }

    @action
    public setOnlyShowSelectedInTable(o: boolean) {
        this.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.showOnlySelectedMutationsInTable = o.toString();
            return currentParams;
        });
    }

    @action
    public setOnlyShowSelectedInVAFChart(o: boolean) {
        this.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.showOnlySelectedMutationsInChart = o.toString();
            return currentParams;
        });
    }

    @action
    public toggleSelectedMutation(m: Readonly<Mutation>) {
        const key = mutationIdKey(m);
        if (this.selectedMutationsMap.has(key)) {
            this.selectedMutationsMap.delete(key);
        } else {
            this.selectedMutationsMap.set(key, m);
        }
    }

    @action
    public setSelectedMutations(muts: Readonly<Mutation[]>) {
        this.selectedMutationsMap.clear();
        let count = 0;
        for (const m of muts) {
            this.toggleSelectedMutation(m);
            count += 1;
        }
    }

    @computed public get selectedMutations(): Readonly<Mutation[]> {
        return this.selectedMutationsMap.entries().map(x => x[1]);
    }

    public isMutationSelected(m: Mutation) {
        return this.selectedMutationsMap.has(mutationIdKey(m));
    }

    @computed get sortedFilteredData() {
        const filterStringUpper = this.filterString.toUpperCase();
        const filterStringLower = this.filterString.toLowerCase();
        return this.sortedData.filter((d: Mutation[]) => {
            const stringFilter = this.dataFilter(
                d,
                this.filterString,
                filterStringUpper,
                filterStringLower
            );

            // filter out non-selected mutations
            const selectedFilter =
                !this.onlyShowSelectedInTable ||
                this.selectedMutations.length === 0 ||
                _.some(this.selectedMutations, m => mutationMatch(d, m));

            return stringFilter && selectedFilter;
        });
    }

    constructor(
        getData: () => Mutation[][],
        private urlWrapper: PatientViewUrlWrapper
    ) {
        super(getData);

        this.dataHighlighter = (mergedMutation: Mutation[]) => {
            const highlightedMutations = [];
            if (!this.onlyShowSelectedInTable) {
                // dont put highlight on selected mutations if those are all we're showing
                highlightedMutations.push(...this.selectedMutations);
            }
            if (this.mouseOverMutation) {
                highlightedMutations.push(this.mouseOverMutation);
            }
            return _.some(highlightedMutations, mutation =>
                mutationMatch(mergedMutation, mutation)
            );
        };
    }
}
