import * as React from 'react';
import { observer } from 'mobx-react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { FusionCohortStore } from './FusionCohortStore';
import { FusionPairSummary } from './data/types';
import { pairDisplayLabel } from './data/cohortAggregation';
import { colorFor } from './data/partnerPalette';
import { PartnerSummary } from './data/anchorSummaries';
import { frameStatusStyle } from './components/frameStatusStyle';

interface IFusionRecurrenceTableProps {
    store: FusionCohortStore;
    hasFusionAnnotation?: boolean;
}

class PairTable extends LazyMobXTable<FusionPairSummary> {}
class PartnerTable extends LazyMobXTable<PartnerSummary> {}

export function summaryTitle(hasFusionAnnotation: boolean): string {
    return hasFusionAnnotation ? 'Top recurrent fusions' : 'Top SV gene pairs';
}

function framePill(anyInFrame: boolean): JSX.Element {
    const style = anyInFrame
        ? frameStatusStyle('inFrame')
        : frameStatusStyle('unknown');
    return (
        <span
            style={{
                display: 'inline-block',
                padding: '1px 8px',
                borderRadius: 10,
                fontSize: 11,
                color: anyInFrame ? '#fff' : '#495057',
                background: style.hollow ? 'transparent' : style.fill,
                border: style.hollow ? '1px solid #adb5bd' : 'none',
            }}
        >
            {anyInFrame ? 'In-frame' : '—'}
        </span>
    );
}

@observer
export class FusionRecurrenceTable extends React.Component<
    IFusionRecurrenceTableProps
> {
    render() {
        const { store, hasFusionAnnotation = false } = this.props;
        const anchor = store.anchor;
        if (anchor && anchor.mode === 'gene') {
            const checked = new Set(store.effectiveAnchorPartners);
            const partnerColumns: Column<PartnerSummary>[] = [
                {
                    name: 'Filter',
                    render: (d: PartnerSummary) => (
                        <input
                            type="checkbox"
                            data-test={`partner-filter-${d.category}`}
                            aria-label={`Filter strips to ${d.category}`}
                            checked={checked.has(d.category)}
                            onChange={() =>
                                store.togglePartnerFacet(d.category)
                            }
                        />
                    ),
                    sortBy: (d: PartnerSummary) =>
                        checked.has(d.category) ? 1 : 0,
                    download: (d: PartnerSummary) =>
                        `${checked.has(d.category)}`,
                },
                {
                    name: '',
                    render: (d: PartnerSummary) => (
                        <span
                            data-test={`partner-swatch-${d.category}`}
                            style={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                background: colorFor(
                                    store.partnerColorMap,
                                    d.category
                                ),
                            }}
                        />
                    ),
                    download: () => '',
                },
                {
                    name: `${anchor.gene} partner`,
                    render: (d: PartnerSummary) => (
                        <span data-test={`partner-row-${d.category}`}>
                            {d.category}
                        </span>
                    ),
                    sortBy: (d: PartnerSummary) => d.category,
                    download: (d: PartnerSummary) => d.category,
                    filter: (d: PartnerSummary, _f: string, up: string) =>
                        d.category.toUpperCase().indexOf(up) > -1,
                },
                {
                    name: '# samples',
                    render: (d: PartnerSummary) => <span>{d.sampleCount}</span>,
                    sortBy: (d: PartnerSummary) => d.sampleCount,
                    download: (d: PartnerSummary) => `${d.sampleCount}`,
                },
                {
                    name: '# events',
                    render: (d: PartnerSummary) => <span>{d.eventCount}</span>,
                    sortBy: (d: PartnerSummary) => d.eventCount,
                    download: (d: PartnerSummary) => `${d.eventCount}`,
                },
                {
                    name: 'In-frame?',
                    render: (d: PartnerSummary) => framePill(d.anyInFrame),
                    sortBy: (d: PartnerSummary) => (d.anyInFrame ? 1 : 0),
                    download: (d: PartnerSummary) => `${d.anyInFrame}`,
                },
            ];
            return (
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {anchor.gene} partners (
                        {anchor.side === '5p' ? '5′' : '3′'} side)
                    </div>
                    <PartnerTable
                        columns={partnerColumns}
                        data={store.partnerSummaries}
                        showPagination={true}
                        initialItemsPerPage={25}
                        paginationProps={{ showMoreButton: false }}
                        showColumnVisibility={false}
                        showCopyDownload={true}
                        initialSortColumn="# samples"
                        initialSortDirection="desc"
                    />
                </div>
            );
        }
        const selected = new Set(store.filter.fusionPairKeys);
        const anchoredKey =
            store.anchor && store.anchor.mode === 'pair'
                ? store.anchor.key
                : undefined;

        const columns: Column<FusionPairSummary>[] = [
            {
                // Filtering the cohort is a separate intent from anchoring the
                // comparison below, so it gets its own control rather than
                // competing with the row click. Single-select: checking a pair
                // clears any other, since the comparison anchors on one pair.
                name: 'Filter',
                render: (d: FusionPairSummary) => (
                    <input
                        type="checkbox"
                        data-test={`pair-filter-${d.key}`}
                        aria-label={`Filter cohort by ${d.key}`}
                        checked={selected.has(d.key)}
                        onChange={() => store.selectOnlyFusionPairKey(d.key)}
                    />
                ),
                sortBy: (d: FusionPairSummary) => (selected.has(d.key) ? 1 : 0),
                download: (d: FusionPairSummary) => `${selected.has(d.key)}`,
            },
            {
                name: 'Fusion pair',
                render: (d: FusionPairSummary) => (
                    <span
                        data-test={`pair-row-${d.key}`}
                        data-anchored={d.key === anchoredKey}
                        style={{
                            cursor: 'pointer',
                            fontWeight:
                                d.key === anchoredKey || selected.has(d.key)
                                    ? 700
                                    : 400,
                        }}
                        onClick={() =>
                            store.setAnchor({ mode: 'pair', key: d.key })
                        }
                        title={
                            d.fivePrime
                                ? undefined
                                : '5′/3′ order not stated by the caller'
                        }
                    >
                        {pairDisplayLabel(d)}
                    </span>
                ),
                sortBy: (d: FusionPairSummary) => pairDisplayLabel(d),
                download: (d: FusionPairSummary) => pairDisplayLabel(d),
                filter: (d: FusionPairSummary, _f: string, up: string) =>
                    `${pairDisplayLabel(d)} ${d.key}`
                        .toUpperCase()
                        .indexOf(up) > -1,
            },
            {
                name: '# samples',
                render: (d: FusionPairSummary) => <span>{d.sampleCount}</span>,
                sortBy: (d: FusionPairSummary) => d.sampleCount,
                download: (d: FusionPairSummary) => `${d.sampleCount}`,
            },
            {
                name: '# events',
                render: (d: FusionPairSummary) => <span>{d.eventCount}</span>,
                sortBy: (d: FusionPairSummary) => d.eventCount,
                download: (d: FusionPairSummary) => `${d.eventCount}`,
            },
            {
                name: 'In-frame?',
                render: (d: FusionPairSummary) => framePill(d.anyInFrame),
                sortBy: (d: FusionPairSummary) => (d.anyInFrame ? 1 : 0),
                download: (d: FusionPairSummary) => `${d.anyInFrame}`,
            },
        ];

        return (
            <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {summaryTitle(hasFusionAnnotation)}
                </div>
                <PairTable
                    columns={columns}
                    data={store.pairSummariesForFacet}
                    showPagination={true}
                    // Page the cohort rather than dumping every pair: 25 rows
                    // (the house default, as in MutationTable and
                    // StructuralVariantTable), arrows at the bottom. Matches
                    // PdbChainTable's use of the shared PaginationControls
                    // (showMoreButton: false puts the status text between the
                    // arrows).
                    initialItemsPerPage={25}
                    paginationProps={{ showMoreButton: false }}
                    showColumnVisibility={false}
                    showCopyDownload={true}
                    initialSortColumn="# samples"
                    initialSortDirection="desc"
                />
            </div>
        );
    }
}

export default FusionRecurrenceTable;
