import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    ClinicalAttribute,
    ClinicalDataCountItem,
    ClinicalDataFilter,
    DataFilterValue,
    Gene,
    MolecularDataFilter,
    MolecularProfile,
    NumericGeneMolecularData,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from '../../../shared/api/cbioportalClientInstance';
import internalClient from '../../../shared/api/cbioportalInternalClientInstance';
import { AlterationTypeConstants } from 'shared/constants';
// Imported for its type only (used as a constructor-param annotation, which is
// erased at runtime) so this does not create a runtime import cycle.
import { PatientViewPageStore } from './PatientViewPageStore';

// Sample-level clinical attributes the patient mRNA tab treats as "cancer-type"
// categorizations. The set of these actually present in a given study is
// determined dynamically (see cancerTypeAttributesInStudy below).
const CANCER_TYPE_ATTRIBUTE_IDS = ['CANCER_TYPE', 'CANCER_TYPE_DETAILED'];

export const MRNA_TAB_GENES = ['TP53', 'EGFR', 'KRAS'];

export interface CancerTypeAttributeValues {
    attribute: ClinicalAttribute;
    counts: Array<{ value: string; count: number }>;
}

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

    // User's reference-cohort filter: per attribute id (e.g. CANCER_TYPE_DETAILED),
    // the set of selected values. Values within the same attribute OR together;
    // different attributes AND together (standard study-view semantics).
    @observable.ref selectedCancerTypeFilters: {
        [attributeId: string]: string[];
    } = {};

    @computed get hasCancerTypeFilters(): boolean {
        return Object.values(this.selectedCancerTypeFilters).some(
            v => v.length > 0
        );
    }

    @action.bound
    toggleCancerTypeValue(attributeId: string, value: string) {
        const current = this.selectedCancerTypeFilters[attributeId] || [];
        const next = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        const updated = { ...this.selectedCancerTypeFilters };
        if (next.length === 0) {
            delete updated[attributeId];
        } else {
            updated[attributeId] = next;
        }
        this.selectedCancerTypeFilters = updated;
    }

    @action.bound
    clearCancerTypeFilters() {
        this.selectedCancerTypeFilters = {};
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

    // All clinical attributes defined for the current study (used to discover
    // which "cancer type" categorizations are actually available).
    readonly studyClinicalAttributes = remoteData<ClinicalAttribute[]>(
        {
            invoke: () =>
                getClient().fetchClinicalAttributesUsingPOST({
                    studyIds: [this.parentStore.studyId],
                }),
        },
        []
    );

    // The cancer-type clinical attributes actually defined as sample-level
    // attributes in this study (subset of CANCER_TYPE_ATTRIBUTE_IDS).
    readonly cancerTypeAttributesInStudy = remoteData<ClinicalAttribute[]>(
        {
            await: () => [this.studyClinicalAttributes],
            invoke: () =>
                Promise.resolve(
                    this.studyClinicalAttributes.result!.filter(
                        a =>
                            !a.patientAttribute &&
                            CANCER_TYPE_ATTRIBUTE_IDS.includes(
                                a.clinicalAttributeId
                            )
                    )
                ),
        },
        []
    );

    // For each available cancer-type attribute, the distinct values in the
    // study with their sample counts, sorted by count desc. One server-side
    // aggregation (no client-side rollup needed).
    readonly cancerTypeValueCounts = remoteData<CancerTypeAttributeValues[]>(
        {
            await: () => [this.cancerTypeAttributesInStudy],
            invoke: async () => {
                const attrs = this.cancerTypeAttributesInStudy.result!;
                if (attrs.length === 0) {
                    return [];
                }
                const studyViewFilter = {
                    studyIds: [this.parentStore.studyId],
                } as StudyViewFilter;
                const items: ClinicalDataCountItem[] = await internalClient.fetchClinicalDataCountsUsingPOST(
                    {
                        clinicalDataCountFilter: {
                            attributes: attrs.map(
                                a =>
                                    ({
                                        attributeId: a.clinicalAttributeId,
                                        values: [],
                                    } as ClinicalDataFilter)
                            ),
                            studyViewFilter,
                        },
                    }
                );
                const byAttr = _.keyBy(items, i => i.attributeId);
                return attrs.map(a => ({
                    attribute: a,
                    counts: _.orderBy(
                        byAttr[a.clinicalAttributeId]
                            ? byAttr[a.clinicalAttributeId].counts
                            : [],
                        ['count', 'value'],
                        ['desc', 'asc']
                    ),
                }));
            },
        },
        []
    );

    // Samples matching the user's cancer-type filter. Built as a study-view
    // filter (per-attribute clinical-data filters) and fetched server-side via
    // the internal /filtered-samples endpoint. Empty when no filters are set.
    readonly studyViewFilteredSamples = remoteData<Sample[]>(
        {
            invoke: async () => {
                if (!this.hasCancerTypeFilters) {
                    return [];
                }
                const clinicalDataFilters: ClinicalDataFilter[] = Object.keys(
                    this.selectedCancerTypeFilters
                )
                    .filter(
                        attrId =>
                            this.selectedCancerTypeFilters[attrId].length > 0
                    )
                    .map(attributeId => ({
                        attributeId,
                        values: this.selectedCancerTypeFilters[attributeId].map(
                            v => ({ value: v } as DataFilterValue)
                        ),
                    }));
                const studyViewFilter = {
                    studyIds: [this.parentStore.studyId],
                    clinicalDataFilters,
                } as StudyViewFilter;
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter,
                });
            },
        },
        []
    );

    // The reference cohort actually used by the box plot: the user's
    // cancer-type-filtered set if any, otherwise the whole study.
    readonly effectiveCohortSamples = remoteData<Sample[]>(
        {
            await: () =>
                this.hasCancerTypeFilters
                    ? [this.studyViewFilteredSamples]
                    : [this.allSamplesInStudy],
            invoke: () =>
                Promise.resolve(
                    this.hasCancerTypeFilters
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
