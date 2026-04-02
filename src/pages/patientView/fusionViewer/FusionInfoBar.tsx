import * as React from 'react';
import { observer } from 'mobx-react';
import { FusionViewerStore } from './FusionViewerStore';
import { TranscriptData, COLOR_5PRIME, COLOR_3PRIME } from './data/types';
import { GenomeBuild } from './data/genomeNexusTranscriptService';
import { inlineStyles } from './FusionInfoBarStyles';

interface IFusionInfoBarProps {
    store: FusionViewerStore;
}

const FORTE_STAR = '\u2605';

function GenomeBuildToggle({
    currentBuild,
    onChange,
}: {
    currentBuild: GenomeBuild;
    onChange: (build: GenomeBuild) => void;
}) {
    const builds: GenomeBuild[] = ['GRCh38', 'GRCh37'];
    return (
        <div style={inlineStyles.buildToggle}>
            {builds.map(build => (
                <button
                    key={build}
                    style={{
                        ...inlineStyles.buildButton,
                        ...(build === currentBuild
                            ? inlineStyles.buildButtonActive
                            : {}),
                    }}
                    onClick={() => onChange(build)}
                >
                    {build}
                </button>
            ))}
        </div>
    );
}

function TranscriptCheckboxList({
    transcripts,
    selectedIds,
    onToggle,
    accentColor,
    primeLabel,
}: {
    transcripts: TranscriptData[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    accentColor: string;
    primeLabel: string;
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
                        <span>
                            {t.transcriptId}{' '}
                            <span style={{ color: '#999' }}>
                                ({t.displayName})
                            </span>
                        </span>
                        {t.isForteSelected && (
                            <span style={inlineStyles.forteStar}>
                                {FORTE_STAR}
                            </span>
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
        const fusion = store.selectedFusion;

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

        const selected5pIds = new Set(store.selectedTranscript5pIds);
        const selected3pIds = new Set(store.selectedTranscript3pIds);

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
                        <span
                            style={{
                                ...inlineStyles.badge,
                                ...inlineStyles.metaBadge,
                            }}
                        >
                            {fusion.totalReadSupport} reads
                        </span>
                        <span
                            style={{
                                ...inlineStyles.badge,
                                ...inlineStyles.metaBadge,
                            }}
                        >
                            {fusion.callMethod}
                        </span>
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
                        transcripts={store.gene1Transcripts}
                        selectedIds={selected5pIds}
                        onToggle={id => store.toggleTranscript5p(id)}
                        accentColor={COLOR_5PRIME}
                        primeLabel={'5\u2032'}
                    />

                    {!isIntergenic && (
                        <TranscriptCheckboxList
                            transcripts={store.gene2Transcripts}
                            selectedIds={selected3pIds}
                            onToggle={id => store.toggleTranscript3p(id)}
                            accentColor={COLOR_3PRIME}
                            primeLabel={'3\u2032'}
                        />
                    )}

                    <GenomeBuildToggle
                        currentBuild={store.genomeBuild}
                        onChange={build => store.setGenomeBuild(build)}
                    />
                </div>
            </div>
        );
    }
}
