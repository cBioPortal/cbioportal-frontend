import {
    action,
    computed,
    makeObservable,
    observable,
    ObservableSet,
    runInAction,
} from 'mobx';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionEvent, TranscriptData } from './data/types';
import { convertStructuralVariantsToFusionEvents } from './data/structuralVariantAdapter';
import {
    fetchTranscriptsForGeneWithFallback,
    GenomeBuild,
} from './data/ensemblTranscriptService';

/**
 * MobX store for the Fusion Viewer tab.
 * Uses cBioPortal StructuralVariant data with Genome Nexus for transcript lookup.
 */
export class FusionViewerStore {
    @observable public fusions: FusionEvent[] = [];
    @observable public selectedFusionId: string = '';

    // Multi-select transcript IDs (checkbox UI)
    @observable public selectedTranscript5pIds: ObservableSet<
        string
    > = observable.set<string>();
    @observable public selectedTranscript3pIds: ObservableSet<
        string
    > = observable.set<string>();

    // Async transcript data
    @observable public asyncGene1Transcripts: TranscriptData[] = [];
    @observable public asyncGene2Transcripts: TranscriptData[] = [];
    @observable public transcriptsLoading: boolean = false;

    // Genome build selection (GRCh38 or GRCh37)
    @observable public genomeBuild: GenomeBuild = 'GRCh38';

    // Guard against stale async responses
    private _fetchVersion: number = 0;

    constructor() {
        makeObservable(this);
    }

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    @action
    public loadFromStructuralVariants(svs: StructuralVariant[]): void {
        this.fusions = convertStructuralVariantsToFusionEvents(svs);
        if (this.fusions.length > 0) {
            this.selectFusion(this.fusions[0].id);
        }
    }

    @action
    public selectFusion(fusionId: string): void {
        this.selectedFusionId = fusionId;

        // Reset transcript selections
        this.selectedTranscript5pIds.clear();
        this.selectedTranscript3pIds.clear();

        const fusion = this.fusions.find(f => f.id === fusionId);
        if (!fusion) return;

        const default5pId = stripVersionSuffix(
            fusion.gene1.selectedTranscriptId
        );
        if (default5pId) {
            this.selectedTranscript5pIds.add(default5pId);
        }

        if (fusion.gene2) {
            const default3pId = stripVersionSuffix(
                fusion.gene2.selectedTranscriptId
            );
            if (default3pId) {
                this.selectedTranscript3pIds.add(default3pId);
            }
        }

        this.fetchTranscriptsForSelectedFusion(fusion);
    }

    @action
    public toggleTranscript5p(transcriptId: string): void {
        if (this.selectedTranscript5pIds.has(transcriptId)) {
            // Don't allow deselecting the last one
            if (this.selectedTranscript5pIds.size > 1) {
                this.selectedTranscript5pIds.delete(transcriptId);
            }
        } else {
            this.selectedTranscript5pIds.add(transcriptId);
        }
    }

    @action
    public toggleTranscript3p(transcriptId: string): void {
        if (this.selectedTranscript3pIds.has(transcriptId)) {
            if (this.selectedTranscript3pIds.size > 1) {
                this.selectedTranscript3pIds.delete(transcriptId);
            }
        } else {
            this.selectedTranscript3pIds.add(transcriptId);
        }
    }

    @action
    public setGenomeBuild(build: GenomeBuild): void {
        if (build === this.genomeBuild) return;
        this.genomeBuild = build;

        // Re-fetch transcripts for the current fusion with the new build
        if (this.selectedFusion) {
            this.fetchTranscriptsForSelectedFusion(this.selectedFusion);
        }
    }

    // -----------------------------------------------------------------------
    // Async transcript fetching
    // -----------------------------------------------------------------------

    private async fetchTranscriptsForSelectedFusion(
        fusion: FusionEvent
    ): Promise<void> {
        const version = ++this._fetchVersion;
        runInAction(() => {
            this.transcriptsLoading = true;
        });

        try {
            const build = this.genomeBuild;

            const gene1Promise = fetchTranscriptsForGeneWithFallback(
                fusion.gene1.symbol,
                fusion.gene1.selectedTranscriptId,
                build
            );

            const gene2Promise = fusion.gene2
                ? fetchTranscriptsForGeneWithFallback(
                      fusion.gene2.symbol,
                      fusion.gene2.selectedTranscriptId,
                      build
                  )
                : Promise.resolve([]);

            const [g1Transcripts, g2Transcripts] = await Promise.all([
                gene1Promise,
                gene2Promise,
            ]);

            runInAction(() => {
                if (version !== this._fetchVersion) return;
                this.asyncGene1Transcripts = g1Transcripts;
                this.asyncGene2Transcripts = g2Transcripts;
                this.transcriptsLoading = false;

                // Auto-select the FORTE transcript if we haven't already
                if (this.selectedTranscript5pIds.size === 0) {
                    const forte5p = g1Transcripts.find((t: TranscriptData) => t.isForteSelected);
                    if (forte5p) {
                        this.selectedTranscript5pIds.add(forte5p.transcriptId);
                    } else if (g1Transcripts.length > 0) {
                        this.selectedTranscript5pIds.add(
                            g1Transcripts[0].transcriptId
                        );
                    }
                }

                if (fusion.gene2 && this.selectedTranscript3pIds.size === 0) {
                    const forte3p = g2Transcripts.find((t: TranscriptData) => t.isForteSelected);
                    if (forte3p) {
                        this.selectedTranscript3pIds.add(forte3p.transcriptId);
                    } else if (g2Transcripts.length > 0) {
                        this.selectedTranscript3pIds.add(
                            g2Transcripts[0].transcriptId
                        );
                    }
                }
            });
        } catch (error) {
            console.warn('Failed to fetch transcripts:', error);
            runInAction(() => {
                if (version !== this._fetchVersion) return;
                this.transcriptsLoading = false;
            });
        }
    }

    // -----------------------------------------------------------------------
    // Computed
    // -----------------------------------------------------------------------

    @computed
    public get selectedFusion(): FusionEvent | undefined {
        return this.fusions.find(f => f.id === this.selectedFusionId);
    }

    @computed
    public get gene1Transcripts(): TranscriptData[] {
        return this.asyncGene1Transcripts;
    }

    @computed
    public get gene2Transcripts(): TranscriptData[] {
        return this.asyncGene2Transcripts;
    }

    // Primary selected transcript (first in the set) — used by diagram
    @computed
    public get selectedTranscript5pId(): string {
        const ids = Array.from(this.selectedTranscript5pIds);
        return ids.length > 0 ? ids[0] : '';
    }

    @computed
    public get selectedTranscript3pId(): string {
        const ids = Array.from(this.selectedTranscript3pIds);
        return ids.length > 0 ? ids[0] : '';
    }

    @computed
    public get selectedTranscript5p(): TranscriptData | undefined {
        return this.gene1Transcripts.find(
            t => t.transcriptId === this.selectedTranscript5pId
        );
    }

    @computed
    public get selectedTranscript3p(): TranscriptData | undefined {
        return this.gene2Transcripts.find(
            t => t.transcriptId === this.selectedTranscript3pId
        );
    }

    /** All selected 5' transcripts (for multi-select display) */
    @computed
    public get allSelectedTranscripts5p(): TranscriptData[] {
        return this.gene1Transcripts.filter(t =>
            this.selectedTranscript5pIds.has(t.transcriptId)
        );
    }

    /** All selected 3' transcripts (for multi-select display) */
    @computed
    public get allSelectedTranscripts3p(): TranscriptData[] {
        return this.gene2Transcripts.filter(t =>
            this.selectedTranscript3pIds.has(t.transcriptId)
        );
    }

    @computed
    public get forteTranscript5p(): TranscriptData | undefined {
        return this.gene1Transcripts.find(t => t.isForteSelected);
    }

    @computed
    public get forteTranscript3p(): TranscriptData | undefined {
        return this.gene2Transcripts.find(t => t.isForteSelected);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripVersionSuffix(transcriptId: string): string {
    return transcriptId.replace(/\.\d+$/, '');
}
