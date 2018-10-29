import * as React from "react";
import * as _ from "lodash";
import {observer} from "mobx-react";
import {computed} from "mobx";
import HotspotTrack, {hotspotTooltip} from "./HotspotTrack";
import {Hotspot} from "shared/api/generated/GenomeNexusAPI";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import MutationMapperStore from "../mutationMapper/MutationMapperStore";
import {groupMutationsByProteinStartPos} from "shared/lib/MutationUtils";
import {defaultHotspotFilter, groupHotspotsByMutations} from "shared/lib/CancerHotspotsUtils";
import {TrackItemSpec} from "./TrackCircle";

type TrackPanelProps = {
    store: MutationMapperStore;
    geneWidth: number;
    proteinLength?: number;
    geneXOffset?: number;
    maxHeight: number;
};

@observer
export default class TrackPanel extends React.Component<TrackPanelProps, {}> {

    private handlers:any;

    constructor(props: TrackPanelProps) {
        super(props);

        this.handlers = {
            tracksDivRef: () => {

            },
            onScroll: () => {
                // if (this.mainDiv && this.isExpanded) {
                //     this._scrollY = this.mainDiv.scrollTop;
                // }
            },
        };
    }

    @computed get proteinLength() {
        const proteinLength = this.props.proteinLength || 0;
        return Math.max(proteinLength, 1);
    }

    @computed get mutationsByPosition(): {[pos: number]: Mutation[]} {
        return groupMutationsByProteinStartPos(this.props.store.dataStore.sortedFilteredData);
    }

    @computed get filteredHotspotsByProteinPosStart(): {[pos: number]: Hotspot[]}
    {
        if (this.props.store.indexedHotspotData.result)
        {
            return groupHotspotsByMutations(
                this.mutationsByPosition, this.props.store.indexedHotspotData.result, defaultHotspotFilter);
        }
        else {
            return {};
        }
    }

    @computed get hotspotSpecs(): TrackItemSpec[] {
        if(!_.isEmpty(this.filteredHotspotsByProteinPosStart)) {
            return _.keys(this.filteredHotspotsByProteinPosStart).map(position => ({
                codon: Number(position),
                color: "#FF9900",
                tooltip: hotspotTooltip(
                    this.mutationsByPosition[Number(position)],
                    this.props.store.indexedHotspotData.result || {},
                    this.filteredHotspotsByProteinPosStart[Number(position)])
            }));
        }
        else {
            return [];
        }
    }

    public render() {
        return (
            <div
                ref={this.handlers.tracksDivRef}
                style={{
                    overflowY: "hidden",
                    maxHeight: this.props.maxHeight,
                    position: "relative"
                }}
                onScroll={this.handlers.onScroll}
            >
                {
                    !_.isEmpty(this.filteredHotspotsByProteinPosStart) &&
                    <HotspotTrack
                        dataStore={this.props.store.dataStore}
                        hotspotIndex={this.props.store.indexedHotspotData.result || {}}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        trackItems={this.hotspotSpecs}
                        proteinLength={this.proteinLength}
                    />
                }
            </div>
        );
    }
}