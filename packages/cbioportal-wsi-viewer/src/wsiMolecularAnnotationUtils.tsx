import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    CompactAnnotationIcon,
    IndicatorQueryResp,
} from 'oncokb-frontend-commons';
import { WSI_THEME } from './wsiTheme';
import { WsiAnnotationStatus } from './wsiViewerTypes';

/** The OncoKB fields of an annotated row. */
export type OncoKbAnnotated = {
    /** The row's OncoKB request: pending while unset. */
    oncoKbStatus?: WsiAnnotationStatus;
    oncogenic?: string;
    mutationEffect?: string;
    geneSummary?: string;
    variantSummary?: string;
};

export function hasOncoKbAnnotationContent(
    item: OncoKbAnnotated | null | undefined
): boolean {
    return !!(
        item?.oncogenic ||
        item?.mutationEffect ||
        item?.geneSummary ||
        item?.variantSummary
    );
}

/**
 * A tooltip that opens on hover and keyboard focus and closes when anything
 * on the page scrolls, so it never floats away from its row.
 */
export function ScrollClosingTooltip({
    overlay,
    children,
}: {
    overlay: React.ReactNode;
    children: React.ReactElement;
}) {
    const [visible, setVisible] = React.useState(false);
    React.useEffect(() => {
        if (!visible) return;
        const close = () => setVisible(false);
        window.addEventListener('scroll', close, true);
        return () => window.removeEventListener('scroll', close, true);
    }, [visible]);
    return (
        <DefaultTooltip
            visible={visible}
            onVisibleChange={setVisible}
            trigger={['hover', 'focus']}
            placement="left"
            destroyTooltipOnHide={true}
            overlay={overlay}
        >
            {children}
        </DefaultTooltip>
    );
}

const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 10.5,
    padding: '1px 6px',
    borderRadius: 3,
    border: `1px solid ${WSI_THEME.border}`,
    background: WSI_THEME.headerBg,
    color: WSI_THEME.text,
};

function isOncogenic(oncogenic: string | undefined): boolean {
    const level = (oncogenic || '').toLowerCase();
    return (
        (level.includes('oncogenic') && !level.includes('neutral')) ||
        level === 'resistance'
    );
}

/** The OncoKB card: title, oncogenicity and effect, summaries, link. */
export function OncoKbCard({
    title,
    annotation,
    href,
    children,
}: {
    title: React.ReactNode;
    annotation: OncoKbAnnotated;
    href: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            style={{
                maxWidth: 320,
                fontSize: 11.5,
                lineHeight: 1.45,
                color: WSI_THEME.text,
            }}
        >
            <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 5 }}>
                {title}
            </div>
            {(annotation.oncogenic || annotation.mutationEffect) && (
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                    }}
                >
                    {annotation.oncogenic && (
                        <span
                            style={{
                                ...badgeStyle,
                                fontWeight: 700,
                                ...(isOncogenic(annotation.oncogenic)
                                    ? {
                                          color: WSI_THEME.blue,
                                          background: WSI_THEME.blueLight,
                                      }
                                    : {}),
                            }}
                        >
                            {annotation.oncogenic}
                        </span>
                    )}
                    {annotation.mutationEffect && (
                        <span style={badgeStyle}>
                            {annotation.mutationEffect}
                        </span>
                    )}
                </div>
            )}
            {children}
            {annotation.geneSummary && (
                <p style={{ margin: '0 0 5px', fontSize: 11 }}>
                    {annotation.geneSummary}
                </p>
            )}
            {annotation.variantSummary && (
                <p
                    style={{
                        margin: '0 0 5px',
                        fontSize: 11,
                        fontStyle: 'italic',
                    }}
                >
                    {annotation.variantSummary}
                </p>
            )}
            <div
                style={{
                    marginTop: 6,
                    borderTop: `1px solid ${WSI_THEME.border}`,
                    paddingTop: 5,
                }}
            >
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: WSI_THEME.blue,
                        fontSize: 10.5,
                        textDecoration: 'none',
                    }}
                >
                    View on OncoKB →
                </a>
            </div>
        </div>
    );
}

const annotationStatusIconStyle: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    fontSize: 11,
    lineHeight: 1,
};

/**
 * The OncoKB icon, as on the portal's mutation tables, linked to the OncoKB
 * page; its card opens on hover and focus when there is an annotation. While
 * the row's OncoKB request is pending it shows a spinner, and after a failed
 * request a warning, as the patient view does.
 */
export function OncoKbAnnotationLink({
    label,
    annotation,
    href,
    card,
}: {
    /** What is annotated, e.g. "KRAS G12D", for the link's accessible name. */
    label: string;
    annotation: OncoKbAnnotated;
    href: string;
    /** The card shown on hover; none without an annotation. */
    card?: React.ReactNode;
}) {
    const status = annotation.oncoKbStatus ?? 'pending';
    if (status === 'pending') {
        return (
            <span
                role="img"
                aria-label={`OncoKB: loading the annotation of ${label}`}
                data-testid="wsi-oncokb-loading"
                style={{ ...annotationStatusIconStyle, color: WSI_THEME.muted }}
            >
                <i className="fa fa-spinner fa-pulse" aria-hidden="true" />
            </span>
        );
    }
    if (status === 'error') {
        return (
            <DefaultTooltip
                overlay={<span>Error fetching OncoKB data</span>}
                placement="right"
                trigger={['hover', 'focus']}
                destroyTooltipOnHide={true}
            >
                <span
                    role="img"
                    tabIndex={0}
                    aria-label={`OncoKB: annotation of ${label} unavailable`}
                    data-testid="wsi-oncokb-error"
                    style={annotationStatusIconStyle}
                >
                    <i
                        className="fa fa-exclamation-triangle text-danger"
                        aria-hidden="true"
                    />
                </span>
            </DefaultTooltip>
        );
    }
    const indicator = annotation.oncogenic
        ? (({
              query: { germline: false },
              oncogenic: annotation.oncogenic,
          } as unknown) as IndicatorQueryResp)
        : undefined;
    const link = (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`OncoKB: ${annotation.oncogenic ||
                'not annotated'} for ${label} (opens in a new tab)`}
            data-testid="wsi-oncokb-link"
            onClick={event => event.stopPropagation()}
            style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                lineHeight: 0,
            }}
        >
            <CompactAnnotationIcon
                usingPublicOncoKbInstance={true}
                indicator={indicator}
            />
        </a>
    );
    return card && hasOncoKbAnnotationContent(annotation) ? (
        <ScrollClosingTooltip overlay={card}>{link}</ScrollClosingTooltip>
    ) : (
        link
    );
}

/** A fixed-width slot, so icons line up across rows. */
export function AnnotationIconSlot({
    children,
    width = 18,
}: {
    children?: React.ReactNode;
    width?: number;
}) {
    return (
        <span
            style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                width,
                minWidth: width,
                marginRight: 3,
            }}
        >
            {children}
        </span>
    );
}
