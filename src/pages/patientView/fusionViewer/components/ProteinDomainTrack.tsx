import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
    ProteinDomain,
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
} from '../data/types';
import { DomainTooltip } from './ExonTooltip';
import {
    select5PrimeDomains,
    select3PrimeDomains,
} from './fusionProductHelpers';

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
const FADE_DURATION = 0.25;
// Skip tween if the domain barely moved — prevents "wobble" on tiny
// protein-length differences between transcripts.
const POS_EPSILON = 3;

export function getProteinDomainTrackHeight(): number {
    return PADDING_TOP + LABEL_HEIGHT + DOMAIN_HEIGHT + DOMAIN_GAP + 8;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/** Lighten a hex color by mixing with white. factor 0 = original, 1 = white */
function lightenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);
    return `rgb(${lr},${lg},${lb})`;
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
    x: number;
    width: number;
    label: string;
    fill: string;
    stroke: string;
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
    const labelRefs = useRef<Map<string, SVGTextElement>>(new Map());
    const boundaryRef = useRef<SVGLineElement | null>(null);
    const prevSlotsRef = useRef<Map<string, DomainSlot>>(new Map());
    const prevBoundaryRef = useRef<number | null>(null);

    // Clip domains to the retained portion so the track matches the exon
    // track — otherwise both sides of a same-transcript intragenic fusion
    // (e.g. EGFRvIII) show the full-length domain set verbatim.
    const domains5p = select5PrimeDomains(
        forteTranscript5p.domains || [],
        breakpoint5p,
        forteTranscript5p.strand
    );
    const domains3p =
        forteTranscript3p && breakpoint3p !== undefined
            ? select3PrimeDomains(
                  forteTranscript3p.domains || [],
                  breakpoint3p,
                  forteTranscript3p.strand
              )
            : [];

    // ---- Build a combined AA coordinate space ----
    const protLen5p = forteTranscript5p.proteinLength || 0;
    const protLen3p =
        forteTranscript3p && forteTranscript3p.proteinLength
            ? forteTranscript3p.proteinLength
            : 0;
    const totalAA = protLen5p + protLen3p;

    const drawPadding = 10;
    const drawX = x + drawPadding;
    const drawWidth = width - drawPadding * 2;
    const trackY = y + PADDING_TOP + LABEL_HEIGHT;

    const aaToSvgX = (aa: number, is3p: boolean): number => {
        if (totalAA === 0) return drawX;
        const offset = is3p ? protLen5p : 0;
        return drawX + ((offset + aa) / totalAA) * drawWidth;
    };

    // ---- Build slot list (identity-based keys → same pfam domain
    // keeps its key across transcripts so tween targets the same rect
    // rather than shuffling positions by slot index) ----
    const slots: DomainSlot[] = [];
    if (totalAA > 0) {
        const pushSlots = (
            domains: ProteinDomain[],
            side: '5p' | '3p',
            colorBase: string
        ) => {
            const fill = lightenColor(colorBase, 0.4);
            const stroke = colorBase;
            const is3p = side === '3p';
            const occurrence = new Map<string, number>();
            domains.forEach(domain => {
                // Skip domains with missing/non-finite AA coordinates —
                // some Pfam ranges from Genome Nexus can come back with
                // null start/end, which would otherwise produce NaN x/width
                // and break SVG rendering.
                if (
                    !Number.isFinite(domain.startAA) ||
                    !Number.isFinite(domain.endAA)
                ) {
                    return;
                }
                const dx = aaToSvgX(domain.startAA, is3p);
                const dEnd = aaToSvgX(domain.endAA, is3p);
                if (!Number.isFinite(dx) || !Number.isFinite(dEnd)) {
                    return;
                }
                const dWidth = Math.max(4, dEnd - dx);

                const domainName = domain.name || domain.pfamId || '';
                const maxChars = Math.floor(dWidth / 6);
                const label =
                    domainName.length > maxChars && maxChars > 3
                        ? domainName.substring(0, maxChars - 1) + '\u2026'
                        : maxChars <= 3
                        ? ''
                        : domainName;

                const identity = domain.pfamId || domain.name || 'unknown';
                const occ = occurrence.get(identity) ?? 0;
                occurrence.set(identity, occ + 1);

                slots.push({
                    key: `${side}-${identity}-${occ}`,
                    side,
                    x: dx,
                    width: dWidth,
                    label,
                    fill,
                    stroke,
                    domain,
                });
            });
        };
        pushSlots(domains5p, '5p', COLOR_5PRIME);
        pushSlots(domains3p, '3p', COLOR_3PRIME);
    }

    const boundaryX = protLen5p > 0 && protLen3p > 0 ? aaToSvgX(0, true) : null;

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
            const prev = prevSlots.get(slot.key);

            if (!prev) {
                // New domain (not present in previous transcript) — fade in.
                if (rect) {
                    gsap.killTweensOf(rect);
                    gsap.fromTo(
                        rect,
                        { opacity: 0 },
                        { opacity: 1, duration: FADE_DURATION }
                    );
                }
                if (label) {
                    gsap.killTweensOf(label);
                    gsap.fromTo(
                        label,
                        { opacity: 0 },
                        { opacity: 1, duration: FADE_DURATION }
                    );
                }
                return;
            }

            const dx = Math.abs(prev.x - slot.x);
            const dw = Math.abs(prev.width - slot.width);
            if (dx < POS_EPSILON && dw < POS_EPSILON) {
                // Same domain, barely moved — skip animation to avoid wobble.
                return;
            }

            if (rect) {
                gsap.killTweensOf(rect);
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
                gsap.killTweensOf(label);
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
    if (domains5p.length === 0 && domains3p.length === 0) return null;
    if (totalAA === 0) return null;

    return (
        <g>
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
            {slots.map(slot => (
                <DomainTooltip key={slot.key} domain={slot.domain}>
                    <g>
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
                        {slot.label && (
                            <text
                                ref={(el: SVGTextElement | null) => {
                                    if (el) labelRefs.current.set(slot.key, el);
                                    else labelRefs.current.delete(slot.key);
                                }}
                                x={slot.x + slot.width / 2}
                                y={trackY + DOMAIN_HEIGHT / 2 + 3}
                                textAnchor="middle"
                                fontSize={8}
                                fill="#333"
                                pointerEvents="none"
                            >
                                {slot.label}
                            </text>
                        )}
                    </g>
                </DomainTooltip>
            ))}
        </g>
    );
};
