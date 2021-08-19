import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import MutationMapperStore from '../../model/MutationMapperStore';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec } from './TrackItem';
import {
    Mutation,
    ExonDatum,
    extractExonInformation,
    formatExonLocation,
} from 'cbioportal-utils';
import { EnsemblTranscript } from 'genome-nexus-ts-api-client';

type ExonTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
};

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

        const exons = this.transcript!.exons;
        const utrs = this.transcript!.utrs || [];

        const exonInfo = extractExonInformation(
            exons,
            utrs,
            this.props.proteinLength
        );

        const altColors = ['#007FFF', '#35BAF6'];

        return exonInfo.map((exon: ExonDatum, index: number) => {
            const startCodon = exon.start;
            const endCodon = exon.start + exon.length;
            const exonLength = exon.length;
            const isSkippable = Number.isInteger(exonLength);
            const stringStart = formatExonLocation(startCodon);
            const stringEnd = formatExonLocation(endCodon);
            const stringLength = formatExonLocation(exonLength);

            return {
                color: altColors[index % 2],
                startCodon: startCodon,
                endCodon: endCodon,
                label: exon.rank.toString(),
                labelColor: '#FFFFFF',
                tooltip: (
                    <span>
                        <h5> Exon {exon.rank} </h5>
                        Start: {stringStart}
                        <br></br>
                        End: {stringEnd}
                        <br></br>
                        Length: {stringLength}
                    </span>
                ),
            };
        });
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
