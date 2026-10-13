import * as React from 'react';
import { WSI_RAIL_WIDTH, WSI_THEME } from './wsiTheme';

/** Which edge of the layout a panel sits on. */
export type WsiPanelSide = 'left' | 'right';

const iconButtonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: '0 4px',
    color: WSI_THEME.muted,
    cursor: 'pointer',
    lineHeight: 1,
    fontSize: 13,
};

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
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-expanded={expanded}
            disabled={disabled}
            data-testid={testId}
            onClick={onClick}
            style={{
                ...iconButtonStyle,
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
 * A hidden panel: a narrow rail with a button to show it again, the panel's
 * name written vertically, and optional extra controls.
 */
export function WsiCollapsedRail({
    side,
    title,
    showLabel,
    onExpand,
    background,
    testId,
    children,
}: {
    side: WsiPanelSide;
    title: string;
    showLabel: string;
    onExpand: () => void;
    background: string;
    testId?: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            data-testid={testId}
            style={{
                width: WSI_RAIL_WIDTH,
                minWidth: WSI_RAIL_WIDTH,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                paddingTop: 8,
                background,
                [side === 'left'
                    ? 'borderRight'
                    : 'borderLeft']: `1px solid ${WSI_THEME.border}`,
            }}
        >
            <WsiIconButton
                icon={`fa-angle-double-${side === 'left' ? 'right' : 'left'}`}
                label={showLabel}
                expanded={false}
                onClick={onExpand}
                testId={testId && `${testId}-expand`}
            />
            {children}
            <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={onExpand}
                style={{
                    ...iconButtonStyle,
                    writingMode: 'vertical-rl',
                    transform: side === 'left' ? 'rotate(180deg)' : undefined,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.8px',
                    padding: '4px 0',
                }}
            >
                {title}
            </button>
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
