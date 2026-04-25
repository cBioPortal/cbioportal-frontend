import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { GermlineVariantAnnotation } from 'oncokb-ts-api-client';

const PATHOGENIC_COLORS: { [key: string]: string } = {
    Pathogenic: '#FF0000',
    'Likely Pathogenic': '#FF6600',
    VUS: '#696969',
    'Likely Benign': '#33A02C',
    Benign: '#33A02C',
};

const PATHOGENIC_ICONS: { [key: string]: string } = {
    Pathogenic: 'fa-exclamation-circle',
    'Likely Pathogenic': 'fa-exclamation-triangle',
    VUS: 'fa-question-circle',
    'Likely Benign': 'fa-check-circle',
    Benign: 'fa-check-circle',
};

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

export default function GermlineOncoKbIcon(props: {
    annotation: GermlineVariantAnnotation;
}) {
    const { annotation } = props;
    const pathogenic = annotation.pathogenic || 'VUS';
    const color = PATHOGENIC_COLORS[pathogenic] || '#696969';
    const icon = PATHOGENIC_ICONS[pathogenic] || 'fa-question-circle';

    return (
        <DefaultTooltip
            placement="right"
            overlay={<GermlineTooltipContent annotation={annotation} />}
        >
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            >
                <i
                    className={`fa ${icon}`}
                    style={{
                        color,
                        fontSize: 14,
                        marginRight: 3,
                    }}
                />
                <span style={{ fontSize: 11, color }}>{pathogenic}</span>
            </span>
        </DefaultTooltip>
    );
}
