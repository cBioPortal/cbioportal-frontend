import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { If, Then, Else } from 'react-if';
import LabeledCheckbox from '../labeledCheckbox/LabeledCheckbox';
import {
    ColoringMenuOmnibarOption,
    ColoringMenuOmnibarGroup,
    NONE_SELECTED_OPTION_NUMERICAL_VALUE,
} from '../../components/plots/PlotsTab';
import { ClinicalAttribute, Gene } from 'cbioportal-ts-api-client';
import { SpecialAttribute } from '../../cache/ClinicalDataCache';

export interface ColorSamplesByDropdownProps {
    // Data sources
    genes: Gene[];
    clinicalAttributes: ClinicalAttribute[];

    // Current selection
    selectedOption?: ColoringMenuOmnibarOption;
    logScale: boolean;

    // Configuration
    hasNoQueriedGenes: boolean;
    logScalePossible: boolean;
    isLoading: boolean;

    // Event handlers
    onSelectionChange: (option: ColoringMenuOmnibarOption | undefined) => void;
    onLogScaleChange: (enabled: boolean) => void;

    // Optional styling
    className?: string;
    style?: React.CSSProperties;
}

@observer
export class ColorSamplesByDropdown extends React.Component<
    ColorSamplesByDropdownProps
> {
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

        // Add gene options
        if (this.props.genes.length > 0) {
            allOptions.push({
                label: 'Genes',
                options: this.props.genes.map(gene => ({
                    label: gene.hugoGeneSymbol,
                    value: `gene_${gene.entrezGeneId}`,
                    info: {
                        entrezGeneId: gene.entrezGeneId,
                    },
                })),
            });
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
                    .map(clinicalAttribute => ({
                        label: clinicalAttribute.displayName,
                        value: `clinical_${clinicalAttribute.clinicalAttributeId}`,
                        info: {
                            clinicalAttribute,
                        },
                    })),
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

    @action.bound
    private handleSelectionChange(
        selectedOption: ColoringMenuOmnibarOption | null
    ) {
        this.props.onSelectionChange(selectedOption || undefined);
    }

    @action.bound
    private handleLogScaleChange() {
        this.props.onLogScaleChange(!this.props.logScale);
    }

    private loadColoringOptions = async (
        inputValue: string
    ): Promise<ColoringMenuOmnibarOption[]> => {
        const stringCompare = (option: ColoringMenuOmnibarOption) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase());

        return this.flattenedOptions.filter(stringCompare).slice(0, 20);
    };

    render() {
        const selectProps = {
            className: 'color-samples-toolbar-elt gene-select',
            value: this.props.selectedOption,
            onChange: this.handleSelectionChange,
            isLoading: this.props.isLoading,
            clearable: false,
            searchable: true,
            disabled: !this.coloringMenuOmnibarOptions.length,
        };

        return (
            <div
                style={{
                    display: 'inline-flex',
                    position: 'relative',
                    alignItems: 'center',
                    ...this.props.style,
                }}
                data-test="ColorSamplesByDropdown"
                className={`coloring-menu ${this.props.className || ''}`}
            >
                <label className="legend-label">Color samples by:</label>
                &nbsp;
                <div
                    style={{
                        display: 'inline-block',
                    }}
                    className="gene-select-background"
                >
                    <div className="checkbox gene-select-container">
                        <If condition={this.props.hasNoQueriedGenes}>
                            <Then>
                                <AsyncSelect
                                    aria-label="Gene or Clinical Attribute Search Dropdown"
                                    name="colorSamplesByDropdown"
                                    {...selectProps}
                                    noOptionsMessage={() =>
                                        'Search for gene or clinical attribute'
                                    }
                                    loadOptions={this.loadColoringOptions}
                                    cacheOptions={true}
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
                {this.props.logScalePossible && (
                    <LabeledCheckbox
                        checked={this.props.logScale}
                        onChange={this.handleLogScaleChange}
                        inputProps={{
                            style: { marginTop: 4 },
                            className: 'coloringLogScale',
                        }}
                    >
                        Log Scale
                    </LabeledCheckbox>
                )}
            </div>
        );
    }
}

export default ColorSamplesByDropdown;
