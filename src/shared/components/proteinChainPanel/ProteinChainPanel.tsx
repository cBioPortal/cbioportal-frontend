import * as React from 'react';
import ProteinChainView from './ProteinChainView';
import PdbChainTable from './PdbChainTable';
import { observer } from 'mobx-react';
import {
    computed,
    observable,
    action,
    IReactionDisposer,
    reaction,
    makeObservable,
} from 'mobx';
import { ProteinChainSpec } from './ProteinChainView';
import { Collapse } from 'react-collapse';
import { HitZone, DefaultTooltip } from 'cbioportal-frontend-commons';
import MutationMapperStore from 'shared/components/mutationMapper/MutationMapperStore';
import { ALIGNMENT_GAP, IPdbChain } from '../../model/Pdb';
import PdbHeaderCache from '../../cache/PdbHeaderCache';
import PdbChainInfo from '../PdbChainInfo';
import onNextRenderFrame from 'shared/lib/onNextRenderFrame';
import AlphaFoldTable from './AlphaFoldTable';
import { StructureSource } from 'shared/components/structureViewer/StructureVisualizer';
import {
    AlphaFoldPredictionMetadata,
    fetchAlphaFoldPredictionsCached,
} from 'shared/components/structureViewer/AlphaFoldUtils';

type ProteinChainPanelProps = {
    store: MutationMapperStore;
    geneWidth: number;
    geneXOffset?: number;
    maxChainsHeight: number;
    pdbHeaderCache?: PdbHeaderCache;
    uniprotId?: string;
    /** Which source the sibling 3D viewer currently shows; drives whether this panel shows the PDB chain track or the AlphaFold track. */
    activeStructureSource?: StructureSource;
};

@observer
export default class ProteinChainPanel extends React.Component<
    ProteinChainPanelProps,
    {}
> {
    @observable private isExpanded: boolean = false;
    @observable private pdbChainTableShown: boolean = false;
    @observable private hoveredChain: IPdbChain | undefined;
    @observable private alphaFoldTableShown: boolean = false;
    @observable private alphaFoldPredictions: AlphaFoldPredictionMetadata[] = [];
    @observable private hoveredAlphaFoldFragment:
        | AlphaFoldPredictionMetadata
        | undefined;
    private alphaFoldFetchedForUniprotId: string | undefined;
    @observable hitZoneConfig: any = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        onClick: () => {},
    };

    private chainDiv: HTMLDivElement;
    private _chainScrollY: number = 0;

    private collapseTimeout: number | null = null;
    private expandTimeout: number | null = null;
    private chainUidToY: { [uid: string]: number } = {};
    private onChainSelectReaction: IReactionDisposer;
    private autoSelectFirstChainReaction: IReactionDisposer | null = null;

    private expandDelayMs = 750;
    private collapseDelayMs = 3000;

    private handlers: any;

    constructor(props: ProteinChainPanelProps) {
        super(props);

        makeObservable(this);

        this.handlers = {
            onMouseEnter: action(() => {
                this.expandTimeout = window.setTimeout(() => {
                    this.isExpanded = true;
                }, this.expandDelayMs);

                if (this.collapseTimeout) {
                    window.clearTimeout(this.collapseTimeout);
                }
            }),
            onMouseLeave: action(() => {
                this.collapseTimeout = window.setTimeout(() => {
                    this.isExpanded = false;
                }, this.collapseDelayMs);

                if (this.expandTimeout) {
                    window.clearTimeout(this.expandTimeout);
                }
            }),
            chainDivRef: (div: HTMLDivElement) => {
                this.chainDiv = div;
            },
            onChainScroll: () => {
                if (this.chainDiv && this.isExpanded) {
                    this._chainScrollY = this.chainDiv.scrollTop;
                }
            },
            togglePDBTable: action(() => {
                this.pdbChainTableShown = !this.pdbChainTableShown;
            }),
            toggleAlphaFoldTable: action(() => {
                this.alphaFoldTableShown = !this.alphaFoldTableShown;
            }),
            getTooltipContent: () => {
                if (this.isAlphaFoldMode) {
                    if (!this.hoveredAlphaFoldFragment) {
                        return null;
                    }
                    const confidence = this.hoveredAlphaFoldFragment
                        .globalMetricValue;
                    return (
                        <span>
                            {this.hoveredAlphaFoldFragment.entryId}
                            {typeof confidence === 'number' &&
                                ` (avg. pLDDT ${confidence.toFixed(1)})`}
                        </span>
                    );
                }
                if (this.hoveredChain) {
                    return (
                        <PdbChainInfo
                            pdbId={this.hoveredChain.pdbId}
                            chainId={this.hoveredChain.chain}
                            cache={this.props.pdbHeaderCache}
                        />
                    );
                } else {
                    return null;
                }
            },
            setHitZone: (
                hitRect: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                },
                chainUid: string
            ) => {
                this.hitZoneConfig.x = hitRect.x;
                this.hitZoneConfig.y = hitRect.y;
                this.hitZoneConfig.width = hitRect.width;
                this.hitZoneConfig.height = hitRect.height;

                if (this.isAlphaFoldMode) {
                    // No selection concept for AlphaFold - there's normally
                    // just the one model, already loaded in the 3D view.
                    this.hitZoneConfig.onClick = () => {};
                    this.hoveredAlphaFoldFragment = this.alphaFoldFragmentByUid[
                        chainUid
                    ];
                    this.hoveredChain = undefined;
                } else {
                    this.hitZoneConfig.onClick = () => {
                        this.selectChain(chainUid);
                    };
                    this.hoveredChain = this.props.store.pdbChainDataStore.getPdbChain(
                        chainUid
                    );
                    this.hoveredAlphaFoldFragment = undefined;
                }
            },
            setChainUidToY: (chainUidToY: { [uid: string]: number }) => {
                this.chainUidToY = chainUidToY;
            },
        };
        this.onChainSelectReaction = reaction(
            () => this.props.store.pdbChainDataStore.selectedUid,
            (selectedUid: string) => {
                const chainY = this.chainUidToY[selectedUid];
                if (
                    typeof chainY !== 'undefined' &&
                    (chainY < this.chainDiv.scrollTop ||
                        chainY >
                            this.chainDiv.scrollTop +
                                this.props.maxChainsHeight)
                ) {
                    const halfChainsHeight = this.props.maxChainsHeight / 2;
                    this.chainDiv.scrollTop = chainY - halfChainsHeight;
                }
            }
        );
    }

    componentWillUnmount() {
        this.onChainSelectReaction();
        if (this.autoSelectFirstChainReaction) {
            this.autoSelectFirstChainReaction();
        }
        if (this.expandTimeout !== null) {
            clearTimeout(this.expandTimeout);
            this.expandTimeout = null;
        }
        if (this.collapseTimeout !== null) {
            clearTimeout(this.collapseTimeout);
            this.collapseTimeout = null;
        }
    }

    @computed get chainScrollY() {
        if (this.isExpanded) {
            return this._chainScrollY;
        } else {
            return 0;
        }
    }

    @action private selectChain(chainUid: string) {
        this.props.store.pdbChainDataStore.selectUid(chainUid);
    }

    @computed private get isAlphaFoldMode(): boolean {
        return this.props.activeStructureSource === StructureSource.ALPHAFOLD;
    }

    @computed private get isOpen() {
        if (this.isAlphaFoldMode) {
            return this.alphaFoldPredictions.length > 0;
        }
        return !!this.props.store.pdbChainDataStore.selectedChain;
    }

    private alphaFoldFragmentUid(
        prediction: AlphaFoldPredictionMetadata,
        index: number
    ): string {
        return `alphafold-${prediction.entryId}-${index}`;
    }

    @computed private get alphaFoldFragmentByUid(): {
        [uid: string]: AlphaFoldPredictionMetadata;
    } {
        const map: { [uid: string]: AlphaFoldPredictionMetadata } = {};
        this.alphaFoldPredictions.forEach((prediction, index) => {
            map[this.alphaFoldFragmentUid(prediction, index)] = prediction;
        });
        return map;
    }

    /**
     * AlphaFold's prediction-summary API doesn't return each fragment's exact
     * covered range, so multi-fragment (very long protein) coverage is
     * approximated by splitting the canonical length evenly. The common case
     * (a single model) is just the full [1, proteinLength] span.
     */
    @computed get alphaFoldChains(): ProteinChainSpec[] {
        const fragmentCount = this.alphaFoldPredictions.length;
        if (fragmentCount === 0) {
            return [];
        }
        const span = this.proteinLength / fragmentCount;
        return this.alphaFoldPredictions.map((prediction, index) => ({
            start: Math.round(index * span) + 1,
            end: Math.round((index + 1) * span) + 1,
            gaps: [],
            opacity:
                typeof prediction.globalMetricValue === 'number'
                    ? Math.max(
                          0.25,
                          Math.min(1, prediction.globalMetricValue / 100)
                      )
                    : 1,
            uid: this.alphaFoldFragmentUid(prediction, index),
        }));
    }

    @computed private get displayChains(): IPdbChain[] {
        if (!this.props.store.pdbChainDataStore.selectedChain) {
            return [];
        } else if (!this.isExpanded) {
            return [this.props.store.pdbChainDataStore.selectedChain];
        } else {
            return this.props.store.pdbChainDataStore.allData;
        }
    }

    @computed get chains(): ProteinChainSpec[] {
        return this.displayChains.map((pdbChain: IPdbChain) => {
            const gaps = [];
            let gapStart = -1;
            const alignment = pdbChain.alignment;
            for (let i = 0; i < alignment.length; i++) {
                if (alignment[i] === ALIGNMENT_GAP) {
                    if (gapStart === -1) {
                        gapStart = i;
                    }
                } else {
                    if (gapStart !== -1) {
                        gaps.push({
                            start: pdbChain.uniprotStart + gapStart,
                            end: pdbChain.uniprotStart + i,
                        });
                        gapStart = -1;
                    }
                }
            }
            return {
                start: pdbChain.uniprotStart,
                end: pdbChain.uniprotEnd + 1,
                gaps,
                opacity: pdbChain.identityPerc,
                uid: this.props.store.pdbChainDataStore.getChainUid(pdbChain),
            };
        });
    }

    @computed get proteinLength() {
        const proteinLength =
            (this.props.store.canonicalTranscript.result &&
                this.props.store.canonicalTranscript.result.proteinLength) ||
            0;
        return Math.max(proteinLength, 1);
    }

    @computed get tooltipVisible() {
        return this.handlers.getTooltipContent() !== null;
    }

    @computed get hitZone() {
        return (
            <HitZone
                x={this.hitZoneConfig.x}
                y={this.hitZoneConfig.y}
                width={this.hitZoneConfig.width}
                height={this.hitZoneConfig.height}
                onClick={this.hitZoneConfig.onClick}
                cursor="pointer"
            />
        );
    }

    componentDidMount() {
        this.autoSelectFirstChainReaction = reaction(
            () => this.props.store.pdbChainDataStore.allData.length,
            length => {
                if (
                    length > 0 &&
                    this.props.store.pdbChainDataStore.selectedUid === ''
                ) {
                    onNextRenderFrame(() =>
                        this.props.store.pdbChainDataStore.selectFirstChain()
                    );
                }
            },
            { fireImmediately: true }
        );

        this.fetchAlphaFoldPredictionsIfNeeded();
    }

    componentDidUpdate() {
        onNextRenderFrame(() => {
            if (this.chainDiv) {
                this.chainDiv.scrollTop = this.chainScrollY;
            }
        });

        this.fetchAlphaFoldPredictionsIfNeeded();
    }

    private fetchAlphaFoldPredictionsIfNeeded() {
        const uniprotId = this.props.uniprotId;

        if (!uniprotId || this.alphaFoldFetchedForUniprotId === uniprotId) {
            return;
        }

        this.alphaFoldFetchedForUniprotId = uniprotId;

        fetchAlphaFoldPredictionsCached(uniprotId).then(
            action((predictions: AlphaFoldPredictionMetadata[]) => {
                // The AlphaFold API returns predictions for isoform-specific
                // accessions too (e.g. "P38398-4"), not just the queried
                // canonical one - keep only exact matches, otherwise these
                // get mistaken for fragments of the canonical model.
                this.alphaFoldPredictions = predictions.filter(
                    prediction =>
                        prediction.uniprotAccession.toUpperCase() ===
                        uniprotId.toUpperCase()
                );
            })
        );
    }

    public helpTooltipContent() {
        return (
            <div style={{ maxWidth: 400 }}>
                This panel displays a list of PDB chains for the corresponding
                uniprot ID. PDB chains are ranked with respect to their sequence
                similarity ratio, and aligned to the y-axis of the mutation
                diagram. Highly ranked chains have darker color than the lowly
                ranked ones.
                <br />
                <br />
                Each chain is represented by a single rectangle. Gaps within the
                chains are represented by a thin line connecting the segments of
                the chain.
                <br />
                <br />
                By default, only a first few rows are displayed. To see more
                chains, use the scroll bar next to the panel. To see the
                detailed list of all available PDB chains in a table click on
                the link below the panel.
                <br />
                <br />
                To select a chain, simply click on it. Selected chain is
                highlighted with a different frame color. You can also select a
                chain by clicking on a row in the table. Selecting a chain
                reloads the PDB data for the 3D structure visualizer.
            </div>
        );
    }

    public alphaFoldHelpTooltipContent() {
        return (
            <div style={{ maxWidth: 400 }}>
                This panel displays the AlphaFold predicted structure model
                for the corresponding UniProt ID, aligned to the y-axis of
                the mutation diagram. The bar's shade reflects the model's
                average confidence (pLDDT): higher confidence is darker.
                <br />
                <br />
                Each model is represented by a single rectangle covering the
                region it predicts. Very long proteins may have their
                AlphaFold prediction split into multiple fragments, each
                shown as its own rectangle.
                <br />
                <br />
                By default, only the model is shown here. To see its details
                (organism, confidence, version) in a table, click on the link
                below the panel.
                <br />
                <br />
                Unlike PDB chains, clicking here does not reload the 3D
                view: AlphaFold normally provides a single canonical model,
                which is already shown. This panel replaces "PDB Chains"
                while the 3D structure viewer is set to AlphaFold, and
                switches back automatically when the 3D viewer is set to
                PDB.
            </div>
        );
    }

    render() {
        const tooltipVisibleProps: any = {};
        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }
        const isAlphaFoldMode = this.isAlphaFoldMode;
        return (
            <div
                onMouseEnter={this.handlers.onMouseEnter}
                onMouseLeave={this.handlers.onMouseLeave}
            >
                <Collapse isOpened={this.isOpen}>
                    <div
                        style={{
                            position: 'relative',
                        }}
                    >
                        <div className="small" style={{ position: 'absolute' }}>
                            {/* Place holder for a possible PDB icon, for now manually aligning with a margin */}
                            <span style={{ marginLeft: 16 }}>
                                {isAlphaFoldMode
                                    ? 'AlphaFold Chain'
                                    : 'PDB Chains'}
                            </span>
                            <DefaultTooltip
                                placement="left"
                                overlay={
                                    isAlphaFoldMode
                                        ? this.alphaFoldHelpTooltipContent
                                        : this.helpTooltipContent
                                }
                                destroyTooltipOnHide={true}
                            >
                                <i
                                    className="fa fa-info-circle"
                                    style={{ paddingLeft: 3 }}
                                />
                            </DefaultTooltip>
                        </div>
                        <div
                            ref={this.handlers.chainDivRef}
                            style={{
                                overflowY: 'scroll',
                                maxHeight: this.props.maxChainsHeight,
                                marginLeft: this.props.geneXOffset,
                                position: 'relative',
                            }}
                            onScroll={this.handlers.onChainScroll}
                        >
                            <ProteinChainView
                                width={this.props.geneWidth}
                                chains={
                                    isAlphaFoldMode
                                        ? this.alphaFoldChains
                                        : this.chains
                                }
                                proteinLength={this.proteinLength}
                                setHitZone={this.handlers.setHitZone}
                                selectedChainUid={
                                    isAlphaFoldMode
                                        ? ''
                                        : this.props.store.pdbChainDataStore
                                              .selectedUid
                                }
                                setChainUidToY={this.handlers.setChainUidToY}
                            />
                            <DefaultTooltip
                                placement="top"
                                overlay={this.handlers.getTooltipContent}
                                {...tooltipVisibleProps}
                            >
                                {this.hitZone}
                            </DefaultTooltip>
                        </div>
                        <br />
                        <div
                            style={{
                                display: this.isExpanded ? 'inherit' : 'none',
                            }}
                        >
                            {isAlphaFoldMode ? (
                                <>
                                    <button
                                        onClick={
                                            this.handlers.toggleAlphaFoldTable
                                        }
                                        className="btn btn-default btn-sm"
                                    >
                                        {this.alphaFoldTableShown
                                            ? 'Hide AlphaFold Chain Table'
                                            : 'Show AlphaFold Chain Table'}
                                    </button>
                                    <div
                                        style={{
                                            display: this.alphaFoldTableShown
                                                ? 'inherit'
                                                : 'none',
                                            maxWidth: this.props.geneWidth,
                                        }}
                                    >
                                        <AlphaFoldTable
                                            predictions={
                                                this.alphaFoldPredictions
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={this.handlers.togglePDBTable}
                                        className="btn btn-default btn-sm"
                                    >
                                        {this.pdbChainTableShown
                                            ? 'Hide PDB Chain Table'
                                            : 'Show PDB Chain Table'}
                                    </button>
                                    <div
                                        style={{
                                            display: this.pdbChainTableShown
                                                ? 'inherit'
                                                : 'none',
                                            maxWidth: this.props.geneWidth,
                                        }}
                                    >
                                        <PdbChainTable
                                            dataStore={
                                                this.props.store
                                                    .pdbChainDataStore
                                            }
                                            cache={this.props.pdbHeaderCache}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <br />
                    </div>
                </Collapse>
            </div>
        );
    }
}
