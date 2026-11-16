import * as React from 'react';

/**
 * Colors shared by the viewer panels and hosts that sit next to them. `blue` and `blueDark` are
 * cBioPortal's link and link-hover colors, so the panels read as part of the portal. The stain
 * colors are the stains' own: hematoxylin-eosin plum for H&E and DAB brown for IHC.
 */
export const WSI_THEME = {
    blue: '#3786c2',
    blueDark: '#265e87',
    blueLight: '#e8f1fb',
    orange: '#f5a623',
    stainHE: '#8c3b86',
    stainIHC: '#8a5622',
    text: '#333',
    muted: '#737373',
    border: '#ddd',
    navBg: '#fff',
    sidebarBg: '#fff',
    /** Header bars, as on the study view's chart cards. */
    headerBg: '#f5f5f5',
    /** The viewer's surround around the slide. */
    stageBg: '#e8e8e8',
    /** The label end of a slide in the slide list. */
    slideLabel: '#f5f5f5',
} as const;

export const WSI_FONT_FAMILY = '"Helvetica Neue",Helvetica,Arial,sans-serif';

export const WSI_NAV_WIDTH = 328;
export const WSI_SIDEBAR_WIDTH = 320;
export const WSI_SIDEBAR_MIN_WIDTH = 220;
export const WSI_SIDEBAR_MAX_WIDTH = 520;
/**
 * The viewer's height for a window: at most three quarters of the window's
 * width (and at least 480px), so a tall, narrow window doesn't stretch it.
 */
export function capWsiViewerHeight(
    height: number,
    windowWidth: number
): number {
    return Math.min(height, Math.max(480, Math.round(windowWidth * 0.75)));
}

/** Width of a hidden panel's rail. */
export const WSI_RAIL_WIDTH = 32;

/** Colors of the stain groups in filters and counts. */
export const WSI_STAIN_COLORS = {
    'H&E': WSI_THEME.stainHE,
    IHC: WSI_THEME.stainIHC,
    Other: WSI_THEME.muted,
    Unknown: WSI_THEME.muted,
} as const;

/** A panel's title ("Slides", "Details"), bold like the study view's chart card titles. */
export const WSI_SECTION_TITLE_STYLE: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: WSI_THEME.text,
};

/** A selectable row in a panel list; matches the viewer's slide items. */
export function wsiListItemStyle(
    selected: boolean,
    hovered: boolean
): React.CSSProperties {
    return {
        padding: '5px 8px',
        margin: '1px 4px',
        borderRadius: 3,
        cursor: 'pointer',
        background: selected || hovered ? WSI_THEME.blueLight : 'transparent',
        borderLeft: `2px solid ${selected ? WSI_THEME.blue : 'transparent'}`,
    };
}
