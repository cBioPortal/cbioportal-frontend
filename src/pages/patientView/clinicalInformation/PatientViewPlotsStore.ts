import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    ClinicalAttribute,
    ClinicalDataFilter,
    DataFilterValue,
    Gene,
    GeneFilter,
    GeneFilterQuery,
    MolecularDataFilter,
    MolecularProfile,
    NumericGeneMolecularData,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from '../../../shared/api/cbioportalClientInstance';
import internalClient from '../../../shared/api/cbioportalInternalClientInstance';
import { AlterationTypeConstants } from 'shared/constants';
import { GENE_FILTER_QUERY_DEFAULTS } from 'pages/studyView/StudyViewUtils';
// Imported for its type only (used as a constructor-param annotation, which is
// erased at runtime) so this does not create a runtime import cycle.
import { PatientViewPageStore } from './PatientViewPageStore';

export const MRNA_TAB_GENES = ['TP53', 'EGFR', 'KRAS'];

export interface MutatedGenePick {
    hugoGeneSymbol: string;
    entrezGeneId: number;
}

// Translate the patient-view filter selections into a StudyViewFilter the
// internal /filtered-samples and /mutated-genes endpoints understand.
// Exported so the modal's draft state can produce the same shape.
export function buildStudyViewFilter(
    studyId: string,
    clinicalFilters: { [attrId: string]: DataFilterValue[] },
    mutatedGenes: MutatedGenePick[],
    mutationProfile: MolecularProfile | undefined
): StudyViewFilter {
    const clinicalDataFilters: ClinicalDataFilter[] = Object.keys(
        clinicalFilters
    )
        .filter(attrId => clinicalFilters[attrId].length > 0)
        .map(attributeId => ({
            attributeId,
            values: clinicalFilters[attributeId],
        }));
    const geneFilters: GeneFilter[] = [];
    if (mutatedGenes.length > 0 && mutationProfile) {
        // Each selected gene is its own OR row; samples mutated in ANY of the
        // selected genes match.
        geneFilters.push({
            molecularProfileIds: [mutationProfile.molecularProfileId],
            geneQueries: mutatedGenes.map(g => [
                {
                    ...GENE_FILTER_QUERY_DEFAULTS,
                    hugoGeneSymbol: g.hugoGeneSymbol,
                    entrezGeneId: g.entrezGeneId,
                } as GeneFilterQuery,
            ]),
        });
    }
    return {
        studyIds: [studyId],
        clinicalDataFilters,
        geneFilters,
    } as StudyViewFilter;
}

// Clinical attribute IDs we never want to expose as cohort filters — IDs and
// other identifier-shaped fields that don't make sense to filter on.
const FILTER_DENY_LIST = new Set([
    'SAMPLE_ID',
    'PATIENT_ID',
    'UNIQUE_SAMPLE_KEY',
    'UNIQUE_PATIENT_KEY',
    'OTHER_SAMPLE_ID',
    'OTHER_PATIENT_ID',
]);

// Holds state/data for the patient view plots (currently the mRNA tab).
// Kept out of PatientViewPageStore; references the parent store for shared
// context (studyId, molecular profiles).
export class PatientViewPlotsStore {
    constructor(private parentStore: PatientViewPageStore) {
        makeObservable(this);
    }

    // Genes selected in the mRNA tab gene chooser (drives the chart).
    @observable.ref mrnaTabGeneSymbols: string[] = MRNA_TAB_GENES;

    @action.bound
    setMrnaTabGeneSymbols(symbols: string[]) {
        this.mrnaTabGeneSymbols = symbols;
    }

    // User's reference-cohort filter: per clinical-attribute id, the set of
    // selected DataFilterValues. Each entry is either a categorical value
    // ({ value: 'X' }) or a numeric range ({ start: N, end: M }). Within an
    // attribute the values OR together; across attributes they AND together
    // (standard study-view semantics).
    @observable.ref selectedClinicalFilters: {
        [attributeId: string]: DataFilterValue[];
    } = {};

    @computed get hasClinicalFilters(): boolean {
        return Object.values(this.selectedClinicalFilters).some(
            v => v.length > 0
        );
    }

    // Atomic replace — used by the modal chooser to commit a draft of edits
    // in one shot (no intermediate refetches while the user is picking).
    @action.bound
    setClinicalFilters(filters: { [attributeId: string]: DataFilterValue[] }) {
        const next: { [attributeId: string]: DataFilterValue[] } = {};
        for (const k of Object.keys(filters)) {
            if (filters[k].length > 0) {
                next[k] = filters[k].slice();
            }
        }
        this.selectedClinicalFilters = next;
    }

    // Remove a single value (categorical) or single range (numeric) from a
    // single attribute. Used by the summary-bar chip's × button.
    @action.bound
    removeClinicalFilterValue(attributeId: string, dfv: DataFilterValue) {
        const current = this.selectedClinicalFilters[attributeId] || [];
        const next = current.filter(
            v =>
                !(
                    v.value === dfv.value &&
                    v.start === dfv.start &&
                    v.end === dfv.end
                )
        );
        const updated = { ...this.selectedClinicalFilters };
        if (next.length === 0) {
            delete updated[attributeId];
        } else {
            updated[attributeId] = next;
        }
        this.selectedClinicalFilters = updated;
    }

    @action.bound
    clearClinicalFilters() {
        this.selectedClinicalFilters = {};
    }

    // Selected mutated genes (cohort = samples with ≥1 mutation in any of
    // these genes in the study's mutation profile). Multiple genes OR.
    @observable.ref selectedMutatedGenes: MutatedGenePick[] = [];

    @computed get hasMutatedGenes(): boolean {
        return this.selectedMutatedGenes.length > 0;
    }

    @computed get hasAnyFilter(): boolean {
        return this.hasClinicalFilters || this.hasMutatedGenes;
    }

    @action.bound
    toggleMutatedGene(gene: MutatedGenePick) {
        const exists = this.selectedMutatedGenes.some(
            g => g.entrezGeneId === gene.entrezGeneId
        );
        this.selectedMutatedGenes = exists
            ? this.selectedMutatedGenes.filter(
                  g => g.entrezGeneId !== gene.entrezGeneId
              )
            : [...this.selectedMutatedGenes, gene];
    }

    @action.bound
    setMutatedGenes(genes: MutatedGenePick[]) {
        this.selectedMutatedGenes = genes.slice();
    }

    @action.bound
    clearMutatedGenes() {
        this.selectedMutatedGenes = [];
    }

    @action.bound
    clearAllFilters() {
        this.selectedClinicalFilters = {};
        this.selectedMutatedGenes = [];
    }

    // All samples in the study the current patient belongs to.
    readonly allSamplesInStudy = remoteData<Sample[]>(
        {
            invoke: () =>
                getClient().getAllSamplesInStudyUsingGET({
                    studyId: this.parentStore.studyId,
                }),
        },
        []
    );

    // All clinical attributes defined for the current study.
    readonly studyClinicalAttributes = remoteData<ClinicalAttribute[]>(
        {
            invoke: () =>
                getClient().fetchClinicalAttributesUsingPOST({
                    studyIds: [this.parentStore.studyId],
                }),
        },
        []
    );

    // The clinical attributes we expose in the reference-cohort chooser:
    // STRING or NUMBER datatype, excluding identifier-shaped fields. Sorted
    // by displayName for stable left-pane order.
    readonly filterableClinicalAttributes = remoteData<ClinicalAttribute[]>(
        {
            await: () => [this.studyClinicalAttributes],
            invoke: () =>
                Promise.resolve(
                    _.sortBy(
                        this.studyClinicalAttributes.result!.filter(
                            a =>
                                (a.datatype === 'STRING' ||
                                    a.datatype === 'NUMBER') &&
                                !FILTER_DENY_LIST.has(a.clinicalAttributeId)
                        ),
                        a => a.displayName.toLowerCase()
                    )
                ),
        },
        []
    );

    // Study's primary mutation profile, used when constructing gene-mutation
    // study-view filters.
    readonly mutationMolecularProfile = remoteData<
        MolecularProfile | undefined
    >({
        await: () => [this.parentStore.molecularProfilesInStudy],
        invoke: async () =>
            this.parentStore.molecularProfilesInStudy.result!.find(
                p =>
                    p.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_EXTENDED
            ),
    });

    // Build the study-view filter representing the currently committed cohort
    // (clinical filters + mutated-gene filters).
    @computed get committedStudyViewFilter(): StudyViewFilter {
        return buildStudyViewFilter(
            this.parentStore.studyId,
            this.selectedClinicalFilters,
            this.selectedMutatedGenes,
            this.mutationMolecularProfile.result
        );
    }

    // Samples matching the user's filter selection. Built as a study-view
    // filter and resolved server-side via the internal /filtered-samples
    // endpoint. Empty when no filters are set.
    readonly studyViewFilteredSamples = remoteData<Sample[]>(
        {
            await: () => [this.mutationMolecularProfile],
            invoke: async () => {
                if (!this.hasAnyFilter) {
                    return [];
                }
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: this.committedStudyViewFilter,
                });
            },
        },
        []
    );

    // The reference cohort actually used by the box plot: the filtered set if
    // any filters are active, otherwise the whole study.
    readonly effectiveCohortSamples = remoteData<Sample[]>(
        {
            await: () =>
                this.hasAnyFilter
                    ? [this.studyViewFilteredSamples]
                    : [this.allSamplesInStudy],
            invoke: () =>
                Promise.resolve(
                    this.hasAnyFilter
                        ? this.studyViewFilteredSamples.result!
                        : this.allSamplesInStudy.result!
                ),
        },
        []
    );

    // First mRNA expression molecular profile in the study.
    readonly mrnaExpressionMolecularProfile = remoteData<
        MolecularProfile | undefined
    >({
        await: () => [this.parentStore.molecularProfilesInStudy],
        invoke: async () =>
            this.parentStore.molecularProfilesInStudy.result!.find(
                p =>
                    p.molecularAlterationType ===
                    AlterationTypeConstants.MRNA_EXPRESSION
            ),
    });

    // Full gene list for the mRNA tab gene chooser options.
    readonly mrnaTabAllGenes = remoteData<Gene[]>(
        {
            invoke: () =>
                getClient().getAllGenesUsingGET({ projection: 'SUMMARY' }),
        },
        []
    );

    // Resolve the selected gene symbols to Gene objects (for entrez ids).
    readonly mrnaTabGenes = remoteData<Gene[]>(
        {
            invoke: () => {
                const symbols = this.mrnaTabGeneSymbols;
                if (symbols.length === 0) {
                    return Promise.resolve([]);
                }
                return getClient().fetchGenesUsingPOST({
                    geneIdType: 'HUGO_GENE_SYMBOL',
                    geneIds: symbols.map(g => g.toUpperCase()),
                });
            },
        },
        []
    );

    // mRNA expression data for the selected genes across the effective cohort.
    readonly mrnaExpressionDataForGenes = remoteData<
        NumericGeneMolecularData[]
    >(
        {
            await: () => [
                this.mrnaExpressionMolecularProfile,
                this.effectiveCohortSamples,
                this.mrnaTabGenes,
            ],
            invoke: async () => {
                const profile = this.mrnaExpressionMolecularProfile.result;
                if (!profile) {
                    return [];
                }
                return getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: profile.molecularProfileId,
                        molecularDataFilter: {
                            entrezGeneIds: this.mrnaTabGenes.result!.map(
                                g => g.entrezGeneId
                            ),
                            sampleIds: this.effectiveCohortSamples.result!.map(
                                s => s.sampleId
                            ),
                        } as MolecularDataFilter,
                    }
                );
            },
        },
        []
    );
}
