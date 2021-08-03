import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';

import { OncoKbFilterValue } from '../../filter/OncoKbFilter';
import { DataFilterType } from '../../model/DataFilter';
import MutationMapperStore from '../../model/MutationMapperStore';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec, TrackItemType } from './TrackItem';
import { Mutation } from 'cbioportal-utils';
import { EnsemblTranscript } from '../../../../genome-nexus-ts-api-client/dist';

type ExonTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
};

type ExonDatum = { rank: number; length: number; start: number };

@observer
export default class ExonTrack extends React.Component<ExonTrackProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get transcriptId(): string | undefined {
        return this.props.store.activeTranscript?.result;
    }

    @computed get transcript(): EnsemblTranscript | undefined {
        return this.transcriptId
            ? this.props.store.transcriptsByTranscriptId[this.transcriptId]
            : undefined;
    }

    @computed get exonSpecs(): TrackItemSpec[] {
        if (!this.transcriptId || !this.transcript) {
            return [];
        }

        const exonInfo = this.exonInformation;

        const altColors = ['#007FFF', '#35BAF6'];

        return exonInfo.map((exon: ExonDatum, index: number) => {
            const startCodon = exon.start;
            const endCodon = exon.start + exon.length;
            const exonLength = exon.length;
            const isSkippable = Number.isInteger(exonLength);

            return {
                color: altColors[index % 2],
                startCodon: startCodon,
                endCodon: endCodon,
                label: exon.rank.toString(),
                labelColor: '#FFFFFF',
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

    @computed get exonInformation(): ExonDatum[] {
        const exons = this.transcript!.exons;
        const utrs = this.transcript!.utrs || [];
        let totalLength = 0;
        const exonLocList: { exonRank: number; length: number }[] = [];
        exons.forEach(exon => {
            let utrStartSitesWithinExon = false;
            for (let j = 0; j < utrs.length; j++) {
                const currentUtr = utrs[j];
                // if utr start is within exon, add only translated length of exon to exonLocList
                if (
                    exon.exonStart <= currentUtr.start &&
                    exon.exonEnd >= currentUtr.start
                ) {
                    utrStartSitesWithinExon = true;
                    const aaLength =
                        (currentUtr.start -
                            exon.exonStart +
                            (exon.exonEnd - currentUtr.end)) /
                        3;
                    if (aaLength !== 0) {
                        exonLocList.push({
                            exonRank: exon.rank,
                            length: aaLength,
                        });
                        totalLength += aaLength;
                    }
                    break;
                }
            }
            // if there are no utr start sites within exon
            if (!utrStartSitesWithinExon) {
                const aaLength = (exon.exonEnd - exon.exonStart + 1) / 3;
                exonLocList.push({ exonRank: exon.rank, length: aaLength });
                totalLength += aaLength;
            }
        });
        exonLocList.sort((n1, n2) => n1.exonRank - n2.exonRank);
        // if totalLength is greater than proteinLength, remove length (1 aa or 3 nucs) associated with stop codon
        // isoforms that are especially short already have this length taken out
        if (totalLength !== this.props.proteinLength) {
            exonLocList[exonLocList.length - 1].length =
                exonLocList[exonLocList.length - 1].length - 1;
            totalLength--;
        }
        let startOfExon = 0;
        const exonInfo: ExonDatum[] = exonLocList.map(exon => {
            const exonDatum = {
                rank: exon.exonRank,
                length: exon.length,
                start: startOfExon,
            };
            startOfExon += exon.length;
            return exonDatum;
        });
        return exonInfo;
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{ marginLeft: 16 }}></span>
                Exon
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
                trackItems={this.exonSpecs}
                idClassPrefix={'exon-'}
            />
        );
    }
}
