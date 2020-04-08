import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';
import MobxPromise from 'mobxpromise';
import autobind from 'autobind-decorator';
import { Nav, NavItem } from 'react-bootstrap';

import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { ResultsViewTab } from '../ResultsViewPageHelpers';
import {
    CopyNumberSeg,
    Gene,
    ReferenceGenomeGene,
} from 'cbioportal-ts-api-client';
import IntegrativeGenomicsViewer from 'shared/components/igv/IntegrativeGenomicsViewer';
import CNSegmentsDownloader from 'shared/components/cnSegments/CNSegmentsDownloader';
import WindowStore from 'shared/components/window/WindowStore';
import {
    WHOLE_GENOME,
    calcSegmentTrackHeight,
    defaultSegmentTrackProps,
    generateSegmentFeatures,
} from 'shared/lib/IGVUtils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    default as ProgressIndicator,
    IProgressIndicatorItem,
} from 'shared/components/progressIndicator/ProgressIndicator';
import { remoteData } from 'cbioportal-frontend-commons';

@observer
export default class CNSegments extends React.Component<
    { store: ResultsViewPageStore },
    {}
> {
    @observable renderingComplete = false;
    @observable selectedLocus: string;
    @observable segmentTrackMaxHeight: number | undefined;

    constructor(props: { store: ResultsViewPageStore }) {
        super(props);
        this.segmentTrackMaxHeight = WindowStore.size.height * 0.7;
    }

    @computed get segmentTrackHeight() {
        return calcSegmentTrackHeight(
            this.features,
            this.segmentTrackMaxHeight
        );
    }

    @computed get activeLocus(): string {
        let locus = this.selectedLocus;

        if (!locus) {
            locus = this.props.store.genes.result
                ? this.props.store.genes.result[0].hugoGeneSymbol
                : WHOLE_GENOME;
        }

        return locus;
    }

    @computed get features() {
        const segments: CopyNumberSeg[] = this.activePromise
            ? this.activePromise.result || []
            : [];

        return generateSegmentFeatures(segments);
    }

    readonly chromosome = remoteData({
        await: () => [this.props.store.hugoGeneSymbolToReferenceGene],
        invoke: () => {
            return Promise.resolve(
                this.props.store.hugoGeneSymbolToReferenceGene.result![
                    this.activeLocus
                ].chromosome
            );
        },
    });

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
        if (this.activeLocus === WHOLE_GENOME) {
            return this.props.store.cnSegments;
        } else if (
            this.props.store.cnSegmentsByChromosome.result &&
            this.chromosome
        ) {
            return this.props.store.cnSegmentsByChromosome.result[
                this.chromosome.result!
            ];
        } else {
            return undefined;
        }
    }

    @computed get indicatorPromises() {
        const promises: MobxPromise<any>[] = [
            this.props.store.studies,
            this.props.store.genes,
        ];

        if (this.activeLocus !== WHOLE_GENOME) {
            promises.push(this.props.store.cnSegmentsByChromosome);
        }

        if (this.activePromise) {
            promises.push(this.activePromise);
        }

        return promises;
    }

    @computed get progressItems(): IProgressIndicatorItem[] {
        return [
            {
                label: 'Loading copy number segments data...',
                promises: this.indicatorPromises,
            },
            {
                label: 'Rendering',
            },
        ];
    }

    public render() {
        return (
            <div className="pillTabs">
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
                <CNSegmentsDownloader
                    promise={this.props.store.cnSegments}
                    filename={this.filename}
                />
                <Nav
                    bsStyle="pills"
                    activeKey={this.activeLocus}
                    onSelect={this.onTabSelect}
                >
                    <NavItem eventKey={WHOLE_GENOME}>Whole Genome</NavItem>
                    {this.props.store.genes.result &&
                        this.props.store.genes.result.map((gene: Gene) => (
                            <NavItem eventKey={gene.hugoGeneSymbol}>
                                {gene.hugoGeneSymbol}
                            </NavItem>
                        ))}
                </Nav>
                <div style={this.isHidden ? { opacity: 0 } : undefined}>
                    <IntegrativeGenomicsViewer
                        tracks={[
                            {
                                ...defaultSegmentTrackProps(),
                                height: this.segmentTrackHeight,
                                features: this.features,
                            },
                        ]}
                        genome={this.props.store.referenceGenome}
                        locus={this.activeLocus}
                        onRenderingStart={this.onIgvRenderingStart}
                        onRenderingComplete={this.onIgvRenderingComplete}
                        disableSearch={this.activeLocus !== WHOLE_GENOME}
                        isVisible={
                            this.props.store.tabId ===
                                ResultsViewTab.CN_SEGMENTS && !this.isHidden
                        }
                    />
                </div>
            </div>
        );
    }

    @autobind
    @action
    private onTabSelect(id: any) {
        this.selectedLocus = id;
    }

    @autobind
    @action
    private onIgvRenderingStart() {
        // we would like to keep the loader icon in the rendering state until initial IGV rendering is complete
        this.renderingComplete = false;
    }

    @autobind
    @action
    private onIgvRenderingComplete() {
        this.renderingComplete = true;
    }
}
