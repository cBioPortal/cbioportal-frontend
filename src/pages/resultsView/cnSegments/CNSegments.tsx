import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import { Nav, NavItem } from 'react-bootstrap';

import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { ResultsViewTab } from '../ResultsViewPageHelpers';
import { CopyNumberSeg, Gene } from 'cbioportal-ts-api-client';
import IntegrativeGenomicsViewer from 'shared/components/igv/IntegrativeGenomicsViewer';
import CNSegmentsDownloader from 'shared/components/cnSegments/CNSegmentsDownloader';
import WindowStore from 'shared/components/window/WindowStore';
import {
    WHOLE_GENOME,
    calcIgvTrackHeight,
    defaultSegmentTrackProps,
    generateSegmentFeatures,
} from 'shared/lib/IGVUtils';
import { normalizeChromosome } from 'cbioportal-utils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    default as ProgressIndicator,
    IProgressIndicatorItem,
} from 'shared/components/progressIndicator/ProgressIndicator';
import {
    DownloadControlOption,
    MobxPromise,
    remoteData,
} from 'cbioportal-frontend-commons';
import CaseFilterWarning from 'shared/components/banners/CaseFilterWarning';
import { getServerConfig } from 'config/config';

const IGV_GENE_SEARCH_FLANK_BP = 1000;

async function fetchIgvGeneLocus(genome: string, geneSymbol: string) {
    const response = await fetch(
        `https://igv.org/genomes/locus.php?genome=${encodeURIComponent(
            genome
        )}&name=${encodeURIComponent(geneSymbol)}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch IGV locus for ${geneSymbol}`);
    }

    const rows = (await response.text())
        .split('\n')
        .map(row => row.trim())
        .filter(Boolean);

    const hgncRow = rows.find(row => row.endsWith('\thgnc'));
    const locusRow = hgncRow ?? rows[0];

    if (!locusRow) {
        return undefined;
    }

    const [, locus] = locusRow.split('\t');

    if (!locus) {
        return undefined;
    }

    const [chromosome, range] = locus.split(':');
    const [startValue, endValue] = range.split('-');
    const start = parseInt(startValue, 10);
    const end = parseInt(endValue, 10);

    if (!chromosome || Number.isNaN(start) || Number.isNaN(end)) {
        return undefined;
    }

    return `${chromosome}:${Math.max(
        1,
        start - IGV_GENE_SEARCH_FLANK_BP
    ).toLocaleString()}-${(end + IGV_GENE_SEARCH_FLANK_BP).toLocaleString()}`;
}

@observer
export default class CNSegments extends React.Component<
    { store: ResultsViewPageStore; sampleThreshold?: number },
    {}
> {
    @observable renderingComplete = false;
    @observable.ref selectedLocus: string;
    @observable.ref fallbackGeneLocus: string | undefined;
    @observable.ref fallbackGeneLocusKey: string | undefined;
    @observable segmentTrackMaxHeight: number | undefined;

    public static defaultProps = {
        sampleThreshold: 20000,
    };

    constructor(props: { store: ResultsViewPageStore }) {
        super(props);
        makeObservable(this);
        this.segmentTrackMaxHeight = WindowStore.size.height * 0.7;
    }

    @computed get segmentTrackHeight() {
        return calcIgvTrackHeight(this.features, this.segmentTrackMaxHeight);
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

    @computed get igvLocus(): string {
        if (this.activeLocus === WHOLE_GENOME) {
            return WHOLE_GENOME;
        }

        const referenceGene =
            this.props.store.hugoGeneSymbolToReferenceGene.result?.[
                this.activeLocus
            ];

        if (!referenceGene) {
            return WHOLE_GENOME;
        }

        const chromosome = normalizeChromosome(referenceGene.chromosome);

        if (referenceGene.start <= 0 || referenceGene.end <= 0) {
            return this.fallbackGeneLocus ?? WHOLE_GENOME;
        }

        return `${chromosome}:${
            referenceGene.start.toLocaleString()
        }-${referenceGene.end.toLocaleString()}`;
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

    @computed get isSampleCountWithinThreshold() {
        return (
            !this.props.store.filteredSamples.result ||
            !this.props.sampleThreshold ||
            this.props.store.filteredSamples.result.length <=
                this.props.sampleThreshold
        );
    }

    @computed get tooManySamplesForWholeGenome() {
        return (
            this.activeLocus === WHOLE_GENOME &&
            !this.isSampleCountWithinThreshold
        );
    }

    @computed get isLoading() {
        if (this.tooManySamplesForWholeGenome) {
            return false;
        } else {
            return this.activePromise ? this.activePromise.isPending : true;
        }
    }

    @computed get activePromise() {
        if (this.activeLocus === WHOLE_GENOME) {
            return this.props.store.filteredSamples.result &&
                this.isSampleCountWithinThreshold
                ? this.props.store.cnSegments
                : undefined;
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
                    showDownload={
                        getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL
                    }
                />
                <div className={'tabMessageContainer'}>
                    <CaseFilterWarning
                        samples={this.props.store.samples}
                        filteredSamples={this.props.store.filteredSamples}
                        patients={this.props.store.patients}
                        filteredPatients={this.props.store.filteredPatients}
                        hideUnprofiledSamples={
                            this.props.store.hideUnprofiledSamples
                        }
                    />
                </div>
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
                {this.tooManySamplesForWholeGenome && (
                    <span>
                        Too many samples ({`>${this.props.sampleThreshold}`})
                        for the whole genome view. Try to select a different
                        sample list.
                    </span>
                )}
                <div
                    style={
                        this.isHidden || this.tooManySamplesForWholeGenome
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
                        genome={this.props.store.referenceGenome}
                        locus={this.igvLocus}
                        onRenderingStart={this.onIgvRenderingStart}
                        onRenderingComplete={this.onIgvRenderingComplete}
                        disableSearch={this.activeLocus !== WHOLE_GENOME}
                        isVisible={
                            this.props.store.tabId ===
                                ResultsViewTab.CN_SEGMENTS &&
                            !this.isHidden &&
                            !this.tooManySamplesForWholeGenome
                        }
                    />
                </div>
            </div>
        );
    }

    componentDidMount() {
        this.updateFallbackGeneLocus();
    }

    componentDidUpdate() {
        this.updateFallbackGeneLocus();
    }

    @action.bound
    private onTabSelect(id: any) {
        this.selectedLocus = id;
    }

    @action.bound
    private onIgvRenderingStart() {
        // we would like to keep the loader icon in the rendering state until initial IGV rendering is complete
        this.renderingComplete = false;
    }

    @action.bound
    private onIgvRenderingComplete() {
        this.renderingComplete = true;
    }

    private updateFallbackGeneLocus() {
        if (this.activeLocus === WHOLE_GENOME) {
            this.clearFallbackGeneLocus();
            return;
        }

        const referenceGene =
            this.props.store.hugoGeneSymbolToReferenceGene.result?.[
                this.activeLocus
            ];

        if (!referenceGene) {
            this.clearFallbackGeneLocus();
            return;
        }

        if (referenceGene.start > 0 && referenceGene.end > 0) {
            this.clearFallbackGeneLocus();
            return;
        }

        const lookupKey = `${this.props.store.referenceGenome}:${this.activeLocus}`;

        if (this.fallbackGeneLocusKey === lookupKey) {
            return;
        }

        this.fallbackGeneLocusKey = lookupKey;

        void fetchIgvGeneLocus(
            this.props.store.referenceGenome,
            this.activeLocus
        )
            .then(
                action((locus: string | undefined) => {
                    if (this.fallbackGeneLocusKey === lookupKey) {
                        this.fallbackGeneLocus = locus;
                    }
                })
            )
            .catch(
                action(() => {
                    if (this.fallbackGeneLocusKey === lookupKey) {
                        this.fallbackGeneLocus = undefined;
                    }
                })
            );
    }

    @action.bound
    private clearFallbackGeneLocus() {
        this.fallbackGeneLocus = undefined;
        this.fallbackGeneLocusKey = undefined;
    }
}
