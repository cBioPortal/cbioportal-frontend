import * as React from 'react';
import {FormControl, Checkbox, Button, ButtonGroup} from 'react-bootstrap';
import {If, Else, Then} from 'react-if';
import {ThreeBounce} from 'better-react-spinkit';
import {observable, computed} from "mobx";
import {observer} from "mobx-react";
import Draggable from 'react-draggable';
import classnames from 'classnames';
import DefaultTooltip from "shared/components/DefaultTooltip";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {IMobXApplicationDataStore} from "shared/lib/IMobXApplicationDataStore";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {generatePdbInfoSummary} from "shared/lib/PdbUtils";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import StructureViewer from "./StructureViewer";
import {ProteinScheme, ProteinColor, SideChain, MutationColor, IResidueSpec} from "./StructureVisualizerWrapper";

import styles from "./structureViewer.module.scss";

export interface IStructureViewerPanelProps {
    pdbId: string;
    chainId: string;
    residues?: IResidueSpec[];
    dataStore?: IMobXApplicationDataStore<Mutation[]>;
    pdbHeaderCache?: PdbHeaderCache;
    onClose?: () => void;
}

@observer
export default class StructureViewerPanel extends React.Component<IStructureViewerPanelProps, {}> {

    @observable protected isCollapsed:boolean = false;
    @observable protected proteinScheme:ProteinScheme = ProteinScheme.CARTOON;
    @observable protected proteinColor:ProteinColor = ProteinColor.UNIFORM;
    @observable protected sideChain:SideChain = SideChain.SELECTED;
    @observable protected mutationColor:MutationColor = MutationColor.MUTATION_TYPE;
    @observable protected displayBoundMolecules:boolean = true;
    @observable protected residueWarning: string = "";

    constructor() {
        super();

        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.handleProteinSchemeChange = this.handleProteinSchemeChange.bind(this);
        this.handleProteinColorChange = this.handleProteinColorChange.bind(this);
        this.handleSideChainChange = this.handleSideChainChange.bind(this);
        this.handleMutationColorChange = this.handleMutationColorChange.bind(this);
        this.handleBoundMoleculeChange = this.handleBoundMoleculeChange.bind(this);
        this.handlePyMolDownload = this.handlePyMolDownload.bind(this);
    }

    public selectionTitle(text: string, tooltip?: JSX.Element, placement:string = "top")
    {
        let content:JSX.Element|null = null;

        if (tooltip)
        {
            content = this.defaultInfoTooltip(tooltip, placement);
        }

        return (
            <span>
                {text} {content}:
            </span>
        );
    }

    public defaultInfoTooltip(tooltip: JSX.Element, placement:string = "top")
    {
        const tooltipCallback = () => tooltip;

        return (
            <DefaultTooltip
                placement={placement}
                overlay={tooltipCallback}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                destroyTooltipOnHide={true}
            >
                <i className="fa fa-info-circle" />
            </DefaultTooltip>
        );
    }

    public proteinColorTooltipContent()
    {
        return (
            <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
                Color options for the protein structure. <br />
                <br />
                <b>Uniform:</b> Colors the entire protein structure with a
                <span className={styles['loop']}> single color</span>. <br />
                <b>Secondary structure:</b> Colors the protein by secondary structure.
                Assigns different colors for <span className={styles['alpha-helix']}>alpha helices</span>,
                <span className={styles['beta-sheet']}> beta sheets</span>, and
                <span className={styles['loop']}> loops</span>.
                This color option is not available for the space-filling protein scheme. <br />
                <b>N-C rainbow:</b> Colors the protein with a rainbow gradient
                from red (N-terminus) to blue (C-terminus). <br />
                <b>Atom Type:</b> Colors the structure with respect to the atom type (CPK color scheme).
                This color option is only available for the space-filling protein scheme. <br />
                <br />
                The selected chain is always displayed with full opacity while the rest of the structure
                has some transparency to help better focusing on the selected chain.
            </div>
        );
    }


    public sideChainTooltipContent()
    {
        return (
            <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
                Display options for the side chain atoms. <br />
                <br />
                <b>All:</b> Displays the side chain atoms for every mapped residue. <br />
                <b>Selected:</b> Displays the side chain atoms only for the selected mutations. <br />
                <b>None:</b> Hides the side chain atoms. <br />
                <br />
                This option has no effect for the space-filling protein scheme.
            </div>
        );
    }

    public mutationColorTooltipContent()
    {
        return (
            <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
                Color options for the mapped mutations. <br />
                <br />
                <b>Uniform:</b> Colors all mutated residues with a
                <span className={styles['uniform-mutation']}> single color</span>. <br />
                <b>Mutation type:</b> Enables residue coloring by mutation type.
                Mutation types and corresponding color codes are as follows:
                <ul>
                    <li>
                        <span className={styles['missense-mutation']}>Missense Mutations</span>
                    </li>
                    <li>
                        <span className={styles['trunc-mutation']}>Truncating Mutations</span>
                        <span> (Nonsense, Nonstop, FS del, FS ins)</span>
                    </li>
                    <li>
                        <span className={styles['inframe-mutation']}>Inframe Mutations</span>
                        <span> (IF del, IF ins)</span>
                    </li>
                </ul>
                <b>None:</b> Disables coloring of the mutated residues
                except for manually selected (highlighted) residues. <br />
                <br />
                Highlighted residues are colored with <span className={styles['highlighted']}>yellow</span>.
            </div>
        );
    }

    public boundMoleculesTooltipContent()
    {
        return (
            <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
                Displays co-crystalized molecules.
                This option has no effect if the current structure does not contain any co-crystalized bound molecules.
            </div>
        );
    }

    public helpTooltipContent()
    {
        return (
            <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
                <b>Zoom in/out:</b> Press and hold the SHIFT key and the left mouse button, and then move the mouse backward/forward.<br />
                <b>Pan:</b> Press and hold the CTRL key, click and hold the left mouse button, and then move the mouse in the desired direction.<br />
                <b>Rotate:</b> Press and hold the left mouse button, and then move the mouse in the desired direction to rotate along the x and y axes.<br />
            </div>
        );
    }

    public proteinStyleMenu()
    {
        return (
            <span>
                <div className='row text-center'>
                    <span>Protein Style</span>
                </div>
                <div className='row'>
                    <div className='col col-sm-10 col-sm-offset-1'>
                        <hr />
                    </div>
                </div>
                <div className='row'>
                    <Checkbox
                        checked={this.displayBoundMolecules}
                        onChange={this.handleBoundMoleculeChange as React.FormEventHandler<any>}
                    >
                        Display bound molecules {this.defaultInfoTooltip(this.boundMoleculesTooltipContent())}
                    </Checkbox>
                </div>
                <div className="row">
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle("Scheme")}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles["default-option-select"]}
                                componentClass="select"
                                value={`${this.proteinScheme}`}
                                onChange={this.handleProteinSchemeChange as React.FormEventHandler<any>}
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
                            {this.selectionTitle("Color", this.proteinColorTooltipContent())}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles["default-option-select"]}
                                componentClass="select"
                                value={`${this.proteinColor}`}
                                onChange={this.handleProteinColorChange as React.FormEventHandler<any>}
                            >
                                <option value={ProteinColor.UNIFORM}>
                                    uniform
                                </option>
                                <option
                                    value={ProteinColor.SECONDARY_STRUCTURE}
                                    disabled={this.colorBySecondaryStructureDisabled}
                                >
                                    secondary structure
                                </option>
                                <option
                                    value={ProteinColor.NC_RAINBOW}
                                    disabled={this.colorByNCRainbowDisabled}
                                >
                                    N-C rainbow
                                </option>
                                <option
                                    value={ProteinColor.ATOM_TYPE}
                                    disabled={this.colorByAtomTypeDisabled}
                                >
                                    atom type
                                </option>
                            </FormControl>
                        </div>
                    </div>
                </div>
            </span>
        );
    }

    public mutationStyleMenu()
    {
        return (
            <span>
                <div className='row text-center'>
                    <span>Mutation Style</span>
                </div>
                <div className='row'>
                    <div className='col col-sm-10 col-sm-offset-1'>
                        <hr />
                    </div>
                </div>
                <div className="row">
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle("Side Chain", this.sideChainTooltipContent())}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles["default-option-select"]}
                                componentClass="select"
                                value={`${this.sideChain}`}
                                onChange={this.handleSideChainChange as React.FormEventHandler<any>}
                            >
                                <option value={SideChain.ALL}>
                                    all
                                </option>
                                <option value={SideChain.SELECTED}>
                                    selected
                                </option>
                                <option value={SideChain.NONE}>
                                    none
                                </option>
                            </FormControl>
                        </div>
                    </div>
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle("Color", this.mutationColorTooltipContent(), "left")}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles["default-option-select"]}
                                componentClass="select"
                                value={`${this.mutationColor}`}
                                onChange={this.handleMutationColorChange as React.FormEventHandler<any>}
                            >
                                <option value={MutationColor.UNIFORM}>
                                    uniform
                                </option>
                                <option value={MutationColor.MUTATION_TYPE}>
                                    mutation type
                                </option>
                                <option value={MutationColor.NONE}>
                                    none
                                </option>
                            </FormControl>
                        </div>
                    </div>
                </div>
            </span>
        );
    }

    public topToolbar()
    {
        return (
            <div className='row'>
                <div className="col col-sm-6">
                    <ButtonGroup>
                        <DefaultTooltip overlay={<span>Download PyMol script</span>} placement="top">
                            <Button className="btn-sm" onClick={this.handlePyMolDownload}>
                                <i className='fa fa-cloud-download'/> PyMol
                            </Button>
                        </DefaultTooltip>
                    </ButtonGroup>
                </div>
                <div className="col col-sm-6">
                    <span className="pull-right">
                        how to pan/zoom/rotate? {this.defaultInfoTooltip(this.helpTooltipContent(), "left")}
                    </span>
                </div>
            </div>
        );
    }

    public header()
    {
        return (
            <div className='row'>
                <div className='col col-sm-10'>
                    <span>3D Structure</span>
                </div>
                <div className="col col-sm-2">
                    <span className="pull-right">
                        <i
                            className="fa fa-minus-circle"
                            onClick={this.toggleCollapse}
                            style={{marginRight: "5px", cursor: "pointer"}}
                        />
                        <i
                            className="fa fa-times-circle"
                            onClick={this.props.onClose}
                            style={{cursor: "pointer"}}
                        />
                    </span>
                </div>
            </div>
        );
    }

    public pdbInfo(pdbId:string, chainId:string)
    {
        let pdbInfo = null;
        let moleculeInfo = null;

        if (this.props.pdbHeaderCache)
        {
            const cacheData = this.props.pdbHeaderCache.get(pdbId);

            if (cacheData === null) {
                pdbInfo = <TableCellStatusIndicator status={TableCellStatus.LOADING} />;
                moleculeInfo = <TableCellStatusIndicator status={TableCellStatus.LOADING} />;
            }
            else if (cacheData.status === "error") {
                pdbInfo = <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
                moleculeInfo = <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
            }
            else if (cacheData.data === null) {
                pdbInfo = <TableCellStatusIndicator status={TableCellStatus.NA} />;
                moleculeInfo = <TableCellStatusIndicator status={TableCellStatus.NA} />;
            }
            else {
                const summary = generatePdbInfoSummary(cacheData.data, chainId);

                pdbInfo = summary.pdbInfo;
                moleculeInfo = summary.moleculeInfo;
            }
        }

        return (
            <div className="col col-sm-12">
                <div className="row">
                    <span>PDB </span>
                    <span>
                        <a
                            href={`http://www.rcsb.org/pdb/explore/explore.do?structureId=${pdbId}`}
                            target="_blank"
                        >
                            <b>{pdbId}</b>
                        </a>
                    </span>
                    <span>: {pdbInfo}</span>
                </div>
                <div className="row">
                    <span>Chain </span>
                    <span><b>{chainId}</b></span>
                    <span>: {moleculeInfo}</span>
                </div>
            </div>
        );
    }

    public render() {
        return (
            <Draggable
                handle=".structure-viewer-header"
            >
                <div className={classnames(styles["main-3d-panel"], {[styles["collapsed-panel"]]: this.isCollapsed})}>
                    <div className="structure-viewer-header row">
                        {this.header()}
                        <hr style={{borderTopColor: "#BBBBBB"}} />
                    </div>
                    <div className="row">
                        {this.pdbInfo(this.props.pdbId, this.props.chainId)}
                    </div>
                    <If condition={this.residueWarning.length > 0}>
                        <span className="text-danger">
                            {this.residueWarning}
                        </span>
                    </If>
                    <div className={`${styles["vis-container"]} row`}>
                        <hr />
                        <StructureViewer
                            displayBoundMolecules={this.displayBoundMolecules}
                            proteinScheme={this.proteinScheme}
                            proteinColor={this.proteinColor}
                            sideChain={this.sideChain}
                            mutationColor={this.mutationColor}
                            pdbId={this.props.pdbId}
                            chainId={this.props.chainId}
                            residues={this.props.residues}
                        />
                        <hr />
                    </div>
                    <div className='row'>
                        {this.topToolbar()}
                        <hr />
                    </div>
                    <div className="row">
                        <div className='col col-sm-6'>
                            {this.proteinStyleMenu()}
                        </div>
                        <div className='col col-sm-6'>
                            {this.mutationStyleMenu()}
                        </div>
                    </div>
                </div>
            </Draggable>
        );
    }

    private toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    private handleProteinSchemeChange(evt:React.FormEvent<HTMLSelectElement>) {
        this.proteinScheme = parseInt((evt.target as HTMLSelectElement).value, 10);

        // when the protein scheme is SPACE_FILLING, NC_RAINBOW and SECONDARY_STRUCTURE are not allowed
        if (this.proteinScheme === ProteinScheme.SPACE_FILLING &&
            (this.proteinColor === ProteinColor.NC_RAINBOW || this.proteinColor === ProteinColor.SECONDARY_STRUCTURE))
        {
            this.proteinColor = ProteinColor.UNIFORM;
        }
        // when the protein scheme is CARTOON or TRACE, ATOM_TYPE is not allowed
        else if ((this.proteinScheme === ProteinScheme.TRACE || this.proteinScheme === ProteinScheme.CARTOON) &&
            this.proteinColor === ProteinColor.ATOM_TYPE)
        {
            this.proteinColor = ProteinColor.UNIFORM;
        }
    }

    private handleProteinColorChange(evt:React.FormEvent<HTMLSelectElement>) {
        this.proteinColor = parseInt((evt.target as HTMLSelectElement).value, 10);
    }

    private handleSideChainChange(evt:React.FormEvent<HTMLSelectElement>) {
        this.sideChain = parseInt((evt.target as HTMLSelectElement).value, 10);
    }

    private handleMutationColorChange(evt:React.FormEvent<HTMLSelectElement>) {
        this.mutationColor = parseInt((evt.target as HTMLSelectElement).value, 10);
    }

    private handleBoundMoleculeChange() {
        this.displayBoundMolecules = !this.displayBoundMolecules;
    }

    private handlePyMolDownload() {
        // TODO generate a PyMol script for the current state of the viewer
    }

    @computed get colorBySecondaryStructureDisabled()
    {
        return this.proteinScheme === ProteinScheme.SPACE_FILLING;
    }

    @computed get colorByNCRainbowDisabled()
    {
        return this.proteinScheme === ProteinScheme.SPACE_FILLING;
    }

    @computed get colorByAtomTypeDisabled()
    {
        return this.proteinScheme !== ProteinScheme.SPACE_FILLING;
    }
}
