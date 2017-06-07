import * as React from "react";
import ProteinChainView from "./ProteinChainView";
import PDBChainTable from "./PDBChainTable"
import {observer} from "mobx-react";
import {computed, observable, action} from "mobx";
import {ProteinChainSpec} from "./ProteinChainView";
import Collapse from "react-collapse";
import DefaultTooltip from "shared/components/DefaultTooltip";
import {HitZone} from "../HitZone";
import ProteinChain from "./ProteinChain";
import {MutationMapperStore} from "../../../pages/resultsView/mutation/MutationMapperStore";
import {ALIGNMENT_GAP, IPdbChain} from "../../model/Pdb";
import PdbHeaderCache from "../../cache/PdbHeaderCache";
import PdbChainInfo from "../PdbChainInfo";
import onNextRenderFrame from "shared/lib/onNextRenderFrame";

type ProteinChainPanelProps = {
    store:MutationMapperStore;
    geneWidth:number;
    geneXOffset?:number;
    maxChainsHeight?: number;
    pdbHeaderCache?:PdbHeaderCache;
};

@observer
export default class ProteinChainPanel extends React.Component<ProteinChainPanelProps, {}> {

    @observable private isExpanded:boolean = false;
    @observable private pdbChainTableShown:boolean = false;
    @observable private hoveredChain:IPdbChain|undefined;
    @observable hitZoneConfig:any = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        onClick: ()=>{}
    };

    private chainDiv:HTMLDivElement;
    private _chainScrollY:number = 0;

    private collapseTimeout:number|null = null;
    private expandTimeout:number|null = null;

    private expandDelayMs = 750;
    private collapseDelayMs = 3000;

    private handlers:any;

    constructor(props:ProteinChainPanelProps) {
        super(props);
        this.handlers = {
            onMouseEnter:action(()=>{
                this.expandTimeout = window.setTimeout(()=>{
                    this.isExpanded = true;
                }, this.expandDelayMs);

                if (this.collapseTimeout) {
                    window.clearTimeout(this.collapseTimeout);
                }
            }),
            onMouseLeave:action(()=>{
                this.collapseTimeout = window.setTimeout(()=>{
                    this.isExpanded = false;
                }, this.collapseDelayMs);

                if (this.expandTimeout) {
                    window.clearTimeout(this.expandTimeout);
                }
            }),
            chainDivRef:(div:HTMLDivElement)=>{this.chainDiv = div;},
            onChainScroll:()=>{
                if (this.chainDiv && this.isExpanded) {
                    this._chainScrollY = this.chainDiv.scrollTop;
                }
            },
            togglePDBTable:action(()=>{
                this.pdbChainTableShown = !this.pdbChainTableShown;
            }),
            getTooltipContent:()=>{
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
            setHitZone:(hitRect:{x:number, y:number, width:number, height:number},
                        chainUid:string)=>{
                this.hitZoneConfig.x = hitRect.x;
                this.hitZoneConfig.y = hitRect.y;
                this.hitZoneConfig.width = hitRect.width;
                this.hitZoneConfig.height = hitRect.height;
                this.hitZoneConfig.onClick = ()=>{
                    this.selectChain(chainUid);
                };
                this.hoveredChain = this.props.store.pdbChainDataStore.getPdbChain(chainUid);
            },
        };

    }

    @computed get chainScrollY() {
        if (this.isExpanded) {
            return this._chainScrollY;
        } else {
            return 0;
        }
    }

    @action private selectChain(chainUid:string) {
        this.props.store.pdbChainDataStore.selectUid(chainUid);
    }

    @computed private get isOpen() {
        return !!this.props.store.pdbChainDataStore.selectedChain;
    }

    @computed private get displayChains():IPdbChain[] {
        if (!this.props.store.pdbChainDataStore.selectedChain) {
            return [];
        } else if (!this.isExpanded) {
            return [this.props.store.pdbChainDataStore.selectedChain];
        } else {
            return this.props.store.pdbChainDataStore.allData;
        }
    }

    @computed get chains():ProteinChainSpec[] {
        return this.displayChains.map((pdbChain:IPdbChain)=>{
            const gaps = [];
            let gapStart = -1;
            const alignment = pdbChain.alignment;
            for (let i=0; i<alignment.length; i++) {
                if (alignment[i] === ALIGNMENT_GAP) {
                    if (gapStart === -1) {
                        gapStart = i;
                    }
                } else {
                    if (gapStart !== -1) {
                        gaps.push({
                            start: pdbChain.uniprotStart + gapStart,
                            end: pdbChain.uniprotStart + i
                        });
                        gapStart = -1;
                    }
                }
            }
            return {
                start:pdbChain.uniprotStart,
                end:pdbChain.uniprotEnd+1,
                gaps,
                opacity:pdbChain.identityPerc,
                uid:this.props.store.pdbChainDataStore.getChainUid(pdbChain)
            };
        });
    }

    @computed get proteinLength() {
        return Math.max(this.props.store.pfamGeneData.result.length, 1);
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
            />
        );
    }

    componentDidUpdate() {
        onNextRenderFrame(()=>{
          if (this.chainDiv) {
              this.chainDiv.scrollTop = this.chainScrollY;
          }
        });
    }

    render() {
        const tooltipVisibleProps:any = {};
        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }
        return (
            <div onMouseEnter={this.handlers.onMouseEnter} onMouseLeave={this.handlers.onMouseLeave}>
                <Collapse isOpened={this.isOpen}>
                    <div style={{
                        marginLeft:this.props.geneXOffset || 0,
                    }}>
                        <div
                            ref={this.handlers.chainDivRef}
                            style={{
                                overflowY:"scroll",
                                maxHeight:this.props.maxChainsHeight,
                                position:"relative",
                            }}
                            onScroll={this.handlers.onChainScroll}
                        >
                            <ProteinChainView
                                width={this.props.geneWidth}
                                chains={this.chains}
                                proteinLength={this.proteinLength}
                                setHitZone={this.handlers.setHitZone}
                                selectedChainUid={this.props.store.pdbChainDataStore.selectedUid}
                            />
                            <DefaultTooltip
                                placement="top"
                                overlay={this.handlers.getTooltipContent}
                                {...tooltipVisibleProps}
                            >
                                {this.hitZone}
                            </DefaultTooltip>
                        </div>
                        <br/>
                        <div style={{display: this.isExpanded ? "inherit" : "none"}}>
                            <button onClick={this.handlers.togglePDBTable} className="btn btn-default" style={{float:"left"}}>PDB Chain Table</button>
                            <br/>
                            <br/>
                            <div style={{display: this.pdbChainTableShown ? "inherit" : "none"}}>
                                {/*<PDBChainTable/>*/}
                                {"THIS IS WHERE TABLE GOES"}
                            </div>
                        </div>
                        <br/>
                    </div>
                </Collapse>
            </div>
        );
    }
}