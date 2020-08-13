import * as React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import { MobxCache } from 'cbioportal-utils';

import MutationMapperStore from '../../model/MutationMapperStore';
import { TrackName, TrackVisibility } from './TrackSelector';
import HotspotTrack from './HotspotTrack';
import OncoKbTrack from './OncoKbTrack';
import PtmTrack from './PtmTrack';

import './defaultTrackTooltipTable.scss';

type TrackPanelProps = {
    store: MutationMapperStore;
    pubMedCache?: MobxCache;
    geneWidth: number;
    proteinLength?: number;
    geneXOffset?: number;
    maxHeight?: number;
    trackVisibility?: TrackVisibility;
    tracks?: TrackName[];
};

@observer
export default class TrackPanel extends React.Component<TrackPanelProps, {}> {
    public static defaultProps: Partial<TrackPanelProps> = {
        tracks: [TrackName.CancerHotspots, TrackName.OncoKB, TrackName.PTM],
    };

    constructor(props: TrackPanelProps) {
        super(props);
    }

    @computed get proteinLength() {
        const proteinLength = this.props.proteinLength || 0;
        return Math.max(proteinLength, 1);
    }

    get availableTracks(): { [trackName: string]: JSX.Element | null } {
        return {
            [TrackName.CancerHotspots]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.CancerHotspots] ===
                    'visible' ? (
                    <HotspotTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        hotspotIndex={
                            this.props.store.indexedHotspotData.result || {}
                        }
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                ) : null,
            [TrackName.OncoKB]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.OncoKB] === 'visible' ? (
                    <OncoKbTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                ) : null,
            [TrackName.PTM]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.PTM] === 'visible' ? (
                    <PtmTrack
                        store={this.props.store}
                        pubMedCache={this.props.pubMedCache}
                        ensemblTranscriptId={
                            this.props.store.activeTranscript &&
                            this.props.store.activeTranscript.result
                                ? this.props.store.activeTranscript.result
                                : undefined
                        }
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                ) : null,
        };
    }

    public render() {
        return (
            <div
                style={{
                    overflowY: 'hidden',
                    maxHeight: this.props.maxHeight,
                    position: 'relative',
                }}
            >
                {this.props
                    .tracks!.map(t => this.availableTracks[t])
                    .filter(e => e !== undefined && e !== null)}
            </div>
        );
    }
}
