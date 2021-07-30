import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';

import { OncoKbFilterValue } from '../../filter/OncoKbFilter';
import { DataFilterType } from '../../model/DataFilter';
import MutationMapperStore from '../../model/MutationMapperStore';
import { OncoKbTrackTooltip } from './OncoKbTrackTooltip';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec, TrackItemType } from './TrackItem';
import { Mutation } from 'cbioportal-utils';

import oncoKbImg from '../../images/oncogenic-only.svg';
import MutationMapper from '../mutationMapper/MutationMapper';

type ExonNumTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
};

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
        const currentTranscriptId = this.props.store.activeTranscript?.result;
        type ExonDatum = { rank: number; length: number; start: number };
        const currentTranscript = this.props.store.transcriptsByTranscriptId[
            currentTranscriptId as string
        ];
        if (!currentTranscriptId || !currentTranscript) {
            return [];
        }
        const exonArr = currentTranscript.exons;
        const utrArr = currentTranscript.utrs || [];
        let totLength = 0;
        let exonLocList: number[][] = [];
        exonArr.forEach(exon => {
            let accountedForExon = false;
            for (let j = 0; j < utrArr.length; j++) {
                const currentUtr = utrArr[j];
                // if utr start is within exon, add only translated length of exon to exonLocList
                if (
                    exon.exonStart <= currentUtr.start &&
                    exon.exonEnd >= currentUtr.start
                ) {
                    accountedForExon = true;
                    const aaLength =
                        (currentUtr.start -
                            exon.exonStart +
                            (exon.exonEnd - currentUtr.end)) /
                        3;
                    if (aaLength !== 0) {
                        exonLocList.push([exon.rank, aaLength]);
                        totLength += aaLength;
                    }
                    break;
                }
            }
            // if there are no utr start sites within exon
            if (!accountedForExon) {
                const aaLength = (exon.exonEnd - exon.exonStart + 1) / 3;
                exonLocList.push([exon.rank, aaLength]);
                totLength += aaLength;
            }
        });
        exonLocList.sort((n1, n2) => n1[0] - n2[0]);
        if (totLength !== this.props.proteinLength) {
            exonLocList[exonLocList.length - 1][1] =
                exonLocList[exonLocList.length - 1][1] - 1;
            totLength--;
        }
        let startOfExon = 0;
        let exonInfo: ExonDatum[] = exonLocList.map(exonLocation => {
            const ret = {
                rank: exonLocation[0],
                length: exonLocation[1],
                start: startOfExon,
            };
            startOfExon += exonLocation[1];
            return ret;
        });

        const altColors = ['#007FFF', '#35BAF6'];

        return exonInfo.map((exon: ExonDatum, index: number) => {
            const startCodon = exon.start;
            const endCodon = exon.start + exon.length;
            const exonLength = exon.length;
            const isSkippable = Number.isInteger(exonLength).toString();

            return {
                color: altColors[index % 2],
                startCodon: startCodon,
                endCodon: endCodon,
                label: exon.rank.toString(),
                labelColor: '#FFFFFF',
                itemType: TrackItemType.RECTANGLE,
                tooltip: (
                    <span>
                        <h1> Exon {exon.rank} </h1>
                        <br></br>
                        Start: {startCodon.toFixed(2).toString()}
                        <br></br>
                        End: {endCodon.toFixed(2).toString()}
                        <br></br>
                        Exon length (amino acid):{' '}
                        {exonLength.toFixed(2).toString()}
                        <br></br>
                        Exon {isSkippable ? 'is' : "isn't"} a multiple of 3
                    </span>
                ),
            };
        });
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
                idClassPrefix={'exon-num-'}
            />
        );
    }
}
