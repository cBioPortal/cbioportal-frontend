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
    navBg: '#fafafa',
    sidebarBg: '#f5f5f5',
    /** The viewer's surround, dark like a light box so the glass stands out. */
    stageBg: '#2b2d31',
    stageText: '#e4e4e4',
    stageMuted: '#a3a6ab',
    /** The frosted label end of a glass slide. */
    slideLabel: '#f3f1ec',
} as const;

export type WsiTheme = { [K in keyof typeof WSI_THEME]: string };

export const WSI_FONT_FAMILY = '"Helvetica Neue",Helvetica,Arial,sans-serif';

/** Accession-style text: sample IDs, block labels and readouts. */
export const WSI_MONO_FONT_FAMILY =
    'Menlo,Consolas,"DejaVu Sans Mono","Liberation Mono",monospace';

export const WSI_NAV_WIDTH = 328;
export const WSI_SIDEBAR_WIDTH = 320;
export const WSI_SIDEBAR_MIN_WIDTH = 220;
export const WSI_SIDEBAR_MAX_WIDTH = 520;
/** Width of a hidden panel's rail. */
export const WSI_RAIL_WIDTH = 32;

/** Colors of the stain groups in filters and counts. */
export const WSI_STAIN_COLORS = {
    'H&E': WSI_THEME.stainHE,
    IHC: WSI_THEME.stainIHC,
    Other: WSI_THEME.muted,
    Unknown: WSI_THEME.muted,
} as const;

/** Uppercase panel section title ("Slides", "Image Properties"). */
export const WSI_SECTION_TITLE_STYLE: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: WSI_THEME.muted,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
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
