import * as _ from 'lodash';
import $ from 'jquery';
import {convertPdbPosToResAndInsCode} from "shared/lib/PdbUtils";
import {
    default as StructureVisualizer, ProteinScheme, MutationColor, SideChain,
    IStructureVisualizerProps, IResidueSpec
} from "./StructureVisualizer";

// 3Dmol expects "this" to be the global context
const $3Dmol = require('imports?this=>window!3dmol/build/3Dmol-nojquery.js');

// ideally these types should be defined in 3Dmol.js lib.
// manually adding complete style and selector models is quite complicated,
// so adding partial definition for now...

export type AtomSelectionSpec = any;

export type StyleSpec = {
    color?: string;
    colors?: string[];
    opacity?: number;
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

export interface IResidueSelector {
    resi: number;
    icode?:string;
}

export default class StructureVisualizer3D extends StructureVisualizer
{
    private _3dMolDiv: HTMLDivElement|undefined;
    private _3dMolViewer: any;
    private _3dMol: any;

    private _props: IStructureVisualizerProps;
    private _residues: IResidueSpec[] = [];
    private _chainId: string;

    public static get PROTEIN_SCHEME_PRESETS(): {[scheme:number]: AtomStyleSpec}
    {
        const presets:{[scheme:number]: any} = {};

        presets[ProteinScheme.CARTOON] = {cartoon: {}};
        presets[ProteinScheme.TRACE] = {cartoon: {style: "trace"}};
        presets[ProteinScheme.SPACE_FILLING] = {sphere: {scale: 0.6}};
        presets[ProteinScheme.BALL_AND_STICK] = {stick: {}, sphere: {scale: 0.25}};
        presets[ProteinScheme.RIBBON] = {cartoon: {style: "ribbon"}};

        return presets;
    }

    public static get ALL_PROTEINS(): string[] {
        const proteins = [
            "asp", "glu", "arg", "lys", "his", "asn", "thr", "cys", "gln", "tyr", "ser",
            "gly", "ala", "leu", "val", "ile", "met", "trp", "phe", "pro"
        ];

        const upperCaseProteins = proteins.map((protein: string) => protein.toUpperCase());

        return proteins.concat(upperCaseProteins);
    }

    constructor(div:HTMLDivElement, props?:IStructureVisualizerProps, _3dMol?:any)
    {
        super();

        this._3dMol = _3dMol || $3Dmol;
        this._3dMolDiv = div;
        this._props = {
            ...StructureVisualizer.defaultProps,
            ...props
        };

        this.updateViewer = this.updateViewer.bind(this);
    }

    public init(pdbId: string,
                chainId: string,
                residues: IResidueSpec[] = this._residues,
                viewer?: any)
    {
        if (viewer) {
            this._3dMolViewer = viewer;
        }
        else if (this._3dMolDiv) {
            this._3dMolViewer = this._3dMol.createViewer(
                $(this._3dMolDiv),
                {defaultcolors: this._3dMol.elementColors.rasmol}
            );
        }

        if (this._3dMolViewer)
        {
            const backgroundColor = this.formatColor(
                this._props.backgroundColor || StructureVisualizer.defaultProps.backgroundColor);
            this._3dMolViewer.setBackgroundColor(backgroundColor);
            this.loadPdb(pdbId, chainId, residues);
        }
    }

    public loadPdb(pdbId: string,
                   chainId: string,
                   residues: IResidueSpec[] = this._residues,
                   props:IStructureVisualizerProps = this._props)
    {
        const options = {
            doAssembly: true,
            pdbUri: props.pdbUri
            // multiMode: true,
            // frames: true
        };

        if (this._3dMolViewer) {
            // clear previous content
            this._3dMolViewer.clear();

            this._3dMol.download(`pdb:${pdbId.toUpperCase()}`, this._3dMolViewer, options, () => {
                this.updateViewer(chainId, residues, props);
            });
        }
    }

    public updateViewer(chainId:string,
                        residues: IResidueSpec[] = this._residues,
                        props:IStructureVisualizerProps = this._props)
    {
        this._props = props;
        this._chainId = chainId;
        this._residues = residues;

        this.updateVisualStyle(residues, chainId, props);

        this._3dMolViewer.render();
    }

    public updateResidues(residues: IResidueSpec[])
    {
        this._residues = residues;
        this.updateViewer(this._chainId, residues);
    }

    protected selectAll()
    {
        return {};
    }

    protected selectChain(chainId: string)
    {
        return {chain: chainId};
    }

    protected setScheme(scheme: ProteinScheme, selector?: AtomSelectionSpec)
    {
        const style = StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[scheme];
        this.applyStyleForSelector(selector, style);

        return style;
    }

    protected setColor(color: string, selector?: AtomSelectionSpec, style?: AtomStyleSpec)
    {
        const visColor = this.formatColor(color);

        if (style) {
            // update current style with color information
            _.each(style, (spec: StyleSpec) => {
                spec.color = visColor;
            });

            this.applyStyleForSelector(selector, style);
        }
    }

    protected formatColor(color: string)
    {
        // this is for 3Dmol.js compatibility
        // (colors should start with an "0x" instead of "#")
        return color.replace("#", "0x");
    }


    protected setTransparency(transparency: number, selector?: AtomSelectionSpec, style?: AtomStyleSpec)
    {
        if (style) {
            _.each(style, (spec: StyleSpec, key: string) => {
                // TODO sphere opacity is not supported by 3Dmol.js so excluding sphere style for now
                if (key !== "sphere") {
                    spec.opacity = (10 - transparency) / 10;
                }
            });

            this.applyStyleForSelector(selector, style);
        }
    }

    protected rainbowColor(selector?: AtomSelectionSpec, style?: AtomStyleSpec)
    {
        this.setColor("spectrum", selector, style);
    }

    protected cpkColor(selector?: AtomSelectionSpec, style?: AtomStyleSpec)
    {
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

    protected selectAlphaHelix(chainId: string)
    {
        return {chain: chainId, ss: "h"};
    }

    protected selectBetaSheet(chainId: string)
    {
        return {chain: chainId, ss: "s"};
    }

    protected hideBoundMolecules()
    {
        // since there is no built-in "restrict protein" command,
        // we need to select all non-protein structure...
        const selector = {
            resn: StructureVisualizer3D.ALL_PROTEINS,
            invert: true
        };

        const style = {sphere: {hidden: true}};

        this._3dMolViewer.setStyle(selector, style);
    }

    protected enableBallAndStick(color?: string, selector?: AtomSelectionSpec, style?: AtomStyleSpec)
    {
        // extend current style with ball and stick
        const bnsStyle = {...style, ...StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[ProteinScheme.BALL_AND_STICK]};

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

    protected updateResidueStyle(residues: IResidueSpec[],
                                 chainId: string,
                                 props: IStructureVisualizerProps = this._props,
                                 style?: AtomStyleSpec)
    {
        const defaultProps = StructureVisualizer.defaultProps;

        residues.forEach((residue:IResidueSpec) => {
            // TODO "rescode" selector does not work anymore for some reason (using selectResidue instead)
            //const resCodes = this.convertPositionsToResCode([residue.positionRange]);
            const residueSelectors = convertPdbPosToResAndInsCode(residue.positionRange);

            residueSelectors.forEach((residueSelector) => {
                let selector = this.selectResidue(residueSelector, chainId);
                let color: string|undefined;

                // use the highlight color if highlighted (always color highlighted residues)
                if (residue.highlighted) {
                    color = this._props.highlightColor || defaultProps.highlightColor;
                    this.setColor(color, selector, style);
                }
                // use the provided color
                else if (props.mutationColor === MutationColor.MUTATION_TYPE) {
                    color = residue.color;
                    this.setColor(color, selector, style);
                }
                // use a uniform color
                else if (props.mutationColor === MutationColor.UNIFORM) {
                    // color with a uniform mutation color
                    color = props.uniformMutationColor || defaultProps.uniformMutationColor;
                    this.setColor(color, selector, style);
                }
                // else: NONE (no need to color)

                const displaySideChain = props.sideChain === SideChain.ALL ||
                    (residue.highlighted === true && props.sideChain === SideChain.SELECTED);

                // show side chains
                if (displaySideChain) {
                    this.updateSideChain(chainId,
                        residueSelector,
                        props.proteinScheme,
                        color,
                        style);
                }
            });
        });
    }

    /**
     * Updates the visual style (scheme, coloring, selection, etc.)
     */
    public updateVisualStyle(residues: IResidueSpec[],
                             chainId: string,
                             props: IStructureVisualizerProps = this._props)
    {
        super.updateVisualStyle(residues, chainId, props);
    }

    protected selectResidues(residueCodes: string[], chainId: string)
    {
        return {
            rescode: residueCodes,
            chain: chainId
        };
    }

    protected selectResidue(residueSelector: IResidueSelector, chainId: string)
    {
        return {
            chain: chainId,
            ...residueSelector
        };
    }

    protected selectSideChains(residueSelector: IResidueSelector, chainId: string)
    {
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
    protected updateSideChain(chainId: string,
                              residueSelector: IResidueSelector,
                              proteinScheme: ProteinScheme,
                              color?: string,
                              style?: AtomStyleSpec)
    {
        // display side chain (no effect for space-filling)
        if (!(proteinScheme === ProteinScheme.SPACE_FILLING))
        {
            // select the corresponding side chain and also the CA atom on the backbone
            const selector = this.selectSideChains(residueSelector, chainId);

            // display the side chain with ball&stick style
            this.enableBallAndStick(color, selector, style);
        }
    };

    protected applyStyleForSelector(selector: AtomSelectionSpec, style: AtomStyleSpec)
    {
        this._3dMolViewer.setStyle(selector, style);
    }
}
