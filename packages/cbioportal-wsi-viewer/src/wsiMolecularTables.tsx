import * as React from 'react';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    DefaultTooltip,
    STRUCTURAL_VARIANT_COLOR,
} from 'cbioportal-frontend-commons';
import { DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from 'react-mutation-mapper';
import { getSimplifiedMutationType } from './wsiMolecularServices';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
    WsiMutationDataStatus,
} from './wsiViewerTypes';
import { cnaLabel } from './wsiMolecularUtils';
import { WSI_THEME } from './wsiTheme';

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const compactThStyle: React.CSSProperties = {
    fontSize: 10,
    color: WSI_THEME.muted,
    fontWeight: 600,
    textAlign: 'left',
    paddingBottom: 4,
    userSelect: 'none',
};

const compactTdBase: React.CSSProperties = {
    fontSize: 11,
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 4,
    verticalAlign: 'middle',
};

const geneCellStyle: React.CSSProperties = {
    ...compactTdBase,
    ...ellipsisStyle,
    fontWeight: 600,
    color: WSI_THEME.text,
};

const compactTableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 8,
    tableLayout: 'fixed',
};

const rowStyle: React.CSSProperties = {
    borderTop: `1px solid ${WSI_THEME.border}`,
};

const emptyStateStyle: React.CSSProperties = {
    color: WSI_THEME.muted,
    fontSize: 11,
    marginTop: 8,
};

/** Hidden on screen, read by screen readers. */
const visuallyHiddenStyle: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
};

/**
 * A cell value with its details in a tooltip that opens on hover and on
 * keyboard focus. Screen readers read the details with the value.
 */
function DetailTip({
    details,
    children,
}: {
    details: string[];
    children: React.ReactNode;
}) {
    if (details.length === 0) {
        return <>{children}</>;
    }
    return (
        <DefaultTooltip
            trigger={['hover', 'focus']}
            placement="left"
            overlay={
                <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>
                    {details.map(detail => (
                        <div key={detail}>{detail}</div>
                    ))}
                </div>
            }
        >
            <span tabIndex={0} style={{ cursor: 'help', outlineOffset: 1 }}>
                {children}
                <span style={visuallyHiddenStyle}>
                    {`: ${details.join('; ')}`}
                </span>
            </span>
        </DefaultTooltip>
    );
}

function mutationTypeColor(type: string | undefined): string | undefined {
    if (!type) return undefined;
    switch (getSimplifiedMutationType(type)) {
        case 'missense':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseColor;
        case 'frameshift':
        case 'nonsense':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingColor;
        case 'inframe':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeColor;
        case 'splice':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceColor;
        case 'fusion':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.fusionColor;
        case 'nonstart':
        case 'nonstop':
        case 'other':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherColor;
        default:
            return undefined;
    }
}

function cnaColor(value: number): string {
    if (value <= -2) return CNA_COLOR_HOMDEL;
    if (value === -1) return CNA_COLOR_HETLOSS;
    if (value >= 2) return CNA_COLOR_AMP;
    if (value === 1) return CNA_COLOR_GAIN;
    return WSI_THEME.muted;
}

/** "3/120 (2.5%)", or null without study counts. */
function formatStudyCount(
    altered: number | undefined,
    profiled: number | undefined
): string | null {
    if (altered == null || !profiled) {
        return null;
    }
    return `${altered}/${profiled} (${((altered / profiled) * 100).toFixed(
        1
    )}%)`;
}

function mutationDetails(
    mutation: MutationDetail,
    cna: CNADetail | undefined
): string[] {
    const details: string[] = [];
    if (mutation.type) {
        details.push(`Type: ${mutation.type}`);
    }
    if (mutation.vaf != null) {
        details.push(`VAF: ${mutation.vaf}%`);
    }
    if (cna) {
        details.push(`Copy number: ${cnaLabel(cna.cnaValue)}`);
    }
    const studyCount = formatStudyCount(
        mutation.cohortAlteredCount,
        mutation.cohortProfiledCount
    );
    if (studyCount) {
        details.push(`Samples in study with this variant: ${studyCount}`);
    }
    return details;
}

function cnaDetails(cna: CNADetail): string[] {
    const studyCount = formatStudyCount(
        cna.cohortAlteredCount,
        cna.cohortProfiledCount
    );
    return studyCount
        ? [`Samples in study with this alteration: ${studyCount}`]
        : [];
}

function structuralVariantDetails(sv: StructuralVariantDetail): string[] {
    const details: string[] = [];
    const push = (label: string, value: unknown) => {
        if (value == null || value === '' || value === 'NA' || value === -1)
            return;
        details.push(`${label}: ${value}`);
    };
    push('Status', sv.svStatus);
    push('Event info', sv.eventInfo);
    push('Connection type', sv.connectionType);
    return details;
}

function MutationStatusMessage({
    testId,
    children,
}: {
    testId: string;
    children: React.ReactNode;
}) {
    return (
        <div data-testid={testId} style={emptyStateStyle} role="status">
            {children}
        </div>
    );
}

/** Renders the empty state when the sample has no mutation rows to show. */
function mutationEmptyState(
    sample: Sample,
    mutationDataStatus: WsiMutationDataStatus
): React.ReactElement | null {
    switch (mutationDataStatus) {
        case 'loading':
            return (
                <MutationStatusMessage testId="wsi-mutation-table-loading">
                    Loading variants…
                </MutationStatusMessage>
            );
        case 'error':
            return (
                <MutationStatusMessage testId="wsi-mutation-table-error">
                    Variant data unavailable.
                </MutationStatusMessage>
            );
        case 'unprofiled':
            return (
                <MutationStatusMessage testId="wsi-mutation-table-unprofiled">
                    Not profiled for mutations.
                </MutationStatusMessage>
            );
        default:
            return sample.mutations ? (
                <MutationStatusMessage testId="wsi-mutation-table-empty">
                    No mutations.
                </MutationStatusMessage>
            ) : null;
    }
}

export function MutationTable({
    sample,
    mutationDataStatus = 'ready',
}: {
    sample: Sample;
    mutationDataStatus?: WsiMutationDataStatus;
}): React.ReactElement | null {
    const mutations = sample.mutations;
    if (!mutations?.length) {
        return mutationEmptyState(sample, mutationDataStatus);
    }

    return (
        <div>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '60%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>Variant</th>
                    </tr>
                </thead>
                <tbody>
                    {mutations.map(mutation => {
                        const cna = sample.cna_alterations?.find(
                            alteration => alteration.gene === mutation.gene
                        );
                        return (
                            <tr key={mutation.token} style={rowStyle}>
                                <td style={geneCellStyle}>{mutation.gene}</td>
                                <td
                                    style={{
                                        ...compactTdBase,
                                        ...ellipsisStyle,
                                        fontFamily: 'monospace',
                                        fontSize: 10.5,
                                        color: mutationTypeColor(
                                            mutation.consequence
                                        ),
                                        fontWeight: mutation.type
                                            ? 600
                                            : undefined,
                                    }}
                                >
                                    <DetailTip
                                        details={mutationDetails(mutation, cna)}
                                    >
                                        {mutation.proteinChange || '—'}
                                    </DetailTip>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function CnaTable({
    sample,
}: {
    sample: Sample;
}): React.ReactElement | null {
    const cnas = sample.cna_alterations;
    if (!cnas?.length) return null;

    return (
        <div>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '50%' }} />
                    <col style={{ width: '50%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>CNA</th>
                    </tr>
                </thead>
                <tbody>
                    {cnas.map(cna => (
                        <tr
                            key={`${cna.gene}:${cna.cnaValue}`}
                            style={rowStyle}
                        >
                            <td style={geneCellStyle}>{cna.gene}</td>
                            <td
                                style={{
                                    ...compactTdBase,
                                    color: cnaColor(cna.cnaValue),
                                    fontWeight: 500,
                                }}
                            >
                                <DetailTip details={cnaDetails(cna)}>
                                    {cnaLabel(cna.cnaValue)}
                                </DetailTip>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function StructuralVariantTable({
    sample,
}: {
    sample: Sample;
}): React.ReactElement | null {
    const structuralVariants = sample.structural_variants;
    if (!structuralVariants?.length) return null;

    return (
        <div>
            <table style={{ ...compactTableStyle, marginTop: 6 }}>
                <colgroup>
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '44%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene 1</th>
                        <th style={compactThStyle}>Gene 2</th>
                        <th style={compactThStyle}>Variant Class</th>
                    </tr>
                </thead>
                <tbody>
                    {structuralVariants.map((sv, index) => (
                        <tr
                            key={`${sv.gene1}:${sv.gene2}:${sv.variantClass}:${index}`}
                            style={rowStyle}
                        >
                            <td style={geneCellStyle}>{sv.gene1}</td>
                            <td style={geneCellStyle}>{sv.gene2}</td>
                            <td
                                style={{
                                    ...compactTdBase,
                                    ...ellipsisStyle,
                                    color: STRUCTURAL_VARIANT_COLOR,
                                    fontWeight: 500,
                                }}
                            >
                                <DetailTip
                                    details={structuralVariantDetails(sv)}
                                >
                                    {sv.variantClass}
                                </DetailTip>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
