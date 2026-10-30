import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { UIMessage } from 'ai';
import {
    getExternalStoreMessages,
    TextMessagePartProvider,
    useAui,
} from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import {
    CheckIcon,
    ChevronDownIcon,
    CopyIcon,
    DownloadIcon,
    RefreshCwIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { MarkdownText } from '@/components/assistant-ui/elements/markdown-text';
import { Button } from '@/components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/ui/button-group';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { downloadTextFile } from '@/lib/download';
import { resolvePortalLink } from '@/lib/portal-link';
import {
    appendScreenshotAppendix,
    cacheReport,
    getCachedReport,
    reportKey,
    screenshotParts,
    streamReport,
} from '@/lib/report';
import { printHtml, reportHtml } from '@/lib/reportExport';

type ReportState = {
    status: 'streaming' | 'done' | 'error';
    text: string;
};

const SKELETON_WIDTHS = ['w-2/3', 'w-full', 'w-5/6', 'w-full', 'w-3/4'];

// How close to the bottom still counts as at the bottom.
const BOTTOM_SLACK_PX = 32;

// Plain markup for the HTML and PDF exports, without the chat's controls. As in
// the chat, model-written images are never loaded.
const EXPORT_COMPONENTS = {
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
        <a href={resolvePortalLink(href)?.href ?? href}>{children}</a>
    ),
    img: ({ alt }: { alt?: string }) => (alt ? <span>{alt}</span> : null),
};

type Format = 'md' | 'html' | 'pdf';

const FORMATS: { format: Format; label: string; description: string }[] = [
    {
        format: 'md',
        label: 'Markdown',
        description: 'To edit, or use in other tools',
    },
    { format: 'html', label: 'HTML', description: 'Opens in any browser' },
    {
        format: 'pdf',
        label: 'PDF',
        description: 'Save from the print dialog',
    },
];

// Generates on open, or shows the last report if the chat hasn't changed since.
// Closing stops a report still being written.
export const ReportDialog: FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    model: string | undefined;
}> = ({ open, onOpenChange, model }) => {
    const aui = useAui();
    const [state, setState] = useState<ReportState>({
        status: 'streaming',
        text: '',
    });
    const messagesRef = useRef<UIMessage[]>([]);
    const controllerRef = useRef<AbortController>();
    const scrollRef = useRef<HTMLDivElement>(null);
    // Whether to keep the newest text in view. Scrolling up turns it off;
    // scrolling back to the bottom turns it on.
    const followRef = useRef(false);
    // Where following last scrolled to. The scroll event lands a frame later,
    // when more text may have rendered below.
    const followTopRef = useRef(0);
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const exportRef = useRef<HTMLDivElement>(null);
    const [formatsOpen, setFormatsOpen] = useState(false);

    const generate = useCallback(
        (force: boolean) => {
            controllerRef.current?.abort();
            // The AI SDK messages behind the visible thread, which is what the
            // endpoint and the appendix expect.
            const messages = aui.thread
                .getState()
                .messages.flatMap(m => getExternalStoreMessages<UIMessage>(m));
            messagesRef.current = messages;
            const key = reportKey(messages, model);
            const cached = force ? undefined : getCachedReport(key);
            if (cached) {
                followRef.current = false;
                setState({ status: 'done', text: cached });
                return;
            }
            followRef.current = true;
            const controller = new AbortController();
            controllerRef.current = controller;
            setState({ status: 'streaming', text: '' });
            streamReport(messages, model, controller.signal, text =>
                setState({ status: 'streaming', text })
            )
                .then(text => {
                    cacheReport(key, text);
                    setState({ status: 'done', text });
                })
                .catch(err => {
                    if (controller.signal.aborted) return;
                    console.warn('[chat-sidebar] report failed', err);
                    // Keep whatever arrived before the failure.
                    setState(prev => ({ status: 'error', text: prev.text }));
                });
        },
        [aui, model]
    );

    useEffect(() => {
        if (!open) return;
        generate(false);
        return () => controllerRef.current?.abort();
    }, [open, generate]);

    // Follows the rendered height rather than the text, since markdown renders
    // after the text arrives.
    const followContent = useCallback((content: HTMLDivElement) => {
        const observer = new ResizeObserver(() => {
            const scroller = scrollRef.current;
            if (scroller && followRef.current) {
                scroller.scrollTop = scroller.scrollHeight;
                followTopRef.current = scroller.scrollTop;
            }
        });
        observer.observe(content);
        return () => observer.disconnect();
    }, []);

    const { status, text } = state;
    const streaming = status === 'streaming';
    const done = status === 'done';

    const download = (format: Format) => {
        setFormatsOpen(false);
        const filename = `cbioportal-research-report-${Date.now()}`;
        if (format === 'md') {
            downloadTextFile(
                `${filename}.md`,
                appendScreenshotAppendix(text, messagesRef.current)
            );
            return;
        }
        if (!exportRef.current) return;
        const html = reportHtml(exportRef.current, messagesRef.current);
        if (format === 'html') {
            downloadTextFile(`${filename}.html`, html, 'text/html');
        } else {
            printHtml(html);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[calc(100%-2rem)] flex-col gap-3 sm:max-w-[calc(100%-2rem)]">
                <DialogHeader className="pr-8">
                    <DialogTitle>Research report</DialogTitle>
                    <DialogDescription
                        className={
                            status === 'error'
                                ? 'text-destructive flex items-center gap-1.5'
                                : undefined
                        }
                    >
                        {status === 'error' ? (
                            <>
                                <TriangleAlertIcon className="size-3.5 shrink-0" />
                                {text
                                    ? 'Stopped before the report was finished.'
                                    : 'Failed to generate the report.'}
                            </>
                        ) : streaming ? (
                            <span className="shimmer motion-reduce:animate-none">
                                {text
                                    ? 'Writing the report…'
                                    : 'Reading the session…'}
                            </span>
                        ) : (
                            screenshotParts(messagesRef.current).length > 0 &&
                            'Downloads also include the chat’s screenshots.'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div
                    ref={scrollRef}
                    className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4"
                    onScroll={e => {
                        const el = e.currentTarget;
                        if (
                            el.scrollHeight - el.scrollTop - el.clientHeight <
                            BOTTOM_SLACK_PX
                        ) {
                            followRef.current = true;
                        } else if (el.scrollTop < followTopRef.current) {
                            followRef.current = false;
                        }
                    }}
                >
                    <div ref={followContent}>
                        {text ? (
                            <TextMessagePartProvider
                                text={text}
                                isRunning={streaming}
                            >
                                <MarkdownText />
                            </TextMessagePartProvider>
                        ) : (
                            streaming && (
                                <div className="flex flex-col gap-2.5 pt-1">
                                    {SKELETON_WIDTHS.map((width, i) => (
                                        <Skeleton
                                            key={i}
                                            className={`h-3.5 motion-reduce:animate-none ${width}`}
                                        />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
                {done && (
                    <div ref={exportRef} hidden>
                        <TextMessagePartProvider text={text}>
                            <MarkdownTextPrimitive
                                remarkPlugins={[remarkGfm]}
                                components={EXPORT_COMPONENTS}
                            />
                        </TextMessagePartProvider>
                    </div>
                )}
                <DialogFooter className="flex-row items-center justify-end sm:justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mr-auto"
                        onClick={() => generate(true)}
                        disabled={streaming}
                    >
                        <RefreshCwIcon />
                        {status === 'error' ? 'Retry' : 'Regenerate'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(text)}
                        disabled={status !== 'done'}
                    >
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                        Copy
                    </Button>
                    <ButtonGroup>
                        <Button
                            size="sm"
                            onClick={() => download('md')}
                            disabled={!done}
                        >
                            <DownloadIcon />
                            Download
                        </Button>
                        <ButtonGroupSeparator className="bg-primary-foreground/30" />
                        <Popover
                            open={formatsOpen}
                            onOpenChange={setFormatsOpen}
                        >
                            <PopoverTrigger
                                render={
                                    <Button
                                        size="icon-sm"
                                        aria-label="Download format"
                                        title="Download as…"
                                        disabled={!done}
                                    >
                                        <ChevronDownIcon />
                                    </Button>
                                }
                            />
                            <PopoverContent className="w-64 p-1">
                                {FORMATS.map(
                                    ({ format, label, description }) => (
                                        <button
                                            key={format}
                                            type="button"
                                            className="hover:bg-accent focus-visible:bg-accent flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left outline-none"
                                            onClick={() => download(format)}
                                        >
                                            <span className="text-sm font-medium">
                                                {label}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {description}
                                            </span>
                                        </button>
                                    )
                                )}
                            </PopoverContent>
                        </Popover>
                    </ButtonGroup>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
