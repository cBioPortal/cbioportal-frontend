import autobind from 'autobind-decorator';
import { MobxCache, Mutation } from 'cbioportal-utils';
import { PfamDomain, PfamDomainRange } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Collapse } from 'react-collapse';

import $ from 'jquery';

import { DomainSpec } from '../../model/DomainSpec';
import { LollipopPlotControlsConfig } from '../../model/LollipopPlotControlsConfig';
import { LollipopPlacement, LollipopSpec } from '../../model/LollipopSpec';
import { MutationMapperStore } from '../../model/MutationMapperStore';
import { SequenceSpec } from '../../model/SequenceSpec';
import { DefaultLollipopPlotControlsConfig } from '../../store/DefaultLollipopPlotControlsConfig';
import {
    calcCountRange,
    calcYMaxInput,
    getYAxisMaxInputValue,
    lollipopLabelText,
    lollipopLabelTextAnchor,
} from '../../util/LollipopPlotUtils';
import {
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    getColorForProteinImpactType,
} from '../../util/MutationTypeUtils';
import { generatePfamDomainColorMap } from '../../util/PfamUtils';
import { initDefaultTrackVisibility } from '../../util/TrackUtils';
import DefaultLollipopPlotLegend from './DefaultLollipopPlotLegend';
import LollipopPlot from '../lollipopPlot/LollipopPlot';
import LollipopMutationPlotControls from './LollipopMutationPlotControls';
import {
    TrackDataStatus,
    TrackName,
    TrackVisibility,
} from '../track/TrackSelector';
import TrackPanel from '../track/TrackPanel';

import './lollipopMutationPlot.scss';
import DomainTooltip from '../lollipopPlot/DomainTooltip';

const DEFAULT_PROTEIN_LENGTH = 10;

export type LollipopMutationPlotProps = {
    store: MutationMapperStore;
    controlsConfig?: LollipopPlotControlsConfig;
    pubMedCache?: MobxCache;
    mutationAlignerCache?: MobxCache<string>;
    getLollipopColor?: (mutations: Partial<Mutation>[]) => string;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    getDownloadData?: () => string;
    topYAxisSymbol?: string;
    bottomYAxisSymbol?: string;
    topYAxisDefaultMax?: number;
    topYAxisDefaultMin?: number;
    yMaxFractionDigits?: number;
    yMaxLabelPostfix?: string;
    showYAxis?: boolean;
    yAxisSameScale?: boolean;
    bottomYAxisDefaultMax?: number;
    bottomYAxisDefaultMin?: number;
    yAxisLabelPadding?: number;
    lollipopTooltipCountInfo?: (
        count: number,
        mutations?: Partial<Mutation>[]
    ) => JSX.Element;
    customControls?: JSX.Element;
    onXAxisOffset?: (offset: number) => void;
    geneWidth: number;
    vizHeight?: number;
    trackVisibility?: TrackVisibility;
    tracks?: TrackName[];
    trackDataStatus?: TrackDataStatus;
    showTrackSelector?: boolean;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;
    autoHideControls?: boolean;
    showYMaxSlider?: boolean;
    showLegendToggle?: boolean;
    showDownloadControls?: boolean;
    filterResetPanel?: JSX.Element;
    legend?: JSX.Element;
    loadingIndicator?: JSX.Element;
};

@observer
export default class LollipopMutationPlot extends React.Component<
    LollipopMutationPlotProps,
    {}
> {
    public static defaultProps: Partial<LollipopMutationPlotProps> = {
        yMaxFractionDigits: 1,
        yAxisSameScale: true,
    };

    @observable private mouseInPlot: boolean = true;
    @observable private yMaxInputFocused: boolean = false;
    @observable private geneXOffset: number;
    @observable
    private _trackVisibility: TrackVisibility = initDefaultTrackVisibility();

    private handlers: any;
    private divContainer: HTMLDivElement;

    @computed private get showControls(): boolean {
        return this.props.autoHideControls
            ? this.yMaxInputFocused || this.mouseInPlot
            : true;
    }

    @computed private get trackVisibility(): TrackVisibility {
        return this.props.trackVisibility || this._trackVisibility;
    }

    @computed private get controlsConfig(): LollipopPlotControlsConfig {
        return (
            this.props.controlsConfig || new DefaultLollipopPlotControlsConfig()
        );
    }

    private lollipopTooltip(
        mutationsAtPosition: Mutation[],
        countsByPosition: { [pos: number]: number }
    ): JSX.Element {
        const codon = mutationsAtPosition[0].proteinPosStart;
        const count = countsByPosition[codon];
        const countInfo = this.props.lollipopTooltipCountInfo ? (
            this.props.lollipopTooltipCountInfo(count, mutationsAtPosition)
        ) : (
            <strong>
                {count} mutation{`${count !== 1 ? 's' : ''}`}
            </strong>
        );
        const label = lollipopLabelText(mutationsAtPosition);

        return (
            <div>
                {countInfo}
                <br />
                <span>AA Change: {label}</span>
            </div>
        );
    }

    @computed
    protected get groups(): string[] | undefined {
        if (this.props.store.groupedMutationsByPosition.length > 0) {
            return this.props.store.groupedMutationsByPosition.map(
                g => g.group
            );
        } else {
            return undefined;
        }
    }

    @computed
    protected get lollipops(): LollipopSpec[] {
        let lollipops: LollipopSpec[] = [];

        // ignore grouped mutations with less than 2 groups
        // also ignore other groups except first and second
        if (this.props.store.groupedMutationsByPosition.length > 1) {
            const groupTop = this.props.store.groupedMutationsByPosition[0]
                .group;
            const mutationsTop = this.props.store.groupedMutationsByPosition[0]
                .mutations;
            const countsTop = this.props.store
                .uniqueGroupedMutationCountsByPosition[0].counts;
            lollipops = this.getLollipopSpecs(
                mutationsTop,
                countsTop,
                groupTop,
                LollipopPlacement.TOP
            );

            const groupBottom = this.props.store.groupedMutationsByPosition[1]
                .group;
            const mutationsBottom = this.props.store
                .groupedMutationsByPosition[1].mutations;
            const countsBottom = this.props.store
                .uniqueGroupedMutationCountsByPosition[1].counts;
            lollipops = lollipops.concat(
                this.getLollipopSpecs(
                    mutationsBottom,
                    countsBottom,
                    groupBottom,
                    LollipopPlacement.BOTTOM
                )
            );
        } else if (
            Object.keys(this.props.store.mutationsByPosition).length > 0
        ) {
            return this.getLollipopSpecs(
                this.props.store.mutationsByPosition,
                this.props.store.uniqueMutationCountsByPosition
            );
        }

        return lollipops;
    }

    protected getLollipopSpecs(
        mutationsByPosition: { [pos: number]: Mutation[] },
        countsByPosition: { [pos: number]: number },
        group?: string,
        placement?: LollipopPlacement
    ): LollipopSpec[] {
        // positionMutations: Mutation[][], in descending order of mutation count
        const positionMutations = Object.keys(mutationsByPosition)
            .map(position => mutationsByPosition[parseInt(position, 10)])
            .sort((x, y) =>
                countsByPosition[x[0].proteinPosStart] <
                countsByPosition[y[0].proteinPosStart]
                    ? 1
                    : -1
            );

        // maxCount: max number of mutations at a position
        const maxCount =
            positionMutations && positionMutations[0]
                ? countsByPosition[positionMutations[0][0].proteinPosStart]
                : 0;

        // numLabelCandidates: number of positions with maxCount mutations
        let numLabelCandidates = positionMutations
            ? positionMutations.findIndex(
                  mutations =>
                      countsByPosition[mutations[0].proteinPosStart] !==
                      maxCount
              )
            : -1;

        if (numLabelCandidates === -1) {
            numLabelCandidates = positionMutations
                ? positionMutations.length
                : 0;
        }

        // now we decide whether we'll show a label at all
        const maxAllowedTies = 2;
        const maxLabels = 1;
        const minMutationsToShowLabel = 0;

        let numLabelsToShow;
        if (
            numLabelCandidates > maxLabels && // if there are more candidates than we can show,
            numLabelCandidates > maxAllowedTies
        ) {
            // and more candidates than are allowed for a tie
            numLabelsToShow = 0; // then we dont show any label
        } else {
            numLabelsToShow = Math.min(numLabelCandidates, maxLabels); // otherwise, we show labels
        }

        const specs: LollipopSpec[] = [];

        for (let i = 0; i < positionMutations.length; i++) {
            const mutations = positionMutations[i];
            const codon = mutations[0].proteinPosStart;
            const mutationCount = countsByPosition[codon];

            if (
                isNaN(codon) ||
                codon < 0 ||
                (this.props.store.allTranscripts.isComplete &&
                    this.props.store.allTranscripts.result &&
                    this.props.store.activeTranscript &&
                    this.props.store.activeTranscript.isComplete &&
                    this.props.store.activeTranscript.result &&
                    this.props.store.transcriptsByTranscriptId[
                        this.props.store.activeTranscript.result
                    ] &&
                    // we want to show the stop codon too (so we allow proteinLength +1 as well)
                    codon >
                        this.props.store.transcriptsByTranscriptId[
                            this.props.store.activeTranscript.result
                        ].proteinLength +
                            1)
            ) {
                // invalid position
                continue;
            }
            let label:
                | {
                      text: string;
                      textAnchor?: string;
                      fontSize?: number;
                      fontFamily?: string;
                  }
                | undefined;
            if (
                i < numLabelsToShow &&
                mutationCount > minMutationsToShowLabel
            ) {
                const fontSize = 10;
                const fontFamily = 'arial';
                // limit number of protein changes to 3
                const text = lollipopLabelText(mutations, 3);
                const textAnchor = lollipopLabelTextAnchor(
                    text,
                    codon,
                    fontFamily,
                    fontSize,
                    this.props.geneWidth,
                    this.proteinLength
                );
                label = { text, textAnchor, fontSize, fontFamily };
            } else {
                label = undefined;
            }
            specs.push({
                codon,
                group,
                placement,
                count: mutationCount,
                tooltip: this.lollipopTooltip(mutations, countsByPosition),
                color: this.props.getLollipopColor
                    ? this.props.getLollipopColor(mutations)
                    : getColorForProteinImpactType(
                          mutations,
                          DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
                          this.props.getMutationCount
                      ),
                label,
            });
        }

        return specs;
    }

    @computed private get domains(): DomainSpec[] {
        if (
            !this.props.store.pfamDomainData.isComplete ||
            !this.props.store.pfamDomainData.result ||
            this.props.store.pfamDomainData.result.length === 0 ||
            !this.props.store.allTranscripts.isComplete ||
            !this.props.store.allTranscripts.result ||
            !(
                this.props.store.activeTranscript &&
                this.props.store.activeTranscript.isComplete
            ) ||
            !this.props.store.activeTranscript.result ||
            !this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ] ||
            !this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ].pfamDomains ||
            this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ].pfamDomains.length === 0
        ) {
            return [];
        } else {
            return this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ].pfamDomains.map((range: PfamDomainRange) => {
                const domain = this.domainMap[range.pfamDomainId];
                return {
                    startCodon: range.pfamDomainStart,
                    endCodon: range.pfamDomainEnd,
                    label: domain ? domain.name : range.pfamDomainId,
                    color: this.domainColorMap[range.pfamDomainId],
                    tooltip: (
                        <DomainTooltip
                            range={range}
                            domain={domain}
                            pfamDomainId={range.pfamDomainId}
                            mutationAlignerCache={
                                this.props.mutationAlignerCache
                            }
                        />
                    ),
                };
            });
        }
    }

    @computed private get domainColorMap(): {
        [pfamAccession: string]: string;
    } {
        if (
            !this.props.store.allTranscripts.isPending &&
            this.props.store.allTranscripts.result &&
            this.props.store.activeTranscript &&
            !this.props.store.activeTranscript.isPending &&
            this.props.store.activeTranscript.result &&
            this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ] &&
            this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ].pfamDomains &&
            this.props.store.transcriptsByTranscriptId[
                this.props.store.activeTranscript.result
            ].pfamDomains.length > 0
        ) {
            return generatePfamDomainColorMap(
                this.props.store.transcriptsByTranscriptId[
                    this.props.store.activeTranscript.result
                ].pfamDomains
            );
        } else {
            return {};
        }
    }

    @computed private get domainMap(): { [pfamAccession: string]: PfamDomain } {
        if (
            !this.props.store.pfamDomainData.isPending &&
            this.props.store.pfamDomainData.result &&
            this.props.store.pfamDomainData.result.length > 0
        ) {
            return _.keyBy(
                this.props.store.pfamDomainData.result,
                'pfamAccession'
            );
        } else {
            return {};
        }
    }

    private get proteinLength(): number {
        return (
            (this.props.store.allTranscripts.result &&
                this.props.store.activeTranscript &&
                this.props.store.activeTranscript.result &&
                this.props.store.transcriptsByTranscriptId[
                    this.props.store.activeTranscript.result
                ] &&
                this.props.store.transcriptsByTranscriptId[
                    this.props.store.activeTranscript.result
                ].proteinLength) ||
            // Math.round(this.props.store.gene.length / 3);
            DEFAULT_PROTEIN_LENGTH
        );
    }

    private sequenceTooltip(): JSX.Element {
        return (
            <div style={{ maxWidth: 200 }}>
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
            tooltip: this.sequenceTooltip(),
        };
    }

    @autobind
    private getSVG(): SVGElement {
        let svg: SVGElement = $(this.divContainer).find(
            '.lollipop-svgnode'
        )[0] as any;
        return svg;
    }

    @computed get hugoGeneSymbol() {
        return this.props.store.gene.hugoGeneSymbol;
    }

    @computed get countRange(): [number, number] {
        return calcCountRange(
            this.lollipops.filter(
                l => l.placement !== LollipopPlacement.BOTTOM
            ),
            this.props.topYAxisDefaultMax,
            this.props.topYAxisDefaultMin
        );
    }

    @computed get bottomCountRange(): [number, number] {
        return calcCountRange(
            this.lollipops.filter(
                l => l.placement === LollipopPlacement.BOTTOM
            ),
            this.props.bottomYAxisDefaultMax,
            this.props.bottomYAxisDefaultMin
        );
    }

    constructor(props: LollipopMutationPlotProps) {
        super(props);

        this.handlers = {
            handleYAxisMaxSliderChange: action(
                (value: number) =>
                    (this.controlsConfig.yMaxInput = calcYMaxInput(
                        value,
                        this.yMaxStep,
                        this.countRange,
                        this.bottomCountRange,
                        this.props.yAxisSameScale
                    ))
            ),
            handleYAxisMaxChange: action(
                (input: string) =>
                    (this.controlsConfig.yMaxInput = getYAxisMaxInputValue(
                        this.yMaxStep,
                        input
                    ))
            ),
            handleBottomYAxisMaxSliderChange: action(
                (value: number) =>
                    (this.controlsConfig.bottomYMaxInput = calcYMaxInput(
                        value,
                        this.yMaxStep,
                        this.bottomCountRange,
                        this.countRange,
                        this.props.yAxisSameScale
                    ))
            ),
            handleBottomYAxisMaxChange: action(
                (input: string) =>
                    (this.controlsConfig.bottomYMaxInput = getYAxisMaxInputValue(
                        this.yMaxStep,
                        input
                    ))
            ),
            onYMaxInputFocused: () => {
                this.yMaxInputFocused = true;
            },
            onYMaxInputBlurred: () => {
                this.yMaxInputFocused = false;
            },
            handleToggleLegend: action(() => {
                this.controlsConfig.legendShown = !this.controlsConfig
                    .legendShown;
            }),
            onMouseEnterPlot: action(() => {
                this.mouseInPlot = true;
            }),
            onMouseLeavePlot: action(() => {
                this.mouseInPlot = false;
            }),
        };
    }

    @computed get yMaxSlider() {
        return this.yMaxInput;
    }

    @computed get yMaxStep() {
        return Math.pow(10, -(this.props.yMaxFractionDigits || 0));
    }

    @computed get yMaxSliderStep() {
        return this.countRange[0] < 1 ? this.yMaxStep : 1;
    }

    @computed get bottomYMaxSlider() {
        return this.bottomYMaxInput;
    }

    @computed get bottomYMaxSliderStep() {
        return this.bottomCountRange[0] < 1 ? this.yMaxStep : 1;
    }

    @computed get yMaxInput() {
        return calcYMaxInput(
            this.controlsConfig.yMaxInput,
            this.yMaxStep,
            this.countRange,
            this.bottomCountRange,
            this.props.yAxisSameScale
        );
    }

    @computed get bottomYMaxInput() {
        return calcYMaxInput(
            this.controlsConfig.bottomYMaxInput,
            this.yMaxStep,
            this.bottomCountRange,
            this.countRange,
            this.props.yAxisSameScale
        );
    }

    @autobind
    @action
    private onXAxisOffset(offset: number) {
        this.geneXOffset = offset;

        if (this.props.onXAxisOffset) {
            this.props.onXAxisOffset(offset);
        }
    }

    @autobind
    @action
    protected onTrackVisibilityChange(selectedTrackNames: string[]) {
        if (this.props.onTrackVisibilityChange) {
            this.props.onTrackVisibilityChange(selectedTrackNames);
        } else {
            // clear visibility
            Object.keys(this.trackVisibility).forEach(
                trackName => (this.trackVisibility[trackName] = 'hidden')
            );

            // reset visibility values for the visible ones
            selectedTrackNames.forEach(
                trackName => (this.trackVisibility[trackName] = 'visible')
            );
        }
    }

    render() {
        if (
            this.props.store.pfamDomainData.isComplete &&
            this.props.store.pfamDomainData.result
        ) {
            return (
                <div
                    style={{ display: 'inline-block' }}
                    ref={(div: HTMLDivElement) => (this.divContainer = div)}
                    onMouseEnter={this.handlers.onMouseEnterPlot}
                    onMouseLeave={this.handlers.onMouseLeavePlot}
                >
                    <LollipopMutationPlotControls
                        showControls={this.showControls}
                        showYMaxSlider={this.props.showYMaxSlider}
                        showLegendToggle={this.props.showLegendToggle}
                        showDownloadControls={this.props.showDownloadControls}
                        hugoGeneSymbol={this.hugoGeneSymbol}
                        countRange={this.countRange}
                        bottomCountRange={this.bottomCountRange}
                        onYAxisMaxSliderChange={
                            this.handlers.handleYAxisMaxSliderChange
                        }
                        onYAxisMaxChange={this.handlers.handleYAxisMaxChange}
                        onBottomYAxisMaxSliderChange={
                            this.handlers.handleBottomYAxisMaxSliderChange
                        }
                        onBottomYAxisMaxChange={
                            this.handlers.handleBottomYAxisMaxChange
                        }
                        onYMaxInputFocused={this.handlers.onYMaxInputFocused}
                        onYMaxInputBlurred={this.handlers.onYMaxInputBlurred}
                        onToggleLegend={this.handlers.handleToggleLegend}
                        yMaxSlider={this.yMaxSlider}
                        yMaxSliderStep={this.yMaxSliderStep}
                        yMaxInput={this.yMaxInput}
                        yAxisSameScale={this.props.yAxisSameScale}
                        bottomYMaxSlider={this.bottomYMaxSlider}
                        bottomYMaxSliderStep={this.bottomYMaxSliderStep}
                        bottomYMaxInput={this.bottomYMaxInput}
                        customControls={this.props.customControls}
                        filterResetPanel={this.props.filterResetPanel}
                        trackVisibility={this.trackVisibility}
                        tracks={this.props.tracks}
                        trackDataStatus={this.props.trackDataStatus}
                        showTrackSelector={this.props.showTrackSelector}
                        onTrackVisibilityChange={this.onTrackVisibilityChange}
                        getSVG={this.getSVG}
                        getDownloadData={this.props.getDownloadData}
                    />
                    <Collapse isOpened={this.controlsConfig.legendShown}>
                        {this.props.legend || <DefaultLollipopPlotLegend />}
                    </Collapse>
                    <LollipopPlot
                        sequence={this.sequence}
                        lollipops={this.lollipops}
                        domains={this.domains}
                        dataStore={this.props.store.dataStore}
                        vizWidth={this.props.geneWidth}
                        vizHeight={this.props.vizHeight}
                        hugoGeneSymbol={this.hugoGeneSymbol}
                        xMax={this.proteinLength}
                        yMax={this.yMaxInput}
                        yMaxFractionDigits={
                            this.yMaxSliderStep < 1
                                ? this.props.yMaxFractionDigits
                                : undefined
                        }
                        yMaxLabelPostfix={this.props.yMaxLabelPostfix}
                        yAxisLabelPadding={this.props.yAxisLabelPadding}
                        showYAxis={this.props.showYAxis}
                        bottomYMax={this.bottomYMaxInput}
                        onXAxisOffset={this.onXAxisOffset}
                        topYAxisSymbol={this.props.topYAxisSymbol}
                        bottomYAxisSymbol={this.props.bottomYAxisSymbol}
                        groups={this.groups}
                    />
                    <TrackPanel
                        store={this.props.store}
                        geneWidth={this.props.geneWidth}
                        tracks={this.props.tracks}
                        trackVisibility={this.trackVisibility}
                        pubMedCache={this.props.pubMedCache}
                        proteinLength={this.proteinLength}
                        geneXOffset={this.geneXOffset}
                    />
                </div>
            );
        } else if (
            this.props.store.canonicalTranscript.isComplete &&
            this.props.store.canonicalTranscript.result === undefined
        ) {
            return (
                <span>
                    <i className="fa fa-exclamation-triangle text-danger" /> No
                    Transcript found for {this.hugoGeneSymbol}
                </span>
            );
        } else {
            return (
                this.props.loadingIndicator || (
                    <i className="fa fa-spinner fa-pulse fa-2x" />
                )
            );
        }
    }
}
