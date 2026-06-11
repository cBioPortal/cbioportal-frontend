import * as React from 'react';
import { observer } from 'mobx-react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { FusionCohortStore } from './FusionCohortStore';
import { FusionPairSummary } from './data/types';
import { frameStatusStyle } from './components/frameStatusStyle';

interface IFusionRecurrenceTableProps {
    store: FusionCohortStore;
}

class PairTable extends LazyMobXTable<FusionPairSummary> {}

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
        const { store } = this.props;
        const selected = new Set(store.filter.fusionPairKeys);

        const columns: Column<FusionPairSummary>[] = [
            {
                name: 'Fusion pair',
                render: (d: FusionPairSummary) => (
                    <span
                        data-test={`pair-row-${d.key}`}
                        style={{
                            cursor: 'pointer',
                            fontWeight: selected.has(d.key) ? 700 : 400,
                        }}
                        onClick={() => store.toggleFusionPairKey(d.key)}
                    >
                        {d.key}
                    </span>
                ),
                sortBy: (d: FusionPairSummary) => d.key,
                download: (d: FusionPairSummary) => d.key,
                filter: (d: FusionPairSummary, _f: string, up: string) =>
                    d.key.toUpperCase().indexOf(up) > -1,
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
            <PairTable
                columns={columns}
                data={store.pairSummaries}
                showPagination={true}
                showColumnVisibility={false}
                showCopyDownload={false}
                initialSortColumn="# samples"
                initialSortDirection="desc"
            />
        );
    }
}

export default FusionRecurrenceTable;
