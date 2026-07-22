import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { FrameStatusDisplay } from '../data/frameStatus';
import { CallerState } from '../data/productBadges';
import { CALLER_SOURCE_LEGEND } from '../data/callerSource';
import { inlineStyles } from '../FusionInfoBarStyles';

interface ProductBadgeRowProps {
    frame: FrameStatusDisplay;
    callerState: CallerState;
}

function FramePill({ frame }: { frame: FrameStatusDisplay }) {
    return (
        <DefaultTooltip
            placement="top"
            overlay={
                <div style={{ maxWidth: 260 }}>
                    <strong>Effect on frame: {frame.label}</strong>
                    <br />
                    Reflects the transcript combination currently shown.
                </div>
            }
        >
            <span
                style={{
                    ...inlineStyles.badge,
                    color: frame.color,
                    backgroundColor: frame.bg,
                    border: `1px solid ${frame.color}33`,
                    ...inlineStyles.hoverCue,
                }}
            >
                {frame.icon} {frame.label}
            </span>
        </DefaultTooltip>
    );
}

function CallerPill({ callerState }: { callerState: CallerState }) {
    if (callerState.kind === 'userSelected') {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <div style={{ maxWidth: 260 }}>
                        Showing an isoform other than the one the fusion caller
                        reported ({callerState.calledTranscriptLabel}). Frame is
                        shown only for the caller-reported isoform.
                    </div>
                }
            >
                <span
                    style={{
                        ...inlineStyles.badge,
                        color: '#777',
                        backgroundColor: '#eee',
                        border: '1px dashed #bbb',
                        ...inlineStyles.hoverCue,
                    }}
                >
                    Alternate isoform
                </span>
            </DefaultTooltip>
        );
    }

    const hasCallerLetters = callerState.callers.length > 0;
    return (
        <DefaultTooltip
            placement="top"
            overlay={
                <div style={{ maxWidth: 260 }}>
                    {hasCallerLetters ? (
                        <>
                            Fusion caller(s) that identified this event:{' '}
                            {callerState.callers.join(', ')}.
                            <br />
                            <span style={{ opacity: 0.7 }}>
                                {CALLER_SOURCE_LEGEND}
                            </span>
                        </>
                    ) : (
                        `Caller / variant class: ${callerState.rawCallMethod ||
                            '—'}`
                    )}
                </div>
            }
        >
            <span
                style={{
                    ...inlineStyles.badge,
                    ...inlineStyles.metaBadge,
                    ...inlineStyles.hoverCue,
                }}
            >
                {callerState.rawCallMethod}
            </span>
        </DefaultTooltip>
    );
}

/** Frame + caller pills, anchored under the product; dynamic on the visualized combo. */
export function ProductBadgeRow({ frame, callerState }: ProductBadgeRowProps) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                height: 22,
            }}
        >
            <FramePill frame={frame} />
            <CallerPill callerState={callerState} />
        </div>
    );
}
