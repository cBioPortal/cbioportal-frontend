import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { GermlineVariantAnnotation } from 'oncokb-ts-api-client';
// Reuse the somatic OncoKbCard SCSS so the germline tooltip matches the
// somatic tooltip's visual style (blue title, additional-info sections,
// footer with the OncoKB logo).
import oncoKbStyles from 'oncokb-frontend-commons/src/components/main.module.scss';
import oncoKbLogoImgSrc from 'oncokb-styles/dist/images/logo/oncokb.svg';

function germlineUrl(annotation: GermlineVariantAnnotation): string {
    const hugo = annotation.query?.hugoSymbol;
    if (!hugo) return 'https://www.oncokb.org';
    const alteration = annotation.query?.alteration;
    return alteration
        ? `https://www.oncokb.org/gene/${hugo}/germline/${alteration}`
        : `https://www.oncokb.org/gene/${hugo}/germline`;
}

function titleText(annotation: GermlineVariantAnnotation): string {
    const parts: string[] = [];
    const hugo = annotation.query?.hugoSymbol;
    const alt = annotation.query?.alteration;
    if (hugo) parts.push(hugo);
    if (alt && (!hugo || !alt.includes(hugo))) parts.push(alt);
    parts.push('(germline)');
    return parts.join(' ');
}

function GermlineCard(props: { annotation: GermlineVariantAnnotation }) {
    const { annotation } = props;
    const url = germlineUrl(annotation);
    return (
        <div
            className={oncoKbStyles['oncokb-card']}
            data-test="germline-oncokb-card"
        >
            <div className={oncoKbStyles['title']}>{titleText(annotation)}</div>

            <div className={oncoKbStyles['additional-info']}>
                <div>
                    <strong>Pathogenicity: </strong>
                    {annotation.pathogenic || 'N/A'}
                </div>
                {annotation.penetrance && (
                    <div>
                        <strong>Penetrance: </strong>
                        {annotation.penetrance}
                    </div>
                )}
                {annotation.clinVarId && (
                    <div>
                        <strong>ClinVar: </strong>
                        <a
                            href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${annotation.clinVarId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {annotation.clinVarId}
                        </a>
                    </div>
                )}
            </div>

            {(annotation.geneSummary || annotation.variantSummary) && (
                <div className={oncoKbStyles['additional-info']}>
                    {annotation.geneSummary && (
                        <div>
                            <strong>Gene Summary</strong>
                            <div>{annotation.geneSummary}</div>
                        </div>
                    )}
                    {annotation.variantSummary && (
                        <div style={{ marginTop: 6 }}>
                            <strong>Variant Summary</strong>
                            <div>{annotation.variantSummary}</div>
                        </div>
                    )}
                </div>
            )}

            {annotation.genomicIndicators &&
                annotation.genomicIndicators.length > 0 && (
                    <div className={oncoKbStyles['additional-info']}>
                        <strong>Genomic Indicators</strong>
                        {annotation.genomicIndicators.map((gi, i) => (
                            <div key={i} style={{ marginTop: 4 }}>
                                <strong>{gi.name}</strong>
                                {gi.inheritanceMechanism && (
                                    <span style={{ color: '#666' }}>
                                        {' '}
                                        ·{' '}
                                        {gi.inheritanceMechanism
                                            .toLowerCase()
                                            .replace(/_/g, ' ')}
                                    </span>
                                )}
                                {gi.description && (
                                    <div style={{ fontSize: '0.95em' }}>
                                        {gi.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

            {(annotation.highestSensitiveLevel ||
                annotation.highestDiagnosticImplicationLevel ||
                annotation.highestPrognosticImplicationLevel) && (
                <div className={oncoKbStyles['additional-info']}>
                    <strong>Highest Levels of Evidence</strong>
                    {annotation.highestSensitiveLevel && (
                        <div>
                            Therapeutic: {annotation.highestSensitiveLevel}
                        </div>
                    )}
                    {annotation.highestDiagnosticImplicationLevel && (
                        <div>
                            Diagnostic:{' '}
                            {annotation.highestDiagnosticImplicationLevel}
                        </div>
                    )}
                    {annotation.highestPrognosticImplicationLevel && (
                        <div>
                            Prognostic:{' '}
                            {annotation.highestPrognosticImplicationLevel}
                        </div>
                    )}
                </div>
            )}

            <div className={oncoKbStyles['footer']}>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={oncoKbStyles['oncokb-logo']}
                >
                    <img
                        src={oncoKbLogoImgSrc}
                        className={oncoKbStyles['oncokb-logo']}
                        alt="OncoKB™"
                    />
                </a>
            </div>
        </div>
    );
}

// Wraps the standard OncoKB Annotation column rendering for germline rows so
// hovering / tapping the cell surfaces a germline-specific tooltip styled
// to match the somatic OncoKbCard look. The icon visual is intentionally
// unchanged from somatic -- germline status is communicated by the
// indicator on the Protein Change column.
//
// Trigger is `click` only (no hover) on purpose:
//   * On desktop, hover continues to open the inner OncoKB icon's own
//     somatic tooltip; an explicit click reveals our germline tooltip.
//   * On mobile, tap synthesizes both mouseenter and click. If we kept
//     `hover` in our trigger list, every tap would open both our tooltip
//     and the inner OncoKB hover tooltip on top of each other.
// onClick stopPropagation is added so the same tap doesn't also fire any
// click handler on the inner Annotation children.
export default function GermlineOncoKbTooltip(props: {
    annotation: GermlineVariantAnnotation;
    children: React.ReactNode;
}) {
    // Touch handler: on mobile, a tap fires both `mouseover`/`mouseenter`
    // (synthesized) AND `click`. The inner OncoKB icon's own tooltip uses
    // hover, so without intercepting the synthesized mouse events the user
    // sees both our germline tooltip and the inner somatic tooltip stack
    // briefly. Capturing pointerover/mouseover at the wrapper and stopping
    // propagation keeps the inner hover tooltip from firing on touch.
    const stopAll = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };
    return (
        <DefaultTooltip
            placement="right"
            trigger={['click']}
            overlay={<GermlineCard annotation={props.annotation} />}
        >
            <span
                style={{ display: 'inline-block', cursor: 'pointer' }}
                onClick={stopAll}
                onMouseOver={stopAll}
                onMouseEnter={stopAll}
                onTouchStart={stopAll}
                onPointerOver={stopAll}
            >
                {props.children}
            </span>
        </DefaultTooltip>
    );
}
