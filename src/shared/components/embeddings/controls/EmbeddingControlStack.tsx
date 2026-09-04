import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, makeObservable } from 'mobx';
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

    // Whether the Map/Color by/Tooltip fields controls should render at all
    // (gated by the panel while it's waiting on data needed to resolve a
    // URL-driven selection, to avoid flashing the wrong default).
    showMapColorTooltipControls: boolean;

    // Color by
    genes: Gene[];
    clinicalAttributes: ClinicalAttribute[];
    additionalGroups?: ColoringMenuOmnibarGroup[];
    selectedColoringOption?: ColoringMenuOmnibarOption;
    colorByLabel: string;
    logScale: boolean;
    logScalePossible: boolean;
    isLoading: boolean;
    mutationDataExists: boolean;
    cnaDataExists: boolean;
    svDataExists: boolean;
    mutationTypeEnabled: boolean;
    copyNumberEnabled: boolean;
    structuralVariantEnabled: boolean;
    onColoringSelectionChange: (option?: ColoringMenuOmnibarOption) => void;
    onLogScaleChange: (enabled: boolean) => void;
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

    // Pan/Select + Center + Export
    onExport: () => void;
    onCenter: () => void;
    selectionMode: 'none' | 'lasso';
    onSelectionModeChange: (mode: 'none' | 'lasso') => void;

    // Split view / close
    panelIndex: number;
    panelCount: number;
    onSplitView: () => void;
    onClosePanel: () => void;
}

type OpenRow = 'map' | 'colorBy' | 'tooltip' | null;

const BOX_STYLE: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

const ROW_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '4px 8px',
    cursor: 'pointer',
    minWidth: '150px',
    maxWidth: '220px',
};

const ROW_LABEL_STYLE: React.CSSProperties = {
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: '#888',
    lineHeight: '12px',
};

const ROW_VALUE_STYLE: React.CSSProperties = {
    fontSize: '12px',
    color: '#333',
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const POPOVER_STYLE: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 'calc(100% + 6px)',
    zIndex: 2,
    width: '260px',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    padding: '8px',
};

function summarizeTooltipFields(
    selectedFields: Set<string>,
    fieldGroups: {
        label: string;
        options: { value: string; label: string }[];
    }[]
): string {
    if (selectedFields.size === 0) {
        return 'None';
    }
    const labelsByValue = new Map<string, string>();
    fieldGroups.forEach(group =>
        group.options.forEach(opt => labelsByValue.set(opt.value, opt.label))
    );
    const labels = Array.from(selectedFields).map(
        value => labelsByValue.get(value) || value
    );
    return labels.join(', ');
}

@observer
export class EmbeddingControlStack extends React.Component<
    EmbeddingControlStackProps
> {
    @observable private openRow: OpenRow = null;
    private rootRef = React.createRef<HTMLDivElement>();

    constructor(props: EmbeddingControlStackProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleDocumentMouseDown);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
    }

    private handleDocumentMouseDown = (e: MouseEvent) => {
        if (
            this.openRow &&
            this.rootRef.current &&
            !this.rootRef.current.contains(e.target as Node)
        ) {
            this.closeRow();
        }
    };

    @action.bound
    private closeRow() {
        this.openRow = null;
    }

    private toggleRow(row: OpenRow) {
        this.openRow = this.openRow === row ? null : row;
    }

    render() {
        const {
            mapOptions,
            selectedMapOption,
            onMapChange,
            showMapColorTooltipControls,
            genes,
            clinicalAttributes,
            additionalGroups,
            selectedColoringOption,
            colorByLabel,
            logScale,
            logScalePossible,
            isLoading,
            mutationDataExists,
            cnaDataExists,
            svDataExists,
            mutationTypeEnabled,
            copyNumberEnabled,
            structuralVariantEnabled,
            onColoringSelectionChange,
            onLogScaleChange,
            onMutationTypeToggle,
            onCopyNumberToggle,
            onStructuralVariantToggle,
            tooltipFieldGroups,
            selectedTooltipFields,
            onTooltipFieldsChange,
            onExport,
            onCenter,
            selectionMode,
            onSelectionModeChange,
            panelCount,
            onSplitView,
            onClosePanel,
        } = this.props;

        const tooltipSummary = summarizeTooltipFields(
            selectedTooltipFields,
            tooltipFieldGroups
        );

        return (
            <div
                ref={this.rootRef}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontFamily: 'inherit',
                }}
            >
                {panelCount > 1 && (
                    <button
                        onClick={onClosePanel}
                        title="Close this panel"
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '18px',
                            height: '18px',
                            lineHeight: '16px',
                            padding: 0,
                            fontSize: '12px',
                            borderRadius: '50%',
                            border: '1px solid #ccc',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            zIndex: 3,
                        }}
                    >
                        ×
                    </button>
                )}

                {showMapColorTooltipControls && (
                    <div style={{ ...BOX_STYLE, position: 'relative' }}>
                        <div
                            style={ROW_STYLE}
                            onClick={() => this.toggleRow('map')}
                        >
                            <span style={ROW_LABEL_STYLE}>Map</span>
                            <span style={ROW_VALUE_STYLE}>
                                {selectedMapOption?.label || 'Select map'}
                            </span>
                        </div>
                        {this.openRow === 'map' && (
                            <div style={POPOVER_STYLE}>
                                <Select
                                    name="embedding-select"
                                    autoFocus
                                    value={selectedMapOption}
                                    onChange={(option: any) => {
                                        onMapChange(option);
                                        this.closeRow();
                                    }}
                                    options={mapOptions}
                                    isSearchable={false}
                                    styles={{
                                        menu: (base: any) => ({
                                            ...base,
                                            zIndex: 9999,
                                        }),
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {showMapColorTooltipControls && (
                    <div style={{ ...BOX_STYLE }}>
                        <div
                            style={{ ...ROW_STYLE, position: 'relative' }}
                            onClick={() => this.toggleRow('colorBy')}
                        >
                            <span style={ROW_LABEL_STYLE}>Color by</span>
                            <span style={ROW_VALUE_STYLE}>{colorByLabel}</span>
                            {this.openRow === 'colorBy' && (
                                <div
                                    style={POPOVER_STYLE}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <ColorSamplesByDropdown
                                        genes={genes}
                                        clinicalAttributes={clinicalAttributes}
                                        additionalGroups={additionalGroups}
                                        selectedOption={selectedColoringOption}
                                        logScale={logScale}
                                        hasNoQueriedGenes={true}
                                        logScalePossible={logScalePossible}
                                        isLoading={isLoading}
                                        mutationDataExists={mutationDataExists}
                                        cnaDataExists={cnaDataExists}
                                        svDataExists={svDataExists}
                                        mutationTypeEnabled={
                                            mutationTypeEnabled
                                        }
                                        copyNumberEnabled={copyNumberEnabled}
                                        structuralVariantEnabled={
                                            structuralVariantEnabled
                                        }
                                        onSelectionChange={option => {
                                            onColoringSelectionChange(option);
                                            this.closeRow();
                                        }}
                                        onLogScaleChange={onLogScaleChange}
                                        onMutationTypeToggle={
                                            onMutationTypeToggle
                                        }
                                        onCopyNumberToggle={onCopyNumberToggle}
                                        onStructuralVariantToggle={
                                            onStructuralVariantToggle
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        <div
                            style={{
                                height: '1px',
                                backgroundColor: '#eee',
                            }}
                        />
                        <div
                            style={{ ...ROW_STYLE, position: 'relative' }}
                            onClick={() => this.toggleRow('tooltip')}
                        >
                            <span style={ROW_LABEL_STYLE}>Tooltip fields</span>
                            <span style={ROW_VALUE_STYLE}>
                                {tooltipSummary}
                            </span>
                            {this.openRow === 'tooltip' && (
                                <div
                                    style={POPOVER_STYLE}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <TooltipDropdown
                                        selectedFields={selectedTooltipFields}
                                        onSelectionChange={
                                            onTooltipFieldsChange
                                        }
                                        options={tooltipFieldGroups}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        gap: '2px',
                        ...BOX_STYLE,
                        padding: '2px',
                    }}
                >
                    <button
                        onClick={() => onSelectionModeChange('none')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            backgroundColor:
                                selectionMode === 'none'
                                    ? '#007bff'
                                    : 'transparent',
                            color: selectionMode === 'none' ? 'white' : '#333',
                        }}
                        title="Pan and zoom the visualization"
                    >
                        <i
                            className="fa-regular fa-hand"
                            style={{ marginRight: '4px', fontSize: '11px' }}
                        ></i>
                        Pan
                    </button>
                    <button
                        onClick={() => onSelectionModeChange('lasso')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            backgroundColor:
                                selectionMode === 'lasso'
                                    ? '#007bff'
                                    : 'transparent',
                            color: selectionMode === 'lasso' ? 'white' : '#333',
                        }}
                        title="Draw a freeform lasso to select points"
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4,4"
                            style={{ marginRight: '4px' }}
                        >
                            <path d="M3 8c0-3 2-5 6-5s8 2 10 6c2 4 1 8-2 10s-7 2-10 0S1 13 3 8Z" />
                        </svg>
                        Select
                    </button>
                </div>

                <button
                    onClick={onCenter}
                    style={{
                        ...BOX_STYLE,
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                    }}
                >
                    Center
                </button>

                {panelCount < 4 && (
                    <button
                        onClick={onSplitView}
                        style={{
                            ...BOX_STYLE,
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                        }}
                    >
                        Split view
                    </button>
                )}

                <button
                    onClick={onExport}
                    style={{
                        ...BOX_STYLE,
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                    }}
                >
                    Export PNG
                </button>
            </div>
        );
    }
}
