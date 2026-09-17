'use client';

import '@assistant-ui/react-markdown/styles/dot.css';

import {
    CodeHeaderProps,
    MarkdownTextPrimitive,
    unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
    useIsMarkdownCodeBlock,
} from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ComponentPropsWithoutRef,
    FC,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { TextMessagePartProps } from '@assistant-ui/react';
import { CheckIcon, CopyIcon, DownloadIcon } from 'lucide-react';

import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';
import { isPortalLink, notifyNavigate } from '@/lib/portal-link';
import { metaFromNode, resolveCodeFile } from '@/lib/codeFile';
import { downloadTextFile } from '@/lib/download';
import { extractTableData, tableDataToCsv } from '@/lib/tableCsv';

// The markdown container carries data-status while its part is still streaming;
// a half-written fence or table is not worth downloading.
const DISABLED_WHILE_STREAMING =
    '[[data-status=running]_&]:pointer-events-none [[data-status=running]_&]:opacity-50';

const CONFIRMATION_MS = 2000;

// Shows a check for a moment after a download, matching the copy button's
// feedback. The timer is cleared on unmount so a fast-scrolling thread does not
// set state on a gone component.
function useTransientFlag(duration = CONFIRMATION_MS) {
    const [flagged, setFlagged] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => () => clearTimeout(timeout.current), []);
    const raise = useCallback(() => {
        setFlagged(true);
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setFlagged(false), duration);
    }, [duration]);
    return [flagged, raise] as const;
}

type MarkdownTextProps = Partial<TextMessagePartProps> & {
    components?: Parameters<typeof memoizeMarkdownComponents>[0];
};

const useShallowStable = <T extends Record<string, unknown> | undefined>(
    value: T
): T => {
    const ref = useRef(value);
    if (value !== ref.current) {
        const prev = ref.current;
        const stable =
            value !== undefined &&
            prev !== undefined &&
            Object.keys(prev).length === Object.keys(value).length &&
            Object.keys(value).every(key => prev[key] === value[key]);
        if (!stable) ref.current = value;
    }
    return ref.current;
};

const MarkdownTextImpl: FC<MarkdownTextProps> = ({ components }) => {
    const stableComponents = useShallowStable(components);
    const markdownComponents = useMemo(() => {
        if (!stableComponents) return defaultComponents;
        return {
            ...defaultComponents,
            ...memoizeMarkdownComponents(stableComponents),
        };
    }, [stableComponents]);

    return (
        <MarkdownTextPrimitive
            remarkPlugins={[remarkGfm]}
            className="aui-md"
            components={markdownComponents}
            defer
        />
    );
};

export const MarkdownText = memo(MarkdownTextImpl);

// A fence with no info string parses to an empty language, which would render
// as a blank label; name the format instead.
const UNLABELED_LANGUAGE = 'text';

const CodeHeader: FC<CodeHeaderProps> = ({ language, code, node }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const [isDownloaded, markDownloaded] = useTransientFlag();

    const file = useMemo(() => resolveCodeFile(language, metaFromNode(node)), [
        language,
        node,
    ]);

    const onCopy = () => {
        if (!code || isCopied) return;
        copyToClipboard(code);
    };

    const onDownload = () => {
        if (!code) return;
        downloadTextFile(file.filename, code, file.mimeType);
        markDownloaded();
    };

    // The label doubles as the download's filename wherever the fence supplies
    // one, so what the header shows is what lands on disk.
    const label = file.named ? file.filename : language || UNLABELED_LANGUAGE;

    return (
        <div className="aui-code-header-root border-border/50 bg-muted/50 mt-3 flex items-center justify-between rounded-t-xl border border-b-0 px-3.5 py-1.5 text-xs">
            <span
                className={cn(
                    'aui-code-header-language text-muted-foreground min-w-0 truncate font-medium',
                    !file.named && 'lowercase'
                )}
                title={file.filename}
            >
                {label}
            </span>
            <div className="flex shrink-0 items-center gap-1">
                <TooltipIconButton
                    tooltip={`Download ${file.filename}`}
                    onClick={onDownload}
                    className={DISABLED_WHILE_STREAMING}
                >
                    {!isDownloaded && (
                        <DownloadIcon className="animate-in zoom-in-75 fade-in duration-150" />
                    )}
                    {isDownloaded && (
                        <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
                    )}
                </TooltipIconButton>
                <TooltipIconButton tooltip="Copy" onClick={onCopy}>
                    {!isCopied && (
                        <CopyIcon className="animate-in zoom-in-75 fade-in duration-150" />
                    )}
                    {isCopied && (
                        <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
                    )}
                </TooltipIconButton>
            </div>
        </div>
    );
};

// Query results arrive as GFM tables; downloading one as CSV needs no server
// round trip, so it is worth offering wherever a table renders.
const MarkdownTable: FC<ComponentPropsWithoutRef<'table'>> = ({
    className,
    ...props
}) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [isDownloaded, markDownloaded] = useTransientFlag();

    const onDownload = () => {
        const table = rootRef.current?.querySelector('table');
        if (!table) return;
        const data = extractTableData(table);
        if (data.headers.length === 0 && data.rows.length === 0) return;
        downloadTextFile('table.csv', tableDataToCsv(data), 'text/csv');
        markDownloaded();
    };

    return (
        // The button sits outside the scrolling element so it stays pinned to
        // the corner rather than scrolling away with a wide table.
        <div ref={rootRef} className="group/table relative my-3">
            <div className="aui-md-table-wrapper overflow-x-auto">
                <table
                    className={cn(
                        'aui-md-table w-full border-separate border-spacing-0',
                        className
                    )}
                    {...props}
                />
            </div>
            <div className="absolute end-1 top-1 opacity-0 transition-opacity group-hover/table:opacity-100 focus-within:opacity-100">
                <TooltipIconButton
                    tooltip="Download CSV"
                    onClick={onDownload}
                    className={cn(
                        'bg-background/80 backdrop-blur',
                        DISABLED_WHILE_STREAMING
                    )}
                >
                    {!isDownloaded && <DownloadIcon />}
                    {isDownloaded && (
                        <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
                    )}
                </TooltipIconButton>
            </div>
        </div>
    );
};

const memoizedComponents = memoizeMarkdownComponents({
    h1: ({ className, ...props }) => (
        <h1
            className={cn(
                'aui-md-h1 mt-5 mb-2 scroll-m-20 text-xl font-semibold first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    h2: ({ className, ...props }) => (
        <h2
            className={cn(
                'aui-md-h2 mt-5 mb-2 scroll-m-20 text-lg font-semibold first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    h3: ({ className, ...props }) => (
        <h3
            className={cn(
                'aui-md-h3 mt-4 mb-1.5 scroll-m-20 text-base font-semibold first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    h4: ({ className, ...props }) => (
        <h4
            className={cn(
                'aui-md-h4 mt-3.5 mb-1 scroll-m-20 text-base font-medium first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    h5: ({ className, ...props }) => (
        <h5
            className={cn(
                'aui-md-h5 mt-3 mb-1 text-sm font-semibold first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    h6: ({ className, ...props }) => (
        <h6
            className={cn(
                'aui-md-h6 mt-3 mb-1 text-sm font-medium first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    p: ({ className, ...props }) => (
        <p
            className={cn(
                'aui-md-p my-3 leading-relaxed first:mt-0 last:mb-0',
                className
            )}
            {...props}
        />
    ),
    a: ({ className, href, children, ...props }) => {
        if (isPortalLink(href)) {
            return (
                <a
                    className={cn(
                        'aui-md-a text-primary hover:text-primary/80 underline underline-offset-2',
                        className
                    )}
                    href={href}
                    onClick={e => {
                        e.preventDefault();
                        notifyNavigate(href!);
                    }}
                    {...props}
                >
                    {children}
                </a>
            );
        }
        return (
            <a
                className={cn(
                    'aui-md-a text-primary hover:text-primary/80 underline underline-offset-2',
                    className
                )}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
            >
                {children}
            </a>
        );
    },
    blockquote: ({ className, ...props }) => (
        <blockquote
            className={cn(
                'aui-md-blockquote border-muted-foreground/30 text-muted-foreground my-3 border-s-2 ps-4',
                className
            )}
            {...props}
        />
    ),
    ul: ({ className, ...props }) => (
        <ul
            className={cn(
                'aui-md-ul marker:text-muted-foreground my-3 ms-5 list-disc [&>li]:mt-1',
                className
            )}
            {...props}
        />
    ),
    ol: ({ className, ...props }) => (
        <ol
            className={cn(
                'aui-md-ol marker:text-muted-foreground my-3 ms-5 list-decimal [&>li]:mt-1',
                className
            )}
            {...props}
        />
    ),
    hr: ({ className, ...props }) => (
        <hr
            className={cn(
                'aui-md-hr border-muted-foreground/20 my-3',
                className
            )}
            {...props}
        />
    ),
    table: MarkdownTable,
    th: ({ className, ...props }) => (
        <th
            className={cn(
                'aui-md-th bg-muted px-3 py-1.5 text-start font-medium first:rounded-ss-lg last:rounded-se-lg [[align=center]]:text-center [[align=right]]:text-right',
                className
            )}
            {...props}
        />
    ),
    td: ({ className, ...props }) => (
        <td
            className={cn(
                'aui-md-td border-muted-foreground/20 border-s border-b px-3 py-1.5 text-start last:border-e [[align=center]]:text-center [[align=right]]:text-right',
                className
            )}
            {...props}
        />
    ),
    tr: ({ className, ...props }) => (
        <tr
            className={cn(
                'aui-md-tr m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-es-lg [&:last-child>td:last-child]:rounded-ee-lg',
                className
            )}
            {...props}
        />
    ),
    li: ({ className, ...props }) => (
        <li className={cn('aui-md-li leading-relaxed', className)} {...props} />
    ),
    strong: ({ className, ...props }) => (
        <strong
            className={cn('aui-md-strong font-semibold', className)}
            {...props}
        />
    ),
    sup: ({ className, ...props }) => (
        <sup
            className={cn(
                'aui-md-sup [&>a]:text-xs [&>a]:no-underline',
                className
            )}
            {...props}
        />
    ),
    pre: ({ className, ...props }) => (
        <pre
            className={cn(
                'aui-md-pre border-border/50 bg-muted/30 overflow-x-auto rounded-t-none rounded-b-xl border border-t-0 p-3.5 text-[13px] leading-relaxed',
                className
            )}
            {...props}
        />
    ),
    code: function Code({ className, ...props }) {
        const isCodeBlock = useIsMarkdownCodeBlock();
        return (
            <code
                className={cn(
                    !isCodeBlock &&
                        'aui-md-inline-code bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.85em]',
                    className
                )}
                {...props}
            />
        );
    },
});

// CodeHeader is merged in after memoization rather than through it:
// memoizeMarkdownComponents strips `node` from every component it wraps, and a
// fence's info string — where a named filename lives — is only on node.data.meta.
const defaultComponents = {
    ...memoizedComponents,
    CodeHeader,
};
