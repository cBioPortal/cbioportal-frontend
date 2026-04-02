import * as React from 'react';
import { observer } from 'mobx-react';
import {
    FusionEvent,
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
} from './data/types';
import {
    GeneTrack,
    getGeneTrackHeight,
    genomicToSvgX,
} from './components/GeneTrack';
import {
    FusionProduct,
    getFusionProductHeight,
    computeJunctionX,
} from './components/FusionProduct';
import {
    ProteinDomainTrack,
    getProteinDomainTrackHeight,
} from './components/ProteinDomainTrack';
import { ConnectingArcs } from './components/ConnectingArcs';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const SVG_WIDTH = 900;
const GENE_TRACK_WIDTH = 420;
const GENE_TRACK_GAP = 60;
const SECTION_GAP = 16;
const TOP_MARGIN = 10;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface FusionDiagramSVGProps {
    fusion: FusionEvent;
    forteTranscript5p: TranscriptData;
    forteTranscript3p?: TranscriptData;
    /** Multiple user-selected transcripts for 5' gene */
    userTranscripts5p?: TranscriptData[];
    /** Multiple user-selected transcripts for 3' gene */
    userTranscripts3p?: TranscriptData[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@observer
export class FusionDiagramSVG extends React.Component<FusionDiagramSVGProps> {
    render() {
        const { fusion, forteTranscript5p, forteTranscript3p } = this.props;

        const userTranscripts5p = this.props.userTranscripts5p || [];
        const userTranscripts3p = this.props.userTranscripts3p || [];

        const { gene1, gene2 } = fusion;

        // Filter out user transcripts that match the FORTE transcript
        const filtered5p = userTranscripts5p.filter(
            t => t.transcriptId !== forteTranscript5p.transcriptId
        );
        const filtered3p = forteTranscript3p
            ? userTranscripts3p.filter(
                  t => t.transcriptId !== forteTranscript3p.transcriptId
              )
            : [];

        const has5pUser = filtered5p.length > 0;
        const has3pUser = filtered3p.length > 0;

        // ---- Calculate heights ----
        const geneTrackHeight5p = getGeneTrackHeight(
            has5pUser,
            filtered5p.length
        );
        const geneTrackHeight3p = gene2
            ? getGeneTrackHeight(has3pUser, filtered3p.length)
            : geneTrackHeight5p;
        const geneTrackHeight = Math.max(geneTrackHeight5p, geneTrackHeight3p);

        const arcGap = 40;
        const fusionProductHeight = getFusionProductHeight();

        const hasDomains =
            (forteTranscript5p.domains &&
                forteTranscript5p.domains.length > 0) ||
            (forteTranscript3p &&
                forteTranscript3p.domains &&
                forteTranscript3p.domains.length > 0);
        const domainTrackHeight = hasDomains
            ? getProteinDomainTrackHeight()
            : 0;

        const totalHeight =
            TOP_MARGIN +
            geneTrackHeight +
            arcGap +
            fusionProductHeight +
            (hasDomains ? SECTION_GAP + domainTrackHeight : 0) +
            10;

        // ---- Layout positions ----
        const geneTrackY = TOP_MARGIN;
        const gene5pX = SVG_WIDTH / 2 - GENE_TRACK_GAP / 2 - GENE_TRACK_WIDTH;
        const gene3pX = SVG_WIDTH / 2 + GENE_TRACK_GAP / 2;

        const geneTrackBottomY = geneTrackY + geneTrackHeight;
        const fusionProductY = geneTrackBottomY + arcGap;
        const fusionProductX = 40;
        const fusionProductWidth = SVG_WIDTH - 80;

        const domainTrackY = fusionProductY + fusionProductHeight + SECTION_GAP;

        // ---- Compute breakpoint x positions ----
        const computeBreakpointX = (
            transcript: TranscriptData,
            breakpointPos: number,
            trackX: number,
            trackWidth: number
        ): number => {
            const allExons = transcript.exons;
            const allStarts = allExons.map(e => e.start);
            const allEnds = allExons.map(e => e.end);
            const padBp = Math.max(
                1,
                Math.round(
                    (Math.max(...allEnds, breakpointPos) -
                        Math.min(...allStarts, breakpointPos)) *
                        0.03
                )
            );
            const gMin = Math.min(...allStarts, breakpointPos) - padBp;
            const gMax = Math.max(...allEnds, breakpointPos) + padBp;
            const padding = 10;
            return genomicToSvgX(
                breakpointPos,
                gMin,
                gMax,
                trackX + padding,
                trackWidth - padding * 2
            );
        };

        const bp5pX = computeBreakpointX(
            forteTranscript5p,
            gene1.position,
            gene5pX,
            GENE_TRACK_WIDTH
        );

        const bp3pX =
            gene2 && forteTranscript3p
                ? computeBreakpointX(
                      forteTranscript3p,
                      gene2.position,
                      gene3pX,
                      GENE_TRACK_WIDTH
                  )
                : gene3pX + GENE_TRACK_WIDTH / 2;

        const junctionX = computeJunctionX(
            gene1,
            gene2,
            forteTranscript5p,
            forteTranscript3p,
            fusionProductX,
            fusionProductWidth
        );

        return (
            <svg
                width="100%"
                viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
                preserveAspectRatio="xMidYMin meet"
                style={{
                    maxWidth: SVG_WIDTH,
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                {/* 5-prime gene track */}
                <GeneTrack
                    symbol={gene1.symbol}
                    chromosome={gene1.chromosome}
                    position={gene1.position}
                    strand={gene1.strand}
                    siteDescription={gene1.siteDescription}
                    forteTranscript={forteTranscript5p}
                    userTranscripts={has5pUser ? filtered5p : undefined}
                    color={COLOR_5PRIME}
                    x={gene5pX}
                    y={geneTrackY}
                    width={GENE_TRACK_WIDTH}
                    is5Prime={true}
                    trackHeight={geneTrackHeight}
                />

                {/* 3-prime gene track or intergenic placeholder */}
                {gene2 && forteTranscript3p ? (
                    <GeneTrack
                        symbol={gene2.symbol}
                        chromosome={gene2.chromosome}
                        position={gene2.position}
                        strand={gene2.strand}
                        siteDescription={gene2.siteDescription}
                        forteTranscript={forteTranscript3p}
                        userTranscripts={has3pUser ? filtered3p : undefined}
                        color={COLOR_3PRIME}
                        x={gene3pX}
                        y={geneTrackY}
                        width={GENE_TRACK_WIDTH}
                        is5Prime={false}
                        trackHeight={geneTrackHeight}
                    />
                ) : (
                    <g>
                        <rect
                            x={gene3pX}
                            y={geneTrackY}
                            width={GENE_TRACK_WIDTH}
                            height={geneTrackHeight}
                            fill="none"
                            stroke="#ddd"
                            strokeDasharray="4 4"
                            rx={4}
                        />
                        <text
                            x={gene3pX + GENE_TRACK_WIDTH / 2}
                            y={geneTrackY + geneTrackHeight / 2 + 4}
                            textAnchor="middle"
                            fontSize={12}
                            fill="#bbb"
                            fontStyle="italic"
                        >
                            Intergenic
                        </text>
                    </g>
                )}

                {/* Connecting arcs */}
                {gene2 && forteTranscript3p && (
                    <ConnectingArcs
                        breakpoint5pX={bp5pX}
                        breakpoint3pX={bp3pX}
                        geneTrackBottomY={geneTrackBottomY}
                        fusionProductTopY={fusionProductY}
                        fusionJunctionX={junctionX}
                    />
                )}

                {/* Fusion product */}
                <FusionProduct
                    gene1={gene1}
                    gene2={gene2}
                    forteTranscript5p={forteTranscript5p}
                    forteTranscript3p={forteTranscript3p}
                    note={fusion.note}
                    x={fusionProductX}
                    y={fusionProductY}
                    width={fusionProductWidth}
                />

                {/* Protein domain track */}
                {hasDomains && (
                    <ProteinDomainTrack
                        forteTranscript5p={forteTranscript5p}
                        forteTranscript3p={forteTranscript3p}
                        x={fusionProductX}
                        y={domainTrackY}
                        width={fusionProductWidth}
                    />
                )}
            </svg>
        );
    }
}
