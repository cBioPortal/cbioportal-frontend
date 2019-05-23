import * as React from "react";
import {observer} from "mobx-react";
import {computed} from "mobx";

import {MobxCache} from "./model/MobxCache";
import MutationMapperStore from "./model/MutationMapperStore";
import {TrackName, TrackVisibility} from "./TrackSelector";
import HotspotTrack from "./HotspotTrack";
import OncoKbTrack from "./OncoKbTrack";
import PtmTrack from "./PtmTrack";

import './defaultTrackTooltipTable.scss';

type TrackPanelProps = {
    store: MutationMapperStore;
    pubMedCache?: MobxCache;
    geneWidth: number;
    proteinLength?: number;
    geneXOffset?: number;
    maxHeight?: number;
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
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackName.CancerHotspots] === 'visible') &&
                    <HotspotTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        hotspotIndex={this.props.store.indexedHotspotData.result || {}}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                }
                {
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackName.OncoKB] === 'visible') &&
                    <OncoKbTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                }
                {
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackName.PTM] === 'visible') &&
                    <PtmTrack
                        store={this.props.store}
                        pubMedCache={this.props.pubMedCache}
                        ensemblTranscriptId={this.props.store.activeTranscript}
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                }
            </div>
        );
    }
}
