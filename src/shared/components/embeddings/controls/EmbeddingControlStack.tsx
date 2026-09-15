import * as React from 'react';
import Select from 'react-select';
import ColorSamplesByDropdown from 'shared/components/colorSamplesByDropdown/ColorSamplesByDropdown';
import {
    ColoringMenuOmnibarOption,
    ColoringMenuOmnibarGroup,
} from 'shared/components/plots/PlotsTabTypes';
import { Gene, ClinicalAttribute } from 'cbioportal-ts-api-client';
import { TooltipDropdown } from 'shared/components/embeddings/controls/TooltipDropdown';

export interface EmbeddingControlStackProps {
    // Map
    mapOptions: { value: string; label: string }[];
    selectedMapOption: { value: string; label: string } | null;
    onMapChange: (option: { value: string; label: string } | null) => void;

    // Gated while waiting on data to resolve a URL-driven selection, to
    // avoid flashing the wrong default.
    showMapColorTooltipControls: boolean;
    // False when EmbeddingsTab renders the Map dropdown itself instead
    // (single-panel, or multi-panel with Lock Map on). Defaults to true.
    showMapInControlStack?: boolean;

    // Color by
    genes: Gene[];
    clinicalAttributes: ClinicalAttribute[];
    additionalGroups?: ColoringMenuOmnibarGroup[];
    selectedColoringOption?: ColoringMenuOmnibarOption;
    isLoading: boolean;
    mutationDataExists: boolean;
    cnaDataExists: boolean;
    svDataExists: boolean;
    mutationTypeEnabled: boolean;
    copyNumberEnabled: boolean;
    structuralVariantEnabled: boolean;
    onColoringSelectionChange: (option?: ColoringMenuOmnibarOption) => void;
    onMutationTypeToggle: (enabled: boolean) => void;
    onCopyNumberToggle: (enabled: boolean) => void;
    onStructuralVariantToggle: (enabled: boolean) => void;

    // Tooltip fields
    tooltipFieldGroups: {
        label: string;
        options: { value: string; label: string }[];
    }[];
    selectedTooltipFields: Set<string>;
    onTooltipFieldsChange: (fields: Set<string>) => void;

    // Pan/Select lives in EmbeddingsTab's top bar, not here.
    onCenter: () => void;
    isLockedToPrimary: boolean;
    onToggleLockedToPrimary: () => void;
    isMapLocked: boolean;
    onToggleLockMap: () => void;

    // Panel count
    panelIndex: number;
    panelCount: number;
    onSetPanelCount: (target: number) => void;
}

const BOX_STYLE: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

const ROW_LABEL_STYLE: React.CSSProperties = {
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: '#888',
    lineHeight: '12px',
};

// Bordered, compact react-select look shared by Map/Color by/Tooltip.
const SELECT_STYLES = {
    control: (base: any) => ({
        ...base,
        fontSize: '12px',
        minHeight: '32px',
        boxShadow: 'none',
        border: '1px solid #ccc',
    }),
    menu: (base: any) => ({ ...base, fontSize: '12px', zIndex: 9999 }),
    container: (base: any) => ({ ...base, width: '100%' }),
    multiValue: (base: any) => ({ ...base, fontSize: '11px' }),
};

export const EmbeddingControlStack: React.FC<EmbeddingControlStackProps> = ({
    mapOptions,
    selectedMapOption,
    onMapChange,
    showMapColorTooltipControls,
    showMapInControlStack = true,
    genes,
    clinicalAttributes,
    additionalGroups,
    selectedColoringOption,
    isLoading,
    mutationDataExists,
    cnaDataExists,
    svDataExists,
    mutationTypeEnabled,
    copyNumberEnabled,
    structuralVariantEnabled,
    onColoringSelectionChange,
    onMutationTypeToggle,
    onCopyNumberToggle,
    onStructuralVariantToggle,
    tooltipFieldGroups,
    selectedTooltipFields,
    onTooltipFieldsChange,
    onCenter,
    isLockedToPrimary,
    onToggleLockedToPrimary,
    isMapLocked,
    onToggleLockMap,
    panelIndex,
    panelCount,
    onSetPanelCount,
}) => {
    // Tooltip fields/panel count are shared, so only the first panel
    // shows them.
    const isPrimaryPanel = panelIndex === 1;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontFamily: 'inherit',
                flexShrink: 0,
            }}
        >
            {showMapColorTooltipControls && showMapInControlStack && (
                <div style={{ width: '190px' }}>
                    <span style={ROW_LABEL_STYLE}>Map</span>
                    <Select
                        name="embedding-select"
                        value={selectedMapOption}
                        onChange={(option: any) => onMapChange(option)}
                        options={mapOptions}
                        isSearchable={false}
                        styles={SELECT_STYLES}
                    />
                </div>
            )}

            {showMapColorTooltipControls && (
                <div style={{ width: '190px' }}>
                    <span style={ROW_LABEL_STYLE}>Color by</span>
                    <ColorSamplesByDropdown
                        genes={genes}
                        clinicalAttributes={clinicalAttributes}
                        additionalGroups={additionalGroups}
                        selectedOption={selectedColoringOption}
                        hasNoQueriedGenes={true}
                        isLoading={isLoading}
                        mutationDataExists={mutationDataExists}
                        cnaDataExists={cnaDataExists}
                        svDataExists={svDataExists}
                        mutationTypeEnabled={mutationTypeEnabled}
                        copyNumberEnabled={copyNumberEnabled}
                        structuralVariantEnabled={structuralVariantEnabled}
                        stacked
                        onSelectionChange={onColoringSelectionChange}
                        onMutationTypeToggle={onMutationTypeToggle}
                        onCopyNumberToggle={onCopyNumberToggle}
                        onStructuralVariantToggle={onStructuralVariantToggle}
                        hideLabel
                        selectStyles={SELECT_STYLES}
                    />
                </div>
            )}

            {showMapColorTooltipControls && isPrimaryPanel && (
                <div style={{ width: '190px' }}>
                    <span style={ROW_LABEL_STYLE}>Tooltip</span>
                    <TooltipDropdown
                        selectedFields={selectedTooltipFields}
                        onSelectionChange={onTooltipFieldsChange}
                        options={tooltipFieldGroups}
                        hideLabel
                        selectStyles={SELECT_STYLES}
                    />
                </div>
            )}

            {isPrimaryPanel && (
                <div>
                    <span style={{ ...ROW_LABEL_STYLE, paddingLeft: '2px' }}>
                        Viewport
                    </span>
                    <button
                        onClick={onCenter}
                        style={{
                            ...BOX_STYLE,
                            display: 'block',
                            width: '100%',
                            marginTop: '2px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                        }}
                    >
                        Center
                    </button>
                </div>
            )}

            {isPrimaryPanel && (
                <div>
                    <span style={{ ...ROW_LABEL_STYLE, paddingLeft: '2px' }}>
                        Panels
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            gap: '2px',
                            ...BOX_STYLE,
                            padding: '2px',
                            marginTop: '2px',
                        }}
                    >
                        {[1, 2, 3, 4].map(n => (
                            <button
                                key={n}
                                data-test={`embeddings-panel-count-${n}`}
                                onClick={() => onSetPanelCount(n)}
                                title={`Show ${n} map${n > 1 ? 's' : ''}`}
                                style={{
                                    flex: 1,
                                    padding: '4px 0',
                                    fontSize: '11px',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    backgroundColor:
                                        panelCount === n
                                            ? '#007bff'
                                            : 'transparent',
                                    color: panelCount === n ? 'white' : '#333',
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    {panelCount > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '2px',
                                marginTop: '2px',
                            }}
                        >
                            <button
                                data-test="embeddings-lock-map-button"
                                onClick={onToggleLockMap}
                                title="Use the same map in every panel"
                                style={{
                                    ...BOX_STYLE,
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    backgroundColor: isMapLocked
                                        ? '#007bff'
                                        : 'rgba(255, 255, 255, 0.95)',
                                    color: isMapLocked ? 'white' : '#333',
                                    border: isMapLocked
                                        ? '1px solid #007bff'
                                        : '1px solid #ccc',
                                }}
                            >
                                Lock Map
                            </button>
                            <button
                                onClick={onToggleLockedToPrimary}
                                title="Lock every other panel's pan/zoom to this one"
                                style={{
                                    ...BOX_STYLE,
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    backgroundColor: isLockedToPrimary
                                        ? '#007bff'
                                        : 'rgba(255, 255, 255, 0.95)',
                                    color: isLockedToPrimary ? 'white' : '#333',
                                    border: isLockedToPrimary
                                        ? '1px solid #007bff'
                                        : '1px solid #ccc',
                                }}
                            >
                                Lock Viewport
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
