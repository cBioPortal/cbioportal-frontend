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
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-expanded={true}
            data-testid={testId}
            onClick={onClick}
            style={iconButtonStyle}
        >
            <i className={`fa fa-angle-double-${side}`} aria-hidden="true" />
        </button>
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
            <button
                type="button"
                title={showLabel}
                aria-label={showLabel}
                aria-expanded={false}
                data-testid={testId && `${testId}-expand`}
                onClick={onExpand}
                style={iconButtonStyle}
            >
                <i
                    className={`fa fa-angle-double-${
                        side === 'left' ? 'right' : 'left'
                    }`}
                    aria-hidden="true"
                />
            </button>
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
                    fontSize: 10,
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
