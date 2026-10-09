import { pluralize } from 'cbioportal-frontend-commons';
import * as React from 'react';
import {
    PatientHierarchy,
    PathologySlideMatchFilter,
    Sample,
    Slide,
    SlideAssociation,
    WsiStainFilter,
} from './wsiViewerTypes';
import {
    countServableSlidesForSample,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideAssociationsBySlideKeyReadOnly,
    matchesMatchFilter,
    matchesWsiStainFilter,
    sampleHasMultiplePartDescriptions,
    wsiStainKind,
} from './wsiSlideUtils';
import {
    abbreviatePartDesc,
    cleanStain,
    compareSamplesForNavigation,
    decodeBlockCode,
    fmtMB,
    stainQualifier,
} from './wsiNavUtils';
import { getStainDotColor } from './wsiMetaUtils';
import { scheduleThumbnailRequest } from './thumbnailRequestLimiter';
import { getWsiSlideAccess } from './wsiAuth';
import {
    fetchWsiThumbnailBlob,
    parseMaxAgeMs,
    WsiThumbnailFetchError,
} from './wsiThumbnailFetchCache';

import {
    WSI_NAV_WIDTH,
    WSI_SECTION_TITLE_STYLE,
    WSI_THEME as theme,
} from './wsiTheme';
import { WsiPanelHideButton } from './wsiPanelChrome';

export interface WsiNavPanelProps {
    hierarchy: PatientHierarchy;
    selectedSlide: Slide | null;
    stainFilter: WsiStainFilter;
    sampleIdFilter?: string;
    slideIdFilter?: Set<string>;
    linkoutScopeActive?: boolean;
    matchFilter?: PathologySlideMatchFilter;
    showClearFilters?: boolean;
    deferOffscreenSamples?: boolean;
    onFilterChange: (f: WsiStainFilter) => void;
    onMatchFilterChange?: (f: PathologySlideMatchFilter) => void;
    onClearFilters?: () => void;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    tileServerBase: string;
    studyId: string;
    authScope: string;
    /** Shows a header button that hides the panel. */
    onHide?: () => void;
}

const INITIAL_VISIBLE_SAMPLE_LIMIT = 6;
const THUMBNAIL_WIDTH = 64;
const THUMBNAIL_HEIGHT = 48;
const MAX_THUMBNAIL_ATTEMPTS = 3;
const DEFAULT_THUMBNAIL_RETRY_DELAY_MS = 60_000;
const NETWORK_THUMBNAIL_RETRY_DELAYS_MS = [5_000, 15_000];

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

function parseRetryAfterMs(retryAfter: string | null): number | undefined {
    if (!retryAfter) {
        return undefined;
    }
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return seconds * 1000;
    }
    const retryAt = Date.parse(retryAfter);
    return Number.isFinite(retryAt)
        ? Math.max(0, retryAt - Date.now())
        : undefined;
}

function thumbnailRetryDelayMs(
    response: Response | undefined,
    reason: string | undefined,
    attempt: number
): number | null {
    if (attempt >= MAX_THUMBNAIL_ATTEMPTS) {
        return null;
    }

    if (response?.status === 429) {
        return (
            parseRetryAfterMs(response.headers.get('Retry-After')) ??
            DEFAULT_THUMBNAIL_RETRY_DELAY_MS
        );
    }

    if (!response || response.status === 408 || response.status >= 500) {
        return NETWORK_THUMBNAIL_RETRY_DELAYS_MS[
            Math.min(attempt - 1, NETWORK_THUMBNAIL_RETRY_DELAYS_MS.length - 1)
        ];
    }

    if (response.status !== 200) {
        return null;
    }

    if (reason === 'missing') {
        return null;
    }

    const maxAgeMs =
        parseMaxAgeMs(response.headers.get('Cache-Control')) ??
        DEFAULT_THUMBNAIL_RETRY_DELAY_MS;
    return maxAgeMs + Math.round(maxAgeMs * 0.1 * Math.random());
}

function shouldShowSampleInNavigation(sample: Sample): boolean {
    return (
        sample.sample_id !== 'UNMATCHED' ||
        countServableSlidesForSample(sample) > 0
    );
}

function matchesSlideFilters(
    slide: Slide,
    association: SlideAssociation | undefined,
    stainFilter: WsiStainFilter,
    matchFilter: PathologySlideMatchFilter
): boolean {
    return (
        matchesWsiStainFilter(slide, stainFilter) &&
        matchesMatchFilter(association, matchFilter)
    );
}

type FilteredSampleEntry = {
    sample: Sample;
    filteredSlides: Array<{ slide: Slide; blockLabel: string | null }>;
    filteredSlideIds: Set<string>;
};

function buildSampleEntry(sample: Sample): FilteredSampleEntry | null {
    const filteredSlides = getOrderedServableSlidesForSampleReadOnly(sample);
    if (!filteredSlides.length) {
        return null;
    }
    return {
        sample,
        filteredSlides,
        filteredSlideIds: new Set(
            filteredSlides.map(({ slide }) => slide.slide_key)
        ),
    };
}

function WsiNavPanelComponent({
    hierarchy,
    selectedSlide,
    stainFilter,
    sampleIdFilter,
    slideIdFilter,
    linkoutScopeActive = false,
    matchFilter = 'all',
    showClearFilters = false,
    deferOffscreenSamples = false,
    onFilterChange,
    onMatchFilterChange,
    onClearFilters,
    onSelectSlide,
    tileServerBase,
    studyId,
    authScope,
    onHide,
}: WsiNavPanelProps) {
    const associationsBySlideKey = React.useMemo(
        () =>
            getServableSlideAssociationsBySlideKeyReadOnly(
                hierarchy.slide_associations
            ),
        [hierarchy.slide_associations]
    );
    const selectedSlideId = selectedSlide?.slide_key;
    const unscopedSampleEntries = React.useMemo(
        () =>
            hierarchy.samples.reduce<FilteredSampleEntry[]>(
                (entries, sample) => {
                    if (!shouldShowSampleInNavigation(sample)) {
                        return entries;
                    }

                    const entry = buildSampleEntry(sample);

                    if (entry) {
                        entries.push(entry);
                    }

                    return entries;
                },
                []
            ),
        [hierarchy.samples]
    );
    const allSampleEntries = React.useMemo(() => {
        if (!sampleIdFilter && !slideIdFilter) {
            return unscopedSampleEntries;
        }

        return unscopedSampleEntries.reduce<FilteredSampleEntry[]>(
            (entries, entry) => {
                if (
                    sampleIdFilter &&
                    entry.sample.sample_id !== sampleIdFilter
                ) {
                    return entries;
                }

                const filteredSlides = slideIdFilter
                    ? entry.filteredSlides.filter(({ slide }) =>
                          slideIdFilter.has(slide.slide_key)
                      )
                    : entry.filteredSlides;
                if (!filteredSlides.length) {
                    return entries;
                }

                entries.push({
                    sample: entry.sample,
                    filteredSlides,
                    filteredSlideIds: new Set(
                        filteredSlides.map(({ slide }) => slide.slide_key)
                    ),
                });
                return entries;
            },
            []
        );
    }, [sampleIdFilter, slideIdFilter, unscopedSampleEntries]);
    const filteredSampleEntries = React.useMemo(
        () =>
            allSampleEntries.reduce<FilteredSampleEntry[]>((entries, entry) => {
                const filteredSlides = entry.filteredSlides.filter(
                    ({ slide }) =>
                        matchesSlideFilters(
                            slide,
                            associationsBySlideKey.get(slide.slide_key),
                            stainFilter,
                            matchFilter
                        )
                );
                if (filteredSlides.length) {
                    entries.push({
                        sample: entry.sample,
                        filteredSlides,
                        filteredSlideIds: new Set(
                            filteredSlides.map(({ slide }) => slide.slide_key)
                        ),
                    });
                }
                return entries;
            }, []),
        [allSampleEntries, associationsBySlideKey, matchFilter, stainFilter]
    );
    const sampleEntries = React.useMemo(() => {
        const sorted = [...filteredSampleEntries].sort((left, right) =>
            compareSamplesForNavigation(left.sample, right.sample)
        );
        if (
            !deferOffscreenSamples ||
            sorted.length <= INITIAL_VISIBLE_SAMPLE_LIMIT
        ) {
            return sorted;
        }

        const visible = sorted.slice(0, INITIAL_VISIBLE_SAMPLE_LIMIT);
        if (!selectedSlideId) {
            return visible;
        }

        const selectedEntry = sorted.find(entry =>
            entry.filteredSlideIds.has(selectedSlideId)
        );
        if (
            selectedEntry &&
            !visible.some(
                entry =>
                    entry.sample.sample_id === selectedEntry.sample.sample_id
            )
        ) {
            return visible.concat(selectedEntry);
        }

        return visible;
    }, [deferOffscreenSamples, filteredSampleEntries, selectedSlideId]);
    /** Why no slide is listed when the patient has none to show at all. */
    const emptyPatientMessage = React.useMemo(() => {
        let slides = 0;
        let viewable = 0;
        hierarchy.samples.forEach(sample =>
            sample.parts.forEach(part =>
                part.blocks.forEach(block =>
                    block.slides.forEach(slide => {
                        slides += 1;
                        if (slide.can_serve_tiles) viewable += 1;
                    })
                )
            )
        );
        if (slides === 0) return 'No pathology slides for this patient';
        if (viewable === 0)
            return 'No viewable pathology slides for this patient';
        return undefined;
    }, [hierarchy]);
    const filteredSlideCount = React.useMemo(
        () =>
            filteredSampleEntries.reduce(
                (count, entry) => count + entry.filteredSlides.length,
                0
            ),
        [filteredSampleEntries]
    );
    const hiddenSampleCount =
        filteredSampleEntries.length - sampleEntries.length;
    const facetSlideEntries = React.useMemo(
        () =>
            unscopedSampleEntries.flatMap(entry =>
                entry.filteredSlides.map(({ slide }) => ({
                    slide,
                    association: associationsBySlideKey.get(slide.slide_key),
                }))
            ),
        [associationsBySlideKey, unscopedSampleEntries]
    );
    const chips: Array<{
        key: WsiStainFilter;
        label: string;
        color?: string;
    }> = [
        { key: 'all', label: 'All' },
        { key: 'hne', label: 'H&E', color: theme.blue },
        { key: 'ihc', label: 'IHC', color: theme.orange },
        { key: 'other', label: 'Other (known)', color: theme.muted },
        { key: 'unknown', label: 'Unknown', color: theme.muted },
    ];
    const matchChips: Array<{
        key: PathologySlideMatchFilter;
        label: string;
    }> = [
        { key: 'all', label: 'All' },
        { key: 'part', label: 'Part' },
        { key: 'block', label: 'Block' },
        { key: 'unmatched', label: 'Unmatched' },
    ];
    const stainCounts = React.useMemo(() => {
        const filteredCounts: Record<WsiStainFilter, number> = {
            all: 0,
            hne: 0,
            ihc: 0,
            other: 0,
            unknown: 0,
        };
        facetSlideEntries.forEach(({ slide, association }) => {
            if (!matchesMatchFilter(association, matchFilter)) {
                return;
            }
            filteredCounts.all += 1;
            const stainType = wsiStainKind(slide);
            if (stainType === 'hne') {
                filteredCounts.hne += 1;
            }
            if (stainType === 'ihc') {
                filteredCounts.ihc += 1;
            }
            if (stainType === 'other') filteredCounts.other += 1;
            if (stainType === 'unknown') filteredCounts.unknown += 1;
        });

        return filteredCounts;
    }, [facetSlideEntries, matchFilter]);
    const matchCounts = React.useMemo(() => {
        const filteredCounts = { part: 0, block: 0, unmatched: 0 };
        facetSlideEntries.forEach(({ slide, association }) => {
            const matchesStain = matchesWsiStainFilter(slide, stainFilter);
            if (!matchesStain || !association) {
                return;
            }
            if (association.match_level === 'PART') filteredCounts.part += 1;
            if (association.match_level === 'BLOCK') filteredCounts.block += 1;
            if (association.match_level === 'UNMATCHED') {
                filteredCounts.unmatched += 1;
            }
        });
        return filteredCounts;
    }, [facetSlideEntries, stainFilter]);

    return (
        <div
            style={{
                width: WSI_NAV_WIDTH,
                minWidth: WSI_NAV_WIDTH,
                display: 'flex',
                flexDirection: 'column',
                background: theme.navBg,
                borderRight: `1px solid ${theme.border}`,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '9px 12px 7px',
                    borderBottom: `1px solid ${theme.border}`,
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={WSI_SECTION_TITLE_STYLE}>Slides</div>
                    {onHide && (
                        <WsiPanelHideButton
                            side="left"
                            label="Hide slide list"
                            onClick={onHide}
                            testId="wsi-nav-hide"
                        />
                    )}
                </div>
                <div
                    data-testid="wsi-stain-filter-row"
                    className="btn-group btn-group-xs"
                    style={{ marginTop: 7 }}
                >
                    {chips.map(chip => {
                        const count = stainCounts[chip.key];
                        const disabled = chip.key !== 'all' && count === 0;
                        const active = stainFilter === chip.key;
                        return (
                            <button
                                key={chip.key}
                                data-testid={`wsi-stain-filter-${chip.key}`}
                                className={`btn btn-xs ${
                                    active ? 'btn-primary' : 'btn-default'
                                }`}
                                disabled={disabled}
                                onClick={() => {
                                    if (
                                        disabled ||
                                        (active &&
                                            !(
                                                chip.key === 'all' &&
                                                linkoutScopeActive
                                            ))
                                    ) {
                                        return;
                                    }
                                    onFilterChange(chip.key);
                                }}
                            >
                                {chip.key !== 'all' && (
                                    <i
                                        className="fa fa-circle"
                                        style={{
                                            fontSize: 8,
                                            marginRight: 3,
                                            color: active
                                                ? undefined
                                                : chip.color,
                                            verticalAlign: 'middle',
                                        }}
                                    />
                                )}
                                {chip.label}
                                {chip.key !== 'all' && (
                                    <span
                                        style={{ marginLeft: 4, opacity: 0.8 }}
                                    >
                                        ({count})
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div
                    data-testid="wsi-match-filter-row"
                    className="btn-group btn-group-xs"
                    style={{ marginTop: 6 }}
                    aria-label="Filter slides by match level"
                >
                    {matchChips
                        .filter(
                            chip =>
                                chip.key === 'all' || matchCounts[chip.key] > 0
                        )
                        .map(chip => {
                            const count =
                                chip.key === 'all'
                                    ? undefined
                                    : matchCounts[chip.key];
                            const active = matchFilter === chip.key;
                            return (
                                <button
                                    key={chip.key}
                                    data-testid={`wsi-match-filter-${chip.key}`}
                                    className={`btn btn-xs ${
                                        active ? 'btn-primary' : 'btn-default'
                                    }`}
                                    disabled={count === 0}
                                    onClick={() => {
                                        if (
                                            count === 0 ||
                                            (active &&
                                                !(
                                                    chip.key === 'all' &&
                                                    linkoutScopeActive
                                                ))
                                        ) {
                                            return;
                                        }
                                        onMatchFilterChange?.(chip.key);
                                    }}
                                >
                                    {chip.label}
                                    {count !== undefined && (
                                        <span
                                            style={{
                                                marginLeft: 4,
                                                opacity: 0.8,
                                            }}
                                        >
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                </div>
                {sampleIdFilter && linkoutScopeActive && (
                    <div
                        data-testid="wsi-sample-scope"
                        style={{
                            marginTop: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: theme.blueLight,
                            color: theme.text,
                            fontSize: 11,
                        }}
                    >
                        <span>Sample {sampleIdFilter}</span>
                        <button
                            type="button"
                            className="btn btn-link btn-xs"
                            data-testid="wsi-sample-scope-clear"
                            aria-label={`Show all slides, not only sample ${sampleIdFilter}`}
                            title="Show all slides"
                            style={{ padding: 0, color: theme.muted }}
                            onClick={onClearFilters}
                        >
                            <i className="fa fa-times" />
                        </button>
                    </div>
                )}
                {showClearFilters && (
                    <button
                        type="button"
                        className="btn btn-link btn-xs"
                        data-testid="wsi-clear-filters"
                        style={{
                            padding: '2px 0',
                            marginTop: 6,
                            color: theme.blue,
                        }}
                        onClick={onClearFilters}
                    >
                        Show all slides
                    </button>
                )}
                <div
                    style={{
                        marginTop: 6,
                        color: theme.muted,
                        fontSize: 10,
                    }}
                    data-testid="wsi-filtered-slide-count"
                >
                    {filteredSlideCount === 0
                        ? emptyPatientMessage || 'No slides match these filters'
                        : `Showing ${filteredSlideCount} ${pluralize(
                              'slide',
                              filteredSlideCount
                          )}`}
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {sampleEntries.map(
                    ({ sample, filteredSlides, filteredSlideIds }, index) => (
                        <MemoSampleNode
                            key={sample.sample_id}
                            sample={sample}
                            containsSelectedSlide={
                                !!selectedSlideId &&
                                filteredSlideIds.has(selectedSlideId)
                            }
                            filteredSlides={filteredSlides}
                            sampleIndex={index}
                            selectedSlide={selectedSlide}
                            associationsBySlideKey={associationsBySlideKey}
                            onSelectSlide={onSelectSlide}
                            tileServerBase={tileServerBase}
                            studyId={studyId}
                            authScope={authScope}
                        />
                    )
                )}
                {hiddenSampleCount > 0 && (
                    <div
                        style={{
                            padding: '8px 12px 12px',
                            fontSize: 10,
                            color: theme.muted,
                        }}
                    >
                        Loading {hiddenSampleCount} more{' '}
                        {pluralize('sample', hiddenSampleCount)}...
                    </div>
                )}
            </div>
        </div>
    );
}

export const WsiNavPanel = React.memo(WsiNavPanelComponent);

function SampleNode({
    sample,
    containsSelectedSlide,
    sampleIndex,
    selectedSlide,
    filteredSlides,
    associationsBySlideKey,
    onSelectSlide,
    tileServerBase,
    studyId,
    authScope,
}: {
    sample: Sample;
    containsSelectedSlide: boolean;
    filteredSlides: Array<{ slide: Slide; blockLabel: string | null }>;
    sampleIndex: number;
    selectedSlide: Slide | null;
    associationsBySlideKey: Map<string, SlideAssociation>;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    tileServerBase: string;
    studyId: string;
    authScope: string;
}) {
    const [open, setOpen] = React.useState(
        containsSelectedSlide || sampleIndex === 0
    );
    const servableSlides = open || containsSelectedSlide ? filteredSlides : [];
    const visibleSlideCount = filteredSlides.length;

    React.useEffect(() => {
        if (containsSelectedSlide && !open) {
            setOpen(true);
        }
    }, [containsSelectedSlide, open]);

    const stLower = (sample.sample_type || '').toLowerCase();
    const stClass =
        stLower === 'primary'
            ? theme.blue
            : stLower.includes('metastas') || stLower === 'local recurrence'
            ? '#c05000'
            : theme.muted;
    const stBg =
        stLower === 'primary'
            ? theme.blueLight
            : stLower.includes('metastas') || stLower === 'local recurrence'
            ? '#fef0e8'
            : '#f0f0f0';

    const multiPart = React.useMemo(
        () =>
            open || containsSelectedSlide
                ? sampleHasMultiplePartDescriptions(sample)
                : false,
        [containsSelectedSlide, open, sample]
    );

    return (
        <div
            style={{ borderBottom: `1px solid ${theme.border}` }}
            data-testid={`wsi-sample-node-${sample.sample_id}`}
        >
            <div
                onClick={() => setOpen(o => !o)}
                onKeyDown={event => {
                    if (
                        event.target === event.currentTarget &&
                        (event.key === 'Enter' || event.key === ' ')
                    ) {
                        event.preventDefault();
                        setOpen(o => !o);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-label={`${sample.sample_id || 'Sample'} slides`}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '8px 12px 7px',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        color: theme.muted,
                        marginTop: 2,
                        flexShrink: 0,
                        width: 10,
                    }}
                >
                    {open ? '▾' : '▸'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: theme.blue,
                            ...ellipsisStyle,
                        }}
                    >
                        {sample.sample_id || '—'}
                    </div>
                    <div
                        style={{
                            fontSize: 10,
                            color: theme.muted,
                            marginTop: 1,
                        }}
                    >
                        {sample.sample_type && (
                            <span
                                style={{
                                    display: 'inline-block',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '.4px',
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    background: stBg,
                                    color: stClass,
                                    marginRight: 4,
                                }}
                            >
                                {sample.sample_type}
                            </span>
                        )}
                        {sample.oncotree_code && (
                            <a
                                href="https://oncotree.mskcc.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${sample.oncotree_code}${
                                    sample.cancer_type_detailed
                                        ? ` — ${sample.cancer_type_detailed}`
                                        : ''
                                }\nView OncoTree`}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    display: 'inline-block',
                                    background: '#f0f0f0',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 3,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: '0 4px',
                                    color: theme.text,
                                    marginRight: 4,
                                    textDecoration: 'none',
                                }}
                            >
                                {sample.oncotree_code}
                            </a>
                        )}
                        {sample.cancer_type_detailed ||
                            sample.cancer_type ||
                            ''}
                    </div>
                    {sample.primary_site && (
                        <div style={{ fontSize: 10, color: '#aaa' }}>
                            {sample.primary_site}
                        </div>
                    )}
                </div>
                <div
                    title="Viewable slides shown in this sample"
                    style={{
                        fontSize: 9,
                        color: '#bbb',
                        flexShrink: 0,
                        textAlign: 'right',
                        lineHeight: 1.4,
                        cursor: 'help',
                    }}
                >
                    <span style={{ color: theme.blue, fontWeight: 600 }}>
                        {visibleSlideCount}
                    </span>
                </div>
            </div>
            {open && (
                <div style={{ paddingBottom: 4 }}>
                    {servableSlides.map(({ slide, blockLabel }) => (
                        <SlideItem
                            key={slide.slide_key}
                            slide={slide}
                            sample={sample}
                            blockLabel={blockLabel}
                            association={associationsBySlideKey.get(
                                slide.slide_key
                            )}
                            multiPart={multiPart}
                            selected={
                                selectedSlide?.slide_key === slide.slide_key
                            }
                            onSelectSlide={onSelectSlide}
                            tileServerBase={tileServerBase}
                            studyId={studyId}
                            authScope={authScope}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const MemoSampleNode = React.memo(SampleNode, (prev, next) => {
    if (
        prev.sample !== next.sample ||
        prev.containsSelectedSlide !== next.containsSelectedSlide ||
        prev.sampleIndex !== next.sampleIndex ||
        prev.filteredSlides !== next.filteredSlides ||
        prev.associationsBySlideKey !== next.associationsBySlideKey ||
        prev.onSelectSlide !== next.onSelectSlide ||
        prev.tileServerBase !== next.tileServerBase ||
        prev.studyId !== next.studyId ||
        prev.authScope !== next.authScope
    ) {
        return false;
    }

    if (
        next.containsSelectedSlide &&
        prev.selectedSlide?.slide_key !== next.selectedSlide?.slide_key
    ) {
        return false;
    }

    return true;
});

function SlideItem({
    slide,
    sample,
    blockLabel,
    association,
    multiPart,
    selected,
    onSelectSlide,
    tileServerBase,
    studyId,
    authScope,
}: {
    slide: Slide;
    sample: Sample;
    blockLabel: string | null;
    association: SlideAssociation | undefined;
    multiPart: boolean;
    selected: boolean;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    tileServerBase: string;
    studyId: string;
    authScope: string;
}) {
    const [hovered, setHovered] = React.useState(false);
    const isHE = wsiStainKind(slide) === 'hne';
    const dotColor = getStainDotColor(slide, theme);
    const mag = slide.magnification || '';
    const sz = fmtMB(slide.file_size_bytes);
    const partDesc = multiPart
        ? abbreviatePartDesc(slide.part_description)
        : null;
    const blockMeaning = !partDesc ? decodeBlockCode(blockLabel) : null;
    const primaryLabel = isHE
        ? blockLabel || cleanStain(slide.stain_name)
        : cleanStain(slide.stain_name);
    const subTokens: string[] = [];
    if (!isHE && blockLabel) subTokens.push(blockLabel);
    const rawGroup = (slide.stain_group || '').toLowerCase();
    const rhsStain =
        isHE && (rawGroup === '' || rawGroup.startsWith('h&e'))
            ? stainQualifier(slide.stain_group)
            : null;
    const matchBadge =
        association?.match_level === 'BLOCK'
            ? { label: 'Block', color: '#2f7d32' }
            : association?.match_level === 'PART'
            ? { label: 'Part', color: '#476f9e' }
            : undefined;

    const tooltipLines: string[] = [];
    if (slide.stain_name) tooltipLines.push(`Stain: ${slide.stain_name}`);
    if (blockLabel) tooltipLines.push(`Block: ${blockLabel}`);
    if (slide.part_description) {
        tooltipLines.push(`Part: ${slide.part_description}`);
    }
    if (mag) tooltipLines.push(`Magnification: ${mag}`);
    if (sz !== '—') tooltipLines.push(`Size: ${sz}`);

    const bg = selected
        ? theme.blueLight
        : hovered
        ? theme.blueLight
        : 'transparent';
    const borderLeft = selected
        ? `2px solid ${theme.blue}`
        : '2px solid transparent';

    return (
        <div
            data-testid={`wsi-slide-item-${slide.slide_key}`}
            onClick={() => {
                if (!selected) onSelectSlide(slide, sample);
            }}
            onKeyDown={event => {
                if ((event.key === 'Enter' || event.key === ' ') && !selected) {
                    event.preventDefault();
                    onSelectSlide(slide, sample);
                }
            }}
            role="button"
            tabIndex={0}
            aria-current={selected ? 'true' : undefined}
            aria-label={
                tooltipLines.length > 0
                    ? tooltipLines.join(', ')
                    : primaryLabel || 'Slide'
            }
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={tooltipLines.join('\n')}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 8px',
                margin: '1px 4px',
                borderRadius: 3,
                borderLeft,
                background: bg,
                cursor: 'pointer',
            }}
        >
            <WsiSlideThumbnail
                tileServerBase={tileServerBase}
                slideKey={slide.slide_key}
                studyId={studyId}
                authScope={authScope}
            />
            <span
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: dotColor,
                    flexShrink: 0,
                    display: 'inline-block',
                }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.text,
                        ...ellipsisStyle,
                    }}
                >
                    {primaryLabel}
                </div>
                {partDesc && (
                    <div
                        style={{
                            fontSize: 10,
                            color: theme.blue,
                            ...ellipsisStyle,
                            fontStyle: 'italic',
                        }}
                    >
                        {partDesc}
                    </div>
                )}
                {blockMeaning && (
                    <div
                        style={{
                            fontSize: 10,
                            color: theme.blue,
                            ...ellipsisStyle,
                        }}
                    >
                        {blockMeaning}
                    </div>
                )}
                {subTokens.length > 0 && (
                    <div
                        style={{
                            fontSize: 10,
                            color: theme.muted,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {subTokens.join(' · ')}
                    </div>
                )}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.5 }}>
                {matchBadge && (
                    <div
                        data-testid={`wsi-slide-match-badge-${slide.slide_key}`}
                        title={`${matchBadge.label}-matched to this sequenced sample`}
                        style={{
                            display: 'inline-block',
                            padding: '0 3px',
                            borderRadius: 2,
                            background: '#f0f0f0',
                            color: matchBadge.color,
                            fontSize: 9,
                            fontWeight: 700,
                            lineHeight: '14px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {matchBadge.label}
                    </div>
                )}
                {rhsStain && (
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: dotColor,
                        }}
                    >
                        {rhsStain}
                    </div>
                )}
                {mag && (
                    <div style={{ fontSize: 10, color: theme.muted }}>
                        {mag}
                    </div>
                )}
                <div style={{ fontSize: 10, color: theme.muted }}>{sz}</div>
            </div>
        </div>
    );
}

function WsiSlideThumbnail({
    tileServerBase,
    slideKey,
    studyId,
    authScope,
}: {
    tileServerBase: string;
    slideKey: string;
    studyId: string;
    authScope: string;
}) {
    const hostRef = React.useRef<HTMLDivElement>(null);
    const objectUrlRef = React.useRef<string | null>(null);
    const [source, setSource] = React.useState<string | null>(null);
    const [hidden, setHidden] = React.useState(false);

    React.useEffect(() => {
        setSource(null);
        setHidden(false);
        let cancelled = false;
        let controller: AbortController | null = null;
        let observer: IntersectionObserver | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let attempt = 0;
        let loadThumbnail: () => void;

        const revokeObjectUrl = () => {
            const objectUrl = objectUrlRef.current;
            objectUrlRef.current = null;
            if (objectUrl && typeof URL.revokeObjectURL === 'function') {
                URL.revokeObjectURL(objectUrl);
            }
        };

        const scheduleRetry = (delayMs: number | null) => {
            if (cancelled || delayMs === null) {
                if (!cancelled && delayMs === null) {
                    setHidden(true);
                }
                return;
            }
            retryTimer = setTimeout(() => {
                retryTimer = null;
                loadThumbnail();
            }, delayMs);
        };

        loadThumbnail = () => {
            if (cancelled) {
                return;
            }
            attempt += 1;
            const requestAttempt = attempt;
            const requestController = new AbortController();
            controller = requestController;
            void scheduleThumbnailRequest(async () => {
                const access = await getWsiSlideAccess(
                    studyId,
                    slideKey,
                    false,
                    authScope
                );
                const blob = await fetchWsiThumbnailBlob(
                    tileServerBase,
                    studyId,
                    slideKey,
                    access,
                    requestController.signal,
                    requestAttempt > 1 ? 'reload' : 'default',
                    authScope
                );
                return blob;
            }, requestController.signal)
                .then(blob => {
                    const nextObjectUrl = URL.createObjectURL(blob);
                    if (cancelled) {
                        if (typeof URL.revokeObjectURL === 'function') {
                            URL.revokeObjectURL(nextObjectUrl);
                        }
                        return;
                    }
                    revokeObjectUrl();
                    objectUrlRef.current = nextObjectUrl;
                    setSource(nextObjectUrl);
                })
                .catch(error => {
                    if (cancelled || error?.name === 'AbortError') return;
                    if (error instanceof WsiThumbnailFetchError) {
                        if (!error.retryable) {
                            setHidden(true);
                            return;
                        }
                        scheduleRetry(
                            thumbnailRetryDelayMs(
                                error.response,
                                error.reason,
                                attempt
                            )
                        );
                        return;
                    }
                    scheduleRetry(
                        thumbnailRetryDelayMs(undefined, undefined, attempt)
                    );
                });
        };

        const host = hostRef.current;
        if (!host || typeof IntersectionObserver === 'undefined') {
            loadThumbnail();
        } else {
            observer = new IntersectionObserver(
                entries => {
                    if (entries.some(entry => entry.isIntersecting)) {
                        observer?.disconnect();
                        observer = null;
                        loadThumbnail();
                    }
                },
                { rootMargin: '200px' }
            );
            observer.observe(host);
        }

        return () => {
            cancelled = true;
            observer?.disconnect();
            controller?.abort();
            if (retryTimer) {
                clearTimeout(retryTimer);
            }
            revokeObjectUrl();
        };
    }, [slideKey, studyId, tileServerBase]);

    if (hidden) {
        return null;
    }

    return (
        <div
            ref={hostRef}
            data-testid={`wsi-slide-thumbnail-${slideKey}`}
            aria-hidden="true"
            style={{
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #ddd',
                borderRadius: 2,
                background: '#f1f1f1',
            }}
        >
            {source && (
                <img
                    src={source}
                    alt=""
                    loading="lazy"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                    }}
                    onError={() => {
                        const objectUrl = objectUrlRef.current;
                        objectUrlRef.current = null;
                        if (
                            objectUrl &&
                            typeof URL.revokeObjectURL === 'function'
                        ) {
                            URL.revokeObjectURL(objectUrl);
                        }
                        setSource(null);
                        setHidden(true);
                    }}
                />
            )}
        </div>
    );
}
