import React from 'react';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import { loaderIcon } from '../StatusHelpers';
import {
    AlphaGenomeAnnotation,
    AlphaGenomeScore,
} from 'genome-nexus-ts-api-client';
import annotationStyles from '../column/annotation.module.scss';

export const OUTPUT_TYPES = [
    'RNA_SEQ',
    'SPLICE_SITES',
    'SPLICE_SITE_USAGE',
    'SPLICE_JUNCTIONS',
] as const;

export type AlphaGenomeOutputType = typeof OUTPUT_TYPES[number];

export type AlphaGenomeLabel = 'strong' | 'moderate' | undefined;

export const DISCLAIMER = 'Model prediction, not experimental evidence.';

/**
 * Reads the precomputed dual-gate score_level ('strong' | 'moderate' | null)
 * returned by the AlphaGenome sidecar
 */
export function alphaGenomeLabel(
    annotation: AlphaGenomeAnnotation | undefined
): AlphaGenomeLabel {
    const level = annotation?.annotation?.score_level;
    if (level === 'strong' || level === 'moderate') {
        return level;
    }
    return undefined;
}

export function sortValue(
    annotation: AlphaGenomeAnnotation | undefined
): number {
    if (!annotation?.annotation) {
        return 3;
    }
    const label = alphaGenomeLabel(annotation);
    return label === 'strong' ? 0 : label === 'moderate' ? 1 : 2;
}

function availableCuries(rows: AlphaGenomeScore[]): string[] {
    const curies: string[] = [];
    for (const row of rows) {
        if (row.ontology_curie && !curies.includes(row.ontology_curie)) {
            curies.push(row.ontology_curie);
        }
    }
    return curies;
}

function formatScore(value: number | undefined | null): string {
    if (value == null || !isFinite(value)) {
        return '';
    }
    return value.toFixed(4);
}

function rowForOutputType(
    rows: AlphaGenomeScore[],
    outputType: string,
    ontologyCurie?: string
): AlphaGenomeScore | undefined {
    const typed = rows.filter(row => row.output_type === outputType);
    if (typed.length === 0) {
        return undefined;
    }
    const match = ontologyCurie
        ? typed.find(row => row.ontology_curie === ontologyCurie)
        : undefined;
    if (match) {
        return match;
    }
    return typed.reduce((best, row) =>
        Math.abs(row.raw_score ?? 0) > Math.abs(best.raw_score ?? 0)
            ? row
            : best
    );
}

function TissueBarChart(props: {
    rows: AlphaGenomeScore[];
    outputType: string;
    selectedCurie?: string;
    onSelect: (curie: string) => void;
}): JSX.Element | null {
    const byLabel = new Map<string, number>();
    for (const row of props.rows) {
        if (row.output_type !== props.outputType) {
            continue;
        }
        // Rows without a tissue curie (e.g. SPLICE_SITES) fall back to track
        // name or output type so switching types never collapses the chart
        const label =
            row.ontology_curie ?? row.track_name ?? props.outputType;
        const current = byLabel.get(label);
        const value = Math.abs(row.raw_score ?? 0);
        if (current === undefined || value > current) {
            byLabel.set(label, value);
        }
    }
    const entries = Array.from(byLabel.entries());
    if (entries.length === 0) {
        return null;
    }
    const max = Math.max(...entries.map(([, value]) => value), 0.0001);
    return (
        <div style={{ marginTop: 8 }}>
            <div>
                <strong>{props.outputType} by tissue</strong>
            </div>
            <div style={{ maxHeight: 168, minHeight: 168, overflowY: 'auto' }}>
                {entries.map(([label, value]) => (
                    <div
                        key={label}
                        onClick={() => props.onSelect(label)}
                        style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                width: 100,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                verticalAlign: 'bottom',
                                fontWeight:
                                    label === props.selectedCurie
                                        ? 'bold'
                                        : 'normal',
                            }}
                        >
                            {label}
                        </span>
                        <span
                            style={{
                                display: 'inline-block',
                                width: 90,
                                backgroundColor: '#eee',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: `${(value / max) * 90}px`,
                                    backgroundColor:
                                        label === props.selectedCurie
                                            ? '#2c7fb8'
                                            : '#999',
                                    height: 10,
                                }}
                            />
                        </span>{' '}
                        <span>{value.toFixed(3)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const AlphaGenomeTooltipContent: React.FunctionComponent<{
    annotation: AlphaGenomeAnnotation;
}> = props => {
    const rows = props.annotation.annotation?.scores ?? [];
    const curies = React.useMemo(() => availableCuries(rows), [rows]);
    const [selectedType, setSelectedType] = React.useState<string>(
        () =>
            OUTPUT_TYPES.find(t => rows.some(r => r.output_type === t)) ??
            'RNA_SEQ'
    );
    // Picking a tissue with no passing score must not blank the row's icon
    const [selectedCurie, setSelectedCurie] = React.useState<
        string | undefined
    >(undefined);
    // Fall back when a stored tissue is absent post-sort
    const valid = (curie: string | undefined) =>
        curie && curies.includes(curie) ? curie : undefined;
    const effectiveCurie = valid(selectedCurie) ?? curies[0];
    const selectCurie = (curie: string) => {
        if (curies.includes(curie)) {
            setSelectedCurie(curie);
        }
    };
    const cellStyle: React.CSSProperties = {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: '2px 6px 2px 0',
    };
    return (
        <div style={{ width: 440, maxWidth: '90vw', fontSize: 12 }}>
            <div
                style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                <strong>
                    AlphaGenome{' '}
                    {props.annotation.annotation?.canonical_gene ?? ''}
                </strong>{' '}
                ({props.annotation.annotation?.hg38_variant ?? ''})
            </div>
            <table style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '13%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={cellStyle}>Output</th>
                        <th style={cellStyle}>Gene</th>
                        <th style={cellStyle}>Track</th>
                        <th style={cellStyle}>Raw</th>
                        <th style={cellStyle}>Quantile</th>
                    </tr>
                </thead>
                <tbody>
                    {OUTPUT_TYPES.map(outputType => {
                        const row = rowForOutputType(
                            rows,
                            outputType,
                            effectiveCurie
                        );
                        if (!row) {
                            return null;
                        }
                        return (
                            <tr key={outputType}>
                                <td style={cellStyle}>
                                    <a
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            setSelectedType(outputType);
                                        }}
                                    >
                                        {outputType}
                                    </a>
                                </td>
                                <td style={cellStyle}>{row.gene_name ?? ''}</td>
                                <td style={cellStyle}>
                                    {row.track_name ?? ''}
                                </td>
                                <td style={cellStyle}>
                                    {formatScore(row.raw_score)}
                                </td>
                                <td style={cellStyle}>
                                    {formatScore(row.quantile_score)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {curies.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    <label>
                        Tissue:{` `}
                        <select
                            value={effectiveCurie ?? ''}
                            onChange={e => selectCurie(e.target.value)}
                        >
                            {curies.map(curie => (
                                <option key={curie} value={curie}>
                                    {curie}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
            <TissueBarChart
                rows={rows}
                outputType={selectedType}
                selectedCurie={effectiveCurie}
                onSelect={selectCurie}
            />
            <div style={{ marginTop: 8, fontStyle: 'italic' }}>
                {DISCLAIMER}
            </div>
        </div>
    );
};

export type AlphaGenomeCellStatus = 'pending' | 'error' | 'complete';

export const AlphaGenomeCell: React.FunctionComponent<{
    annotation?: AlphaGenomeAnnotation;
    status?: AlphaGenomeCellStatus;
}> = props => {
    if (!props.annotation?.annotation) {
        // Hold the 22px slot with a spinner while scoring
        if (props.status === 'pending') {
            return loaderIcon('pull-left');
        }
        return <span className={`${annotationStyles['annotation-item']}`} />;
    }
    const label = alphaGenomeLabel(props.annotation);
    const badgeColor =
        label === 'strong'
            ? '#d7301f'
            : label === 'moderate'
            ? '#fd8d3c'
            : '#6baed6';
    return (
        <DefaultTooltip
            placement="topLeft"
            trigger={['hover', 'focus']}
            onPopupAlign={placeArrowBottomLeft}
            overlay={<AlphaGenomeTooltipContent annotation={props.annotation} />}
        >
            <span
                className={`${annotationStyles['annotation-item']}`}
                style={{
                    width: 22,
                    height: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        lineHeight: '14px',
                        color: badgeColor,
                    }}
                >
                    αG
                </span>
            </span>
        </DefaultTooltip>
    );
};
