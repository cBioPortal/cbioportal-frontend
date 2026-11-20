'use client';

// assistant-ui's Approval Card element (registry: elements-approval-card),
// restyled with this app's theme tokens and Button so it matches the other
// chat UI. The props are unchanged from the registry version.

import { ComponentProps, ReactNode, useId } from 'react';
import { CheckIcon, Loader2Icon, TerminalIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReceiptFocus } from './receipt-focus';

export type ApprovalState = 'request' | 'running' | 'done' | 'denied';

const receiptText: Record<Exclude<ApprovalState, 'request'>, string> = {
    running: 'Approved, running',
    done: 'Finished',
    denied: 'Denied',
};

// The same muted panel ToolFallback uses for a tool's arguments and result.
const field = 'bg-muted/50 rounded-md px-2.5 py-2';

export function ApprovalCard({
    state,
    command,
    title,
    subtitle,
    description,
    details,
    variant = 'default',
    icon,
    onAllowOnce,
    onAlwaysAllow,
    onDeny,
    allowOnceLabel = 'Allow once',
    alwaysAllowLabel = 'Always allow',
    denyLabel = 'Deny',
    statusLabel,
    className,
    ...props
}: Omit<
    ComponentProps<'div'>,
    | 'children'
    | 'state'
    | 'command'
    | 'title'
    | 'subtitle'
    | 'description'
    | 'details'
    | 'variant'
    | 'icon'
    | 'onAllowOnce'
    | 'onAlwaysAllow'
    | 'onDeny'
    | 'allowOnceLabel'
    | 'alwaysAllowLabel'
    | 'denyLabel'
    | 'statusLabel'
> & {
    state: ApprovalState;
    command?: string | undefined;
    title: string;
    subtitle: string;
    description?: string | undefined;
    details?: readonly { label: string; value: string }[] | undefined;
    variant?: 'default' | 'destructive' | undefined;
    icon?: ReactNode | undefined;
    onAllowOnce?: (() => void) | undefined;
    onAlwaysAllow?: (() => void) | undefined;
    onDeny?: (() => void) | undefined;
    allowOnceLabel?: string | undefined;
    alwaysAllowLabel?: string | undefined;
    denyLabel?: string | undefined;
    statusLabel?: string | undefined;
}) {
    const titleId = useId();
    const descriptionId = useId();
    const { receiptRef, focusHandlers } = useReceiptFocus<HTMLDivElement>(
        props
    );

    return (
        <div
            {...props}
            {...focusHandlers}
            role="group"
            data-variant={variant}
            data-slot="approval-card"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={cn(
                'bg-card text-card-foreground flex w-full max-w-sm flex-col gap-3 rounded-lg border p-3',
                className
            )}
        >
            <div className="flex items-start gap-2.5">
                {/* `icon={null}` leaves the tile out. */}
                {icon !== null && (
                    <span
                        aria-hidden
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-md',
                            variant === 'destructive'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        {icon ?? <TerminalIcon className="size-4" />}
                    </span>
                )}
                <div className="flex min-w-0 flex-col">
                    <p id={titleId} className="text-sm font-medium">
                        {title}
                    </p>
                    <p className="text-muted-foreground text-xs break-words">
                        {subtitle}
                    </p>
                </div>
            </div>

            {description ? (
                <p
                    id={descriptionId}
                    className="text-muted-foreground text-[13px]"
                >
                    {description}
                </p>
            ) : null}

            {command ? (
                <div
                    className={cn(
                        field,
                        'text-foreground/90 font-mono text-xs break-all'
                    )}
                >
                    {command}
                </div>
            ) : null}

            {details?.length ? (
                <dl className={cn(field, 'flex flex-col gap-1.5')}>
                    {details.map((detail, index) => (
                        <div
                            key={`${detail.label}-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 text-xs"
                        >
                            <dt className="text-muted-foreground font-mono">
                                {detail.label}
                            </dt>
                            <dd className="text-foreground/90 break-words">
                                {detail.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            ) : null}

            <div className="flex min-h-7 flex-wrap items-center justify-end gap-1.5">
                {state === 'request' ? (
                    <>
                        {onDeny && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                data-slot="approval-card-deny"
                                onClick={onDeny}
                            >
                                {denyLabel}
                            </Button>
                        )}
                        {onAlwaysAllow && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-slot="approval-card-always-allow"
                                onClick={onAlwaysAllow}
                            >
                                {alwaysAllowLabel}
                            </Button>
                        )}
                        {onAllowOnce && (
                            <Button
                                type="button"
                                variant={
                                    variant === 'destructive'
                                        ? 'destructive'
                                        : 'default'
                                }
                                size="sm"
                                data-slot="approval-card-allow-once"
                                onClick={onAllowOnce}
                            >
                                {allowOnceLabel}
                            </Button>
                        )}
                    </>
                ) : (
                    <div
                        key={state}
                        ref={receiptRef}
                        tabIndex={-1}
                        role="status"
                        className="fade-in animate-in text-muted-foreground flex items-center gap-1.5 text-xs duration-300 outline-none motion-reduce:animate-none"
                    >
                        {state === 'running' ? (
                            <>
                                <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-none" />
                                {statusLabel ?? receiptText.running}
                            </>
                        ) : state === 'denied' ? (
                            <>
                                <XIcon className="size-3.5" />
                                {statusLabel ?? receiptText.denied}
                            </>
                        ) : (
                            <>
                                <CheckIcon className="text-primary size-3.5" />
                                {statusLabel ?? receiptText.done}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
