import * as React from 'react';
import { observer } from 'mobx-react';
import {
    computed,
    observable,
    action,
    makeObservable,
    reaction,
    comparer,
} from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    ColoringMenuOmnibarOption,
    ColoringMenuOmnibarGroup,
} from 'shared/components/plots/PlotsTabTypes';
import {
    makeEmbeddingScatterPlotData,
    EmbeddingPlotPoint,
    getEmbeddingDataFields,
    EMBEDDING_DATA_PREFIX,
    preComputeEmbeddingDataColors,
    getGeneAlterationLabel,
} from 'shared/components/plots/EmbeddingPlotUtils';
import {
    EmbeddingDeckGLVisualization,
    EmbeddingDataOption,
} from 'shared/components/embeddings';
import { EmbeddingControlStack } from 'shared/components/embeddings/controls/EmbeddingControlStack';
import {
    GradientOverride,
    makeGradientColorFn,
    getGradientStops,
    seedLowHighColors,
    pickPercentileRange,
} from 'shared/components/embeddings/controls/GradientRangeEditor';
import { Gene, ClinicalData } from 'cbioportal-ts-api-client';
import { addCancerStudyAttribute } from 'shared/lib/ClinicalAttributeUtils';

import {
    EmbeddingData,
    ViewState,
    EmbeddingPoint,
} from 'shared/components/embeddings/EmbeddingTypes';
import { calculateDataBounds } from 'shared/components/embeddings/utils/dataUtils';
import {
    preComputeClinicalDataMaps,
    getMolecularDataForGeneSync,
    aggregateMolecularDataByPatient,
} from 'shared/lib/PatientMolecularDataUtils';

export interface IEmbeddingsPanelProps {
    store: StudyViewPageStore;
    panelIndex: 1 | 2 | 3 | 4;
    panelCount: number;
    selectionMode: 'none' | 'lasso';
    onSelectionModeChange: (mode: 'none' | 'lasso') => void;
    tooltipFields: Set<string>;
    onTooltipFieldsChange: (fields: Set<string>) => void;
    hiddenQcCategories: Set<string>;
    onToggleQcCategoryVisibility: (category: string) => void;
    // Cross-panel sample-identity filter; this panel contributes to it via onSetPanelHiddenSampleKeys.
    hiddenSampleKeys: Set<string>;
    onSetPanelHiddenSampleKeys: (keys: Set<string>) => void;
    onReportSampleCounts?: (info: {
        total: number;
        visible: number;
        embeddingSampleSize: number;
        embeddingDescription: string;
        embeddingType: 'patients' | 'samples';
        cohortCount: number;
    }) => void;
    clearFilterRequestId: number;
    // Plain mutable holder, not a reactive prop - see EmbeddingsTab's
    // primaryViewStateHolder.
    primaryViewStateHolder: { current: ViewState | null };
    onPrimaryViewStateChange: (viewState: ViewState) => void;
    isLockedToPrimary: boolean;
    onToggleLockedToPrimary: () => void;
    // When true, every panel shows the same map (driven from the status
    // bar's dropdown) instead of its own.
    isMapLocked: boolean;
    onToggleLockMap: () => void;
    sharedMapValue?: string;
    onSharedMapChange: (value: string) => void;
    onSetPanelCount: (target: number) => void;
}

const EMBEDDING_BASE_URL =
    'https://datahub.assets.cbioportal.org/embeddings/msk_mosaic_2026';

// Module-level singleton so every panel shares one fetch.
const boehmHeData = remoteData<EmbeddingData>({
    await: () => [],
    invoke: async () => {
        const response = await fetch(`${EMBEDDING_BASE_URL}/umap_he_50k.json`);
        if (!response.ok) {
            throw new Error('Failed to load H&E embedding data');
        }
        return response.json();
    },
});

@observer
export class EmbeddingsPanel extends React.Component<
    IEmbeddingsPanelProps,
    {}
> {
    // .ref, not deep: custom attributes' 'data' can reference back to their own parent, which a deep enhancer would loop on.
    @observable.ref private selectedColoringOption?: ColoringMenuOmnibarOption;
    // undefined means "use the auto-computed range and colors".
    @observable.ref private gradientOverride: GradientOverride | undefined;
    // The ruler the gradient bar/handles/histogram are drawn against; undefined means the full data range.
    @observable.ref private viewRange: [number, number] | undefined;
    @observable private mutationTypeEnabled = true;
    @observable private copyNumberEnabled = true;
    @observable private structuralVariantEnabled = true;
    @observable private selectedEmbeddingValue: string = 'msk_mosaic_2026_he';
    @observable.ref private viewState: ViewState = {
        target: [0, 0, 0],
        zoom: 0,
        minZoom: -5,
        maxZoom: 10,
    };
    @observable private windowHeight = window.innerHeight;
    @observable private legendCollapsed = false;
    @observable.ref private pinnedPoint: EmbeddingPoint | null = null;
    // This panel's own legend toggle state - see ownHiddenSampleKeys for
    // how it's translated into the shared cross-panel filter.
    @observable.ref private localHiddenCategories = new Set<string>();
    // null means no lasso filter active; applied globally only via
    // applyFilterGlobally (the "Make Global" button).
    @observable.ref private lassoSelectedKeys: Set<string> | null = null;
    private urlParameterReactionDisposer?: () => void;
    private urlSyncReactionDisposer?: () => void;
    private viewStateReactionDisposer?: () => void;
    private driverAnnotationReactionDisposer?: () => void;
    private filterChangeReactionDisposer?: () => void;
    private hiddenSampleKeysReactionDisposer?: () => void;
    private sampleCountsReportReactionDisposer?: () => void;
    private viewStateInitialized = false;
    private centerViewTimeoutId?: ReturnType<typeof setTimeout>;
    // @observer makes `this.props` reactive as one unit, so any prop change was invalidating every computed; cache the never-changing store.
    private readonly store = this.props.store;
    // These DO need to stay reactive, so mirror them into their own observables, updated in componentDidUpdate.
    @observable.ref private hiddenSampleKeysMirror = this.props
        .hiddenSampleKeys;
    @observable.ref private hiddenQcCategoriesMirror = this.props
        .hiddenQcCategories;
    @observable.ref private tooltipFieldsMirror = this.props.tooltipFields;

    // Clinical attributes that always have a fixed tooltip row and so are
    // excluded from the user-toggleable tooltip fields dropdown.
    private static readonly FIXED_TOOLTIP_CLINICAL_ATTRIBUTE_IDS = [
        'CANCER_TYPE',
        'CANCER_TYPE_DETAILED',
        'SAMPLE_TYPE',
    ];

    // Panel 1 keeps the unsuffixed name for backward compatibility with
    // already-shared links; panels 2-4 use suffixed names.
    @computed private get coloringParamName(): string {
        return this.props.panelIndex === 1
            ? 'embeddings_coloring_selection'
            : `embeddings_panel${this.props.panelIndex}_coloring_selection`;
    }

    @computed private get mapParamName(): string {
        return this.props.panelIndex === 1
            ? 'embeddings_map'
            : `embeddings_panel${this.props.panelIndex}_map`;
    }

    @computed private get legendCollapsedParamName(): string {
        return this.props.panelIndex === 1
            ? 'embeddings_legend_collapsed'
            : `embeddings_panel${this.props.panelIndex}_legend_collapsed`;
    }

    constructor(props: IEmbeddingsPanelProps) {
        super(props);
        makeObservable(this);

        this.initializeDefaultColoring();

        const urlWrapper = (this.store as any).urlWrapper;
        const mapFromUrl = urlWrapper?.query?.[this.mapParamName];
        if (mapFromUrl) {
            this.selectedEmbeddingValue = mapFromUrl;
        }
        this.legendCollapsed =
            urlWrapper?.query?.[this.legendCollapsedParamName] === 'true';

        this.handleResize = this.handleResize.bind(this);

        // Debounced: plotData can change reference several times right after mount, each queueing its own centerView().
        this.viewStateReactionDisposer = reaction(
            () => this.plotData,
            plotData => {
                if (
                    plotData &&
                    plotData.length > 0 &&
                    !this.viewStateInitialized
                ) {
                    if (this.centerViewTimeoutId !== undefined) {
                        clearTimeout(this.centerViewTimeoutId);
                    }
                    this.centerViewTimeoutId = setTimeout(() => {
                        this.centerViewTimeoutId = undefined;
                        if (!this.viewStateInitialized) {
                            this.centerView();
                            this.viewStateInitialized = true;
                        }
                    }, 100);
                }
            }
        );

        this.urlParameterReactionDisposer = reaction(
            () => {
                const urlOption = this.coloringFromURLParameter;
                const clinicalAttributesReady =
                    this.clinicalAttributes.length > 0;
                const urlWrapperReady = !!(this.store as any).urlWrapper;

                return {
                    urlOption,
                    clinicalAttributesReady,
                    urlWrapperReady,
                    hasUrlParams: this.hasExistingURLParameters,
                };
            },
            ({
                urlOption,
                clinicalAttributesReady,
                urlWrapperReady,
                hasUrlParams,
            }) => {
                if (!urlWrapperReady || !clinicalAttributesReady) {
                    return;
                }

                if (urlOption) {
                    // Compare logical value, not reference - avoids a
                    // loop when URL sync creates new object references.
                    const currentAttrId = this.selectedColoringOption?.info
                        ?.clinicalAttribute?.clinicalAttributeId;
                    const currentGeneId = this.selectedColoringOption?.info
                        ?.entrezGeneId;
                    const urlAttrId =
                        urlOption.info?.clinicalAttribute?.clinicalAttributeId;
                    const urlGeneId = urlOption.info?.entrezGeneId;

                    if (
                        currentAttrId === urlAttrId &&
                        currentGeneId === urlGeneId
                    ) {
                        return;
                    }
                    this.selectedColoringOption = urlOption;
                } else if (!hasUrlParams) {
                    const defaultOption = this.getDefaultColoringOption();
                    if (defaultOption) {
                        this.selectedColoringOption = defaultOption;
                        this.syncColoringSelectionToURL(defaultOption);
                    }
                }
            },
            { fireImmediately: true }
        );

        this.driverAnnotationReactionDisposer = reaction(
            () => ({
                entrezGeneId: this.selectedColoringOption?.info?.entrezGeneId,
                driversAnnotated: this.store.driverAnnotationSettings
                    ?.driversAnnotated,
            }),
            ({ entrezGeneId, driversAnnotated }) => {
                // -3 is "Cancer Type", -10000 is "None" - neither is a
                // real gene selection.
                if (
                    entrezGeneId &&
                    entrezGeneId !== -3 &&
                    entrezGeneId !== -10000 &&
                    !driversAnnotated
                ) {
                    this.enableDriverAnnotations();
                }
            },
            { fireImmediately: true }
        );

        this.filterChangeReactionDisposer = reaction(
            () => this.store.numberOfSelectedSamplesInCustomSelection,
            count => {
                if (count === 0) {
                    this.pinnedPoint = null;
                }
            }
        );

        // Deferred via setTimeout: a synchronous push during this same reaction flush cascades into "Maximum update depth exceeded".
        this.hiddenSampleKeysReactionDisposer = reaction(
            () => this.ownHiddenSampleKeys,
            keys => {
                setTimeout(
                    () => this.props.onSetPanelHiddenSampleKeys(keys),
                    0
                );
            },
            { fireImmediately: true }
        );

        this.sampleCountsReportReactionDisposer = reaction(
            () => {
                const allSamples = this.store.samples.result || [];
                const embeddingType =
                    this.selectedEmbedding?.data.embedding_type || 'samples';
                // Same unit as the embedding, so directly comparable to
                // totalSampleCount.
                const cohortCount =
                    embeddingType === 'patients'
                        ? new Set(allSamples.map(s => s.patientId)).size
                        : allSamples.length;
                return {
                    total: this.totalSampleCount,
                    visible: this.visibleSampleCount,
                    embeddingSampleSize:
                        this.selectedEmbedding?.data.sampleSize || 0,
                    embeddingDescription:
                        this.selectedEmbedding?.data.description || '',
                    embeddingType: embeddingType as 'patients' | 'samples',
                    cohortCount,
                };
            },
            info => {
                if (this.props.onReportSampleCounts) {
                    this.props.onReportSampleCounts(info);
                }
            },
            // Structural equality: the tracking function returns a fresh object each time, risking a self-sustaining loop.
            { fireImmediately: true, equals: comparer.structural }
        );
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        if (this.props.isLockedToPrimary) {
            this.adoptPrimaryViewState();
            this.startLockPolling();
        }
    }

    componentDidUpdate(prevProps: IEmbeddingsPanelProps) {
        if (prevProps.isLockedToPrimary !== this.props.isLockedToPrimary) {
            if (this.props.isLockedToPrimary) {
                this.adoptPrimaryViewState();
                this.startLockPolling();
            } else {
                this.stopLockPolling();
            }
        }
        if (
            prevProps.clearFilterRequestId !== this.props.clearFilterRequestId
        ) {
            this.clearOwnFilters();
        }
        if (
            this.props.isMapLocked &&
            this.props.sharedMapValue !== undefined &&
            prevProps.sharedMapValue !== this.props.sharedMapValue
        ) {
            this.onEmbeddingChange({
                value: this.props.sharedMapValue,
                label: '',
            });
        }
        this.syncReactivePropMirrors(prevProps);
    }

    @action.bound
    private syncReactivePropMirrors(prevProps: IEmbeddingsPanelProps) {
        if (prevProps.hiddenSampleKeys !== this.props.hiddenSampleKeys) {
            this.hiddenSampleKeysMirror = this.props.hiddenSampleKeys;
        }
        if (prevProps.hiddenQcCategories !== this.props.hiddenQcCategories) {
            this.hiddenQcCategoriesMirror = this.props.hiddenQcCategories;
        }
        if (prevProps.tooltipFields !== this.props.tooltipFields) {
            this.tooltipFieldsMirror = this.props.tooltipFields;
        }
    }

    @action.bound
    private clearOwnFilters() {
        this.localHiddenCategories = new Set();
        this.lassoSelectedKeys = null;
    }

    // Polls the shared viewState holder (a plain mutable object any panel writes to) rather than a reactive prop.
    private lockPollRafId?: number;

    private startLockPolling() {
        if (this.lockPollRafId !== undefined) {
            return;
        }
        const poll = () => {
            if (!this.props.isLockedToPrimary) {
                this.lockPollRafId = undefined;
                return;
            }
            const primary = this.props.primaryViewStateHolder.current;
            if (primary && primary !== this.viewState) {
                this.adoptPrimaryViewState();
            }
            this.lockPollRafId = requestAnimationFrame(poll);
        };
        this.lockPollRafId = requestAnimationFrame(poll);
    }

    private stopLockPolling() {
        if (this.lockPollRafId !== undefined) {
            cancelAnimationFrame(this.lockPollRafId);
            this.lockPollRafId = undefined;
        }
    }

    @action.bound
    private adoptPrimaryViewState() {
        const primary = this.props.primaryViewStateHolder.current;
        if (primary) {
            this.viewState = primary;
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
        if (this.viewStateReactionDisposer) {
            this.viewStateReactionDisposer();
        }
        if (this.urlParameterReactionDisposer) {
            this.urlParameterReactionDisposer();
        }
        if (this.urlSyncReactionDisposer) {
            this.urlSyncReactionDisposer();
        }
        if (this.driverAnnotationReactionDisposer) {
            this.driverAnnotationReactionDisposer();
        }
        if (this.filterChangeReactionDisposer) {
            this.filterChangeReactionDisposer();
        }
        if (this.hiddenSampleKeysReactionDisposer) {
            this.hiddenSampleKeysReactionDisposer();
        }
        if (this.sampleCountsReportReactionDisposer) {
            this.sampleCountsReportReactionDisposer();
        }
        if (this.centerViewTimeoutId !== undefined) {
            clearTimeout(this.centerViewTimeoutId);
        }
        this.stopLockPolling();
    }

    @action.bound
    private handleResize() {
        this.windowHeight = window.innerHeight;
    }

    private initializeDefaultColoring() {
        const defaultOption = this.getDefaultColoringOption();
        if (defaultOption) {
            this.selectedColoringOption = defaultOption;
        }
    }

    private getDefaultColoringOption(): ColoringMenuOmnibarOption | undefined {
        const cancerTypeAttr = this.clinicalAttributes.find(
            attr => attr.clinicalAttributeId === 'CANCER_TYPE_DETAILED'
        );
        if (cancerTypeAttr) {
            return {
                info: { clinicalAttribute: cancerTypeAttr },
                label: cancerTypeAttr.displayName,
                value: `clinical_${cancerTypeAttr.clinicalAttributeId}`,
            } as ColoringMenuOmnibarOption;
        } else {
            return {
                label: 'None',
                value: 'none',
                info: {
                    entrezGeneId: -10000,
                },
            };
        }
    }

    private parseColoringSelectionFromURL(
        selectedOption: string
    ): ColoringMenuOmnibarOption | undefined {
        try {
            // Gene selection: "entrezGeneId_undefined"
            const geneMatch = selectedOption.match(/^(\d+)_/);
            if (geneMatch) {
                const entrezGeneId = parseInt(geneMatch[1]);
                const gene = this.genes.find(
                    g => g.entrezGeneId === entrezGeneId
                );
                if (gene) {
                    return {
                        info: { entrezGeneId: gene.entrezGeneId },
                        label: gene.hugoGeneSymbol,
                        value: `${gene.entrezGeneId}_${gene.hugoGeneSymbol}`,
                    } as ColoringMenuOmnibarOption;
                }
            }

            // Clinical attribute: "undefined_{...json...}", matching
            // PlotsTab's encoding.
            if (selectedOption.startsWith('undefined_')) {
                const jsonPart = selectedOption.substring('undefined_'.length);
                const unescapedJson = jsonPart.replace(/\\"/g, '"');
                const clinicalInfo = JSON.parse(unescapedJson);

                const embeddingFields = this.selectedEmbedding?.data
                    ? getEmbeddingDataFields(this.selectedEmbedding.data)
                    : [];
                const clinicalAttr = [
                    ...this.clinicalAttributes,
                    ...embeddingFields,
                ].find(
                    attr =>
                        attr.clinicalAttributeId ===
                        clinicalInfo.clinicalAttributeId
                );

                if (clinicalAttr) {
                    return {
                        info: { clinicalAttribute: clinicalAttr },
                        label: clinicalAttr.displayName,
                        value: `clinical_${clinicalAttr.clinicalAttributeId}`,
                    } as ColoringMenuOmnibarOption;
                }
            }

            return undefined;
        } catch (e) {
            return undefined;
        }
    }

    @computed get clinicalAttributes() {
        const baseAttributes = this.store.clinicalAttributes.result || [];
        const customAttributes = this.store.customAttributes.result || [];
        return addCancerStudyAttribute([
            ...baseAttributes,
            ...customAttributes,
        ]);
    }

    private getClinicalAttributeValueMap(
        clinicalAttributeId: string
    ): Map<string, string> {
        const attr = this.clinicalAttributes.find(
            a => a.clinicalAttributeId === clinicalAttributeId
        );
        if (!attr) {
            return new Map();
        }

        const cacheEntry = this.store.clinicalDataCache.get(attr);
        if (!cacheEntry?.isComplete || !cacheEntry.result) {
            return new Map();
        }

        // Keyed by uniqueSampleKey like every other sample-embedding lookup, not patientId (which would be wrong for sample-only attributes).
        if (this.selectedEmbedding?.data.embedding_type === 'samples') {
            const sampleValueMap = new Map<string, string>();
            cacheEntry.result.data.forEach(d => {
                if ('value' in d) {
                    sampleValueMap.set(d.uniqueSampleKey, d.value || 'Unknown');
                }
            });
            return sampleValueMap;
        }

        const maps = preComputeClinicalDataMaps(
            cacheEntry.result.data,
            null,
            cacheEntry.result.numericalValueToColor,
            attr.patientAttribute || false
        );
        return maps.patientValueMap;
    }

    // Every study clinical attribute the user can add to the tooltip via the
    // "Tooltip fields" dropdown, same universe as the coloring dropdown.
    @computed get tooltipClinicalAttributeOptions(): {
        value: string;
        label: string;
    }[] {
        return this.clinicalAttributes
            .filter(
                attr =>
                    !EmbeddingsPanel.FIXED_TOOLTIP_CLINICAL_ATTRIBUTE_IDS.includes(
                        attr.clinicalAttributeId
                    )
            )
            .map(attr => ({
                value: `clinical_${attr.clinicalAttributeId}`,
                label: attr.displayName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Fields embedded directly in the current embedding's data (e.g. "Data Partition (Split)") - the "Map Attributes" group.
    @computed get tooltipMapAttributeOptions(): {
        value: string;
        label: string;
    }[] {
        const fields = this.selectedEmbedding?.data
            ? getEmbeddingDataFields(this.selectedEmbedding.data)
            : [];
        return fields
            .map(attr => ({
                value: `mapattr_${attr.displayName}`,
                label: attr.displayName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Genes the user can add to the tooltip as an alteration status field,
    // same universe as the coloring dropdown's "Genes" group.
    @computed get tooltipGeneOptions(): { value: string; label: string }[] {
        return this.genes
            .map(gene => ({
                value: `gene_${gene.entrezGeneId}`,
                label: gene.hugoGeneSymbol,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Grouped options for the "Tooltip fields" dropdown, matching the
    // coloring dropdown's Genes / Map Attributes / Clinical Attributes groups.
    @computed get tooltipFieldGroups(): {
        label: string;
        options: { value: string; label: string }[];
    }[] {
        const groups: {
            label: string;
            options: { value: string; label: string }[];
        }[] = [];
        if (this.tooltipGeneOptions.length > 0) {
            groups.push({ label: 'Genes', options: this.tooltipGeneOptions });
        }
        if (this.tooltipMapAttributeOptions.length > 0) {
            groups.push({
                label: 'Map Attributes',
                options: this.tooltipMapAttributeOptions,
            });
        }
        if (this.tooltipClinicalAttributeOptions.length > 0) {
            groups.push({
                label: 'Clinical Attributes',
                options: this.tooltipClinicalAttributeOptions,
            });
        }
        return groups;
    }

    // Flat lookup of every selectable tooltip field, used to resolve labels.
    @computed get tooltipFieldOptions(): { value: string; label: string }[] {
        return this.tooltipFieldGroups.reduce<
            { value: string; label: string }[]
        >((acc, group) => acc.concat(group.options), []);
    }

    // Value maps for the fixed clinical attribute fields plus whichever
    // optional ones are currently selected in the tooltip fields dropdown.
    @computed get tooltipClinicalAttributeValueMaps(): Map<
        string,
        Map<string, string>
    > {
        const ids = new Set(
            EmbeddingsPanel.FIXED_TOOLTIP_CLINICAL_ATTRIBUTE_IDS
        );
        this.tooltipFieldsMirror.forEach(field => {
            if (field.startsWith('clinical_')) {
                ids.add(field.slice('clinical_'.length));
            }
        });

        const result = new Map<string, Map<string, string>>();
        ids.forEach(id => {
            result.set(id, this.getClinicalAttributeValueMap(id));
        });
        return result;
    }

    // Value maps (keyed by patientId or sampleId, matching the current
    // embedding type) for whichever "Map Attributes" fields are selected.
    @computed get tooltipMapAttributeValueMaps(): Map<
        string,
        Map<string, string>
    > {
        const result = new Map<string, Map<string, string>>();
        const embeddingData = this.selectedEmbedding?.data;
        if (!embeddingData) {
            return result;
        }

        const fieldsByKey = new Map(
            getEmbeddingDataFields(embeddingData).map(attr => [
                attr.displayName,
                attr,
            ])
        );

        this.tooltipFieldsMirror.forEach(field => {
            if (!field.startsWith('mapattr_')) {
                return;
            }
            const key = field.slice('mapattr_'.length);
            const attr = fieldsByKey.get(key);
            if (!attr) {
                return;
            }
            const { valueMap } = preComputeEmbeddingDataColors(
                embeddingData,
                key,
                attr.datatype === 'NUMBER'
            );
            result.set(key, valueMap);
        });
        return result;
    }

    // Alteration-status value maps (keyed by patientId) for whichever genes
    // are selected in the tooltip fields dropdown.
    @computed get tooltipGeneValueMaps(): Map<number, Map<string, string>> {
        const result = new Map<number, Map<string, string>>();
        const driverSettings = this.store.driverAnnotationSettings;
        const driversAnnotated = driverSettings?.driversAnnotated || false;
        const plotsTabStore = this.store.plotsTabStore;

        // Gate on annotation readiness like molecularDataForColoring - reading the cache too early caches putativeDriver as false forever.
        if (driversAnnotated && driverSettings) {
            if (
                driverSettings.oncoKb &&
                !plotsTabStore.oncoKbMutationAnnotationForOncoprint.isComplete
            ) {
                return result;
            }
            if (
                driverSettings.hotspots &&
                !plotsTabStore.isHotspotForOncoprint.isComplete
            ) {
                return result;
            }
            if (!plotsTabStore.getMutationPutativeDriverInfo.isComplete) {
                return result;
            }
        }

        const allSamples = this.store.samples.result || [];

        this.tooltipFieldsMirror.forEach(field => {
            if (!field.startsWith('gene_')) {
                return;
            }
            const entrezGeneId = parseInt(field.slice('gene_'.length), 10);
            if (isNaN(entrezGeneId)) {
                return;
            }

            const molecularData = getMolecularDataForGeneSync(
                entrezGeneId,
                this.store.plotsTabStore,
                {
                    mutationTypeEnabled: this.mutationTypeEnabled,
                    copyNumberEnabled: this.copyNumberEnabled,
                    structuralVariantEnabled: this.structuralVariantEnabled,
                }
            );
            const byPatient = aggregateMolecularDataByPatient(
                allSamples,
                molecularData.mutations,
                molecularData.cnas,
                molecularData.svs
            );

            const valueMap = new Map<string, string>();
            byPatient.forEach((data, patientId) => {
                valueMap.set(
                    patientId,
                    getGeneAlterationLabel(data, driversAnnotated)
                );
            });
            result.set(entrezGeneId, valueMap);
        });
        return result;
    }

    @computed get embeddingDataGroups(): ColoringMenuOmnibarGroup[] {
        const embeddingDataFields = this.selectedEmbedding?.data
            ? getEmbeddingDataFields(this.selectedEmbedding.data)
            : [];
        if (embeddingDataFields.length === 0) {
            return [];
        }
        return [
            {
                label: 'Map Attributes',
                options: embeddingDataFields.map(attr => ({
                    label: attr.displayName,
                    value: `clinical_${attr.clinicalAttributeId}`,
                    info: {
                        clinicalAttribute: attr,
                    },
                })),
            },
        ];
    }

    @computed get hasExistingURLParameters(): boolean {
        const embeddingsColoringSelection = (this.store as any).urlWrapper
            ?.query?.[this.coloringParamName];
        return !!embeddingsColoringSelection?.selectedOption;
    }

    @computed get genes(): Gene[] {
        const genesResult = this.store.allGenes;
        return genesResult.isComplete ? genesResult.result || [] : [];
    }

    @computed get coloringFromURLParameter():
        | ColoringMenuOmnibarOption
        | undefined {
        const embeddingsColoringSelection = (this.store as any).urlWrapper
            ?.query?.[this.coloringParamName];
        if (embeddingsColoringSelection?.selectedOption) {
            const selectedOption = embeddingsColoringSelection.selectedOption;

            // Gene selection ("1956_undefined") - wait for genes to load.
            if (selectedOption.match(/^\d+_/)) {
                if (this.genes.length === 0) {
                    return undefined;
                }
            }

            const parsedOption = this.parseColoringSelectionFromURL(
                selectedOption
            );
            if (parsedOption) {
                return parsedOption;
            }
        }

        return undefined;
    }

    @computed get effectiveColoringOption():
        | ColoringMenuOmnibarOption
        | undefined {
        return this.selectedColoringOption;
    }

    private isDefaultColoring(option: ColoringMenuOmnibarOption): boolean {
        return (
            option.info?.clinicalAttribute?.clinicalAttributeId ===
                'CANCER_TYPE_DETAILED' || option.info?.entrezGeneId === -10000
        );
    }

    @action.bound
    private applyColoringOption(option: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;
    }

    @computed get plotHeight(): number {
        const viewportHeight = this.windowHeight;
        const bottomPadding = 90;
        const contentTop = 300;
        // 4 panels lay out as a 2x2 grid (see EmbeddingsTab.tsx).
        const rowCount = this.props.panelCount === 4 ? 2 : 1;
        const rowGap = 12;

        const availableHeight =
            viewportHeight -
            contentTop -
            bottomPadding -
            (rowCount - 1) * rowGap;
        const calculatedHeight = availableHeight / rowCount;
        const minHeight = rowCount > 1 ? 300 : 500;
        return Math.max(minHeight, calculatedHeight);
    }

    @computed get mutationDataExists(): boolean {
        return !!this.store.plotsTabStore.annotatedMutationCache;
    }

    @computed get cnaDataExists(): boolean {
        return !!this.store.plotsTabStore.annotatedCnaCache;
    }

    @computed get svDataExists(): boolean {
        return !!this.store.plotsTabStore.structuralVariantCache;
    }

    @computed get allEmbeddingOptions(): EmbeddingDataOption[] {
        const options: EmbeddingDataOption[] = [];
        if (boehmHeData.isComplete && boehmHeData.result) {
            options.push({
                value: 'msk_mosaic_2026_he',
                label: boehmHeData.result.title,
                data: boehmHeData.result,
            });
        }

        return options;
    }

    @computed get currentStudyIds(): string[] {
        return this.store.queriedPhysicalStudyIds.result || [];
    }

    @computed get embeddingOptions(): EmbeddingDataOption[] {
        if (this.currentStudyIds.length === 0) {
            return [];
        }

        return this.allEmbeddingOptions.filter(option =>
            this.currentStudyIds.some(studyId =>
                option.data.studyIds.includes(studyId)
            )
        );
    }

    @computed get isEmbeddingDataLoading(): boolean {
        return boehmHeData.isPending;
    }

    @computed get hasEmbeddingSupport(): boolean {
        return this.embeddingOptions.length > 0;
    }

    @computed get selectedEmbedding(): EmbeddingDataOption | null {
        const availableOption = this.embeddingOptions.find(
            option => option.value === this.selectedEmbeddingValue
        );

        if (!availableOption && this.embeddingOptions.length > 0) {
            return this.embeddingOptions[0];
        }

        return availableOption || null;
    }

    @computed get reactSelectEmbeddingOptions() {
        return this.embeddingOptions.map(option => ({
            value: option.value,
            label: option.label,
        }));
    }

    @computed get selectedReactSelectOption() {
        const selected = this.selectedEmbedding;
        return selected
            ? { value: selected.value, label: selected.label }
            : null;
    }

    readonly molecularDataForColoring = remoteData({
        await: () => {
            const toAwait: any[] = [];

            if (
                this.selectedColoringOption?.info?.entrezGeneId &&
                this.selectedColoringOption.info.entrezGeneId !== -3
            ) {
                const entrezGeneId = this.selectedColoringOption.info
                    .entrezGeneId;
                const queries = [{ entrezGeneId }];
                const driverAnnotationsReady = this.driverAnnotationsEnabled;

                // Wait for OncoKB/Hotspots first, or annotatedMutationCache uses stale driver annotations.
                if (
                    driverAnnotationsReady &&
                    this.store.driverAnnotationSettings
                ) {
                    if (this.store.driverAnnotationSettings.oncoKb) {
                        toAwait.push(
                            this.store.plotsTabStore
                                .oncoKbMutationAnnotationForOncoprint
                        );
                    }
                    if (this.store.driverAnnotationSettings.hotspots) {
                        toAwait.push(
                            this.store.plotsTabStore.isHotspotForOncoprint
                        );
                    }
                    toAwait.push(
                        this.store.plotsTabStore.getMutationPutativeDriverInfo
                    );
                }

                if (
                    this.mutationTypeEnabled &&
                    this.store.plotsTabStore.annotatedMutationCache
                ) {
                    toAwait.push(
                        ...this.store.plotsTabStore.annotatedMutationCache.getAll(
                            queries
                        )
                    );
                }
                if (
                    this.copyNumberEnabled &&
                    this.store.plotsTabStore.annotatedCnaCache
                ) {
                    toAwait.push(
                        ...this.store.plotsTabStore.annotatedCnaCache.getAll(
                            queries
                        )
                    );
                }
                if (
                    this.structuralVariantEnabled &&
                    this.store.plotsTabStore.structuralVariantCache
                ) {
                    toAwait.push(
                        ...this.store.plotsTabStore.structuralVariantCache.getAll(
                            queries
                        )
                    );
                }
            }

            return toAwait;
        },
        invoke: () => Promise.resolve(true),
    });

    @computed get rawPlotData(): EmbeddingPlotPoint[] {
        if (!this.store.samples.isComplete || !this.selectedEmbedding?.data) {
            return [];
        }

        const isColoringByGene =
            this.selectedColoringOption?.info?.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3;

        // Only depend on driverAnnotationSettings when coloring by gene, or every panel recomputes on any other panel's gene toggle.
        if (isColoringByGene) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = this.driverAnnotationsEnabled;
        }

        if (
            isColoringByGene &&
            (this.mutationTypeEnabled ||
                this.copyNumberEnabled ||
                this.structuralVariantEnabled)
        ) {
            if (!this.molecularDataForColoring.isComplete) {
                return [];
            }
        }

        // Embedding data fields don't use the clinical data cache.
        if (
            this.selectedColoringOption?.info?.clinicalAttribute &&
            !this.selectedColoringOption.info.clinicalAttribute.clinicalAttributeId.startsWith(
                EMBEDDING_DATA_PREFIX
            )
        ) {
            const clinicalDataCacheEntry = this.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );
            if (!clinicalDataCacheEntry?.isComplete) {
                return [];
            }
        }

        return makeEmbeddingScatterPlotData(
            this.selectedEmbedding.data,
            this.store,
            this.selectedColoringOption,
            this.mutationTypeEnabled,
            this.copyNumberEnabled,
            this.structuralVariantEnabled,
            this.gradientOverride
                ? this.effectiveNumericalValueToColor
                : undefined
        );
    }

    // Shared cross-panel by identity, not category name, so a differently-colored panel still filters the same samples.
    @computed get ownHiddenSampleKeys(): Set<string> {
        const hasCategoryFilter = this.localHiddenCategories.size > 0;
        const hasLassoFilter = this.lassoSelectedKeys !== null;
        if (!hasCategoryFilter && !hasLassoFilter) {
            return new Set<string>();
        }

        const rawPlotData = this.rawPlotData;
        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;
        const selectedPatientSet = new Set(selectedPatientIds);
        const lassoKeys = this.lassoSelectedKeys;

        const keys = new Set<string>();
        rawPlotData.forEach(point => {
            let label = point.displayLabel || '';
            if (hasSelection && point.isInCohort !== false) {
                const hasPatientId = Boolean(point.patientId);
                const isSelected =
                    hasPatientId && selectedPatientSet.has(point.patientId!);
                if (!isSelected) {
                    label = 'Unselected';
                }
            }
            const key = point.sampleId || point.patientId;
            if (!key) {
                return;
            }
            if (hasCategoryFilter && this.localHiddenCategories.has(label)) {
                keys.add(key);
                return;
            }
            if (hasLassoFilter && !lassoKeys!.has(key)) {
                keys.add(key);
            }
        });
        return keys;
    }

    @computed get plotData(): EmbeddingPlotPoint[] {
        const rawPlotData = this.rawPlotData;

        if (rawPlotData.length === 0) {
            return [];
        }

        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;

        if (!hasSelection) {
            return rawPlotData;
        }
        const selectedPatientSet = new Set(selectedPatientIds);

        let processedData = rawPlotData.map(point => {
            if (point.isInCohort === false) {
                return point;
            }

            const hasPatientId = Boolean(point.patientId);
            const isSelected =
                hasPatientId && selectedPatientSet.has(point.patientId!);

            if (!isSelected) {
                return {
                    ...point,
                    displayLabel: 'Unselected',
                    color: '#C8C8C8',
                    strokeColor: '#C8C8C8',
                };
            }

            return point;
        });

        // hiddenSampleKeys is the cross-panel identity filter; hiddenQcCategories is matched by name.
        const filteredData = processedData.filter(point => {
            const label = point.displayLabel || '';
            const key = point.sampleId || point.patientId || '';
            return (
                !this.hiddenSampleKeysMirror.has(key) &&
                !this.hiddenQcCategoriesMirror.has(label)
            );
        });

        return filteredData;
    }

    // Per-category counts after every active filter - shown alongside
    // categoryCounts' raw totals as "visible / total" in the legend.
    @computed get visibleCategoryCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        this.plotData.forEach(point => {
            const label = point.displayLabel || '';
            counts.set(label, (counts.get(label) || 0) + 1);
        });
        return counts;
    }

    // Same transform as plotData, but unfiltered - used for the legend's
    // raw/unfiltered totals.
    @computed get categoryCounts(): Map<string, number> {
        const rawPlotData = this.rawPlotData;

        if (rawPlotData.length === 0) {
            return new Map();
        }

        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;

        let processedData;
        if (!hasSelection) {
            processedData = rawPlotData;
        } else {
            const selectedPatientSet = new Set(selectedPatientIds);
            processedData = rawPlotData.map(point => {
                if (point.isInCohort === false) {
                    return point;
                }
                const hasPatientId = Boolean(point.patientId);
                const isSelected =
                    hasPatientId && selectedPatientSet.has(point.patientId!);

                if (!isSelected) {
                    return {
                        ...point,
                        displayLabel: 'Unselected',
                        color: '#C8C8C8',
                        strokeColor: '#C8C8C8',
                    };
                }
                return point;
            });
        }

        const counts = new Map<string, number>();
        processedData.forEach(point => {
            const category = point.displayLabel || '';
            counts.set(category, (counts.get(category) || 0) + 1);
        });

        return counts;
    }

    @computed get categoryColors(): Map<
        string,
        { fillColor: string; strokeColor: string; hasStroke: boolean }
    > {
        const rawPlotData = this.rawPlotData;

        if (rawPlotData.length === 0) {
            return new Map();
        }

        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;

        let processedData;
        if (!hasSelection) {
            processedData = rawPlotData;
        } else {
            const selectedPatientSet = new Set(selectedPatientIds);
            processedData = rawPlotData.map(point => {
                if (point.isInCohort === false) {
                    return point;
                }
                const hasPatientId = Boolean(point.patientId);
                const isSelected =
                    hasPatientId && selectedPatientSet.has(point.patientId!);

                if (!isSelected) {
                    return {
                        ...point,
                        displayLabel: 'Unselected',
                        color: '#C8C8C8',
                        strokeColor: '#C8C8C8',
                    };
                }
                return point;
            });
        }

        const colors = new Map<
            string,
            { fillColor: string; strokeColor: string; hasStroke: boolean }
        >();
        processedData.forEach(point => {
            if (
                point.displayLabel &&
                point.color &&
                !colors.has(point.displayLabel)
            ) {
                const isSpecialCategory =
                    point.displayLabel === 'Amplification' ||
                    point.displayLabel === 'Deep Deletion' ||
                    point.displayLabel === 'Structural Variant';

                colors.set(point.displayLabel, {
                    fillColor: point.color,
                    strokeColor: point.strokeColor || point.color,
                    hasStroke:
                        isSpecialCategory ||
                        !!(
                            point.strokeColor &&
                            point.strokeColor !== point.color
                        ),
                });
            }
        });

        return colors;
    }

    @computed get isNumericClinicalAttribute(): boolean {
        if (this.selectedColoringOption?.info?.clinicalAttribute) {
            return (
                this.selectedColoringOption.info.clinicalAttribute.datatype ===
                'NUMBER'
            );
        }
        return false;
    }

    @computed get numericalValueRange(): [number, number] | undefined {
        if (
            this.selectedColoringOption?.info?.clinicalAttribute &&
            this.isNumericClinicalAttribute
        ) {
            const attrId = this.selectedColoringOption.info.clinicalAttribute
                .clinicalAttributeId;
            if (
                attrId.startsWith(EMBEDDING_DATA_PREFIX) &&
                this.selectedEmbedding?.data
            ) {
                const fieldName = attrId.substring(
                    EMBEDDING_DATA_PREFIX.length
                );
                const result = preComputeEmbeddingDataColors(
                    this.selectedEmbedding.data,
                    fieldName,
                    true
                );
                return result.numericalRange;
            }

            const clinicalDataCacheEntry = this.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );

            if (
                clinicalDataCacheEntry.isComplete &&
                clinicalDataCacheEntry.result
            ) {
                return clinicalDataCacheEntry.result.numericalValueRange;
            }
        }
        return undefined;
    }

    @computed get numericalValueToColor(): ((x: number) => string) | undefined {
        if (
            this.selectedColoringOption?.info?.clinicalAttribute &&
            this.isNumericClinicalAttribute
        ) {
            const attrId = this.selectedColoringOption.info.clinicalAttribute
                .clinicalAttributeId;
            if (
                attrId.startsWith(EMBEDDING_DATA_PREFIX) &&
                this.selectedEmbedding?.data
            ) {
                const fieldName = attrId.substring(
                    EMBEDDING_DATA_PREFIX.length
                );
                const result = preComputeEmbeddingDataColors(
                    this.selectedEmbedding.data,
                    fieldName,
                    true
                );
                return result.numericalColorFn;
            }

            const clinicalDataCacheEntry = this.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );

            if (
                clinicalDataCacheEntry.isComplete &&
                clinicalDataCacheEntry.result
            ) {
                return clinicalDataCacheEntry.result.numericalValueToColor;
            }
        }
        return undefined;
    }

    private static readonly HISTOGRAM_BIN_COUNT = 24;

    // Raw values for the current numeric coloring attribute - basis for the histogram and percentile clipping.
    @computed get numericalRawValues(): number[] | undefined {
        if (
            !this.selectedColoringOption?.info?.clinicalAttribute ||
            !this.isNumericClinicalAttribute
        ) {
            return undefined;
        }
        const attrId = this.selectedColoringOption.info.clinicalAttribute
            .clinicalAttributeId;
        const values: number[] = [];

        if (
            attrId.startsWith(EMBEDDING_DATA_PREFIX) &&
            this.selectedEmbedding?.data
        ) {
            const fieldName = attrId.substring(EMBEDDING_DATA_PREFIX.length);
            for (const point of this.selectedEmbedding.data.data) {
                const value = (point as any).data?.[fieldName];
                if (typeof value === 'number' && !isNaN(value)) {
                    values.push(value);
                }
            }
            return values;
        }

        const clinicalDataCacheEntry = this.store.clinicalDataCache.get(
            this.selectedColoringOption.info.clinicalAttribute
        );
        if (
            clinicalDataCacheEntry.isComplete &&
            clinicalDataCacheEntry.result
        ) {
            for (const d of clinicalDataCacheEntry.result
                .data as ClinicalData[]) {
                const value = parseFloat(d.value);
                if (!isNaN(value)) {
                    values.push(value);
                }
            }
            return values;
        }

        return undefined;
    }

    // Bins over viewRange (not the override's own min/max), so the histogram only rescales on a clip, not while dragging.
    @computed get numericalHistogramBins(): number[] | undefined {
        const values = this.numericalRawValues;
        const range = this.viewRange ?? this.numericalValueRange;
        if (!values || !range) {
            return undefined;
        }
        const [min, max] = range;
        const span = max - min || 1;
        const binCount = EmbeddingsPanel.HISTOGRAM_BIN_COUNT;
        const bins = new Array(binCount).fill(0);
        for (const value of values) {
            const idx = Math.max(
                0,
                Math.min(
                    binCount - 1,
                    Math.floor(((value - min) / span) * binCount)
                )
            );
            bins[idx]++;
        }
        return bins;
    }

    @computed get effectiveNumericalValueRange(): [number, number] | undefined {
        if (this.gradientOverride) {
            return [this.gradientOverride.min, this.gradientOverride.max];
        }
        return this.numericalValueRange;
    }

    @computed get effectiveNumericalValueToColor():
        | ((x: number) => string)
        | undefined {
        const override = this.gradientOverride;
        if (override) {
            return makeGradientColorFn(
                override.min,
                override.mid,
                override.max,
                getGradientStops(override)
            );
        }
        return this.numericalValueToColor;
    }

    @computed get visibleSampleCount(): number {
        let visibleCount = 0;
        this.plotData.forEach(point => {
            const category = point.displayLabel || '';
            if (
                category !== 'Sample not in this cohort' &&
                category !== 'Case not in this cohort'
            ) {
                visibleCount++;
            }
        });
        return visibleCount;
    }

    @computed get totalSampleCount(): number {
        if (!this.categoryCounts) return 0;
        let total = 0;
        this.categoryCounts.forEach((count, category) => {
            // Used to construct the embedding but not part of this study.
            if (
                category !== 'Sample not in this cohort' &&
                category !== 'Case not in this cohort'
            ) {
                total += count;
            }
        });
        return total;
    }

    // This panel's own legend toggle state, not the cross-panel filter.
    @computed get visibleCategoryCount(): number {
        if (!this.categoryCounts) return 0;
        let visibleCount = 0;
        this.categoryCounts.forEach((count, category) => {
            if (
                !this.localHiddenCategories.has(category) &&
                !this.hiddenQcCategoriesMirror.has(category)
            ) {
                visibleCount++;
            }
        });
        return visibleCount;
    }

    @computed get totalCategoryCount(): number {
        return this.categoryCounts?.size || 0;
    }

    @computed get shouldShowControls(): boolean {
        const hasUrlParams = (this.store as any).urlWrapper?.query?.[
            this.coloringParamName
        ]?.selectedOption;

        if (hasUrlParams && hasUrlParams.match(/^\d+_/)) {
            return this.genes.length > 0;
        }
        return true;
    }

    @computed get selectedPatientIds(): string[] {
        return this.store.selectedPatients?.map((p: any) => p.patientId) || [];
    }

    // Side effects live in the constructor's reaction, not here.
    @computed get driverAnnotationsEnabled(): boolean {
        if (this.store.driverAnnotationSettings) {
            return this.store.driverAnnotationSettings.driversAnnotated;
        }
        return false;
    }

    @action.bound
    private enableDriverAnnotations() {
        if (this.store.driverAnnotationSettings) {
            this.store.driverAnnotationSettings.oncoKb = true;
            this.store.driverAnnotationSettings.hotspots = true;
            this.store.driverAnnotationSettings.customBinary = true;
            this.store.driverAnnotationSettings.includeDriver = true;
            this.store.driverAnnotationSettings.includeVUS = true;
        }
    }

    @computed get isLoading(): boolean {
        if (boehmHeData.isPending) {
            return true;
        }

        if (
            !this.store.samples.isComplete ||
            !this.store.selectedSamples.isComplete
        ) {
            return true;
        }

        if (
            this.selectedColoringOption?.info?.clinicalAttribute &&
            !this.selectedColoringOption.info.clinicalAttribute.clinicalAttributeId.startsWith(
                EMBEDDING_DATA_PREFIX
            )
        ) {
            const cacheEntry = this.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );
            if (!cacheEntry.isComplete) {
                return true;
            }
        }

        if (
            this.selectedColoringOption?.info?.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3 &&
            (this.mutationTypeEnabled ||
                this.copyNumberEnabled ||
                this.structuralVariantEnabled) &&
            !this.molecularDataForColoring.isComplete
        ) {
            return true;
        }

        return false;
    }

    @action.bound
    private onColoringSelectionChange(option?: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;
        this.gradientOverride = undefined;
        this.viewRange = undefined;
        this.syncColoringSelectionToURL(option);
    }

    @action.bound
    private onGradientOverrideChange(override: GradientOverride) {
        this.gradientOverride = override;
    }

    @action.bound
    private onGradientOverrideReset() {
        this.gradientOverride = undefined;
        this.viewRange = undefined;
    }

    private syncColoringSelectionToURL(option?: ColoringMenuOmnibarOption) {
        const urlWrapper = (this.store as any).urlWrapper;
        if (!urlWrapper) {
            return;
        }

        try {
            if (
                option?.info?.entrezGeneId &&
                option.info.entrezGeneId !== -10000 &&
                option.info.entrezGeneId !== -3
            ) {
                const selectedOption = `${option.info.entrezGeneId}_undefined`;

                urlWrapper.updateURL({
                    [this.coloringParamName]: {
                        selectedOption: selectedOption,
                        colorByMutationType: this.mutationTypeEnabled
                            ? 'true'
                            : 'false',
                        colorByCopyNumber: this.copyNumberEnabled
                            ? 'true'
                            : 'false',
                        colorBySv: this.structuralVariantEnabled
                            ? 'true'
                            : 'false',
                    },
                });
            } else if (option?.info?.clinicalAttribute) {
                // Matches PlotsTab's encoding.
                const clinicalInfo = {
                    clinicalAttributeId:
                        option.info.clinicalAttribute.clinicalAttributeId,
                    patientAttribute:
                        option.info.clinicalAttribute.patientAttribute || false,
                    studyId: this.currentStudyIds[0] || '',
                };
                const selectedOption = `undefined_${JSON.stringify(
                    clinicalInfo
                )}`;

                urlWrapper.updateURL({
                    [this.coloringParamName]: {
                        selectedOption: selectedOption,
                        colorByMutationType: this.mutationTypeEnabled
                            ? 'true'
                            : 'false',
                        colorByCopyNumber: this.copyNumberEnabled
                            ? 'true'
                            : 'false',
                        colorBySv: this.structuralVariantEnabled
                            ? 'true'
                            : 'false',
                    },
                });
            } else {
                urlWrapper.updateURL({
                    [this.coloringParamName]: undefined,
                });
            }
        } catch (e) {
            // Ignore.
        }
    }

    @action.bound
    private onClipToPercentile(lowPercentile: number, highPercentile: number) {
        const values = this.numericalRawValues;
        const autoRange = this.numericalValueRange;
        if (!values || values.length === 0 || !autoRange) {
            return;
        }
        const range = pickPercentileRange(
            values,
            lowPercentile,
            highPercentile
        );
        if (!range) {
            return;
        }
        const [min, max] = range;
        const { lowColor, highColor } = seedLowHighColors(
            this.gradientOverride,
            this.numericalValueToColor,
            autoRange[0],
            autoRange[1]
        );
        this.gradientOverride = {
            min,
            max,
            mid: (min + max) / 2,
            lowColor,
            highColor,
            scaleName: this.gradientOverride?.scaleName,
        };
        // Rebase the ruler to the clipped window so the handles get full drag precision within it.
        this.viewRange = [min, max];
    }

    @action.bound
    private onMutationTypeToggle(enabled: boolean) {
        this.mutationTypeEnabled = enabled;
    }

    @action.bound
    private onCopyNumberToggle(enabled: boolean) {
        this.copyNumberEnabled = enabled;
    }

    @action.bound
    private onStructuralVariantToggle(enabled: boolean) {
        this.structuralVariantEnabled = enabled;
    }

    // Public - called via ref from EmbeddingsTab's status bar dropdown.
    @action.bound
    onEmbeddingChange(selectedOption: { value: string; label: string } | null) {
        if (selectedOption) {
            const embeddingOption = this.embeddingOptions.find(
                option => option.value === selectedOption.value
            );
            if (embeddingOption) {
                this.selectedEmbeddingValue = selectedOption.value;
                this.centerView();
                this.viewStateInitialized = true;

                const urlWrapper = (this.store as any).urlWrapper;
                if (urlWrapper) {
                    urlWrapper.updateURL({
                        [this.mapParamName]: selectedOption.value,
                    });
                }
                if (this.props.isMapLocked) {
                    this.props.onSharedMapChange(selectedOption.value);
                }
            }
        }
    }

    @action.bound
    private setViewState(newViewState: ViewState) {
        this.viewState = newViewState;
        // While locked, every panel both drives and follows the shared view via the holder they all poll (see startLockPolling).
        if (this.props.isLockedToPrimary) {
            this.props.onPrimaryViewStateChange(newViewState);
        }
    }

    @action.bound
    private onViewStateChange(newViewState: ViewState) {
        this.setViewState(newViewState);
    }

    @action.bound
    private centerView() {
        if (this.plotData && this.plotData.length > 0) {
            const bounds = calculateDataBounds(
                this.plotData as EmbeddingPoint[]
            );
            this.setViewState({
                target: [bounds.centerX, bounds.centerY, 0],
                zoom: bounds.zoom,
                minZoom: -5,
                maxZoom: 10,
            });
        }
    }

    @action.bound
    private pinPoint(point: EmbeddingPoint) {
        this.pinnedPoint = point;
    }

    @action.bound
    private unpinPoint() {
        this.pinnedPoint = null;
    }

    @action.bound
    private onLegendCollapsedChange(collapsed: boolean) {
        this.legendCollapsed = collapsed;

        const urlWrapper = (this.store as any).urlWrapper;
        if (urlWrapper) {
            urlWrapper.updateURL({
                [this.legendCollapsedParamName]: collapsed ? 'true' : undefined,
            });
        }
    }

    @action.bound
    private toggleCategoryVisibility(category: string) {
        const next = new Set(this.localHiddenCategories);
        if (next.has(category)) {
            next.delete(category);
        } else {
            next.add(category);
        }
        this.localHiddenCategories = next;
    }

    @action.bound
    private toggleAllCategories() {
        // QC categories are tracked separately via hiddenQcCategories -
        // keep this exclusion as a defensive safety net.
        const embeddingConfigCategories = [
            'Sample not in this cohort',
            'Case not in this cohort',
        ];

        if (this.localHiddenCategories.size === 0) {
            const toHide = new Set<string>();
            if (this.categoryCounts) {
                this.categoryCounts.forEach((count, category) => {
                    if (!embeddingConfigCategories.includes(category)) {
                        toHide.add(category);
                    }
                });
            }
            this.localHiddenCategories = toHide;
        } else {
            const keepHidden = new Set<string>();
            this.localHiddenCategories.forEach(category => {
                if (embeddingConfigCategories.includes(category)) {
                    keepHidden.add(category);
                }
            });
            this.localHiddenCategories = keepHidden;
        }
    }

    // Called via ref from "Make Global". Returns whether a selection was actually applied, so a no-op doesn't discard local filters.
    @action.bound
    applyFilterGlobally(): boolean {
        if (this.plotData.length === 0 || !this.selectedEmbedding) {
            return false;
        }

        const selectedPoints = this.plotData;
        const allSamples = this.store.samples.result || [];
        const embeddingType = this.selectedEmbedding.data.embedding_type;

        if (embeddingType === 'samples') {
            const selectedSampleIds = new Set(
                selectedPoints.map(p => p.sampleId).filter(Boolean)
            );

            const samplesForSelection = allSamples.filter(sample =>
                selectedSampleIds.has(sample.sampleId)
            );

            const customChartData = {
                origin: [this.selectedEmbedding.label],
                displayName: `${this.selectedEmbedding.label} Sample Selection`,
                description: `Samples selected from ${this.selectedEmbedding.label} embedding`,
                datatype: 'STRING',
                patientAttribute: false,
                priority: 1,
                data: samplesForSelection.map(sample => ({
                    studyId: sample.studyId,
                    patientId: sample.patientId,
                    sampleId: sample.sampleId,
                    value: 'Selected',
                })),
            };

            this.store.updateCustomSelect(customChartData);
        } else {
            const selectedPatientSet = new Set(
                selectedPoints.map(p => p.patientId).filter(Boolean)
            );

            const samplesForSelectedPatients = allSamples.filter(sample =>
                selectedPatientSet.has(sample.patientId)
            );

            const customChartData = {
                origin: [this.selectedEmbedding.label],
                displayName: `${this.selectedEmbedding.label} Patient Selection`,
                description: `Patients selected from ${this.selectedEmbedding.label} embedding`,
                datatype: 'STRING',
                patientAttribute: true,
                priority: 1,
                data: samplesForSelectedPatients.map(sample => ({
                    studyId: sample.studyId,
                    patientId: sample.patientId,
                    sampleId: sample.sampleId,
                    value: 'Selected',
                })),
            };

            this.store.updateCustomSelect(customChartData);
        }
        return true;
    }

    // A lasso selection becomes a local filter (see lassoSelectedKeys),
    // applied globally only via applyFilterGlobally ("Make Global").
    @action.bound
    private handlePointSelection(selectedPoints: any[]) {
        if (!selectedPoints || selectedPoints.length === 0) {
            return;
        }
        const keys = new Set<string>();
        selectedPoints.forEach(p => {
            const key = p.sampleId || p.patientId;
            if (key) {
                keys.add(key);
            }
        });
        this.lassoSelectedKeys = keys;
    }

    // Plain method, not @computed: renderControls' callback reads props
    // and store values a cached computed wouldn't reliably see change.
    private renderPlotComponent(): JSX.Element {
        if (this.isLoading) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: `${this.plotHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                </div>
            );
        }

        if (!this.selectedEmbedding) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: `${this.plotHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <p>No embedding selected</p>
                </div>
            );
        }

        const patientData = this.plotData;
        const visualizationProps = {
            data: patientData,
            title: `${this.selectedEmbedding.label} Embedding - ${this.selectedEmbedding.data.title}`,
            // No Y-axis label - it overlapped the panel controls.
            xAxisLabel: this.selectedEmbedding.label,
            height: this.plotHeight,
            showLegend: true,
            filename: `${this.selectedEmbedding.value}_embedding`,
            viewState: this.viewState,
            onViewStateChange: this.onViewStateChange,
            onPointSelection: this.handlePointSelection,
            selectedPatientIds: this.selectedPatientIds,
            embeddingType: this.selectedEmbedding.data.embedding_type,
            categoryCounts: this.categoryCounts,
            visibleCategoryCounts: this.visibleCategoryCounts,
            categoryColors: this.categoryColors,
            hiddenCategories: this.localHiddenCategories,
            onToggleCategoryVisibility: this.toggleCategoryVisibility,
            onToggleAllCategories: this.toggleAllCategories,
            hiddenQcCategories: this.props.hiddenQcCategories,
            onToggleQcCategoryVisibility: this.props
                .onToggleQcCategoryVisibility,
            showLegendHeaderAndConfiguration: this.props.panelIndex === 1,
            isFilterActive: this.props.hiddenSampleKeys.size > 0,
            legendCollapsed: this.legendCollapsed,
            onLegendCollapsedChange: this.onLegendCollapsedChange,
            visibleSampleCount: this.visibleSampleCount,
            totalSampleCount: this.totalSampleCount,
            visibleCategoryCount: this.visibleCategoryCount,
            totalCategoryCount: this.totalCategoryCount,
            isNumericAttribute: this.isNumericClinicalAttribute,
            numericalValueRange: this.effectiveNumericalValueRange,
            numericalValueToColor: this.effectiveNumericalValueToColor,
            autoNumericalValueRange: this.viewRange ?? this.numericalValueRange,
            numericalHistogramBins: this.numericalHistogramBins,
            gradientOverride: this.gradientOverride,
            onGradientOverrideChange: this.onGradientOverrideChange,
            onGradientOverrideReset: this.onGradientOverrideReset,
            onClipToPercentile: this.onClipToPercentile,
            pinnedPoint: this.pinnedPoint,
            onPinPoint: this.pinPoint,
            onUnpinPoint: this.unpinPoint,
            selectedTooltipFields: new Set(this.props.tooltipFields), //Clone to ensure prop identity changes and the tooltip re-renders reliably
            colorByLabel: this.effectiveColoringOption?.label,
            // Shared with every other panel, so Pan/Select applies to all.
            selectionMode: this.props.selectionMode,
            onSelectionModeChange: this.props.onSelectionModeChange,
            tooltipFieldOptions: this.tooltipFieldOptions,
            clinicalAttributeValueMaps: this.tooltipClinicalAttributeValueMaps,
            mapAttributeValueMaps: this.tooltipMapAttributeValueMaps,
            geneValueMaps: this.tooltipGeneValueMaps,
            renderControls: (childControls: {
                selectionMode: 'none' | 'lasso';
                onSelectionModeChange: (mode: 'none' | 'lasso') => void;
            }) => (
                <EmbeddingControlStack
                    mapOptions={this.reactSelectEmbeddingOptions}
                    selectedMapOption={this.selectedReactSelectOption}
                    onMapChange={this.onEmbeddingChange}
                    showMapColorTooltipControls={this.shouldShowControls}
                    showMapInControlStack={
                        this.props.panelCount > 1 && !this.props.isMapLocked
                    }
                    genes={this.genes}
                    clinicalAttributes={this.clinicalAttributes}
                    additionalGroups={this.embeddingDataGroups}
                    selectedColoringOption={this.effectiveColoringOption}
                    isLoading={this.isLoading}
                    mutationDataExists={this.mutationDataExists}
                    cnaDataExists={this.cnaDataExists}
                    svDataExists={this.svDataExists}
                    mutationTypeEnabled={this.mutationTypeEnabled}
                    copyNumberEnabled={this.copyNumberEnabled}
                    structuralVariantEnabled={this.structuralVariantEnabled}
                    onColoringSelectionChange={this.onColoringSelectionChange}
                    onMutationTypeToggle={this.onMutationTypeToggle}
                    onCopyNumberToggle={this.onCopyNumberToggle}
                    onStructuralVariantToggle={this.onStructuralVariantToggle}
                    tooltipFieldGroups={this.tooltipFieldGroups}
                    selectedTooltipFields={this.props.tooltipFields}
                    onTooltipFieldsChange={this.props.onTooltipFieldsChange}
                    onCenter={this.centerView}
                    isLockedToPrimary={this.props.isLockedToPrimary}
                    onToggleLockedToPrimary={this.props.onToggleLockedToPrimary}
                    isMapLocked={this.props.isMapLocked}
                    onToggleLockMap={this.props.onToggleLockMap}
                    panelIndex={this.props.panelIndex}
                    panelCount={this.props.panelCount}
                    onSetPanelCount={this.props.onSetPanelCount}
                />
            ),
        };

        return (
            <div style={{ width: '100%' }} data-test="embeddings-visualization">
                <EmbeddingDeckGLVisualization {...visualizationProps} />
            </div>
        );
    }

    render() {
        if (this.currentStudyIds.length === 0) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>Loading study information...</p>
                </div>
            );
        }

        if (this.isEmbeddingDataLoading) {
            return <LoadingIndicator isLoading={true} />;
        }

        if (!this.hasEmbeddingSupport) {
            const studyText =
                this.currentStudyIds.length === 1
                    ? `Current study: ${this.currentStudyIds[0]}`
                    : `Current studies: ${this.currentStudyIds.join(', ')}`;

            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>
                        Embeddings are not available for any of{' '}
                        {this.currentStudyIds.length === 1
                            ? 'this study'
                            : 'these studies'}
                        .
                    </p>
                    <p>
                        <strong>{studyText}</strong>
                    </p>
                </div>
            );
        }

        return (
            <div className="embeddings-tab">{this.renderPlotComponent()}</div>
        );
    }
}
