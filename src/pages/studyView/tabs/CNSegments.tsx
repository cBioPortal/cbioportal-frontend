import * as React from 'react';
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";

import {CopyNumberSeg} from "shared/api/generated/CBioPortalAPI";
import IntegrativeGenomicsViewer from "shared/components/igv/IntegrativeGenomicsViewer";
import {calcSegmentTrackHeight, defaultSegmentTrackProps, generateSegmentFeatures} from "shared/lib/IGVUtils";
import ProgressIndicator, {IProgressIndicatorItem} from "shared/components/progressIndicator/ProgressIndicator";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import CNSegmentsDownloader from "shared/components/cnSegments/CNSegmentsDownloader";

import {StudyViewPageStore, StudyViewPageTabKeyEnum} from "../StudyViewPageStore";

@observer
export default class CNSegments extends React.Component<{ store: StudyViewPageStore }, {}> {
    @observable renderingComplete = false;

    @computed get segmentTrackHeight() {
        return calcSegmentTrackHeight(this.features);
    }

    @computed get features() {
        const segments: CopyNumberSeg[] = this.activePromise ? this.activePromise.result || [] : [];

        return generateSegmentFeatures(segments);
    }

    @computed get filename()
    {
        return `${this.props.store.downloadFilenamePrefix}segments.seg`;
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    @computed get isLoading()
    {
        return this.activePromise ? this.activePromise.isPending : true;
    }

    @computed get activePromise() {
        return this.props.store.cnSegments;
    }

    @computed get progressItems(): IProgressIndicatorItem[] {
        return [
            {
                label: "Loading copy number segments data...",
                promises: [this.activePromise]
            },
            {
                label: "Rendering tracks.."
            }
        ];
    }

    public render() {
        return (
            <div>
                <LoadingIndicator isLoading={this.isHidden} size={"big"} center={true}>
                    <ProgressIndicator getItems={() => this.progressItems} show={this.isHidden} sequential={true}/>
                </LoadingIndicator>
                <div style={{marginBottom: 15}}>
                    <span>
                        <b>Whole Genome</b> Copy Number Segments for the selected
                        <b> {this.props.store.selectedSamples.result && this.props.store.selectedSamples.result.length} </b>
                        sample(s).
                    </span>
                    <CNSegmentsDownloader
                        promise={this.activePromise}
                        filename={this.filename}
                    />
                </div>
                <div style={this.isHidden ? {opacity: 0} : undefined}>
                    <IntegrativeGenomicsViewer
                        tracks={[
                            {
                                ...defaultSegmentTrackProps(),
                                height: this.segmentTrackHeight,
                                features: this.features
                            }
                        ]}
                        onRenderingStart={this.onIgvRenderingStart}
                        onRenderingComplete={this.onIgvRenderingComplete}
                        isVisible={this.props.store.currentTab === StudyViewPageTabKeyEnum.CN_SEGMENTS && !this.isHidden}
                    />
                </div>
            </div>
        );
    }

    @autobind
    @action private onIgvRenderingStart() {
        this.renderingComplete = false;
    }

    @autobind
    @action private onIgvRenderingComplete() {
        this.renderingComplete = true;
    }
}
