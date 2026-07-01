import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import {
    observable,
    action,
    computed,
    makeObservable,
    runInAction,
} from 'mobx';
import { FusionCohortStore } from './FusionCohortStore';
import AnchorGeneTrackRuler from './components/AnchorGeneTrackRuler';
import FusionStripList from './components/FusionStripList';
import FusionRecurrenceTable from './FusionRecurrenceTable';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import { TranscriptData } from './data/types';
import FusionSummaryTableWidget from 'pages/studyView/charts/fusionSummary/FusionSummaryTableWidget';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';

export interface FusionComparisonViewProps {
    store: FusionCohortStore;
}

@observer
export default class FusionComparisonView extends React.Component<
    FusionComparisonViewProps
> {
    @observable.ref transcriptsByGene: Map<string, TranscriptData> = new Map();
    @observable expandedSampleId: string | undefined = undefined;

    constructor(props: FusionComparisonViewProps) {
        super(props);
        makeObservable(this);
    }

    @computed get hasFusionAnnotation(): boolean {
        return this.props.store.allEvents.some(
            e =>
                !!e.frameCallMethod &&
                e.frameCallMethod !== 'NA' &&
                e.frameCallMethod !== ''
        );
    }

    @computed get genesNeeded(): string[] {
        const set = new Set<string>();
        this.props.store.comparisonRows.forEach(r => {
            set.add(r.fivePrimeSymbol);
            if (r.threePrimeSymbol) set.add(r.threePrimeSymbol);
        });
        return Array.from(set);
    }

    @action.bound toggleAlignment() {
        this.props.store.setAlignment(
            this.props.store.alignment === 'junction'
                ? 'coordinate'
                : 'junction'
        );
    }

    // Default the anchor to the most recurrent pair so the comparison renders
    // as soon as the tab opens, without requiring the user to first click a row.
    @action.bound ensureDefaultAnchor() {
        const { store } = this.props;
        if (!store.anchor && store.pairSummaries.length > 0) {
            store.setAnchor({
                mode: 'pair',
                key: store.pairSummaries[0].key,
            });
        }
    }

    componentDidMount() {
        this.ensureDefaultAnchor();
        this.fetchTranscripts();
    }

    componentDidUpdate() {
        this.ensureDefaultAnchor();
        this.fetchTranscripts();
    }

    async fetchTranscripts() {
        const missing = this.genesNeeded.filter(
            g => !this.transcriptsByGene.has(g)
        );
        if (missing.length === 0) return;
        const next = new Map(this.transcriptsByGene);
        for (const gene of missing) {
            const list = await fetchTranscriptsForGeneWithFallback(
                gene,
                '',
                'GRCh38'
            );
            const forte = list.find(t => t.isForteSelected) || list[0];
            if (forte) next.set(gene, forte);
        }
        runInAction(() => {
            this.transcriptsByGene = next;
        });
    }

    transcriptForGene = (gene: string): TranscriptData | undefined =>
        this.transcriptsByGene.get(gene);

    render() {
        const { store } = this.props;
        const rows = store.comparisonRows;
        const anchorGene =
            store.anchor && store.anchor.mode === 'driver'
                ? store.anchor.key
                : rows.length > 0
                ? (() => {
                      const geneCounts = _.countBy(
                          rows,
                          r => r.fivePrimeSymbol
                      );
                      return Object.entries(geneCounts).sort(
                          (a, b) => b[1] - a[1]
                      )[0][0];
                  })()
                : '';
        const anchorTranscript = this.transcriptForGene(anchorGene);
        const expandedRow = rows.find(
            r => r.sampleId === this.expandedSampleId
        );

        return (
            <div>
                <FusionSummaryTableWidget
                    store={store}
                    hasFusionAnnotation={this.hasFusionAnnotation}
                    onSelectAnchor={a => store.setAnchor(a)}
                />
                <FusionRecurrenceTable store={store} />
                <button
                    data-testid="alignment-toggle"
                    onClick={this.toggleAlignment}
                >
                    {store.alignment === 'junction'
                        ? 'Align: junction'
                        : 'Align: coordinate'}
                </button>
                {store.alignment === 'coordinate' && (
                    <span
                        data-testid="coordinate-coming-soon"
                        style={{
                            color: '#888',
                            marginLeft: 8,
                            fontSize: '0.85em',
                        }}
                    >
                        coordinate view coming soon
                    </span>
                )}
                {anchorTranscript && (
                    <svg width="100%" viewBox="0 0 1240 168">
                        <AnchorGeneTrackRuler
                            anchorTranscript={anchorTranscript}
                            anchorSymbol={anchorGene}
                            rows={rows}
                            width={1240}
                        />
                    </svg>
                )}
                <FusionStripList
                    rows={rows}
                    transcriptForGene={this.transcriptForGene}
                    width={1240}
                    alignment={store.alignment}
                    onExpand={id =>
                        runInAction(() => {
                            this.expandedSampleId = id;
                        })
                    }
                />
                {expandedRow && (
                    <div data-testid="expanded-diagram">
                        {(() => {
                            const t5 = this.transcriptForGene(
                                expandedRow.fivePrimeSymbol
                            );
                            const t3 = expandedRow.threePrimeSymbol
                                ? this.transcriptForGene(
                                      expandedRow.threePrimeSymbol
                                  )
                                : undefined;
                            if (!t5) return null;
                            return (
                                <FusionDiagramSVG
                                    fusion={expandedRow.event}
                                    forteTranscript5p={t5}
                                    forteTranscript3p={t3}
                                    activeTranscript5p={t5}
                                    activeTranscript3p={t3}
                                    onActivate5p={() => undefined}
                                    onActivate3p={() => undefined}
                                />
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    }
}
