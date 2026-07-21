import * as React from 'react';
import {
    PatientHierarchy,
    PathologySlideMatchFilter,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';
import {
    countServableSlidesForSample,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideAssociationsByImageIdReadOnly,
    sampleHasMultiplePartDescriptions,
} from './wsiSlideUtils';
import {
    abbreviatePartDesc,
    barcodeSection,
    cleanStain,
    compareSamplesByTimepoint,
    decodeBlockCode,
    fmtMB,
    procedureSlideTimepointText,
    stainQualifier,
} from './wsiNavUtils';
import { getStainDotColor, getStainKind } from './wsiMetaUtils';

type WsiTheme = {
    blue: string;
    blueLight: string;
    orange: string;
    text: string;
    muted: string;
    border: string;
    navBg: string;
};

export interface WsiNavPanelProps {
    hierarchy: PatientHierarchy;
    dataVersion?: number;
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    sampleIdFilter?: string;
    matchFilter?: PathologySlideMatchFilter;
    deferOffscreenSamples?: boolean;
    onFilterChange: (f: 'all' | 'hne' | 'ihc') => void;
    onMatchFilterChange?: (f: PathologySlideMatchFilter) => void;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    theme: WsiTheme;
    navWidth: number;
    sectionTitleStyle: React.CSSProperties;
}

const INITIAL_VISIBLE_SAMPLE_LIMIT = 6;

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

function shouldShowSampleInNavigation(sample: Sample): boolean {
    return (
        sample.sample_id !== 'UNMATCHED' ||
        countServableSlidesForSample(sample) > 0
    );
}

function matchesMatchFilter(
    association: SlideAssociation | undefined,
    matchFilter: PathologySlideMatchFilter
): boolean {
    return (
        matchFilter === 'all' ||
        association?.match_level === matchFilter.toUpperCase()
    );
}

function matchesStainFilter(
    association: Pick<SlideAssociation, 'slide_type'>,
    stainFilter: 'all' | 'hne' | 'ihc'
): boolean {
    return (
        stainFilter === 'all' ||
        (stainFilter === 'hne' && association.slide_type === 'H&E') ||
        (stainFilter === 'ihc' && association.slide_type === 'IHC')
    );
}

function matchesSlideFilters(
    slide: Slide,
    association: SlideAssociation | undefined,
    stainFilter: 'all' | 'hne' | 'ihc',
    matchFilter: PathologySlideMatchFilter
): boolean {
    const matchesStain = association
        ? matchesStainFilter(association, stainFilter)
        : stainFilter === 'all' || getStainKind(slide) === stainFilter;
    const matchesMatch = association
        ? matchesMatchFilter(association, matchFilter)
        : matchFilter === 'all';

    return matchesStain && matchesMatch;
}

type FilteredSampleEntry = {
    sample: Sample;
    filteredSlides: Array<{ slide: Slide; blockLabel: string | null }>;
    filteredSlideIds: Set<string>;
};

function buildFilteredSampleEntry(
    sample: Sample,
    stainFilter: 'all' | 'hne' | 'ihc',
    matchFilter: PathologySlideMatchFilter,
    associationsByImageId: Map<string, SlideAssociation>
): FilteredSampleEntry | null {
    const filteredSlides: Array<{
        slide: Slide;
        blockLabel: string | null;
    }> = [];
    const filteredSlideIds = new Set<string>();

    getOrderedServableSlidesForSampleReadOnly(sample).forEach(entry => {
        const association = associationsByImageId.get(entry.slide.image_id);
        if (
            !matchesSlideFilters(
                entry.slide,
                association,
                stainFilter,
                matchFilter
            )
        ) {
            return;
        }

        filteredSlides.push(entry);
        filteredSlideIds.add(entry.slide.image_id);
    });

    if (!filteredSlides.length) {
        return null;
    }

    return {
        sample,
        filteredSlides,
        filteredSlideIds,
    };
}

function WsiNavPanelComponent({
    hierarchy,
    dataVersion = 0,
    selectedSlide,
    stainFilter,
    sampleIdFilter,
    matchFilter = 'all',
    deferOffscreenSamples = false,
    onFilterChange,
    onMatchFilterChange,
    onSelectSlide,
    theme,
    navWidth,
    sectionTitleStyle,
}: WsiNavPanelProps) {
    const associationsByImageId = React.useMemo(
        () =>
            getServableSlideAssociationsByImageIdReadOnly(
                hierarchy.slide_associations
            ),
        [hierarchy.slide_associations]
    );
    const selectedSlideId = selectedSlide?.image_id;
    const allSampleEntries = React.useMemo(
        () =>
            hierarchy.samples.reduce<FilteredSampleEntry[]>(
                (entries, sample) => {
                    if (sampleIdFilter && sample.sample_id !== sampleIdFilter) {
                        return entries;
                    }
                    if (!shouldShowSampleInNavigation(sample)) {
                        return entries;
                    }

                    const entry = buildFilteredSampleEntry(
                        sample,
                        'all',
                        'all',
                        associationsByImageId
                    );

                    if (entry) {
                        entries.push(entry);
                    }

                    return entries;
                },
                []
            ),
        [associationsByImageId, hierarchy.samples, sampleIdFilter]
    );
    const filteredSampleEntries = React.useMemo(
        () =>
            allSampleEntries.reduce<FilteredSampleEntry[]>((entries, entry) => {
                const filteredSlides = entry.filteredSlides.filter(
                    ({ slide }) =>
                        matchesSlideFilters(
                            slide,
                            associationsByImageId.get(slide.image_id),
                            stainFilter,
                            matchFilter
                        )
                );
                if (filteredSlides.length) {
                    entries.push({
                        sample: entry.sample,
                        filteredSlides,
                        filteredSlideIds: new Set(
                            filteredSlides.map(({ slide }) => slide.image_id)
                        ),
                    });
                }
                return entries;
            }, []),
        [allSampleEntries, associationsByImageId, matchFilter, stainFilter]
    );
    const sampleEntries = React.useMemo(() => {
        const sorted = [...filteredSampleEntries].sort((left, right) =>
            compareSamplesByTimepoint(left.sample, right.sample)
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
    const scopedSlideEntries = React.useMemo(
        () =>
            allSampleEntries.flatMap(entry =>
                entry.filteredSlides.map(({ slide }) => ({
                    slide,
                    association: associationsByImageId.get(slide.image_id),
                }))
            ),
        [allSampleEntries, associationsByImageId]
    );
    const chips: Array<{
        key: 'all' | 'hne' | 'ihc';
        label: string;
        color?: string;
    }> = [
        { key: 'all', label: 'All' },
        { key: 'hne', label: '● H&E', color: theme.blue },
        { key: 'ihc', label: '● IHC', color: theme.orange },
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
        const filteredCounts = { all: 0, hne: 0, ihc: 0 };
        scopedSlideEntries.forEach(({ slide, association }) => {
            if (
                association
                    ? !matchesMatchFilter(association, matchFilter)
                    : matchFilter !== 'all'
            ) {
                return;
            }
            filteredCounts.all += 1;
            const stainType = association
                ? association.slide_type === 'H&E'
                    ? 'hne'
                    : 'ihc'
                : getStainKind(slide);
            if (stainType === 'hne') {
                filteredCounts.hne += 1;
            }
            if (stainType === 'ihc') {
                filteredCounts.ihc += 1;
            }
        });

        return filteredCounts;
    }, [matchFilter, scopedSlideEntries]);
    const matchCounts = React.useMemo(() => {
        const filteredCounts = { part: 0, block: 0, unmatched: 0 };
        scopedSlideEntries.forEach(({ slide, association }) => {
            const matchesStain = association
                ? matchesStainFilter(association, stainFilter)
                : stainFilter === 'all' || getStainKind(slide) === stainFilter;
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
    }, [scopedSlideEntries, stainFilter]);

    return (
        <div
            style={{
                width: navWidth,
                minWidth: navWidth,
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
                <div style={sectionTitleStyle}>Slides</div>
                <div
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
                                    if (active || disabled) {
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
                                {chip.key === 'hne'
                                    ? 'H&E'
                                    : chip.key === 'ihc'
                                    ? 'IHC'
                                    : 'All'}
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
                    className="btn-group btn-group-xs"
                    style={{ marginTop: 6 }}
                    aria-label="Filter slides by match level"
                >
                    {matchChips.map(chip => {
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
                                    if (active || count === 0) {
                                        return;
                                    }
                                    onMatchFilterChange?.(chip.key);
                                }}
                            >
                                {chip.label}
                                {count !== undefined && (
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
                    style={{
                        marginTop: 6,
                        color: theme.muted,
                        fontSize: 10,
                    }}
                    data-testid="wsi-filtered-slide-count"
                >
                    {filteredSlideCount === 0
                        ? 'No slides match these filters'
                        : `Showing ${filteredSlideCount} slide${
                              filteredSlideCount === 1 ? '' : 's'
                          }`}
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
                            dataVersion={dataVersion}
                            sampleIndex={index}
                            selectedSlide={selectedSlide}
                            stainFilter={stainFilter}
                            matchFilter={matchFilter}
                            associationsByImageId={associationsByImageId}
                            onSelectSlide={onSelectSlide}
                            theme={theme}
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
                        Loading {hiddenSampleCount} more sample
                        {hiddenSampleCount === 1 ? '' : 's'}...
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
    dataVersion,
    sampleIndex,
    selectedSlide,
    filteredSlides,
    stainFilter,
    matchFilter,
    associationsByImageId,
    onSelectSlide,
    theme,
}: {
    sample: Sample;
    containsSelectedSlide: boolean;
    filteredSlides: Array<{ slide: Slide; blockLabel: string | null }>;
    dataVersion: number;
    sampleIndex: number;
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    matchFilter: PathologySlideMatchFilter;
    associationsByImageId: Map<string, SlideAssociation>;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    theme: WsiTheme;
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
                            key={slide.image_id}
                            slide={slide}
                            sample={sample}
                            blockLabel={blockLabel}
                            association={associationsByImageId.get(
                                slide.image_id
                            )}
                            multiPart={multiPart}
                            selected={
                                selectedSlide?.image_id === slide.image_id
                            }
                            onSelectSlide={onSelectSlide}
                            theme={theme}
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
        prev.dataVersion !== next.dataVersion ||
        prev.sampleIndex !== next.sampleIndex ||
        prev.stainFilter !== next.stainFilter ||
        prev.matchFilter !== next.matchFilter ||
        prev.filteredSlides !== next.filteredSlides ||
        prev.associationsByImageId !== next.associationsByImageId ||
        prev.onSelectSlide !== next.onSelectSlide ||
        prev.theme !== next.theme
    ) {
        return false;
    }

    if (
        next.containsSelectedSlide &&
        prev.selectedSlide?.image_id !== next.selectedSlide?.image_id
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
    theme,
}: {
    slide: Slide;
    sample: Sample;
    blockLabel: string | null;
    association: SlideAssociation | undefined;
    multiPart: boolean;
    selected: boolean;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    theme: WsiTheme;
}) {
    const [hovered, setHovered] = React.useState(false);
    const isHE =
        slide.is_hne ||
        (slide.stain_group || '').toLowerCase().startsWith('h&e');
    const dotColor = getStainDotColor(slide, theme);
    const mag = slide.magnification || '';
    const sz = fmtMB(slide.file_size_bytes);
    const section = barcodeSection(slide.barcode);
    const partDesc = multiPart
        ? abbreviatePartDesc(slide.part_description)
        : null;
    const blockMeaning = !partDesc ? decodeBlockCode(blockLabel) : null;
    const primaryLabel = isHE
        ? blockLabel || section || cleanStain(slide.stain_name)
        : cleanStain(slide.stain_name);
    const subTokens: string[] = [];
    if (!isHE && blockLabel) subTokens.push(blockLabel);
    if (section) subTokens.push(section);
    const rhsStain = isHE ? stainQualifier(slide.stain_group) : null;
    const timepoint = procedureSlideTimepointText(slide);
    const matchBadge =
        association?.match_level === 'BLOCK'
            ? { label: 'Block', color: '#2f7d32' }
            : association?.match_level === 'PART'
            ? { label: 'Part', color: '#476f9e' }
            : undefined;

    const tooltipLines: string[] = [];
    if (!slide.can_serve_tiles) tooltipLines.push('⚠ Tiles not yet available');
    if (slide.barcode) tooltipLines.push(`Barcode: ${slide.barcode}`);
    if (slide.stain_name) tooltipLines.push(`Stain: ${slide.stain_name}`);
    if (blockLabel) tooltipLines.push(`Block: ${blockLabel}`);
    if (slide.part_description) {
        tooltipLines.push(`Part: ${slide.part_description}`);
    }
    if (section) tooltipLines.push(`Section: ${section}`);
    if (mag) tooltipLines.push(`Magnification: ${mag}`);
    if (sz !== '—') tooltipLines.push(`Size: ${sz}`);
    tooltipLines.push(`Image ID: ${slide.image_id}`);

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
            data-testid={`wsi-slide-item-${slide.image_id}`}
            onClick={() => {
                if (!slide.can_serve_tiles || selected) {
                    return;
                }
                onSelectSlide(slide, sample);
            }}
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
                cursor: slide.can_serve_tiles ? 'pointer' : 'help',
                opacity: slide.can_serve_tiles ? 1 : 0.55,
            }}
        >
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
                {timepoint && (
                    <div
                        style={{
                            fontSize: 10,
                            color: '#888',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {timepoint}
                    </div>
                )}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.5 }}>
                {matchBadge && (
                    <div
                        data-testid={`wsi-slide-match-badge-${slide.image_id}`}
                        title={`${matchBadge.label}-matched to this IMPACT sample`}
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
