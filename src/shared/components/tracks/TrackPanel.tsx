import * as React from "react";
import {observer} from "mobx-react";
import {computed} from "mobx";
import MutationMapperStore from "shared/components/mutationMapper/MutationMapperStore";
import PubMedCache from "shared/cache/PubMedCache";
import HotspotTrack from "./HotspotTrack";
import OncoKbTrack from "./OncoKbTrack";
import {TrackNames, TrackVisibility} from "./TrackSelector";
import PtmTrack from "./PtmTrack";

type TrackPanelProps = {
    store: MutationMapperStore;
    pubMedCache?: PubMedCache;
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
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackNames.CancerHotspots] === 'visible') &&
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
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackNames.OncoKB] === 'visible') &&
                    <OncoKbTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        oncoKbData={
                            this.props.store.oncoKbData &&
                            this.props.store.oncoKbData.result &&
                            !(this.props.store.oncoKbData.result instanceof Error) ?
                            this.props.store.oncoKbData.result : undefined
                        }
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                }
                {
                    (!this.props.trackVisibility || this.props.trackVisibility[TrackNames.PTM] === 'visible') &&
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