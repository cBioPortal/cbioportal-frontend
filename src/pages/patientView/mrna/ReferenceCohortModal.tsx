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

// Sentinel id used in selectedAttributeId to indicate the right pane should
// show the Mutated Gene picker rather than a clinical-attribute editor.
const MUTATED_GENE_SECTION_ID = '__mutated_gene__';
// Cap the rendered mutated-gene list (full list can be 10k+); user can refine
// via the search box.
const MUTATED_GENE_DISPLAY_LIMIT = 200;

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

    @observable selectedAttributeId: string | null = null;

    @observable attributeSearch: string = '';

    @observable geneSearch: string = '';

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
                this.attributeSearch = '';
                this.geneSearch = '';
                const attrs = this.attributes;
                this.selectedAttributeId =
                    attrs.length > 0
                        ? attrs[0].clinicalAttributeId
                        : MUTATED_GENE_SECTION_ID;
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
    }

    @action.bound
    private apply() {
        this.props.plotsStore.setClinicalFilters(this.draft);
        this.props.plotsStore.setMutatedGenes(this.draftMutatedGenes);
        this.props.onClose();
    }

    @action.bound
    private toggleDraftMutatedGene(gene: MutatedGenePick) {
        const exists = this.draftMutatedGenes.some(
            g => g.entrezGeneId === gene.entrezGeneId
        );
        this.draftMutatedGenes = exists
            ? this.draftMutatedGenes.filter(
                  g => g.entrezGeneId !== gene.entrezGeneId
              )
            : [...this.draftMutatedGenes, gene];
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
            Object.values(this.draft).some(v => v.length > 0)
        );
    }

    @computed get draftActiveCount(): number {
        const clinical = Object.values(this.draft).reduce(
            (n, v) => n + v.length,
            0
        );
        return clinical + this.draftMutatedGenes.length;
    }

    @computed get draftStudyViewFilter(): StudyViewFilter {
        return buildStudyViewFilter(
            this.props.studyId,
            this.draft,
            this.draftMutatedGenes,
            this.props.plotsStore.mutationMolecularProfile.result
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

    // Live sample count for the draft selection (clinical + mutated genes).
    readonly draftFilteredSamples = remoteData<Sample[]>(
        {
            await: () => [this.props.plotsStore.mutationMolecularProfile],
            invoke: async () => {
                if (!this.hasDraftFilters) return [];
                return internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: this.draftStudyViewFilter,
                });
            },
        },
        []
    );

    // Lazy fetcher for the gene-mutation picker: ranks genes by mutation
    // frequency in the DRAFT cohort (re-runs as the user toggles other
    // filters or gene picks). Only invoked when the gene section is active.
    readonly currentMutatedGenes = remoteData<AlterationCountByGene[]>(
        {
            await: () => [this.props.plotsStore.mutationMolecularProfile],
            invoke: async () => {
                if (
                    this.selectedAttributeId !== MUTATED_GENE_SECTION_ID ||
                    !this.props.plotsStore.mutationMolecularProfile.result
                ) {
                    return [];
                }
                const result = await internalClient.fetchMutatedGenesUsingPOST(
                    { studyViewFilter: this.draftStudyViewFilter }
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
        const items = this.filteredAttributes;
        const mutationProfile = this.props.plotsStore.mutationMolecularProfile;
        const showMutations =
            mutationProfile.isComplete && !!mutationProfile.result;
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
                    {this.renderLeftPaneHeader('Clinical')}
                    {items.length === 0 && (
                        <div style={{ fontSize: 12, color: '#666' }}>
                            No filters match.
                        </div>
                    )}
                    {items.map(a => {
                        const active =
                            a.clinicalAttributeId === this.selectedAttributeId;
                        const draftEntry = this.draft[a.clinicalAttributeId];
                        const selectedCount = draftEntry
                            ? draftEntry.length
                            : 0;
                        const level = a.patientAttribute ? 'P' : 'S';
                        const datatypeBadge =
                            a.datatype === 'NUMBER' ? '#' : '';
                        return (
                            <div
                                key={a.clinicalAttributeId}
                                onClick={() =>
                                    this.selectAttribute(a.clinicalAttributeId)
                                }
                                style={{
                                    padding: '5px 8px',
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    background: active
                                        ? '#e6f0fa'
                                        : 'transparent',
                                    color: active ? '#0b5fae' : '#333',
                                    fontWeight: active ? 600 : 'normal',
                                    fontSize: 13,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    title={
                                        a.patientAttribute
                                            ? 'Patient-level'
                                            : 'Sample-level'
                                    }
                                    style={{
                                        fontSize: 9,
                                        marginRight: 6,
                                        background: '#888',
                                        color: 'white',
                                        borderRadius: 2,
                                        padding: '1px 4px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {level}
                                    {datatypeBadge}
                                </span>
                                <span style={{ flex: 1 }}>{a.displayName}</span>
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
                    })}
                    {showMutations && this.renderLeftPaneHeader('Mutations')}
                    {showMutations &&
                        this.renderLeftPaneMutationItem()}
                </div>
            </div>
        );
    }

    private renderLeftPaneHeader(label: string) {
        return (
            <div
                key={`__header__${label}`}
                style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    margin: '8px 0 4px',
                }}
            >
                {label}
            </div>
        );
    }

    private renderLeftPaneMutationItem() {
        const active = this.selectedAttributeId === MUTATED_GENE_SECTION_ID;
        const count = this.draftMutatedGenes.length;
        return (
            <div
                key={MUTATED_GENE_SECTION_ID}
                onClick={() => this.selectAttribute(MUTATED_GENE_SECTION_ID)}
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
                    title="Mutated gene"
                    style={{
                        fontSize: 9,
                        marginRight: 6,
                        background: '#a04020',
                        color: 'white',
                        borderRadius: 2,
                        padding: '1px 4px',
                        fontWeight: 'bold',
                    }}
                >
                    MUT
                </span>
                <span style={{ flex: 1 }}>Mutated gene</span>
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

    private renderMutatedGeneRightPane() {
        const remote = this.currentMutatedGenes;
        const loading = remote.isPending;
        const all = remote.result || [];
        const q = this.geneSearch.trim().toUpperCase();
        const filtered = q
            ? all.filter(g =>
                  g.hugoGeneSymbol.toUpperCase().includes(q)
              )
            : all;
        const visible = filtered.slice(0, MUTATED_GENE_DISPLAY_LIMIT);
        const truncated =
            filtered.length > MUTATED_GENE_DISPLAY_LIMIT
                ? filtered.length - MUTATED_GENE_DISPLAY_LIMIT
                : 0;
        const draftIds = new Set(
            this.draftMutatedGenes.map(g => g.entrezGeneId)
        );
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
                        Loading mutated genes…
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {q
                            ? `No genes match "${this.geneSearch}".`
                            : 'No mutated genes in the current cohort.'}
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
                                                    this.toggleDraftMutatedGene(
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
        if (this.selectedAttributeId === MUTATED_GENE_SECTION_ID) {
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
                        Mutated gene{' '}
                        <span
                            style={{
                                fontWeight: 'normal',
                                color: '#888',
                                fontSize: 12,
                            }}
                        >
                            (ranked by mutation frequency in current cohort)
                        </span>
                    </div>
                    {this.renderMutatedGeneRightPane()}
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
                    <Modal.Title>Reference cohort</Modal.Title>
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
