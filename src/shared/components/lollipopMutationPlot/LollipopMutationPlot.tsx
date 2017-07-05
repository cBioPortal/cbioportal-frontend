import * as React from "react";
import LollipopPlot from "./LollipopPlot";
import {Mutation} from "../../api/generated/CBioPortalAPI";
import {LollipopSpec, DomainSpec} from "./LollipopPlotNoTooltip";
import {
    default as getCanonicalMutationType,
    CanonicalMutationType, ProteinImpactType, getProteinImpactTypeFromCanonical
} from "shared/lib/getCanonicalMutationType";
import {remoteData} from "../../api/remoteData";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import request from "superagent";
import Response = request.Response;
import {observer} from "mobx-react";
import {computed, observable, action} from "mobx";
import _ from "lodash";
import {longestCommonStartingSubstring} from "shared/lib/StringUtils";
import {getColorForProteinImpactType, IProteinImpactTypeColors} from "shared/lib/MutationUtils";
import {fetchSwissProtAccession} from "shared/lib/StoreUtils";
import ReactDOM from "react-dom";
import {Form, Button, FormGroup, InputGroup, ControlLabel, FormControl} from "react-bootstrap";
import fileDownload from "react-file-download";
import "./styles.scss";
import Collapse from "react-collapse";
import {MutationMapperStore} from "../../../pages/resultsView/mutation/MutationMapperStore";

export interface ILollipopMutationPlotProps extends IProteinImpactTypeColors
{
    store:MutationMapperStore;
    onXAxisOffset?:(offset:number)=>void;
    geneWidth:number;
}

@observer
export default class LollipopMutationPlot extends React.Component<ILollipopMutationPlotProps, {}> {

    @observable private showControls:boolean = false;
    @observable private _yMaxInput:number;
    @observable private legendShown:boolean = false;
    private plot:LollipopPlot;
    private handlers:any;

    readonly mutationAlignerLinks = remoteData<{[pfamAccession:string]:string}>({
        await: ()=>[
            this.props.store.pfamGeneData
        ],
        invoke: ()=>(new Promise((resolve,reject)=>{
            const regions = this.props.store.pfamGeneData.result.regions;
            const responsePromises:Promise<Response>[] = [];
            for (let i=0; i<regions.length; i++) {
                // have to do a for loop because seamlessImmutable will make result of .map immutable,
                // and that causes infinite loop here
                responsePromises.push(
                    request.get(`http://www.cbioportal.org/getMutationAligner.json?pfamAccession=${regions[i].metadata.accession}`)
                );
            }
            const allResponses = Promise.all(responsePromises);
            allResponses.then(responses=>{
                const data = responses.map(r=>JSON.parse(r.text));
                const ret:{[pfamAccession:string]:string} = {};
                let mutationAlignerData:any;
                let pfamAccession:string;
                for (let i=0; i<data.length; i++) {
                    mutationAlignerData = data[i];
                    pfamAccession = regions[i].metadata.accession;
                    if (mutationAlignerData.linkToMutationAligner) {
                        ret[pfamAccession] = mutationAlignerData.linkToMutationAligner;
                    }
                }
                resolve(ret);
            });
            allResponses.catch(reject);
        }))
    }, {});

    private lollipopLabel(mutationsAtPosition:Mutation[]):string {
        let proteinChanges = _.uniq(mutationsAtPosition.map(m=>m.proteinChange));
        proteinChanges.sort();

        let startStr = "";
        if (proteinChanges.length > 1) {
            // only need to compare first and last element of sorted string list to find longest common starting substring of all of them
            startStr = longestCommonStartingSubstring(
                proteinChanges[0], proteinChanges[proteinChanges.length - 1]
            );
        }
        proteinChanges = proteinChanges.map((s:string)=>s.substring(startStr.length));

        return startStr + proteinChanges.join("/");
    }

    private lollipopTooltip(mutationsAtPosition:Mutation[]):JSX.Element {
        const count = mutationsAtPosition.length;
        const mutationStr = "mutation" + (count > 1 ? "s" : "");
        const label = this.lollipopLabel(mutationsAtPosition);
        return (
            <div>
                <b>{count} {mutationStr}</b><br/>
                <span>AA Change: {label}</span>
            </div>
        );
    }

    @computed private get mutationsByPosition():{[pos:number]:Mutation[]} {
        const ret:{[pos:number]:Mutation[]} = {};
        let codon;
        for (const mutations of this.props.store.dataStore.sortedFilteredData) {
            for (const mutation of mutations) {
                codon = mutation.proteinPosStart;
                ret[codon] = ret[codon] || [];
                ret[codon].push(mutation);
            }
        }
        return ret;
    }

    @computed private get lollipops():LollipopSpec[] {
        if (Object.keys(this.mutationsByPosition).length === 0) {
            return [];
        }

        // positionMutations: Mutation[][], in descending order of mutation count
        const positionMutations = Object.keys(this.mutationsByPosition)
            .map(position=>this.mutationsByPosition[parseInt(position,10)])
            .sort((x,y)=>(x.length < y.length ? 1 : -1));

        // maxCount: max number of mutations at a position
        const maxCount = positionMutations[0].length;

        // numLabelCandidates: number of positions with maxCount mutations
        let numLabelCandidates = positionMutations.findIndex(mutations=>(mutations.length !== maxCount));
        if (numLabelCandidates === -1) {
            numLabelCandidates = positionMutations.length;
        }

        // now we decide whether we'll show a label at all
        const maxAllowedTies = 2;
        const maxLabels = 1;
        const minMutationsToShowLabel = 1;

        let numLabelsToShow;
        if (numLabelCandidates > maxLabels && // if there are more candidates than we can show,
            numLabelCandidates > maxAllowedTies) { // and more candidates than are allowed for a tie
            numLabelsToShow = 0;                        // then we dont show any label
        } else {
            numLabelsToShow = Math.min(numLabelCandidates, maxLabels); // otherwise, we show labels
        }

        const ret:LollipopSpec[] = [];
        for (let i=0; i<positionMutations.length; i++) {
            const mutations = positionMutations[i];
            const codon = mutations[0].proteinPosStart;
            if (isNaN(codon) || codon < 0 || (this.props.store.pfamGeneData.isComplete && (codon > this.props.store.pfamGeneData.result.length))) {
                // invalid position
                continue;
            }
            let label:string|undefined;
            if (i < numLabelsToShow && mutations.length >= minMutationsToShowLabel) {
                label = this.lollipopLabel(mutations);
            } else {
                label = undefined;
            }
            ret.push({
                codon,
                count: mutations.length,
                tooltip:this.lollipopTooltip(mutations),
                color: getColorForProteinImpactType(mutations, this.props),
                label
            });
        }
        return ret;
    }

    private domainTooltip(region:any):JSX.Element {
        const identifier = region.metadata.identifier;
        const type = region.type;
        const description = region.metadata.description;
        const start = region.metadata.start;
        const end = region.metadata.end;
        const pfamAccession = region.metadata.accession;
        const mutationAlignerLink = this.mutationAlignerLinks.result[pfamAccession];
        const mutationAlignerA = mutationAlignerLink ? (<a href={mutationAlignerLink} target="_blank" style={{marginLeft:"5px"}}>Mutation Aligner</a>) : null;

        return (
            <div>
                <div>
                    {identifier} {type}, {description} ({start} - {end})
                </div>
                <div>
                    <a href={`http://pfam.xfam.org/family/${pfamAccession}`} target="_blank">PFAM</a>
                    {mutationAlignerA}
                </div>
            </div>
        );
    }

    @computed private get domains():DomainSpec[] {
        if (!this.props.store.pfamGeneData.isComplete) {
            return [];
        } else {
            return this.props.store.pfamGeneData.result.regions.map((region:any)=>{
                const startCodon:number = region.metadata.start;
                const endCodon:number = region.metadata.end;
                const label:string = region.metadata.identifier;
                const color:string = region.colour;
                const tooltip:JSX.Element = this.domainTooltip(region);
                return {
                    startCodon,
                    endCodon,
                    label,
                    color,
                    tooltip
                };
            });
        }
    }

    public toSVGDOMNode():Element {
        if (this.plot) {
            // Get result of plot
            const plotSvg = this.plot.toSVGDOMNode();
            // Add label to top left
            const label =(
                <text
                    fill="#2E3436"
                    textAnchor="start"
                    dy="1em"
                    x="2"
                    y="2"
                    style={{fontFamily:"verdana", fontSize:"12px", fontWeight:"bold"}}
                >
                    {this.hugoGeneSymbol}
                </text>
            );
            const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            ReactDOM.render(label, labelGroup);
            plotSvg.appendChild(labelGroup);

            return plotSvg;
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
        // Add label to top
    }

    private base64ToArrayBuffer(base64:string) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }

    public downloadAsPDF(filename:string) {
        const svgelement = "<?xml version='1.0'?>"+this.toSVGDOMNode().outerHTML;
        const servletURL = "http://www.cbioportal.org/svgtopdf.do";
        const filetype = "pdf_data";
        request.post(servletURL)
            .type('form')
            .send({ filetype, svgelement})
            .end((err, res)=>{
                if (!err && res.ok) {
                    fileDownload(this.base64ToArrayBuffer(res.text), filename);
                }
            });
    }

    @computed get hugoGeneSymbol() {
        return this.props.store.gene.result && this.props.store.gene.result.hugoGeneSymbol;
    }

    @computed get countRange() {
        if (this.lollipops.length === 0) {
            return [0,0];
        } else {
            let max = Number.NEGATIVE_INFINITY;
            let min = Number.POSITIVE_INFINITY;
            for (const lollipop of this.lollipops) {
                max = Math.max(max, lollipop.count);
                min = Math.min(min, lollipop.count);
            }
            return [min, max];
        }
    }

    @computed get sliderRange() {
        return [this.countRange[0], Math.max(this.countRange[1], this.countRange[0]+5)];
    }

    constructor(props: ILollipopMutationPlotProps) {
        super(props);

        this.handlers = {
            handleYAxisMaxChange: action((event:any)=>{
                let inputValue:string = (event.target as HTMLInputElement).value;
                this._yMaxInput = parseInt(inputValue, 10);
            }),
            handleSVGClick:()=>{
                fileDownload(this.toSVGDOMNode().outerHTML,`${this.hugoGeneSymbol}_lollipop.svg`);
            },
            handlePDFClick:()=>{
                this.downloadAsPDF(`${this.hugoGeneSymbol}_lollipop.pdf`)
            },
            handleToggleLegend: action(()=>{
                this.legendShown = !this.legendShown;
            }),
            showControls: action(()=>{ this.showControls = true;}),
            hideControls: action(()=>{ this.showControls = false;}),
            ref: (plot:LollipopPlot)=>{ this.plot = plot; },
        };
    }

    @computed get yMax() {
        return this._yMaxInput || this.countRange[1];
    }

    private get legend() {
        return (
            <div style={{maxWidth:"700px"}}>
                <span style={{color: "#2153AA", fontWeight:"bold", fontSize:"14px", fontFamily:"verdana, arial, sans-serif"}}>
                    Color Codes
                </span>
                <p>
                    Mutation diagram circles are colored with respect to the corresponding mutation types.
                    In case of different mutation types at a single position, color of the circle is determined with
                    respect to the most frequent mutation type.
                </p>
                <br/>
                <div>
                    Mutation types and corresponding color codes are as follows:
                    <ul>
                        <li>
                            <span style={{color:this.props.missenseColor, fontWeight: "bold", fontSize: "14px", fontFamily:"verdana, arial, sans-serif"}}>
                                Missense Mutations
                            </span>
                        </li>
                        <li>
                            <span style={{color:this.props.truncatingColor, fontWeight: "bold", fontSize: "14px", fontFamily:"verdana, arial, sans-serif"}}>
                                Truncating Mutations
                            </span>
                            : Nonsense, Nonstop, Frameshift deletion, Frameshift insertion, Splice site
                        </li>
                        <li>
                            <span style={{color:this.props.inframeColor, fontWeight: "bold", fontSize: "14px", fontFamily:"verdana, arial, sans-serif"}}>
                                Inframe Mutations
                            </span>
                            : Inframe deletion, Inframe insertion
                        </li>
                        <li>
                            <span style={{color:this.props.otherColor, fontWeight: "bold", fontSize: "14px", fontFamily:"verdana, arial, sans-serif"}}>
                                Other Mutations
                            </span>
                            : All other types of mutations
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    @computed get controls() {
        return (
            <div>
                <div className={this.showControls ? "fade-in" : "fade-out"}>
                    <Form inline>
                        <FormGroup>
                            <Button onClick={this.handlers.handleSVGClick}>
                                SVG
                            </Button>
                        </FormGroup>
                        {' '}
                        <FormGroup>
                            <Button onClick={this.handlers.handlePDFClick}>
                                PDF
                            </Button>
                        </FormGroup>
                        {'  '}
                        <FormGroup>
                            <InputGroup>
                                <InputGroup.Addon>Y-Axis Max:</InputGroup.Addon>
                                <InputGroup.Addon>{this.countRange[0]}</InputGroup.Addon>
                                <InputGroup.Addon>
                                    <input
                                        style={{display:"inline-block"}}
                                        type="range"
                                        min={this.countRange[0]}
                                        max={this.countRange[1]}
                                        step="1"
                                        onChange={this.handlers.handleYAxisMaxChange}
                                        value={this.yMax}
                                    />
                                </InputGroup.Addon>
                                <InputGroup.Addon>{this.countRange[1]}</InputGroup.Addon>
                            </InputGroup>
                        </FormGroup>
                        {'  '}
                        <FormGroup>
                            <Button onClick={this.handlers.handleToggleLegend}>
                                Legend
                            </Button>
                        </FormGroup>
                    </Form>
                </div>
                <br/>
                <Collapse isOpened={this.legendShown}>
                    {this.legend}
                </Collapse>
            </div>
        );
    }

    render() {
        if (this.props.store.pfamGeneData.isComplete) {
            return ( this.props.store.dataStore.allData.length ? (
                <div onMouseEnter={this.handlers.showControls} onMouseLeave={this.handlers.hideControls}>
                    {this.controls}
                    <LollipopPlot
                        ref={this.handlers.ref}
                        lollipops={this.lollipops}
                        domains={this.domains}
                        dataStore={this.props.store.dataStore}
                        vizWidth={this.props.geneWidth}
                        vizHeight={130}
                        xMax={this.props.store.pfamGeneData.result.length}
                        yMax={this.yMax}
                        onXAxisOffset={this.props.onXAxisOffset}
                    />
                </div>
            ) : (
                <div>There are no {this.hugoGeneSymbol} mutations in the selected samples.<br/></div>
            ));
        } else {
            return (<LoadingIndicator isLoading={true}/>);
        }
    }
}