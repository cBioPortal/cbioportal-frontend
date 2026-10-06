import { FC } from 'react';
import { PanelRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestSidebarMode } from '@/lib/sidebar-mode';

// The collapsed sidebar. The iframe is only as wide as this strip and clips
// anything drawn past it, so controls here use native `title` tooltips rather
// than TooltipIconButton, and anything needing room should expand first.
//
// A click anywhere on the strip expands it. The expand button has no handler
// of its own: its click, keyboard-triggered ones included, bubbles up here.
// Other controls added to the rail should stop propagation.
//
// The host widens the strip leftward on hover, so controls are pinned to the
// right edge, where they stay put, rather than centered.
export const SidebarRail: FC = () => (
    <nav
        aria-label="Collapsed chat"
        title="Expand chat"
        onClick={() => requestSidebarMode('expanded')}
        className="group relative flex h-full cursor-pointer flex-col items-end bg-muted/40 pt-2 pr-2.5"
    >
        {/* Edge line, the same one the expanded panel's resize handle shows
            on hover. */}
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-[#a8aeb5] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        />
        <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            aria-label="Expand chat"
        >
            <PanelRightIcon />
        </Button>
    </nav>
);
