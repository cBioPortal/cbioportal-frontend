import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
    ProteinDomain,
    TranscriptData,
    RetainedDomain,
    COLOR_BREAKPOINT,
} from '../data/types';
import { DomainTooltip } from './ExonTooltip';
import {
    select5PrimeDomains,
    select3PrimeDomains,
    retainedExonsInOrder,
    computeFusionExonLayout,
    genomicToExonX,
    ghostStubRect,
} from './fusionProductHelpers';
import {
    generatePfamDomainColorMap,
    readableTextColor,
    PFAM_FALLBACK_COLOR,
} from '../data/pfamColors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DOMAIN_HEIGHT = 16;
const DOMAIN_GAP = 3;
const LABEL_HEIGHT = 16;
const PADDING_TOP = 4;
const BACKBONE_HEIGHT = 4;
const TWEEN_DURATION = 0.35;
const TWEEN_EASE = 'power2.out';
// Skip tween if the domain barely moved — prevents "wobble" on tiny
// protein-length differences between transcripts.
const POS_EPSILON = 3;
// Minimum ghost width in px below which the ghost rect is suppressed.
// The badge + tooltip still show so truncation is not silently lost.
const MIN_GHOST_W = 2;

export function getProteinDomainTrackHeight(): number {
    return PADDING_TOP + LABEL_HEIGHT + DOMAIN_HEIGHT + DOMAIN_GAP + 8;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ProteinDomainTrackProps {
    /** FORTE transcript for 5-prime gene */
    forteTranscript5p: TranscriptData;
    /** FORTE transcript for 3-prime gene (may be undefined) */
    forteTranscript3p?: TranscriptData;
    /** Genomic breakpoint position on the 5-prime gene (used to clip domains). */
    breakpoint5p: number;
    /** Genomic breakpoint position on the 3-prime gene (omit with gene2). */
    breakpoint3p?: number;
    /** SVG x origin */
    x: number;
    /** SVG y origin */
    y: number;
    /** Available width */
    width: number;
}

interface DomainSlot {
    key: string; // stable per side + index, e.g. "5p-0"
    side: '5p' | '3p';
    /** Left edge and width of the retained (solid) portion. */
    x: number;
    width: number;
    /** Left edge and width of the lost (ghost/hatched) portion. */
    ghostX: number;
    ghostWidth: number;
    isTruncated: boolean;
    retainedFraction: number;
    retainedStartAA: number;
    retainedEndAA: number;
    label: string;
    fill: string;
    stroke: string;
    textFill: string;
    domain: ProteinDomain;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ProteinDomainTrack: React.FC<ProteinDomainTrackProps> = ({
    forteTranscript5p,
    forteTranscript3p,
    breakpoint5p,
    breakpoint3p,
    x,
    y,
    width,
}) => {
    const rectRefs = useRef<Map<string, SVGRectElement>>(new Map());
    const ghostRectRefs = useRef<Map<string, SVGRectElement>>(new Map());
    const labelRefs = useRef<Map<string, SVGTextElement>>(new Map());
    const boundaryRef = useRef<SVGLineElement | null>(null);
    const prevSlotsRef = useRef<Map<string, DomainSlot>>(new Map());
    const prevBoundaryRef = useRef<number | null>(null);

    // Clip domains to the retained portion so the track matches the exon
    // track — otherwise both sides of a same-transcript intragenic fusion
    // (e.g. EGFRvIII) show the full-length domain set verbatim.
    const domains5p: RetainedDomain[] = select5PrimeDomains(
        forteTranscript5p.domains || [],
        breakpoint5p,
        forteTranscript5p.strand
    );
    const domains3p: RetainedDomain[] =
        forteTranscript3p && breakpoint3p !== undefined
            ? select3PrimeDomains(
                  forteTranscript3p.domains || [],
                  breakpoint3p,
                  forteTranscript3p.strand
              )
            : [];

    // ---- Align with the exon track ----
    // Build the SAME to-scale exon layout the fusion product uses, then place
    // each domain by its genomic coordinates so it sits directly under the
    // exons that encode it. The 5'/3' boundary is the exon junction.
    const retained5p = retainedExonsInOrder(
        forteTranscript5p,
        breakpoint5p,
        true
    );
    const retained3p =
        forteTranscript3p && breakpoint3p !== undefined
            ? retainedExonsInOrder(forteTranscript3p, breakpoint3p, false)
            : [];
    const layout = computeFusionExonLayout(retained5p, retained3p, x, width);

    const drawPadding = 10;
    const drawX = x + drawPadding;
    const drawWidth = width - drawPadding * 2;
    const trackY = y + PADDING_TOP + LABEL_HEIGHT;
    const MIN_DOMAIN_W = 4;

    // ---- Build slot list (identity-based keys -> same pfam domain
    // keeps its key across transcripts so tween targets the same rect
    // rather than shuffling positions by slot index) ----
    // Color domains by Pfam id using the cBioPortal palette, computed per gene
    // over that gene's FULL domain set so a domain keeps the same color it has
    // in that gene's mutation-mapper view (retained domains are a subset).
    const colorMap5p = generatePfamDomainColorMap(
        forteTranscript5p.domains || []
    );
    const colorMap3p = generatePfamDomainColorMap(
        (forteTranscript3p && forteTranscript3p.domains) || []
    );

    const slots: DomainSlot[] = [];
    if (retained5p.length > 0 || retained3p.length > 0) {
        const pushSlots = (
            retainedDomains: RetainedDomain[],
            side: '5p' | '3p',
            colorMap: { [pfamId: string]: string },
            exons: typeof retained5p,
            xs: number[],
            widths: number[],
            strand: '+' | '-'
        ) => {
            if (exons.length === 0) return;
            const occurrence = new Map<string, number>();
            retainedDomains.forEach(rd => {
                const domain = rd.domain;
                // Position by genomic coordinates on the exon layout. Skip
                // domains lacking finite genomic coords (some Genome Nexus
                // Pfam ranges do) — they'd otherwise produce NaN x/width.
                if (
                    !Number.isFinite(domain.startGenomic) ||
                    !Number.isFinite(domain.endGenomic)
                ) {
                    return;
                }
                const xA = genomicToExonX(
                    domain.startGenomic,
                    exons,
                    xs,
                    widths,
                    strand
                );
                const xB = genomicToExonX(
                    domain.endGenomic,
                    exons,
                    xs,
                    widths,
                    strand
                );
                if (!Number.isFinite(xA) || !Number.isFinite(xB)) {
                    return;
                }

                // Solid portion: map retained AA interval back to SVG x via
                // the proportion of the full domain span. For truncated domains
                // we split the total SVG width by the retained/lost AA fractions.
                let solidX: number;
                let solidWidth: number;
                let ghostX: number;
                let ghostWidth: number;

                if (rd.isTruncated) {
                    const fullLen = domain.endAA - domain.startAA + 1;
                    const retainedLen =
                        rd.retainedEndAA - rd.retainedStartAA + 1;
                    const lostLen = rd.lostEndAA - rd.lostStartAA;
                    const totalSvgWidth = Math.abs(xB - xA);
                    const solidSvgWidth = Math.max(
                        MIN_DOMAIN_W,
                        (retainedLen / fullLen) * totalSvgWidth
                    );
                    const lostSvgWidth = Math.max(
                        0,
                        (lostLen / fullLen) * totalSvgWidth
                    );

                    const domainLeft = Math.min(xA, xB);
                    const domainRight = Math.max(xA, xB);
                    // Retained solid sits on the partner's "kept" side; the ghost
                    // stub is capped to the domain footprint so it can't overrun
                    // the junction at very low retention (see ghostStubRect).
                    solidX =
                        side === '5p'
                            ? domainLeft
                            : domainRight - solidSvgWidth;
                    solidWidth = solidSvgWidth;
                    ({ ghostX, ghostWidth } = ghostStubRect(
                        side,
                        solidX,
                        solidWidth,
                        lostSvgWidth,
                        domainLeft,
                        domainRight
                    ));
                } else {
                    solidX = Math.min(xA, xB);
                    solidWidth = Math.max(MIN_DOMAIN_W, Math.abs(xB - xA));
                    ghostX = solidX;
                    ghostWidth = 0;
                }

                const domainName = domain.name || domain.pfamId || '';
                const maxChars = Math.floor(solidWidth / 6);
                const label =
                    domainName.length > maxChars && maxChars > 3
                        ? domainName.substring(0, maxChars - 1) + '…'
                        : maxChars <= 3
                        ? ''
                        : domainName;

                const identity = domain.pfamId || domain.name || 'unknown';
                const occ = occurrence.get(identity) ?? 0;
                occurrence.set(identity, occ + 1);

                const fill =
                    (domain.pfamId && colorMap[domain.pfamId]) ||
                    PFAM_FALLBACK_COLOR;
                slots.push({
                    key: `${side}-${identity}-${occ}`,
                    side,
                    x: solidX,
                    width: solidWidth,
                    ghostX,
                    ghostWidth,
                    isTruncated: rd.isTruncated,
                    retainedFraction: rd.retainedFraction,
                    retainedStartAA: rd.retainedStartAA,
                    retainedEndAA: rd.retainedEndAA,
                    label,
                    fill,
                    stroke: fill,
                    textFill: readableTextColor(fill),
                    domain,
                });
            });
        };
        pushSlots(
            domains5p,
            '5p',
            colorMap5p,
            retained5p,
            layout.xs5p,
            layout.widths5p,
            forteTranscript5p.strand
        );
        if (forteTranscript3p) {
            pushSlots(
                domains3p,
                '3p',
                colorMap3p,
                retained3p,
                layout.xs3p,
                layout.widths3p,
                forteTranscript3p.strand
            );
        }
    }

    // 5'/3' boundary now coincides with the exon-track junction.
    const boundaryX =
        retained5p.length > 0 && retained3p.length > 0
            ? layout.junctionX
            : null;

    // Only re-run when the active transcripts themselves change. Re-renders
    // from unrelated parent updates won't trigger animations.
    const transitionKey = `${
        forteTranscript5p.transcriptId
    }|${forteTranscript3p?.transcriptId ?? ''}`;

    useLayoutEffect(() => {
        if (slots.length === 0) {
            prevSlotsRef.current = new Map();
            prevBoundaryRef.current = null;
            return;
        }

        const prevSlots = prevSlotsRef.current;

        slots.forEach(slot => {
            const rect = rectRefs.current.get(slot.key);
            const label = labelRefs.current.get(slot.key);
            const ghostRect = ghostRectRefs.current.get(slot.key);
            const prev = prevSlots.get(slot.key);

            // Always force opacity back to 1 first. GSAP mutates the DOM
            // directly and opacity is NOT a React-controlled prop here, so an
            // interrupted fade (rapid transcript switching) would otherwise
            // leave a domain stuck invisible. Heal it every run; only the
            // position still tweens.
            if (rect) {
                gsap.killTweensOf(rect);
                gsap.set(rect, { opacity: 1 });
            }
            if (label) {
                gsap.killTweensOf(label);
                gsap.set(label, { opacity: 1 });
            }
            if (ghostRect) {
                gsap.killTweensOf(ghostRect);
                gsap.set(ghostRect, { opacity: 1 });
            }

            // Newly appeared (no previous position) — already visible, no slide.
            if (!prev) return;

            const dx = Math.abs(prev.x - slot.x);
            const dw = Math.abs(prev.width - slot.width);
            if (dx < POS_EPSILON && dw < POS_EPSILON) {
                // Same domain, barely moved — skip animation to avoid wobble.
                return;
            }

            if (rect) {
                gsap.fromTo(
                    rect,
                    { attr: { x: prev.x, width: prev.width } },
                    {
                        attr: { x: slot.x, width: slot.width },
                        duration: TWEEN_DURATION,
                        ease: TWEEN_EASE,
                    }
                );
            }
            if (label) {
                gsap.fromTo(
                    label,
                    { attr: { x: prev.x + prev.width / 2 } },
                    {
                        attr: { x: slot.x + slot.width / 2 },
                        duration: TWEEN_DURATION,
                        ease: TWEEN_EASE,
                    }
                );
            }
            if (ghostRect) {
                gsap.fromTo(
                    ghostRect,
                    { attr: { x: prev.ghostX, width: prev.ghostWidth } },
                    {
                        attr: { x: slot.ghostX, width: slot.ghostWidth },
                        duration: TWEEN_DURATION,
                        ease: TWEEN_EASE,
                    }
                );
            }
        });

        const boundary = boundaryRef.current;
        if (boundary && boundaryX !== null) {
            const prev = prevBoundaryRef.current;
            if (prev !== null && Math.abs(prev - boundaryX) >= POS_EPSILON) {
                gsap.killTweensOf(boundary);
                gsap.fromTo(
                    boundary,
                    { attr: { x1: prev, x2: prev } },
                    {
                        attr: { x1: boundaryX, x2: boundaryX },
                        duration: TWEEN_DURATION,
                        ease: TWEEN_EASE,
                    }
                );
            }
        }

        const nextPrev = new Map<string, DomainSlot>();
        slots.forEach(s => nextPrev.set(s.key, s));
        prevSlotsRef.current = nextPrev;
        prevBoundaryRef.current = boundaryX;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transitionKey]);

    // ---- Edge cases (after hooks, per Rules of Hooks) ----
    if (slots.length === 0) return null;

    // Hatch pattern ids per color side.
    const hatchId5p = 'domain-hatch-5p';
    const hatchId3p = 'domain-hatch-3p';

    return (
        <g>
            {/* Hatch pattern defs for ghost (truncated) domain stubs */}
            <defs>
                <pattern
                    id={hatchId5p}
                    patternUnits="userSpaceOnUse"
                    width="4"
                    height="4"
                    patternTransform="rotate(45)"
                >
                    <rect width="4" height="4" fill="none" />
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="4"
                        stroke="#5A73B3"
                        strokeWidth={1}
                        opacity={0.5}
                    />
                </pattern>
                <pattern
                    id={hatchId3p}
                    patternUnits="userSpaceOnUse"
                    width="4"
                    height="4"
                    patternTransform="rotate(45)"
                >
                    <rect width="4" height="4" fill="none" />
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="4"
                        stroke="#60187D"
                        strokeWidth={1}
                        opacity={0.5}
                    />
                </pattern>
            </defs>

            {/* Section label */}
            <text
                x={drawX}
                y={y + PADDING_TOP + 11}
                fontSize={10}
                fontWeight="bold"
                fill="#555"
            >
                Protein Domains
            </text>

            {/* Backbone line */}
            <rect
                x={drawX}
                y={trackY + DOMAIN_HEIGHT / 2 - BACKBONE_HEIGHT / 2}
                width={drawWidth}
                height={BACKBONE_HEIGHT}
                fill="#e0e0e0"
                rx={2}
            />

            {/* Boundary between 5p and 3p proteins (animated) */}
            {boundaryX !== null && (
                <line
                    ref={boundaryRef}
                    x1={boundaryX}
                    y1={trackY - 2}
                    x2={boundaryX}
                    y2={trackY + DOMAIN_HEIGHT + 2}
                    stroke="#ccc"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                />
            )}

            {/* Domains (tweened on transcript change) */}
            {slots.map(slot => {
                const showGhost = slot.ghostWidth >= MIN_GHOST_W;
                const hatchUrl = `url(#${
                    slot.side === '5p' ? hatchId5p : hatchId3p
                })`;
                // Badge position: top-right corner of solid rect for 5p,
                // top-left for 3p (always toward the junction cut edge).
                const badgeX =
                    slot.side === '5p' ? slot.x + slot.width : slot.x;
                const badgeCy = trackY - 3;
                return (
                    <DomainTooltip
                        key={slot.key}
                        domain={slot.domain}
                        isTruncated={slot.isTruncated}
                        retainedStartAA={slot.retainedStartAA}
                        retainedEndAA={slot.retainedEndAA}
                        retainedFraction={slot.retainedFraction}
                    >
                        <g>
                            {/* Ghost / hatched stub for the lost portion */}
                            {showGhost && (
                                <rect
                                    ref={(el: SVGRectElement | null) => {
                                        if (el)
                                            ghostRectRefs.current.set(
                                                slot.key,
                                                el
                                            );
                                        else
                                            ghostRectRefs.current.delete(
                                                slot.key
                                            );
                                    }}
                                    x={slot.ghostX}
                                    y={trackY}
                                    width={slot.ghostWidth}
                                    height={DOMAIN_HEIGHT}
                                    fill={hatchUrl}
                                    stroke={slot.stroke}
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                    opacity={0.45}
                                    rx={2}
                                    ry={2}
                                    pointerEvents="none"
                                />
                            )}

                            {/* Solid retained portion */}
                            <rect
                                ref={(el: SVGRectElement | null) => {
                                    if (el) rectRefs.current.set(slot.key, el);
                                    else rectRefs.current.delete(slot.key);
                                }}
                                x={slot.x}
                                y={trackY}
                                width={slot.width}
                                height={DOMAIN_HEIGHT}
                                fill={slot.fill}
                                stroke={slot.stroke}
                                strokeWidth={1}
                                rx={4}
                                ry={4}
                            />

                            {/* Text label (inside solid portion) */}
                            {slot.label && (
                                <text
                                    ref={(el: SVGTextElement | null) => {
                                        if (el)
                                            labelRefs.current.set(slot.key, el);
                                        else labelRefs.current.delete(slot.key);
                                    }}
                                    x={slot.x + slot.width / 2}
                                    y={trackY + DOMAIN_HEIGHT / 2 + 3}
                                    textAnchor="middle"
                                    fontSize={8}
                                    fill={slot.textFill}
                                    pointerEvents="none"
                                >
                                    {slot.label}
                                </text>
                            )}

                            {/* Truncation badge: red circle with "!" at the cut edge */}
                            {slot.isTruncated && (
                                <g pointerEvents="none">
                                    <circle
                                        cx={badgeX}
                                        cy={badgeCy}
                                        r={5}
                                        fill={COLOR_BREAKPOINT}
                                    />
                                    <text
                                        x={badgeX}
                                        y={badgeCy + 3.5}
                                        textAnchor="middle"
                                        fontSize={7}
                                        fontWeight="bold"
                                        fill="white"
                                    >
                                        !
                                    </text>
                                </g>
                            )}
                        </g>
                    </DomainTooltip>
                );
            })}
        </g>
    );
};
