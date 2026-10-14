import * as React from 'react';
import { WSI_RAIL_WIDTH, WSI_SECTION_TITLE_STYLE, WSI_THEME } from './wsiTheme';

/** Which edge of the layout a panel sits on. */
export type WsiPanelSide = 'left' | 'right';

/** Browser-stored hidden state of the viewer's slide list and details sidebar. */
export const WSI_NAV_COLLAPSED_KEY = 'wsi.viewer.navCollapsed';
export const WSI_METADATA_COLLAPSED_KEY = 'wsi.viewer.metadataCollapsed';

const ICON_BUTTON_SIZE = 22;

/** A borderless, icon-only button labelled by its tooltip. */
export function WsiIconButton({
    icon,
    label,
    onClick,
    disabled,
    expanded,
    testId,
}: {
    /** Font Awesome icon class, e.g. `fa-chevron-up`. */
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    /** `aria-expanded`, for buttons that show or hide a panel. */
    expanded?: boolean;
    testId?: string;
}) {
    const [hovered, setHovered] = React.useState(false);
    const active = hovered && !disabled;
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-expanded={expanded}
            disabled={disabled}
            data-testid={testId}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: ICON_BUTTON_SIZE,
                height: ICON_BUTTON_SIZE,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                borderRadius: 3,
                background: active ? 'rgba(0,0,0,0.07)' : 'transparent',
                color: active ? WSI_THEME.text : WSI_THEME.muted,
                lineHeight: 1,
                fontSize: 13,
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'default' : 'pointer',
            }}
        >
            <i className={`fa ${icon}`} aria-hidden="true" />
        </button>
    );
}

/** Header button that hides a panel toward its edge. */
export function WsiPanelHideButton({
    side,
    label,
    onClick,
    testId,
}: {
    side: WsiPanelSide;
    label: string;
    onClick: () => void;
    testId?: string;
}) {
    return (
        <WsiIconButton
            icon={`fa-angle-double-${side}`}
            label={label}
            expanded={true}
            onClick={onClick}
            testId={testId}
        />
    );
}

/**
 * The title row every side panel starts with: its name, an optional detail
 * such as a count, and the button that hides it.
 */
export function WsiPanelHeader({
    title,
    detail,
    side,
    hideLabel,
    onHide,
    hideTestId,
    detailTestId,
}: {
    title: string;
    detail?: React.ReactNode;
    side: WsiPanelSide;
    hideLabel: string;
    /** Unset, the panel can't be hidden and shows no button. */
    onHide?: () => void;
    hideTestId?: string;
    detailTestId?: string;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                minHeight: ICON_BUTTON_SIZE,
            }}
        >
            <div style={{ ...WSI_SECTION_TITLE_STYLE, minWidth: 0 }}>
                {title}
                {detail !== undefined && (
                    <span
                        data-testid={detailTestId}
                        style={{
                            marginLeft: 5,
                            fontWeight: 400,
                            letterSpacing: 0,
                        }}
                    >
                        {detail}
                    </span>
                )}
            </div>
            {onHide && (
                <WsiPanelHideButton
                    side={side}
                    label={hideLabel}
                    onClick={onHide}
                    testId={hideTestId}
                />
            )}
        </div>
    );
}

/** One hidden panel on a collapsed rail. */
export interface WsiRailSection {
    title: string;
    /** Shown after the title, e.g. a count. */
    detail?: string;
    /** Color of a stripe along the section, e.g. the selected slide's stain. */
    accent?: string;
    /** Name of the action that shows the panel again. */
    expandLabel: string;
    onExpand: () => void;
    /** The section's test ID; its show button is `${testId}-expand`. */
    testId?: string;
    /** Extra controls under the title, such as previous and next. */
    controls?: React.ReactNode;
}

function RailSection({
    section,
    side,
    wrapperTestId,
    fill,
}: {
    section: WsiRailSection;
    side: WsiPanelSide;
    /** Test ID of the section's own wrapper; unset when the rail has it. */
    wrapperTestId?: string;
    /** Takes the rest of the rail's height, so the whole rail is a target. */
    fill: boolean;
}) {
    const [hovered, setHovered] = React.useState(false);
    const { title, detail, accent, expandLabel, onExpand, testId } = section;
    return (
        <div
            data-testid={wrapperTestId}
            onClick={onExpand}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={expandLabel}
            style={{
                flex: fill ? 1 : undefined,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '6px 0 10px',
                cursor: 'pointer',
                background: hovered ? WSI_THEME.blueLight : 'transparent',
                boxShadow: accent
                    ? `inset ${side === 'left' ? 3 : -3}px 0 0 ${accent}`
                    : undefined,
                transition: 'background 120ms',
            }}
        >
            <button
                type="button"
                aria-label={expandLabel}
                aria-expanded={false}
                data-testid={testId && `${testId}-expand`}
                onClick={event => {
                    event.stopPropagation();
                    onExpand();
                }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '2px 0',
                    border: 'none',
                    background: 'transparent',
                    color: hovered ? WSI_THEME.blueDark : WSI_THEME.muted,
                    cursor: 'pointer',
                }}
            >
                <i
                    className={`fa fa-angle-double-${
                        side === 'left' ? 'right' : 'left'
                    }`}
                    aria-hidden="true"
                    style={{ fontSize: 14 }}
                />
                <span
                    style={{
                        writingMode: 'vertical-rl',
                        transform:
                            side === 'left' ? 'rotate(180deg)' : undefined,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.8px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {title}
                    {detail && (
                        <span
                            style={{
                                fontWeight: 400,
                                letterSpacing: 0,
                                textTransform: 'none',
                            }}
                        >
                            {' · '}
                            {detail}
                        </span>
                    )}
                </span>
            </button>
            {section.controls && (
                <div
                    onClick={event => event.stopPropagation()}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    {section.controls}
                </div>
            )}
        </div>
    );
}

/**
 * Hidden panels on one edge: a narrow rail with a section per panel. A
 * section shows the panel's name and detail written vertically, and a click
 * anywhere on it shows the panel again. `leadingSections` come first, so a
 * host can merge its own hidden panel into the viewer's rail.
 */
export function WsiCollapsedRail({
    side,
    title,
    detail,
    accent,
    showLabel,
    onExpand,
    background,
    testId,
    leadingSections = [],
    children,
}: {
    side: WsiPanelSide;
    title: string;
    detail?: string;
    accent?: string;
    showLabel: string;
    onExpand: () => void;
    background: string;
    testId?: string;
    leadingSections?: ReadonlyArray<WsiRailSection>;
    /** Extra controls under the rail's own title. */
    children?: React.ReactNode;
}) {
    const own: WsiRailSection = {
        title,
        detail,
        accent,
        expandLabel: showLabel,
        onExpand,
        testId,
        controls: children,
    };
    return (
        <div
            data-testid={testId}
            style={{
                width: WSI_RAIL_WIDTH,
                minWidth: WSI_RAIL_WIDTH,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                background,
                [side === 'left'
                    ? 'borderRight'
                    : 'borderLeft']: `1px solid ${WSI_THEME.border}`,
            }}
        >
            {leadingSections.map((section, index) => (
                <React.Fragment key={section.testId || index}>
                    <RailSection
                        section={section}
                        side={side}
                        wrapperTestId={section.testId}
                        fill={false}
                    />
                    <div
                        style={{
                            height: 1,
                            margin: '0 5px',
                            background: WSI_THEME.border,
                        }}
                    />
                </React.Fragment>
            ))}
            <RailSection section={own} side={side} fill={true} />
        </div>
    );
}

/** Reads a stored panel flag; false when storage is missing or blocked. */
export function readWsiPanelFlag(key: string): boolean {
    try {
        return window.localStorage.getItem(key) === '1';
    } catch (e) {
        return false;
    }
}

/** Stores a panel flag; storage failures are ignored. */
export function writeWsiPanelFlag(key: string, value: boolean): void {
    try {
        if (value) {
            window.localStorage.setItem(key, '1');
        } else {
            window.localStorage.removeItem(key);
        }
    } catch (e) {
        // Blocked storage only loses the remembered state.
    }
}

/**
 * A panel flag remembered in browser storage, such as a section's hidden or
 * open state.
 */
export function useWsiPanelFlag(
    key: string
): [boolean, (value: boolean) => void] {
    const [value, setValue] = React.useState(() => readWsiPanelFlag(key));
    const update = React.useCallback(
        (next: boolean) => {
            setValue(next);
            writeWsiPanelFlag(key, next);
        },
        [key]
    );
    return [value, update];
}
