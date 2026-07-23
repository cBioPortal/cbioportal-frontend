import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { FusionEvent } from '../data/types';
import { GenomeBuild } from '../data/genomeNexusTranscriptService';
import {
    CHROM_LABELS,
    chromosomeLengths,
    chromIndex,
    angleFor,
    polar,
    sectorArcPath,
    chordPath,
    svIdiomColor,
} from '../data/circosGeometry';

export interface FusionCircosProps {
    fusions: FusionEvent[];
    selectedFusionId: string;
    genomeBuild: GenomeBuild;
    onSelectFusion: (id: string) => void;
    size?: number;
}

const GAP_DEG = 1.5;
const RING_STROKE = '#ccc';
const SELECTED_OPACITY = 1;
const DIMMED_OPACITY = 0.25;
const SELECTED_STROKE_WIDTH = 2;
const DIMMED_STROKE_WIDTH = 1;

interface Breakpoint {
    chromIdx: number;
    angle: number;
}

function breakpointFor(
    chromosome: string,
    position: number,
    lengths: number[]
): Breakpoint | null {
    const idx = chromIndex(chromosome);
    if (idx === -1) {
        return null;
    }
    return { chromIdx: idx, angle: angleFor(idx, position, lengths, GAP_DEG) };
}

export function FusionCircos(props: FusionCircosProps) {
    const { fusions, selectedFusionId, genomeBuild, onSelectFusion } = props;
    const size = props.size || 180;
    const cx = size / 2;
    const cy = size / 2;
    const ringRadius = size / 2 - 14; // leave room for labels
    const chordRadius = ringRadius - 4;

    const [hoveredId, setHoveredId] = React.useState<string | null>(null);

    const lengths = chromosomeLengths(genomeBuild);

    // Ring sectors (1..24)
    const sectors = [];
    for (let i = 1; i <= 24; i++) {
        const start = angleFor(i, 0, lengths, GAP_DEG);
        const end = angleFor(i, lengths[i], lengths, GAP_DEG);
        const mid = (start + end) / 2;
        const labelPos = polar(mid, ringRadius + 8, cx, cy);
        sectors.push(
            <g key={`sector-${i}`}>
                <path
                    d={sectorArcPath(start, end, ringRadius, cx, cy)}
                    stroke={RING_STROKE}
                    strokeWidth={3}
                    fill="none"
                />
                <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fontSize={7}
                    textAnchor="middle"
                    fill="#888"
                >
                    {CHROM_LABELS[i]}
                </text>
            </g>
        );
    }

    // Arcs: build mappable list, draw non-selected first, selected/hovered last.
    const mappable = fusions
        .map(fusion => {
            if (!fusion.gene2) {
                return null;
            }
            const bp1 = breakpointFor(
                fusion.gene1.chromosome,
                fusion.gene1.position,
                lengths
            );
            const bp2 = breakpointFor(
                fusion.gene2.chromosome,
                fusion.gene2.position,
                lengths
            );
            if (!bp1 || !bp2) {
                return null;
            }
            return { fusion, bp1, bp2 };
        })
        .filter(
            (
                entry
            ): entry is {
                fusion: FusionEvent;
                bp1: Breakpoint;
                bp2: Breakpoint;
            } => entry !== null
        );

    const isActive = (id: string) =>
        id === selectedFusionId || id === hoveredId;

    const ordered = [
        ...mappable.filter(e => !isActive(e.fusion.id)),
        ...mappable.filter(e => isActive(e.fusion.id)),
    ];

    const arcs = ordered.map(({ fusion, bp1, bp2 }) => {
        const active = isActive(fusion.id);
        const gene2Symbol = fusion.gene2 ? fusion.gene2.symbol : 'IGR';
        const overlay = (
            <div style={{ maxWidth: 240 }}>
                <div>
                    {fusion.gene1.symbol}::{gene2Symbol}
                </div>
                <div>
                    chr{fusion.gene1.chromosome}:
                    {fusion.gene1.position.toLocaleString()} {'→'} chr
                    {fusion.gene2!.chromosome}:
                    {fusion.gene2!.position.toLocaleString()}
                </div>
                <div>{fusion.svIdiom}</div>
            </div>
        );

        return (
            <DefaultTooltip key={fusion.id} placement="top" overlay={overlay}>
                <path
                    data-testid="circos-arc"
                    data-fusion-id={fusion.id}
                    d={chordPath(bp1.angle, bp2.angle, chordRadius, cx, cy)}
                    stroke={svIdiomColor(fusion.svIdiom)}
                    strokeOpacity={active ? SELECTED_OPACITY : DIMMED_OPACITY}
                    strokeWidth={
                        active ? SELECTED_STROKE_WIDTH : DIMMED_STROKE_WIDTH
                    }
                    fill="none"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredId(fusion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectFusion(fusion.id)}
                />
            </DefaultTooltip>
        );
    });

    // Breakpoint dots for the selected fusion.
    const selectedEntry = mappable.find(e => e.fusion.id === selectedFusionId);
    const dots = selectedEntry
        ? [selectedEntry.bp1, selectedEntry.bp2].map((bp, i) => {
              const p = polar(bp.angle, chordRadius, cx, cy);
              return (
                  <circle
                      key={`dot-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={2.5}
                      fill={svIdiomColor(selectedEntry.fusion.svIdiom)}
                  />
              );
          })
        : null;

    return (
        <svg width={size} height={size}>
            {sectors}
            {arcs}
            {dots}
        </svg>
    );
}
