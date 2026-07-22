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
    computeGeneTrackRange,
    applyUpstreamExtension,
} from './components/GeneTrack';
import {
    FusionProduct,
    getFusionProductHeight,
    computeJunctionX,
} from './components/FusionProduct';
import {
    select5PrimeExons,
    select3PrimeExons,
    detectPromoterSwap,
    resolveProductBreakpoints,
} from './components/fusionProductHelpers';
import { shouldRenderChimericProtein } from './data/svClassification';
import {
    ProteinDomainTrack,
    getProteinDomainTrackHeight,
} from './components/ProteinDomainTrack';
import { ConnectingArcs } from './components/ConnectingArcs';
import { PromoterSwapTooltip } from './components/ExonTooltip';
import {
    classifyFrameStatus,
    FrameStatus,
    getFrameStatusDisplay,
} from './data/frameStatus';
import { ProductBadgeRow } from './components/ProductBadgeRow';
import { frameProviderForFusion } from './data/frameProvider';
import { resolveCallerState } from './data/productBadges';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const SVG_WIDTH = 1300;
const GENE_TRACK_WIDTH = 580;
const GENE_TRACK_GAP = 80;
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
    /** Currently-active 5' transcript that drives the fusion product + domains. */
    activeTranscript5p: TranscriptData;
    /** Currently-active 3' transcript (omit when gene2 is null). */
    activeTranscript3p?: TranscriptData;
    /** Called when the user clicks a 5' track to activate it. */
    onActivate5p: (transcriptId: string) => void;
    /** Called when the user clicks a 3' track to activate it. */
    onActivate3p: (transcriptId: string) => void;
    /** Whether to render the upstream promoter tint on the 5′ track. Defaults true. */
    showPromoter?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@observer
export class FusionDiagramSVG extends React.Component<FusionDiagramSVGProps> {
    render() {
        const {
            fusion,
            forteTranscript5p,
            forteTranscript3p,
            onActivate5p,
            onActivate3p,
            showPromoter,
        } = this.props;

        // Fall back to FORTE if the active transcript is missing the
        // shape the fusion-product + domain renderers need (exons array).
        const activeTranscript5p =
            this.props.activeTranscript5p &&
            this.props.activeTranscript5p.exons &&
            this.props.activeTranscript5p.exons.length > 0
                ? this.props.activeTranscript5p
                : forteTranscript5p;
        const activeTranscript3p =
            this.props.activeTranscript3p &&
            this.props.activeTranscript3p.exons &&
            this.props.activeTranscript3p.exons.length > 0
                ? this.props.activeTranscript3p
                : forteTranscript3p;

        const active5pId = activeTranscript5p.transcriptId;
        const active3pId = activeTranscript3p
            ? activeTranscript3p.transcriptId
            : '';
        const productFrameDisplay = getFrameStatusDisplay(
            frameProviderForFusion(fusion).getFrame(active5pId, active3pId) ??
                FrameStatus.Unknown
        );
        const productCallerState = resolveCallerState(
            fusion,
            active5pId,
            active3pId
        );

        const userTranscripts5p = this.props.userTranscripts5p || [];
        const userTranscripts3p = this.props.userTranscripts3p || [];

        const { gene1, gene2 } = fusion;

        // Effective breakpoints for ALL breakpoint-driven rendering (gene-track
        // retained-shading + breakpoint line, connecting arcs, junction, and the
        // product/domain exon selection). Routing the SAME values to every
        // consumer keeps the gene tracks consistent with the product. The
        // strand/idiom-aware 5′/3′ assignment (esp. minus-strand intragenic
        // del/dup) lives in resolveProductBreakpoints — see its JSDoc.
        const {
            breakpoint5p: productBp5,
            breakpoint3p: productBp3,
        } = resolveProductBreakpoints(
            fusion.svIdiom,
            forteTranscript5p.strand,
            gene1.position,
            gene2 ? gene2.position : undefined
        );

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

        // ---- Compute retained exon number sets for gene track highlighting ----
        // Sorted by exon.number (biological order) before calling the helpers.
        // The helpers filter by genomic position so sort order doesn't affect
        // which exons are selected, but consistent order avoids confusion.
        const retained5pNums = new Set(
            select5PrimeExons(
                [...forteTranscript5p.exons].sort(
                    (a, b) => a.number - b.number
                ),
                productBp5,
                forteTranscript5p.strand
            ).map(e => e.number)
        );

        const retained3pNums =
            gene2 && forteTranscript3p && productBp3 !== undefined
                ? new Set(
                      select3PrimeExons(
                          [...forteTranscript3p.exons].sort(
                              (a, b) => a.number - b.number
                          ),
                          productBp3,
                          forteTranscript3p.strand
                      ).map(e => e.number)
                  )
                : undefined;

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
            (activeTranscript5p.domains &&
                activeTranscript5p.domains.length > 0) ||
            (activeTranscript3p &&
                activeTranscript3p.domains &&
                activeTranscript3p.domains.length > 0);
        const domainTrackHeight = hasDomains
            ? getProteinDomainTrackHeight()
            : 0;

        // Whether a credible chimeric protein product exists for this SV: gated
        // on SV type only (fusion-shaped idioms). Frame is intentionally NOT a
        // gate here — the caller's `site2EffectOnFrame` annotation is tied to one
        // upstream transcript and isn't recomputed for the selected transcript,
        // so it can't be confirmed per displayed transcript. The junction glyph
        // still shows the annotated frame (with that caveat in its tooltip).
        // Gates the protein + domain render and the promoter-swap badge.
        // See data/svClassification.ts.
        const renderChimeric = shouldRenderChimericProtein(fusion.svIdiom);

        // ---- Promoter-swap detection ----
        // True when the 5′ partner contributes promoter/5′UTR only (no coding)
        // AND the 3′ partner supplies coding, so the product's ORF is the 3′
        // gene's, driven by the 5′ promoter. The swap band/badge is part of the
        // promoter annotation, so it respects the `showPromoter` toggle — hiding
        // the promoter track hides the swap chrome (and its reserved band) too.
        const isPromoterSwap =
            showPromoter !== false &&
            !!gene2 &&
            !!forteTranscript3p &&
            // A promoter swap is itself a chimeric-protein claim, so it must
            // respect the SV-type gate: no swap badge for non-fusion idioms
            // (intragenic / IGR / insertion), even when the breakpoint geometry
            // alone would say "swap".
            renderChimeric &&
            detectPromoterSwap({
                transcript5p: activeTranscript5p,
                breakpoint5p: gene1.position,
                siteDescription5p: gene1.siteDescription,
                transcript3p: activeTranscript3p,
                breakpoint3p: gene2.position,
                siteDescription3p: gene2.siteDescription,
            });
        const SWAP_BAND_H = 30;
        const swapBand = isPromoterSwap ? SWAP_BAND_H : 0;

        const totalHeight =
            TOP_MARGIN +
            swapBand +
            geneTrackHeight +
            arcGap +
            fusionProductHeight +
            (hasDomains ? SECTION_GAP + domainTrackHeight : 0) +
            10;

        // ---- Layout positions ----
        const geneTrackY = TOP_MARGIN + swapBand;
        const gene5pX = SVG_WIDTH / 2 - GENE_TRACK_GAP / 2 - GENE_TRACK_WIDTH;
        const gene3pX = SVG_WIDTH / 2 + GENE_TRACK_GAP / 2;

        const geneTrackBottomY = geneTrackY + geneTrackHeight;
        const fusionProductY = geneTrackBottomY + arcGap;
        const fusionProductX = 40;
        const fusionProductWidth = SVG_WIDTH - 80;

        const domainTrackY = fusionProductY + fusionProductHeight + SECTION_GAP;

        // ---- Compute breakpoint x positions ----
        // Must use the SAME combined exon set AND the same upstream extension
        // that GeneTrack uses so the arc origin lines up with the breakpoint
        // line regardless of which transcript is the active driver.
        const computeBreakpointX = (
            forteTranscript: TranscriptData,
            userTranscripts: TranscriptData[],
            breakpointPos: number,
            trackX: number,
            trackWidth: number,
            strand: '+' | '-'
        ): number => {
            const allExons = [
                ...forteTranscript.exons,
                ...userTranscripts.flatMap(t => t.exons),
            ];
            const { gMin: gMinBase, gMax: gMaxBase } = computeGeneTrackRange(
                allExons,
                breakpointPos
            );
            const { gMin, gMax } = applyUpstreamExtension(
                gMinBase,
                gMaxBase,
                strand,
                allExons
            );
            const padding = 10;
            // Pass strand so the breakpoint mirrors in lockstep with GeneTrack's
            // toSvg — otherwise the arc origin would diverge from the dashed
            // breakpoint line on minus-strand genes.
            return genomicToSvgX(
                breakpointPos,
                gMin,
                gMax,
                trackX + padding,
                trackWidth - padding * 2,
                strand
            );
        };

        const bp5pX = computeBreakpointX(
            forteTranscript5p,
            has5pUser ? filtered5p : [],
            productBp5,
            gene5pX,
            GENE_TRACK_WIDTH,
            forteTranscript5p.strand
        );

        const bp3pX =
            gene2 && forteTranscript3p && productBp3 !== undefined
                ? computeBreakpointX(
                      forteTranscript3p,
                      has3pUser ? filtered3p : [],
                      productBp3,
                      gene3pX,
                      GENE_TRACK_WIDTH,
                      forteTranscript3p.strand
                  )
                : gene3pX + GENE_TRACK_WIDTH / 2;

        const junctionX = computeJunctionX(
            { ...gene1, position: productBp5 },
            gene2 && productBp3 !== undefined
                ? { ...gene2, position: productBp3 }
                : gene2,
            activeTranscript5p,
            activeTranscript3p,
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
                    position={productBp5}
                    strand={forteTranscript5p.strand}
                    siteDescription={gene1.siteDescription}
                    forteTranscript={forteTranscript5p}
                    userTranscripts={has5pUser ? filtered5p : undefined}
                    color={COLOR_5PRIME}
                    x={gene5pX}
                    y={geneTrackY}
                    width={GENE_TRACK_WIDTH}
                    is5Prime={true}
                    trackHeight={geneTrackHeight}
                    retainedExonNumbers={retained5pNums}
                    activeTranscriptId={activeTranscript5p.transcriptId}
                    onActivateTranscript={onActivate5p}
                    showPromoter={showPromoter}
                />

                {/* 3-prime gene track or intergenic placeholder */}
                {gene2 && forteTranscript3p ? (
                    <GeneTrack
                        symbol={gene2.symbol}
                        chromosome={gene2.chromosome}
                        position={
                            productBp3 !== undefined
                                ? productBp3
                                : gene2.position
                        }
                        strand={forteTranscript3p.strand}
                        siteDescription={gene2.siteDescription}
                        forteTranscript={forteTranscript3p}
                        userTranscripts={has3pUser ? filtered3p : undefined}
                        color={COLOR_3PRIME}
                        x={gene3pX}
                        y={geneTrackY}
                        width={GENE_TRACK_WIDTH}
                        is5Prime={false}
                        trackHeight={geneTrackHeight}
                        retainedExonNumbers={retained3pNums}
                        activeTranscriptId={
                            activeTranscript3p
                                ? activeTranscript3p.transcriptId
                                : ''
                        }
                        onActivateTranscript={onActivate3p}
                        showPromoter={showPromoter}
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

                {/* Promoter-swap annotation: arc from the 5′ promoter to the
                    3′ gene, indicating the 3′ ORF is driven by the 5′ promoter. */}
                {isPromoterSwap &&
                    (() => {
                        const promoterX = gene5pX + 24;
                        const targetX = gene3pX + 24;
                        const baseY = geneTrackY;
                        const apexY = TOP_MARGIN + 6;
                        const midX = (promoterX + targetX) / 2;
                        const C = '#b45309';
                        const arc = `M ${promoterX} ${baseY} C ${promoterX} ${apexY}, ${targetX} ${apexY}, ${targetX} ${baseY}`;
                        return (
                            <g>
                                <path
                                    d={arc}
                                    fill="none"
                                    stroke={C}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    pointerEvents="none"
                                />
                                <polygon
                                    points={`${targetX - 4},${baseY -
                                        7} ${targetX + 4},${baseY -
                                        7} ${targetX},${baseY}`}
                                    fill={C}
                                    pointerEvents="none"
                                />
                                <PromoterSwapTooltip
                                    gene5p={gene1.symbol}
                                    gene3p={gene2 ? gene2.symbol : ''}
                                    chromosome={gene1.chromosome}
                                    position={gene1.position}
                                >
                                    <g style={{ cursor: 'help' }}>
                                        <rect
                                            x={midX - 60}
                                            y={apexY - 8}
                                            width={120}
                                            height={15}
                                            rx={7}
                                            fill="#fff7ed"
                                            stroke={C}
                                            strokeWidth={1}
                                        />
                                        <text
                                            x={midX}
                                            y={apexY + 3}
                                            textAnchor="middle"
                                            fontSize={9}
                                            fontWeight={700}
                                            fill={C}
                                        >
                                            PROMOTER SWAP ▶
                                        </text>
                                    </g>
                                </PromoterSwapTooltip>
                            </g>
                        );
                    })()}

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

                <foreignObject
                    x={fusionProductX}
                    y={fusionProductY - 24}
                    width={fusionProductWidth}
                    height={24}
                >
                    <ProductBadgeRow
                        frame={productFrameDisplay}
                        callerState={productCallerState}
                    />
                </foreignObject>

                {/* Fusion product — only when a credible chimeric ORF exists.
                    Otherwise a greyed caveat strip holds the same Y so the
                    layout stays stable (idiom-specific copy lives in the
                    SvCaveatBanner above the SVG). */}
                {renderChimeric ? (
                    <FusionProduct
                        gene1={gene1}
                        gene2={gene2}
                        forteTranscript5p={activeTranscript5p}
                        forteTranscript3p={activeTranscript3p}
                        note={fusion.note}
                        x={fusionProductX}
                        y={fusionProductY}
                        width={fusionProductWidth}
                        frameStatus={classifyFrameStatus(
                            fusion.frameCallMethod
                        )}
                        breakpoint5p={productBp5}
                        breakpoint3p={productBp3}
                    />
                ) : (
                    <g data-testid="no-chimeric-orf-strip">
                        <rect
                            x={fusionProductX}
                            y={fusionProductY}
                            width={fusionProductWidth}
                            height={fusionProductHeight}
                            rx={4}
                            fill="#f5f5f5"
                            stroke="#ddd"
                            strokeDasharray="4 3"
                        />
                        <text
                            x={fusionProductX + fusionProductWidth / 2}
                            y={fusionProductY + fusionProductHeight / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={12}
                            fontStyle="italic"
                            fill="#999"
                        >
                            No protein product shown (intragenic inversion, IGR,
                            or insertion)
                        </text>
                    </g>
                )}

                {/* Protein domain track */}
                {hasDomains && renderChimeric && (
                    <ProteinDomainTrack
                        forteTranscript5p={activeTranscript5p}
                        forteTranscript3p={activeTranscript3p}
                        breakpoint5p={productBp5}
                        breakpoint3p={productBp3}
                        x={fusionProductX}
                        y={domainTrackY}
                        width={fusionProductWidth}
                    />
                )}
            </svg>
        );
    }
}
