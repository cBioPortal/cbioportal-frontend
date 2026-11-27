import { FC, useSyncExternalStore } from 'react';
import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    formatAvailableAt,
    formatPercentUsed,
    formatWindow,
    getUsageLevel,
    getUsageState,
    subscribeToUsage,
    UsageLevel,
    UsageState,
} from '@/lib/usage';
import { cn } from '@/lib/utils';

// The allowance covers the portal's own models only; models on a user's own
// key will sit in a group of their own, without this.

export function useUsage(): UsageState | null {
    return useSyncExternalStore(subscribeToUsage, getUsageState, getUsageState);
}

const LEVEL_TEXT: Record<UsageLevel, string> = {
    normal: 'text-muted-foreground',
    warning: 'text-amber-700 dark:text-amber-400',
    limit: 'text-destructive',
};

const LEVEL_STROKE: Record<UsageLevel, string> = {
    normal: 'stroke-primary',
    warning: 'stroke-amber-500',
    limit: 'stroke-destructive',
};

const RING_SIZE = 14;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const UsageRing: FC<{ fraction: number; level: UsageLevel }> = ({
    fraction,
    level,
}) => (
    <svg
        aria-hidden="true"
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
    >
        <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            className="stroke-border"
        />
        <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
            className={LEVEL_STROKE[level]}
        />
    </svg>
);

function explanation(usage: UsageState): string {
    if (usage.availableAt) {
        return `You've used all of your usage allowance for cBioPortal models. Limit resets on ${formatAvailableAt(
            usage.availableAt
        )}.`;
    }
    const window = usage.windowHours
        ? ` over the last ${formatWindow(usage.windowHours)}`
        : '';
    return `Your usage allowance for cBioPortal models${window}.`;
}

// The model picker's heading for the portal's models, with how much of the
// allowance they have used.
export const PortalModelsHeading: FC = () => {
    const usage = useUsage();
    return (
        <div className="flex items-center justify-between gap-2">
            <span>cBioPortal models</span>
            {usage && <UsageSummary usage={usage} />}
        </div>
    );
};

const UsageSummary: FC<{ usage: UsageState }> = ({ usage }) => {
    const level = getUsageLevel(usage);
    const percent = formatPercentUsed(usage);
    const fraction = usage.availableAt
        ? 1
        : Math.min(1, Math.max(0, usage.percentUsed / 100));
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 tabular-nums',
                LEVEL_TEXT[level]
            )}
        >
            <UsageRing fraction={fraction} level={level} />
            {percent} used
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger
                        aria-label="About your usage allowance"
                        className="inline-flex rounded-sm"
                    >
                        <InfoIcon className="size-3" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        {explanation(usage)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </span>
    );
};

const BANNER_TINT: Record<Exclude<UsageLevel, 'normal'>, string> = {
    warning:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400',
    limit: 'border-destructive/30 bg-destructive/10',
};

// Joined to the top of the composer while usage needs attention; nothing
// otherwise. The composer squares its top corners while this is shown, keyed
// off `data-usage-banner`.
export const UsageBanner: FC = () => {
    const usage = useUsage();
    const level = usage ? getUsageLevel(usage) : 'normal';
    const shown = usage !== null && level !== 'normal';
    return (
        <div aria-live="polite" data-usage-banner={shown ? '' : undefined}>
            {usage && level !== 'normal' && (
                <Alert
                    role="status"
                    variant={level === 'limit' ? 'destructive' : 'default'}
                    className={cn(
                        'rounded-t-(--composer-radius) rounded-b-none border-b-0',
                        BANNER_TINT[level]
                    )}
                >
                    {level === 'limit' ? (
                        <CircleAlertIcon />
                    ) : (
                        <TriangleAlertIcon />
                    )}
                    <AlertDescription className={LEVEL_TEXT[level]}>
                        {level === 'limit' && usage.availableAt
                            ? `You've used 100% of your chat usage allowance. Limit resets on ${formatAvailableAt(
                                  usage.availableAt
                              )}.`
                            : `You've used ${formatPercentUsed(
                                  usage
                              )} of your chat usage allowance.`}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
