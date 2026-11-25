import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable, when } from 'mobx';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { If, Then, Else } from 'react-if';
import _ from 'lodash';
import LabeledCheckbox from '../labeledCheckbox/LabeledCheckbox';
import {
    ColoringMenuOmnibarOption,
    ColoringMenuOmnibarGroup,
    NONE_SELECTED_OPTION_NUMERICAL_VALUE,
} from '../../components/plots/PlotsTabTypes';
import { ClinicalAttribute, Gene } from 'cbioportal-ts-api-client';
import { SpecialAttribute } from '../../cache/ClinicalDataCache';
import { GeneColoringSuggestions } from '../embeddings/EmbeddingsPanelStore';

// Shown under the suggested genes: a reminder that the rest are a search away.
const GENE_SEARCH_HINT_VALUE = 'gene-search-hint';

type MenuOption = ColoringMenuOmnibarOption & {
    /** Shown beside the label in the menu only, e.g. "38%". */
    detail?: string;
    isDisabled?: boolean;
};

export interface ColorSamplesByDropdownProps {
    // Data sources
    genes: Gene[];
    clinicalAttributes: ClinicalAttribute[];

    // Current selection
    selectedOption?: ColoringMenuOmnibarOption;

    // Configuration
    hasNoQueriedGenes: boolean;
    isLoading: boolean;

    // Gene-based coloring options (like PlotsTab)
    mutationDataExists?: boolean;
    cnaDataExists?: boolean;
    svDataExists?: boolean;
    mutationTypeEnabled?: boolean;
    copyNumberEnabled?: boolean;
    structuralVariantEnabled?: boolean;
    // Continuous, so the consumer treats it as exclusive with the toggles above.
    mrnaDataExists?: boolean;
    mrnaEnabled?: boolean;

    // Event handlers
    onSelectionChange: (option: ColoringMenuOmnibarOption | undefined) => void;
    onMutationTypeToggle?: (enabled: boolean) => void;
    onCopyNumberToggle?: (enabled: boolean) => void;
    onStructuralVariantToggle?: (enabled: boolean) => void;
    onMrnaToggle?: (enabled: boolean) => void;

    // Additional option groups to insert before Clinical Attributes
    additionalGroups?: ColoringMenuOmnibarGroup[];

    // Genes listed before anything is typed, in place of the full gene list,
    // so that colouring by gene is visible without knowing to search.
    suggestedGenes?: GeneColoringSuggestions;

    // Listed first, ahead of every group, e.g. the default colouring, which
    // is the one people come back to. Not repeated in their own group.
    pinnedOptions?: ColoringMenuOmnibarOption[];

    // Omits the built-in "Color by:" label - for callers (e.g. one with its
    // own caption above) that would otherwise show it twice.
    hideLabel?: boolean;
    // Stacks the select and gene checkboxes vertically, for callers with a narrow column where an inline row would overflow.
    stacked?: boolean;

    // Optional styling
    className?: string;
    style?: React.CSSProperties;
    // Passed straight through to the underlying react-select's `styles` prop
    selectStyles?: { [key: string]: (base: any, state: any) => any };
}

@observer
export class ColorSamplesByDropdown extends React.Component<
    ColorSamplesByDropdownProps
> {
    private lastSearchTerm = '';

    // While the menu is open the box reads as a search field rather than
    // repeating the current colouring.
    @observable private isMenuOpen = false;

    constructor(props: ColorSamplesByDropdownProps) {
        super(props);
        makeObservable(this);
    }

    @computed get coloringMenuOmnibarOptions(): (
        | ColoringMenuOmnibarOption
        | ColoringMenuOmnibarGroup
    )[] {
        const allOptions: (
            | ColoringMenuOmnibarOption
            | ColoringMenuOmnibarGroup
        )[] = [];

        // Add gene options with pre-computed search strings for performance
        if (this.props.genes.length > 0) {
            allOptions.push({
                label: 'Genes',
                options: this.props.genes.map(
                    gene =>
                        ({
                            label: gene.hugoGeneSymbol,
                            value: `gene_${gene.entrezGeneId}`,
                            info: {
                                entrezGeneId: gene.entrezGeneId,
                            },
                            // Pre-compute lowercase for faster searching
                            searchString: gene.hugoGeneSymbol.toLowerCase(),
                        } as any)
                ),
            });
        }

        // Add additional groups (e.g., "Map Attributes") before Clinical Attributes
        if (this.props.additionalGroups) {
            allOptions.push(...this.props.additionalGroups);
        }

        // Add clinical attributes
        if (this.props.clinicalAttributes.length > 0) {
            allOptions.push({
                label: 'Clinical Attributes',
                options: this.props.clinicalAttributes
                    .filter(
                        a =>
                            a.clinicalAttributeId !==
                            SpecialAttribute.MutationSpectrum
                    )
                    .map(
                        clinicalAttribute =>
                            ({
                                label: clinicalAttribute.displayName,
                                value: `clinical_${clinicalAttribute.clinicalAttributeId}`,
                                info: {
                                    clinicalAttribute,
                                },
                                // Pre-compute lowercase for faster searching
                                searchString: clinicalAttribute.displayName.toLowerCase(),
                            } as any)
                    ),
            });
        }

        // Add 'None' option to the top
        if (allOptions.length > 0) {
            allOptions.unshift({
                label: 'None',
                value: 'none',
                info: {
                    entrezGeneId: NONE_SELECTED_OPTION_NUMERICAL_VALUE,
                },
            });
        }

        return allOptions;
    }

    /**
     * The menu before anything is typed: the pinned options, then genes,
     * then the remaining groups, with None last since it is rarely wanted.
     * Suggested genes stand in for the full gene list, whose first entries
     * are arbitrary; with none to suggest, the Genes group still shows, as a
     * prompt to search.
     */
    @computed get defaultMenuOptions(): (
        | ColoringMenuOmnibarOption
        | ColoringMenuOmnibarGroup
    )[] {
        const suggested = this.props.suggestedGenes;
        const geneGroup: ColoringMenuOmnibarGroup = {
            label: suggested ? suggested.label : 'Genes',
            options: [
                ...(suggested ? suggested.genes : []).map(
                    gene =>
                        ({
                            label: gene.hugoGeneSymbol,
                            value: `gene_${gene.entrezGeneId}`,
                            info: { entrezGeneId: gene.entrezGeneId },
                            detail: gene.detail,
                        } as MenuOption)
                ),
                {
                    label: suggested
                        ? 'Type to search all genes'
                        : 'Type a gene to search',
                    value: GENE_SEARCH_HINT_VALUE,
                    info: {},
                    isDisabled: true,
                } as MenuOption,
            ],
        };
        const pinned = this.props.pinnedOptions || [];
        const pinnedValues = new Set(pinned.map(option => option.value));
        const groups: ColoringMenuOmnibarGroup[] = [];
        const loose: ColoringMenuOmnibarOption[] = [];
        this.coloringMenuOmnibarOptions.forEach(item => {
            if (!('options' in item)) {
                loose.push(item);
            } else if (item.label !== 'Genes') {
                const options = item.options.filter(
                    option => !pinnedValues.has(option.value)
                );
                if (options.length > 0) {
                    groups.push({ ...item, options });
                }
            }
        });
        return [...pinned, geneGroup, ...groups, ...loose];
    }

    /**
     * The menu's own option for the current selection. react-select finds
     * the option to highlight on opening by identity, so an equal copy, as
     * the caller passes, would leave the first option highlighted instead.
     */
    @computed get selectedMenuOption(): ColoringMenuOmnibarOption | undefined {
        const selected = this.props.selectedOption;
        if (!selected) {
            return selected;
        }
        const options = _.flatMap(this.defaultMenuOptions, item =>
            'options' in item ? item.options : [item]
        );
        return (
            options.find(option => option.value === selected.value) || selected
        );
    }

    @computed get flattenedOptions(): ColoringMenuOmnibarOption[] {
        return this.coloringMenuOmnibarOptions.reduce<
            ColoringMenuOmnibarOption[]
        >((acc, item) => {
            if ('options' in item) {
                return acc.concat(item.options);
            } else {
                return acc.concat(item);
            }
        }, []);
    }

    @computed get isGeneSelected(): boolean {
        return !!(
            this.props.selectedOption?.info?.entrezGeneId &&
            this.props.selectedOption.info.entrezGeneId !==
                NONE_SELECTED_OPTION_NUMERICAL_VALUE
        );
    }

    @action.bound
    private handleSelectionChange(
        selectedOption: ColoringMenuOmnibarOption | null
    ) {
        this.props.onSelectionChange(selectedOption || undefined);
    }

    @action.bound
    private handleMutationTypeToggle() {
        if (this.props.onMutationTypeToggle) {
            this.props.onMutationTypeToggle(!this.props.mutationTypeEnabled);
        }
    }

    @action.bound
    private handleCopyNumberToggle() {
        if (this.props.onCopyNumberToggle) {
            this.props.onCopyNumberToggle(!this.props.copyNumberEnabled);
        }
    }

    @action.bound
    private handleMrnaToggle() {
        if (this.props.onMrnaToggle) {
            this.props.onMrnaToggle(!this.props.mrnaEnabled);
        }
    }

    @action.bound
    private handleStructuralVariantToggle() {
        if (this.props.onStructuralVariantToggle) {
            this.props.onStructuralVariantToggle(
                !this.props.structuralVariantEnabled
            );
        }
    }

    // Optimized string comparison with priority matching
    private getMatchScore = (
        option: ColoringMenuOmnibarOption,
        searchTerm: string
    ): number => {
        // Use pre-computed search string if available, otherwise compute
        const label =
            (option as any).searchString || option.label.toLowerCase();
        const search = searchTerm.toLowerCase();

        if (label === search) return 100; // Exact match
        if (label.startsWith(search)) return 80; // Starts with
        if (label.includes(search)) return 60; // Contains
        return 0; // No match
    };

    private loadColoringOptionsImpl = async (
        inputValue: string
    ): Promise<(ColoringMenuOmnibarOption | ColoringMenuOmnibarGroup)[]> => {
        if (!inputValue || inputValue.length === 0) {
            return this.defaultMenuOptions;
        }

        // Filter and maintain group structure with relevance scoring
        const filteredGroups: (
            | ColoringMenuOmnibarOption
            | ColoringMenuOmnibarGroup
        )[] = [];

        for (const item of this.coloringMenuOmnibarOptions) {
            if ('options' in item) {
                // This is a group - filter and sort by relevance
                const scoredOptions = item.options
                    .map(option => ({
                        option,
                        score: this.getMatchScore(option, inputValue),
                    }))
                    .filter(scored => scored.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(scored => scored.option);

                if (scoredOptions.length > 0) {
                    filteredGroups.push({
                        ...item,
                        options: scoredOptions.slice(0, 50), // Increased limit for better UX
                    });
                }
            } else {
                // This is a single option (like "None")
                if (this.getMatchScore(item, inputValue) > 0) {
                    filteredGroups.push(item);
                }
            }
        }

        return filteredGroups;
    };

    private loadColoringOptions = async (
        inputValue: string
    ): Promise<(ColoringMenuOmnibarOption | ColoringMenuOmnibarGroup)[]> => {
        this.lastSearchTerm = inputValue;

        // For very short searches, apply a small delay to avoid excessive calls
        if (inputValue && inputValue.length > 0 && inputValue.length < 3) {
            // Small delay for short terms to avoid excessive filtering
            await new Promise(resolve => setTimeout(resolve, 150));

            // Check if search term changed during delay - if so, cancel this request
            if (this.lastSearchTerm !== inputValue) {
                return [];
            }
        }

        // The gene list loads when the menu is first reached for; a search
        // typed before it arrives waits for it rather than finding no genes.
        if (inputValue && this.props.isLoading) {
            await when(() => !this.props.isLoading, {
                timeout: 30000,
            }).catch(() => undefined);
            if (this.lastSearchTerm !== inputValue) {
                return [];
            }
        }

        return await this.loadColoringOptionsImpl(inputValue);
    };

    private formatOptionLabel = (
        option: MenuOption,
        { context }: { context: 'menu' | 'value' }
    ) => {
        if (context !== 'menu') {
            return option.label;
        }
        if (option.value === GENE_SEARCH_HINT_VALUE) {
            return (
                <span style={{ fontStyle: 'italic', color: '#888' }}>
                    {option.label}
                </span>
            );
        }
        if (option.detail) {
            return (
                <span
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                    }}
                >
                    <span>{option.label}</span>
                    <span style={{ color: '#888' }}>{option.detail}</span>
                </span>
            );
        }
        return option.label;
    };

    @action.bound
    private setMenuOpen(open: boolean) {
        this.isMenuOpen = open;
    }

    render() {
        const stacked = this.props.stacked;

        const selectProps = {
            // Those classes carry fixed-width SCSS meant for the wide
            // toolbar row - skip them in stacked mode.
            className: stacked ? '' : 'color-samples-toolbar-elt gene-select',
            value: this.selectedMenuOption,
            onChange: this.handleSelectionChange,
            isLoading: this.props.isLoading,
            clearable: false,
            searchable: true,
            disabled: !this.coloringMenuOmnibarOptions.length,
            ...(this.props.selectStyles && {
                styles: this.props.selectStyles,
            }),
        };

        return (
            <div
                style={
                    stacked
                        ? {
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'stretch',
                              ...this.props.style,
                          }
                        : {
                              display: 'inline-flex',
                              position: 'relative',
                              alignItems: 'center',
                              ...this.props.style,
                          }
                }
                data-test="ColorSamplesByDropdown"
                className={`coloring-menu ${this.props.className || ''}`}
            >
                {!this.props.hideLabel && (
                    <>
                        <label className="legend-label">Color by:</label>
                        &nbsp;
                    </>
                )}
                <div
                    style={
                        stacked
                            ? {
                                  display: 'block',
                                  width: '100%',
                                  padding: 0,
                                  margin: 0,
                              }
                            : { display: 'inline-block' }
                    }
                    className="gene-select-background"
                >
                    <div
                        className="checkbox gene-select-container"
                        style={stacked ? { margin: 0 } : undefined}
                    >
                        <If condition={this.props.hasNoQueriedGenes}>
                            <Then>
                                <AsyncSelect
                                    aria-label="Gene or Clinical Attribute Search Dropdown"
                                    name="colorSamplesByDropdown"
                                    {...selectProps}
                                    noOptionsMessage={(obj: {
                                        inputValue: string;
                                    }) => {
                                        if (
                                            obj.inputValue &&
                                            obj.inputValue.length > 0
                                        ) {
                                            return `No results found for "${obj.inputValue}"`;
                                        }
                                        return 'Search for gene or clinical attribute';
                                    }}
                                    loadOptions={this.loadColoringOptions}
                                    // An array rather than `true`, so the menu
                                    // follows suggestions that arrive after mount.
                                    defaultOptions={this.defaultMenuOptions}
                                    loadingMessage={() => 'Searching...'}
                                    placeholder="Gene or attribute…"
                                    controlShouldRenderValue={!this.isMenuOpen}
                                    onMenuOpen={() => this.setMenuOpen(true)}
                                    onMenuClose={() => this.setMenuOpen(false)}
                                    formatOptionLabel={this.formatOptionLabel}
                                />
                            </Then>
                            <Else>
                                <Select
                                    name="colorSamplesByDropdown"
                                    {...selectProps}
                                    options={this.coloringMenuOmnibarOptions}
                                />
                            </Else>
                        </If>
                    </div>
                </div>
                {/* Gene-based coloring checkboxes (like PlotsTab) */}
                {this.isGeneSelected && (
                    <div
                        style={
                            stacked
                                ? {
                                      marginTop: '6px',
                                      marginLeft: '8px',
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      alignItems: 'center',
                                      gap: '4px 8px',
                                  }
                                : {
                                      marginLeft: '10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                  }
                        }
                    >
                        {this.props.mutationDataExists && (
                            <LabeledCheckbox
                                checked={
                                    this.props.mutationTypeEnabled || false
                                }
                                onChange={this.handleMutationTypeToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'mutationTypeToggle',
                                }}
                            >
                                Mutation Type
                            </LabeledCheckbox>
                        )}

                        {this.props.cnaDataExists && (
                            <LabeledCheckbox
                                checked={this.props.copyNumberEnabled || false}
                                onChange={this.handleCopyNumberToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'copyNumberToggle',
                                }}
                            >
                                Copy Number
                            </LabeledCheckbox>
                        )}

                        {this.props.svDataExists && (
                            <LabeledCheckbox
                                checked={
                                    this.props.structuralVariantEnabled || false
                                }
                                onChange={this.handleStructuralVariantToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'structuralVariantToggle',
                                }}
                            >
                                Structural Variant
                            </LabeledCheckbox>
                        )}

                        {this.props.mrnaDataExists && (
                            <LabeledCheckbox
                                checked={this.props.mrnaEnabled || false}
                                onChange={this.handleMrnaToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'mrnaToggle',
                                }}
                            >
                                Expression
                            </LabeledCheckbox>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export default ColorSamplesByDropdown;
