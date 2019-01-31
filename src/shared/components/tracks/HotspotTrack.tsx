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
import {default as Track, TrackProps} from "./Track";


type HotspotTrackProps = TrackProps & {
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
    constructor(props: HotspotTrackProps) {
        super(props);
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
                trackItems={this.props.trackItems}
                dataHighlightFilter={(d: Mutation[]) => isHotspot(d[0], this.props.hotspotIndex, defaultHotspotFilter)}
                dataSelectFilter={(d: Mutation[]) => isHotspot(d[0], this.props.hotspotIndex, defaultHotspotFilter)}
                idClassPrefix={HOTSPOT_ID_CLASS_PREFIX}
            />
        );
    }
}