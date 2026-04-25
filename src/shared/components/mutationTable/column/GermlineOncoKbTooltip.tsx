import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { GermlineVariantAnnotation } from 'oncokb-ts-api-client';

function GermlineTooltipContent(props: {
    annotation: GermlineVariantAnnotation;
}) {
    const { annotation } = props;
    return (
        <div style={{ maxWidth: 300 }}>
            <div style={{ marginBottom: 5 }}>
                <strong>OncoKB Germline Annotation</strong>
            </div>
            <table className="table table-condensed table-borderless">
                <tbody>
                    <tr>
                        <td>
                            <strong>Pathogenicity:</strong>
                        </td>
                        <td>{annotation.pathogenic || 'N/A'}</td>
                    </tr>
                    {annotation.penetrance && (
                        <tr>
                            <td>
                                <strong>Penetrance:</strong>
                            </td>
                            <td>{annotation.penetrance}</td>
                        </tr>
                    )}
                    {annotation.geneSummary && (
                        <tr>
                            <td colSpan={2}>
                                <strong>Gene Summary:</strong>
                                <br />
                                <span style={{ fontSize: '0.9em' }}>
                                    {annotation.geneSummary}
                                </span>
                            </td>
                        </tr>
                    )}
                    {annotation.variantSummary && (
                        <tr>
                            <td colSpan={2}>
                                <strong>Variant Summary:</strong>
                                <br />
                                <span style={{ fontSize: '0.9em' }}>
                                    {annotation.variantSummary}
                                </span>
                            </td>
                        </tr>
                    )}
                    {annotation.genomicIndicators &&
                        annotation.genomicIndicators.length > 0 && (
                            <tr>
                                <td colSpan={2}>
                                    <strong>Genomic Indicators:</strong>
                                    <br />
                                    {annotation.genomicIndicators.map(
                                        (gi, i) => (
                                            <span
                                                key={i}
                                                style={{ fontSize: '0.9em' }}
                                            >
                                                {gi.name}
                                                {gi.inheritanceMechanism &&
                                                    ` (${gi.inheritanceMechanism
                                                        .toLowerCase()
                                                        .replace(/_/g, ' ')})`}
                                                {gi.description && (
                                                    <>: {gi.description}</>
                                                )}
                                                <br />
                                            </span>
                                        )
                                    )}
                                </td>
                            </tr>
                        )}
                    {annotation.highestSensitiveLevel && (
                        <tr>
                            <td>
                                <strong>Therapeutic Level:</strong>
                            </td>
                            <td>{annotation.highestSensitiveLevel}</td>
                        </tr>
                    )}
                    {annotation.highestDiagnosticImplicationLevel && (
                        <tr>
                            <td>
                                <strong>Diagnostic Level:</strong>
                            </td>
                            <td>
                                {annotation.highestDiagnosticImplicationLevel}
                            </td>
                        </tr>
                    )}
                    {annotation.highestPrognosticImplicationLevel && (
                        <tr>
                            <td>
                                <strong>Prognostic Level:</strong>
                            </td>
                            <td>
                                {annotation.highestPrognosticImplicationLevel}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Wraps the standard OncoKB Annotation column rendering for germline rows so
// hovering anywhere in the cell surfaces a germline-specific tooltip
// (pathogenicity, penetrance, genomic indicators, levels). The icon visual
// is intentionally unchanged from somatic -- germline status is already
// communicated by the indicator on the Protein Change column.
export default function GermlineOncoKbTooltip(props: {
    annotation: GermlineVariantAnnotation;
    children: React.ReactNode;
}) {
    return (
        <DefaultTooltip
            placement="right"
            // Include `click` so a tap on touch devices (where hover never
            // fires) also opens the tooltip; keep `hover` for desktop.
            trigger={['hover', 'click']}
            overlay={<GermlineTooltipContent annotation={props.annotation} />}
        >
            <span style={{ display: 'inline-block' }}>{props.children}</span>
        </DefaultTooltip>
    );
}
