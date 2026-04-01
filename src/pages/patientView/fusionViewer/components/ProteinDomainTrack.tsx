import * as React from 'react';
import {
    ProteinDomain,
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
} from '../data/types';
import { DomainTooltip } from './ExonTooltip';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DOMAIN_HEIGHT = 16;
const DOMAIN_GAP = 3;
const LABEL_HEIGHT = 16;
const PADDING_TOP = 4;
const BACKBONE_HEIGHT = 4;

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
    /** SVG x origin */
    x: number;
    /** SVG y origin */
    y: number;
    /** Available width */
    width: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ProteinDomainTrack: React.FC<ProteinDomainTrackProps> = ({
    forteTranscript5p,
    forteTranscript3p,
    x,
    y,
    width,
}) => {
    const domains5p = forteTranscript5p.domains || [];
    const domains3p = forteTranscript3p ? forteTranscript3p.domains || [] : [];

    if (domains5p.length === 0 && domains3p.length === 0) {
        return null;
    }

    // ---- Build a combined AA coordinate space ----
    // Protein length from each transcript
    const protLen5p = forteTranscript5p.proteinLength || 0;
    const protLen3p =
        forteTranscript3p && forteTranscript3p.proteinLength
            ? forteTranscript3p.proteinLength
            : 0;
    const totalAA = protLen5p + protLen3p;

    if (totalAA === 0) return null;

    const drawPadding = 10;
    const drawX = x + drawPadding;
    const drawWidth = width - drawPadding * 2;

    const aaToSvgX = (aa: number, is3p: boolean): number => {
        const offset = is3p ? protLen5p : 0;
        return drawX + ((offset + aa) / totalAA) * drawWidth;
    };

    const trackY = y + PADDING_TOP + LABEL_HEIGHT;

    const elements: React.ReactNode[] = [];

    // ---- Section label ----
    elements.push(
        <text
            key="domain-label"
            x={drawX}
            y={y + PADDING_TOP + 11}
            fontSize={10}
            fontWeight="bold"
            fill="#555"
        >
            Protein Domains
        </text>
    );

    // ---- Backbone line ----
    elements.push(
        <rect
            key="backbone"
            x={drawX}
            y={trackY + DOMAIN_HEIGHT / 2 - BACKBONE_HEIGHT / 2}
            width={drawWidth}
            height={BACKBONE_HEIGHT}
            fill="#e0e0e0"
            rx={2}
        />
    );

    // ---- Boundary between 5p and 3p proteins ----
    if (protLen5p > 0 && protLen3p > 0) {
        const boundaryX = aaToSvgX(0, true);
        elements.push(
            <line
                key="protein-boundary"
                x1={boundaryX}
                y1={trackY - 2}
                x2={boundaryX}
                y2={trackY + DOMAIN_HEIGHT + 2}
                stroke="#ccc"
                strokeWidth={1}
                strokeDasharray="3 2"
            />
        );
    }

    // ---- Render domains ----
    const renderDomains = (
        domains: ProteinDomain[],
        colorBase: string,
        is3p: boolean
    ) => {
        const fill = lightenColor(colorBase, 0.4);
        const stroke = colorBase;

        domains.forEach((domain, i) => {
            const dx = aaToSvgX(domain.startAA, is3p);
            const dEnd = aaToSvgX(domain.endAA, is3p);
            const dWidth = Math.max(4, dEnd - dx);

            const key = `domain-${is3p ? '3p' : '5p'}-${i}`;

            // Truncate label if domain is too narrow
            const maxChars = Math.floor(dWidth / 6);
            const label =
                domain.name.length > maxChars && maxChars > 3
                    ? domain.name.substring(0, maxChars - 1) + '\u2026'
                    : maxChars <= 3
                    ? ''
                    : domain.name;

            elements.push(
                <DomainTooltip key={`tt-${key}`} domain={domain}>
                    <g>
                        <rect
                            x={dx}
                            y={trackY}
                            width={dWidth}
                            height={DOMAIN_HEIGHT}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={1}
                            rx={4}
                            ry={4}
                        />
                        {label && (
                            <text
                                x={dx + dWidth / 2}
                                y={trackY + DOMAIN_HEIGHT / 2 + 3}
                                textAnchor="middle"
                                fontSize={8}
                                fill="#333"
                                pointerEvents="none"
                            >
                                {label}
                            </text>
                        )}
                    </g>
                </DomainTooltip>
            );
        });
    };

    renderDomains(domains5p, COLOR_5PRIME, false);
    renderDomains(domains3p, COLOR_3PRIME, true);

    return <g>{elements}</g>;
};
