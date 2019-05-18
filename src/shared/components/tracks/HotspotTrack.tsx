import * as React from "react";
import * as _ from "lodash";
import {observer} from "mobx-react";
import {computed} from "mobx";
import {
    defaultHotspotFilter, filter3dHotspotsByMutations, filterRecurrentHotspotsByMutations, isHotspot
} from "shared/lib/CancerHotspotsUtils";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {Hotspot} from "shared/api/generated/GenomeNexusAPI";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import CancerHotspots from "shared/components/annotation/CancerHotspots";
import MutationMapperStore from "shared/components/mutationMapper/MutationMapperStore";
import {default as Track, TrackProps} from "./Track";
import {TrackItemSpec} from "./TrackCircle";


type HotspotTrackProps = TrackProps & {
    store: MutationMapperStore;
    hotspotIndex: IHotspotIndex;
};

const HOTSPOT_ID_CLASS_PREFIX = "cancer-hotspot-";

export function hotspotTooltip(mutations: Mutation[], hotspotIndex: IHotspotIndex, hotspots: Hotspot[])
{
    const hotspotsRecurrent = filterRecurrentHotspotsByMutations(mutations, hotspotIndex);

    const hotspots3d = filter3dHotspotsByMutations(mutations, hotspotIndex);

    const hotspotCount = mutations
        .filter(mutation => isHotspot(mutation, hotspotIndex, defaultHotspotFilter))
        .length;

    // generate custom info
    const residues = _.uniq(hotspots.map(hotspot => hotspot.residue));
    const residuesText = <b>{`${residues.join(", ")}`}</b>;
    const pluralSuffix = residues.length > 1 ? "s" : undefined;
    const residueInfo = <span>on residue{pluralSuffix} {residuesText}</span>;

    // generate the tooltip
    return CancerHotspots.hotspotInfo(
        hotspotsRecurrent.length > 0,
        hotspots3d.length > 0,
        hotspotCount,
        residueInfo);
}

export function getHotspotImage() {
    const hotspotsImgSrc = require("../annotation/images/cancer-hotspots.svg");

    return <img src={hotspotsImgSrc} alt='Recurrent Hotspot Symbol'/>;
}

@observer
export default class HotspotTrack extends React.Component<HotspotTrackProps, {}>
{
    @computed get hotspotSpecs(): TrackItemSpec[] {
        const filteredHotspotsByProteinPosStart = this.props.store.filteredHotspotsByProteinPosStart;

        if(!_.isEmpty(filteredHotspotsByProteinPosStart)) {
            return _.keys(filteredHotspotsByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    codon: Number(position),
                    color: "#FF9900",
                    tooltip: hotspotTooltip(
                        this.props.store.filteredMutationsByPosition[Number(position)],
                        this.props.store.indexedHotspotData.result || {},
                        filteredHotspotsByProteinPosStart[Number(position)])
                }));
        }
        else {
            return [];
        }
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{marginRight: 2}}>
                    {getHotspotImage()}
                </span>
                Cancer Hotspots
            </span>
        );
    }

    public render()
    {
        return (
            <Track
                dataStore={this.props.dataStore}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.hotspotSpecs}
                dataHighlightFilter={(d: Mutation[]) => isHotspot(d[0], this.props.hotspotIndex, defaultHotspotFilter)}
                dataSelectFilter={(d: Mutation[]) => isHotspot(d[0], this.props.hotspotIndex, defaultHotspotFilter)}
                idClassPrefix={HOTSPOT_ID_CLASS_PREFIX}
            />
        );
    }
}