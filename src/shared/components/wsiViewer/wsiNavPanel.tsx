import * as React from 'react';
import { Sample, Slide, PatientHierarchy } from './wsiViewerTypes';
import {
    getServableSlideEntriesForHierarchy,
    getServableSlidesForSample,
} from './wsiSlideUtils';
import {
    abbreviatePartDesc,
    barcodeSection,
    cleanStain,
    compareSamplesByTimepoint,
    decodeBlockCode,
    fmtMB,
    normalizeBlockLabel,
    sampleTimepointText,
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
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    onFilterChange: (f: 'all' | 'hne' | 'ihc') => void;
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    theme: WsiTheme;
    navWidth: number;
    sectionTitleStyle: React.CSSProperties;
}

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

export function WsiNavPanel({
    hierarchy,
    selectedSlide,
    stainFilter,
    onFilterChange,
    onSelectSlide,
    theme,
    navWidth,
    sectionTitleStyle,
}: WsiNavPanelProps) {
    const samples = React.useMemo(
        () => [...hierarchy.samples].sort(compareSamplesByTimepoint),
        [hierarchy]
    );
    const allSlides = React.useMemo(
        () =>
            getServableSlideEntriesForHierarchy(hierarchy).map(
                entry => entry.slide
            ),
        [hierarchy]
    );
    const counts = React.useMemo(
        () => ({
            all: allSlides.length,
            hne: allSlides.filter(s => s.is_hne).length,
            ihc: allSlides.filter(s => s.is_ihc).length,
        }),
        [allSlides]
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
                <div className="btn-group btn-group-xs" style={{ marginTop: 7 }}>
                    {chips.map(chip => {
                        const count = counts[chip.key];
                        const disabled = chip.key !== 'all' && count === 0;
                        const active = stainFilter === chip.key;
                        return (
                            <button
                                key={chip.key}
                                className={`btn btn-xs ${
                                    active ? 'btn-primary' : 'btn-default'
                                }`}
                                disabled={disabled}
                                onClick={() => onFilterChange(chip.key)}
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
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {samples.map(sample => (
                    <SampleNode
                        key={sample.sample_id}
                        sample={sample}
                        selectedSlide={selectedSlide}
                        stainFilter={stainFilter}
                        onSelectSlide={onSelectSlide}
                        theme={theme}
                    />
                ))}
            </div>
        </div>
    );
}

function SampleNode({
    sample,
    selectedSlide,
    stainFilter,
    onSelectSlide,
    theme,
}: {
    sample: Sample;
    selectedSlide: Slide | null;
    stainFilter: 'all' | 'hne' | 'ihc';
    onSelectSlide: (slide: Slide, sample: Sample) => void;
    theme: WsiTheme;
}) {
    const [open, setOpen] = React.useState(true);
    const timepoint = sampleTimepointText(sample);
    const servableSlides = React.useMemo(
        () => getServableSlidesForSample(sample),
        [sample]
    );
    const visibleSlideCount = servableSlides.length;

    const stLower = (sample.sample_type || '').toLowerCase();
    const stClass =
        stLower === 'primary'
            ? theme.blue
            : stLower.includes('metastas') ||
              stLower === 'local recurrence'
            ? '#c05000'
            : theme.muted;
    const stBg =
        stLower === 'primary'
            ? theme.blueLight
            : stLower.includes('metastas') ||
              stLower === 'local recurrence'
            ? '#fef0e8'
            : '#f0f0f0';

    const DUMMY = new Set(['0', '']);
    const allPartDescs = React.useMemo(
        () =>
            new Set(
                servableSlides
                    .map(slide => slide.part_description || '')
                    .filter(Boolean)
            ),
        [servableSlides]
    );
    const multiPart = allPartDescs.size > 1;

    const sortedSlides = React.useMemo(() => {
        const result: Array<{ slide: Slide; blockLabel: string | null }> = [];
        const remainingIds = new Set(
            servableSlides.map(slide => slide.image_id).filter(Boolean)
        );
        for (const part of sample.parts) {
            for (const block of part.blocks) {
                const lbl = normalizeBlockLabel(
                    block.block_label,
                    block.block_number
                );
                const blockLabel = DUMMY.has(lbl) ? null : lbl;
                for (const slide of block.slides) {
                    if (!remainingIds.has(slide.image_id)) continue;
                    remainingIds.delete(slide.image_id);
                    result.push({ slide, blockLabel });
                }
            }
        }
        result.sort((a, b) => {
            const na = Number(a.slide.block_number) || 0;
            const nb = Number(b.slide.block_number) || 0;
            if (na !== nb) return na - nb;
            return (a.slide.stain_name || '').localeCompare(
                b.slide.stain_name || ''
            );
        });
        return result;
    }, [sample, servableSlides]);

    return (
        <div style={{ borderBottom: `1px solid ${theme.border}` }}>
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
                    {timepoint && (
                        <div
                            title="Matched IMPACT sample timeline proxy for when this H&E slide was banked"
                            style={{
                                fontSize: 10,
                                color: '#888',
                                cursor: 'help',
                            }}
                        >
                            Timepoint: {timepoint}
                        </div>
                    )}
                </div>
                <div
                    title="Servable slides shown in this sample"
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
                    {sortedSlides.map(({ slide, blockLabel }) => {
                        const visible =
                            stainFilter === 'all' ||
                            getStainKind(slide) === stainFilter;
                        if (!visible) return null;
                        return (
                            <SlideItem
                                key={slide.image_id}
                                slide={slide}
                                sample={sample}
                                blockLabel={blockLabel}
                                multiPart={multiPart}
                                selected={
                                    selectedSlide?.image_id === slide.image_id
                                }
                                onSelectSlide={onSelectSlide}
                                theme={theme}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SlideItem({
    slide,
    sample,
    blockLabel,
    multiPart,
    selected,
    onSelectSlide,
    theme,
}: {
    slide: Slide;
    sample: Sample;
    blockLabel: string | null;
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

    const bg = selected ? theme.blueLight : hovered ? theme.blueLight : 'transparent';
    const borderLeft = selected
        ? `2px solid ${theme.blue}`
        : '2px solid transparent';

    return (
        <div
            data-testid={`wsi-slide-item-${slide.image_id}`}
            onClick={() =>
                slide.can_serve_tiles && onSelectSlide(slide, sample)
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
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.5 }}>
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
                    <div style={{ fontSize: 10, color: theme.muted }}>{mag}</div>
                )}
                <div style={{ fontSize: 10, color: theme.muted }}>{sz}</div>
            </div>
        </div>
    );
}
