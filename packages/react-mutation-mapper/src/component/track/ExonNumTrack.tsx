import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';

import { OncoKbFilterValue } from '../../filter/OncoKbFilter';
import { DataFilterType } from '../../model/DataFilter';
import MutationMapperStore from '../../model/MutationMapperStore';
import { OncoKbTrackTooltip } from './OncoKbTrackTooltip';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec } from './TrackItem';
import { Mutation } from 'cbioportal-utils';

import oncoKbImg from '../../images/oncogenic-only.svg';
import MutationMapper from '../mutationMapper/MutationMapper';

type ExonNumTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
};

const ONCOKB_ID_CLASS_PREFIX = 'onco-kb-';

export function getOncoKbImage() {
    return <img src={oncoKbImg} alt="OncoKB Oncogenic Symbol" />;
}

@observer
export default class ExonNumTrack extends React.Component<
    ExonNumTrackProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get exonNumSpecs(): TrackItemSpec[] {
        let currentTranscriptId = this.props.store.activeTranscript?.result;
        let data: number[][] = [];
        if (currentTranscriptId !== undefined) {
            let currentTranscript = this.props.store.transcriptsByTranscriptId[
                currentTranscriptId
            ];
            if (currentTranscript !== undefined) {
                let exonArr = currentTranscript['exons'];
                let utrArr = currentTranscript['utrs'];
                if (utrArr === undefined) {
                    utrArr = [];
                }
                let totLength = 0;
                let exonLocList: number[][] = [];
                // loop through exons
                for (let i = 0; i < exonArr.length; i++) {
                    let exonStart = exonArr[i].exonStart;
                    let exonEnd = exonArr[i].exonEnd;
                    let weDidIt = false;
                    for (let j = 0; j < utrArr.length; j++) {
                        let currentUtr = utrArr[j];
                        // if utr start is within exon, add only translated length of exon to exonLocList
                        if (
                            exonStart <= currentUtr.start &&
                            exonEnd >= currentUtr.start
                        ) {
                            weDidIt = true;
                            let aaLength =
                                (currentUtr.start -
                                    exonStart +
                                    (exonEnd - currentUtr.end)) /
                                3;
                            if (aaLength !== 0) {
                                exonLocList.push([exonArr[i].rank, aaLength]);
                                totLength += aaLength;
                            }
                            break;
                        }
                    }
                    // if there are no utr start sites within exon
                    if (!weDidIt) {
                        let aaLength = (exonEnd - exonStart + 1) / 3;
                        exonLocList.push([exonArr[i].rank, aaLength]);
                        totLength += aaLength;
                    }
                }
                exonLocList.sort((n1, n2) => n1[0] - n2[0]);
                let propSoFar = 0;
                for (let i = 0; i < exonLocList.length; i++) {
                    let prop = exonLocList[i][1] / totLength;
                    data.push([exonLocList[i][0], prop, propSoFar]);
                    propSoFar += prop;
                }
            }
        }

        return data.map((exon: number[]) => ({
            color: '#007FFF',
            startCodon: this.props.width * exon[2],
            endCodon: this.props.width * exon[1] + this.props.width * exon[2],
        }));
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{ marginLeft: 16 }}></span>
                Exon Number
            </span>
        );
    }

    public render() {
        return (
            <Track
                dataStore={this.props.dataStore}
                defaultFilters={[
                    {
                        type: DataFilterType.ONCOKB,
                        values: [OncoKbFilterValue.Oncogenic],
                    },
                ]}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.exonNumSpecs}
                idClassPrefix={ONCOKB_ID_CLASS_PREFIX}
            />
        );
    }
}
