import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import { Modal, Button } from 'react-bootstrap';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryTheme,
} from 'victory';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    AlterationCountByGene,
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataFilter,
    DataFilterValue,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    buildStudyViewFilter,
    MutatedGenePick,
    PatientViewPlotsStore,
} from 'pages/patientView/clinicalInformation/PatientViewPlotsStore';

// Sentinel ids used in selectedAttributeId to indicate the right pane should
// show one of the gene-alteration pickers rather than a clinical-attribute editor.
const MUTATED_GENE_SECTION_ID = '__mutated_gene__';
const CNA_GENE_SECTION_ID = '__cna_gene__';
const SV_GENE_SECTION_ID = '__sv_gene__';
// Cap the rendered ranked-gene list (full list can be 10k+); user can refine
// via the search box.
const RANKED_GENE_DISPLAY_LIMIT = 200;

type AlterationKind = 'mutation' | 'cna' | 'sv';

interface IReferenceCohortModalProps {
    plotsStore: PatientViewPlotsStore;
    studyId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface CategoricalCount {
    value: string;
    count: number;
}

interface NumericBin {
    start: number;
    end: number;
    count: number;
}

interface NumericData {
    bins: NumericBin[];
    min: number;
    max: number;
    naCount: number;
}

const NUM_BINS = 20;

// Build evenly-spaced bins from a list of numeric values.
function buildBins(values: number[]): NumericData {
    const finite = values.filter(v => Number.isFinite(v));
    if (finite.length === 0) {
        return { bins: [], min: 0, max: 0, naCount: values.length };
    }
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const naCount = values.length - finite.length;
    if (min === max) {
        return {
            bins: [{ start: min, end: min, count: finite.length }],
            min,
            max,
            naCount,
        };
    }
    const span = max - min;
    const binWidth = span / NUM_BINS;
    const bins: NumericBin[] = [];
    for (let i = 0; i < NUM_BINS; i++) {
        bins.push({
            start: min + i * binWidth,
            end: min + (i + 1) * binWidth,
            count: 0,
        });
    }
    for (const v of finite) {
        let idx = Math.floor((v - min) / binWidth);
        if (idx >= NUM_BINS) idx = NUM_BINS - 1;
        bins[idx].count++;
    }
    return { bins, min, max, naCount };
}

// Two-pane reference-cohort chooser:
//   left  = list of filterable clinical attributes (Sample + Patient)
//   right = the editor for the selected attribute (categorical or numeric)
// Edits accumulate in `draft` and only commit to the store on Apply.
@observer
export default class ReferenceCohortModal extends React.Component<
    IReferenceCohortModalProps,
    {}
> {
    @observable.ref draft: {
        [attributeId: string]: DataFilterValue[];
    } = {};

    @observable.ref draftMutatedGenes: MutatedGenePick[] = [];
    @observable.ref draftCNAGenes: MutatedGenePick[] = [];
    @observable.ref draftSVGenes: MutatedGenePick[] = [];

    @observable selectedAttributeId: string | null = null;

    @observable attributeSearch: string = '';

    @observable geneSearch: string = '';

    // Which top-level sections are currently collapsed (by stable id).
    // Default to all collapsed so the modal opens to a tidy state.
    @observable.ref collapsedSections: Set<string> = new Set<string>([
        'sample',
        'patient',
        'alterations',
    ]);

    constructor(props: IReferenceCohortModalProps) {
        super(props);
        makeObservable(this);
    }

    componentDidUpdate(prevProps: IReferenceCohortModalProps) {
        if (this.props.isOpen && !prevProps.isOpen) {
            runInAction(() => {
                this.draft = {
                    ...this.props.plotsStore.selectedClinicalFilters,
                };
                this.draftMutatedGenes = this.props.plotsStore.selectedMutatedGenes.slice();
                this.draftCNAGenes = this.props.plotsStore.selectedCNAGenes.slice();
                this.draftSVGenes = this.props.plotsStore.selectedSVGenes.slice();
                this.attributeSearch = '';
                this.geneSearch = '';
                this.collapsedSections = new Set([
                    'sample',
                    'patient',
                    'alterations',
                ]);
                this.selectedAttributeId = null;
            });
        }
    }

    @action.bound
    private selectAttribute(id: string) {
        this.selectedAttributeId = id;
    }

    @action.bound
    private setAttributeSearch(s: string) {
        this.attributeSearch = s;
    }

    @action.bound
    private toggleSection(id: string) {
        const next = new Set(this.collapsedSections);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.collapsedSections = next;
    }

    private isSectionCollapsed(id: string): boolean {
        // Searching always expands sections so the user sees matches.
        if (this.attributeSearch.trim().length > 0) return false;
        return this.collapsedSections.has(id);
    }

    @action.bound
    private toggleCategoricalValue(attributeId: string, value: string) {
        const current = this.draft[attributeId] || [];
        const match = current.find(v => v.value === value && !v.start && !v.end);
        const next = match
            ? current.filter(v => v !== match)
            : [...current, { value } as DataFilterValue];
        this.writeDraftEntry(attributeId, next);
    }

    @action.bound
    private setNumericRange(
        attributeId: string,
        start: number | undefined,
        end: number | undefined
    ) {
        if (start === undefined && end === undefined) {
            this.writeDraftEntry(attributeId, []);
            return;
        }
        this.writeDraftEntry(attributeId, [
            { start, end } as DataFilterValue,
        ]);
    }

    private writeDraftEntry(attributeId: string, values: DataFilterValue[]) {
        const updated = { ...this.draft };
        if (values.length === 0) {
            delete updated[attributeId];
        } else {
            updated[attributeId] = values;
        }
        this.draft = updated;
    }

    @action.bound
    private clearDraft() {
        this.draft = {};
        this.draftMutatedGenes = [];
        this.draftCNAGenes = [];
        this.draftSVGenes = [];
    }

    @action.bound
    private apply() {
        this.props.plotsStore.setClinicalFilters(this.draft);
        this.props.plotsStore.setMutatedGenes(this.draftMutatedGenes);
        this.props.plotsStore.setCNAGenes(this.draftCNAGenes);
        this.props.plotsStore.setSVGenes(this.draftSVGenes);
        this.props.onClose();
    }

    @action.bound
    private toggleDraftGene(kind: AlterationKind, gene: MutatedGenePick) {
        const list = this.getDraftList(kind);
        const exists = list.some(g => g.entrezGeneId === gene.entrezGeneId);
        const next = exists
            ? list.filter(g => g.entrezGeneId !== gene.entrezGeneId)
            : [...list, gene];
        if (kind === 'mutation') this.draftMutatedGenes = next;
        else if (kind === 'cna') this.draftCNAGenes = next;
        else this.draftSVGenes = next;
    }

    private getDraftList(kind: AlterationKind): MutatedGenePick[] {
        if (kind === 'mutation') return this.draftMutatedGenes;
        if (kind === 'cna') return this.draftCNAGenes;
        return this.draftSVGenes;
    }

    @action.bound
    private setGeneSearch(s: string) {
        this.geneSearch = s;
    }

    @action.bound
    private cancel() {
        this.props.onClose();
    }

    @computed get hasDraftFilters(): boolean {
        return (
            this.draftMutatedGenes.length > 0 ||
            this.draftCNAGenes.length > 0 ||
            this.draftSVGenes.length > 0 ||
            Object.values(this.draft).some(v => v.length > 0)
        );
    }

    @computed get draftActiveCount(): number {
        const clinical = Object.values(this.draft).reduce(
            (n, v) => n + v.length,
            0
        );
        return (
            clinical +
            this.draftMutatedGenes.length +
            this.draftCNAGenes.length +
            this.draftSVGenes.length
        );
    }

    @computed get draftStudyViewFilter(): StudyViewFilter {
        return buildStudyViewFilter(
            this.props.studyId,
            this.draft,
            this.draftMutatedGenes,
            this.draftCNAGenes,
            this.draftSVGenes,
            this.props.plotsStore.mutationMolecularProfile.result,
            this.props.plotsStore.cnaMolecularProfile.result,
            this.props.plotsStore.svMolecularProfile.result
        );
    }

    @computed private get attributes(): ClinicalAttribute[] {
        return (
            this.props.plotsStore.filterableClinicalAttributes.result || []
        );
    }

    @computed private get filteredAttributes(): ClinicalAttribute[] {
        const q = this.attributeSearch.trim().toLowerCase();
        if (!q) return this.attributes;
        return this.attributes.filter(
            a =>
                a.displayName.toLowerCase().includes(q) ||
                a.clinicalAttributeId.toLowerCase().includes(q)
        );
    }

    @computed private get sampleLevelAttributes(): ClinicalAttribute[] {
        return this.filteredAttributes.filter(a => !a.patientAttribute);
    }

    @computed private get patientLevelAttributes(): ClinicalAttribute[] {
        return this.filteredAttributes.filter(a => a.patientAttribute);
    }

    @computed private get selectedAttribute(): ClinicalAttribute | undefined {
        return this.attributes.find(
            a => a.clinicalAttributeId === this.selectedAttributeId
        );
    }

    // Lazy fetcher for the currently-selected categorical attribute. Returns
    // distinct values + counts across the whole study, sorted by count desc.
    readonly currentCategoricalCounts = remoteData<CategoricalCount[]>(
        {
            invoke: async () => {
                const attr = this.selectedAttribute;
                if (!attr || attr.datatype !== 'STRING') return [];
                const studyViewFilter = {
                    studyIds: [this.props.studyId],
                } as StudyViewFilter;
                const items = await internalClient.fetchClinicalDataCountsUsingPOST(
                    {
                        clinicalDataCountFilter: {
                            attributes: [
                                {
                                    attributeId: attr.clinicalAttributeId,
                                    values: [],
                                } as ClinicalDataFilter,
                            ],
                            studyViewFilter,
                        },
                    }
                );
                const item = items.find(
                    i => i.attributeId === attr.clinicalAttributeId
                );
                return _.orderBy(
                    item ? item.counts : [],
                    ['count', 'value'],
                    ['desc', 'asc']
                );
            },
        },
        []
    );

    // Lazy fetcher for the currently-selected numeric attribute. Fetches raw
    // values from the public clinical-data endpoint and bins client-side, so
    // we don't have to build a ClinicalDataBinFilter shape.
    readonly currentNumericData = remoteData<NumericData>(
        {
            invoke: async () => {
                const attr = this.selectedAttribute;
                if (!attr || attr.datatype !== 'NUMBER') {
                    return { bins: [], min: 0, max: 0, naCount: 0 };
                }
                const raw: ClinicalData[] = await getClient().getAllClinicalDataInStudyUsingGET(
                    {
                        studyId: this.props.studyId,
                        attributeId: attr.clinicalAttributeId,
                        clinicalDataType: attr.patientAttribute
                            ? 'PATIENT'
                            : 'SAMPLE',
                        projection: 'SUMMARY',
                        pageSize: 1000000,
                    }
                );
                const values = raw.map(r => Number(r.value));
                return buildBins(values);
            },
        },
        { bins: [], min: 0, max: 0, naCount: 0 }
    );

    // Live sample count for the draft selection (clinical + alteration genes).
    readonly draftFilteredSamples = remoteData<Sample[]>(
        {
            await: () => [
                this.props.plotsStore.mutationMolecularProfile,
                this.props.plotsStore.cnaMolecularProfile,
                this.props.plotsStore.svMolecularProfile,
            ],
            invoke: async () => {
                if (!this.hasDraftFilters) return [];
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: this.draftStudyViewFilter,
                });
            },
        },
        []
    );

    // Lazy fetcher for the active gene picker (mutation / CNA / SV). Ranks
    // genes by altered-case count in the DRAFT cohort, so the list re-ranks
    // as the user toggles other filters. Only invoked when one of the
    // gene-picker sections is active.
    readonly currentRankedGenes = remoteData<AlterationCountByGene[]>(
        {
            await: () => [
                this.props.plotsStore.mutationMolecularProfile,
                this.props.plotsStore.cnaMolecularProfile,
                this.props.plotsStore.svMolecularProfile,
            ],
            invoke: async () => {
                const kind = this.activeAlterationKind;
                if (!kind) return [];
                let raw: AlterationCountByGene[] = [];
                if (kind === 'mutation') {
                    if (!this.props.plotsStore.mutationMolecularProfile.result)
                        return [];
                    raw = await internalClient.fetchMutatedGenesUsingPOST({
                        studyViewFilter: this.draftStudyViewFilter,
                    });
                } else if (kind === 'cna') {
                    if (!this.props.plotsStore.cnaMolecularProfile.result)
                        return [];
                    const cnaRaw = await internalClient.fetchCNAGenesUsingPOST(
                        { studyViewFilter: this.draftStudyViewFilter }
                    );
                    // CNA endpoint returns one row per gene-and-alteration; we
                    // present one row per gene, keeping the highest altered
                    // count for that gene.
                    raw = _.uniqBy(
                        _.orderBy(
                            cnaRaw,
                            ['numberOfAlteredCases'],
                            ['desc']
                        ),
                        'entrezGeneId'
                    ) as AlterationCountByGene[];
                } else {
                    if (!this.props.plotsStore.svMolecularProfile.result)
                        return [];
                    raw = await internalClient.fetchStructuralVariantGenesUsingPOST(
                        { studyViewFilter: this.draftStudyViewFilter }
                    );
                }
                return _.orderBy(
                    raw,
                    ['numberOfAlteredCases', 'hugoGeneSymbol'],
                    ['desc', 'asc']
                );
            },
        },
        []
    );

    @computed get activeAlterationKind(): AlterationKind | null {
        if (this.selectedAttributeId === MUTATED_GENE_SECTION_ID)
            return 'mutation';
        if (this.selectedAttributeId === CNA_GENE_SECTION_ID) return 'cna';
        if (this.selectedAttributeId === SV_GENE_SECTION_ID) return 'sv';
        return null;
    }

    @computed get matchCountText(): string {
        if (!this.hasDraftFilters) {
            const all = this.props.plotsStore.allSamplesInStudy;
            if (all.isComplete) {
                return `${all.result!.length.toLocaleString(
                    'en-US'
                )} samples (whole study)`;
            }
            return 'computing…';
        }
        if (this.draftFilteredSamples.isPending) return 'computing…';
        if (this.draftFilteredSamples.isComplete) {
            const n = this.draftFilteredSamples.result!.length;
            return `${n.toLocaleString('en-US')} sample${
                n === 1 ? '' : 's'
            } match`;
        }
        return '';
    }

    private renderLeftPane() {
        const plots = this.props.plotsStore;
        const hasMut = !!plots.mutationMolecularProfile.result;
        const hasCna = !!plots.cnaMolecularProfile.result;
        const hasSv = !!plots.svMolecularProfile.result;
        const alterationItems: Array<{
            sectionId: string;
            kind: AlterationKind;
            label: string;
            badge: string;
            color: string;
        }> = [];
        if (hasMut)
            alterationItems.push({
                sectionId: MUTATED_GENE_SECTION_ID,
                kind: 'mutation',
                label: 'Mutated gene',
                badge: 'MUT',
                color: '#a04020',
            });
        if (hasCna)
            alterationItems.push({
                sectionId: CNA_GENE_SECTION_ID,
                kind: 'cna',
                label: 'Copy number altered gene',
                badge: 'CNA',
                color: '#205aa0',
            });
        if (hasSv)
            alterationItems.push({
                sectionId: SV_GENE_SECTION_ID,
                kind: 'sv',
                label: 'Structural variant gene',
                badge: 'SV',
                color: '#208040',
            });
        const showAlterations = alterationItems.length > 0;
        const sampleItems = this.sampleLevelAttributes;
        const patientItems = this.patientLevelAttributes;
        const allEmpty =
            this.filteredAttributes.length === 0 && !showAlterations;
        return (
            <div
                style={{
                    width: 280,
                    borderRight: '1px solid #ddd',
                    paddingRight: 12,
                    overflowY: 'auto',
                    maxHeight: 460,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <input
                    type="text"
                    placeholder="Search filters…"
                    value={this.attributeSearch}
                    onChange={e => this.setAttributeSearch(e.target.value)}
                    style={{
                        marginBottom: 8,
                        padding: '4px 8px',
                        border: '1px solid #ccc',
                        borderRadius: 3,
                        fontSize: 12,
                        width: '100%',
                    }}
                />
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {allEmpty && (
                        <div style={{ fontSize: 12, color: '#666' }}>
                            No filters match.
                        </div>
                    )}
                    {sampleItems.length > 0 &&
                        this.renderCollapsibleSection(
                            'sample',
                            'Sample',
                            sampleItems.length,
                            !this.isSectionCollapsed('sample') &&
                                sampleItems.map(a =>
                                    this.renderAttributeRow(a)
                                )
                        )}
                    {patientItems.length > 0 &&
                        this.renderCollapsibleSection(
                            'patient',
                            'Patient',
                            patientItems.length,
                            !this.isSectionCollapsed('patient') &&
                                patientItems.map(a =>
                                    this.renderAttributeRow(a)
                                )
                        )}
                    {showAlterations &&
                        this.renderCollapsibleSection(
                            'alterations',
                            'Alterations',
                            alterationItems.length,
                            !this.isSectionCollapsed('alterations') &&
                                alterationItems.map(i =>
                                    this.renderAlterationItem(
                                        i.sectionId,
                                        i.kind,
                                        i.label,
                                        i.badge,
                                        i.color
                                    )
                                )
                        )}
                </div>
            </div>
        );
    }

    private renderAttributeRow(a: ClinicalAttribute) {
        const active = a.clinicalAttributeId === this.selectedAttributeId;
        const draftEntry = this.draft[a.clinicalAttributeId];
        const selectedCount = draftEntry ? draftEntry.length : 0;
        const datatypeBadge = a.datatype === 'NUMBER' ? '#' : '';
        return (
            <div
                key={a.clinicalAttributeId}
                onClick={() => this.selectAttribute(a.clinicalAttributeId)}
                style={{
                    padding: '5px 8px',
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: active ? '#e6f0fa' : 'transparent',
                    color: active ? '#0b5fae' : '#333',
                    fontWeight: active ? 600 : 'normal',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <span style={{ flex: 1 }}>
                    {a.displayName}
                    {datatypeBadge && (
                        <span
                            title="Numeric"
                            style={{
                                fontSize: 9,
                                marginLeft: 5,
                                background: '#888',
                                color: 'white',
                                borderRadius: 2,
                                padding: '1px 4px',
                                fontWeight: 'bold',
                                verticalAlign: 'middle',
                            }}
                        >
                            {datatypeBadge}
                        </span>
                    )}
                </span>
                {selectedCount > 0 && (
                    <span
                        style={{
                            marginLeft: 6,
                            fontSize: 11,
                            background: '#0b5fae',
                            color: 'white',
                            borderRadius: 10,
                            padding: '1px 7px',
                        }}
                    >
                        {selectedCount}
                    </span>
                )}
            </div>
        );
    }

    private renderCollapsibleSection(
        id: string,
        label: string,
        count: number,
        body: React.ReactNode
    ) {
        const collapsed = this.isSectionCollapsed(id);
        return (
            <div key={`__section__${id}`}>
                <div
                    onClick={() => this.toggleSection(id)}
                    style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        margin: '8px 0 4px',
                    }}
                >
                    <span
                        style={{
                            fontSize: 10,
                            color: '#888',
                            marginRight: 4,
                            width: 10,
                        }}
                    >
                        {collapsed ? '▸' : '▾'}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#888',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            flex: 1,
                        }}
                    >
                        {label}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            color: '#bbb',
                            marginLeft: 4,
                        }}
                    >
                        {count}
                    </span>
                </div>
                {body}
            </div>
        );
    }

    private renderAlterationItem(
        sectionId: string,
        kind: AlterationKind,
        label: string,
        badgeText: string,
        badgeColor: string
    ) {
        const active = this.selectedAttributeId === sectionId;
        const count = this.getDraftList(kind).length;
        return (
            <div
                key={sectionId}
                onClick={() => this.selectAttribute(sectionId)}
                style={{
                    padding: '5px 8px',
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: active ? '#e6f0fa' : 'transparent',
                    color: active ? '#0b5fae' : '#333',
                    fontWeight: active ? 600 : 'normal',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <span
                    title={label}
                    style={{
                        fontSize: 9,
                        marginRight: 6,
                        background: badgeColor,
                        color: 'white',
                        borderRadius: 2,
                        padding: '1px 4px',
                        fontWeight: 'bold',
                    }}
                >
                    {badgeText}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {count > 0 && (
                    <span
                        style={{
                            marginLeft: 6,
                            fontSize: 11,
                            background: '#0b5fae',
                            color: 'white',
                            borderRadius: 10,
                            padding: '1px 7px',
                        }}
                    >
                        {count}
                    </span>
                )}
            </div>
        );
    }

    private renderGeneAlterationRightPane(kind: AlterationKind) {
        const remote = this.currentRankedGenes;
        const loading = remote.isPending;
        const all = remote.result || [];
        const q = this.geneSearch.trim().toUpperCase();
        const filtered = q
            ? all.filter(g =>
                  g.hugoGeneSymbol.toUpperCase().includes(q)
              )
            : all;
        const visible = filtered.slice(0, RANKED_GENE_DISPLAY_LIMIT);
        const truncated =
            filtered.length > RANKED_GENE_DISPLAY_LIMIT
                ? filtered.length - RANKED_GENE_DISPLAY_LIMIT
                : 0;
        const draftIds = new Set(
            this.getDraftList(kind).map(g => g.entrezGeneId)
        );
        const emptyMessage =
            kind === 'mutation'
                ? 'No mutated genes in the current cohort.'
                : kind === 'cna'
                ? 'No copy-number-altered genes in the current cohort.'
                : 'No structural-variant genes in the current cohort.';
        const loadingMessage =
            kind === 'mutation'
                ? 'Loading mutated genes…'
                : kind === 'cna'
                ? 'Loading copy-number-altered genes…'
                : 'Loading structural-variant genes…';
        return (
            <>
                <input
                    type="text"
                    placeholder="Search genes…"
                    value={this.geneSearch}
                    onChange={e => this.setGeneSearch(e.target.value)}
                    style={{
                        marginBottom: 8,
                        padding: '4px 8px',
                        border: '1px solid #ccc',
                        borderRadius: 3,
                        fontSize: 12,
                        width: 220,
                    }}
                />
                {loading ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {loadingMessage}
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {q
                            ? `No genes match "${this.geneSearch}".`
                            : emptyMessage}
                    </div>
                ) : (
                    <>
                        <ul
                            style={{
                                margin: 0,
                                padding: 0,
                                listStyle: 'none',
                                fontSize: 13,
                            }}
                        >
                            {visible.map(g => {
                                const checked = draftIds.has(g.entrezGeneId);
                                const profiled = g.numberOfProfiledCases;
                                const pct =
                                    profiled > 0
                                        ? (g.numberOfAlteredCases /
                                              profiled) *
                                          100
                                        : 0;
                                return (
                                    <li
                                        key={g.entrezGeneId}
                                        style={{ padding: '3px 0' }}
                                    >
                                        <label
                                            style={{
                                                cursor: 'pointer',
                                                fontWeight: 'normal',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    this.toggleDraftGene(
                                                        kind,
                                                        {
                                                            hugoGeneSymbol:
                                                                g.hugoGeneSymbol,
                                                            entrezGeneId:
                                                                g.entrezGeneId,
                                                        }
                                                    )
                                                }
                                                style={{ marginRight: 8 }}
                                            />
                                            <span style={{ fontWeight: 'bold' }}>
                                                {g.hugoGeneSymbol}
                                            </span>
                                            <span
                                                style={{
                                                    color: '#888',
                                                    marginLeft: 8,
                                                }}
                                            >
                                                {g.numberOfAlteredCases.toLocaleString(
                                                    'en-US'
                                                )}
                                                {' / '}
                                                {profiled.toLocaleString(
                                                    'en-US'
                                                )}{' '}
                                                ({pct.toFixed(1)}%)
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                        {truncated > 0 && (
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 11,
                                    color: '#888',
                                }}
                            >
                                Showing top {visible.length} of{' '}
                                {filtered.length.toLocaleString('en-US')} genes.
                                Use search to find others.
                            </div>
                        )}
                    </>
                )}
            </>
        );
    }

    private renderCategoricalRightPane(attr: ClinicalAttribute) {
        const counts = this.currentCategoricalCounts.result || [];
        const loading = this.currentCategoricalCounts.isPending;
        const draftValues = this.draft[attr.clinicalAttributeId] || [];
        return (
            <>
                {loading ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        Loading…
                    </div>
                ) : counts.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        (no values)
                    </div>
                ) : (
                    <ul
                        style={{
                            margin: 0,
                            padding: 0,
                            listStyle: 'none',
                            fontSize: 13,
                        }}
                    >
                        {counts.map(c => {
                            const checked = draftValues.some(
                                v => v.value === c.value
                            );
                            return (
                                <li
                                    key={c.value}
                                    style={{ padding: '3px 0' }}
                                >
                                    <label
                                        style={{
                                            cursor: 'pointer',
                                            fontWeight: 'normal',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                this.toggleCategoricalValue(
                                                    attr.clinicalAttributeId,
                                                    c.value
                                                )
                                            }
                                            style={{ marginRight: 8 }}
                                        />
                                        <span>{c.value}</span>
                                        <span
                                            style={{
                                                color: '#888',
                                                marginLeft: 6,
                                            }}
                                        >
                                            ({c.count.toLocaleString('en-US')})
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </>
        );
    }

    private renderNumericRightPane(attr: ClinicalAttribute) {
        const remote = this.currentNumericData;
        const loading = remote.isPending;
        const data = remote.result!;
        const draftValues = this.draft[attr.clinicalAttributeId] || [];
        const range = draftValues[0];
        const selStart = range && range.start !== undefined ? range.start : data.min;
        const selEnd = range && range.end !== undefined ? range.end : data.max;
        const hasRange = !!range;
        // Visualize: highlight bars whose center lies in the selected range.
        const chartData = data.bins.map(b => {
            const center = (b.start + b.end) / 2;
            const inRange = hasRange ? center >= selStart && center <= selEnd : true;
            return {
                x: center,
                y: b.count,
                fill: inRange ? '#0b5fae' : '#cccccc',
            };
        });
        const onMinChange = (s: string) => {
            const v = s.trim() === '' ? undefined : Number(s);
            const startVal = v === undefined ? data.min : v;
            const endVal = hasRange && range!.end !== undefined ? range!.end : data.max;
            this.setNumericRange(
                attr.clinicalAttributeId,
                startVal,
                endVal
            );
        };
        const onMaxChange = (s: string) => {
            const v = s.trim() === '' ? undefined : Number(s);
            const startVal = hasRange && range!.start !== undefined ? range!.start : data.min;
            const endVal = v === undefined ? data.max : v;
            this.setNumericRange(
                attr.clinicalAttributeId,
                startVal,
                endVal
            );
        };
        return (
            <>
                {loading ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        Loading…
                    </div>
                ) : data.bins.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        No numeric values available.
                    </div>
                ) : (
                    <>
                        <div style={{ width: 460, height: 180 }}>
                            <VictoryChart
                                theme={VictoryTheme.material}
                                height={180}
                                width={460}
                                padding={{
                                    top: 10,
                                    bottom: 40,
                                    left: 50,
                                    right: 10,
                                }}
                                domainPadding={{ x: 8 }}
                            >
                                <VictoryAxis
                                    tickFormat={(t: number) =>
                                        Math.abs(t) >= 1000
                                            ? `${Math.round(t / 1000)}k`
                                            : Number(t).toFixed(
                                                  data.max - data.min > 10
                                                      ? 0
                                                      : 1
                                              )
                                    }
                                />
                                <VictoryAxis
                                    dependentAxis
                                    tickFormat={(t: number) =>
                                        t >= 1000
                                            ? `${Math.round(t / 1000)}k`
                                            : `${t}`
                                    }
                                />
                                <VictoryBar
                                    data={chartData}
                                    barRatio={1}
                                    style={{
                                        data: {
                                            fill: ({ datum }: any) =>
                                                (datum && datum.fill) ||
                                                '#0b5fae',
                                        },
                                    }}
                                />
                            </VictoryChart>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 12,
                                fontSize: 13,
                            }}
                        >
                            <label>
                                Min{' '}
                                <input
                                    type="number"
                                    value={
                                        hasRange &&
                                        range!.start !== undefined
                                            ? range!.start
                                            : ''
                                    }
                                    placeholder={data.min.toString()}
                                    onChange={e =>
                                        onMinChange(e.target.value)
                                    }
                                    style={{
                                        width: 100,
                                        marginLeft: 4,
                                        padding: '3px 6px',
                                    }}
                                />
                            </label>
                            <label>
                                Max{' '}
                                <input
                                    type="number"
                                    value={
                                        hasRange &&
                                        range!.end !== undefined
                                            ? range!.end
                                            : ''
                                    }
                                    placeholder={data.max.toString()}
                                    onChange={e =>
                                        onMaxChange(e.target.value)
                                    }
                                    style={{
                                        width: 100,
                                        marginLeft: 4,
                                        padding: '3px 6px',
                                    }}
                                />
                            </label>
                            {hasRange && (
                                <Button
                                    bsSize="xsmall"
                                    onClick={() =>
                                        this.setNumericRange(
                                            attr.clinicalAttributeId,
                                            undefined,
                                            undefined
                                        )
                                    }
                                >
                                    Reset
                                </Button>
                            )}
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: 11,
                                    color: '#888',
                                }}
                            >
                                Data range: {data.min} – {data.max}
                                {data.naCount > 0 &&
                                    ` • ${data.naCount} non-numeric excluded`}
                            </span>
                        </div>
                    </>
                )}
            </>
        );
    }

    private renderRightPane() {
        const kind = this.activeAlterationKind;
        if (kind) {
            const titles = {
                mutation: {
                    label: 'Mutated gene',
                    hint: 'ranked by mutation frequency in current cohort',
                },
                cna: {
                    label: 'Copy number altered gene',
                    hint:
                        'ranked by deep CNA (AMP/HOMDEL) frequency in current cohort',
                },
                sv: {
                    label: 'Structural variant gene',
                    hint:
                        'ranked by structural-variant frequency in current cohort',
                },
            } as const;
            const t = titles[kind];
            return (
                <div
                    style={{
                        flex: 1,
                        paddingLeft: 16,
                        overflowY: 'auto',
                        maxHeight: 460,
                    }}
                >
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            marginBottom: 8,
                        }}
                    >
                        {t.label}{' '}
                        <span
                            style={{
                                fontWeight: 'normal',
                                color: '#888',
                                fontSize: 12,
                            }}
                        >
                            ({t.hint})
                        </span>
                    </div>
                    {this.renderGeneAlterationRightPane(kind)}
                </div>
            );
        }
        const attr = this.selectedAttribute;
        if (!attr) {
            return (
                <div
                    style={{
                        flex: 1,
                        paddingLeft: 16,
                        color: '#888',
                        fontSize: 13,
                    }}
                >
                    Select a filter on the left.
                </div>
            );
        }
        return (
            <div
                style={{
                    flex: 1,
                    paddingLeft: 16,
                    overflowY: 'auto',
                    maxHeight: 460,
                }}
            >
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        marginBottom: 8,
                    }}
                >
                    {attr.displayName}{' '}
                    <span
                        style={{
                            fontWeight: 'normal',
                            color: '#888',
                            fontSize: 12,
                        }}
                    >
                        ({attr.clinicalAttributeId} •{' '}
                        {attr.patientAttribute ? 'patient' : 'sample'} •{' '}
                        {attr.datatype.toLowerCase()})
                    </span>
                </div>
                {attr.datatype === 'NUMBER'
                    ? this.renderNumericRightPane(attr)
                    : this.renderCategoricalRightPane(attr)}
            </div>
        );
    }

    render() {
        const loadingAttrs = this.props.plotsStore
            .filterableClinicalAttributes.isPending;
        return (
            <Modal
                show={this.props.isOpen}
                onHide={this.cancel}
                bsSize="large"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Reference Cohort Builder</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: 460 }}>
                    {loadingAttrs ? (
                        <LoadingIndicator isLoading={true} size="big" center />
                    ) : (
                        <div style={{ display: 'flex' }}>
                            {this.renderLeftPane()}
                            {this.renderRightPane()}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                color: '#444',
                                flex: 1,
                                textAlign: 'left',
                            }}
                        >
                            {this.draftActiveCount > 0 && (
                                <span style={{ marginRight: 12 }}>
                                    {this.draftActiveCount} filter
                                    {this.draftActiveCount === 1 ? '' : 's'}{' '}
                                    selected
                                </span>
                            )}
                            <strong>{this.matchCountText}</strong>
                        </div>
                        {this.draftActiveCount > 0 && (
                            <Button bsStyle="link" onClick={this.clearDraft}>
                                Clear
                            </Button>
                        )}
                        <Button onClick={this.cancel}>Cancel</Button>
                        <Button bsStyle="primary" onClick={this.apply}>
                            Apply
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        );
    }
}
