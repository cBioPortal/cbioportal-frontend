'use client';

import { memo, useCallback, useRef, useState } from 'react';
import {
    ChevronDownIcon,
    LoaderIcon,
    WrenchIcon,
    XCircleIcon,
} from 'lucide-react';
import {
    useScrollLock,
    useToolCallElapsed,
    ToolCallMessagePartStatus,
    ToolCallMessagePartComponent,
} from '@assistant-ui/react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const ANIMATION_DURATION = 200;

export type ToolFallbackRootProps = Omit<
    React.ComponentProps<typeof Collapsible>,
    'open' | 'onOpenChange'
> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
};

function ToolFallbackRoot({
    className,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    defaultOpen = false,
    children,
    ...props
}: ToolFallbackRootProps) {
    const collapsibleRef = useRef<HTMLDivElement>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const handleOpenChange = useCallback(
        (open: boolean) => {
            lockScroll();
            if (!isControlled) {
                setUncontrolledOpen(open);
            }
            controlledOnOpenChange?.(open);
        },
        [lockScroll, isControlled, controlledOnOpenChange]
    );

    return (
        <Collapsible
            ref={collapsibleRef}
            data-slot="tool-fallback-root"
            open={isOpen}
            onOpenChange={handleOpenChange}
            className={cn(
                'aui-tool-fallback-root group/tool-fallback-root w-full',
                className
            )}
            style={
                {
                    '--animation-duration': `${ANIMATION_DURATION}ms`,
                } as React.CSSProperties
            }
            {...props}
        >
            {children}
        </Collapsible>
    );
}

type ToolStatus = ToolCallMessagePartStatus['type'];

const statusIconMap: Record<ToolStatus, React.ElementType> = {
    running: LoaderIcon,
    complete: WrenchIcon,
    incomplete: XCircleIcon,
    'requires-action': XCircleIcon,
};

// No tool here waits on the user, so a call left awaiting a result
// (requires-action) is one whose reply was stopped mid-tool: shown as cancelled.
const isCancelledStatus = (status?: ToolCallMessagePartStatus) =>
    status?.type === 'requires-action' ||
    (status?.type === 'incomplete' && status.reason === 'cancelled');

const formatToolDuration = (ms: number) => {
    if (ms < 1000) return '<1s';
    const seconds = ms / 1000;
    if (seconds < 10) return `${(Math.floor(seconds * 10) / 10).toFixed(1)}s`;
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
};

function ToolFallbackDuration({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    const elapsedMs = useToolCallElapsed();
    if (elapsedMs === undefined) return null;

    return (
        <span
            data-slot="tool-fallback-duration"
            className={cn(
                'aui-tool-fallback-duration text-muted-foreground text-xs tabular-nums',
                className
            )}
            {...props}
        >
            {formatToolDuration(elapsedMs)}
        </span>
    );
}

function ToolFallbackTrigger({
    toolName,
    status,
    className,
    ...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
    toolName: string;
    status?: ToolCallMessagePartStatus;
}) {
    const statusType = status?.type ?? 'complete';
    const isRunning = statusType === 'running';
    const isCancelled = isCancelledStatus(status);

    const Icon = statusIconMap[statusType];
    const label = isCancelled
        ? 'Cancelled tool'
        : isRunning
        ? 'Using tool'
        : 'Used tool';

    return (
        <CollapsibleTrigger
            data-slot="tool-fallback-trigger"
            className={cn(
                'aui-tool-fallback-trigger group/trigger text-muted-foreground hover:text-foreground flex w-fit origin-left items-center gap-2 py-1.5 text-sm transition-[color,scale] active:scale-[0.98]',
                className
            )}
            {...props}
        >
            <Icon
                data-slot="tool-fallback-trigger-icon"
                className={cn(
                    'aui-tool-fallback-trigger-icon size-4 shrink-0',
                    isCancelled && 'text-muted-foreground',
                    isRunning && 'animate-spin [animation-duration:0.6s]'
                )}
            />
            <span
                data-slot="tool-fallback-trigger-label"
                className={cn(
                    'aui-tool-fallback-trigger-label-wrapper inline-block text-start leading-none',
                    isCancelled && 'text-muted-foreground line-through',
                    isRunning && 'shimmer motion-reduce:animate-none'
                )}
            >
                {label}: <b>{toolName}</b>
            </span>
            <ToolFallbackDuration />
            <ChevronDownIcon
                data-slot="tool-fallback-trigger-chevron"
                className={cn(
                    'aui-tool-fallback-trigger-chevron size-4 shrink-0',
                    'transition-transform duration-(--animation-duration) ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                    '-rotate-90',
                    'group-data-open/trigger:rotate-0',
                    'group-data-panel-open/trigger:rotate-0'
                )}
            />
        </CollapsibleTrigger>
    );
}

function ToolFallbackContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
    return (
        <CollapsibleContent
            data-slot="tool-fallback-content"
            className={cn(
                'aui-tool-fallback-content relative overflow-hidden text-sm outline-none',
                'group/collapsible-content ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none',
                'data-closed:animate-collapsible-up',
                'data-open:animate-collapsible-down',
                'data-closed:fill-mode-forwards',
                'data-closed:pointer-events-none',
                '[--tw-duration:var(--animation-duration)]',
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    'flex flex-col gap-2 ps-6 pt-1 pb-2 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none',
                    'group-data-open/collapsible-content:animate-in group-data-open/collapsible-content:fade-in-0 group-data-open/collapsible-content:blur-in-[2px] group-data-open/collapsible-content:slide-in-from-top-1',
                    'group-data-closed/collapsible-content:animate-out group-data-closed/collapsible-content:fade-out-0 group-data-closed/collapsible-content:blur-out-[2px] group-data-closed/collapsible-content:slide-out-to-top-1',
                    'group-data-closed/collapsible-content:animation-duration-(--animation-duration) group-data-open/collapsible-content:animation-duration-(--animation-duration)'
                )}
            >
                {children}
            </div>
        </CollapsibleContent>
    );
}

function ToolFallbackArgs({
    argsText,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    argsText?: string;
}) {
    if (!argsText) return null;

    return (
        <div
            data-slot="tool-fallback-args"
            className={cn('aui-tool-fallback-args', className)}
            {...props}
        >
            <pre className="aui-tool-fallback-args-value bg-muted/50 text-foreground/90 rounded-md p-2.5 text-xs whitespace-pre-wrap">
                {argsText}
            </pre>
        </div>
    );
}

function ToolFallbackResult({
    result,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    result?: unknown;
}) {
    if (result === undefined) return null;

    return (
        <div
            data-slot="tool-fallback-result"
            className={cn('aui-tool-fallback-result', className)}
            {...props}
        >
            <p className="aui-tool-fallback-result-header text-muted-foreground text-xs font-medium">
                Result:
            </p>
            <pre className="aui-tool-fallback-result-content bg-muted/50 text-foreground/90 mt-1 rounded-md p-2.5 text-xs whitespace-pre-wrap">
                {typeof result === 'string'
                    ? result
                    : JSON.stringify(result, null, 2)}
            </pre>
        </div>
    );
}

function ToolFallbackError({
    status,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    status?: ToolCallMessagePartStatus;
}) {
    if (status?.type !== 'incomplete') return null;

    const error = status.error;
    const errorText = error
        ? typeof error === 'string'
            ? error
            : JSON.stringify(error)
        : null;

    if (!errorText) return null;

    const isCancelled = status.reason === 'cancelled';
    const headerText = isCancelled ? 'Cancelled reason:' : 'Error:';

    return (
        <div
            data-slot="tool-fallback-error"
            className={cn('aui-tool-fallback-error', className)}
            {...props}
        >
            <p className="aui-tool-fallback-error-header text-muted-foreground font-semibold">
                {headerText}
            </p>
            <p className="aui-tool-fallback-error-reason text-muted-foreground">
                {errorText}
            </p>
        </div>
    );
}

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
    toolName,
    argsText,
    result,
    status,
}) => {
    const isCancelled = isCancelledStatus(status);

    return (
        <ToolFallbackRoot>
            <ToolFallbackTrigger toolName={toolName} status={status} />
            <ToolFallbackContent>
                <ToolFallbackError status={status} />
                <ToolFallbackArgs
                    argsText={argsText}
                    className={cn(isCancelled && 'opacity-60')}
                />
                {!isCancelled && <ToolFallbackResult result={result} />}
            </ToolFallbackContent>
        </ToolFallbackRoot>
    );
};

const ToolFallback = (memo(
    ToolFallbackImpl
) as unknown) as ToolCallMessagePartComponent & {
    Root: typeof ToolFallbackRoot;
    Trigger: typeof ToolFallbackTrigger;
    Content: typeof ToolFallbackContent;
    Args: typeof ToolFallbackArgs;
    Result: typeof ToolFallbackResult;
    Error: typeof ToolFallbackError;
};

ToolFallback.displayName = 'ToolFallback';
ToolFallback.Root = ToolFallbackRoot;
ToolFallback.Trigger = ToolFallbackTrigger;
ToolFallback.Content = ToolFallbackContent;
ToolFallback.Args = ToolFallbackArgs;
ToolFallback.Result = ToolFallbackResult;
ToolFallback.Error = ToolFallbackError;

export {
    ToolFallback,
    ToolFallbackRoot,
    ToolFallbackTrigger,
    ToolFallbackContent,
    ToolFallbackArgs,
    ToolFallbackResult,
    ToolFallbackError,
};
