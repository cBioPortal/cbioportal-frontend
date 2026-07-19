import React from 'react';
import {
    getNumberRangeLabel,
    getSortedSampleInfo,
} from 'pages/patientView/timeline/TimelineWrapperUtils';
import { getTextWidth } from 'cbioportal-frontend-commons';

type MultipleSampleMarkerSummary = {
    clipPathId: string;
    colorRectWidth: number;
    label: string;
    rectHeight: number;
    rectWidth: number;
    uniqueColors: string[];
};

type CachedMultipleSampleMarkerSummaryEntry = {
    colorsSnapshot: string;
    labelsSnapshot: string;
    summary: MultipleSampleMarkerSummary;
};

const multipleSampleMarkerSummaryCache = new WeakMap<
    string[],
    CachedMultipleSampleMarkerSummaryEntry
>();

export function getMultipleSampleMarkerClipPathId(
    colors: string[],
    labels: Array<string | number>
): string {
    return `multiple-sample-marker-${colors.join('|')}::${labels.join('|')}`;
}

export function getMultipleSampleMarkerColorKey(
    color: string,
    index: number
): string {
    return `${color}:${index}`;
}

export function getMultipleSampleMarkerSummary(
    colors: string[],
    labels: string[]
): MultipleSampleMarkerSummary {
    const colorsSnapshot = colors.join('|');
    const labelsSnapshot = labels.join('|');
    const cached = multipleSampleMarkerSummaryCache.get(colors);
    if (
        cached &&
        cached.colorsSnapshot === colorsSnapshot &&
        cached.labelsSnapshot === labelsSnapshot
    ) {
        return cached.summary;
    }

    const sortedSampleInfo = getSortedSampleInfo(colors, labels);
    const orderedNumericLabels = new Array<number>(sortedSampleInfo.length);
    const uniqueColors: string[] = [];
    const seenColors = new Set<string>();
    for (let index = 0; index < sortedSampleInfo.length; index += 1) {
        const sampleInfo = sortedSampleInfo[index];
        orderedNumericLabels[index] = sampleInfo.label;
        if (!seenColors.has(sampleInfo.color)) {
            seenColors.add(sampleInfo.color);
            uniqueColors.push(sampleInfo.color);
        }
    }
    const label = getNumberRangeLabel(orderedNumericLabels);
    const labelWidth = Math.ceil(getTextWidth(label, 'Arial', '10px'));
    const rectPadding = 4;
    const rectWidth = labelWidth + 2 * rectPadding;
    const rectHeight = 14;
    const clipPathId = getMultipleSampleMarkerClipPathId(
        uniqueColors,
        orderedNumericLabels
    );
    const summary = {
        clipPathId,
        colorRectWidth: rectWidth / uniqueColors.length,
        label,
        rectHeight,
        rectWidth,
        uniqueColors,
    };

    multipleSampleMarkerSummaryCache.set(colors, {
        colorsSnapshot,
        labelsSnapshot,
        summary,
    });

    return summary;
}

const SampleMarker: React.FunctionComponent<{
    color: string;
    label: string;
    y: number;
}> = function({ color, label, y }) {
    return (
        <g transform={`translate(0 ${y})`}>
            <circle cx="0" cy="0" r="7" fill={color} />
            <text
                x="0"
                y="0"
                text-anchor="middle"
                fill="white"
                font-size="10px"
                font-family="Arial"
                dy=".3em"
            >
                {label}
            </text>
        </g>
    );
};

export const MultipleSampleMarker: React.FunctionComponent<{
    colors: string[]; // same length as labels
    labels: string[];
    y: number;
}> = function({ colors, labels, y }) {
    const {
        clipPathId,
        colorRectWidth,
        label,
        rectHeight,
        rectWidth,
        uniqueColors,
    } = getMultipleSampleMarkerSummary(colors, labels);
    const colorRects = new Array<JSX.Element>(uniqueColors.length);
    for (let index = 0; index < uniqueColors.length; index += 1) {
        const color = uniqueColors[index];
        colorRects[index] = (
            <rect
                key={getMultipleSampleMarkerColorKey(color, index)}
                x={-rectWidth / 2 + index * colorRectWidth}
                y={-rectHeight / 2}
                width={colorRectWidth}
                height={rectHeight}
                fill={color}
            />
        );
    }
    return (
        <g transform={`translate(0 ${y})`}>
            <clipPath id={clipPathId}>
                <rect
                    x={-rectWidth / 2}
                    y={-rectHeight / 2}
                    rx={rectHeight / 2}
                    ry={rectHeight / 2}
                    width={rectWidth}
                    height={rectHeight}
                />
            </clipPath>
            <g clipPath={`url(#${clipPathId})`}>
                {colorRects}
                <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    fill="white"
                    font-size="10px"
                    font-family="Arial"
                    dy=".3em"
                >
                    {label}
                </text>
            </g>
        </g>
    );
};

export default SampleMarker;
