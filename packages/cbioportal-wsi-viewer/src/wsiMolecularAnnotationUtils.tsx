import * as React from 'react';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
} from './wsiViewerTypes';

function oncogenicStyle(level: string | undefined): React.CSSProperties {
    if (!level) return {};
    const l = level.toLowerCase();
    if (l.includes('likely neutral') || l.includes('inconclusive')) {
        return { color: '#888' };
    }
    if (l.includes('oncogenic') || l === 'resistance') {
        return { color: '#007bff', fontWeight: 700 };
    }
    return { color: '#555' };
}

export function AnnotationBadgeRow({
    oncogenic,
    mutationEffect,
}: {
    oncogenic?: string;
    mutationEffect?: string;
}) {
    if (!oncogenic && !mutationEffect) {
        return null;
    }

    return (
        <div
            style={{
                display: 'flex',
                gap: 8,
                marginBottom: 6,
                flexWrap: 'wrap',
            }}
        >
            {oncogenic && (
                <span
                    style={{
                        display: 'inline-block',
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: oncogenic
                            .toLowerCase()
                            .includes('oncogenic')
                            ? '#e6f0ff'
                            : '#f5f5f5',
                        ...oncogenicStyle(oncogenic),
                    }}
                >
                    {oncogenic}
                </span>
            )}
            {mutationEffect && (
                <span
                    style={{
                        display: 'inline-block',
                        fontSize: 10.5,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: '#f9f2e8',
                        color: '#7a5c00',
                    }}
                >
                    {mutationEffect}
                </span>
            )}
        </div>
    );
}

export function AnnotationSummaryText({
    geneSummary,
    variantSummary,
}: {
    geneSummary?: string;
    variantSummary?: string;
}) {
    return (
        <>
            {geneSummary && (
                <p
                    style={{
                        margin: '0 0 5px',
                        color: '#444',
                        fontSize: 11,
                    }}
                >
                    {geneSummary}
                </p>
            )}
            {variantSummary && (
                <p
                    style={{
                        margin: '0 0 5px',
                        color: '#555',
                        fontSize: 11,
                        fontStyle: 'italic',
                    }}
                >
                    {variantSummary}
                </p>
            )}
        </>
    );
}

export function AnnotationFooterLink({ href }: { href?: string }) {
    if (!href) {
        return null;
    }

    return (
        <div
            style={{
                marginTop: 6,
                borderTop: '1px solid #eee',
                paddingTop: 5,
            }}
        >
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: '#0968C3',
                    fontSize: 10.5,
                    textDecoration: 'none',
                }}
            >
                View on OncoKB →
            </a>
        </div>
    );
}

const ANNOTATION_ICON_SLOT_WIDTH = 16;

export function hasOncoKbAnnotationContent(
    item:
        | Pick<
              MutationDetail | CNADetail | StructuralVariantDetail,
              'oncogenic' | 'mutationEffect' | 'geneSummary' | 'variantSummary'
          >
        | null
        | undefined
): boolean {
    return !!(
        item?.oncogenic ||
        item?.mutationEffect ||
        item?.geneSummary ||
        item?.variantSummary
    );
}

export function AnnotationIconSlot({
    children,
    marginRight = 0,
}: {
    children?: React.ReactNode;
    marginRight?: number;
}) {
    return (
        <span
            style={{
                verticalAlign: 'middle',
                display: 'inline-block',
                width: ANNOTATION_ICON_SLOT_WIDTH,
                minWidth: ANNOTATION_ICON_SLOT_WIDTH,
                marginRight,
            }}
        >
            {children}
        </span>
    );
}

export function AnnotationLinkIcon({
    href,
    showIcon = true,
    showTooltip,
    hideTooltip,
    marginRight = 0,
    icon,
}: {
    href?: string;
    showIcon?: boolean;
    showTooltip?: (event: React.MouseEvent<HTMLElement>) => void;
    hideTooltip?: () => void;
    marginRight?: number;
    icon: React.ReactNode;
}) {
    if (!showIcon) {
        return <AnnotationIconSlot marginRight={marginRight} />;
    }

    const commonProps = {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onClick: (e: React.MouseEvent<HTMLElement>) => e.stopPropagation(),
        style: {
            verticalAlign: 'middle',
            display: 'inline-block',
            textDecoration: 'none',
            cursor: href || showTooltip ? 'pointer' : undefined,
        } as React.CSSProperties,
    };

    return (
        <AnnotationIconSlot marginRight={marginRight}>
            {href ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...commonProps}
                >
                    {icon}
                </a>
            ) : (
                <span {...commonProps}>{icon}</span>
            )}
        </AnnotationIconSlot>
    );
}
