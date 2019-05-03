import autobind from "autobind-decorator";
import _ from "lodash";
import {computed, observable, action} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {Collapse} from "react-collapse";

import $ from "jquery";

import {DomainSpec} from "./model/DomainSpec";
import {LollipopSpec} from "./model/LollipopSpec";
import {Mutation} from "./model/Mutation";
import {MutationMapperStore} from "./model/MutationMapperStore";
import {PfamDomain, PfamDomainRange} from "./model/Pfam";
import {SequenceSpec} from "./model/SequenceSpec";
import {lollipopLabelText, lollipopLabelTextAnchor} from "./util/LollipopPlotUtils";
import {generatePfamDomainColorMap} from "./util/PfamUtils";
import LollipopPlot from "./LollipopPlot";
import LollipopMutationPlotControls from "./LollipopMutationPlotControls";
import {TrackDataStatus, TrackVisibility} from "./TrackSelector";
import DefaultLollipopPlotLegend from "./DefaultLollipopPlotLegend";
import {getColorForProteinImpactType} from "./util/MutationUtils";

export interface ILollipopMutationPlotProps
{
    store: MutationMapperStore;
    getLollipopColor?: (mutations: Mutation[]) => string;
    onXAxisOffset?: (offset:number) => void;
    geneWidth: number;
    trackVisibility?: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;
    autoHideControls?: boolean;
    legend?: JSX.Element;
    loadingIndicator?: JSX.Element;
}


@observer
export default class LollipopMutationPlot extends React.Component<ILollipopMutationPlotProps, {}>
{
    @observable private mouseInPlot:boolean = true;
    @observable private _yMaxInput:number;
    @observable private legendShown:boolean = false;
    @observable private yMaxInputFocused:boolean = false;

    private handlers:any;
    private divContainer:HTMLDivElement;

    @computed private get showControls(): boolean {
        return this.props.autoHideControls ? (this.yMaxInputFocused || this.mouseInPlot) : true;
    }

    private lollipopTooltip(mutationsAtPosition:Mutation[], countsByPosition:{[pos: number]: number}):JSX.Element {
        const codon = mutationsAtPosition[0].proteinPosStart;
        const count = countsByPosition[codon];
        const mutationStr = "mutation" + (count > 1 ? "s" : "");
        const label = lollipopLabelText(mutationsAtPosition);
        return (
            <div>
                <b>{count} {mutationStr}</b><br/>
                <span>AA Change: {label}</span>
            </div>
        );
    }

    @computed private get lollipops(): LollipopSpec[]
    {
        const mutationsByPosition = this.props.store.mutationsByPosition;
        const countsByPosition = this.props.store.uniqueMutationCountsByPosition;

        if (Object.keys(mutationsByPosition).length === 0) {
            return [];
        }

        // positionMutations: Mutation[][], in descending order of mutation count
        const positionMutations = Object.keys(mutationsByPosition)
            .map(position => mutationsByPosition[parseInt(position,10)])
            .sort((x,y) =>
                countsByPosition[x[0].proteinPosStart] < countsByPosition[y[0].proteinPosStart] ? 1 : -1);

        // maxCount: max number of mutations at a position
        const maxCount = positionMutations && positionMutations[0] ?
            countsByPosition[positionMutations[0][0].proteinPosStart] : 0;

        // numLabelCandidates: number of positions with maxCount mutations
        let numLabelCandidates = positionMutations ? positionMutations.findIndex(
            mutations => (countsByPosition[mutations[0].proteinPosStart] !== maxCount)) : -1;

        if (numLabelCandidates === -1) {
            numLabelCandidates = positionMutations ? positionMutations.length : 0;
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
            const mutationCount = countsByPosition[codon];

            if (isNaN(codon) ||
                codon < 0 ||
                (this.props.store.allTranscripts.isComplete &&
                    this.props.store.allTranscripts.result &&
                    this.props.store.activeTranscript &&
                    this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript] &&
                    // we want to show the stop codon too (so we allow proteinLength +1 as well)
                    (codon > this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].proteinLength + 1)))
            {
                // invalid position
                continue;
            }
            let label: {text: string, textAnchor?: string, fontSize?: number, fontFamily?: string} | undefined;
            if (i < numLabelsToShow && mutationCount >= minMutationsToShowLabel) {
                const fontSize = 10;
                const fontFamily = "arial";
                // limit number of protein changes to 3
                const text = lollipopLabelText(mutations, 3);
                const textAnchor = lollipopLabelTextAnchor(
                    text, codon, fontFamily, fontSize, this.props.geneWidth, this.proteinLength);
                label = {text, textAnchor, fontSize, fontFamily};
            } else {
                label = undefined;
            }
            ret.push({
                codon,
                count: mutationCount,
                tooltip: this.lollipopTooltip(mutations, countsByPosition),
                color: this.props.getLollipopColor ?
                    this.props.getLollipopColor(mutations): getColorForProteinImpactType(mutations),
                label
            });
        }
        return ret;
    }

    private mutationAlignerLink(pfamAccession: string): JSX.Element | null {
        if (this.props.store.mutationAlignerLinks && this.props.store.mutationAlignerLinks.result) {
            const mutationAlignerLink = this.props.store.mutationAlignerLinks.result[pfamAccession];
            return mutationAlignerLink ?
                (<a href={mutationAlignerLink} target="_blank">Mutation Aligner</a>) : null;
        }
        else {
            return null;
        }
    }

    private domainTooltip(range:PfamDomainRange, domain:PfamDomain|undefined, pfamAcc:string):JSX.Element {
        const pfamAccession = domain ? domain.pfamAccession : pfamAcc;

        // if no domain info, then just display the accession
        const domainInfo = domain ? `${domain.name}: ${domain.description}` : pfamAccession;

        return (
            <div style={{maxWidth: 200}}>
                <div>
                    {domainInfo} ({range.pfamDomainStart} - {range.pfamDomainEnd})
                </div>
                <div>
                    <a
                        style={{marginRight:"5px"}}
                        href={`http://pfam.xfam.org/family/${pfamAccession}`}
                        target="_blank"
                    >
                        PFAM
                    </a>
                    {this.mutationAlignerLink(pfamAccession)}
                </div>
            </div>
        );
    }

    @computed private get domains(): DomainSpec[] {
        if (!this.props.store.pfamDomainData.isComplete ||
            !this.props.store.pfamDomainData.result ||
            this.props.store.pfamDomainData.result.length === 0 ||
            !this.props.store.allTranscripts.isComplete ||
            !this.props.store.allTranscripts.result ||
            !this.props.store.activeTranscript ||
            !this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript] ||
            !this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].pfamDomains ||
            this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].pfamDomains.length === 0)
        {
            return [];
        } else {
            return this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].pfamDomains.map((range:PfamDomainRange)=>{
                const domain = this.domainMap[range.pfamDomainId];
                return {
                    startCodon: range.pfamDomainStart,
                    endCodon: range.pfamDomainEnd,
                    label: domain ? domain.name : range.pfamDomainId,
                    color: this.domainColorMap[range.pfamDomainId],
                    tooltip: this.domainTooltip(range, domain, range.pfamDomainId)
                };
            });
        }
    }

    @computed private get domainColorMap(): {[pfamAccession:string]: string}
    {
        if (!this.props.store.allTranscripts.isPending &&
            this.props.store.allTranscripts.result &&
            this.props.store.activeTranscript &&
            this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript] &&
            this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].pfamDomains &&
            this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].pfamDomains.length > 0) {
            return generatePfamDomainColorMap(this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].pfamDomains);
        }
        else {
            return {};
        }
    }

    @computed private get domainMap(): {[pfamAccession:string]: PfamDomain}
    {
        if (!this.props.store.pfamDomainData.isPending && 
            this.props.store.pfamDomainData.result && 
            this.props.store.pfamDomainData.result.length > 0) {
            return _.keyBy(this.props.store.pfamDomainData.result, 'pfamAccession');
        }
        else {
            return {};
        }
    }

    private get proteinLength(): number {
        return (this.props.store.allTranscripts.result &&
            this.props.store.activeTranscript &&
            this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript] &&
            this.props.store.transcriptsByTranscriptId[this.props.store.activeTranscript].proteinLength) ||
            // Math.round(this.props.store.gene.length / 3);
            10; // TODO use a constant
    }

    private sequenceTooltip(): JSX.Element
    {
        return (
            <div style={{maxWidth: 200}}>
                <a
                    href={`http://www.uniprot.org/uniprot/${this.props.store.uniprotId.result}`}
                    target="_blank"
                >
                    {this.props.store.uniprotId.result}
                </a>
            </div>
        );
    }

    @computed private get sequence(): SequenceSpec {
        return {
            tooltip: this.sequenceTooltip()
        };
    }

    @autobind
    private getSVG(): SVGElement {
        let svg:SVGElement = $(this.divContainer).find(".lollipop-svgnode")[0] as any;
        return svg;
    }

    @computed get hugoGeneSymbol() {
        return this.props.store.gene.hugoGeneSymbol;
    }

    @computed get countRange(): [number, number] {
        if (this.lollipops.length === 0) {
            return [0,0];
        } else {
            let max = 5;
            let min = 1;
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
            handleYAxisMaxSliderChange: action((event:any)=>{
                const inputValue:string = (event.target as HTMLInputElement).value;
                const value = parseInt(inputValue, 10);
                this._yMaxInput = value < this.countRange[0] ? this.countRange[0] : value;
            }),
            handleYAxisMaxChange: action((inputValue:string)=>{
                const value = parseInt(inputValue, 10);
                this._yMaxInput = value < this.countRange[0] ? this.countRange[0] : value;
            }),
            onYMaxInputFocused:()=>{
                this.yMaxInputFocused = true;
            },
            onYMaxInputBlurred:()=>{
                this.yMaxInputFocused = false;
            },
            handleToggleLegend: action(()=>{
                this.legendShown = !this.legendShown;
            }),
            onMouseEnterPlot: action(()=>{ this.mouseInPlot = true;}),
            onMouseLeavePlot: action(()=>{ this.mouseInPlot = false;})
        };
    }

    @computed get yMaxSlider() {
        // we don't want max slider value to go over the actual max, even if the user input goes over it
        return Math.min(this.countRange[1], this._yMaxInput || this.countRange[1]);
    }

    @computed get yMaxInput() {
        // allow the user input value to go over the actual count rage
        return this._yMaxInput || this.countRange[1];
    }

    render() {
        if (this.props.store.pfamDomainData.isComplete && this.props.store.pfamDomainData.result) {
            return (
                <div
                    style={{display: "inline-block"}}
                    ref={(div:HTMLDivElement)=>this.divContainer=div}
                    onMouseEnter={this.handlers.onMouseEnterPlot}
                    onMouseLeave={this.handlers.onMouseLeavePlot}
                >
                    <LollipopMutationPlotControls
                        showControls={this.showControls}
                        hugoGeneSymbol={this.hugoGeneSymbol}
                        countRange={this.countRange}
                        onYAxisMaxSliderChange={this.handlers.handleYAxisMaxSliderChange}
                        onYAxisMaxChange={this.handlers.handleYAxisMaxChange}
                        onYMaxInputFocused={this.handlers.onYMaxInputFocused}
                        onYMaxInputBlurred={this.handlers.onYMaxInputBlurred}
                        onToggleLegend={this.handlers.handleToggleLegend}
                        yMaxSlider={this.yMaxSlider}
                        yMaxInput={this.yMaxInput}
                        trackVisibility={this.props.trackVisibility}
                        trackDataStatus={this.props.trackDataStatus}
                        onTrackVisibilityChange={this.props.onTrackVisibilityChange}
                        getSVG={this.getSVG}
                    />
                    <Collapse isOpened={this.legendShown}>
                        {this.props.legend || <DefaultLollipopPlotLegend />}
                    </Collapse>
                    <LollipopPlot
                        sequence={this.sequence}
                        lollipops={this.lollipops}
                        domains={this.domains}
                        dataStore={this.props.store.dataStore}
                        vizWidth={this.props.geneWidth}
                        vizHeight={130}
                        hugoGeneSymbol={this.hugoGeneSymbol}
                        xMax={this.proteinLength}
                        yMax={this.yMaxInput}
                        onXAxisOffset={this.props.onXAxisOffset}
                    />
                </div>
            );
        } else {
            return this.props.loadingIndicator || <i className="fa fa-spinner fa-pulse fa-2x" />;
        }
    }
}
