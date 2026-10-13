import * as React from 'react';

/** The coloured dot that marks a stain in filters and lists. */
export function WsiStainDot({ color }: { color?: string }) {
    return (
        <i
            className="fa fa-circle"
            aria-hidden="true"
            style={{
                fontSize: 8,
                marginRight: 3,
                color,
                verticalAlign: 'middle',
            }}
        />
    );
}

export interface WsiFilterChip<K extends string> {
    key: K;
    label: React.ReactNode;
    /** Stain colour of the chip's dot (white while the chip is active). */
    color?: string;
    /** Shown after the label as `(n)`. */
    count?: number;
    disabled?: boolean;
}

/**
 * A row of filter buttons, as in the viewer's stain and match filters. The
 * caller decides what a click on an active or disabled chip does.
 */
export function WsiFilterChipGroup<K extends string>({
    chips,
    isActive,
    onSelect,
    label,
    testId,
    chipTestIdPrefix,
    style,
}: {
    chips: ReadonlyArray<WsiFilterChip<K>>;
    isActive: (key: K) => boolean;
    onSelect: (key: K) => void;
    /** The group's accessible name. */
    label: string;
    testId?: string;
    /** Chip test IDs are `${chipTestIdPrefix}-${key}`. */
    chipTestIdPrefix: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            data-testid={testId}
            className="btn-group btn-group-xs"
            style={style}
        >
            {chips.map(chip => {
                const active = isActive(chip.key);
                return (
                    <button
                        key={chip.key}
                        type="button"
                        className={`btn btn-xs ${
                            active ? 'btn-primary' : 'btn-default'
                        }`}
                        aria-pressed={active}
                        disabled={chip.disabled}
                        data-testid={`${chipTestIdPrefix}-${chip.key}`}
                        onClick={() => onSelect(chip.key)}
                    >
                        {chip.color && (
                            <WsiStainDot
                                color={active ? undefined : chip.color}
                            />
                        )}
                        {chip.label}
                        {chip.count !== undefined && (
                            <span style={{ marginLeft: 4, opacity: 0.8 }}>
                                ({chip.count.toLocaleString()})
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
