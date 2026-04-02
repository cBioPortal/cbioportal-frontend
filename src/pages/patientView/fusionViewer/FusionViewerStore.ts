import {
    action,
    computed,
    makeObservable,
    observable,
    ObservableSet,
} from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionEvent, TranscriptData } from './data/types';
import { convertStructuralVariantsToFusionEvents } from './data/structuralVariantAdapter';
import {
    fetchTranscriptsForGeneWithFallback,
    GenomeBuild,
} from './data/genomeNexusTranscriptService';

/**
 * MobX store for the Fusion Viewer tab.
 * Uses cBioPortal StructuralVariant data with Genome Nexus for transcript lookup.
 */
export class FusionViewerStore {
    @observable public structuralVariants: StructuralVariant[] = [];
    @observable public selectedFusionId: string = '';

    // Multi-select transcript IDs (checkbox UI)
    @observable public selectedTranscript5pIds: ObservableSet<
        string
    > = observable.set<string>();
    @observable public selectedTranscript3pIds: ObservableSet<
        string
    > = observable.set<string>();

    // Genome build selection (GRCh38 or GRCh37)
    @observable public genomeBuild: GenomeBuild = 'GRCh38';

    constructor() {
        makeObservable(this);
    }

    // -----------------------------------------------------------------------
    // Async transcript fetching via remoteData
    // -----------------------------------------------------------------------

    readonly gene1TranscriptsRemote = remoteData<TranscriptData[]>({
        invoke: async () => {
            const fusion = this.selectedFusion;
            if (!fusion) return [];
            return fetchTranscriptsForGeneWithFallback(
                fusion.gene1.symbol,
                fusion.gene1.selectedTranscriptId,
                this.genomeBuild
            );
        },
        onResult: (result?: TranscriptData[]) => {
            if (this.selectedTranscript5pIds.size === 0 && result) {
                const forte = result.find(
                    (t: TranscriptData) => t.isForteSelected
                );
                if (forte) {
                    this.selectedTranscript5pIds.add(forte.transcriptId);
                } else if (result.length > 0) {
                    this.selectedTranscript5pIds.add(result[0].transcriptId);
                }
            }
        },
        default: [],
    });

    readonly gene2TranscriptsRemote = remoteData<TranscriptData[]>({
        invoke: async () => {
            const fusion = this.selectedFusion;
            if (!fusion || !fusion.gene2) return [];
            return fetchTranscriptsForGeneWithFallback(
                fusion.gene2.symbol,
                fusion.gene2.selectedTranscriptId,
                this.genomeBuild
            );
        },
        onResult: (result?: TranscriptData[]) => {
            const fusion = this.selectedFusion;
            if (
                fusion?.gene2 &&
                this.selectedTranscript3pIds.size === 0 &&
                result
            ) {
                const forte = result.find(
                    (t: TranscriptData) => t.isForteSelected
                );
                if (forte) {
                    this.selectedTranscript3pIds.add(forte.transcriptId);
                } else if (result.length > 0) {
                    this.selectedTranscript3pIds.add(result[0].transcriptId);
                }
            }
        },
        default: [],
    });

    // -----------------------------------------------------------------------
    // Derived fusions (reactive)
    // -----------------------------------------------------------------------

    @computed
    public get fusions(): FusionEvent[] {
        return convertStructuralVariantsToFusionEvents(this.structuralVariants);
    }

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    @action
    public setStructuralVariants(svs: StructuralVariant[]): void {
        this.structuralVariants = svs;
        this.selectedFusionId = '';
        this.selectedTranscript5pIds.clear();
        this.selectedTranscript3pIds.clear();
        const fusions = this.fusions;
        if (fusions.length > 0) {
            this.selectFusion(fusions[0].id);
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
        return this.gene1TranscriptsRemote.result || [];
    }

    @computed
    public get gene2Transcripts(): TranscriptData[] {
        return this.gene2TranscriptsRemote.result || [];
    }

    @computed
    public get transcriptsLoading(): boolean {
        return (
            this.gene1TranscriptsRemote.isPending ||
            this.gene2TranscriptsRemote.isPending
        );
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
