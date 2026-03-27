import * as React from 'react';
import {
    DefaultTooltip,
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    MrnaExprRankCacheDataType,
    default as MrnaExprRankCache,
} from 'shared/cache/MrnaExprRankCache';
import {
    Mutation,
    DiscreteCopyNumberData,
    NumericGeneMolecularData,
} from 'cbioportal-ts-api-client';
import GeneMolecularDataCache from 'shared/cache/GeneMolecularDataCache';

export default class MrnaExprColumnFormatter {
    protected static getCircleX(
        percentile: number,
        circleLeft: number,
        circleRight: number
    ) {
        const proportion = percentile / 100;
        return circleLeft * (1 - proportion) + circleRight * proportion;
    }

    protected static getCircleFill(percentile: number) {
        if (percentile < 25) {
            return 'blue';
        } else if (percentile > 75) {
            return 'red';
        } else {
            return 'gray';
        }
    }

    // Renders a histogram of actual RSEM/TPM expression values across all samples,
    // with the current sample's value marked by a red dashed line.
    private static getExpressionHistogram(
        allData: NumericGeneMolecularData[],
        currentSampleId: string
    ) {
        const values = allData.map(d => d.value).filter(v => isFinite(v));
        if (values.length === 0) return null;

        const svgWidth = 160;
        const svgHeight = 50;
        const padLeft = 10;
        const padRight = 10;
        const padTop = 4;
        const padBottom = 16;
        const plotWidth = svgWidth - padLeft - padRight;
        const plotHeight = svgHeight - padTop - padBottom;
        const axisY = padTop + plotHeight;

        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        // When all values are identical, the histogram is trivial (one full-height bar)
        if (minVal === maxVal) return null;

        const valRange = maxVal - minVal;
        const numBins = 20;
        const binWidth = valRange / numBins;
        const bins = new Array(numBins).fill(0);
        for (const v of values) {
            const idx = Math.min(
                Math.floor((v - minVal) / binWidth),
                numBins - 1
            );
            bins[idx]++;
        }
        const maxCount = Math.max(...bins);

        const toSvgX = (v: number) =>
            padLeft + ((v - minVal) / valRange) * plotWidth;
        const svgBarWidth = plotWidth / numBins;

        const currentSample = allData.find(
            d => d.sampleId === currentSampleId
        );
        const currentValue = currentSample?.value;
        const markerX =
            currentValue !== undefined && isFinite(currentValue)
                ? toSvgX(Math.max(minVal, Math.min(maxVal, currentValue)))
                : null;

        // Thresholds for compact axis label formatting
        const KILO_THRESHOLD = 10000; // values >= 10000 shown as "Xk"
        const KILO_DECIMAL_THRESHOLD = 1000; // values >= 1000 shown as "X.Xk"
        const TINY_THRESHOLD = 0.01; // values < 0.01 shown in scientific notation

        const formatAxisVal = (v: number) => {
            if (v === 0) return '0';
            const abs = Math.abs(v);
            if (abs >= KILO_THRESHOLD) return `${(v / 1000).toFixed(0)}k`;
            if (abs >= KILO_DECIMAL_THRESHOLD)
                return `${(v / 1000).toFixed(1)}k`;
            if (abs < TINY_THRESHOLD) return v.toExponential(0);
            return v.toFixed(abs < 1 ? 2 : 0);
        };

        return (
            <div style={{ margin: '5px 0' }}>
                <svg width={svgWidth} height={svgHeight}>
                    {/* Histogram bars */}
                    {bins.map((count, i) => {
                        const x = padLeft + i * svgBarWidth;
                        const barH =
                            maxCount > 0
                                ? (count / maxCount) * plotHeight
                                : 0;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={axisY - barH}
                                width={Math.max(svgBarWidth - 0.5, 0.5)}
                                height={barH}
                                fill="#aaccee"
                                stroke="#5588bb"
                                strokeWidth={0.5}
                            />
                        );
                    })}
                    {/* Axis line */}
                    <line
                        x1={padLeft}
                        y1={axisY}
                        x2={svgWidth - padRight}
                        y2={axisY}
                        stroke="#999"
                        strokeWidth={1}
                    />
                    {/* Min/max axis labels */}
                    <text
                        x={padLeft}
                        y={axisY + 11}
                        textAnchor="start"
                        fontSize={7}
                        fill="#666"
                    >
                        {formatAxisVal(minVal)}
                    </text>
                    <text
                        x={svgWidth - padRight}
                        y={axisY + 11}
                        textAnchor="end"
                        fontSize={7}
                        fill="#666"
                    >
                        {formatAxisVal(maxVal)}
                    </text>
                    {/* Marker line for current sample */}
                    {markerX !== null && (
                        <line
                            x1={markerX}
                            y1={padTop}
                            x2={markerX}
                            y2={axisY}
                            stroke="#c0392b"
                            strokeWidth={1.5}
                            strokeDasharray="3,2"
                        />
                    )}
                </svg>
            </div>
        );
    }

    // Fallback: renders a theoretical Gaussian bell curve with the sample's z-score marked.
    private static getDistributionChart(zScore: number) {
        const svgWidth = 160;
        const svgHeight = 50;
        const padLeft = 10;
        const padRight = 10;
        const padTop = 4;
        const padBottom = 16;
        const plotWidth = svgWidth - padLeft - padRight;
        const plotHeight = svgHeight - padTop - padBottom;

        // z-score axis spans -3.5 to 3.5
        const zMin = -3.5;
        const zMax = 3.5;
        const zRange = zMax - zMin;

        // Standard normal distribution probability density function (mean=0, std=1)
        const gaussianPdf = (z: number) =>
            Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);

        const maxDensity = gaussianPdf(0); // ≈ 0.3989

        // Map z-score to svg x coordinate
        const toSvgX = (z: number) =>
            padLeft + ((z - zMin) / zRange) * plotWidth;
        // Map density to svg y coordinate (invert: higher density = lower y)
        const toSvgY = (d: number) =>
            padTop + plotHeight - (d / maxDensity) * plotHeight;

        // Number of points used to approximate the smooth Gaussian curve
        const curveResolution = 100;
        const curvePoints: [number, number][] = [];
        for (let i = 0; i <= curveResolution; i++) {
            const z = zMin + (i / curveResolution) * zRange;
            curvePoints.push([toSvgX(z), toSvgY(gaussianPdf(z))]);
        }

        // Build SVG paths for filled area and curve outline separately
        const baseline = padTop + plotHeight;
        const firstX = curvePoints[0][0];
        const lastX = curvePoints[curvePoints.length - 1][0];

        // Outline path (just the curve, no closing)
        let outlineD = `M ${firstX} ${curvePoints[0][1]}`;
        for (let i = 1; i < curvePoints.length; i++) {
            outlineD += ` L ${curvePoints[i][0]} ${curvePoints[i][1]}`;
        }

        // Filled area path (baseline to curve and back to baseline)
        let fillD = `M ${firstX} ${baseline} L ${firstX} ${curvePoints[0][1]}`;
        for (let i = 1; i < curvePoints.length; i++) {
            fillD += ` L ${curvePoints[i][0]} ${curvePoints[i][1]}`;
        }
        fillD += ` L ${lastX} ${baseline} Z`;

        // Clamp z-score to visible range
        const clampedZ = Math.max(zMin, Math.min(zMax, zScore));
        const markerX = toSvgX(clampedZ);
        const markerTopY = padTop;
        const markerBottomY = padTop + plotHeight;

        // Axis tick marks at -2, 0, 2
        const axisTicks = [-2, 0, 2];
        const axisY = padTop + plotHeight;

        const tickLabel = (tick: number) => {
            if (tick === 0) return 'mean';
            return tick > 0 ? `+${tick}\u03c3` : `${tick}\u03c3`;
        };

        return (
            <div style={{ margin: '5px 0' }}>
                <svg width={svgWidth} height={svgHeight}>
                    {/* Bell curve filled area */}
                    <path d={fillD} fill="#aaccee" fillOpacity={0.7} />
                    {/* Bell curve outline */}
                    <path
                        d={outlineD}
                        fill="none"
                        stroke="#5588bb"
                        strokeWidth={1.5}
                    />
                    {/* Axis line */}
                    <line
                        x1={padLeft}
                        y1={axisY}
                        x2={svgWidth - padRight}
                        y2={axisY}
                        stroke="#999"
                        strokeWidth={1}
                    />
                    {/* Axis ticks and labels */}
                    {axisTicks.map(tick => (
                        <g key={tick}>
                            <line
                                x1={toSvgX(tick)}
                                y1={axisY}
                                x2={toSvgX(tick)}
                                y2={axisY + 3}
                                stroke="#999"
                                strokeWidth={1}
                            />
                            <text
                                x={toSvgX(tick)}
                                y={axisY + 11}
                                textAnchor="middle"
                                fontSize={8}
                                fill="#666"
                            >
                                {tickLabel(tick)}
                            </text>
                        </g>
                    ))}
                    {/* Marker line for current sample */}
                    <line
                        x1={markerX}
                        y1={markerTopY}
                        x2={markerX}
                        y2={markerBottomY}
                        stroke="#c0392b"
                        strokeWidth={1.5}
                        strokeDasharray="3,2"
                    />
                    {/* Marker circle */}
                    <circle
                        cx={markerX}
                        cy={toSvgY(gaussianPdf(clampedZ))}
                        r={3.5}
                        fill="#c0392b"
                        stroke="white"
                        strokeWidth={1}
                    />
                </svg>
            </div>
        );
    }

    protected static getTooltipContents(
        cacheDatum: MrnaExprRankCacheDataType | null,
        sampleId?: string,
        entrezGeneId?: number,
        mrnaExprSourceCache?: GeneMolecularDataCache,
        mrnaExprSourceMolecularProfileId?: string
    ) {
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            // Try to get the actual expression distribution from the raw data cache
            let distributionChart: JSX.Element | null = null;
            let rawExprValue: number | undefined;
            if (
                mrnaExprSourceCache &&
                mrnaExprSourceMolecularProfileId &&
                sampleId !== undefined &&
                entrezGeneId !== undefined
            ) {
                const sourceDatum = mrnaExprSourceCache.get({
                    entrezGeneId,
                    molecularProfileId: mrnaExprSourceMolecularProfileId,
                });
                if (
                    sourceDatum &&
                    sourceDatum.status === 'complete' &&
                    sourceDatum.data
                ) {
                    const currentSample = sourceDatum.data.find(
                        d => d.sampleId === sampleId
                    );
                    if (currentSample && isFinite(currentSample.value)) {
                        rawExprValue = currentSample.value;
                    }
                    const histogram =
                        MrnaExprColumnFormatter.getExpressionHistogram(
                            sourceDatum.data,
                            sampleId
                        );
                    if (histogram) {
                        distributionChart = histogram;
                    }
                }
            }
            // Fall back to Gaussian bell curve if no real distribution data available
            if (!distributionChart) {
                distributionChart =
                    MrnaExprColumnFormatter.getDistributionChart(
                        cacheDatum.data.zScore
                    );
            }

            return (
                <div>
                    <span>
                        Distribution of expression across all samples in this
                        study for this gene:
                    </span>
                    <br />
                    {distributionChart}
                    {rawExprValue !== undefined && (
                        <>
                            <span>
                                <b>mRNA expression: </b>
                                {rawExprValue.toFixed(2)}
                            </span>
                            <br />
                        </>
                    )}
                    <span>
                        <b>mRNA z-score: </b>
                        {cacheDatum.data.zScore}
                    </span>
                    <br />
                    <span>
                        <b>Percentile: </b>
                        {cacheDatum.data.percentile}
                    </span>
                </div>
            );
        } else if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data === null
        ) {
            return <span>mRNA data is not available for this gene.</span>;
        } else if (cacheDatum && cacheDatum.status === 'error') {
            return <span>Error retrieving data.</span>;
        } else {
            return <span>Querying server for data.</span>;
        }
    }

    private static getTdContents(cacheDatum: MrnaExprRankCacheDataType | null) {
        let status: TableCellStatus | null = null;
        const barWidth = 30;
        const circleRadius = 3;
        const barXLeft = 0;
        const circleXLeft = barXLeft + circleRadius;
        const barXRight = barXLeft + barWidth;
        const circleXRight = barXRight - circleRadius;
        const textWidth = 30;
        const textXLeft = circleXRight + circleRadius + 3;
        const width = textXLeft + textWidth;
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return (
                <svg width={width} height={12}>
                    <text x={textXLeft} y={11} textAnchor="start" fontSize={10}>
                        {Math.round(cacheDatum.data.percentile) + '%'}
                    </text>
                    <g>
                        <line
                            x1={barXLeft}
                            y1={8}
                            x2={barXRight}
                            y2={8}
                            style={{ stroke: 'gray', strokeWidth: 2 }}
                        />
                        <circle
                            cx={MrnaExprColumnFormatter.getCircleX(
                                cacheDatum.data.percentile,
                                circleXLeft,
                                circleXRight
                            )}
                            cy={8}
                            r={circleRadius}
                            fill={MrnaExprColumnFormatter.getCircleFill(
                                cacheDatum.data.percentile
                            )}
                        />
                    </g>
                </svg>
            );
        } else if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data === null
        ) {
            status = TableCellStatus.NA;
        } else if (cacheDatum && cacheDatum.status === 'error') {
            status = TableCellStatus.ERROR;
        } else {
            status = TableCellStatus.LOADING;
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                    naAlt="mRNA data is not available for this gene."
                />
            );
        }
    }

    public static getDownloadData(
        d: { sampleId: string; entrezGeneId: number }[],
        cache: MrnaExprRankCache
    ) {
        const cacheDatum = MrnaExprColumnFormatter.getData(d, cache);
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return cacheDatum.data.percentile.toString();
        } else {
            return 'N/A';
        }
    }

    protected static getData(
        data: { sampleId: string; entrezGeneId: number }[],
        cache: MrnaExprRankCache
    ): MrnaExprRankCacheDataType | null {
        if (data.length === 0) {
            return null;
        }
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        return cache.get({ sampleId, entrezGeneId });
    }
    protected static getDataFromCNA(
        data: DiscreteCopyNumberData[],
        cache: MrnaExprRankCache
    ): MrnaExprRankCacheDataType | null {
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        return cache.get({ sampleId, entrezGeneId });
    }

    private static renderFromCacheDatum(
        cacheDatum: MrnaExprRankCacheDataType | null,
        sampleId?: string,
        entrezGeneId?: number,
        mrnaExprSourceCache?: GeneMolecularDataCache,
        mrnaExprSourceMolecularProfileId?: string
    ) {
        return (
            <DefaultTooltip
                placement="left"
                overlay={MrnaExprColumnFormatter.getTooltipContents(
                    cacheDatum,
                    sampleId,
                    entrezGeneId,
                    mrnaExprSourceCache,
                    mrnaExprSourceMolecularProfileId
                )}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
            >
                {MrnaExprColumnFormatter.getTdContents(cacheDatum)}
            </DefaultTooltip>
        );
    }

    public static renderFunction(
        data: Mutation[],
        cache: MrnaExprRankCache,
        mrnaExprSourceCache?: GeneMolecularDataCache,
        mrnaExprSourceMolecularProfileId?: string
    ) {
        const cacheDatum = MrnaExprColumnFormatter.getData(data, cache);
        const sampleId = data.length > 0 ? data[0].sampleId : undefined;
        const entrezGeneId =
            data.length > 0 ? data[0].entrezGeneId : undefined;
        // Trigger lazy loading of distribution data when source cache is available
        if (
            mrnaExprSourceCache &&
            mrnaExprSourceMolecularProfileId &&
            entrezGeneId !== undefined
        ) {
            mrnaExprSourceCache.get({
                entrezGeneId,
                molecularProfileId: mrnaExprSourceMolecularProfileId,
            });
        }
        return MrnaExprColumnFormatter.renderFromCacheDatum(
            cacheDatum,
            sampleId,
            entrezGeneId,
            mrnaExprSourceCache,
            mrnaExprSourceMolecularProfileId
        );
    }

    public static cnaRenderFunction(
        data: DiscreteCopyNumberData[],
        cache: MrnaExprRankCache
    ) {
        const cacheDatum = MrnaExprColumnFormatter.getDataFromCNA(data, cache);
        return MrnaExprColumnFormatter.renderFromCacheDatum(cacheDatum);
    }
}
