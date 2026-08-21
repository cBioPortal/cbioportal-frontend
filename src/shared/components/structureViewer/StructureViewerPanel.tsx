import * as React from 'react';
import _ from 'lodash';
import { FormControl, Checkbox, Button, ButtonGroup } from 'react-bootstrap';
import { If, Else, Then } from 'react-if';
import { ThreeBounce } from 'better-react-spinkit';
import {
    observable,
    computed,
    makeObservable,
    action,
    reaction,
    IReactionDisposer,
} from 'mobx';
import { observer } from 'mobx-react';
import Draggable from 'react-draggable';
import fileDownload from 'react-file-download';
import classnames from 'classnames';
import { IProteinImpactTypeColors } from 'react-mutation-mapper';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import ResidueMappingCache from 'shared/cache/ResidueMappingCache';
import {
    DefaultTooltip,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import { ResidueMapping } from 'genome-nexus-ts-api-client';
import { CacheData } from 'shared/lib/LazyMobXCache';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { Mutation } from 'cbioportal-ts-api-client';
import { IPdbChain, PdbAlignmentIndex } from 'shared/model/Pdb';
import {
    groupMutationsByProteinStartPos,
    getColorForProteinImpactType,
    getProteinStartPositionsByRange,
} from 'shared/lib/MutationUtils';
import StructureViewer from './StructureViewer';
import PdbChainInfo from '../PdbChainInfo';
import AlphaFoldChainInfo from './AlphaFoldChainInfo';
import AlphaFoldPaeHeatmap, {
    PaeHeatmapHighlight,
} from './AlphaFoldPaeHeatmap';
import {
    ProteinScheme,
    ProteinColor,
    SideChain,
    MutationColor,
    StructureSource,
    StructureLoadStatus,
    IResidueSpec,
    IMutationLabelSpec,
    IStructureResiduePin,
    IPaeResiduePairHighlight,
} from './StructureVisualizer';
import PyMolScriptGenerator from './PyMolScriptGenerator';
import MutationLabelDetailPanel from './MutationLabelDetailPanel';
import { buildMutationLabels } from './MutationLabelUtils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    ALPHAFOLD_DEFAULT_CHAIN,
    ALPHAFOLD_DEFAULT_ISOFORM,
    fetchAlphaFoldPredictionsCached,
    fetchAlphaFoldPredictionMetadataCached,
    fetchAlphaFoldPlddtByResidue,
    fetchAlphaFoldPaeData,
    getAlphaFoldModelId,
} from './AlphaFoldUtils';
import {
    ALPHAFOLD_PLDDT_LEGEND,
    ALPHAFOLD_PLDDT_LOW_THRESHOLD,
    getLowPlddtPositions,
} from './AlphaFoldPlddtUtils';
import {
    AlphaFoldPaeData,
    getPaeCellSummary,
    PaeCellSummary,
} from './AlphaFoldPaeUtils';
import {
    getColorForMutationDensity,
    getMaxMutationCount,
    MUTATION_DENSITY_COLOR_HIGH,
    MUTATION_DENSITY_COLOR_LOW,
} from './MutationDensityUtils';

import styles from './structureViewer.module.scss';
import { getServerConfig } from 'config/config';

export interface IStructureViewerPanelProps extends IProteinImpactTypeColors {
    pdbChainDataStore: ILazyMobXTableApplicationDataStore<IPdbChain>;
    pdbAlignmentIndex?: PdbAlignmentIndex;
    mutationDataStore?: MutationMapperDataStore;
    pdbHeaderCache?: PdbHeaderCache;
    residueMappingCache?: ResidueMappingCache;
    uniprotId?: string;
    // AlphaFold model files base URL.
    alphafoldFilesBaseUrl?: string;
    // AlphaFold metadata API base URL.
    alphafoldApiBaseUrl?: string;
    // Genome Nexus annotations indexed by genomic location for 3D mutation
    // label details. When omitted, labels fall back to mutation fields only.
    indexedVariantAnnotations?: {
        [genomicLocation: string]: VariantAnnotation;
    };
    onClose?: () => void;
    // Notified when the active structure source changes.
    onStructureSourceChange?: (source: StructureSource) => void;
}

@observer
export default class StructureViewerPanel extends React.Component<
    IStructureViewerPanelProps,
    {}
> {
    // Panel chrome width when body is collapsed (header only).
    private static readonly COLLAPSED_PANEL_WIDTH = 480;

    // Minimum px of panel that must stay inside the viewport when dragging.
    private static readonly MIN_DRAG_VISIBLE_PX = 56;

    // Collapsed 3D canvas size (fixed; not recomputed from DOM on source switch).
    private static readonly COLLAPSED_VIEWER_WIDTH = 450;
    private static readonly COLLAPSED_VIEWER_HEIGHT = 350;
    private static readonly EXPANDED_WIDTH_SCALE = 1.55;
    private static readonly EXPANDED_HEIGHT_SCALE = 1.75;
    private static readonly VIEWER_FOOTER_HEIGHT = 40;
    private static readonly EXPANDED_CONTROLS_WIDTH = 280;
    private static readonly EXPANDED_COLUMN_GAP = 12;
    // Mirrors .expanded-body horizontal padding: 10px left + 10px right.
    private static readonly EXPANDED_BODY_HORIZONTAL_PADDING = 20;
    // Mirrors .main-3d-panel border: 2px left + 2px right.
    private static readonly EXPANDED_PANEL_BORDER_WIDTH = 4;
    // Keep panel inset from viewport edges when clamping expanded size.
    private static readonly EXPANDED_VIEWPORT_MARGIN = 24;
    // Header, body vertical padding, and viewer footer (approx.).
    private static readonly EXPANDED_PANEL_CHROME_HEIGHT = 120;

    @observable protected isCollapsed: boolean = false;
    @observable protected isIncreasedSize: boolean = false;
    @observable protected proteinScheme: ProteinScheme = ProteinScheme.CARTOON;
    @observable protected proteinColor: ProteinColor = ProteinColor.UNIFORM;
    @observable protected sideChain: SideChain = SideChain.SELECTED;
    @observable protected mutationColor: MutationColor =
        MutationColor.MUTATION_TYPE;
    @observable protected selectedMutationLabel: IMutationLabelSpec | null =
        null;
    @observable protected pinnedResidue: IStructureResiduePin | null = null;
    @observable protected structureSource: StructureSource =
        StructureSource.PDB;
    @observable protected displayBoundMolecules: boolean = false;
    @observable protected displayPaeHeatmap: boolean = false;
    @observable protected structureLoadStatus: StructureLoadStatus = 'idle';
    @observable protected structureLoadError: string | null = null;
    @observable protected alphafoldIsoform: number = ALPHAFOLD_DEFAULT_ISOFORM;
    @observable protected availableIsoforms: number[] = [
        ALPHAFOLD_DEFAULT_ISOFORM,
    ];
    // Optimistic until loadAlphaFoldPanelData resolves; false hides the AlphaFold option/tab.
    @observable protected alphafoldAvailable: boolean = true;
    @observable protected plddtByResidue: { [position: number]: number } = {};
    @observable protected paeData: AlphaFoldPaeData | null = null;
    @observable protected paeFocusCell: { row: number; col: number } | null =
        null;
    @observable protected paeLoadStatus:
        | 'idle'
        | 'loading'
        | 'complete'
        | 'error' = 'idle';
    @observable private dragLayoutTick = 0;
    @observable private viewerCanvasWidth: number =
        StructureViewerPanel.COLLAPSED_VIEWER_WIDTH;
    @observable private viewerCanvasHeight: number =
        StructureViewerPanel.COLLAPSED_VIEWER_HEIGHT;

    protected _3dMolDiv: HTMLDivElement | undefined;
    private _dragPortalRef: HTMLDivElement | null = null;
    private _dragPanelRef: HTMLDivElement | null = null;
    private _externalSelectionReactionDisposer: IReactionDisposer | undefined;
    private _structureSourceReactionDisposer: IReactionDisposer | undefined;

    constructor(props: IStructureViewerPanelProps) {
        super(props);

        makeObservable(this);

        this.structureSource =
            StructureViewerPanel.resolveInitialStructureSource(props);

        this.containerRefHandler = this.containerRefHandler.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.toggleDoubleSize = this.toggleDoubleSize.bind(this);
        this.handleProteinSchemeChange = this.handleProteinSchemeChange.bind(
            this
        );
        this.handleProteinColorChange = this.handleProteinColorChange.bind(
            this
        );
        this.handleSideChainChange = this.handleSideChainChange.bind(this);
        this.handleMutationColorChange = this.handleMutationColorChange.bind(
            this
        );
        this.handleMutationLabelClick = this.handleMutationLabelClick.bind(
            this
        );
        this.handleMutationLabelDetailClose = this.handleMutationLabelDetailClose.bind(
            this
        );
        this.handleResidueClick = this.handleResidueClick.bind(this);
        this.handleStructureBackgroundClick =
            this.handleStructureBackgroundClick.bind(this);
        this.handleBoundMoleculeChange = this.handleBoundMoleculeChange.bind(
            this
        );
        this.handlePyMolDownload = this.handlePyMolDownload.bind(this);
        this.handleStructureSourceChange = this.handleStructureSourceChange.bind(
            this
        );
        this.handlePaeHeatmapChange = this.handlePaeHeatmapChange.bind(this);
        this.handlePaeCellClick = this.handlePaeCellClick.bind(this);
        this.handleIsoformChange = this.handleIsoformChange.bind(this);
        this.handleStructureLoadStatusChange = this.handleStructureLoadStatusChange.bind(
            this
        );
        this.handleDragLayoutChange = this.handleDragLayoutChange.bind(this);
        this.dragPortalRefHandler = this.dragPortalRefHandler.bind(this);
        this.dragPanelRefHandler = this.dragPanelRefHandler.bind(this);
    }

    public componentDidMount() {
        this.loadAlphaFoldPanelData();
        window.addEventListener('resize', this.handleDragLayoutChange);
        this.scheduleDragBoundsRefresh();

        // Selecting a mutation elsewhere (e.g. clicking a lollipop in the 2D
        // plot, or a mutation table row) writes to the same shared
        // mutationDataStore the 3D view reads for highlighting. Mirror that
        // external selection into the same pin + detail-box experience a
        // direct click inside the 3D view produces.
        this._externalSelectionReactionDisposer = reaction(
            () => {
                const store = this.props.mutationDataStore;
                if (!store) {
                    return [];
                }

                // Preserve order from the underlying selection filters/values.
                return _.flatMap(store.selectionFilters as any, (filter: any) =>
                    Array.isArray(filter?.values) ? filter.values : []
                )
                    .map(Number)
                    .filter(value => Number.isFinite(value));
            },
            positions => this.handleExternalPositionSelection(positions)
        );

        // Let a parent (e.g. MutationMapper, to mirror it into a sibling
        // ProteinChainPanel) know which structure source is actually active -
        // this shifts on mount (resolveInitialStructureSource) and whenever
        // the AlphaFold-unavailable fallback or the dropdown changes it.
        this._structureSourceReactionDisposer = reaction(
            () => this.structureSource,
            source => this.props.onStructureSourceChange?.(source),
            { fireImmediately: true }
        );
    }

    public componentWillUnmount() {
        window.removeEventListener('resize', this.handleDragLayoutChange);

        if (this._externalSelectionReactionDisposer) {
            this._externalSelectionReactionDisposer();
        }

        if (this._structureSourceReactionDisposer) {
            this._structureSourceReactionDisposer();
        }
    }

    public componentDidUpdate(prevProps: IStructureViewerPanelProps) {
        if (prevProps.uniprotId !== this.props.uniprotId) {
            this.loadAlphaFoldPanelData();
        }
    }

    private static resolveInitialStructureSource(
        props: IStructureViewerPanelProps
    ): StructureSource {
        // Prefer AlphaFold whenever it might be available; loadAlphaFoldPanelData
        // falls back to PDB once it confirms there's no prediction for this protein.
        return props.uniprotId ? StructureSource.ALPHAFOLD : StructureSource.PDB;
    }

    private static getViewportSize(): { width: number; height: number } {
        if (typeof window === 'undefined') {
            return { width: 1920, height: 1080 };
        }

        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    public selectionTitle(
        text: string,
        tooltip?: JSX.Element,
        placement: string = 'top'
    ) {
        let content: JSX.Element | null = null;

        if (tooltip) {
            content = this.defaultInfoTooltip(tooltip, placement);
        }

        return (
            <span>
                {text} {content}:
            </span>
        );
    }

    public defaultInfoTooltip(
        tooltip: JSX.Element | (() => JSX.Element),
        placement: string = 'top'
    ) {
        const tooltipCallback =
            typeof tooltip === 'function' ? tooltip : () => tooltip;

        return (
            <DefaultTooltip
                placement={placement}
                overlay={tooltipCallback}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={true}
            >
                <i className="fa fa-info-circle" />
            </DefaultTooltip>
        );
    }

    public proteinColorTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Color options for the protein structure. <br />
                <br />
                <b>Uniform:</b> Colors the entire protein structure with a
                <span className={styles['loop']}> single color</span>. <br />
                <b>Secondary structure:</b> Colors the protein by secondary
                structure. Assigns different colors for{' '}
                <span className={styles['alpha-helix']}>alpha helices</span>,
                <span className={styles['beta-sheet']}> beta sheets</span>, and
                <span className={styles['loop']}> loops</span>. This color
                option is not available for the space-filling protein scheme.{' '}
                <br />
                <b>N-C rainbow:</b> Colors the protein with a rainbow gradient
                from red (N-terminus) to blue (C-terminus). <br />
                <b>Atom Type:</b> Colors the structure with respect to the atom
                type (CPK color scheme). This color option is only available for
                the space-filling protein scheme. <br />
                <b>pLDDT:</b> AlphaFold only — colors each residue by predicted
                local distance difference test (pLDDT) scores from the model
                B-factor column.
                <ul className={styles['plddt-legend-list']}>
                    {ALPHAFOLD_PLDDT_LEGEND.map(item => (
                        <li key={item.label}>
                            <span
                                className={styles['plddt-swatch']}
                                style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                        </li>
                    ))}
                </ul>
                <br />
                The selected chain is always displayed with full opacity while
                the rest of the structure has some transparency to help better
                focusing on the selected chain.
            </div>
        );
    }

    public sideChainTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Display options for the side chain atoms. <br />
                <br />
                <b>All:</b> Displays the side chain atoms for every mapped
                residue. <br />
                <b>Selected:</b> Displays the side chain atoms only for the
                selected mutations. <br />
                <br />
                This option has no effect for the space-filling protein scheme.
            </div>
        );
    }

    public mutationColorTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Color options for the mapped mutations. <br />
                <br />
                <b>Uniform:</b> Colors all mutated residues with a
                <span className={styles['uniform-mutation']}>
                    {' '}
                    single color
                </span>
                . <br />
                <b>Mutation type:</b> Enables residue coloring by mutation type.
                Mutation types and corresponding color codes are as follows:
                <ul>
                    <li>
                        <span className={styles['missense-mutation']}>
                            Missense Mutations
                        </span>
                    </li>
                    <li>
                        <span className={styles['trunc-mutation']}>
                            Truncating Mutations
                        </span>
                        <span> (Nonsense, Nonstop, FS del, FS ins)</span>
                    </li>
                    <li>
                        <span className={styles['inframe-mutation']}>
                            Inframe Mutations
                        </span>
                        <span> (IF del, IF ins)</span>
                    </li>
                </ul>
                <b>Mutation density:</b> Colors mapped residues by how many
                mutations fall on that position —{' '}
                <span
                    className={styles['mutation-density-swatch']}
                    style={{ backgroundColor: MUTATION_DENSITY_COLOR_LOW }}
                />
                {' low '}
                <span
                    className={styles['mutation-density-swatch']}
                    style={{ backgroundColor: MUTATION_DENSITY_COLOR_HIGH }}
                />
                {' high density.'}
                <br />
                <b>None:</b> Disables coloring of the mutated residues except
                for manually selected (highlighted) residues. <br />
                <br />
                Highlighted residues are colored with{' '}
                <span className={styles['highlighted']}>yellow</span>.
            </div>
        );
    }

    public boundMoleculesTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Displays co-crystalized molecules. This option has no effect if
                the current structure does not contain any co-crystalized bound
                molecules.
            </div>
        );
    }

    public paeTooltipContent() {
        const maxPae = this.paeData?.maxPae ?? 31.75;
        const scaleLabel = maxPae.toFixed(1);

        return (
            <div style={{ maxWidth: 400, maxHeight: 240, overflowY: 'auto' }}>
                Predicted Aligned Error (PAE) shows how confidently the model
                predicts the relative distance between residue pairs (in Å).
                <br />
                <br />
                Crosshairs follow mutations selected in the table or a residue
                clicked in the 3D view. Click the heatmap to inspect a residue
                pair; aligned and partner residues are highlighted on the
                structure.
                <br />
                <br />
                <div className={styles['pae-tooltip-legend']}>
                    <span>0</span>
                    <span className={styles['pae-tooltip-legend-bar']} />
                    <span>{scaleLabel} Å</span>
                </div>
                <div className={styles['pae-tooltip-legend-caption']}>
                    Blue: low error / high confidence. Orange: high error.
                </div>
            </div>
        );
    }

    public helpTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                <b>Zoom in/out:</b> Press and hold the SHIFT key and the left
                mouse button, and then move the mouse backward/forward.
                <br />
                <b>Pan:</b> Press and hold the CTRL key, click and hold the left
                mouse button, and then move the mouse in the desired direction.
                <br />
                <b>Rotate:</b> Press and hold the left mouse button, and then
                move the mouse in the desired direction to rotate along the x
                and y axes.
                <br />
            </div>
        );
    }

    public structureSourceTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                <b>PDB:</b> Experimental structure from the Protein Data Bank
                (via G2S alignment). <br />
                <b>AlphaFold:</b> Predicted full-length structure from the
                AlphaFold Database. Mutations are mapped by UniProt protein
                position until G2S AlphaFold alignment is available.
            </div>
        );
    }

    public isoformMenu() {
        if (
            this.structureSource !== StructureSource.ALPHAFOLD ||
            this.availableIsoforms.length <= 1
        ) {
            return null;
        }

        return (
            <div className="row">
                <div className="col col-sm-12">
                    <div className="row">
                        {this.selectionTitle(
                            'Isoform',
                            <div style={{ maxWidth: 400 }}>
                                AlphaFold model fragment (F1, F2, …) for
                                long or multi-domain proteins.
                            </div>
                        )}
                    </div>
                    <div className="row">
                        <FormControl
                            className={styles['default-option-select']}
                            componentClass="select"
                            value={`${this.alphafoldIsoform}`}
                            onChange={
                                this.handleIsoformChange as React.FormEventHandler<
                                    any
                                >
                            }
                        >
                            {this.availableIsoforms.map(isoform => (
                                <option key={isoform} value={isoform}>
                                    F{isoform}
                                </option>
                            ))}
                        </FormControl>
                    </div>
                </div>
            </div>
        );
    }

    public structureSourceMenu() {
        return (
            <div className={styles['structure-source-menu']}>
                <div className="row">
                    <div className="col col-sm-12">
                        <div className="row">
                            {this.selectionTitle(
                                'Structure source',
                                this.structureSourceTooltipContent()
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                data-test="structureSourceSelect"
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.structureSource}`}
                                onChange={
                                    this
                                        .handleStructureSourceChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                {this.props.uniprotId &&
                                    this.alphafoldAvailable && (
                                        <option value={StructureSource.ALPHAFOLD}>
                                            AlphaFold (predicted)
                                        </option>
                                    )}
                                <option value={StructureSource.PDB}>
                                    PDB (experimental)
                                </option>
                            </FormControl>
                        </div>
                    </div>
                </div>
                {this.isoformMenu()}
            </div>
        );
    }

    public proteinStyleMenu() {
        return (
            <span>
                <div className="row text-center">
                    <span>Protein Style</span>
                </div>
                <div className="row">
                    <div className="col col-sm-10 col-sm-offset-1">
                        <hr />
                    </div>
                </div>
                <div className="row">
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle('Scheme')}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.proteinScheme}`}
                                onChange={
                                    this
                                        .handleProteinSchemeChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={ProteinScheme.CARTOON}>
                                    cartoon
                                </option>
                                <option value={ProteinScheme.SPACE_FILLING}>
                                    space-filling
                                </option>
                                <option value={ProteinScheme.TRACE}>
                                    trace
                                </option>
                            </FormControl>
                        </div>
                    </div>
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle(
                                'Color',
                                this.proteinColorTooltipContent()
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.proteinColor}`}
                                onChange={
                                    this
                                        .handleProteinColorChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={ProteinColor.UNIFORM}>
                                    uniform
                                </option>
                                {!this.colorBySecondaryStructureDisabled && (
                                    <option
                                        value={ProteinColor.SECONDARY_STRUCTURE}
                                    >
                                        secondary structure
                                    </option>
                                )}
                                {!this.colorByNCRainbowDisabled && (
                                    <option value={ProteinColor.NC_RAINBOW}>
                                        N-C rainbow
                                    </option>
                                )}
                                {!this.colorByAtomTypeDisabled && (
                                    <option value={ProteinColor.ATOM_TYPE}>
                                        atom type
                                    </option>
                                )}
                                {this.structureSource ===
                                    StructureSource.ALPHAFOLD && (
                                    <option value={ProteinColor.PLDDT}>
                                        pLDDT
                                    </option>
                                )}
                            </FormControl>
                        </div>
                    </div>
                </div>
            </span>
        );
    }

    public structureDisplayOptionsMenu() {
        return (
            <div
                className={classnames(
                    'row',
                    styles['structure-display-options-row']
                )}
            >
                <div className="col col-sm-12">
                    {this.structureSource === StructureSource.PDB && (
                        <Checkbox
                            checked={this.displayBoundMolecules}
                            onChange={
                                this
                                    .handleBoundMoleculeChange as React.FormEventHandler<
                                    any
                                >
                            }
                        >
                            Display bound molecules{' '}
                            {this.defaultInfoTooltip(
                                this.boundMoleculesTooltipContent()
                            )}
                        </Checkbox>
                    )}
                    {this.structureSource === StructureSource.ALPHAFOLD && (
                        <Checkbox
                            checked={this.displayPaeHeatmap}
                            onChange={
                                this
                                    .handlePaeHeatmapChange as React.FormEventHandler<
                                    any
                                >
                            }
                        >
                            Display PAE heatmap{' '}
                            {this.defaultInfoTooltip(() =>
                                this.paeTooltipContent()
                            )}
                        </Checkbox>
                    )}
                </div>
            </div>
        );
    }

    public mutationStyleMenu() {
        return (
            <span>
                <div className="row text-center">
                    <span>Mutation Style</span>
                </div>
                <div className="row">
                    <div className="col col-sm-10 col-sm-offset-1">
                        <hr />
                    </div>
                </div>
                <div className="row">
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle(
                                'Side Chain',
                                this.sideChainTooltipContent()
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.sideChain}`}
                                onChange={
                                    this
                                        .handleSideChainChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={SideChain.ALL}>all</option>
                                <option value={SideChain.SELECTED}>
                                    selected
                                </option>
                            </FormControl>
                        </div>
                    </div>
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle(
                                'Color',
                                this.mutationColorTooltipContent(),
                                'left'
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.mutationColor}`}
                                onChange={
                                    this
                                        .handleMutationColorChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={MutationColor.UNIFORM}>
                                    uniform
                                </option>
                                <option value={MutationColor.MUTATION_TYPE}>
                                    mutation type
                                </option>
                                <option value={MutationColor.DENSITY}>
                                    mutation density
                                </option>
                                <option value={MutationColor.NONE}>none</option>
                            </FormControl>
                        </div>
                    </div>
                </div>
            </span>
        );
    }

    public topToolbar() {
        return (
            <div className="row">
                <div className="col col-sm-6">
                    {getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL && (
                        <ButtonGroup>
                            <DefaultTooltip
                                overlay={<span>Download PyMol script</span>}
                                placement="top"
                            >
                                <Button
                                    className="btn-sm"
                                    onClick={this.handlePyMolDownload}
                                >
                                    <i className="fa fa-cloud-download" /> PyMol
                                </Button>
                            </DefaultTooltip>
                        </ButtonGroup>
                    )}
                </div>
                <div className="col col-sm-6">
                    <span className="pull-right">
                        how to pan/zoom/rotate?{' '}
                        {this.defaultInfoTooltip(
                            this.helpTooltipContent(),
                            'left'
                        )}
                    </span>
                </div>
            </div>
        );
    }

    public header() {
        return (
            <div className={classnames('row', styles['header'])}>
                <div className="col col-sm-10">
                    <span>3D Structure</span>
                </div>
                <div className="col col-sm-2">
                    <span className="pull-right" style={{ whiteSpace: 'nowrap' }}>
                        <i
                            className={classnames('fa', {
                                'fa-down-left-and-up-right-to-center': this.isIncreasedSize,
                                'fa-up-right-and-down-left-from-center': !this.isIncreasedSize,
                            })}
                            onClick={this.toggleDoubleSize}
                            style={{ marginRight: 5, cursor: 'pointer' }}
                        />
                        {/* Hand-drawn (not font-glyph) so the mark thickness is an
                            explicit stroke-width, not at the mercy of the
                            renderer's font hinting/anti-aliasing. */}
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            onClick={this.toggleCollapse}
                            style={{
                                marginRight: 5,
                                cursor: 'pointer',
                                verticalAlign: -2,
                            }}
                        >
                            <circle cx="8" cy="8" r="7.9" fill="currentColor" />
                            <rect
                                x="4.1"
                                y="6.85"
                                width="7.8"
                                height="2.3"
                                rx="1.15"
                                fill="#fff"
                            />
                        </svg>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            onClick={this.props.onClose}
                            style={{ cursor: 'pointer', verticalAlign: -2 }}
                        >
                            <circle cx="8" cy="8" r="7.9" fill="currentColor" />
                            <line
                                x1="5.1"
                                y1="5.1"
                                x2="10.9"
                                y2="10.9"
                                stroke="#fff"
                                strokeWidth="2.3"
                                strokeLinecap="round"
                            />
                            <line
                                x1="10.9"
                                y1="5.1"
                                x2="5.1"
                                y2="10.9"
                                stroke="#fff"
                                strokeWidth="2.3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                </div>
            </div>
        );
    }

    public paeHeatmapOverlay() {
        if (
            this.structureSource !== StructureSource.ALPHAFOLD ||
            !this.displayPaeHeatmap
        ) {
            return null;
        }

        if (this.paeLoadStatus === 'loading') {
            return (
                <div
                    className={classnames(
                        styles['pae-heatmap-overlay'],
                        'structure-viewer-no-drag'
                    )}
                >
                    <ThreeBounce
                        size={16}
                        style={{ display: 'inline-block' }}
                    />
                    <span style={{ marginLeft: 6, fontSize: 12 }}>
                        Loading PAE…
                    </span>
                </div>
            );
        }

        if (!this.paeData) {
            return null;
        }

        return (
            <div
                className={classnames(
                    styles['pae-heatmap-overlay'],
                    'structure-viewer-no-drag'
                )}
            >
                <div className={styles['pae-heatmap-overlay-header']}>
                    <span>PAE</span>
                </div>
                <div className={styles['pae-heatmap-body']}>
                    <AlphaFoldPaeHeatmap
                        matrix={this.paeData.matrix}
                        maxPae={this.paeData.maxPae}
                        highlight={this.paeHighlight}
                        onCellClick={this.handlePaeCellClick}
                    />
                </div>
                {this.paeCellSummary && (
                    <div className={styles['pae-heatmap-summary']}>
                        {this.paeCellSummaryContent(this.paeCellSummary)}
                    </div>
                )}
            </div>
        );
    }

    public paeCellSummaryContent(summary: PaeCellSummary) {
        return (
            <>
                <span className={styles['pae-heatmap-summary-index']}>
                    ({summary.i}, {summary.j})
                </span>
                {' · '}
                <span className={styles['pae-heatmap-summary-value']}>
                    {summary.paeValue.toFixed(1)} Å PAE
                </span>
            </>
        );
    }

    public mainContent() {
        if (this.isIncreasedSize) {
            return this.expandedMainContent();
        }

        return this.compactMainContent();
    }

    public compactMainContent() {
        if (this.isStructureViewerReady) {
            return (
                <span>
                    {this.structureDetailsSection()}
                    <div
                        className={classnames(
                            'row',
                            styles['structure-viewer-section']
                        )}
                        style={{ paddingTop: 5, paddingBottom: 5 }}
                    >
                        <div className="col col-sm-12">
                            {this.structureViewerWithFooter()}
                        </div>
                    </div>
                </span>
            );
        }

        return this.structureViewerLoadingContent();
    }

    public expandedMainContent() {
        return (
            <div className={styles['expanded-two-column']}>
                <div
                    className={styles['expanded-viewer-column']}
                    style={
                        typeof this.structureViewerWidth === 'number'
                            ? { width: this.structureViewerWidth }
                            : undefined
                    }
                >
                    {this.isStructureViewerReady
                        ? this.structureViewerWithFooter()
                        : this.structureViewerLoadingContent()}
                </div>
                <div
                    className={classnames(
                        styles['expanded-controls-column'],
                        'structure-viewer-no-drag'
                    )}
                    style={{
                        maxHeight:
                            typeof this.expandedControlsMaxHeight === 'number'
                                ? this.expandedControlsMaxHeight
                                : undefined,
                    }}
                >
                    {this.expandedControlsSection()}
                </div>
            </div>
        );
    }

    public structureDetailsSection() {
        return (
            <>
                <div className="row">{this.structureInfoContent()}</div>
                <If condition={this.residueWarning.length > 0}>
                    <div className="row">
                        <div className="col col-sm-12 text-center">
                            <span className="text-danger">
                                {this.residueWarning}
                            </span>
                        </div>
                    </div>
                </If>
            </>
        );
    }

    public structureViewerWithFooter() {
        return (
            <>
                {this.structureViewerSection()}
                {this.viewerToolbarSection()}
            </>
        );
    }

    public viewerToolbarSection() {
        return (
            <div
                className={classnames(
                    styles['structure-viewer-footer'],
                    'structure-viewer-no-drag'
                )}
            >
                {this.topToolbar()}
            </div>
        );
    }

    public structureViewerSection() {
        return (
            <div
                className={classnames(
                    styles['structure-viewer-overlay'],
                    'structure-viewer-no-drag'
                )}
                style={
                    this.isIncreasedSize &&
                    typeof this.structureViewerWidth === 'number'
                        ? { width: this.structureViewerWidth }
                        : undefined
                }
            >
                <StructureViewer
                    structureSource={this.structureSource}
                    displayBoundMolecules={
                        this.structureSource === StructureSource.PDB &&
                        this.displayBoundMolecules
                    }
                    proteinScheme={this.proteinScheme}
                    proteinColor={this.proteinColor}
                    sideChain={this.sideChain}
                    mutationColor={this.mutationColor}
                    mutationLabels={this.mutationLabels}
                    onMutationLabelClick={this.handleMutationLabelClick}
                    pinnedResidue={this.pinnedResidue}
                    paeResiduePair={this.paeResiduePairHighlight}
                    onResidueClick={this.handleResidueClick}
                    onBackgroundClick={this.handleStructureBackgroundClick}
                    pdbId={this.viewerPdbId || ''}
                    uniprotId={this.props.uniprotId}
                    chainId={this.viewerChainId || ''}
                    residues={this.viewerResidues}
                    alphafoldIsoform={this.alphafoldIsoform}
                    alphafoldFilesBaseUrl={this.props.alphafoldFilesBaseUrl}
                    onStructureLoadStatusChange={
                        this.handleStructureLoadStatusChange
                    }
                    bounds={this.structureViewerBounds}
                    containerRef={this.containerRefHandler}
                />
                {this.structureViewerStatusOverlay()}
                {this.paeHeatmapOverlay()}
                <MutationLabelDetailPanel
                    label={this.selectedMutationLabel}
                    onClose={this.handleMutationLabelDetailClose}
                />
            </div>
        );
    }

    public structureViewerLoadingContent() {
        const expandedSizeStyle =
            this.isIncreasedSize &&
            typeof this.structureViewerWidth === 'number' &&
            typeof this.structureViewerHeight === 'number'
                ? {
                      minWidth: this.structureViewerWidth,
                      minHeight: this.structureViewerHeight,
                  }
                : undefined;

        return (
            <div
                className={classnames(styles['structure-viewer-loading'], {
                    [styles['structure-viewer-loading--expanded']]:
                        this.isIncreasedSize,
                })}
                style={expandedSizeStyle}
            >
                {this.structureSource === StructureSource.ALPHAFOLD &&
                !this.props.uniprotId ? (
                    <span className="text-danger">
                        No UniProt accession available for AlphaFold.
                    </span>
                ) : (
                    <ThreeBounce
                        size={25}
                        style={{
                            display: 'inline-block',
                            padding: 25,
                        }}
                    />
                )}
            </div>
        );
    }

    public panelControlsSection() {
        if (this.isIncreasedSize) {
            return (
                <>
                    {this.proteinStyleMenu()}
                    {this.structureDisplayOptionsMenu()}
                    {this.mutationStyleMenu()}
                </>
            );
        }

        return (
            <>
                <div className="row">
                    <div className="col col-sm-6">
                        {this.proteinStyleMenu()}
                    </div>
                    <div className="col col-sm-6">
                        {this.mutationStyleMenu()}
                    </div>
                </div>
                {this.structureDisplayOptionsMenu()}
            </>
        );
    }

    public expandedControlsSection() {
        return (
            <div className={styles['expanded-controls-section']}>
                {this.structureSourceMenu()}
                {this.structureDetailsSection()}
                {this.panelControlsSection()}
            </div>
        );
    }

    public structureViewerStatusOverlay() {
        if (
            this.structureLoadStatus !== 'loading' &&
            this.structureLoadStatus !== 'error'
        ) {
            return null;
        }

        const isAlphaFold =
            this.structureSource === StructureSource.ALPHAFOLD;

        if (this.structureLoadStatus === 'loading') {
            return (
                <div className={styles['structure-viewer-status']}>
                    <ThreeBounce
                        size={20}
                        style={{ display: 'inline-block' }}
                    />
                    <span style={{ marginLeft: 8 }}>
                        {isAlphaFold
                            ? 'Loading AlphaFold model…'
                            : 'Loading PDB structure…'}
                    </span>
                </div>
            );
        }

        const defaultMessage = isAlphaFold
            ? 'AlphaFold model could not be loaded.'
            : 'PDB structure could not be loaded.';

        return (
            <div
                className={classnames(
                    styles['structure-viewer-status'],
                    styles['structure-viewer-status--error']
                )}
            >
                {this.structureLoadError || defaultMessage}
            </div>
        );
    }

    public render() {
        return (
            <div
                ref={this.dragPortalRefHandler}
                className={styles['structure-viewer-drag-portal']}
            >
                <Draggable
                    bounds={this.getDragBounds()}
                    handle=".structure-viewer-header"
                    cancel="input, textarea, button, select, option, a, .fa, .structure-viewer-no-drag"
                >
                    <div
                        ref={this.dragPanelRefHandler}
                        className={classnames(styles['main-3d-panel'], {
                            [styles['increased-size-panel']]:
                                this.isIncreasedSize && !this.isCollapsed,
                            [styles['collapsed-header-panel']]: this.isCollapsed,
                        })}
                        style={
                            this.isCollapsed
                                ? {
                                      width: StructureViewerPanel.COLLAPSED_PANEL_WIDTH,
                                  }
                                : this.isIncreasedSize
                                  ? {
                                        width: this.expandedPanelWidth,
                                        maxWidth: this.expandedMaxPanelWidth,
                                        maxHeight: this.expandedMaxPanelHeight,
                                    }
                                  : undefined
                        }
                    >
                        <div className="structure-viewer-header row">
                            {this.header()}
                            <hr
                                className={styles['panel-header-divider']}
                            />
                        </div>
                        <div
                            className={classnames(styles['body'], {
                                [styles['collapsed-panel']]: this.isCollapsed,
                                [styles['expanded-body']]:
                                    this.isIncreasedSize && !this.isCollapsed,
                            })}
                        >
                            {this.isIncreasedSize ? (
                                this.mainContent()
                            ) : (
                                <>
                                    {this.structureSourceMenu()}
                                    {this.mainContent()}
                                    {this.panelControlsSection()}
                                </>
                            )}
                        </div>
                    </div>
                </Draggable>
            </div>
        );
    }

    private containerRefHandler(div: HTMLDivElement) {
        this._3dMolDiv = div;
    }

    private dragPortalRefHandler(div: HTMLDivElement | null) {
        this._dragPortalRef = div;
        this.scheduleDragBoundsRefresh();
    }

    private dragPanelRefHandler(div: HTMLDivElement | null) {
        this._dragPanelRef = div;
        this.scheduleDragBoundsRefresh();
    }

    @action
    private handleDragLayoutChange() {
        this.dragLayoutTick += 1;
    }

    private scheduleDragBoundsRefresh() {
        requestAnimationFrame(() => {
            this.handleDragLayoutChange();
        });
    }

    private getDragBounds():
        | {
              left: number;
              top: number;
              right: number;
              bottom: number;
          }
        | false {
        void this.dragLayoutTick;

        const panel = this._dragPanelRef;
        const portal = this._dragPortalRef;

        if (!panel || !portal) {
            return false;
        }

        const minVisible = StructureViewerPanel.MIN_DRAG_VISIBLE_PX;
        const width = panel.offsetWidth;
        const height = panel.offsetHeight;
        const parentWidth = portal.clientWidth;
        const parentHeight = portal.clientHeight;
        const offsetLeft = panel.offsetLeft;
        const offsetTop = panel.offsetTop;

        return {
            left: -(offsetLeft + width - minVisible),
            top: -(offsetTop + height - minVisible),
            right: parentWidth - minVisible - offsetLeft,
            bottom: parentHeight - minVisible - offsetTop,
        };
    }

    @action
    private toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.scheduleDragBoundsRefresh();
    }

    @action
    private toggleDoubleSize() {
        this.isIncreasedSize = !this.isIncreasedSize;
        this.scheduleDragBoundsRefresh();
    }

    private handleProteinSchemeChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.proteinScheme = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );

        // when the protein scheme is SPACE_FILLING, NC_RAINBOW and SECONDARY_STRUCTURE are not allowed
        if (
            this.proteinScheme === ProteinScheme.SPACE_FILLING &&
            (this.proteinColor === ProteinColor.NC_RAINBOW ||
                this.proteinColor === ProteinColor.SECONDARY_STRUCTURE)
        ) {
            this.proteinColor = ProteinColor.UNIFORM;
        }
        // when the protein scheme is CARTOON or TRACE, ATOM_TYPE is not allowed
        else if (
            (this.proteinScheme === ProteinScheme.TRACE ||
                this.proteinScheme === ProteinScheme.CARTOON) &&
            this.proteinColor === ProteinColor.ATOM_TYPE
        ) {
            this.proteinColor = ProteinColor.UNIFORM;
        }
    }

    private handleProteinColorChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.proteinColor = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );
    }

    private handleSideChainChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.sideChain = parseInt((evt.target as HTMLSelectElement).value, 10);
    }

    private handleMutationColorChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.mutationColor = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );
    }

    @action
    private clearStructureInteractionSelection(): void {
        this.pinnedResidue = null;
        this.selectedMutationLabel = null;
        this.paeFocusCell = null;
    }

    @action
    private handleStructureBackgroundClick(): void {
        this.clearStructureInteractionSelection();
    }

    // Reacts to selection made outside the 3D view via the shared
    // mutationDataStore, mirroring it into the same pin + detail-box state a
    // direct in-canvas click would produce.
    @action
    private handleExternalPositionSelection(positions: number[]): void {
        if (positions.length === 0) {
            this.clearStructureInteractionSelection();
            return;
        }

        // Shift-click can select a range; show the most recently clicked one.
        const proteinPosition = positions[positions.length - 1];
        const label = this.mutationLabels.find(
            candidate => candidate.proteinPosition === proteinPosition
        );

        if (label) {
            this.handleMutationLabelClick(label);
        }
    }

    @action
    private handleMutationLabelClick(label: IMutationLabelSpec) {
        this.selectedMutationLabel = label;
        this.paeFocusCell = null;
        this.pinnedResidue = {
            chain: this.viewerChainId || '',
            resi: label.structurePosition,
        };
    }

    @action
    private handleResidueClick(chain: string, resi: number) {
        const chainKey = chain.toUpperCase();
        const pinnedKey = this.pinnedResidue?.chain.toUpperCase();

        if (
            this.pinnedResidue?.resi === resi &&
            pinnedKey === chainKey
        ) {
            this.clearStructureInteractionSelection();
            return;
        }

        this.paeFocusCell = null;
        this.pinnedResidue = { chain, resi };

        const matchingLabel = this.mutationLabels.find(
            label => label.structurePosition === resi
        );
        this.selectedMutationLabel = matchingLabel || null;
    }

    @action
    private handleMutationLabelDetailClose() {
        this.clearStructureInteractionSelection();
    }

    private handleBoundMoleculeChange() {
        this.displayBoundMolecules = !this.displayBoundMolecules;
    }

    @action
    private handlePaeHeatmapChange(evt: React.FormEvent<HTMLInputElement>) {
        const checked = (evt.target as HTMLInputElement).checked;
        this.displayPaeHeatmap = checked;

        if (!checked) {
            this.paeFocusCell = null;
        }
    }

    @action
    private handlePaeCellClick(row: number, col: number) {
        if (
            this.paeFocusCell?.row === row &&
            this.paeFocusCell?.col === col
        ) {
            this.paeFocusCell = null;
            return;
        }

        this.paeFocusCell = { row, col };
    }

    private handleStructureSourceChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.structureSource = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );
        this.structureLoadStatus = 'idle';
        this.structureLoadError = null;
        this.selectedMutationLabel = null;
        this.pinnedResidue = null;
        this.paeFocusCell = null;

        if (this.structureSource === StructureSource.PDB) {
            if (this.proteinColor === ProteinColor.PLDDT) {
                this.proteinColor = ProteinColor.UNIFORM;
            }
            this.plddtByResidue = {};
            this.paeData = null;
            this.paeLoadStatus = 'idle';
        } else {
            this.loadAlphaFoldConfidenceData();
        }

        this.scheduleDragBoundsRefresh();
    }

    private handleIsoformChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.alphafoldIsoform = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );
        this.structureLoadStatus = 'idle';
        this.structureLoadError = null;
        this.selectedMutationLabel = null;
        this.pinnedResidue = null;
        this.paeFocusCell = null;
        this.loadAlphaFoldConfidenceData();
        this.scheduleDragBoundsRefresh();
    }

    @action
    private handleStructureLoadStatusChange(
        status: StructureLoadStatus,
        message?: string
    ) {
        this.structureLoadStatus = status;
        this.structureLoadError = message || null;
        this.scheduleDragBoundsRefresh();
    }

    @action
    private async loadAlphaFoldPanelData() {
        if (!this.props.uniprotId) {
            return;
        }

        const predictions = await fetchAlphaFoldPredictionsCached(
            this.props.uniprotId,
            this.props.alphafoldApiBaseUrl
        );

        this.alphafoldAvailable = predictions.length > 0;

        if (predictions.length === 0) {
            this.availableIsoforms = [ALPHAFOLD_DEFAULT_ISOFORM];

            if (this.structureSource === StructureSource.ALPHAFOLD) {
                this.structureSource = StructureSource.PDB;
                this.structureLoadStatus = 'idle';
                this.structureLoadError = null;
            }
            return;
        }

        this.availableIsoforms = _.uniq(
            predictions.map(prediction => prediction.isoform)
        ).sort((a, b) => a - b);

        if (!this.availableIsoforms.includes(this.alphafoldIsoform)) {
            this.alphafoldIsoform = this.availableIsoforms[0];
        }

        if (this.structureSource === StructureSource.ALPHAFOLD) {
            await this.loadAlphaFoldConfidenceData();
        }

        this.scheduleDragBoundsRefresh();
    }

    @action
    private async loadAlphaFoldConfidenceData() {
        if (
            !this.props.uniprotId ||
            this.structureSource !== StructureSource.ALPHAFOLD
        ) {
            this.plddtByResidue = {};
            this.paeData = null;
            this.paeLoadStatus = 'idle';
            return;
        }

        this.paeLoadStatus = 'loading';

        try {
            const metadata = await fetchAlphaFoldPredictionMetadataCached(
                this.props.uniprotId,
                this.props.alphafoldApiBaseUrl,
                this.alphafoldIsoform
            );

            if (!metadata) {
                this.plddtByResidue = {};
                this.paeData = null;
                this.paeLoadStatus = 'error';
                return;
            }

            if (metadata.plddtDocUrl) {
                this.plddtByResidue = await fetchAlphaFoldPlddtByResidue(
                    metadata.plddtDocUrl
                );
            } else {
                this.plddtByResidue = {};
            }

            if (metadata.paeDocUrl) {
                this.paeData = await fetchAlphaFoldPaeData(
                    metadata.paeDocUrl,
                    this.props.alphafoldFilesBaseUrl
                );
                this.paeLoadStatus = 'complete';
            } else {
                this.paeData = null;
                this.paeLoadStatus = 'error';
            }
        } catch (error) {
            this.plddtByResidue = {};
            this.paeData = null;
            this.paeLoadStatus = 'error';
        }
    }

    public structureInfoContent() {
        if (
            this.structureSource === StructureSource.ALPHAFOLD &&
            this.props.uniprotId &&
            this.viewerChainId
        ) {
            return (
                <AlphaFoldChainInfo
                    uniprotId={this.props.uniprotId}
                    chainId={this.viewerChainId}
                    isoform={this.alphafoldIsoform}
                    truncateText={true}
                    alphafoldApiBaseUrl={this.props.alphafoldApiBaseUrl}
                />
            );
        }

        if (this.pdbId && this.chainId) {
            return (
                <PdbChainInfo
                    pdbId={this.pdbId}
                    chainId={this.chainId}
                    cache={this.props.pdbHeaderCache}
                    truncateText={true}
                />
            );
        }

        return null;
    }

    private handlePyMolDownload() {
        if (this.viewerChainId && this.pyMolStructureId) {
            const filename =
                this.structureSource === StructureSource.ALPHAFOLD
                    ? `${getAlphaFoldModelId(
                          this.props.uniprotId || '',
                          this.alphafoldIsoform
                      )}_${this.viewerChainId}.pml`
                    : `${this.pdbId}_${this.viewerChainId}.pml`;
            fileDownload(this.pyMolScript, filename);
        }
    }

    @computed get structureViewerBounds(): {
        width: number | string;
        height: number | string;
    } {
        return {
            width: this.structureViewerWidth,
            height: this.structureViewerHeight,
        };
    }

    @computed get structureViewerWidth(): number | string {
        if (this.isIncreasedSize) {
            return Math.min(
                this.expandedIdealViewerWidth,
                this.expandedMaxViewerWidth
            );
        }

        return this.viewerCanvasWidth;
    }

    @computed get structureViewerHeight(): number | string {
        if (this.isIncreasedSize) {
            return Math.min(
                this.expandedIdealViewerHeight,
                this.expandedMaxViewerHeight
            );
        }

        return this.viewerCanvasHeight;
    }

    @computed get expandedIdealViewerWidth(): number {
        return Math.floor(
            this.viewerCanvasWidth *
                StructureViewerPanel.EXPANDED_WIDTH_SCALE
        );
    }

    @computed get expandedIdealViewerHeight(): number {
        return Math.floor(
            this.viewerCanvasHeight *
                StructureViewerPanel.EXPANDED_HEIGHT_SCALE
        );
    }

    @computed get expandedMaxPanelWidth(): number {
        void this.dragLayoutTick;

        return (
            StructureViewerPanel.getViewportSize().width -
            StructureViewerPanel.EXPANDED_VIEWPORT_MARGIN
        );
    }

    @computed get expandedMaxPanelHeight(): number {
        void this.dragLayoutTick;

        return (
            StructureViewerPanel.getViewportSize().height -
            StructureViewerPanel.EXPANDED_VIEWPORT_MARGIN
        );
    }

    @computed get expandedPanelChromeWidth(): number {
        return (
            StructureViewerPanel.EXPANDED_CONTROLS_WIDTH +
            StructureViewerPanel.EXPANDED_COLUMN_GAP +
            StructureViewerPanel.EXPANDED_BODY_HORIZONTAL_PADDING +
            StructureViewerPanel.EXPANDED_PANEL_BORDER_WIDTH
        );
    }

    @computed get expandedMaxViewerWidth(): number {
        return Math.max(
            StructureViewerPanel.COLLAPSED_VIEWER_WIDTH,
            this.expandedMaxPanelWidth - this.expandedPanelChromeWidth
        );
    }

    @computed get expandedMaxViewerHeight(): number {
        return Math.max(
            StructureViewerPanel.COLLAPSED_VIEWER_HEIGHT,
            this.expandedMaxPanelHeight -
                StructureViewerPanel.EXPANDED_PANEL_CHROME_HEIGHT
        );
    }

    // Expanded panel outer width (border-box): viewer + controls + gap + body padding + border.
    @computed get expandedPanelWidth(): number {
        const viewerWidth =
            typeof this.structureViewerWidth === 'number'
                ? this.structureViewerWidth
                : StructureViewerPanel.COLLAPSED_VIEWER_WIDTH;

        return Math.min(
            viewerWidth + this.expandedPanelChromeWidth,
            this.expandedMaxPanelWidth
        );
    }

    @computed get expandedControlsMaxHeight(): number | string {
        const viewerHeight = this.structureViewerHeight;

        if (typeof viewerHeight === 'number') {
            return viewerHeight + StructureViewerPanel.VIEWER_FOOTER_HEIGHT;
        }

        return viewerHeight;
    }

    @computed get isStructureViewerReady(): boolean {
        if (this.structureSource === StructureSource.ALPHAFOLD) {
            return !!this.props.uniprotId;
        }

        return !!(
            this.pdbId &&
            this.chainId &&
            this.residues !== undefined
        );
    }

    @computed get maxMutationCountPerPosition(): number {
        return getMaxMutationCount(this.mutationsByPosition);
    }

    @computed get pdbPositionByQueryPosition(): {
        [queryPosition: number]: number;
    } {
        const map: { [queryPosition: number]: number } = {};

        if (!this.residueMappingData) {
            return map;
        }

        this.residueMappingData.forEach(cacheData => {
            if (cacheData && cacheData.data) {
                map[cacheData.data.queryPosition] = cacheData.data.pdbPosition;
            }
        });

        return map;
    }

    @computed get mutationLabels(): IMutationLabelSpec[] {
        return buildMutationLabels({
            mutationsByPosition: this.mutationsByPosition,
            proteinToStructurePosition: (proteinPosition: number) =>
                this.mapProteinToStructurePosition(proteinPosition),
            isHighlighted: (proteinPosition: number) =>
                !!(
                    this.props.mutationDataStore &&
                    (this.props.mutationDataStore.isPositionSelected(
                        proteinPosition
                    ) ||
                        this.props.mutationDataStore.isPositionHighlighted(
                            proteinPosition
                        ))
                ),
            indexedVariantAnnotations: this.props.indexedVariantAnnotations,
        });
    }

    private mapProteinToStructurePosition(
        proteinPosition: number
    ): number | undefined {
        if (this.structureSource === StructureSource.ALPHAFOLD) {
            return proteinPosition;
        }

        return this.pdbPositionByQueryPosition[proteinPosition];
    }

    private getMutationResidueColor(mutations: Mutation[]): string {
        if (this.mutationColor === MutationColor.DENSITY) {
            return getColorForMutationDensity(
                mutations.length,
                this.maxMutationCountPerPosition
            );
        }

        return getColorForProteinImpactType(mutations, this.props);
    }

    @computed get viewerChainId(): string | undefined {
        if (this.structureSource === StructureSource.ALPHAFOLD) {
            return ALPHAFOLD_DEFAULT_CHAIN;
        }

        return this.chainId;
    }

    @computed get viewerPdbId(): string | undefined {
        if (this.structureSource === StructureSource.ALPHAFOLD) {
            return this.props.uniprotId;
        }

        return this.pdbId;
    }

    @computed get viewerResidues(): IResidueSpec[] | undefined {
        if (this.structureSource === StructureSource.ALPHAFOLD) {
            return this.alphafoldResidues;
        }

        return this.residues;
    }

    @computed get alphafoldResidues(): IResidueSpec[] {
        const residues: IResidueSpec[] = [];

        _.each(this.mutationsByPosition, (mutations, positionKey) => {
            const position = parseInt(positionKey, 10);

            if (Number.isNaN(position) || mutations.length === 0) {
                return;
            }

            const mutationDataStore = this.props.mutationDataStore;
            const highlighted = Boolean(
                mutationDataStore &&
                    (mutationDataStore.isPositionSelected(position) ||
                        mutationDataStore.isPositionHighlighted(position))
            );

            residues.push({
                positionRange: {
                    start: { position },
                    end: { position },
                },
                color: this.getMutationResidueColor(mutations),
                highlighted,
            });
        });

        return _.uniq(residues);
    }

    @computed get pyMolStructureId(): string | undefined {
        if (this.structureSource === StructureSource.ALPHAFOLD) {
            return this.props.uniprotId;
        }

        return this.pdbId;
    }

    @computed get pdbId() {
        if (this.pdbChain) {
            return this.pdbChain.pdbId;
        } else {
            return undefined;
        }
    }

    @computed get chainId() {
        if (this.pdbChain) {
            return this.pdbChain.chain;
        } else {
            return undefined;
        }
    }

    @computed get alphafoldPositionsOfInterest(): number[] {
        const positions: number[] = [];

        _.each(this.mutationsByPosition, (_mutations, positionKey) => {
            const position = parseInt(positionKey, 10);

            if (
                Number.isNaN(position) ||
                !this.props.mutationDataStore ||
                (!this.props.mutationDataStore.isPositionSelected(position) &&
                    !this.props.mutationDataStore.isPositionHighlighted(
                        position
                    ))
            ) {
                return;
            }

            positions.push(position);
        });

        return positions;
    }

    @computed get pdbChain() {
        let data = this.props.pdbChainDataStore.sortedFilteredSelectedData;

        if (data.length === 0) {
            // if no selected data, then try allData,
            // first element of allData is always the first element of initially sorted data
            data = this.props.pdbChainDataStore.allData;
        }

        if (data.length === 0) {
            return undefined;
        } else {
            return data[0];
        }
    }

    @computed get residueWarning(): string {
        let warning = '';

        if (this.structureSource === StructureSource.ALPHAFOLD) {
            const warnings: string[] = [];

            if (_.keys(this.mutationsByPosition).length === 0) {
                warnings.push('No mutations to display on this structure');
            }

            const lowConfidencePositions = getLowPlddtPositions(
                this.plddtByResidue,
                this.alphafoldPositionsOfInterest
            );

            if (lowConfidencePositions.length === 1) {
                warnings.push(
                    `Selected mutation at position ${lowConfidencePositions[0]} has pLDDT < ${ALPHAFOLD_PLDDT_LOW_THRESHOLD}`
                );
            } else if (lowConfidencePositions.length > 1) {
                warnings.push(
                    `Selected mutations at positions ${lowConfidencePositions.join(
                        ', '
                    )} have pLDDT < ${ALPHAFOLD_PLDDT_LOW_THRESHOLD}`
                );
            }

            return warnings.join(' ');
        }

        // None of the mutations (selected or not) can be mapped onto the current PDB chain.
        if (
            this.proteinPositions.length === 0 ||
            (this.residueMappingData &&
                this.residueMappingData.filter(
                    cacheData => cacheData === null || cacheData.data !== null
                ).length === 0)
        ) {
            warning = 'None of the mutations can be mapped onto this structure';
        } else {
            // find the difference between number of selected position and
            // the number of mapped positions among the selected ones.
            // if the difference is not zero, then it means there is at least one unmapped position
            // among the selected positions.
            const selectedPositionCount = _.keys(
                this.selectedMutationsByPosition
            ).length;
            const diff =
                selectedPositionCount - this.mappedSelectedPositions.length;

            // there is only one position selected, and it cannot be mapped
            if (selectedPositionCount === 1 && diff === 1) {
                warning =
                    'Selected mutation cannot be mapped onto this structure';
            }
            // more than one position selected, at least one of them cannot be mapped
            else if (diff > 0) {
                warning = `${diff} of the selections cannot be mapped onto this structure`;
            }
        }

        return warning;
    }

    @computed get residues(): IResidueSpec[] | undefined {
        if (!this.residueMappingData) {
            return undefined;
        }

        const residues: IResidueSpec[] = [];

        this.residueMappingData.forEach(cacheData => {
            if (cacheData && cacheData.data) {
                const mutations = this.mutationsByPosition[
                    cacheData.data.queryPosition
                ];

                const highlighted: boolean =
                    (this.props.mutationDataStore &&
                        (this.props.mutationDataStore.isPositionSelected(
                            cacheData.data.queryPosition
                        ) ||
                            this.props.mutationDataStore.isPositionHighlighted(
                                cacheData.data.queryPosition
                            ))) ||
                    false;

                if (mutations && mutations.length > 0) {
                    residues.push({
                        positionRange: {
                            start: {
                                position: cacheData.data.pdbPosition,
                            },
                            end: {
                                position: cacheData.data.pdbPosition,
                            },
                        },
                        color: this.getMutationResidueColor(mutations),
                        highlighted,
                    });
                }
            }
        });

        return _.uniq(residues);
    }

    @computed get residueMappingData():
        | Array<CacheData<ResidueMapping> | null>
        | undefined {
        if (this.alignmentIds.length === 0) {
            return undefined;
        }

        let residueMappingData: Array<CacheData<ResidueMapping> | null> = [];

        if (
            this.props.residueMappingCache &&
            this.props.uniprotId &&
            this.pdbId &&
            this.chainId &&
            this.proteinPositions.length > 0
        ) {
            // TODO remove this after implementing the cache!
            // create query parameters
            // this.proteinPositions.forEach((uniprotPosition: number) => {
            //     this.alignmentIds.forEach((alignmentId: number) => {
            //         if (this.props.pdbPositionMappingCache) {
            //             residueMappingData.push(this.props.pdbPositionMappingCache.get({
            //                 uniprotPosition,
            //                 alignmentId
            //             }));
            //         }
            //     });
            // });

            // TODO this query may slightly change wrt to the cache implementation
            const remoteData = this.props.residueMappingCache.get({
                uniprotId: this.props.uniprotId,
                pdbId: this.pdbId,
                chainId: this.chainId,
                uniprotPositions: this.proteinPositions,
            });

            if (remoteData.result) {
                residueMappingData = remoteData.result;
            }
        }

        return residueMappingData;
    }

    @computed get mappedSelectedPositions(): number[] {
        if (!this.residueMappingData) {
            return [];
        }

        const positions: number[] = [];

        this.residueMappingData.forEach(cacheData => {
            if (
                cacheData &&
                cacheData.data &&
                this.props.mutationDataStore &&
                this.props.mutationDataStore.isPositionSelected(
                    cacheData.data.queryPosition
                )
            ) {
                positions.push(cacheData.data.queryPosition);
            }
        });

        return _.uniq(positions);
    }

    @computed get alignmentIds(): number[] {
        let alignmentIds: number[] = [];

        if (this.pdbChain && this.props.pdbAlignmentIndex) {
            const alignments = this.props.pdbAlignmentIndex[
                this.pdbChain.pdbId
            ][this.pdbChain.chain];
            alignmentIds =
                alignments === undefined
                    ? []
                    : this.props.pdbAlignmentIndex[this.pdbChain.pdbId][
                          this.pdbChain.chain
                      ].map(alignment => alignment.alignmentId);
        }

        return _.uniq(alignmentIds);
    }

    @computed get mutationsByPosition(): { [pos: number]: Mutation[] } {
        if (this.props.mutationDataStore) {
            return groupMutationsByProteinStartPos(
                this.props.mutationDataStore.sortedFilteredData
            );
        } else {
            return {};
        }
    }

    @computed get selectedMutationsByPosition(): { [pos: number]: Mutation[] } {
        if (this.props.mutationDataStore) {
            return groupMutationsByProteinStartPos(
                this.props.mutationDataStore.sortedFilteredSelectedData
            );
        } else {
            return {};
        }
    }

    // Protein start positions for the mutations falling between the current
    // chain's start and end. This value is computed for the filtered mutations only.
    @computed get proteinPositions(): number[] {
        let positions: number[] = [];

        if (this.props.mutationDataStore && this.pdbChain) {
            positions = getProteinStartPositionsByRange(
                this.props.mutationDataStore.sortedFilteredData,
                this.pdbChain.uniprotStart,
                this.pdbChain.uniprotEnd
            );
        }

        return positions;
    }

    @computed get pyMolScript() {
        const scriptGenerator = new PyMolScriptGenerator();

        const visualizerProps = {
            displayBoundMolecules:
                this.structureSource === StructureSource.PDB &&
                this.displayBoundMolecules,
            proteinScheme: this.proteinScheme,
            proteinColor: this.proteinColor,
            sideChain: this.sideChain,
            mutationColor: this.mutationColor,
            alphafoldIsoform: this.alphafoldIsoform,
            alphafoldFilesBaseUrl: this.props.alphafoldFilesBaseUrl,
        };

        if (this.pyMolStructureId && this.viewerChainId) {
            return scriptGenerator.generateScript(
                this.pyMolStructureId,
                this.viewerChainId,
                this.viewerResidues || [],
                visualizerProps,
                this.structureSource
            );
        } else {
            return '';
        }
    }

    @computed get colorBySecondaryStructureDisabled() {
        return this.proteinScheme === ProteinScheme.SPACE_FILLING;
    }

    @computed get colorByNCRainbowDisabled() {
        return this.proteinScheme === ProteinScheme.SPACE_FILLING;
    }

    @computed get colorByAtomTypeDisabled() {
        return this.proteinScheme !== ProteinScheme.SPACE_FILLING;
    }

    @computed get paeHighlight(): PaeHeatmapHighlight {
        const empty: PaeHeatmapHighlight = { rows: [], cols: [] };

        if (this.structureSource !== StructureSource.ALPHAFOLD) {
            return empty;
        }

        const rows = new Set<number>();
        const cols = new Set<number>();

        if (this.props.mutationDataStore) {
            Object.keys(this.mutationsByPosition).forEach(positionKey => {
                const position = parseInt(positionKey, 10);

                if (
                    this.props.mutationDataStore!.isPositionSelected(
                        position
                    ) ||
                    this.props.mutationDataStore!.isPositionHighlighted(
                        position
                    )
                ) {
                    const structurePosition =
                        this.mapProteinToStructurePosition(position);

                    if (structurePosition != null) {
                        rows.add(structurePosition);
                        cols.add(structurePosition);
                    }
                }
            });
        }

        if (this.paeFocusCell) {
            rows.add(this.paeFocusCell.row);
            cols.add(this.paeFocusCell.col);

            return {
                rows: Array.from(rows).sort((a, b) => a - b),
                cols: Array.from(cols).sort((a, b) => a - b),
                focusCell: this.paeFocusCell,
            };
        }

        if (this.pinnedResidue?.resi) {
            rows.add(this.pinnedResidue.resi);
            cols.add(this.pinnedResidue.resi);
        }

        return {
            rows: Array.from(rows).sort((a, b) => a - b),
            cols: Array.from(cols).sort((a, b) => a - b),
        };
    }

    @computed get paeResiduePairHighlight(): IPaeResiduePairHighlight | null {
        if (
            this.structureSource !== StructureSource.ALPHAFOLD ||
            !this.displayPaeHeatmap ||
            !this.paeFocusCell
        ) {
            return null;
        }

        return {
            chain: this.viewerChainId || ALPHAFOLD_DEFAULT_CHAIN,
            alignedResi: this.paeFocusCell.row,
            partnerResi: this.paeFocusCell.col,
        };
    }

    @computed get paeCellSummary(): PaeCellSummary | null {
        if (!this.displayPaeHeatmap || !this.paeData || !this.paeFocusCell) {
            return null;
        }

        return getPaeCellSummary(
            this.paeData.matrix,
            this.paeFocusCell.row,
            this.paeFocusCell.col
        );
    }
}
