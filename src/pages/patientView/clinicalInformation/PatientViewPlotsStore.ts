import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import { MobxPromise, remoteData } from 'cbioportal-frontend-commons';
import {
    AlterationCountByGene,
    ClinicalAttribute,
    ClinicalDataFilter,
    CoExpression,
    DataFilterValue,
    Gene,
    GeneFilter,
    GeneFilterQuery,
    MolecularDataFilter,
    MolecularProfile,
    NumericGeneMolecularData,
    Sample,
    StructuralVariantFilterQuery,
    StudyViewFilter,
    StudyViewStructuralVariantFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from '../../../shared/api/cbioportalClientInstance';
import internalClient, {
    getInternalClient,
} from '../../../shared/api/cbioportalInternalClientInstance';
import { AlterationTypeConstants } from 'shared/constants';
import {
    GENE_FILTER_QUERY_DEFAULTS,
    STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS,
} from 'pages/studyView/StudyViewUtils';
import {
    findGroupByValue,
    groupValue,
    MRNA_TAB_GENE_GROUPS,
} from 'pages/patientView/mrna/mrnaTabGeneGroups';
// Imported for its type only (used as a constructor-param annotation, which is
// erased at runtime) so this does not create a runtime import cycle.
import { PatientViewPageStore } from './PatientViewPageStore';

// Initial picker selection when the user first lands on the mRNA tab.
// Defaults to the FDA-approved ADC targets group token; falls back to a small
// set of well-known genes if that group has been removed.
const FDA_ADC_GROUP = MRNA_TAB_GENE_GROUPS.find(g => g.id === 'fda-adc');
export const MRNA_TAB_DEFAULT_SELECTIONS: string[] = FDA_ADC_GROUP
    ? [groupValue(FDA_ADC_GROUP)]
    : ['TP53', 'EGFR', 'KRAS'];

export interface MutatedGenePick {
    hugoGeneSymbol: string;
    entrezGeneId: number;
}

export type ReferenceCohortMode =
    | 'all'
    | 'cancer-type'
    | 'cancer-type-detailed';

function togglePick(
    current: MutatedGenePick[],
    gene: MutatedGenePick
): MutatedGenePick[] {
    const exists = current.some(g => g.entrezGeneId === gene.entrezGeneId);
    return exists
        ? current.filter(g => g.entrezGeneId !== gene.entrezGeneId)
        : [...current, gene];
}

// Translate the patient-view filter selections into a StudyViewFilter the
// internal /filtered-samples and /<x>-genes endpoints understand. Exported so
// the modal's draft state can produce the same shape.
export function buildStudyViewFilter(
    studyId: string,
    clinicalFilters: { [attrId: string]: DataFilterValue[] },
    mutatedGenes: MutatedGenePick[],
    cnaGenes: MutatedGenePick[],
    svGenes: MutatedGenePick[],
    mutationProfile: MolecularProfile | undefined,
    cnaProfile: MolecularProfile | undefined,
    svProfile: MolecularProfile | undefined
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
    if (cnaGenes.length > 0 && cnaProfile) {
        // Match deep CNAs (AMP / HOMDEL) — the standard "altered" CNA criterion.
        geneFilters.push({
            molecularProfileIds: [cnaProfile.molecularProfileId],
            geneQueries: cnaGenes.map(g => [
                {
                    ...GENE_FILTER_QUERY_DEFAULTS,
                    alterations: ['AMP', 'HOMDEL'],
                    hugoGeneSymbol: g.hugoGeneSymbol,
                    entrezGeneId: g.entrezGeneId,
                } as GeneFilterQuery,
            ]),
        });
    }
    const structuralVariantFilters: StudyViewStructuralVariantFilter[] = [];
    if (svGenes.length > 0 && svProfile) {
        structuralVariantFilters.push({
            molecularProfileIds: [svProfile.molecularProfileId],
            structVarQueries: svGenes.map(g => [
                {
                    ...STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS,
                    gene1Query: {
                        hugoSymbol: g.hugoGeneSymbol,
                        entrezId: g.entrezGeneId,
                        specialValue: 'NO_GENE',
                    },
                    gene2Query: {
                        ...STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS.gene2Query,
                        specialValue: 'ANY_GENE',
                    },
                } as StructuralVariantFilterQuery,
            ]),
        });
    }
    return {
        studyIds: [studyId],
        clinicalDataFilters,
        geneFilters,
        structuralVariantFilters,
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

    // Items selected in the mRNA tab gene chooser. Each entry is either a
    // Hugo gene symbol or a "group:<id>" token for a predefined preset; the
    // chart renders one row per unique resolved gene (see effectiveGeneSymbols).
    @observable.ref mrnaTabSelections: string[] = MRNA_TAB_DEFAULT_SELECTIONS;

    @action.bound
    setMrnaTabSelections(items: string[]) {
        this.mrnaTabSelections = items;
    }

    // Unique genes mutated in the current patient's (or sample's) samples,
    // derived from the parent store's mutation data. Returns gene symbol +
    // entrez id for downstream cohort-frequency lookup.
    @computed get patientMutatedGenes(): MutatedGenePick[] {
        return _(this.parentStore.mutationData.result || [])
            .map(m => m.gene)
            .filter(g => !!(g && g.hugoGeneSymbol && g.entrezGeneId))
            .uniqBy(g => g.entrezGeneId)
            .map(g => ({
                hugoGeneSymbol: g.hugoGeneSymbol,
                entrezGeneId: g.entrezGeneId,
            }))
            .value();
    }

    // Flatten group selections into their constituent gene symbols, preserving
    // selection order and de-duplicating across overlapping picks.
    @computed get effectiveGeneSymbols(): string[] {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const item of this.mrnaTabSelections) {
            const group = findGroupByValue(item);
            const symbols = group ? group.genes : [item];
            for (const sym of symbols) {
                if (!seen.has(sym)) {
                    seen.add(sym);
                    out.push(sym);
                }
            }
        }
        return out;
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

    // Distinct CANCER_TYPE / CANCER_TYPE_DETAILED values of the current
    // patient's (or sample's) samples, used by the simplified
    // three-radio reference-cohort selector.
    @computed get currentSampleCancerTypes(): string[] {
        return _(this.parentStore.clinicalDataForSamples.result || [])
            .filter(d => d.clinicalAttributeId === 'CANCER_TYPE')
            .map(d => d.value)
            .filter(v => !!v && v.trim().length > 0)
            .uniq()
            .value();
    }

    @computed get currentSampleCancerTypesDetailed(): string[] {
        return _(this.parentStore.clinicalDataForSamples.result || [])
            .filter(d => d.clinicalAttributeId === 'CANCER_TYPE_DETAILED')
            .map(d => d.value)
            .filter(v => !!v && v.trim().length > 0)
            .uniq()
            .value();
    }

    // Which radio is active for the simplified cohort selector. Derived
    // from selectedClinicalFilters so the radios stay in sync with the
    // underlying filter state.
    @computed get referenceCohortMode(): ReferenceCohortMode {
        const filters = this.selectedClinicalFilters;
        if (
            filters['CANCER_TYPE_DETAILED'] &&
            filters['CANCER_TYPE_DETAILED'].length > 0
        ) {
            return 'cancer-type-detailed';
        }
        if (filters['CANCER_TYPE'] && filters['CANCER_TYPE'].length > 0) {
            return 'cancer-type';
        }
        return 'all';
    }

    @action.bound
    setReferenceCohortMode(mode: ReferenceCohortMode) {
        // The radio selector replaces (rather than augments) any existing
        // filter, including mutated/CNA/SV gene picks.
        this.selectedMutatedGenes = [];
        this.selectedCNAGenes = [];
        this.selectedSVGenes = [];
        if (mode === 'all') {
            this.selectedClinicalFilters = {};
            return;
        }
        const values =
            mode === 'cancer-type'
                ? this.currentSampleCancerTypes
                : this.currentSampleCancerTypesDetailed;
        if (values.length === 0) {
            this.selectedClinicalFilters = {};
            return;
        }
        const attributeId =
            mode === 'cancer-type' ? 'CANCER_TYPE' : 'CANCER_TYPE_DETAILED';
        this.selectedClinicalFilters = {
            [attributeId]: values.map(v => ({ value: v } as DataFilterValue)),
        };
    }

    // Selected mutated / CNA / SV genes. Each list = samples with ≥1 alteration
    // of that kind in ANY of the selected genes (OR within the list).
    @observable.ref selectedMutatedGenes: MutatedGenePick[] = [];
    @observable.ref selectedCNAGenes: MutatedGenePick[] = [];
    @observable.ref selectedSVGenes: MutatedGenePick[] = [];

    @computed get hasMutatedGenes(): boolean {
        return this.selectedMutatedGenes.length > 0;
    }

    @computed get hasCNAGenes(): boolean {
        return this.selectedCNAGenes.length > 0;
    }

    @computed get hasSVGenes(): boolean {
        return this.selectedSVGenes.length > 0;
    }

    @computed get hasAnyFilter(): boolean {
        return (
            this.hasClinicalFilters ||
            this.hasMutatedGenes ||
            this.hasCNAGenes ||
            this.hasSVGenes
        );
    }

    @action.bound
    toggleMutatedGene(gene: MutatedGenePick) {
        this.selectedMutatedGenes = togglePick(
            this.selectedMutatedGenes,
            gene
        );
    }

    @action.bound
    toggleCNAGene(gene: MutatedGenePick) {
        this.selectedCNAGenes = togglePick(this.selectedCNAGenes, gene);
    }

    @action.bound
    toggleSVGene(gene: MutatedGenePick) {
        this.selectedSVGenes = togglePick(this.selectedSVGenes, gene);
    }

    @action.bound
    setMutatedGenes(genes: MutatedGenePick[]) {
        this.selectedMutatedGenes = genes.slice();
    }

    @action.bound
    setCNAGenes(genes: MutatedGenePick[]) {
        this.selectedCNAGenes = genes.slice();
    }

    @action.bound
    setSVGenes(genes: MutatedGenePick[]) {
        this.selectedSVGenes = genes.slice();
    }

    @action.bound
    clearMutatedGenes() {
        this.selectedMutatedGenes = [];
    }

    @action.bound
    clearAllFilters() {
        this.selectedClinicalFilters = {};
        this.selectedMutatedGenes = [];
        this.selectedCNAGenes = [];
        this.selectedSVGenes = [];
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

    // Full list of cohort-mutated genes in the currently effective reference
    // cohort, sorted by altered-case count desc. Re-runs when the cohort
    // narrows. Used to look up per-gene cohort mutation frequency in the
    // Genes picker.
    readonly cohortMutatedGenes = remoteData<AlterationCountByGene[]>(
        {
            await: () => [this.mutationMolecularProfile],
            invoke: async () => {
                if (!this.mutationMolecularProfile.result) {
                    return [];
                }
                const result = await internalClient.fetchMutatedGenesUsingPOST(
                    {
                        studyViewFilter: this.committedStudyViewFilter,
                    }
                );
                return _.orderBy(
                    result,
                    ['numberOfAlteredCases', 'hugoGeneSymbol'],
                    ['desc', 'asc']
                );
            },
        },
        []
    );

    // entrezGeneId -> cohort altered-case entry, for O(1) lookups when
    // annotating patient-mutated genes with their cohort frequency.
    @computed get cohortMutatedGenesByEntrez(): {
        [entrezId: number]: AlterationCountByGene;
    } {
        return _.keyBy(
            this.cohortMutatedGenes.result || [],
            g => g.entrezGeneId
        );
    }

    // Study's primary mutation / CNA / SV profiles, used when constructing
    // gene-based study-view filters.
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

    readonly cnaMolecularProfile = remoteData<MolecularProfile | undefined>({
        await: () => [this.parentStore.molecularProfilesInStudy],
        invoke: async () =>
            this.parentStore.molecularProfilesInStudy.result!.find(
                p =>
                    p.molecularAlterationType ===
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                    p.datatype === 'DISCRETE'
            ),
    });

    readonly svMolecularProfile = remoteData<MolecularProfile | undefined>({
        await: () => [this.parentStore.molecularProfilesInStudy],
        invoke: async () =>
            this.parentStore.molecularProfilesInStudy.result!.find(
                p =>
                    p.molecularAlterationType ===
                    AlterationTypeConstants.STRUCTURAL_VARIANT
            ),
    });

    // Build the study-view filter representing the currently committed cohort
    // (clinical filters + mutated/CNA/SV gene filters).
    @computed get committedStudyViewFilter(): StudyViewFilter {
        return buildStudyViewFilter(
            this.parentStore.studyId,
            this.selectedClinicalFilters,
            this.selectedMutatedGenes,
            this.selectedCNAGenes,
            this.selectedSVGenes,
            this.mutationMolecularProfile.result,
            this.cnaMolecularProfile.result,
            this.svMolecularProfile.result
        );
    }

    // Samples matching the user's filter selection. Built as a study-view
    // filter and resolved server-side via the internal /filtered-samples
    // endpoint. Empty when no filters are set.
    readonly studyViewFilteredSamples = remoteData<Sample[]>(
        {
            await: () => [
                this.mutationMolecularProfile,
                this.cnaMolecularProfile,
                this.svMolecularProfile,
            ],
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

    // entrezGeneId -> Gene lookup so the co-expression results (which only
    // carry entrez ids) can be resolved to hugo symbols.
    @computed get allGenesByEntrezId(): { [entrezGeneId: number]: Gene } {
        return _.keyBy(
            this.mrnaTabAllGenes.result || [],
            g => g.entrezGeneId
        );
    }

    // Lazy per-gene cache of top-correlated genes within the effective cohort.
    // Populated only when something (tooltip hover, chip-row hover) calls
    // requestCoExpressionsForGene — we don't want to spend N parallel fetches
    // on chart load when the user might never hover any of those rows.
    // The cohort/profile identity is baked into the cache key so a cohort or
    // profile change invalidates the cache.
    @observable.shallow private _coExpressionCache = new Map<
        string,
        MobxPromise<CoExpression[]>
    >();

    @computed private get coExpressionCacheKeyPrefix(): string {
        const profileId =
            (this.mrnaExpressionMolecularProfile.result &&
                this.mrnaExpressionMolecularProfile.result.molecularProfileId) ||
            '';
        const sampleIds = (this.effectiveCohortSamples.result || [])
            .map(s => s.sampleId)
            .sort()
            .join(',');
        return `${profileId}|${sampleIds}`;
    }

    @action.bound
    requestCoExpressionsForGene(
        entrezGeneId: number
    ): MobxPromise<CoExpression[]> {
        const key = `${this.coExpressionCacheKeyPrefix}|${entrezGeneId}`;
        let p = this._coExpressionCache.get(key);
        if (p) return p;
        const profilePromise = this.mrnaExpressionMolecularProfile;
        const samplesPromise = this.effectiveCohortSamples;
        p = remoteData<CoExpression[]>(
            {
                await: () => [profilePromise, samplesPromise],
                invoke: async () => {
                    const profile = profilePromise.result;
                    if (!profile) return [];
                    const sampleIds = (samplesPromise.result || []).map(
                        s => s.sampleId
                    );
                    if (sampleIds.length === 0) return [];
                    const client = getInternalClient();
                    const data = await client
                        .fetchCoExpressionsUsingPOST({
                            molecularProfileIdA: profile.molecularProfileId,
                            molecularProfileIdB: profile.molecularProfileId,
                            threshold: 0.3,
                            coExpressionFilter: {
                                entrezGeneId,
                                sampleIds,
                            } as any,
                        })
                        .catch(() => [] as CoExpression[]);
                    return _.orderBy(
                        data.filter(
                            r =>
                                Number(r.geneticEntityId) !== entrezGeneId &&
                                r.spearmansCorrelation !== null &&
                                Number.isFinite(r.spearmansCorrelation)
                        ),
                        r => Math.abs(r.spearmansCorrelation),
                        'desc'
                    ).slice(0, 5);
                },
            },
            []
        );
        this._coExpressionCache.set(key, p);
        return p;
    }

    // Read-only accessor for components that want to display whatever is
    // already in the cache without triggering a fetch. Returns undefined when
    // nothing has asked for this gene yet.
    peekCoExpressionsForGene(
        entrezGeneId: number
    ): MobxPromise<CoExpression[]> | undefined {
        const key = `${this.coExpressionCacheKeyPrefix}|${entrezGeneId}`;
        return this._coExpressionCache.get(key);
    }

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

    // Resolve the effective gene symbols (after expanding groups) to Gene
    // objects (for entrez ids).
    readonly mrnaTabGenes = remoteData<Gene[]>(
        {
            invoke: () => {
                const symbols = this.effectiveGeneSymbols;
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
