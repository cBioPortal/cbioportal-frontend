import * as React from 'react';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    STRUCTURAL_VARIANT_COLOR,
} from 'cbioportal-frontend-commons';
import {
    Civic,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    HotspotAnnotation,
} from 'react-mutation-mapper';
import {
    getSimplifiedMutationType,
    isWsiCivicEnabled,
    isWsiOncoKbEnabled,
} from './wsiMolecularServices';
import {
    AnnotationIconSlot,
    OncoKbAnnotationLink,
    OncoKbCard,
    ScrollClosingTooltip,
} from './wsiMolecularAnnotationUtils';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
    WsiMutationDataStatus,
} from './wsiViewerTypes';
import { buildOncoKbUrl, cnaLabel } from './wsiMolecularUtils';
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
        <ScrollClosingTooltip
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
        </ScrollClosingTooltip>
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

const annotCellStyle: React.CSSProperties = {
    ...compactTdBase,
    paddingRight: 2,
    whiteSpace: 'nowrap',
};

/** A recurrent hotspot, from Cancer Hotspots, OncoKB or the driver annotation. */
function isRecurrentHotspot(mutation: MutationDetail): boolean {
    return (
        mutation.recurrentHotspot === true ||
        mutation.hotspot === true ||
        !!mutation.annotation?.toLowerCase().includes('hotspot')
    );
}

function isHotspot(mutation: MutationDetail): boolean {
    return isRecurrentHotspot(mutation) || mutation.hotspot3d === true;
}

function oncoKbSortScore(mutation: MutationDetail): number {
    const oncogenic = (mutation.oncogenic || '').trim().toLowerCase();
    if (oncogenic === 'oncogenic') return 5;
    if (oncogenic === 'likely oncogenic' || oncogenic === 'resistance') {
        return 4;
    }
    if (oncogenic === 'predicted oncogenic') return 3;
    if (mutation.mutationEffect && mutation.mutationEffect !== 'Unknown') {
        return 2;
    }
    return oncogenic || mutation.mutationEffect ? 1 : 0;
}

/** Oncogenic first, then by CIViC entry, hotspot and VAF. */
function compareAnnotatedMutations(
    a: MutationDetail,
    b: MutationDetail
): number {
    const score = (mutation: MutationDetail) => [
        oncoKbSortScore(mutation),
        mutation.civicEntry ? 1 : 0,
        isHotspot(mutation) ? 1 : 0,
        mutation.vaf ?? -1,
    ];
    const aScore = score(a);
    const bScore = score(b);
    for (let index = 0; index < aScore.length; index += 1) {
        if (aScore[index] !== bScore[index]) {
            return bScore[index] - aScore[index];
        }
    }
    return a.token.localeCompare(b.token);
}

function MutationAnnotations({
    mutation,
    showOncoKb,
    showCivic,
}: {
    mutation: MutationDetail;
    showOncoKb: boolean;
    showCivic: boolean;
}) {
    const variant = mutation.proteinChange || undefined;
    const href = buildOncoKbUrl(mutation.gene, variant);
    const label = `${mutation.gene}${variant ? ` ${variant}` : ''}`;
    return (
        <>
            {showOncoKb && (
                <AnnotationIconSlot>
                    <OncoKbAnnotationLink
                        label={label}
                        annotation={mutation}
                        href={href}
                        card={
                            <OncoKbCard
                                title={label}
                                annotation={mutation}
                                href={href}
                            />
                        }
                    />
                </AnnotationIconSlot>
            )}
            {showCivic && (
                <AnnotationIconSlot>
                    {mutation.civicEntry && (
                        <Civic
                            civicEntry={mutation.civicEntry}
                            civicStatus="complete"
                            hasCivicVariants={
                                Object.keys(mutation.civicEntry.variants)
                                    .length > 0
                            }
                        />
                    )}
                </AnnotationIconSlot>
            )}
            {isHotspot(mutation) && (
                <span
                    data-testid="wsi-hotspot-annotation"
                    style={{ display: 'inline-block', verticalAlign: 'middle' }}
                >
                    <HotspotAnnotation
                        status="complete"
                        isHotspot={isRecurrentHotspot(mutation)}
                        is3dHotspot={mutation.hotspot3d === true}
                    />
                </span>
            )}
        </>
    );
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
    if (!sample.mutations?.length) {
        return mutationEmptyState(sample, mutationDataStatus);
    }
    const mutations = [...sample.mutations].sort(compareAnnotatedMutations);
    const showOncoKb = isWsiOncoKbEnabled();
    const showCivic = isWsiCivicEnabled();
    // The column stays for hotspot flags without OncoKB or CIViC.
    const showAnnotations =
        showOncoKb || showCivic || mutations.some(isHotspot);

    return (
        <div>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: showAnnotations ? '34%' : '40%' }} />
                    <col style={{ width: showAnnotations ? '38%' : '60%' }} />
                    {showAnnotations && <col style={{ width: '28%' }} />}
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>Variant</th>
                        {showAnnotations && (
                            <th style={compactThStyle}>Annot</th>
                        )}
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
                                {showAnnotations && (
                                    <td style={annotCellStyle}>
                                        <MutationAnnotations
                                            mutation={mutation}
                                            showOncoKb={showOncoKb}
                                            showCivic={showCivic}
                                        />
                                    </td>
                                )}
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
    const showOncoKb = isWsiOncoKbEnabled();
    const showCivic = isWsiCivicEnabled();
    const showAnnotations = showOncoKb || showCivic;

    return (
        <div>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: showAnnotations ? '42%' : '50%' }} />
                    <col style={{ width: showAnnotations ? '40%' : '50%' }} />
                    {showAnnotations && <col style={{ width: '18%' }} />}
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>CNA</th>
                        {showAnnotations && (
                            <th style={compactThStyle}>Annot</th>
                        )}
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
                            {showAnnotations && (
                                <td style={annotCellStyle}>
                                    {showOncoKb && (
                                        <AnnotationIconSlot>
                                            <OncoKbAnnotationLink
                                                label={`${cna.gene} ${cnaLabel(
                                                    cna.cnaValue
                                                )}`}
                                                annotation={cna}
                                                href={buildOncoKbUrl(cna.gene)}
                                                card={
                                                    <OncoKbCard
                                                        title={`${
                                                            cna.gene
                                                        } ${cnaLabel(
                                                            cna.cnaValue
                                                        )}`}
                                                        annotation={cna}
                                                        href={buildOncoKbUrl(
                                                            cna.gene
                                                        )}
                                                    >
                                                        {cnaDetails(cna).map(
                                                            detail => (
                                                                <div
                                                                    key={detail}
                                                                    style={{
                                                                        marginBottom: 6,
                                                                    }}
                                                                >
                                                                    {detail}
                                                                </div>
                                                            )
                                                        )}
                                                    </OncoKbCard>
                                                }
                                            />
                                        </AnnotationIconSlot>
                                    )}
                                    {showCivic && cna.civicEntry && (
                                        <AnnotationIconSlot>
                                            <Civic
                                                civicEntry={cna.civicEntry}
                                                civicStatus="complete"
                                                hasCivicVariants={
                                                    cna.hasCivicVariants !==
                                                    false
                                                }
                                            />
                                        </AnnotationIconSlot>
                                    )}
                                </td>
                            )}
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
    const showOncoKb = isWsiOncoKbEnabled();

    return (
        <div>
            <table style={{ ...compactTableStyle, marginTop: 6 }}>
                <colgroup>
                    <col style={{ width: showOncoKb ? '26%' : '28%' }} />
                    <col style={{ width: showOncoKb ? '26%' : '28%' }} />
                    <col style={{ width: showOncoKb ? '36%' : '44%' }} />
                    {showOncoKb && <col style={{ width: '12%' }} />}
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene 1</th>
                        <th style={compactThStyle}>Gene 2</th>
                        <th style={compactThStyle}>Variant Class</th>
                        {showOncoKb && <th style={compactThStyle}>Annot</th>}
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
                            {showOncoKb && (
                                <td style={annotCellStyle}>
                                    <StructuralVariantOncoKb sv={sv} />
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StructuralVariantOncoKb({ sv }: { sv: StructuralVariantDetail }) {
    const genes = [sv.gene1, sv.gene2].filter(gene => gene && gene !== '—');
    if (!genes.length) return null;
    const href = buildOncoKbUrl(genes[0]);
    const label = genes.join(' / ');
    return (
        <OncoKbAnnotationLink
            label={label}
            annotation={sv}
            href={href}
            card={
                <OncoKbCard title={label} annotation={sv} href={href}>
                    <div style={{ marginBottom: 6 }}>
                        {[
                            `Variant class: ${sv.variantClass}`,
                            ...structuralVariantDetails(sv),
                        ].map(detail => (
                            <div key={detail}>{detail}</div>
                        ))}
                    </div>
                </OncoKbCard>
            }
        />
    );
}
