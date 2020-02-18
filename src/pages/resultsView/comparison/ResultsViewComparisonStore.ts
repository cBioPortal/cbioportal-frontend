import { action, computed, observable } from 'mobx';
import { ResultsViewComparisonSubTab } from '../ResultsViewPageHelpers';
import ComparisonStore, { OverlapStrategy } from '../../../shared/lib/comparison/ComparisonStore';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import { AppStore } from '../../../AppStore';
import autobind from 'autobind-decorator';
import { remoteData } from 'cbioportal-frontend-commons';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { makeUniqueColorGetter } from '../../../shared/components/plots/PlotUtils';
import { ResultsViewComparisonGroup } from './ResultsViewComparisonUtils';
import { getStudiesAttr } from '../../groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';

export default class ResultsViewComparisonStore extends ComparisonStore {
    private uniqueColorGetter = makeUniqueColorGetter();
    private alteredColor = this.uniqueColorGetter();
    private unalteredColor = this.uniqueColorGetter();

    @observable private _currentTabId: ResultsViewComparisonSubTab | undefined = undefined;

    constructor(
        appStore: AppStore,
        private urlWrapper: ResultsViewURLWrapper,
        protected resultsViewStore: ResultsViewPageStore
    ) {
        super(appStore, resultsViewStore);
    }

    @action public updateOverlapStrategy(strategy: OverlapStrategy) {
        this.urlWrapper.updateURL({ comparison_overlapStrategy: strategy });
    }

    @computed get overlapStrategy() {
        return (
            (this.urlWrapper.query.comparison_overlapStrategy as OverlapStrategy) ||
            OverlapStrategy.EXCLUDE
        );
    }

    @computed
    public get usePatientLevelEnrichments() {
        return this.urlWrapper.query.patient_enrichments === 'true';
    }

    @autobind
    @action
    public setUsePatientLevelEnrichments(e: boolean) {
        this.urlWrapper.updateURL({ patient_enrichments: e.toString() });
    }

    readonly _originalGroups = remoteData<ResultsViewComparisonGroup[]>({
        await: () => [
            this.resultsViewStore.alteredSampleKeys,
            this.resultsViewStore.alteredPatientKeys,
            this.resultsViewStore.unalteredSampleKeys,
            this.resultsViewStore.unalteredPatientKeys,
            this.resultsViewStore.studyIds,
            this.resultsViewStore.alteredSamples,
            this.resultsViewStore.unalteredSamples,
            this.resultsViewStore.alteredPatients,
            this.resultsViewStore.unalteredPatients,
        ],
        invoke: () => {
            const studyIds = this.resultsViewStore.studyIds.result!;
            const patientLevel = this.usePatientLevelEnrichments;

            return Promise.resolve([
                {
                    name: 'Altered group',
                    description: `Number (percentage) of ${
                        patientLevel ? 'patients' : 'samples'
                    } that have alterations in the query gene(s) that also have a deep deletion in the listed gene.`,
                    studies: getStudiesAttr(
                        this.resultsViewStore.alteredSamples.result!,
                        this.resultsViewStore.alteredSamples.result!.map(s => ({
                            studyId: s.studyId,
                            patientId: s.patientId,
                        }))
                    ),
                    origin: studyIds,
                    color: '#ff0000',
                    uid: 'altered',
                    ordinal: '',
                    nameWithOrdinal: 'Altered group',
                    nameOfEnrichmentDirection: '', //nameOfEnrichmentDirection: "Co-occurrence",
                    count: patientLevel
                        ? this.resultsViewStore.alteredPatientKeys.result!.length
                        : this.resultsViewStore.alteredSampleKeys.result!.length,
                    nonExistentSamples: [],
                },
                {
                    name: 'Unaltered group',
                    description: `Number (percentage) of ${
                        patientLevel ? 'patients' : 'samples'
                    } that do not have alterations in the query gene(s) that have a deep deletion in the listed gene.`,
                    studies: getStudiesAttr(
                        this.resultsViewStore.unalteredSamples.result!,
                        this.resultsViewStore.unalteredSamples.result!.map(s => ({
                            studyId: s.studyId,
                            patientId: s.patientId,
                        }))
                    ),
                    origin: studyIds,
                    color: '#0000ff',
                    uid: 'unaltered',
                    ordinal: '',
                    nameWithOrdinal: 'Unaltered group',
                    nameOfEnrichmentDirection: '', //nameOfEnrichmentDirection: "Mutual exclusivity",
                    count: patientLevel
                        ? this.resultsViewStore.unalteredPatientKeys.result!.length
                        : this.resultsViewStore.unalteredSampleKeys.result!.length,
                    nonExistentSamples: [],
                },
            ]);
        },
    });

    public isGroupSelected(name: string) {
        // we don't do select/deselect in results view comparison tab - everything selected
        return true;
    }

    public get samples() {
        return this.resultsViewStore.samples;
    }

    public get studies() {
        return this.resultsViewStore.studies;
    }
}
