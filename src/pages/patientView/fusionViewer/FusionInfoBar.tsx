import * as React from 'react';
import { observer } from 'mobx-react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { FusionViewerStore } from './FusionViewerStore';
import { TranscriptData, COLOR_5PRIME, COLOR_3PRIME } from './data/types';
import { inlineStyles } from './FusionInfoBarStyles';

interface IFusionInfoBarProps {
    store: FusionViewerStore;
}

/** A small tooltip-bearing tag pill (carries the dotted hover cue). */
function TagPill({
    label,
    color,
    backgroundColor,
    overlay,
}: {
    label: string;
    color: string;
    backgroundColor: string;
    overlay: React.ReactNode;
}) {
    return (
        <DefaultTooltip
            placement="top"
            overlay={<div style={{ maxWidth: 240 }}>{overlay}</div>}
        >
            <span
                style={{
                    ...inlineStyles.badge,
                    color,
                    backgroundColor,
                    ...inlineStyles.hoverCue,
                }}
            >
                {label}
            </span>
        </DefaultTooltip>
    );
}

function TranscriptCheckboxList({
    transcripts,
    selectedIds,
    onToggle,
    accentColor,
    primeLabel,
    isRnaDerived,
}: {
    transcripts: TranscriptData[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    accentColor: string;
    primeLabel: string;
    isRnaDerived: boolean;
}) {
    if (transcripts.length === 0) return null;

    return (
        <div style={inlineStyles.selectorWrapper}>
            <span style={{ ...inlineStyles.label, color: accentColor }}>
                {primeLabel} Transcripts
            </span>
            <div style={inlineStyles.checkboxGroup}>
                {transcripts.map(t => (
                    <label
                        key={t.transcriptId}
                        style={inlineStyles.checkboxLabel}
                    >
                        <input
                            type="checkbox"
                            style={inlineStyles.checkbox}
                            checked={selectedIds.has(t.transcriptId)}
                            onChange={() => onToggle(t.transcriptId)}
                        />
                        <span>{t.transcriptId}</span>
                        {/* "Called" = the transcript the RNA fusion caller
                            chose. Only meaningful for RNA-derived fusions; DNA
                            SVs have no caller transcript pick. */}
                        {isRnaDerived && t.isCallerSelected && (
                            <TagPill
                                label="Called"
                                color="#fff"
                                backgroundColor={accentColor}
                                overlay="The transcript the fusion caller called for this event — the one shown in the fusion table. Rendered by default."
                            />
                        )}
                        {t.isCanonical && (
                            <TagPill
                                label="MSK canonical"
                                color="#555"
                                backgroundColor="#e9ecef"
                                overlay="MSK's canonical isoform for this gene (from Genome Nexus). Default for DNA structural variants."
                            />
                        )}
                    </label>
                ))}
            </div>
        </div>
    );
}

@observer
export class FusionInfoBar extends React.Component<IFusionInfoBarProps> {
    public render() {
        const { store } = this.props;
        const fusion = store.canonicalFusion;

        if (!fusion) {
            return (
                <div style={inlineStyles.container}>
                    <span style={{ color: '#999' }}>No fusion selected</span>
                </div>
            );
        }

        const gene1 = fusion.gene1.symbol;
        const gene2 = fusion.gene2 ? fusion.gene2.symbol : 'IGR';
        const isIntergenic = fusion.gene2 === null;

        const bp1 = `chr${
            fusion.gene1.chromosome
        }:${fusion.gene1.position.toLocaleString()}`;
        const bp2 = fusion.gene2
            ? `chr${
                  fusion.gene2.chromosome
              }:${fusion.gene2.position.toLocaleString()}`
            : '';

        const selected5pIds = store.effectiveSelected5pIds;
        const selected3pIds = store.effectiveSelected3pIds;

        return (
            <div
                style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#fff',
                }}
            >
                {/* Header row: fusion name, coordinates, badges */}
                <div style={inlineStyles.container}>
                    <span style={inlineStyles.fusionName}>
                        <span style={{ color: COLOR_5PRIME }}>{gene1}</span>
                        <span style={inlineStyles.separator}>::</span>
                        <span style={{ color: COLOR_3PRIME }}>{gene2}</span>
                    </span>

                    <span style={inlineStyles.coordinates}>
                        {bp1}
                        {bp2 && ` ${'\u2192'} ${bp2}`}
                    </span>

                    <div style={inlineStyles.spacer} />

                    <div style={inlineStyles.badgeRow}>
                        {store.transcriptsLoading && (
                            <span
                                style={{
                                    ...inlineStyles.badge,
                                    ...inlineStyles.metaBadge,
                                    color: '#337ab7',
                                }}
                            >
                                loading...
                            </span>
                        )}
                        <DefaultTooltip
                            placement="top"
                            overlay={
                                <div style={{ maxWidth: 240 }}>
                                    Junction-spanning reads supporting the
                                    selected breakpoint (max across callers).
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
                                {fusion.totalReadSupport} reads
                            </span>
                        </DefaultTooltip>
                        {fusion.significance !== 'NA' && (
                            <span
                                style={{
                                    ...inlineStyles.badge,
                                    ...inlineStyles.significanceBadge,
                                }}
                            >
                                {fusion.significance}
                            </span>
                        )}
                    </div>
                </div>

                {/* Transcript selection row */}
                <div style={inlineStyles.transcriptRow}>
                    <TranscriptCheckboxList
                        transcripts={store.canonicalTranscripts5p}
                        selectedIds={selected5pIds}
                        onToggle={id => store.toggleTranscript5p(id)}
                        accentColor={COLOR_5PRIME}
                        primeLabel={'5\u2032'}
                        isRnaDerived={!!fusion.isRnaDerived}
                    />

                    {!isIntergenic && (
                        <TranscriptCheckboxList
                            transcripts={store.canonicalTranscripts3p}
                            selectedIds={selected3pIds}
                            onToggle={id => store.toggleTranscript3p(id)}
                            accentColor={COLOR_3PRIME}
                            primeLabel={'3\u2032'}
                            isRnaDerived={!!fusion.isRnaDerived}
                        />
                    )}

                    <div style={{ alignSelf: 'center', marginLeft: 16 }}>
                        <label style={inlineStyles.checkboxLabel}>
                            <input
                                type="checkbox"
                                style={inlineStyles.checkbox}
                                checked={store.showPromoter}
                                onChange={() => store.toggleShowPromoter()}
                            />
                            Show promoter
                        </label>
                    </div>

                    <span style={inlineStyles.genomeBuildLabel}>
                        {store.genomeBuild}
                    </span>
                </div>
            </div>
        );
    }
}
