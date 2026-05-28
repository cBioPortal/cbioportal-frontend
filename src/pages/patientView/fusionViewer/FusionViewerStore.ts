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
    resolveFusionPartners,
    ResolvedFusion,
} from './data/partnerResolution';
import {
    fetchTranscriptsForGeneWithFallback,
    GenomeBuild,
} from './data/genomeNexusTranscriptService';
import { GENOME_ID_TO_GENOME_BUILD } from 'shared/lib/referenceGenomeUtils';

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

    // Click-to-activate: the transcript that drives the fusion product +
    // protein domain track on each side. Defaults to FORTE, falls back
    // when invalidated by a fusion switch or refetch.
    @observable public activeTranscript5pId: string = '';
    @observable public activeTranscript3pId: string = '';

    // Genome build selection (GRCh38 or GRCh37)
    @observable public genomeBuild: GenomeBuild = 'GRCh38';

    // UI display toggles
    @observable public showPromoter: boolean = true;

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
            if (!result) return;
            pruneAndFallback(this.selectedTranscript5pIds, result);
            this.activeTranscript5pId = resolveActiveId(
                this.activeTranscript5pId,
                result
            );
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
            if (!result || !this.selectedFusion?.gene2) return;
            pruneAndFallback(this.selectedTranscript3pIds, result);
            this.activeTranscript3pId = resolveActiveId(
                this.activeTranscript3pId,
                result
            );
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
    public setStructuralVariants(
        svs: StructuralVariant[],
        referenceGenome?: string
    ): void {
        this.structuralVariants = svs;
        if (referenceGenome) {
            const mapped =
                GENOME_ID_TO_GENOME_BUILD[
                    referenceGenome as keyof typeof GENOME_ID_TO_GENOME_BUILD
                ];
            if (mapped === 'GRCh37' || mapped === 'GRCh38') {
                this.genomeBuild = mapped;
            }
        }
        this.selectedFusionId = '';
        this.selectedTranscript5pIds.clear();
        this.selectedTranscript3pIds.clear();
        this.activeTranscript5pId = '';
        this.activeTranscript3pId = '';
        const fusions = this.fusions;
        if (fusions.length > 0) {
            this.selectFusion(fusions[0].id);
        }
    }

    @action
    public selectFusion(fusionId: string): void {
        const fusion = this.fusions.find(f => f.id === fusionId);
        if (!fusion) return;

        this.selectedFusionId = fusionId;

        // Reset transcript selections
        this.selectedTranscript5pIds.clear();
        this.selectedTranscript3pIds.clear();

        // Reset active drivers; they'll be backfilled by gene*TranscriptsRemote.onResult
        this.activeTranscript5pId = '';
        this.activeTranscript3pId = '';

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
                // If the active driver was just un-checked, fall back.
                if (this.activeTranscript5pId === transcriptId) {
                    this.activeTranscript5pId = resolveActiveId(
                        '',
                        this.canonicalTranscripts5p
                    );
                }
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
                if (this.activeTranscript3pId === transcriptId) {
                    this.activeTranscript3pId = resolveActiveId(
                        '',
                        this.canonicalTranscripts3p
                    );
                }
            }
        } else {
            this.selectedTranscript3pIds.add(transcriptId);
        }
    }

    @action
    public setActiveTranscript5p(transcriptId: string): void {
        this.activeTranscript5pId = transcriptId;
    }

    @action
    public setActiveTranscript3p(transcriptId: string): void {
        this.activeTranscript3pId = transcriptId;
    }

    @action
    public toggleShowPromoter(): void {
        this.showPromoter = !this.showPromoter;
    }

    // -----------------------------------------------------------------------
    // Computed
    // -----------------------------------------------------------------------

    @computed
    public get selectedFusion(): FusionEvent | undefined {
        return this.fusions.find(f => f.id === this.selectedFusionId);
    }

    /**
     * The selected fusion with canonical 5'/3' partner assignment applied.
     * gene1 is always the canonical 5' partner, gene2 is the canonical 3'.
     * Symbol/position pairings are corrected if the sanity check detected
     * a mismatch. Falls back to the raw selectedFusion if transcripts have
     * not loaded or connectionType is missing.
     */
    @computed
    public get canonicalFusion(): FusionEvent | undefined {
        const raw = this.selectedFusion;
        if (!raw) return undefined;
        const resolved = this.resolvedFusion;
        if (!resolved) return raw;

        // If the raw fusion label was the algorithmic "A::B" fallback (no eventInfo),
        // rebuild it from the canonical 5'/3' symbols so the displayed name matches
        // the rendered orientation. When the label came from eventInfo (free-text
        // like "{TMPRSS2:ERG}"), preserve it — eventInfo is already canonical.
        const rawSymbolLabel = raw.gene2
            ? `${raw.gene1.symbol}::${raw.gene2.symbol}`
            : raw.gene1.symbol;
        const fusionLabel =
            raw.fusion === rawSymbolLabel
                ? resolved.threePrime
                    ? `${resolved.fivePrime.symbol}::${resolved.threePrime.symbol}`
                    : resolved.fivePrime.symbol
                : raw.fusion;

        return {
            ...raw,
            gene1: resolved.fivePrime,
            gene2: resolved.threePrime,
            fusion: fusionLabel,
        };
    }

    /** Internal: the full ResolvedFusion (positions, transcripts, swap flag). */
    @computed
    public get resolvedFusion(): ResolvedFusion | undefined {
        const fusion = this.selectedFusion;
        if (!fusion) return undefined;
        return resolveFusionPartners({
            fusion,
            gene1Transcripts: this.gene1Transcripts,
            gene2Transcripts: this.gene2Transcripts,
        });
    }

    /** True when the canonical resolver had to swap site1<->site2. */
    @computed
    public get partnersWereSwapped(): boolean {
        return this.resolvedFusion?.swapped ?? false;
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
    public get canonicalTranscripts5p(): TranscriptData[] {
        return (
            this.resolvedFusion?.fivePrimeTranscripts ?? this.gene1Transcripts
        );
    }

    @computed
    public get canonicalTranscripts3p(): TranscriptData[] {
        return (
            this.resolvedFusion?.threePrimeTranscripts ?? this.gene2Transcripts
        );
    }

    @computed
    public get selectedTranscript5p(): TranscriptData | undefined {
        return this.canonicalTranscripts5p.find(
            t => t.transcriptId === this.selectedTranscript5pId
        );
    }

    @computed
    public get selectedTranscript3p(): TranscriptData | undefined {
        return this.canonicalTranscripts3p.find(
            t => t.transcriptId === this.selectedTranscript3pId
        );
    }

    @computed
    public get activeTranscript5p(): TranscriptData | undefined {
        if (!this.activeTranscript5pId) return undefined;
        return this.canonicalTranscripts5p.find(
            t => t.transcriptId === this.activeTranscript5pId
        );
    }

    @computed
    public get activeTranscript3p(): TranscriptData | undefined {
        if (!this.activeTranscript3pId) return undefined;
        return this.canonicalTranscripts3p.find(
            t => t.transcriptId === this.activeTranscript3pId
        );
    }

    @computed
    public get allSelectedTranscripts5p(): TranscriptData[] {
        return this.canonicalTranscripts5p.filter(t =>
            this.selectedTranscript5pIds.has(t.transcriptId)
        );
    }

    @computed
    public get allSelectedTranscripts3p(): TranscriptData[] {
        return this.canonicalTranscripts3p.filter(t =>
            this.selectedTranscript3pIds.has(t.transcriptId)
        );
    }

    @computed
    public get forteTranscript5p(): TranscriptData | undefined {
        return this.canonicalTranscripts5p.find(t => t.isForteSelected);
    }

    @computed
    public get forteTranscript3p(): TranscriptData | undefined {
        return this.canonicalTranscripts3p.find(t => t.isForteSelected);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripVersionSuffix(transcriptId: string): string {
    return transcriptId.replace(/\.\d+$/, '');
}

/**
 * Prune selected transcript IDs against the fetched result.
 * If all selected IDs are invalid (not in result), fall back to
 * the FORTE-selected transcript or the first available.
 */
function pruneAndFallback(
    selectedIds: ObservableSet<string>,
    result: TranscriptData[]
): void {
    const validIds = new Set(result.map(t => t.transcriptId));

    // Remove any selected IDs not present in the result
    for (const id of Array.from(selectedIds)) {
        if (!validIds.has(id)) {
            selectedIds.delete(id);
        }
    }

    // If nothing remains selected, fall back
    if (selectedIds.size === 0 && result.length > 0) {
        const forte = result.find(t => t.isForteSelected);
        selectedIds.add(forte ? forte.transcriptId : result[0].transcriptId);
    }
}

/**
 * Ensure an active-transcript ID points to a transcript in `result`.
 * If the current ID is empty or not present, pick the FORTE-selected
 * transcript, else the first result, else leave as empty string.
 */
function resolveActiveId(currentId: string, result: TranscriptData[]): string {
    if (result.length === 0) return '';
    if (currentId && result.some(t => t.transcriptId === currentId)) {
        return currentId;
    }
    const forte = result.find(t => t.isForteSelected);
    return forte ? forte.transcriptId : result[0].transcriptId;
}
