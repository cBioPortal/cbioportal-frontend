'use client';

import { useCallback, useRef, useState, ReactNode } from 'react';
import { ChevronDownIcon, LoaderIcon } from 'lucide-react';
import { useScrollLock } from '@assistant-ui/react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const ANIMATION_DURATION = 200;

export type ToolGroupRootProps = Omit<
    React.ComponentProps<typeof Collapsible>,
    'open' | 'onOpenChange'
> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
};

function ToolGroupRoot({
    className,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    defaultOpen = false,
    children,
    ...props
}: ToolGroupRootProps) {
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
            data-slot="tool-group-root"
            open={isOpen}
            onOpenChange={handleOpenChange}
            className={cn('aui-tool-group-root w-full', className)}
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

// `label` replaces the default "N tool calls"; `icon` shows in place of the
// loader while not active.
function ToolGroupTrigger({
    count = 0,
    active = false,
    label = `${count} tool ${count === 1 ? 'call' : 'calls'}`,
    icon,
    className,
    ...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
    count?: number;
    active?: boolean;
    label?: ReactNode;
    icon?: ReactNode;
}) {
    return (
        <CollapsibleTrigger
            data-slot="tool-group-trigger"
            className={cn(
                'aui-tool-group-trigger group/trigger text-muted-foreground hover:text-foreground flex origin-left items-center gap-2 py-1.5 text-sm transition-[color,scale] active:scale-[0.98]',
                className
            )}
            {...props}
        >
            {active ? (
                <LoaderIcon
                    data-slot="tool-group-trigger-loader"
                    className="aui-tool-group-trigger-loader size-3 shrink-0 animate-spin [animation-duration:0.6s]"
                />
            ) : (
                icon
            )}
            <span
                data-slot="tool-group-trigger-label"
                className={cn(
                    'aui-tool-group-trigger-label-wrapper inline-block text-start text-xs leading-none font-normal',
                    active && 'shimmer motion-reduce:animate-none'
                )}
            >
                {label}
            </span>
            <ChevronDownIcon
                data-slot="tool-group-trigger-chevron"
                className={cn(
                    'aui-tool-group-trigger-chevron size-3 shrink-0',
                    'transition-transform duration-(--animation-duration) ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                    '-rotate-90',
                    'group-data-open/trigger:rotate-0',
                    'group-data-panel-open/trigger:rotate-0'
                )}
            />
        </CollapsibleTrigger>
    );
}

function ToolGroupContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
    return (
        <CollapsibleContent
            data-slot="tool-group-content"
            className={cn(
                'aui-tool-group-content relative overflow-hidden text-sm outline-none',
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
                    'mt-1 flex flex-col gap-1',
                    '[&>*]:animate-in [&>*]:fade-in-0 [&>*]:blur-in-[2px] [&>*]:slide-in-from-top-1 [&>*]:animation-duration-(--animation-duration) [&>*]:ease-[cubic-bezier(0.32,0.72,0,1)]',
                    '[&>*]:motion-reduce:animate-none',
                    '[&>*:nth-child(2)]:[animation-delay:40ms]',
                    '[&>*:nth-child(3)]:[animation-delay:80ms]',
                    '[&>*:nth-child(4)]:[animation-delay:120ms]',
                    '[&>*:nth-child(n+5)]:[animation-delay:160ms]'
                )}
            >
                {children}
            </div>
        </CollapsibleContent>
    );
}

export { ToolGroupRoot, ToolGroupTrigger, ToolGroupContent };
