import _ from 'lodash';
import $ from 'jquery';
import {
    observable,
    computed,
    reaction,
    action,
    makeObservable,
    IReactionDisposer,
} from 'mobx';
import {
    default as StructureVisualizer,
    ProteinScheme,
    ProteinColor,
    MutationColor,
    SideChain,
    StructureSource,
    IStructureVisualizerProps,
    IResidueSpec,
    StructureLoadStatus,
    IMutationLabelSpec,
} from './StructureVisualizer';
import {
    fetchAlphaFoldModelText,
} from './AlphaFoldUtils';
import { getAlphaFoldPlddtColorscheme } from './AlphaFoldPlddtUtils';
import {
    verifyPdbStructureAvailable,
    viewerHasStructureAtoms,
} from './PdbStructureUtils';
import {
    IResidueHelper,
    IResidueSelector,
    generateResiduePosToSelectorMap,
    findUpdatedResidues,
} from './PdbResidueUtils';

import * as $3Dmol from '3dmol';

// ideally these types should be defined in 3Dmol.js lib.
// manually adding complete style and selector models is quite complicated,
// so adding partial definition for now...

export type AtomSelectionSpec = any;

export type StyleSpec = {
    color?: string;
    colors?: string[];
    opacity?: number;
    colorscheme?: any;
};
export type LineStyleSpec = StyleSpec;
export type CrossStyleSpec = StyleSpec;
export type StickStyleSpec = StyleSpec;
export type SphereStyleSpec = StyleSpec;
export type CartoonStyleSpec = StyleSpec;

export type AtomStyleSpec = {
    line?: LineStyleSpec;
    cross?: CrossStyleSpec;
    stick?: StickStyleSpec;
    sphere?: SphereStyleSpec;
    cartoon?: CartoonStyleSpec;
};

interface IStructureVisualizerState {
    structureSource: StructureSource;
    pdbId: string;
    chainId: string;
    residues: IResidueSpec[];
}

export default class StructureVisualizer3D extends StructureVisualizer {
    /** Props that should not trigger a full style rebuild. */
    private static readonly STYLE_SYNC_OMIT_PROPS = [
        'pdbId',
        'chainId',
        'residues',
        'pinnedResidue',
        'paeResiduePair',
        'onResidueClick',
        'onBackgroundClick',
        'onMutationLabelClick',
        'onStructureLoadStatusChange',
    ];

    private _3dMolDiv: HTMLDivElement | undefined;
    private _3dMolViewer: any;
    private _3dMol: any;

    @observable private props: IStructureVisualizerProps;
    @observable private _prevProps: IStructureVisualizerProps;

    @observable private state: IStructureVisualizerState;
    @observable private _prevState: IStructureVisualizerState;

    private _loadingPdb: boolean = false;
    private _loadRequestId: number = 0;
    private _mutationLabelSpecsByStructurePosition: Map<
        number,
        IMutationLabelSpec
    > = new Map();
    private _hoveredResi: number | null = null;
    private _hoveredChain: string | null = null;
    private _hoverPickReady = false;
    private _clickPickReady = false;
    private _registeredHoverChainId: string | null = null;
    private _registeredClickChainId: string | null = null;
    private _backgroundClickListenerAttached = false;
    private _boundBackgroundMouseUp: ((ev: MouseEvent) => void) | null = null;
    private _appliedPin: { chain: string; resi: number } | null = null;
    private _appliedPaePair: {
        chain: string;
        alignedResi: number;
        partnerResi: number;
    } | null = null;
    private _appliedHover: { chain: string; resi: number } | null = null;
    private _hoverSyncFrame: number | null = null;
    private _cachedOverlayStyle: {
        scheme: ProteinScheme;
        color: string;
        style: any;
    } | null = null;

    private get hoverOutlineColor(): string {
        const defaultProps = StructureVisualizer.defaultProps;
        return (
            this.props.hoverOutlineColor ||
            this.props.highlightColor ||
            defaultProps.highlightColor
        );
    }

    private get pinOutlineColor(): string {
        const defaultProps = StructureVisualizer.defaultProps;
        return (
            this.props.pinOutlineColor ||
            this.props.highlightColor ||
            defaultProps.highlightColor
        );
    }

    private notifyLoadStatus(
        status: StructureLoadStatus,
        message?: string,
        props: IStructureVisualizerProps = this.props
    ) {
        if (props.onStructureLoadStatusChange) {
            props.onStructureLoadStatusChange(status, message);
        }
    }

    public static get PROTEIN_SCHEME_PRESETS(): {
        [scheme: number]: AtomStyleSpec;
    } {
        const presets: { [scheme: number]: any } = {};

        presets[ProteinScheme.CARTOON] = { cartoon: {} };
        presets[ProteinScheme.TRACE] = { cartoon: { style: 'trace' } };
        presets[ProteinScheme.SPACE_FILLING] = { sphere: { scale: 0.6 } };
        presets[ProteinScheme.BALL_AND_STICK] = {
            stick: {},
            sphere: { scale: 0.25 },
        };
        presets[ProteinScheme.RIBBON] = { cartoon: { style: 'ribbon' } };

        return presets;
    }

    public static get ALL_PROTEINS(): string[] {
        const proteins = [
            'asp',
            'glu',
            'arg',
            'lys',
            'his',
            'asn',
            'thr',
            'cys',
            'gln',
            'tyr',
            'ser',
            'gly',
            'ala',
            'leu',
            'val',
            'ile',
            'met',
            'trp',
            'phe',
            'pro',
        ];

        const upperCaseProteins = proteins.map((protein: string) =>
            protein.toUpperCase()
        );

        return proteins.concat(upperCaseProteins);
    }

    constructor(
        div: HTMLDivElement,
        props?: IStructureVisualizerProps,
        _3dMol?: any
    ) {
        super();
        this._3dMol = _3dMol || $3Dmol;
        this._3dMolDiv = div;

        // init props
        this.props = {
            ...StructureVisualizer.defaultProps,
            ...props,
        };

        // init state
        this.state = {
            structureSource: StructureSource.PDB,
            pdbId: '',
            chainId: '',
            residues: [],
        };

        this._prevState = {
            structureSource: StructureSource.PDB,
            pdbId: '',
            chainId: '',
            residues: [],
        };

        this.updateViewer = this.updateViewer.bind(this);
        makeObservable(this);

        this.stateChangeReaction = reaction(
            () => this.state,
            (state: IStructureVisualizerState) => {
                this.onStateChange(state);
            }
        );
    }

    @action setState(newState: IStructureVisualizerState) {
        const merged = { ...this.state, ...newState };

        // updateViewer (style-only prop changes) calls this with the same
        // chainId/residues just to re-trigger the stateChangeReaction below —
        // it has to, since that reaction is what calls onStateChange with
        // fresh props. But loadStructure's own setState right before a
        // structure-source switch can also be immediately followed by such a
        // call with values that happen to already match. Only rotate
        // _prevState when something actually changed, so a same-value call
        // never overwrites the real previous state (which needToUpdateResiduesOnly
        // relies on to detect a genuine source/pdb/chain change) — the state
        // reference below is still replaced unconditionally so the
        // MobX reaction (and thus the pending style update) still fires.
        if (!_.isEqual(this.state, merged)) {
            this._prevState = { ...this.state };
        }

        this.state = merged;
    }

    // we need to update the view for each state change action
    private stateChangeReaction: IReactionDisposer;

    public dispose(): void {
        this.stateChangeReaction();
        this.cancelHoverSyncFrame();
        this.clearHoverPickRegistration();
        this.clearClickPickRegistration();
        this.removeBackgroundClickListener();
    }

    private onStateChange(state: IStructureVisualizerState) {
        // do not update or render if pdb is still loading,
        // pdb load callback will take care of the update once the load ends
        if (this._prevState && !this._loadingPdb) {
            this.updateVisualStyle(state.residues, state.chainId, this.props);
        }
    }

    @action
    protected setProps(newProps: IStructureVisualizerProps) {
        this._prevProps = this.props;
        this.props = newProps;
    }

    public init(
        structureId: string,
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        structureSource: StructureSource = StructureSource.PDB,
        viewer?: any
    ) {
        if (viewer) {
            this._3dMolViewer = viewer;
        } else if (this._3dMolDiv) {
            this._3dMolViewer = this._3dMol.createViewer($(this._3dMolDiv), {
                defaultcolors: this._3dMol.elementColors.rasmol,
            });
        }

        if (this._3dMolViewer) {
            const backgroundColor = this.formatColor(
                this.props.backgroundColor ||
                    StructureVisualizer.defaultProps.backgroundColor
            );
            this._3dMolViewer.setBackgroundColor(backgroundColor);
            this.loadStructure(
                structureSource,
                structureId,
                chainId,
                residues
            );
        }
    }

    public loadStructure(
        structureSource: StructureSource,
        structureId: string,
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        props: IStructureVisualizerProps = this.props
    ) {
        // Switching source (e.g. AlphaFold -> PDB) reaches loadStructure with
        // fresh props, but this.props (read later by onStateChange once the
        // async load resolves) is otherwise only refreshed in updateViewer's
        // no-reload path. Without this, updateVisualStyle can still see the
        // previous source/proteinColor and take the wrong style branch,
        // leaving the new model with 3Dmol's default line style instead of
        // the selected cartoon/trace/etc. scheme.
        this.setProps(props);

        if (structureSource === StructureSource.ALPHAFOLD) {
            this.loadAlphaFold(structureId, chainId, residues, props);
        } else {
            this.loadPdb(structureId, chainId, residues, props);
        }
    }

    public loadAlphaFold(
        uniprotId: string,
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        props: IStructureVisualizerProps = this.props
    ) {
        const filesBaseUrl =
            props.alphafoldFilesBaseUrl ||
            StructureVisualizer.defaultProps.alphafoldFilesBaseUrl;
        const isoform = props.alphafoldIsoform ?? 1;
        const requestId = ++this._loadRequestId;

        this._loadingPdb = true;
        this.notifyLoadStatus('loading', undefined, props);

        this.setState({
            structureSource: StructureSource.ALPHAFOLD,
            pdbId: uniprotId,
            chainId,
            residues,
        } as IStructureVisualizerState);

        if (!this._3dMolViewer) {
            this._loadingPdb = false;
            this.notifyLoadStatus(
                'error',
                '3D viewer failed to initialize',
                props
            );
            return;
        }

        if (!uniprotId) {
            this._loadingPdb = false;
            this.notifyLoadStatus(
                'error',
                'No UniProt accession available for AlphaFold',
                props
            );
            return;
        }

        this._3dMolViewer.clear();
        this.resetHoverState();

        fetchAlphaFoldModelText(uniprotId, {
            baseUrl: filesBaseUrl,
            format: 'cif',
            isoform,
        })
            .then(modelData => {
                if (!this._3dMolViewer || requestId !== this._loadRequestId) {
                    return;
                }

                this._3dMolViewer.addModel(modelData, 'cif');
                this._3dMolViewer.zoomTo();
                this._loadingPdb = false;
                this.notifyLoadStatus('ready', undefined, props);
                this.onStateChange(this.state);
            })
            .catch(error => {
                if (requestId !== this._loadRequestId) {
                    return;
                }

                console.error(error);
                this._loadingPdb = false;
                const message =
                    error instanceof Error
                        ? error.message
                        : 'AlphaFold model could not be loaded';
                this.notifyLoadStatus('error', message, props);
            });
    }

    public loadPdb(
        pdbId: string,
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        props: IStructureVisualizerProps = this.props
    ) {
        const options = {
            doAssembly: true,
            pdbUri: props.pdbUri,
            // multiMode: true,
            // frames: true
        };
        const requestId = ++this._loadRequestId;

        // update load state (mark as loading)
        this._loadingPdb = true;
        this.notifyLoadStatus('loading', undefined, props);

        // update state
        this.setState({
            structureSource: StructureSource.PDB,
            pdbId,
            chainId,
            residues,
        } as IStructureVisualizerState);

        if (!this._3dMolViewer) {
            this._loadingPdb = false;
            this.notifyLoadStatus(
                'error',
                '3D viewer failed to initialize',
                props
            );
            return;
        }

        if (!pdbId) {
            this._loadingPdb = false;
            this.notifyLoadStatus(
                'error',
                'No PDB structure selected',
                props
            );
            return;
        }

        // clear previous content
        this._3dMolViewer.clear();
        this.resetHoverState();

        verifyPdbStructureAvailable(pdbId, props.pdbUri)
            .then(() => {
                if (!this._3dMolViewer || requestId !== this._loadRequestId) {
                    return;
                }

                this._3dMol.download(
                    `pdb:${pdbId.toUpperCase()}`,
                    this._3dMolViewer,
                    options,
                    () => {
                        if (requestId !== this._loadRequestId) {
                            return;
                        }

                        this._loadingPdb = false;

                        if (!viewerHasStructureAtoms(this._3dMolViewer)) {
                            this.notifyLoadStatus(
                                'error',
                                `PDB structure ${pdbId.toUpperCase()} could not be loaded.`,
                                props
                            );
                            return;
                        }

                        this.notifyLoadStatus('ready', undefined, props);
                        // use the global state instead of the local variables,
                        // since the state might be updated before the pdb download ends
                        this.onStateChange(this.state);
                    }
                );
            })
            .catch(error => {
                if (requestId !== this._loadRequestId) {
                    return;
                }

                console.error(error);
                this._loadingPdb = false;
                const message =
                    error instanceof Error
                        ? error.message
                        : 'PDB structure could not be loaded';
                this.notifyLoadStatus('error', message, props);
            });
    }

    public updateViewer(
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        props: IStructureVisualizerProps = this.props
    ) {
        const prevProps = this.props;
        const pinChanged = !_.isEqual(
            prevProps.pinnedResidue,
            props.pinnedResidue
        );
        const paePairChanged = !_.isEqual(
            prevProps.paeResiduePair,
            props.paeResiduePair
        );

        this.setProps(props);

        // Click-to-pin / PAE pair: skip full style pass when only highlights changed.
        if (
            (pinChanged || paePairChanged) &&
            chainId === this.state.chainId &&
            this.incomingResiduePositionsMatch(residues) &&
            this.propsAffectingStylesEqual(prevProps, props)
        ) {
            let dirty = this.syncPinnedHighlight(false);
            dirty = this.syncPaePairHighlight(false) || dirty;

            if (dirty && this._3dMolViewer) {
                this._3dMolViewer.render();
            }
            return;
        }

        this.setState({
            chainId,
            residues,
        } as IStructureVisualizerState);
    }

    private propsAffectingStylesEqual(
        prevProps: IStructureVisualizerProps,
        nextProps: IStructureVisualizerProps
    ): boolean {
        return _.isEqual(
            _.omit(prevProps, StructureVisualizer3D.STYLE_SYNC_OMIT_PROPS),
            _.omit(nextProps, StructureVisualizer3D.STYLE_SYNC_OMIT_PROPS)
        );
    }

    private incomingResiduePositionsMatch(residues: IResidueSpec[]): boolean {
        return _.isEqual(
            _.keys(generateResiduePosToSelectorMap(residues)).sort(),
            _.keys(this.currentResidueToPositionMap).sort()
        );
    }

    public resize() {
        if (this._3dMolViewer) {
            this._3dMolViewer.resize();
        }
    }

    protected selectAll() {
        return {};
    }

    protected selectChain(chainId: string) {
        return { chain: chainId };
    }

    protected setScheme(scheme: ProteinScheme, selector?: AtomSelectionSpec) {
        const style = StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[scheme];
        this.applyStyleForSelector(selector, style);

        return style;
    }

    protected setColor(
        color: string,
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        const visColor = this.formatColor(color);

        if (style) {
            // update current style with color information
            _.each(style, (spec: StyleSpec) => {
                spec.color = visColor;
            });

            this.applyStyleForSelector(selector, style);
        }
    }

    protected formatColor(color: string) {
        // this is for 3Dmol.js compatibility
        // (colors should start with an "0x" instead of "#")
        return color.replace('#', '0x');
    }

    protected setTransparency(
        transparency: number,
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        if (style) {
            this.addTransparencyToStyle(transparency, style);
            this.applyStyleForSelector(selector, style);
        }
    }

    protected addTransparencyToStyle(transparency: number, style: any) {
        _.each(style, (spec: StyleSpec, key: string) => {
            // TODO sphere opacity is not supported by 3Dmol.js so excluding sphere style for now
            if (key !== 'sphere') {
                spec.opacity = (10 - transparency) / 10;
            }
        });
    }

    protected rainbowColor(
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        this.setColor('spectrum', selector, style);
    }

    protected cpkColor(selector?: AtomSelectionSpec, style?: AtomStyleSpec) {
        if (style) {
            _.each(style, (spec: StyleSpec) => {
                // remove previous single color (if any)
                delete spec.color;

                // add default color scheme
                spec.colors = this._3dMol.elementColors.defaultColors;
            });

            this.applyStyleForSelector(selector, style);
        }
    }

    protected selectAlphaHelix(chainId: string) {
        return { chain: chainId, ss: 'h' };
    }

    protected selectBetaSheet(chainId: string) {
        return { chain: chainId, ss: 's' };
    }

    protected applyPlddtColor(chainId: string, baseStyle: AtomStyleSpec) {
        const selector = this.selectChain(chainId);
        const style = _.cloneDeep(baseStyle);
        const colorscheme = getAlphaFoldPlddtColorscheme();

        _.each(style, (spec: StyleSpec) => {
            delete spec.color;
            delete spec.colors;
            spec.colorscheme = colorscheme;
        });

        this.applyStyleForSelector(selector, style);
    }

    protected hideBoundMolecules() {
        // since there is no built-in "restrict protein" command,
        // we need to select all non-protein structure...
        const selector = {
            resn: StructureVisualizer3D.ALL_PROTEINS,
            invert: true,
        };

        const style = { sphere: { hidden: true } };

        this._3dMolViewer.setStyle(selector, style);
    }

    protected enableBallAndStick(
        color?: string,
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        // extend current style with ball and stick
        const bnsStyle = {
            ...style,
            ...StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[
                ProteinScheme.BALL_AND_STICK
            ],
        };

        // use the color if provided
        if (color) {
            const visColor = this.formatColor(color);

            if (!bnsStyle.sphere) {
                bnsStyle.sphere = {};
            }

            bnsStyle.sphere.color = visColor;

            if (!bnsStyle.stick) {
                bnsStyle.stick = {};
            }

            bnsStyle.stick.color = visColor;
        }

        // update style of the selection
        this._3dMolViewer.setStyle(selector, bnsStyle);
    }

    protected updateResidueStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps = this.props,
        style?: AtomStyleSpec
    ) {
        const defaultProps = StructureVisualizer.defaultProps;

        if (!style) {
            style =
                StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[
                    props.proteinScheme
                ];
            // need to add transparency to the style, otherwise we got weird visualization
            this.addTransparencyToStyle(
                props.chainTranslucency || defaultProps.chainTranslucency,
                style
            );
        }

        const residueHelpers: IResidueHelper[] = this.residuesToUpdate;

        // Group residues by (color, displaySideChain) so each distinct
        // combination becomes ONE 3Dmol setStyle/addStyle call covering many
        // residues, instead of one call per residue. 3Dmol.js's setStyle
        // does a full linear scan over every atom in the model on every
        // call regardless of how narrow the selector is, so calling it once
        // per mutated residue is O(residues x atoms) - for proteins with
        // thousands of distinct mutated positions this dominated UI lag on
        // every protein-style/mutation-style change.
        interface IResidueStyleGroup {
            color: string;
            displaySideChain: boolean;
            resis: number[];
            // Residues with an insertion code can't share a combined `resi`
            // array selector (icode applies to the whole selector), so they
            // fall back to one selector each - these are rare in practice.
            icodeSelectors: IResidueSelector[];
        }

        const groups = new Map<string, IResidueStyleGroup>();

        residueHelpers.forEach((residueHelper: IResidueHelper) => {
            const residue = residueHelper.residue;
            let color: string;

            // use the highlight color if highlighted (always color highlighted residues)
            if (residue.highlighted) {
                color =
                    this.props.highlightColor || defaultProps.highlightColor;
            }
            // use the provided color
            else if (
                props.mutationColor === MutationColor.MUTATION_TYPE ||
                props.mutationColor === MutationColor.DENSITY
            ) {
                color = residue.color;
            }
            // use a uniform color
            else if (props.mutationColor === MutationColor.UNIFORM) {
                // color with a uniform mutation color
                color =
                    props.uniformMutationColor ||
                    defaultProps.uniformMutationColor;
            }
            // NONE: color with chain color
            else {
                color = props.chainColor || defaultProps.chainColor;
            }

            const displaySideChain =
                props.sideChain === SideChain.ALL ||
                (residue.highlighted === true &&
                    props.sideChain === SideChain.SELECTED);

            const groupKey = `${color}|${displaySideChain}`;
            let group = groups.get(groupKey);

            if (!group) {
                group = { color, displaySideChain, resis: [], icodeSelectors: [] };
                groups.set(groupKey, group);
            }

            if (residueHelper.selector.icode) {
                group.icodeSelectors.push(residueHelper.selector);
            } else {
                group.resis.push(residueHelper.selector.resi);
            }
        });

        groups.forEach(group => {
            const selectors: AtomSelectionSpec[] = group.icodeSelectors.map(
                icodeSelector => this.selectResidue(icodeSelector, chainId)
            );

            if (group.resis.length > 0) {
                selectors.push({ chain: chainId, resi: group.resis });
            }

            selectors.forEach(selector => {
                this.setColor(group.color, selector, style);

                // show side chains
                if (
                    group.displaySideChain &&
                    props.proteinScheme !== ProteinScheme.SPACE_FILLING
                ) {
                    this.enableBallAndStick(group.color, selector, style);
                }
            });
        });
    }

    protected updateScheme(props: IStructureVisualizerProps) {
        if (!this.needToUpdateResiduesOnly) {
            return super.updateScheme(props);
        } else {
            return undefined;
        }
    }

    protected updateBaseVisualStyle(
        style: any,
        props: IStructureVisualizerProps
    ) {
        if (!this.needToUpdateResiduesOnly) {
            super.updateBaseVisualStyle(style, props);
        }
    }

    protected updateChainVisualStyle(
        chainId: string,
        style: any,
        props: IStructureVisualizerProps
    ) {
        if (!this.needToUpdateResiduesOnly) {
            super.updateChainVisualStyle(chainId, style, props);
        }
    }

    @computed get residuesToUpdate(): IResidueHelper[] {
        if (this.needToUpdateResiduesOnly) {
            return findUpdatedResidues(
                this.currentResidueToPositionMap,
                this.prevResidueToPositionMap
            );
        } else {
            // update all the residues
            return _.flatten(_.values(this.currentResidueToPositionMap));
        }
    }

    /**
     * We need to update only residues if:
     *    - Pdb id not updated
     *    - Chain id not updated
     *    - Visual properties not updated
     *    - Number of residues and residue positions remain the same
     */
    @computed get needToUpdateResiduesOnly(): boolean {
        return (
            this._prevState.structureSource === this.state.structureSource &&
            this._prevState.pdbId === this.state.pdbId &&
            this._prevState.chainId === this.state.chainId &&
            this.visualPropsUnchanged &&
            this.residuePositionsUnchanged
        );
    }

    @computed get residuePositionsUnchanged(): boolean {
        return _.isEqual(
            _.keys(this.currentResidueToPositionMap).sort(),
            _.keys(this.prevResidueToPositionMap).sort()
        );
    }

    @computed get currentResidueToPositionMap(): {
        [residue: number]: IResidueHelper[];
    } {
        return generateResiduePosToSelectorMap(this.state.residues);
    }

    @computed get prevResidueToPositionMap(): {
        [residue: number]: IResidueHelper[];
    } {
        return generateResiduePosToSelectorMap(this._prevState.residues);
    }

    @computed get visualPropsUnchanged(): boolean {
        return this.propsAffectingStylesEqual(this._prevProps, this.props);
    }

    /**
     * Updates the visual style (scheme, coloring, selection, etc.)
     */
    @action
    public updateVisualStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps = this.props
    ) {
        if (
            props.structureSource === StructureSource.ALPHAFOLD &&
            props.proteinColor === ProteinColor.PLDDT
        ) {
            if (!this.needToUpdateResiduesOnly) {
                const style = this.updateScheme(props);
                const selector = this.selectAll();
                this.setTransparency(0, selector, style);
                this.applyPlddtColor(chainId, style);
            }

            if (this._3dMolViewer) {
                this._3dMolViewer.render();
            }

            this.updateMutationLabels(chainId, props);
            this.ensureClickPickTargets();
            this.applyHoverInteractionState(!this.needToUpdateResiduesOnly);
            return;
        }

        super.updateVisualStyle(residues, chainId, props);
        this.updateMutationLabels(chainId, props);
        this.ensureClickPickTargets();
        this.applyHoverInteractionState(!this.needToUpdateResiduesOnly);
    }

    private applyHoverInteractionState(forceReapply = false): void {
        this.ensureHoverPickTargets();
        this.syncResidueHighlights(forceReapply);
    }

    /** Selected chain only — semi-transparent (non-selected) chains are not pickable. */
    private getChainPickSelector(): { chain?: string } {
        const chainId = this.state.chainId;
        return chainId && chainId.length > 0 ? { chain: chainId } : {};
    }

    private clearClickPickRegistration(): void {
        if (
            !this._3dMolViewer ||
            typeof this._3dMolViewer.setClickable !== 'function'
        ) {
            return;
        }

        if (this._registeredClickChainId) {
            this._3dMolViewer.setClickable(
                { chain: this._registeredClickChainId },
                false
            );
        }
        // Clear legacy all-atom registration from earlier builds.
        this._3dMolViewer.setClickable({}, false);
    }

    private clearHoverPickRegistration(): void {
        if (
            !this._3dMolViewer ||
            typeof this._3dMolViewer.setHoverable !== 'function'
        ) {
            return;
        }

        if (this._registeredHoverChainId) {
            this._3dMolViewer.setHoverable(
                { chain: this._registeredHoverChainId },
                false
            );
        }
        this._3dMolViewer.setHoverable({}, false);
    }

    private ensureClickPickTargets(): void {
        if (
            !this._3dMolViewer ||
            typeof this._3dMolViewer.setClickable !== 'function'
        ) {
            return;
        }

        const chainId = this.state.chainId || '';
        if (this._clickPickReady && this._registeredClickChainId === chainId) {
            this.ensureBackgroundClickListener();
            return;
        }

        this.clearClickPickRegistration();

        const clickSel = this.getChainPickSelector();
        this._3dMolViewer.setClickable(clickSel, true, (atom: {
            chain?: string;
            resi?: number;
        }) => this.handleResidueClick(atom));
        this._registeredClickChainId = chainId || null;
        this._clickPickReady = true;
        this.ensureBackgroundClickListener();
    }

    /**
     * 3Dmol only fires atom clicks; empty canvas clicks need a separate listener.
     */
    private ensureBackgroundClickListener(): void {
        if (
            this._backgroundClickListenerAttached ||
            !this._3dMolViewer ||
            typeof document === 'undefined'
        ) {
            return;
        }

        this._boundBackgroundMouseUp = (ev: MouseEvent) => {
            this.handleViewerBackgroundMouseUp(ev);
        };
        document.body.addEventListener('mouseup', this._boundBackgroundMouseUp);
        this._backgroundClickListenerAttached = true;
    }

    private handleViewerBackgroundMouseUp(ev: MouseEvent): void {
        const viewer = this._3dMolViewer;
        const onBackgroundClick = this.props.onBackgroundClick;

        if (!viewer || !onBackgroundClick || typeof viewer.getX !== 'function') {
            return;
        }

        const pageX = viewer.getX(ev);
        const pageY = viewer.getY(ev);

        if (
            pageX === undefined ||
            pageY === undefined ||
            typeof viewer.isInViewer !== 'function' ||
            !viewer.isInViewer(pageX, pageY) ||
            typeof viewer.closeEnoughForClick !== 'function' ||
            !viewer.closeEnoughForClick(ev) ||
            typeof viewer.mouseXY !== 'function' ||
            typeof viewer.targetedObjects !== 'function'
        ) {
            return;
        }

        const mouse = viewer.mouseXY(pageX, pageY);
        const clickables = viewer.clickables || [];
        const intersects = viewer.targetedObjects(
            mouse.x,
            mouse.y,
            clickables
        );

        if (!intersects || intersects.length === 0) {
            onBackgroundClick();
        }
    }

    private removeBackgroundClickListener(): void {
        if (
            this._backgroundClickListenerAttached &&
            this._boundBackgroundMouseUp &&
            typeof document !== 'undefined'
        ) {
            document.body.removeEventListener(
                'mouseup',
                this._boundBackgroundMouseUp
            );
        }
        this._backgroundClickListenerAttached = false;
        this._boundBackgroundMouseUp = null;
    }

    private cancelHoverSyncFrame(): void {
        if (this._hoverSyncFrame != null) {
            cancelAnimationFrame(this._hoverSyncFrame);
            this._hoverSyncFrame = null;
        }
    }

    private resetHoverState(): void {
        this.cancelHoverSyncFrame();
        this._hoveredResi = null;
        this._hoveredChain = null;
        this._hoverPickReady = false;
        this._clickPickReady = false;
        this._registeredHoverChainId = null;
        this._registeredClickChainId = null;
        this.removeBackgroundClickListener();
        this._appliedPin = null;
        this._appliedPaePair = null;
        this._appliedHover = null;
        this._cachedOverlayStyle = null;
    }

    private residuePinsEqual(
        a: { chain: string; resi: number } | null | undefined,
        b: { chain: string; resi: number } | null | undefined
    ): boolean {
        if (!a || !b) {
            return false;
        }
        return (
            a.resi === b.resi &&
            a.chain.toUpperCase() === b.chain.toUpperCase()
        );
    }

    /**
     * One-time hover pick registration. Highlight overlays the same cartoon/ribbon/trace geometry.
     */
    private ensureHoverPickTargets(): void {
        if (
            !this._3dMolViewer ||
            typeof this._3dMolViewer.setHoverable !== 'function'
        ) {
            return;
        }

        this.ensureClickPickTargets();

        const chainId = this.state.chainId || '';
        if (this._hoverPickReady && this._registeredHoverChainId === chainId) {
            return;
        }

        this.clearHoverPickRegistration();

        if (typeof this._3dMolViewer.setHoverDuration === 'function') {
            this._3dMolViewer.setHoverDuration(16);
        }

        const hoverSel = this.getChainPickSelector();

        this._3dMolViewer.setHoverable(
            hoverSel,
            true,
            (atom: { chain?: string; resi?: number; x?: number; y?: number; z?: number }) =>
                this.handleResidueHover(atom),
            (atom: { chain?: string; resi?: number }) =>
                this.handleResidueUnhover(atom)
        );

        this._registeredHoverChainId = chainId || null;
        this._hoverPickReady = true;
    }

    /** Pinned + hover: ball-and-stick on residue (cartoon outline fallback). */
    private syncResidueHighlights(forceReapply = false): void {
        if (!this._3dMolViewer) {
            return;
        }

        let dirty = this.syncPinnedHighlight(forceReapply);
        dirty = this.syncPaePairHighlight(forceReapply) || dirty;

        if (forceReapply) {
            this._appliedHover = null;
        }

        dirty = this.syncHoverHighlight() || dirty;

        if (dirty) {
            this._3dMolViewer.render();
        }
    }

    private syncPinnedHighlight(forceReapply = false): boolean {
        if (!this._3dMolViewer) {
            return false;
        }

        if (forceReapply) {
            this._appliedPin = null;
        }

        const pinned = this.props.pinnedResidue || null;

        if (this.residuePinsEqual(pinned, this._appliedPin)) {
            return false;
        }

        if (this._appliedPin) {
            this.restoreInteractionOverlay(
                this._appliedPin.chain,
                this._appliedPin.resi
            );
        }

        if (pinned) {
            this.applyResidueInteractionHighlight(
                pinned.chain,
                pinned.resi,
                this.pinOutlineColor
            );
        }

        this._appliedPin = pinned ? { ...pinned } : null;
        return true;
    }

    private paePairsEqual(
        a:
            | {
                  chain: string;
                  alignedResi: number;
                  partnerResi: number;
              }
            | null
            | undefined,
        b:
            | {
                  chain: string;
                  alignedResi: number;
                  partnerResi: number;
              }
            | null
            | undefined
    ): boolean {
        if (!a && !b) {
            return true;
        }

        if (!a || !b) {
            return false;
        }

        return (
            a.chain.toUpperCase() === b.chain.toUpperCase() &&
            a.alignedResi === b.alignedResi &&
            a.partnerResi === b.partnerResi
        );
    }

    private restorePaePairHighlight(pair: {
        chain: string;
        alignedResi: number;
        partnerResi: number;
    }): void {
        this.restoreInteractionOverlay(pair.chain, pair.alignedResi);

        if (pair.alignedResi !== pair.partnerResi) {
            this.restoreInteractionOverlay(pair.chain, pair.partnerResi);
        }
    }

    private applyPaePairHighlight(pair: {
        chain: string;
        alignedResi: number;
        partnerResi: number;
    }): void {
        this.applyResidueInteractionHighlight(
            pair.chain,
            pair.alignedResi,
            this.pinOutlineColor
        );

        if (pair.alignedResi !== pair.partnerResi) {
            this.applyResidueInteractionHighlight(
                pair.chain,
                pair.partnerResi,
                this.pinOutlineColor
            );
        }
    }

    private syncPaePairHighlight(forceReapply = false): boolean {
        if (!this._3dMolViewer) {
            return false;
        }

        if (forceReapply) {
            this._appliedPaePair = null;
        }

        const pair = this.props.paeResiduePair || null;

        if (this.paePairsEqual(pair, this._appliedPaePair)) {
            return false;
        }

        if (this._appliedPaePair) {
            this.restorePaePairHighlight(this._appliedPaePair);
        }

        if (pair) {
            this.applyPaePairHighlight(pair);
        }

        this._appliedPaePair = pair ? { ...pair } : null;
        return true;
    }

    private syncHoverHighlight(): boolean {
        if (!this._3dMolViewer) {
            return false;
        }

        const pinned = this.props.pinnedResidue || null;
        const hover =
            this._hoveredResi != null && this._hoveredChain
                ? { chain: this._hoveredChain, resi: this._hoveredResi }
                : null;

        if (this.residuePinsEqual(hover, this._appliedHover)) {
            return false;
        }

        let dirty = false;

        if (
            this._appliedHover &&
            !this.residuePinsEqual(this._appliedHover, pinned)
        ) {
            this.restoreInteractionOverlay(
                this._appliedHover.chain,
                this._appliedHover.resi
            );
            dirty = true;
        }

        if (hover && !this.residuePinsEqual(hover, pinned)) {
            if (!this.residueInPaePair(hover.chain, hover.resi)) {
                this.applyResidueInteractionHighlight(
                    hover.chain,
                    hover.resi,
                    this.hoverOutlineColor
                );
            }
            dirty = true;
        }

        this._appliedHover = hover ? { ...hover } : null;
        return dirty;
    }

    private scheduleHoverHighlightUpdate(): void {
        if (this._hoverSyncFrame != null) {
            return;
        }

        this._hoverSyncFrame = requestAnimationFrame(() => {
            this._hoverSyncFrame = null;
            if (this.syncHoverHighlight() && this._3dMolViewer) {
                this._3dMolViewer.render();
            }
        });
    }

    private handleResidueClick(atom: { chain?: string; resi?: number }) {
        if (!atom || atom.resi == null || !atom.chain) {
            return;
        }

        const chainId = this.state.chainId;
        if (
            chainId &&
            atom.chain.toUpperCase() !== chainId.toUpperCase()
        ) {
            return;
        }

        if (this.props.onResidueClick) {
            this.props.onResidueClick(atom.chain, atom.resi);
        } else if (this.props.onMutationLabelClick) {
            const label = this._mutationLabelSpecsByStructurePosition.get(
                atom.resi
            );
            if (label) {
                this.props.onMutationLabelClick(label);
            }
        }
    }

    private getCartoonOverlayStyle(scheme: ProteinScheme, colorHex: string): any {
        const color = this.formatColor(colorHex);

        if (
            this._cachedOverlayStyle &&
            this._cachedOverlayStyle.scheme === scheme &&
            this._cachedOverlayStyle.color === color
        ) {
            return this._cachedOverlayStyle.style;
        }

        const preset: any =
            StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[scheme] || {};
        let style: any;

        if (scheme === ProteinScheme.SPACE_FILLING) {
            style = {
                sphere: {
                    color,
                    scale: (preset.sphere?.scale ?? 0.6) * 1.06,
                    opacity: 1,
                },
            };
        } else if (scheme === ProteinScheme.BALL_AND_STICK) {
            style = {
                stick: { color, radius: 0.32, opacity: 1 },
                sphere: { color, scale: 0.32, opacity: 1 },
            };
        } else {
            const cartoonStyle: any = { ...(preset.cartoon || {}) };
            const traceLike =
                cartoonStyle.style === 'trace' ||
                cartoonStyle.style === 'ribbon';

            style = {
                cartoon: {
                    ...cartoonStyle,
                    color,
                    opacity: 1,
                    ...(traceLike ? {} : { thickness: 2.4 }),
                },
            };
        }

        this._cachedOverlayStyle = { scheme, color, style };
        return style;
    }

    private shouldShowInteractionSideChain(
        props: IStructureVisualizerProps = this.props
    ): boolean {
        return props.proteinScheme !== ProteinScheme.SPACE_FILLING;
    }

    private schemeUsesCartoonBackbone(scheme: ProteinScheme): boolean {
        return (
            scheme === ProteinScheme.CARTOON ||
            scheme === ProteinScheme.TRACE ||
            scheme === ProteinScheme.RIBBON
        );
    }

    /** Hover/pin: ball-and-stick on side chains plus matching cartoon/trace backbone. */
    private applyResidueInteractionHighlight(
        chain: string,
        resi: number,
        colorHex: string
    ): void {
        if (!this._3dMolViewer) {
            return;
        }

        if (this.shouldShowInteractionSideChain()) {
            this.applyInteractionSideChain(chain, resi, colorHex);

            if (this.schemeUsesCartoonBackbone(this.props.proteinScheme)) {
                this.applyCartoonResidueOutline(chain, resi, colorHex);
            }
            return;
        }

        this.applyCartoonResidueOutline(chain, resi, colorHex);
    }

    /** Layer ball-and-stick on one residue without replacing its base cartoon/pLDDT style. */
    private applyInteractionSideChain(
        chain: string,
        resi: number,
        colorHex: string
    ): void {
        if (!this._3dMolViewer || !this.shouldShowInteractionSideChain()) {
            return;
        }

        const visColor = this.formatColor(colorHex);

        this._3dMolViewer.addStyle(
            { chain, resi },
            {
                stick: { color: visColor, radius: 0.16 },
                sphere: { color: visColor, scale: 0.3 },
            },
            true
        );
    }

    /** Cartoon overlay on one residue — follows 3Dmol cartoon/ribbon/trace path. */
    private applyCartoonResidueOutline(
        chain: string,
        resi: number,
        colorHex: string
    ): void {
        if (!this._3dMolViewer) {
            return;
        }

        this._3dMolViewer.addStyle(
            { chain, resi },
            this.getCartoonOverlayStyle(this.props.proteinScheme, colorHex),
            true
        );
    }

    private residueInPaePair(chain: string, resi: number): boolean {
        const pair = this.props.paeResiduePair;

        if (!pair) {
            return false;
        }

        return (
            pair.chain.toUpperCase() === chain.toUpperCase() &&
            (pair.alignedResi === resi || pair.partnerResi === resi)
        );
    }

    /** Re-apply pin or PAE pair highlight after a transient hover overlay is removed. */
    private reapplyPersistentResidueHighlight(
        chain: string,
        resi: number
    ): void {
        const pinned = this.props.pinnedResidue || null;

        if (pinned && this.residuePinsEqual({ chain, resi }, pinned)) {
            this.applyResidueInteractionHighlight(
                chain,
                resi,
                this.pinOutlineColor
            );
            return;
        }

        if (this.residueInPaePair(chain, resi)) {
            this.applyResidueInteractionHighlight(
                chain,
                resi,
                this.pinOutlineColor
            );
        }
    }

    private restoreInteractionOverlay(chain: string, resi: number): void {
        this.restoreHoveredResidueStyle(chain, resi);
        this.reapplyPersistentResidueHighlight(chain, resi);
    }

    private isSelectedStructureChain(chain: string): boolean {
        const selected = this.state.chainId;
        if (!selected || !chain) {
            return false;
        }
        return chain.toUpperCase() === selected.toUpperCase();
    }

    private restoreHoveredResidueStyle(chain: string, resi: number): void {
        if (!this._3dMolViewer) {
            return;
        }

        const props = this.props;
        const defaultProps = StructureVisualizer.defaultProps;
        const selector = { chain, resi };
        const onSelectedChain = this.isSelectedStructureChain(chain);
        const translucency = onSelectedChain
            ? props.chainTranslucency ?? defaultProps.chainTranslucency
            : props.baseTranslucency ?? defaultProps.baseTranslucency;

        if (
            props.structureSource === StructureSource.ALPHAFOLD &&
            props.proteinColor === ProteinColor.PLDDT
        ) {
            const style = _.cloneDeep(
                StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[
                    props.proteinScheme
                ]
            );
            const colorscheme = getAlphaFoldPlddtColorscheme();
            _.each(style, (spec: StyleSpec) => {
                delete spec.color;
                delete spec.colors;
                spec.colorscheme = colorscheme;
            });
            this._3dMolViewer.setStyle(selector, style);
            return;
        }

        const style = _.cloneDeep(
            StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[props.proteinScheme]
        );
        this.addTransparencyToStyle(translucency, style);

        const helpers = this.currentResidueToPositionMap[resi] || [];

        if (helpers.length === 0) {
            const color = onSelectedChain
                ? props.chainColor || defaultProps.chainColor
                : props.baseColor || defaultProps.baseColor;
            this.applyStyleForSelector(selector, style);
            this.setColor(color, selector, style);
            return;
        }

        helpers.forEach((residueHelper: IResidueHelper) => {
            const residue = residueHelper.residue;
            const helperSelector = this.selectResidue(
                residueHelper.selector,
                chain
            );
            let color: string | undefined;

            if (residue.highlighted) {
                color =
                    props.highlightColor || defaultProps.highlightColor;
            } else if (
                props.mutationColor === MutationColor.MUTATION_TYPE ||
                props.mutationColor === MutationColor.DENSITY
            ) {
                color = residue.color;
            } else if (props.mutationColor === MutationColor.UNIFORM) {
                color =
                    props.uniformMutationColor ||
                    defaultProps.uniformMutationColor;
            } else {
                color = props.chainColor || defaultProps.chainColor;
            }

            this.applyStyleForSelector(helperSelector, _.cloneDeep(style));
            this.setColor(color, helperSelector, style);

            const displaySideChain =
                props.sideChain === SideChain.ALL ||
                (residue.highlighted === true &&
                    props.sideChain === SideChain.SELECTED);

            if (displaySideChain) {
                this.updateSideChain(
                    chain,
                    residueHelper.selector,
                    props.proteinScheme,
                    color,
                    style
                );
            }
        });
    }

    private handleResidueHover(atom: {
        chain?: string;
        resi?: number;
        x?: number;
        y?: number;
        z?: number;
    }) {
        if (!this._3dMolViewer || !atom || atom.resi == null || !atom.chain) {
            return;
        }

        const resi = atom.resi;
        const chain = atom.chain;

        if (this._hoveredResi === resi && this._hoveredChain === chain) {
            return;
        }

        this._hoveredResi = resi;
        this._hoveredChain = chain;
        this.scheduleHoverHighlightUpdate();
    }

    private handleResidueUnhover(atom: { chain?: string; resi?: number }) {
        if (
            !this._3dMolViewer ||
            this._hoveredResi == null ||
            !this._hoveredChain
        ) {
            return;
        }

        if (
            atom &&
            atom.resi != null &&
            (atom.resi !== this._hoveredResi ||
                (atom.chain &&
                    atom.chain.toUpperCase() !==
                        this._hoveredChain.toUpperCase()))
        ) {
            return;
        }

        this._hoveredResi = null;
        this._hoveredChain = null;
        this.scheduleHoverHighlightUpdate();
    }

    /** Registers mapped mutation label positions (clicks handled globally). */
    protected updateMutationLabels(
        chainId: string,
        props: IStructureVisualizerProps = this.props
    ) {
        if (!this._3dMolViewer) {
            return;
        }

        this._mutationLabelSpecsByStructurePosition.clear();

        const labels = props.mutationLabels || [];

        labels.forEach((label: IMutationLabelSpec) => {
            this._mutationLabelSpecsByStructurePosition.set(
                label.structurePosition,
                label
            );
        });
    }

    protected selectResidues(residueCodes: string[], chainId: string) {
        return {
            rescode: residueCodes,
            chain: chainId,
        };
    }

    protected selectResidue(
        residueSelector: IResidueSelector,
        chainId: string
    ) {
        return {
            chain: chainId,
            ...residueSelector,
        };
    }

    protected selectSideChains(
        residueSelector: IResidueSelector,
        chainId: string
    ) {
        // we are not able to select side chain atoms...
        // return {
        //     ...,
        //     atom: ["CA"]
        // };

        // so we are selecting all the atoms at given positions
        return this.selectResidue(residueSelector, chainId);
    }

    /**
     * Show/hide the side chain for the given residues.
     * Residue codes can be in the form of "666" or "666:C", both are fine.
     */
    protected updateSideChain(
        chainId: string,
        residueSelector: IResidueSelector,
        proteinScheme: ProteinScheme,
        color?: string,
        style?: AtomStyleSpec
    ) {
        // display side chain (no effect for space-filling)
        if (!(proteinScheme === ProteinScheme.SPACE_FILLING)) {
            // select the corresponding side chain and also the CA atom on the backbone
            const selector = this.selectSideChains(residueSelector, chainId);

            // display the side chain with ball&stick style
            this.enableBallAndStick(color, selector, style);
        }
    }

    protected applyStyleForSelector(
        selector: AtomSelectionSpec,
        style: AtomStyleSpec
    ) {
        this._3dMolViewer.setStyle(selector, style);
    }
}
