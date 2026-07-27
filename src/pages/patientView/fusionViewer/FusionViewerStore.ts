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

    // User multi-select OVERRIDE (checkbox UI). Empty means "use the derived
    // default"; reads go through the effectiveSelected* computeds, never these
    // sets directly. Populated only once the user toggles a checkbox.
    @observable public selectedTranscript5pIds: ObservableSet<
        string
    > = observable.set<string>();
    @observable public selectedTranscript3pIds: ObservableSet<
        string
    > = observable.set<string>();

    // Click-to-activate OVERRIDE: the transcript the user pinned to drive the
    // fusion product + domain track on each side. Empty means "use the derived
    // default"; reads go through the effectiveActive* computeds.
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

    // The transcript selection/active state is NOT seeded here. It is derived
    // from the RESOLVED transcript lists (canonicalTranscripts5p/3p) via the
    // effectiveSelected*/effectiveActive* computeds, so it stays correct through
    // partner swaps (where the resolved 5'/3' list is not the raw gene1/gene2
    // remote's) without any imperative, timing-sensitive seeding.
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

        // Clear the user overrides so the new fusion falls back to its derived
        // default (origin-gated, keyed on the resolved transcript lists).
        this.selectedTranscript5pIds.clear();
        this.selectedTranscript3pIds.clear();
        this.activeTranscript5pId = '';
        this.activeTranscript3pId = '';
    }

    @action
    public toggleTranscript5p(transcriptId: string): void {
        // Materialize the current effective selection (which includes the
        // derived default) into the override, then apply the toggle — so the
        // first user click captures the default rather than dropping it. The
        // active driver is left alone: effectiveActive5pId re-derives within the
        // new selection if the active transcript was un-checked.
        const current = this.effectiveSelected5pIds;
        if (current.has(transcriptId)) {
            if (current.size > 1) {
                const next = new Set(current);
                next.delete(transcriptId);
                this.selectedTranscript5pIds.replace(next);
            }
        } else {
            const next = new Set(current);
            next.add(transcriptId);
            this.selectedTranscript5pIds.replace(next);
        }
    }

    @action
    public toggleTranscript3p(transcriptId: string): void {
        const current = this.effectiveSelected3pIds;
        if (current.has(transcriptId)) {
            if (current.size > 1) {
                const next = new Set(current);
                next.delete(transcriptId);
                this.selectedTranscript3pIds.replace(next);
            }
        } else {
            const next = new Set(current);
            next.add(transcriptId);
            this.selectedTranscript3pIds.replace(next);
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
        const ids = Array.from(this.effectiveSelected5pIds);
        return ids.length > 0 ? ids[0] : '';
    }

    @computed
    public get selectedTranscript3pId(): string {
        const ids = Array.from(this.effectiveSelected3pIds);
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

    // ---- Effective selection (override, else origin-gated default) ----------
    // Derived from the RESOLVED transcript lists, so the ticked/active state is
    // always keyed on what the checkbox column actually shows — correct through
    // partner swaps. Every read (checkbox, diagram, active driver) goes here.
    @computed
    public get effectiveSelected5pIds(): Set<string> {
        return computeEffectiveSelection(
            this.selectedTranscript5pIds,
            this.canonicalTranscripts5p,
            !!this.selectedFusion?.isRnaDerived
        );
    }

    @computed
    public get effectiveSelected3pIds(): Set<string> {
        return computeEffectiveSelection(
            this.selectedTranscript3pIds,
            this.canonicalTranscripts3p,
            !!this.selectedFusion?.isRnaDerived
        );
    }

    @computed
    public get effectiveActive5pId(): string {
        return computeEffectiveActive(
            this.activeTranscript5pId,
            this.effectiveSelected5pIds,
            this.canonicalTranscripts5p,
            !!this.selectedFusion?.isRnaDerived
        );
    }

    @computed
    public get effectiveActive3pId(): string {
        return computeEffectiveActive(
            this.activeTranscript3pId,
            this.effectiveSelected3pIds,
            this.canonicalTranscripts3p,
            !!this.selectedFusion?.isRnaDerived
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
        if (!this.effectiveActive5pId) return undefined;
        return this.canonicalTranscripts5p.find(
            t => t.transcriptId === this.effectiveActive5pId
        );
    }

    @computed
    public get activeTranscript3p(): TranscriptData | undefined {
        if (!this.effectiveActive3pId) return undefined;
        return this.canonicalTranscripts3p.find(
            t => t.transcriptId === this.effectiveActive3pId
        );
    }

    @computed
    public get allSelectedTranscripts5p(): TranscriptData[] {
        return this.canonicalTranscripts5p.filter(t =>
            this.effectiveSelected5pIds.has(t.transcriptId)
        );
    }

    @computed
    public get allSelectedTranscripts3p(): TranscriptData[] {
        return this.canonicalTranscripts3p.filter(t =>
            this.effectiveSelected3pIds.has(t.transcriptId)
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

/**
 * The effective 5'/3' selection: the user's override when it is non-empty (and
 * still valid against the resolved transcript list), otherwise a single
 * origin-gated default. Keyed on `canonical` (the RESOLVED list the checkbox
 * column shows) so the ticked state is correct through partner swaps.
 *
 * When `canonical` is empty (transcripts not loaded yet / unit tests) the raw
 * override is returned as-is — there is nothing to derive a default from.
 */
function computeEffectiveSelection(
    override: ObservableSet<string>,
    canonical: TranscriptData[],
    isRnaDerived: boolean
): Set<string> {
    if (canonical.length === 0) {
        return new Set(override);
    }
    const validIds = new Set(canonical.map(t => t.transcriptId));
    if (override.size > 0) {
        const pruned = new Set(
            Array.from(override).filter(id => validIds.has(id))
        );
        // Keep a still-valid user selection; if the override held only stale
        // ids (e.g. after a genome-build refetch) fall through to the default.
        if (pruned.size > 0) return pruned;
    }
    return new Set([
        computeDefaultTranscript(canonical, isRnaDerived).transcriptId,
    ]);
}

/**
 * The effective active-driver id: the user's pinned active transcript when it is
 * part of the effective selection, else the origin default when that is
 * selected, else the first selected transcript — so the rendered driver is
 * always one of the ticked transcripts.
 */
function computeEffectiveActive(
    override: string,
    effectiveSelected: Set<string>,
    canonical: TranscriptData[],
    isRnaDerived: boolean
): string {
    if (override && effectiveSelected.has(override)) return override;
    if (canonical.length === 0 || effectiveSelected.size === 0) return '';
    const def = computeDefaultTranscript(canonical, isRnaDerived).transcriptId;
    if (effectiveSelected.has(def)) return def;
    return effectiveSelected.values().next().value ?? def;
}

/**
 * The origin-gated default transcript:
 *   - RNA-derived fusion: the caller-selected transcript, else canonical, else
 *     the FORTE/first default driver.
 *   - DNA SV: the MSK canonical isoform, else the FORTE/first default driver.
 *
 * Shared by the checkbox default and the active-driver resolution so the ticked
 * transcript and the rendered diagram never disagree.
 */
function computeDefaultTranscript(
    result: TranscriptData[],
    isRnaDerived: boolean
): TranscriptData {
    const callerSelected = result.find(t => t.isCallerSelected);
    const canonical = result.find(t => t.isCanonical);
    const forte = result.find(t => t.isForteSelected);
    return isRnaDerived
        ? callerSelected || canonical || forte || result[0]
        : canonical || forte || result[0];
}
