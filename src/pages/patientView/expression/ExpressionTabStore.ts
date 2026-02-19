import { observable, computed, action, makeObservable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    NumericGeneMolecularData,
    MolecularDataFilter,
    Mutation,
    DiscreteCopyNumberData,
    StructuralVariant,
    Gene,
} from 'cbioportal-ts-api-client';
import { getClient } from '../../../shared/api/cbioportalClientInstance';
import _ from 'lodash';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import SampleManager from '../SampleManager';

export type AlterationFilterType = 'mutation' | 'cna' | 'fusion';

export interface GeneRow {
    hugoGeneSymbol: string;
    entrezGeneId: number;
    zScoresBySample: { [sampleId: string]: number };
    mutations: { [sampleId: string]: Mutation[] };
    cnaAlterations: { [sampleId: string]: DiscreteCopyNumberData[] };
    fusions: { [sampleId: string]: StructuralVariant[] };
    maxAbsZScore: number;
    hasMutation: boolean;
    hasCna: boolean;
    hasFusion: boolean;
}

export interface WaterfallDatum {
    x: number;
    y: number;
    sampleId: string;
    isPatientSample: boolean;
    color: string;
    label: string;
    sampleType: string;
    studyId: string;
}

export default class ExpressionTabStore {
    constructor(
        private pageStore: PatientViewPageStore,
        private sampleManager: SampleManager | null
    ) {
        makeObservable(this);
    }

    @observable selectedGeneEntrezId: number | undefined = undefined;
    @observable geneFilter: string = '';
    @observable activeAlterationFilters = observable.set<
        AlterationFilterType
    >();
    @observable sortColumn: string = 'maxAbsZScore';
    @observable sortDirection: 'asc' | 'desc' = 'desc';

    // Cache for cohort data per gene to avoid refetching
    private cohortDataCache = new Map<number, NumericGeneMolecularData[]>();

    @action
    setSelectedGene(entrezGeneId: number) {
        this.selectedGeneEntrezId = entrezGeneId;
    }

    @action
    setGeneFilter(filter: string) {
        this.geneFilter = filter;
    }

    @action
    toggleAlterationFilter(filterType: AlterationFilterType) {
        if (this.activeAlterationFilters.has(filterType)) {
            this.activeAlterationFilters.delete(filterType);
        } else {
            this.activeAlterationFilters.add(filterType);
        }
    }

    @action
    setSort(column: string) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = column === 'hugoGeneSymbol' ? 'asc' : 'desc';
        }
    }

    @computed get studyId(): string {
        return this.pageStore.studyId;
    }

    @computed get mrnaProfileId(): string | null {
        if (
            this.pageStore.mrnaRankMolecularProfileId.isComplete &&
            this.pageStore.mrnaRankMolecularProfileId.result
        ) {
            return this.pageStore.mrnaRankMolecularProfileId.result;
        }
        return null;
    }

    readonly entrezGeneIdToGene = remoteData<{ [entrezGeneId: number]: Gene }>(
        {
            await: () => [this.patientExpressionData],
            invoke: async () => {
                const expressionData = this.patientExpressionData.result;
                if (!expressionData || expressionData.length === 0) {
                    return {};
                }
                const uniqueEntrezIds = _.uniq(
                    expressionData.map(d => d.entrezGeneId)
                );
                const genes = await getClient().fetchGenesUsingPOST({
                    geneIdType: 'ENTREZ_GENE_ID',
                    geneIds: uniqueEntrezIds.map(id => id.toString()),
                });
                return _.keyBy(genes, g => g.entrezGeneId) as {
                    [entrezGeneId: number]: Gene;
                };
            },
        },
        {}
    );

    readonly patientExpressionData = remoteData<NumericGeneMolecularData[]>(
        {
            await: () => [
                this.pageStore.mrnaRankMolecularProfileId,
                this.pageStore.samples,
            ],
            invoke: async () => {
                const profileId = this.mrnaProfileId;
                if (!profileId) {
                    return [];
                }
                return getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: profileId,
                        molecularDataFilter: {
                            sampleIds: this.pageStore.sampleIds,
                        } as MolecularDataFilter,
                    }
                );
            },
        },
        []
    );

    readonly cohortExpressionData = remoteData<NumericGeneMolecularData[]>(
        {
            await: () => [this.pageStore.mrnaRankMolecularProfileId],
            invoke: async () => {
                const profileId = this.mrnaProfileId;
                const entrezId = this.selectedGeneEntrezId;
                if (!profileId || entrezId === undefined) {
                    return [];
                }
                // Check cache first
                if (this.cohortDataCache.has(entrezId)) {
                    return this.cohortDataCache.get(entrezId)!;
                }
                const data = await getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: profileId,
                        molecularDataFilter: {
                            entrezGeneIds: [entrezId],
                            sampleListId: `${this.pageStore.studyId}_all`,
                        } as MolecularDataFilter,
                    }
                );
                this.cohortDataCache.set(entrezId, data);
                return data;
            },
        },
        []
    );

    @computed get geneRows(): GeneRow[] {
        if (
            !this.patientExpressionData.isComplete ||
            !this.entrezGeneIdToGene.isComplete
        ) {
            return [];
        }

        const expressionData = this.patientExpressionData.result;
        const geneMap = this.entrezGeneIdToGene.result;
        const mutations = this.pageStore.mutationData.isComplete
            ? this.pageStore.mutationData.result
            : [];
        const cnaData = this.pageStore.discreteCNAData.isComplete
            ? this.pageStore.discreteCNAData.result
            : [];
        const svData = this.pageStore.structuralVariantData.isComplete
            ? this.pageStore.structuralVariantData.result
            : [];

        // Group expression data by gene
        const byGene = _.groupBy(expressionData, d => d.entrezGeneId);

        // Index mutations by gene+sample
        const mutationsByGene = _.groupBy(mutations, m => m.entrezGeneId);
        const cnaByGene = _.groupBy(cnaData, d => d.entrezGeneId);

        // SVs can involve two genes; index by both
        const svByGene: { [entrezId: number]: StructuralVariant[] } = {};
        for (const sv of svData) {
            if (sv.site1EntrezGeneId) {
                if (!svByGene[sv.site1EntrezGeneId]) {
                    svByGene[sv.site1EntrezGeneId] = [];
                }
                svByGene[sv.site1EntrezGeneId].push(sv);
            }
            if (
                sv.site2EntrezGeneId &&
                sv.site2EntrezGeneId !== sv.site1EntrezGeneId
            ) {
                if (!svByGene[sv.site2EntrezGeneId]) {
                    svByGene[sv.site2EntrezGeneId] = [];
                }
                svByGene[sv.site2EntrezGeneId].push(sv);
            }
        }

        const rows: GeneRow[] = [];

        for (const entrezIdStr of Object.keys(byGene)) {
            const entrezGeneId = parseInt(entrezIdStr, 10);
            const geneDatums = byGene[entrezIdStr];
            const gene = geneMap[entrezGeneId];
            const hugoGeneSymbol = gene
                ? gene.hugoGeneSymbol
                : `Gene_${entrezGeneId}`;

            const zScoresBySample: { [sampleId: string]: number } = {};
            for (const d of geneDatums) {
                zScoresBySample[d.sampleId] = d.value;
            }

            // Mutations for this gene per sample
            const geneMutations: Mutation[] = (mutationsByGene[entrezGeneId] ||
                []) as Mutation[];
            const mutsBySample: { [sampleId: string]: Mutation[] } = _.groupBy(
                geneMutations,
                (m: Mutation) => m.sampleId
            );

            // CNA for this gene per sample
            const geneCna: DiscreteCopyNumberData[] = (cnaByGene[
                entrezGeneId
            ] || []) as DiscreteCopyNumberData[];
            const cnaBySample: {
                [sampleId: string]: DiscreteCopyNumberData[];
            } = _.groupBy(geneCna, (d: DiscreteCopyNumberData) => d.sampleId);

            // Fusions for this gene per sample
            const geneSvs = svByGene[entrezGeneId] || [];
            const svsBySample: {
                [sampleId: string]: StructuralVariant[];
            } = {};
            for (const sv of geneSvs) {
                const sampleId = sv.sampleId;
                if (!svsBySample[sampleId]) {
                    svsBySample[sampleId] = [];
                }
                svsBySample[sampleId].push(sv);
            }

            const maxAbsZScore = Math.max(
                ...Object.values(zScoresBySample).map(v => Math.abs(v)),
                0
            );

            rows.push({
                hugoGeneSymbol,
                entrezGeneId,
                zScoresBySample,
                mutations: mutsBySample,
                cnaAlterations: cnaBySample,
                fusions: svsBySample,
                maxAbsZScore,
                hasMutation: geneMutations.length > 0,
                hasCna:
                    geneCna.filter(
                        (d: DiscreteCopyNumberData) => d.alteration !== 0
                    ).length > 0,
                hasFusion: geneSvs.length > 0,
            });
        }

        // Default sort by absolute z-score descending
        return _.orderBy(
            rows,
            [
                this.sortColumn === 'hugoGeneSymbol'
                    ? 'hugoGeneSymbol'
                    : 'maxAbsZScore',
            ],
            [this.sortDirection]
        );
    }

    @computed get filteredGeneRows(): GeneRow[] {
        let rows = this.geneRows;

        // Text filter
        if (this.geneFilter.trim()) {
            const filter = this.geneFilter.trim().toUpperCase();
            rows = rows.filter(r =>
                r.hugoGeneSymbol.toUpperCase().includes(filter)
            );
        }

        // Alteration type filters
        if (this.activeAlterationFilters.size > 0) {
            rows = rows.filter(r => {
                if (
                    this.activeAlterationFilters.has('mutation') &&
                    !r.hasMutation
                ) {
                    return false;
                }
                if (this.activeAlterationFilters.has('cna') && !r.hasCna) {
                    return false;
                }
                if (
                    this.activeAlterationFilters.has('fusion') &&
                    !r.hasFusion
                ) {
                    return false;
                }
                return true;
            });
        }

        return rows;
    }

    @computed get selectedGeneSymbol(): string | undefined {
        if (this.selectedGeneEntrezId === undefined) return undefined;
        const row = this.geneRows.find(
            r => r.entrezGeneId === this.selectedGeneEntrezId
        );
        return row?.hugoGeneSymbol;
    }

    @computed get selectedGeneRow(): GeneRow | undefined {
        if (this.selectedGeneEntrezId === undefined) return undefined;
        return this.geneRows.find(
            r => r.entrezGeneId === this.selectedGeneEntrezId
        );
    }

    @computed get waterfallPlotData(): WaterfallDatum[] {
        if (!this.cohortExpressionData.isComplete) {
            return [];
        }

        const cohortData = this.cohortExpressionData.result;
        if (cohortData.length === 0) {
            return [];
        }

        const patientSampleIds = new Set(this.pageStore.sampleIds);
        const studyId = this.pageStore.studyId;

        // Sort by z-score ascending
        const sorted = _.sortBy(cohortData, d => d.value);

        return sorted.map((d, index) => {
            const isPatient = patientSampleIds.has(d.sampleId);
            const sampleColor =
                isPatient && this.sampleManager
                    ? this.sampleManager.sampleColors[d.sampleId] || '#333'
                    : '#cccccc';

            // Get sample type for patient samples
            let sampleType = '';
            if (isPatient && this.sampleManager) {
                const clinData = this.sampleManager
                    .clinicalDataLegacyCleanAndDerived[d.sampleId];
                if (clinData && clinData.DERIVED_NORMALIZED_CASE_TYPE) {
                    sampleType = clinData.DERIVED_NORMALIZED_CASE_TYPE;
                }
            }

            return {
                x: index,
                y: d.value,
                sampleId: d.sampleId,
                isPatientSample: isPatient,
                color: sampleColor,
                label: isPatient ? d.sampleId : '',
                sampleType,
                studyId: d.studyId || studyId,
            };
        });
    }

    @computed get gtexLink(): string | undefined {
        if (!this.selectedGeneSymbol) return undefined;
        return `https://www.gtexportal.org/home/gene/${this.selectedGeneSymbol}`;
    }

    @action
    downloadData() {
        if (!this.patientExpressionData.isComplete) return;

        const rows = this.filteredGeneRows;
        const sampleIds = this.pageStore.sampleIds;

        const header = [
            'Gene',
            ...sampleIds.map((s: string) => `${s} Z-Score`),
        ].join('\t');
        const lines = rows.map(row => {
            const scores = sampleIds.map((s: string) =>
                row.zScoresBySample[s] !== undefined
                    ? row.zScoresBySample[s].toFixed(4)
                    : 'NA'
            );
            return [row.hugoGeneSymbol, ...scores].join('\t');
        });

        const content = [header, ...lines].join('\n');
        const blob = new Blob([content], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'expression_data.tsv';
        a.click();
        URL.revokeObjectURL(url);
    }
}
