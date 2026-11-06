'use client';

import {
    ComponentPropsWithoutRef,
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from 'react';
import { cva, VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export type ModelOption = {
    id: string;
    name: string;
    description?: string;
};

type ModelSelectorContextValue = {
    models: readonly ModelOption[];
    value: string | undefined;
    setValue: (value: string) => void;
    selectedModel: ModelOption | undefined;
    open: boolean;
    setOpen: (open: boolean) => void;
};

const ModelSelectorContext = createContext<ModelSelectorContextValue | null>(
    null
);

export function useModelSelectorContext() {
    const ctx = useContext(ModelSelectorContext);
    if (!ctx) {
        throw new Error(
            'ModelSelector sub-components must be used within ModelSelector.Root'
        );
    }
    return ctx;
}

export type ModelSelectorRootProps = {
    models: readonly ModelOption[];
    value: string | undefined;
    onValueChange: (value: string) => void;
    children: ReactNode;
};

function ModelSelectorRoot({
    models,
    value,
    onValueChange,
    children,
}: ModelSelectorRootProps) {
    const [open, setOpen] = useState(false);
    const selectedModel = models.find(m => m.id === value);
    const contextValue = useMemo(
        () => ({
            models,
            value,
            setValue: onValueChange,
            selectedModel,
            open,
            setOpen,
        }),
        [models, value, onValueChange, selectedModel, open]
    );

    return (
        <ModelSelectorContext.Provider value={contextValue}>
            <Popover open={open} onOpenChange={setOpen}>
                {children}
            </Popover>
        </ModelSelectorContext.Provider>
    );
}

const modelSelectorTriggerVariants = cva(
    "focus-visible:ring-ring/50 flex w-fit items-center justify-between gap-2 overflow-hidden rounded-md text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    {
        variants: {
            variant: {
                outline:
                    'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                muted:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            },
            size: {
                default: 'h-9 px-3 py-2',
                sm: 'h-8 px-2.5 py-1.5 text-xs',
                lg: 'h-10 px-4 py-2.5',
            },
        },
        defaultVariants: {
            variant: 'outline',
            size: 'default',
        },
    }
);

export type ModelSelectorTriggerProps = ComponentPropsWithoutRef<
    typeof PopoverTrigger
> &
    VariantProps<typeof modelSelectorTriggerVariants>;

function ModelSelectorTrigger({
    className,
    variant,
    size,
    children,
    onKeyDown,
    ...props
}: ModelSelectorTriggerProps) {
    const { setOpen } = useModelSelectorContext();

    return (
        <PopoverTrigger
            data-slot="model-selector-trigger"
            data-variant={variant ?? 'outline'}
            data-size={size ?? 'default'}
            role="combobox"
            aria-haspopup="listbox"
            className={cn(
                modelSelectorTriggerVariants({ variant, size }),
                className
            )}
            onKeyDown={e => {
                onKeyDown?.(e);
                if (e.defaultPrevented) return;
                // ARIA combobox: arrows open the listbox from a focused trigger.
                // Popover leaves this to the consumer.
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setOpen(true);
                }
            }}
            {...props}
        >
            {children ?? <ModelSelectorValue />}
            <ChevronDownIcon className="size-4 opacity-50" />
        </PopoverTrigger>
    );
}

export type ModelSelectorValueProps = {
    placeholder?: ReactNode;
    className?: string;
};

function ModelSelectorValue({
    placeholder = 'Select model',
    className,
}: ModelSelectorValueProps) {
    const { selectedModel } = useModelSelectorContext();

    if (!selectedModel) {
        return (
            <span
                data-slot="model-selector-value"
                className={cn('text-muted-foreground', className)}
            >
                {placeholder}
            </span>
        );
    }

    return (
        <span
            data-slot="model-selector-value"
            className={cn('flex min-w-0 items-center gap-2', className)}
        >
            <span className="truncate font-medium">{selectedModel.name}</span>
        </span>
    );
}

export type ModelSelectorContentProps = ComponentPropsWithoutRef<
    typeof PopoverContent
>;

function ModelSelectorContent({
    className,
    ...props
}: ModelSelectorContentProps) {
    const { models, value } = useModelSelectorContext();

    return (
        <PopoverContent
            data-slot="model-selector-content"
            className={cn(
                'bg-popover w-72 min-w-(--anchor-width) overflow-hidden rounded-xl p-0',
                className
            )}
            {...props}
        >
            <Command
                className="bg-transparent"
                shouldFilter={false}
                {...(value !== undefined ? { defaultValue: value } : {})}
            >
                {/* Hidden input that anchors cmdk's keyboard navigation, keeping
                    the list keyboard-operable without a visible search box. */}
                <div className="sr-only">
                    <CommandInput readOnly aria-label="Model" />
                </div>
                <CommandList
                    data-slot="model-selector-list"
                    className="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    <CommandGroup>
                        {models.map(model => (
                            <ModelSelectorItem key={model.id} model={model} />
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
    );
}

function ModelSelectorItem({ model }: { model: ModelOption }) {
    const { value, setValue, setOpen } = useModelSelectorContext();
    const isSelected = value === model.id;

    return (
        <CommandItem
            data-slot="model-selector-item"
            value={model.id}
            onSelect={() => {
                setValue(model.id);
                setOpen(false);
            }}
            className="relative items-start gap-2 rounded-lg py-2 ps-3 pe-9 [&_svg:not([class*='size-'])]:size-3.5"
        >
            <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{model.name}</span>
                {model.description && (
                    <span className="text-muted-foreground truncate text-xs">
                        {model.description}
                    </span>
                )}
            </span>
            {isSelected && (
                <span className="absolute end-3 top-2.5 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                </span>
            )}
        </CommandItem>
    );
}

export const ModelSelector = {
    Root: ModelSelectorRoot,
    Trigger: ModelSelectorTrigger,
    Value: ModelSelectorValue,
    Content: ModelSelectorContent,
};
