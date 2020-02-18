import * as React from 'react';
import * as _ from 'lodash';
import { If } from 'react-if';
import Tracks from './Tracks';
import { ThumbnailExpandVAFPlot } from '../vafPlot/ThumbnailExpandVAFPlot';
import { Mutation, Sample } from '../../../shared/api/generated/CBioPortalAPI';
import SampleManager from '../SampleManager';
import { ClinicalDataBySampleId } from '../../../shared/api/api-types-extended';
import { MutationFrequenciesBySample } from '../vafPlot/VAFPlot';
import { computed } from 'mobx';
import { sampleIdToIconData, IKeyedIconData, genePanelIdToIconData } from './GenomicOverviewUtils';

interface IGenomicOverviewProps {
    mergedMutations: Mutation[][];
    cnaSegments: any;
    samples: Sample[];
    sampleOrder: { [s: string]: number };
    sampleLabels: { [s: string]: string };
    sampleColors: { [s: string]: string };
    sampleManager: SampleManager;
    containerWidth: number;
    sampleIdToMutationGenePanelId?: { [sampleId: string]: string };
    sampleIdToCopyNumberGenePanelId?: { [sampleId: string]: string };
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
}

export default class GenomicOverview extends React.Component<
    IGenomicOverviewProps,
    { frequencies: MutationFrequenciesBySample }
> {
    constructor(props: IGenomicOverviewProps) {
        super(props);
    }

    @computed get frequencies() {
        return this.computeMutationFrequencyBySample(this.props.mergedMutations);
    }

    @computed get genePanelIds() {
        return _.uniq(
            _.concat(
                _.values(this.props.sampleIdToMutationGenePanelId),
                _.values(this.props.sampleIdToCopyNumberGenePanelId)
            )
        );
    }

    @computed get genePanelIdToIconData(): IKeyedIconData {
        return genePanelIdToIconData(this.genePanelIds);
    }

    @computed get sampleIdToMutationGenePanelIconData(): IKeyedIconData {
        return sampleIdToIconData(
            this.props.sampleIdToMutationGenePanelId,
            this.genePanelIdToIconData
        );
    }

    @computed get sampleIdToCopyNumberGenePanelIconData(): IKeyedIconData {
        return sampleIdToIconData(
            this.props.sampleIdToCopyNumberGenePanelId,
            this.genePanelIdToIconData
        );
    }

    public render() {
        const labels = _.reduce(
            this.props.sampleManager.samples,
            (result: any, sample: ClinicalDataBySampleId, i: number) => {
                result[sample.id] = i + 1;
                return result;
            },
            {}
        );

        return (
            <div style={{ display: 'flex' }}>
                <Tracks
                    mutations={_.flatten(this.props.mergedMutations)}
                    key={Math.random() /* Force remounting on every render */}
                    sampleManager={this.props.sampleManager}
                    width={this.getTracksWidth()}
                    cnaSegments={this.props.cnaSegments}
                    samples={this.props.samples}
                    mutationGenePanelIconData={this.sampleIdToMutationGenePanelIconData}
                    copyNumberGenePanelIconData={this.sampleIdToCopyNumberGenePanelIconData}
                    onSelectGenePanel={this.props.onSelectGenePanel}
                />
                <If condition={this.shouldShowVAFPlot()}>
                    <ThumbnailExpandVAFPlot
                        data={this.frequencies}
                        order={this.props.sampleManager.sampleIndex}
                        colors={this.props.sampleColors}
                        labels={labels}
                        overlayPlacement="right"
                        cssClass="vafPlot"
                        genePanelIconData={this.sampleIdToMutationGenePanelIconData}
                    />
                </If>
            </div>
        );
    }

    private shouldShowVAFPlot(): boolean {
        return this.props.mergedMutations.length > 0 && this.isFrequencyExist();
    }

    private isFrequencyExist(): boolean {
        for (const frequencyId of Object.keys(this.frequencies)) {
            if (this.frequencies.hasOwnProperty(frequencyId)) {
                for (const frequency of this.frequencies[frequencyId]) {
                    return !isNaN(frequency);
                }
            }
        }
        return false;
    }

    private getTracksWidth(): number {
        return this.props.containerWidth - (this.shouldShowVAFPlot() ? 140 : 40);
    }

    private computeMutationFrequencyBySample(
        mergedMutations: Mutation[][]
    ): MutationFrequenciesBySample {
        const ret: MutationFrequenciesBySample = {};
        let sampleId;
        let freq;
        for (const mutations of mergedMutations) {
            for (const mutation of mutations) {
                if (mutation.tumorAltCount >= 0 && mutation.tumorRefCount >= 0) {
                    sampleId = mutation.sampleId;
                    freq =
                        mutation.tumorAltCount / (mutation.tumorRefCount + mutation.tumorAltCount);
                    ret[sampleId] = ret[sampleId] || [];
                    ret[sampleId].push(freq);
                }
            }
        }
        for (const sampleId of Object.keys(this.props.sampleOrder)) {
            ret[sampleId] = ret[sampleId] || [];
            const shouldAdd = mergedMutations.length - ret[sampleId].length;
            for (let i = 0; i < shouldAdd; i++) {
                ret[sampleId].push(NaN);
            }
        }
        return ret;
    }
}
