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
import AnchorGeneTrackRuler, {
    getAnchorTrackHeight,
} from './components/AnchorGeneTrackRuler';
import FusionStripList from './components/FusionStripList';
import {
    resolveComparisonRows,
    orientComparisonRowsTo5p,
    snapBreakpointsToAnchorGene,
} from './data/comparisonRows';
import FusionRecurrenceTable from './FusionRecurrenceTable';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import { TranscriptData } from './data/types';
import FusionSummaryTableWidget from 'pages/studyView/charts/fusionSummary/FusionSummaryTableWidget';
import WindowStore from 'shared/components/window/WindowStore';
import { computeComparisonFrame } from './components/comparisonFrame';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';

// Horizontal chrome (page padding + patient-view rails) subtracted from the
// window width to get the drawable content width. Floored so the view stays
// usable on narrow windows.
const HORIZONTAL_CHROME = 90;
const MIN_CONTENT_WIDTH = 900;

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
                this.props.store.genomeBuild
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
        // Correct each row's 5′/3′ using strand + connectionType, the same
        // resolver the single-sample diagram uses. Falls back to the curated
        // ordering for rows whose transcripts haven't loaded yet.
        const resolved = resolveComparisonRows(store.comparisonRows, gene => {
            const t = this.transcriptForGene(gene);
            return t ? [t] : [];
        });
        // Consensus 5′ gene for the pair = the majority resolved 5′ symbol.
        const anchorGene =
            store.anchor && store.anchor.mode === 'driver'
                ? store.anchor.key
                : resolved.length > 0
                ? (() => {
                      const geneCounts = _.countBy(
                          resolved,
                          r => r.fivePrimeSymbol
                      );
                      return Object.entries(geneCounts).sort(
                          (a, b) => b[1] - a[1]
                      )[0][0];
                  })()
                : '';
        // Orient EVERY row onto that one 5′ gene so the anchor track and the
        // strips share a single coordinate system (no mixed-gene breakpoints).
        const anchorTranscript = this.transcriptForGene(anchorGene);
        const oriented = orientComparisonRowsTo5p(resolved, anchorGene);
        // Snap breakpoints to the anchor locus to correct pattern-B rows whose
        // symbol/position columns are desynced in the source data.
        const rows = anchorTranscript
            ? snapBreakpointsToAnchorGene(
                  oriented,
                  anchorTranscript.txStart,
                  anchorTranscript.txEnd
              )
            : oriented;
        // The dominant 3′ partner of the resolved anchor — used for the
        // directional 5′→3′ caption over the tracks.
        const partnerGene = (() => {
            const partners = rows
                .filter(
                    r => r.fivePrimeSymbol === anchorGene && r.threePrimeSymbol
                )
                .map(r => r.threePrimeSymbol as string);
            if (partners.length === 0) return null;
            return Object.entries(_.countBy(partners)).sort(
                (a, b) => b[1] - a[1]
            )[0][0];
        })();
        const expandedRow = rows.find(
            r => r.sampleId === this.expandedSampleId
        );

        // Responsive: reading WindowStore.size (a MobX observable) inside this
        // @observer render makes the layout reflow on window resize with no
        // extra wiring.
        const contentWidth = Math.max(
            MIN_CONTENT_WIDTH,
            WindowStore.size.width - HORIZONTAL_CHROME
        );
        const frame = computeComparisonFrame(contentWidth);

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
                {anchorTranscript && partnerGene && (
                    <div
                        data-testid="fusion-direction-label"
                        style={{ fontWeight: 600, margin: '8px 0 4px' }}
                    >
                        {anchorGene} → {partnerGene}{' '}
                        <span
                            style={{
                                color: '#888',
                                fontWeight: 400,
                                fontSize: '0.85em',
                            }}
                        >
                            (5′ → 3′)
                        </span>
                    </div>
                )}
                <div style={{ width: contentWidth }}>
                    {anchorTranscript && (
                        <svg
                            width={contentWidth}
                            height={getAnchorTrackHeight(rows)}
                        >
                            <AnchorGeneTrackRuler
                                anchorTranscript={anchorTranscript}
                                anchorSymbol={anchorGene}
                                rows={rows}
                                leftX={frame.leftX}
                                junctionX={frame.junctionX}
                            />
                        </svg>
                    )}
                    <FusionStripList
                        rows={rows}
                        transcriptForGene={this.transcriptForGene}
                        width={contentWidth}
                        alignment={store.alignment}
                        onExpand={id =>
                            runInAction(() => {
                                this.expandedSampleId = id;
                            })
                        }
                    />
                </div>
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
                            // Orient the event so gene1 = the resolved 5′
                            // partner and gene2 = the 3′ partner, with the
                            // resolved breakpoints. Without this the diagram
                            // draws the 5′ transcript (TMPRSS2) but labels it
                            // with the raw gene1 (ERG) position.
                            const e = expandedRow.event;
                            const g5IsGene1 =
                                e.gene1.symbol === expandedRow.fivePrimeSymbol;
                            const g5Raw = g5IsGene1 ? e.gene1 : e.gene2!;
                            const g3Raw = g5IsGene1 ? e.gene2 : e.gene1;
                            const orientedEvent = {
                                ...e,
                                gene1: {
                                    ...g5Raw,
                                    position: expandedRow.anchorBreakpoint,
                                },
                                gene2: g3Raw
                                    ? {
                                          ...g3Raw,
                                          position:
                                              expandedRow.partnerBreakpoint ??
                                              g3Raw.position,
                                      }
                                    : null,
                                fusion: g3Raw
                                    ? `${expandedRow.fivePrimeSymbol}::${expandedRow.threePrimeSymbol}`
                                    : expandedRow.fivePrimeSymbol,
                            };
                            return (
                                <FusionDiagramSVG
                                    fusion={orientedEvent}
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
