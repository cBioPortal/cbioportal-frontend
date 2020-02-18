import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed } from 'mobx';

import { HotspotFilterValue } from '../../filter/HotspotFilter';
import { Hotspot, IHotspotIndex } from '../../model/CancerHotspot';
import { DataFilterType } from '../../model/DataFilter';
import { Mutation } from '../../model/Mutation';
import MutationMapperStore from '../../model/MutationMapperStore';
import HotspotInfo from '../hotspot/HotspotInfo';
import {
    defaultHotspotFilter,
    filter3dHotspotsByMutations,
    filterRecurrentHotspotsByMutations,
    isHotspot,
} from '../../util/CancerHotspotsUtils';
import Track, { TrackProps } from './Track';
import { TrackItemSpec } from './TrackCircle';

import hotspotImg from '../../images/cancer-hotspots.svg';

type HotspotTrackProps = TrackProps & {
    store: MutationMapperStore;
    hotspotIndex: IHotspotIndex;
};

const HOTSPOT_ID_CLASS_PREFIX = 'cancer-hotspot-';

export function hotspotTooltip(
    mutations: Mutation[],
    hotspotIndex: IHotspotIndex,
    hotspots: Hotspot[]
) {
    const hotspotsRecurrent = filterRecurrentHotspotsByMutations(mutations, hotspotIndex);

    const hotspots3d = filter3dHotspotsByMutations(mutations, hotspotIndex);

    const hotspotCount = mutations.filter(mutation =>
        isHotspot(mutation, hotspotIndex, defaultHotspotFilter)
    ).length;

    // generate custom info
    const residues = _.uniq(hotspots.map(hotspot => hotspot.residue));
    const residuesText = <b>{`${residues.join(', ')}`}</b>;
    const pluralSuffix = residues.length > 1 ? 's' : undefined;
    const residueInfo = (
        <span>
            on residue{pluralSuffix} {residuesText}
        </span>
    );

    return (
        <HotspotInfo
            isHotspot={hotspotsRecurrent.length > 0}
            is3dHotspot={hotspots3d.length > 0}
            count={hotspotCount}
            customInfo={residueInfo}
        />
    );
}

export function getHotspotImage() {
    return <img src={hotspotImg} alt="Recurrent Hotspot Symbol" />;
}

@observer
export default class HotspotTrack extends React.Component<HotspotTrackProps, {}> {
    @computed get hotspotSpecs(): TrackItemSpec[] {
        const filteredHotspotsByProteinPosStart = this.props.store.hotspotsByPosition;

        if (!_.isEmpty(filteredHotspotsByProteinPosStart)) {
            return _.keys(filteredHotspotsByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    codon: Number(position),
                    color: '#FF9900',
                    tooltip: hotspotTooltip(
                        this.props.store.mutationsByPosition[Number(position)],
                        this.props.store.indexedHotspotData.result || {},
                        filteredHotspotsByProteinPosStart[Number(position)]
                    ),
                }));
        } else {
            return [];
        }
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{ marginRight: 2 }}>{getHotspotImage()}</span>
                Cancer Hotspots
            </span>
        );
    }

    public render() {
        return (
            <Track
                dataStore={this.props.dataStore}
                defaultFilters={[
                    {
                        type: DataFilterType.HOTSPOT,
                        values: [HotspotFilterValue.DefaultHotspot],
                    },
                ]}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.hotspotSpecs}
                idClassPrefix={HOTSPOT_ID_CLASS_PREFIX}
            />
        );
    }
}
