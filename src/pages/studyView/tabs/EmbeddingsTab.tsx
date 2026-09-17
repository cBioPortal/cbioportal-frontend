import * as React from 'react';
import Select from 'react-select';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { ViewState } from 'shared/components/embeddings/EmbeddingTypes';
import { EmbeddingsPanel } from './EmbeddingsPanel';

// Compact variant of EmbeddingControlStack's SELECT_STYLES, for the
// status bar's inline Map dropdown.
const MAP_SELECT_STYLES = {
    control: (base: any) => ({
        ...base,
        fontSize: '11px',
        minHeight: '28px',
        height: '28px',
        boxShadow: 'none',
        border: '1px solid #ccc',
    }),
    valueContainer: (base: any) => ({
        ...base,
        height: '28px',
        padding: '0 6px',
    }),
    indicatorsContainer: (base: any) => ({ ...base, height: '28px' }),
    menu: (base: any) => ({ ...base, fontSize: '11px', zIndex: 9999 }),
    container: (base: any) => ({ ...base, width: '160px' }),
};

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

type PanelIndex = 1 | 2 | 3 | 4;

const MAX_PANELS = 4;

function coloringParamName(panelIndex: number): string {
    return panelIndex === 1
        ? 'embeddings_coloring_selection'
        : `embeddings_panel${panelIndex}_coloring_selection`;
}

function mapParamName(panelIndex: number): string {
    return panelIndex === 1
        ? 'embeddings_map'
        : `embeddings_panel${panelIndex}_map`;
}

// Shared across all panels - a single URL param, not a per-panel slot.
const TOOLTIP_FIELDS_PARAM = 'embeddings_tooltip_fields';

// Splits the tab into 1-4 independent panels, each with its own map/color-by/tooltip state synced to its own URL params.
@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    @observable private panelCount: number = 1;
    @observable private sharedSelectionMode: 'none' | 'lasso' = 'none';
    @observable.ref private sharedTooltipFields = new Set<string>();
    @observable private sharedHiddenQcCategories = new Set<string>();
    // Union of every panel's own hidden keys; .shallow since a contribution can hold tens of thousands of them.
    @observable.shallow private hiddenSampleKeysByPanel = new Map<
        number,
        Set<string>
    >();

    @computed private get sharedHiddenSampleKeys(): Set<string> {
        const result = new Set<string>();
        this.hiddenSampleKeysByPanel.forEach(keys => {
            keys.forEach(key => result.add(key));
        });
        return result;
    }
    // Plain mutable holder, not observable: locked panels poll it via rAF instead of pushed updates, so panning never re-renders.
    private readonly primaryViewStateHolder: { current: ViewState | null } = {
        current: null,
    };
    @observable private sharedLockToPrimary = false;
    // When on (default), every panel shows the same map, driven from the
    // status bar's dropdown instead of each panel's own.
    @observable private sharedLockMap = true;
    @observable private sharedMapValue: string | undefined;

    // Reported by whichever panel last fired its reaction; drives the status bar and its explainer tooltip.
    @observable private reportedTotalSampleCount = 0;
    @observable private reportedVisibleSampleCount = 0;
    @observable private reportedEmbeddingSampleSize = 0;
    @observable private reportedEmbeddingDescription = '';
    @observable private reportedEmbeddingType: 'patients' | 'samples' =
        'samples';
    @observable private reportedCohortCount = 0;

    // So the status bar's "Make Global" button can call panel 1's
    // applyFilterGlobally() directly.
    private readonly panel1Ref = React.createRef<EmbeddingsPanel>();

    // Increments on "Clear" - every panel resets its own filters in
    // response (see EmbeddingsPanel.componentDidUpdate).
    @observable private sharedClearFilterRequestId = 0;

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        const urlWrapper = (this.props.store as any).urlWrapper;
        let count = 1;
        for (let i = 2; i <= MAX_PANELS; i++) {
            const hasParams =
                !!urlWrapper?.query?.[coloringParamName(i)]?.selectedOption ||
                !!urlWrapper?.query?.[mapParamName(i)];
            if (hasParams) {
                count = i;
            } else {
                break;
            }
        }
        this.panelCount = count;
        // Locking defaults to on whenever multiple panels are in play,
        // including a URL loaded directly into split view.
        this.sharedLockToPrimary = count > 1;

        const tooltipFieldsFromUrl = urlWrapper?.query?.[TOOLTIP_FIELDS_PARAM];
        if (tooltipFieldsFromUrl) {
            try {
                const parsed = JSON.parse(tooltipFieldsFromUrl);
                if (Array.isArray(parsed)) {
                    this.sharedTooltipFields = new Set(parsed);
                }
            } catch (e) {
                // Malformed URL param - ignore and keep the empty default.
            }
        }
    }

    @action.bound
    private onSharedSelectionModeChange(mode: 'none' | 'lasso') {
        this.sharedSelectionMode = mode;
    }

    @action.bound
    private onSharedTooltipFieldsChange(fields: Set<string>) {
        this.sharedTooltipFields = fields;

        const urlWrapper = (this.props.store as any).urlWrapper;
        if (urlWrapper) {
            urlWrapper.updateURL({
                [TOOLTIP_FIELDS_PARAM]: JSON.stringify(Array.from(fields)),
            });
        }
    }

    @action.bound
    private onToggleLockToPrimary() {
        this.sharedLockToPrimary = !this.sharedLockToPrimary;
    }

    @action.bound
    private onToggleLockMap() {
        this.sharedLockMap = !this.sharedLockMap;
        if (this.sharedLockMap) {
            const current = this.panel1Ref.current?.selectedReactSelectOption;
            if (current) {
                this.sharedMapValue = current.value;
            }
        }
    }

    @action.bound
    private onSharedMapChange(value: string) {
        this.sharedMapValue = value;
    }

    @action.bound
    private onToggleQcCategoryVisibility(category: string) {
        if (this.sharedHiddenQcCategories.has(category)) {
            this.sharedHiddenQcCategories.delete(category);
        } else {
            this.sharedHiddenQcCategories.add(category);
        }
    }

    @action.bound
    private onSetPanelHiddenSampleKeys(panelIndex: number, keys: Set<string>) {
        // Content-equality check: the panel's computed can rebuild an identical-but-new Set, risking a self-sustaining loop.
        const existing = this.hiddenSampleKeysByPanel.get(panelIndex);
        if (existing && existing.size === keys.size) {
            let identical = true;
            for (const key of keys) {
                if (!existing.has(key)) {
                    identical = false;
                    break;
                }
            }
            if (identical) {
                return;
            }
        }
        this.hiddenSampleKeysByPanel.set(panelIndex, keys);
    }

    @action.bound
    private onReportSampleCounts(info: {
        total: number;
        visible: number;
        embeddingSampleSize: number;
        embeddingDescription: string;
        embeddingType: 'patients' | 'samples';
        cohortCount: number;
    }) {
        this.reportedTotalSampleCount = info.total;
        this.reportedVisibleSampleCount = info.visible;
        this.reportedEmbeddingSampleSize = info.embeddingSampleSize;
        this.reportedEmbeddingDescription = info.embeddingDescription;
        this.reportedEmbeddingType = info.embeddingType;
        this.reportedCohortCount = info.cohortCount;
    }

    @computed private get unitLabel(): string {
        return this.reportedEmbeddingType;
    }

    @computed private get hasMissingCohortSamples(): boolean {
        return this.reportedCohortCount > this.reportedTotalSampleCount;
    }

    @computed private get hasExtraNonCohortSamples(): boolean {
        return this.reportedEmbeddingSampleSize > this.reportedTotalSampleCount;
    }

    @computed private get hasEmbeddingWarning(): boolean {
        return this.hasMissingCohortSamples || this.hasExtraNonCohortSamples;
    }

    @action.bound
    private onApplyGlobally() {
        // Only clear the local filter if one was actually applied - e.g.
        // Hide All leaving zero visible samples is a no-op.
        const applied = this.panel1Ref.current?.applyFilterGlobally();
        if (applied) {
            this.sharedClearFilterRequestId += 1;
        }
    }

    @action.bound
    private onClearFilter() {
        this.sharedClearFilterRequestId += 1;
    }

    // Plain field write, not a MobX @action - see primaryViewStateHolder.
    private readonly setPrimaryViewState = (viewState: ViewState) => {
        this.primaryViewStateHolder.current = viewState;
    };

    // Growing copies the calling panel's selection into every new slot;
    // shrinking trims from the top.
    @action.bound
    private onSetPanelCount(targetCount: number, callingPanelIndex: number) {
        const currentCount = this.panelCount;
        if (targetCount === currentCount) {
            return;
        }
        const urlWrapper = (this.props.store as any).urlWrapper;
        if (!urlWrapper) {
            return;
        }

        if (targetCount > currentCount) {
            const updates: { [key: string]: any } = {};
            for (let i = currentCount + 1; i <= targetCount; i++) {
                updates[coloringParamName(i)] =
                    urlWrapper.query?.[coloringParamName(callingPanelIndex)];
                updates[mapParamName(i)] =
                    urlWrapper.query?.[mapParamName(callingPanelIndex)];
            }
            urlWrapper.updateURL(updates);
            this.panelCount = targetCount;
            if (currentCount === 1) {
                this.sharedLockToPrimary = true;
            }
        } else {
            // Unmount the panels above targetCount before clearing their
            // URL params, so they can't write a stale default back.
            this.panelCount = targetCount;
            if (targetCount === 1) {
                this.sharedLockToPrimary = false;
            }
            for (let i = targetCount + 1; i <= currentCount; i++) {
                this.hiddenSampleKeysByPanel.delete(i);
            }
            setTimeout(() => {
                const updates: { [key: string]: any } = {};
                for (let i = targetCount + 1; i <= currentCount; i++) {
                    updates[coloringParamName(i)] = undefined;
                    updates[mapParamName(i)] = undefined;
                }
                urlWrapper.updateURL(updates);
            }, 0);
        }
    }

    private renderPanels() {
        const panelIndexes: PanelIndex[] = Array.from(
            { length: this.panelCount },
            (_, i) => (i + 1) as PanelIndex
        );

        // 4 panels lay out as a 2x2 square rather than one cramped row.
        const isSquareLayout = this.panelCount === 4;

        return (
            <div
                style={
                    isSquareLayout
                        ? {
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gridTemplateRows: 'repeat(2, 1fr)',
                              gap: '12px',
                              width: '100%',
                          }
                        : {
                              display: 'flex',
                              gap: '12px',
                              width: '100%',
                          }
                }
            >
                {panelIndexes.map(panelIndex => (
                    <div
                        key={panelIndex}
                        style={{
                            minWidth: 0,
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            ...(isSquareLayout ? {} : { flex: 1 }),
                        }}
                    >
                        <EmbeddingsPanel
                            store={this.props.store}
                            panelIndex={panelIndex}
                            panelCount={this.panelCount}
                            selectionMode={this.sharedSelectionMode}
                            onSelectionModeChange={
                                this.onSharedSelectionModeChange
                            }
                            tooltipFields={this.sharedTooltipFields}
                            onTooltipFieldsChange={
                                this.onSharedTooltipFieldsChange
                            }
                            hiddenQcCategories={this.sharedHiddenQcCategories}
                            onToggleQcCategoryVisibility={
                                this.onToggleQcCategoryVisibility
                            }
                            hiddenSampleKeys={this.sharedHiddenSampleKeys}
                            onSetPanelHiddenSampleKeys={keys =>
                                this.onSetPanelHiddenSampleKeys(
                                    panelIndex,
                                    keys
                                )
                            }
                            onReportSampleCounts={this.onReportSampleCounts}
                            clearFilterRequestId={
                                this.sharedClearFilterRequestId
                            }
                            primaryViewStateHolder={this.primaryViewStateHolder}
                            onPrimaryViewStateChange={this.setPrimaryViewState}
                            isLockedToPrimary={this.sharedLockToPrimary}
                            onToggleLockedToPrimary={this.onToggleLockToPrimary}
                            isMapLocked={this.sharedLockMap}
                            onToggleLockMap={this.onToggleLockMap}
                            sharedMapValue={this.sharedMapValue}
                            onSharedMapChange={this.onSharedMapChange}
                            onSetPanelCount={target =>
                                this.onSetPanelCount(target, panelIndex)
                            }
                            ref={panelIndex === 1 ? this.panel1Ref : undefined}
                        />
                    </div>
                ))}
            </div>
        );
    }

    render() {
        const isFilterActive = this.sharedHiddenSampleKeys.size > 0;
        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '10px',
                        padding: '8px 12px',
                        backgroundColor: isFilterActive ? '#fff8e1' : '#f8f9fa',
                        border: isFilterActive
                            ? '1px solid #ffe082'
                            : '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '12px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '2px',
                            flexShrink: 0,
                            height: '28px',
                            boxSizing: 'border-box',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '2px',
                        }}
                    >
                        <button
                            data-test="embeddings-pan-button"
                            onClick={() =>
                                this.onSharedSelectionModeChange('none')
                            }
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px 8px',
                                fontSize: '11px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                backgroundColor:
                                    this.sharedSelectionMode === 'none'
                                        ? '#007bff'
                                        : 'transparent',
                                color:
                                    this.sharedSelectionMode === 'none'
                                        ? 'white'
                                        : '#333',
                            }}
                            title="Pan and zoom the visualization"
                        >
                            <i
                                className="fa-regular fa-hand"
                                style={{
                                    marginRight: '4px',
                                    fontSize: '11px',
                                }}
                            ></i>
                            Pan
                        </button>
                        <button
                            data-test="embeddings-select-button"
                            onClick={() =>
                                this.onSharedSelectionModeChange('lasso')
                            }
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px 8px',
                                fontSize: '11px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                backgroundColor:
                                    this.sharedSelectionMode === 'lasso'
                                        ? '#007bff'
                                        : 'transparent',
                                color:
                                    this.sharedSelectionMode === 'lasso'
                                        ? 'white'
                                        : '#333',
                            }}
                            title="Draw a freeform lasso to select points"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="4,4"
                                style={{ marginRight: '4px' }}
                            >
                                <path d="M3 8c0-3 2-5 6-5s8 2 10 6c2 4 1 8-2 10s-7 2-10 0S1 13 3 8Z" />
                            </svg>
                            Select
                        </button>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <span
                            data-test="embeddings-status-bar"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '4px',
                            }}
                        >
                            {isFilterActive ? (
                                <>
                                    Selection active &mdash;{' '}
                                    {this.reportedVisibleSampleCount.toLocaleString()}{' '}
                                    /{' '}
                                    {this.reportedTotalSampleCount.toLocaleString()}{' '}
                                    {this.unitLabel} visible
                                </>
                            ) : (this.panelCount === 1 || this.sharedLockMap) &&
                              this.reportedTotalSampleCount > 0 ? (
                                <>
                                    {this.reportedTotalSampleCount.toLocaleString()}{' '}
                                    {this.unitLabel} embedded in{' '}
                                    {this.panel1Ref.current
                                        ?.shouldShowControls ? (
                                        <Select
                                            name="embedding-select"
                                            value={
                                                this.panel1Ref.current
                                                    .selectedReactSelectOption
                                            }
                                            onChange={(option: any) =>
                                                this.panel1Ref.current?.onEmbeddingChange(
                                                    option
                                                )
                                            }
                                            options={
                                                this.panel1Ref.current
                                                    .reactSelectEmbeddingOptions
                                            }
                                            isSearchable={false}
                                            styles={MAP_SELECT_STYLES}
                                        />
                                    ) : null}{' '}
                                    {this.reportedEmbeddingSampleSize !==
                                        this.reportedTotalSampleCount && (
                                        <>
                                            (constructed using{' '}
                                            {this.reportedEmbeddingSampleSize.toLocaleString()}{' '}
                                            {this.unitLabel})
                                        </>
                                    )}
                                </>
                            ) : null}
                        </span>
                        {!isFilterActive &&
                            (this.panelCount === 1 || this.sharedLockMap) &&
                            this.reportedTotalSampleCount > 0 && (
                                <DefaultTooltip
                                    placement="bottom"
                                    overlay={
                                        <div
                                            style={{
                                                minWidth: '220px',
                                                maxWidth: '300px',
                                                fontSize: '12px',
                                            }}
                                        >
                                            {this
                                                .reportedEmbeddingDescription && (
                                                <div
                                                    style={{
                                                        marginBottom: '6px',
                                                    }}
                                                >
                                                    {
                                                        this
                                                            .reportedEmbeddingDescription
                                                    }
                                                </div>
                                            )}
                                            <div>
                                                This shows a 2D projection of an{' '}
                                                <strong>embedding</strong> - a
                                                representation that places{' '}
                                                {this.unitLabel} with similar
                                                patterns close together.
                                                {this
                                                    .hasMissingCohortSamples && (
                                                    <>
                                                        {' '}
                                                        It&apos;s precomputed,
                                                        so only the{' '}
                                                        {this.unitLabel} that
                                                        were part of building it
                                                        show up here (in this
                                                        case,{' '}
                                                        <strong>
                                                            {this.reportedTotalSampleCount.toLocaleString()}
                                                        </strong>{' '}
                                                        of this cohort&apos;s{' '}
                                                        <strong>
                                                            {this.reportedCohortCount.toLocaleString()}
                                                        </strong>{' '}
                                                        {this.unitLabel}).
                                                    </>
                                                )}
                                            </div>
                                            {this.hasExtraNonCohortSamples && (
                                                <div
                                                    style={{ marginTop: '6px' }}
                                                >
                                                    The map was built using an
                                                    additional{' '}
                                                    <strong>
                                                        {(
                                                            this
                                                                .reportedEmbeddingSampleSize -
                                                            this
                                                                .reportedTotalSampleCount
                                                        ).toLocaleString()}
                                                    </strong>{' '}
                                                    {this.unitLabel} from
                                                    outside this cohort - shown
                                                    here too, but can be hidden
                                                    via the legend&apos;s
                                                    Configuration section.
                                                </div>
                                            )}
                                        </div>
                                    }
                                >
                                    <i
                                        className={
                                            this.hasEmbeddingWarning
                                                ? 'fa fa-exclamation-triangle'
                                                : 'fa fa-info-circle'
                                        }
                                        style={{
                                            color: this.hasEmbeddingWarning
                                                ? '#e0a800'
                                                : '#888',
                                            cursor: 'help',
                                        }}
                                    />
                                </DefaultTooltip>
                            )}
                        {isFilterActive && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    data-test="embeddings-clear-button"
                                    onClick={this.onClearFilter}
                                    title="Clear this selection on every panel"
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '11px',
                                        border: '1px solid #ccc',
                                        borderRadius: '3px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Clear
                                </button>
                                <button
                                    data-test="embeddings-make-global-button"
                                    onClick={this.onApplyGlobally}
                                    title="Apply this selection as a Study View selection, affecting every tab on the page"
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '11px',
                                        border: '1px solid #ccc',
                                        borderRadius: '3px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Make Global
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {this.renderPanels()}
            </div>
        );
    }
}
