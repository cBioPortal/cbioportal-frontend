import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';

import { CopyNumberSeg } from 'cbioportal-ts-api-client';
import IntegrativeGenomicsViewer from 'shared/components/igv/IntegrativeGenomicsViewer';
import {
    calcSegmentTrackHeight,
    defaultSegmentTrackProps,
    generateSegmentFeatures,
} from 'shared/lib/IGVUtils';
import { DEFAULT_GENOME } from '../../resultsView/ResultsViewPageStoreUtils';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from 'shared/components/progressIndicator/ProgressIndicator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import CNSegmentsDownloader from 'shared/components/cnSegments/CNSegmentsDownloader';
import WindowStore from 'shared/components/window/WindowStore';

import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import { StudyViewPageStore } from '../StudyViewPageStore';

@observer
export default class CNSegments extends React.Component<
    { store: StudyViewPageStore },
    {}
> {
    @observable renderingComplete = false;
    @observable segmentTrackMaxHeight: number | undefined;

    constructor(props: { store: StudyViewPageStore }) {
        super(props);
        this.segmentTrackMaxHeight = WindowStore.size.height * 0.7;
    }

    @computed get segmentTrackHeight() {
        return calcSegmentTrackHeight(
            this.features,
            this.segmentTrackMaxHeight
        );
    }

    @computed get features() {
        const segments: CopyNumberSeg[] = this.activePromise
            ? this.activePromise.result || []
            : [];

        return generateSegmentFeatures(segments);
    }

    @computed get filename() {
        return `${this.props.store.downloadFilenamePrefix}segments.seg`;
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    @computed get isLoading() {
        return this.activePromise ? this.activePromise.isPending : true;
    }

    @computed get activePromise() {
        return this.props.store.cnSegments;
    }

    @computed get progressItems(): IProgressIndicatorItem[] {
        return [
            {
                label: 'Loading copy number segments data...',
                promises: [this.activePromise],
            },
            {
                label: 'Rendering',
            },
        ];
    }

    @computed get hasNoSegmentData() {
        return (
            this.activePromise.isComplete &&
            (!this.activePromise.result ||
                this.activePromise.result.length === 0)
        );
    }

    @computed get genome() {
        const study = this.props.store.queriedPhysicalStudies.result
            ? this.props.store.queriedPhysicalStudies.result[0]
            : undefined;
        return study ? study.referenceGenome : DEFAULT_GENOME;
    }

    public render() {
        return (
            <div>
                <LoadingIndicator
                    isLoading={this.isHidden}
                    size={'big'}
                    center={true}
                >
                    <ProgressIndicator
                        getItems={() => this.progressItems}
                        show={this.isHidden}
                        sequential={true}
                    />
                </LoadingIndicator>
                <div style={{ marginBottom: 15, marginLeft: 15 }}>
                    <span>
                        {this.hasNoSegmentData ? 'No segmented' : 'Segmented'}{' '}
                        copy-number data for the selected{' '}
                        {this.props.store.selectedSamples.result &&
                            this.props.store.selectedSamples.result.length}{' '}
                        {this.props.store.selectedSamples.result &&
                        this.props.store.selectedSamples.result.length === 1
                            ? 'sample.'
                            : 'samples.'}
                    </span>
                    {!this.hasNoSegmentData && (
                        <CNSegmentsDownloader
                            promise={this.activePromise}
                            filename={this.filename}
                        />
                    )}
                </div>
                <div
                    style={
                        this.isHidden || this.hasNoSegmentData
                            ? { opacity: 0 }
                            : undefined
                    }
                >
                    <IntegrativeGenomicsViewer
                        tracks={[
                            {
                                ...defaultSegmentTrackProps(),
                                height: this.segmentTrackHeight,
                                features: this.features,
                            },
                        ]}
                        genome={this.genome}
                        onRenderingStart={this.onIgvRenderingStart}
                        onRenderingComplete={this.onIgvRenderingComplete}
                        isVisible={
                            this.props.store.currentTab ===
                                StudyViewPageTabKeyEnum.CN_SEGMENTS &&
                            !this.isHidden
                        }
                    />
                </div>
            </div>
        );
    }

    @autobind
    @action
    private onIgvRenderingStart() {
        this.renderingComplete = false;
    }

    @autobind
    @action
    private onIgvRenderingComplete() {
        this.renderingComplete = true;
    }
}
