import * as React from "react";
import * as _ from "lodash";
import {observer} from "mobx-react";
import {computed} from "mobx";
import HotspotTrack, {hotspotTooltip} from "./HotspotTrack";
import OncoKbTrack from "./OncoKbTrack";
import {TrackItemSpec} from "./TrackCircle";
import OncoKbTrackTooltip from "./OncoKbTrackTooltip";
import {TrackNames, TrackVisibility} from "./TrackSelector";
import MutationMapperStore from "../mutationMapper/MutationMapperStore";

type TrackPanelProps = {
    store: MutationMapperStore;
    geneWidth: number;
    proteinLength?: number;
    geneXOffset?: number;
    maxHeight: number;
    trackVisibility?: TrackVisibility;
};

@observer
export default class TrackPanel extends React.Component<TrackPanelProps, {}>
{
    constructor(props: TrackPanelProps) {
        super(props);
    }

    @computed get proteinLength() {
        const proteinLength = this.props.proteinLength || 0;
        return Math.max(proteinLength, 1);
    }

    @computed get hotspotSpecs(): TrackItemSpec[] {
        if(!_.isEmpty(this.props.store.filteredHotspotsByProteinPosStart)) {
            return _.keys(this.props.store.filteredHotspotsByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    codon: Number(position),
                    color: "#FF9900",
                    tooltip: hotspotTooltip(
                        this.props.store.filteredMutationsByPosition[Number(position)],
                        this.props.store.indexedHotspotData.result || {},
                        this.props.store.filteredHotspotsByProteinPosStart[Number(position)])
                }));
        }
        else {
            return [];
        }
    }

    @computed get oncoKbSpecs(): TrackItemSpec[] {
        if(!_.isEmpty(this.props.store.filteredOncoKbDataByProteinPosStart)) {
            return _.keys(this.props.store.filteredOncoKbDataByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    codon: Number(position),
                    color: "#007FFF",
                    tooltip: (
                        <OncoKbTrackTooltip
                            mutations={this.props.store.filteredMutationsByPosition[Number(position)]}
                            indicatorData={this.props.store.filteredOncoKbDataByProteinPosStart[Number(position)]}
                            oncoKbData={
                                this.props.store.oncoKbData.result instanceof Error ?
                                    undefined : this.props.store.oncoKbData.result
                            }
                            hugoGeneSymbol={this.props.store.gene.hugoGeneSymbol}
                        />
                    )
                }));
        }
        else {
            return [];
        }
    }

    public render() {
        return (
            <div
                style={{
                    overflowY: "hidden",
                    maxHeight: this.props.maxHeight,
                    position: "relative"
                }}
            >
                {
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackNames.CancerHotspots] === 'visible') &&
                    <HotspotTrack
                        dataStore={this.props.store.dataStore}
                        hotspotIndex={this.props.store.indexedHotspotData.result || {}}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        trackItems={this.hotspotSpecs}
                        proteinLength={this.proteinLength}
                    />
                }
                {
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackNames.OncoKB] === 'visible') &&
                    <OncoKbTrack
                        dataStore={this.props.store.dataStore}
                        oncoKbData={
                            this.props.store.oncoKbData &&
                            this.props.store.oncoKbData.result &&
                            !(this.props.store.oncoKbData.result instanceof Error) ?
                            this.props.store.oncoKbData.result : undefined
                        }
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        trackItems={this.oncoKbSpecs}
                        proteinLength={this.proteinLength}
                    />
                }
            </div>
        );
    }
}