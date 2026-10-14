import { pluralize } from 'cbioportal-frontend-commons';
import * as React from 'react';
import {
    PatientHierarchy,
    PathologySlideMatchFilter,
    Sample,
    Slide,
    WsiStainFilter,
} from './wsiViewerTypes';
import {
    getOrderedServableSlidesForSampleReadOnly,
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
    fmtFileSize,
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
    WSI_MONO_FONT_FAMILY,
    WSI_NAV_WIDTH,
    WSI_SECTION_TITLE_STYLE,
    WSI_STAIN_COLORS,
    WSI_THEME as theme,
} from './wsiTheme';
import { WsiPanelHideButton } from './wsiPanelChrome';
import { WsiFilterChipGroup } from './wsiFilterChips';

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
/** Height of a slide in the tray; the label end is about a third of a real slide's length. */
const SLIDE_HEIGHT = 62;
const SLIDE_LABEL_WIDTH = 118;
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

function matchesSlideFilters(
    slide: Slide,
    stainFilter: WsiStainFilter,
    matchFilter: PathologySlideMatchFilter
): boolean {
    return (
        matchesWsiStainFilter(slide, stainFilter) &&
        matchesMatchFilter(slide, matchFilter)
    );
}

type FilteredSampleEntry = {
    sample: Sample;
    filteredSlides: Array<{ slide: Slide; blockLabel: string | null }>;
    filteredSlideIds: Set<string>;
};

function sampleEntry(
    sample: Sample,
    filteredSlides: FilteredSampleEntry['filteredSlides']
): FilteredSampleEntry | null {
    return filteredSlides.length
        ? {
              sample,
              filteredSlides,
              filteredSlideIds: new Set(
                  filteredSlides.map(({ slide }) => slide.slide_key)
              ),
          }
        : null;
}

/** The entries that keep a slide matching `keep`, with only those slides. */
function narrowSampleEntries(
    entries: FilteredSampleEntry[],
    keep: (slide: Slide) => boolean
): FilteredSampleEntry[] {
    return entries.flatMap(entry => {
        const narrowed = sampleEntry(
            entry.sample,
            entry.filteredSlides.filter(({ slide }) => keep(slide))
        );
        return narrowed ? [narrowed] : [];
    });
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
    const selectedSlideId = selectedSlide?.slide_key;
    const unscopedSampleEntries = React.useMemo(
        () =>
            hierarchy.samples.flatMap(sample => {
                const entry = sampleEntry(
                    sample,
                    getOrderedServableSlidesForSampleReadOnly(sample)
                );
                return entry ? [entry] : [];
            }),
        [hierarchy.samples]
    );
    const allSampleEntries = React.useMemo(() => {
        if (!sampleIdFilter && !slideIdFilter) {
            return unscopedSampleEntries;
        }
        return narrowSampleEntries(
            sampleIdFilter
                ? unscopedSampleEntries.filter(
                      entry => entry.sample.sample_id === sampleIdFilter
                  )
                : unscopedSampleEntries,
            slide => !slideIdFilter || slideIdFilter.has(slide.slide_key)
        );
    }, [sampleIdFilter, slideIdFilter, unscopedSampleEntries]);
    const filteredSampleEntries = React.useMemo(
        () =>
            narrowSampleEntries(allSampleEntries, slide =>
                matchesSlideFilters(slide, stainFilter, matchFilter)
            ),
        [allSampleEntries, matchFilter, stainFilter]
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
    const facetSlides = React.useMemo(
        () =>
            unscopedSampleEntries.flatMap(entry =>
                entry.filteredSlides.map(({ slide }) => slide)
            ),
        [unscopedSampleEntries]
    );
    const chips: Array<{
        key: WsiStainFilter;
        label: string;
        color?: string;
    }> = [
        { key: 'all', label: 'All' },
        { key: 'hne', label: 'H&E', color: WSI_STAIN_COLORS['H&E'] },
        { key: 'ihc', label: 'IHC', color: WSI_STAIN_COLORS.IHC },
        { key: 'other', label: 'Other (known)', color: WSI_STAIN_COLORS.Other },
        { key: 'unknown', label: 'Unknown', color: WSI_STAIN_COLORS.Unknown },
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
        facetSlides.forEach(slide => {
            if (!matchesMatchFilter(slide, matchFilter)) {
                return;
            }
            filteredCounts.all += 1;
            filteredCounts[wsiStainKind(slide)] += 1;
        });

        return filteredCounts;
    }, [facetSlides, matchFilter]);
    const matchCounts = React.useMemo(() => {
        const filteredCounts = { part: 0, block: 0, unmatched: 0 };
        facetSlides.forEach(slide => {
            if (!matchesWsiStainFilter(slide, stainFilter)) {
                return;
            }
            if (slide.match_level === 'PART') filteredCounts.part += 1;
            if (slide.match_level === 'BLOCK') filteredCounts.block += 1;
            if (slide.match_level === 'UNMATCHED') {
                filteredCounts.unmatched += 1;
            }
        });
        return filteredCounts;
    }, [facetSlides, stainFilter]);
    /** A click on the active chip only matters for All, to drop a link scope. */
    const reselects = (current: string, key: string) =>
        current !== key || (key === 'all' && linkoutScopeActive);

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
                <WsiFilterChipGroup
                    label="Filter slides by stain"
                    testId="wsi-stain-filter-row"
                    chipTestIdPrefix="wsi-stain-filter"
                    style={{ marginTop: 7 }}
                    chips={chips
                        .filter(
                            chip =>
                                chip.key === 'all' ||
                                chip.key === stainFilter ||
                                stainCounts[chip.key] > 0
                        )
                        .map(chip => ({
                            ...chip,
                            count:
                                chip.key === 'all'
                                    ? undefined
                                    : stainCounts[chip.key],
                        }))}
                    isActive={key => stainFilter === key}
                    onSelect={key => {
                        if (reselects(stainFilter, key)) onFilterChange(key);
                    }}
                />
                <WsiFilterChipGroup
                    label="Filter slides by match level"
                    testId="wsi-match-filter-row"
                    chipTestIdPrefix="wsi-match-filter"
                    style={{ marginTop: 6 }}
                    chips={matchChips
                        .filter(
                            chip =>
                                chip.key === 'all' || matchCounts[chip.key] > 0
                        )
                        .map(chip => ({
                            ...chip,
                            count:
                                chip.key === 'all'
                                    ? undefined
                                    : matchCounts[chip.key],
                        }))}
                    isActive={key => matchFilter === key}
                    onSelect={key => {
                        if (reselects(matchFilter, key)) {
                            onMatchFilterChange?.(key);
                        }
                    }}
                />
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
                            fontSize: 12,
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
                            display: 'block',
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
                        fontSize: 11,
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
                            fontSize: 11,
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
                        fontSize: 11,
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
                            fontFamily: WSI_MONO_FONT_FAMILY,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: theme.blue,
                            ...ellipsisStyle,
                        }}
                    >
                        {sample.sample_id || '—'}
                    </div>
                </div>
                <div
                    title="Viewable slides shown in this sample"
                    style={{
                        fontSize: 10,
                        color: theme.muted,
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
                <div style={{ padding: '0 10px 8px' }}>
                    {servableSlides.map(({ slide, blockLabel }) => (
                        <SlideItem
                            key={slide.slide_key}
                            slide={slide}
                            sample={sample}
                            blockLabel={blockLabel}
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
    multiPart: boolean;
    selected: boolean;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    tileServerBase: string;
    studyId: string;
    authScope: string;
}) {
    const [hovered, setHovered] = React.useState(false);
    const isHE = wsiStainKind(slide) === 'hne';
    const dotColor = getStainDotColor(slide);
    const mag = slide.magnification || '';
    const sz = fmtFileSize(slide.file_size_bytes);
    const partDesc = multiPart
        ? abbreviatePartDesc(slide.part_description)
        : null;
    const blockMeaning = !partDesc ? decodeBlockCode(blockLabel) : null;
    const stainLabel = cleanStain(slide.stain_name);
    const rawGroup = (slide.stain_group || '').toLowerCase();
    const stainText =
        isHE && (rawGroup === '' || rawGroup.startsWith('h&e'))
            ? stainQualifier(slide.stain_group)
            : stainLabel;
    // Every slide reads the same way: its block as the title and its stain beneath.
    const primaryLabel = blockLabel || stainText || 'Slide';
    const subStain = blockLabel ? stainText : null;
    const scanDetails = [mag, sz !== '—' ? sz : null]
        .filter(Boolean)
        .join(' · ');
    const matchBadge =
        slide.match_level === 'BLOCK'
            ? { label: 'Block', color: '#2f7d32' }
            : slide.match_level === 'PART'
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

    const borderColor = selected ? theme.blue : hovered ? '#b9b9b9' : '#d6d6d6';

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
                height: SLIDE_HEIGHT,
                marginTop: 6,
                borderRadius: 3,
                border: `1px solid ${borderColor}`,
                boxShadow: selected
                    ? `0 0 0 1px ${theme.blue}, 0 2px 6px rgba(55,134,194,0.25)`
                    : hovered
                    ? '0 2px 5px rgba(0,0,0,0.12)'
                    : '0 1px 2px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow 120ms, border-color 120ms',
            }}
        >
            {/* The frosted label end, edged in the stain's color. */}
            <div
                style={{
                    width: SLIDE_LABEL_WIDTH,
                    flexShrink: 0,
                    padding: '5px 7px 4px 8px',
                    background: theme.slideLabel,
                    borderLeft: `4px solid ${dotColor}`,
                    borderRight: '1px solid #e2dfd8',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: 0,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontFamily: WSI_MONO_FONT_FAMILY,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: theme.text,
                            lineHeight: '14px',
                            ...ellipsisStyle,
                        }}
                    >
                        {primaryLabel}
                    </div>
                    {subStain && (
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: dotColor,
                                lineHeight: '14px',
                                ...ellipsisStyle,
                            }}
                        >
                            {subStain}
                        </div>
                    )}
                    {(partDesc || blockMeaning) && (
                        <div
                            style={{
                                fontSize: 11,
                                color: theme.muted,
                                lineHeight: '13px',
                                fontStyle: partDesc ? 'italic' : undefined,
                                ...ellipsisStyle,
                            }}
                        >
                            {partDesc || blockMeaning}
                        </div>
                    )}
                </div>
                {scanDetails && (
                    <div
                        style={{
                            fontSize: 10,
                            color: theme.muted,
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: '12px',
                            ...ellipsisStyle,
                        }}
                    >
                        {scanDetails}
                    </div>
                )}
            </div>
            {/* The glass, with the tissue on it. */}
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    position: 'relative',
                    background: selected ? '#fbfdff' : '#fdfdfc',
                    padding: 3,
                }}
            >
                <WsiSlideThumbnail
                    tileServerBase={tileServerBase}
                    slideKey={slide.slide_key}
                    studyId={studyId}
                    authScope={authScope}
                />
                {matchBadge && (
                    <div
                        data-testid={`wsi-slide-match-badge-${slide.slide_key}`}
                        title={`${matchBadge.label}-matched to this sequenced sample`}
                        style={{
                            position: 'absolute',
                            right: 4,
                            bottom: 3,
                            padding: '0 4px',
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.9)',
                            border: '1px solid #e3e3e3',
                            color: matchBadge.color,
                            fontSize: 9.5,
                            fontWeight: 700,
                            lineHeight: '13px',
                            letterSpacing: '.3px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {matchBadge.label}
                    </div>
                )}
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
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
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
