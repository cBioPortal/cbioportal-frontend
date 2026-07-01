import * as React from 'react';
import { Sample } from './wsiViewerTypes';
import { CnaTable, MutationTable, StructuralVariantTable } from './wsiMolecularTables';

/** Initial timeout before first auto-retry. Subsequent failure shows manual retry UI. */
const THUMBNAIL_TIMEOUT_MS = 30_000;
const THUMBNAIL_MAX_AUTO_RETRIES = 1;

const SIDEBAR_COLORS = {
    blue: '#2986e2',
    border: '#ddd',
    muted: '#737373',
    text: '#333',
    sidebarBg: '#f5f5f5',
} as const;

const sectionTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: SIDEBAR_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
};

export interface MetaRow {
    label: string;
    labelTip?: string;
    value: React.ReactNode;
    href?: string;
    valueTip?: string;
}

function SlideThumbnail({ src }: { src: string | null }) {
    const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>(
        'loading'
    );
    const [retryKey, setRetryKey] = React.useState(0);
    const autoRetriesRef = React.useRef(0);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useLayoutEffect(() => {
        autoRetriesRef.current = 0;
        const img = imgRef.current;
        if (!img) return;
        if (img.complete) {
            setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
            return;
        }
        const timer = window.setTimeout(() => {
            if (autoRetriesRef.current < THUMBNAIL_MAX_AUTO_RETRIES) {
                autoRetriesRef.current += 1;
                setStatus('loading');
                setRetryKey(key => key + 1);
            } else {
                setStatus('error');
            }
        }, THUMBNAIL_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [retryKey]);

    if (!src) {
        return (
            <span
                style={{
                    color: '#bbb',
                    fontSize: 11,
                    padding: 20,
                    textAlign: 'center',
                }}
            >
                No slide selected
            </span>
        );
    }

    return (
        <>
            {status === 'loading' && (
                <span style={{ color: '#888', fontSize: 12 }}>
                    <i
                        className="fa fa-spinner fa-spin"
                        style={{ marginRight: 4 }}
                    />
                    Loading…
                </span>
            )}
            <img
                key={retryKey}
                ref={imgRef}
                src={src}
                alt="slide thumbnail"
                style={{
                    maxWidth: '100%',
                    maxHeight: 160,
                    display: status === 'loaded' ? 'block' : 'none',
                }}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
            />
            {status === 'error' && (
                <span style={{ color: '#bbb', fontSize: 11 }}>
                    Thumbnail unavailable{' '}
                    <button
                        className="btn btn-link btn-sm"
                        style={{
                            padding: 0,
                            fontSize: 11,
                            verticalAlign: 'baseline',
                        }}
                        onClick={() => {
                            setStatus('loading');
                            setRetryKey(key => key + 1);
                        }}
                    >
                        Retry
                    </button>
                </span>
            )}
        </>
    );
}

function SbSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${SIDEBAR_COLORS.border}`,
            }}
        >
            <div style={sectionTitleStyle}>{title}</div>
            {children}
        </div>
    );
}

function MetaTable({ rows }: { rows: MetaRow[] }) {
    return (
        <table
            style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}
        >
            <tbody>
                {rows.map(row => (
                    <tr key={row.label}>
                        <td
                            title={row.labelTip}
                            style={{
                                fontSize: 11,
                                color: SIDEBAR_COLORS.muted,
                                width: '50%',
                                paddingRight: 5,
                                paddingTop: 2,
                                paddingBottom: 2,
                                verticalAlign: 'top',
                                lineHeight: 1.5,
                                cursor: row.labelTip ? 'help' : undefined,
                                borderBottom: row.labelTip
                                    ? `1px dotted ${SIDEBAR_COLORS.border}`
                                    : undefined,
                            }}
                        >
                            {row.label}
                        </td>
                        <td
                            title={row.valueTip}
                            style={{
                                fontSize: 11,
                                color: SIDEBAR_COLORS.text,
                                fontWeight: 500,
                                wordBreak: 'break-word',
                                verticalAlign: 'top',
                                lineHeight: 1.5,
                                cursor: row.valueTip ? 'help' : undefined,
                            }}
                        >
                            {row.href ? (
                                <a
                                    href={row.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: SIDEBAR_COLORS.blue,
                                        textDecoration: 'none',
                                    }}
                                    onMouseEnter={event => {
                                        (
                                            event.currentTarget as HTMLAnchorElement
                                        ).style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={event => {
                                        (
                                            event.currentTarget as HTMLAnchorElement
                                        ).style.textDecoration = 'none';
                                    }}
                                >
                                    {row.value || '—'}
                                </a>
                            ) : (
                                row.value || '—'
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function WsiMetaSidebar({
    width,
    thumbSrc,
    showImageProperties,
    wsiRows,
    showPathology,
    pathRows,
    seqRows,
    sample,
}: {
    width: number;
    thumbSrc: string | null;
    showImageProperties: boolean;
    wsiRows: MetaRow[];
    showPathology: boolean;
    pathRows: MetaRow[];
    seqRows: MetaRow[];
    sample: Sample | null;
}) {
    return (
        <div
            data-testid="wsi-metadata-sidebar"
            style={{
                width,
                minWidth: width,
                background: SIDEBAR_COLORS.sidebarBg,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                flexShrink: 0,
            }}
        >
            <SbSection title="Thumbnail">
                <div
                    style={{
                        background: '#fff',
                        border: `1px solid ${SIDEBAR_COLORS.border}`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 90,
                        marginTop: 8,
                    }}
                >
                    <SlideThumbnail key={thumbSrc ?? 'none'} src={thumbSrc} />
                </div>
            </SbSection>

            <SbSection title="Image Properties">
                {showImageProperties ? (
                    <MetaTable rows={wsiRows} />
                ) : (
                    <span style={{ color: '#bbb', fontSize: 11 }}>—</span>
                )}
            </SbSection>

            <SbSection title="Pathology">
                {showPathology ? (
                    <MetaTable rows={pathRows} />
                ) : (
                    <span style={{ color: '#bbb', fontSize: 11 }}>—</span>
                )}
            </SbSection>

            {(seqRows.length > 0 ||
                (sample?.oncogenic_mutations &&
                    sample?.oncogenic_mutation_details !== undefined) ||
                sample?.cna_alterations?.length ||
                sample?.structural_variants?.length) && (
                <SbSection title="MSK-IMPACT">
                    {seqRows.length > 0 && <MetaTable rows={seqRows} />}
                    {sample && <MutationTable sample={sample} />}
                    {sample?.cna_alterations?.length ? (
                        <CnaTable sample={sample} />
                    ) : null}
                    {sample?.structural_variants?.length ? (
                        <StructuralVariantTable sample={sample} />
                    ) : null}
                </SbSection>
            )}
        </div>
    );
}
