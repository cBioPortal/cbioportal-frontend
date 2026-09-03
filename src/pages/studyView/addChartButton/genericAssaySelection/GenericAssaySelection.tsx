import * as React from 'react';
import _ from 'lodash';
import { GenericAssayChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable, toJS } from 'mobx';
import Select, { components } from 'react-select';
import { MolecularProfileOption } from 'pages/studyView/StudyViewUtils';
import numeral from 'numeral';
import styles from './styles.module.scss';
import { doesOptionMatchSearchText } from 'shared/lib/GenericAssayUtils/GenericAssaySelectionUtils';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    deriveDisplayTextFromGenericAssayType,
    formatGenericAssayCompactLabelByNameAndId,
    getGenericAssayPropertyOrDefault,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { DataTypeConstants } from 'shared/constants';

export interface IGenericAssaySelectionProps {
    molecularProfileOptions:
        | (MolecularProfileOption & {
              profileName: string;
          })[]
        | ISelectOption[];
    genericAssayEntityOptions: ISelectOption[];
    entityMap: {
        [stableId: string]: GenericAssayMeta;
    };
    genericAssayType: string;
    submitButtonText: string;
    containerWidth?: number;
    initialGenericAssayEntityIds?: string[];
    allowEmptySubmission?: boolean;
    // When set, show a "Select all" button if the total option count is at or
    // below this threshold. Left undefined (e.g. for profiles with hundreds of
    // entities) to avoid a trivial one-click flood.
    selectAllThreshold?: number;
    // When true, render a chart-type selector (radio) above the submit button
    // so the caller can choose how the entities should appear when added.
    showChartTypeSelector?: boolean;
    onSelectGenericAssayProfile?: (molecularProfileId: string) => void;
    onTrackSubmit?: (data: GenericAssayTrackInfo[]) => void;
    onChartSubmit?: (data: GenericAssayChart[]) => void;
    onFrequencyTableSubmit?: (
        option: MolecularProfileOption & {
            profileName: string;
        }
    ) => void;
}

export type GenericAssayChartType =
    | 'heatmap'
    | 'bar'
    | 'stacked_composition'
    | 'stacked_absolute';

export type GenericAssayTrackInfo = {
    profileId: string;
    genericAssayType: string;
    genericAssayEntityId: string;
    chartType?: GenericAssayChartType;
};

interface ISelectOption {
    value: string;
    label: string;
}

export const DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING: number = 100;
export const GENERIC_ASSAY_FREQUENCY_TABLE_OPTION =
    'generic_assay_frequency_table';

@observer
export default class GenericAssaySelection extends React.Component<
    IGenericAssaySelectionProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
        if (this.props.initialGenericAssayEntityIds) {
            this._selectedGenericAssayEntityIds = this.props.initialGenericAssayEntityIds;
        }
    }

    public static defaultProps: Partial<IGenericAssaySelectionProps> = {
        allowEmptySubmission: false,
    };

    @observable private _selectedProfileOption:
        | (MolecularProfileOption & {
              profileName: string;
          })
        | ISelectOption
        | undefined = undefined;

    @observable.ref private _selectedGenericAssayEntityIds: string[] = [];
    @observable private _genericAssaySearchText: string = '';
    @observable private _chartType: GenericAssayChartType = 'heatmap';
    private overridePlaceHolderText =
        GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
            this.props.genericAssayType
        ]?.selectionConfig?.placeHolderText;

    @action.bound
    private onSubmit() {
        if (this.selectedProfileOption !== undefined) {
            const option = this.selectedProfileOption as MolecularProfileOption & {
                profileName: string;
            };
            const selectedIds = this.validSelectedGenericAssayEntityIds;
            const shouldAddFrequencyTable = Boolean(
                this.props.onFrequencyTableSubmit &&
                    selectedIds.includes(GENERIC_ASSAY_FREQUENCY_TABLE_OPTION)
            );
            const selectedEntityIds = selectedIds.filter(
                entityId => entityId !== GENERIC_ASSAY_FREQUENCY_TABLE_OPTION
            );
            // Generic Assay chart submit (StudyView)
            if (shouldAddFrequencyTable) {
                this.props.onFrequencyTableSubmit!(option);
            }
            if (this.props.onChartSubmit && selectedEntityIds.length > 0) {
                const charts = selectedEntityIds.map(
                    entityId => {
                        const entityName = GENERIC_ASSAY_CONFIG
                            .genericAssayConfigByType[
                            this.props.genericAssayType
                        ]?.selectionConfig?.formatChartNameUsingCompactLabel
                            ? formatGenericAssayCompactLabelByNameAndId(
                                  entityId,
                                  getGenericAssayPropertyOrDefault(
                                      this.props.entityMap[entityId]
                                          .genericEntityMetaProperties,
                                      COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                                      entityId
                                  )
                              )
                            : entityId;
                        return {
                            name: entityName + ': ' + option.profileName,
                            description: option.description,
                            profileType: option.value,
                            genericAssayType: this.props.genericAssayType,
                            dataType: option.dataType,
                            genericAssayEntityId: entityId,
                            patientLevel: option.patientLevel,
                        };
                    }
                );
                this.props.onChartSubmit(charts);
            }
            if (shouldAddFrequencyTable || selectedEntityIds.length > 0) {
                this.clearSelectedEntities();
            }
            // Generic Assay track submit (OncoPrint)
            if (this.props.onTrackSubmit) {
                const option = this.selectedProfileOption as ISelectOption;
                // select profile if onSelectGenericAssayProfile exists
                const info: GenericAssayTrackInfo[] = selectedEntityIds.map(
                    entityId => {
                        return {
                            profileId: option.value,
                            genericAssayType: this.props.genericAssayType,
                            genericAssayEntityId: entityId,
                            chartType: this._chartType,
                        };
                    }
                );
                this.props.onTrackSubmit(info);
            }
        }
    }

    @action.bound
    private clearSelectedEntities() {
        this._selectedGenericAssayEntityIds = [];
    }

    @action.bound
    private selectAllEntities() {
        this._selectedGenericAssayEntityIds = this.props.genericAssayEntityOptions.map(
            o => o.value
        );
    }

    @computed get canShowBulkToggle() {
        const threshold = this.props.selectAllThreshold;
        if (threshold === undefined) return false;
        const total = this.props.genericAssayEntityOptions.length;
        return total > 0 && total <= threshold;
    }
    @computed get bulkToggleIsClear() {
        return this.validSelectedGenericAssayEntityIds.length > 0;
    }

    @action.bound
    private handleProfileSelect(option: any) {
        if (option && option.value) {
            this._selectedProfileOption = option;
            this.props.onSelectGenericAssayProfile &&
                this.props.onSelectGenericAssayProfile(option.value);
        }
    }

    @computed
    private get selectedProfileOption() {
        if (this._selectedProfileOption !== undefined) {
            return this._selectedProfileOption;
        } else if (this.props.molecularProfileOptions) {
            return this.props.molecularProfileOptions[0];
        } else {
            return undefined;
        }
    }

    @computed
    private get selectedProfileSupportsFrequencyTable() {
        const option = this.selectedProfileOption as
            | (MolecularProfileOption & {
                  profileName: string;
              })
            | undefined;
        return (
            option !== undefined &&
            (option.dataType === DataTypeConstants.BINARY ||
                option.dataType === DataTypeConstants.CATEGORICAL)
        );
    }

    @computed
    private get buttonDisabled() {
        // disable button only when we don't allow empty submissions and has zero selected entities
        if (this.props.allowEmptySubmission) {
            return false;
        } else {
            return _.isEmpty(this.validSelectedGenericAssayEntityIds);
        }
    }

    @computed get genericAssayEntitiesOptionsByValueMap(): {
        [value: string]: ISelectOption;
    } {
        return _.keyBy(
            this.genericAssayOptions,
            (option: ISelectOption) => option.value
        );
    }

    @computed get validSelectedGenericAssayEntityIds(): string[] {
        return this._selectedGenericAssayEntityIds.filter(entityId => {
            if (entityId === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
                return this.selectedProfileSupportsFrequencyTable;
            }

            return !!this.genericAssayEntitiesOptionsByValueMap[entityId];
        });
    }

    @action.bound
    private onSelectGenericAssayEntities(
        selectedOptions: ISelectOption[],
        selectInfo: any
    ) {
        // selectedOptions can be null if delete the last selected option
        let candidateOptions = selectedOptions ? selectedOptions : [];
        // if choose select all option, add all filtered options
        if (
            selectInfo.action === 'select-option' &&
            selectInfo.option.value === 'select_all_filtered_options'
        ) {
            // use union to keep previous selected options and new added options
            candidateOptions = _.union(
                this.filteredGenericAssayOptions,
                candidateOptions
            );
        }
        // map to id
        let candidateIds = candidateOptions.map(o => o.value);
        // filter out select all option from the candidate id list
        candidateIds = candidateIds.filter(
            id => id !== 'select_all_filtered_options'
        );
        this._selectedGenericAssayEntityIds = candidateIds;
        this._genericAssaySearchText = '';
    }

    @computed get selectedGenericAssayEntities(): ISelectOption[] {
        return this.validSelectedGenericAssayEntityIds.map(
            o => this.genericAssayEntitiesOptionsByValueMap[o]
        );
    }

    @computed get selectedGenericAssaysJS() {
        return toJS(this.selectedGenericAssayEntities);
    }

    @computed get genericAssayOptions() {
        // add select all option only when options have been filtered and has at least one filtered option
        // one generic assay profile usually contains hundreds of options, we don't want user try to add all options without filtering the option
        let allOptionsInSelectedProfile = this.selectedProfileSupportsFrequencyTable
            ? _.concat(
                  {
                      value: GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
                      label: 'Frequency table',
                  } as ISelectOption,
                  this.props.genericAssayEntityOptions
              )
            : this.props.genericAssayEntityOptions;
        const filteredOptionsLength = this.props.genericAssayEntityOptions.filter(
            option =>
                doesOptionMatchSearchText(
                    this._genericAssaySearchText,
                    option
                ) && !this._selectedGenericAssayEntityIds.includes(option.value)
        ).length;
        if (
            this._genericAssaySearchText.length > 0 &&
            filteredOptionsLength > 0
        ) {
            allOptionsInSelectedProfile = _.concat(
                {
                    id: 'select_all_filtered_options',
                    value: 'select_all_filtered_options',
                    label: `Select all filtered options (${filteredOptionsLength})`,
                } as ISelectOption,
                allOptionsInSelectedProfile
            );
        }
        return allOptionsInSelectedProfile;
    }

    @computed get showingGenericAssayOptions() {
        let showingOptions: ISelectOption[] = [];
        const filteredOptionsWithSpecialOption = _.filter(
            this.genericAssayOptions,
            option => {
                // do not filter out select all option
                if (option.value === 'select_all_filtered_options') {
                    return true;
                }
                if (option.value === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
                    return !this._selectedGenericAssayEntityIds.includes(
                        option.value
                    );
                }
                return doesOptionMatchSearchText(
                    this._genericAssaySearchText,
                    option
                );
            }
        );

        const specialOptionExist =
            filteredOptionsWithSpecialOption.length !==
            this.filteredGenericAssayOptions.length;
        if (
            DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING >=
            this.filteredGenericAssayOptions.length
        ) {
            showingOptions = filteredOptionsWithSpecialOption;
        } else {
            if (specialOptionExist) {
                showingOptions = filteredOptionsWithSpecialOption.slice(
                    0,
                    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING + 1
                );
            } else {
                showingOptions = filteredOptionsWithSpecialOption.slice(
                    0,
                    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING
                );
            }
        }
        return showingOptions;
    }

    @computed get filteredGenericAssayOptions() {
        return _.filter(this.genericAssayOptions, option => {
            // filter out select all option
            if (
                option.value === 'select_all_filtered_options' ||
                option.value === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION
            ) {
                return false;
            }
            return doesOptionMatchSearchText(
                this._genericAssaySearchText,
                option
            );
        });
    }

    @action.bound
    filterGenericAssayOption(option: ISelectOption, filterString: string) {
        if (option.value === 'select_all_filtered_options') {
            return true;
        }
        if (option.value === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
            return !this._selectedGenericAssayEntityIds.includes(option.value);
        }
        return (
            doesOptionMatchSearchText(filterString, option) &&
            !this._selectedGenericAssayEntityIds.includes(option.value)
        );
    }

    @action.bound
    onGenericAssayInputChange(input: string, inputInfo: any) {
        if (inputInfo.action === 'input-change') {
            this._genericAssaySearchText = input;
        } else if (inputInfo.action !== 'set-value') {
            this._genericAssaySearchText = '';
        }
    }

    render() {
        return (
            <div
                data-test="GenericAssaySelection"
                style={{
                    width: this.props.containerWidth
                        ? this.props.containerWidth - 20
                        : 'auto',
                }}
            >
                <div
                    data-test="GenericAssayProfileSelection"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <Select
                            value={this.selectedProfileOption}
                            onChange={this.handleProfileSelect}
                            options={this.props.molecularProfileOptions}
                            isClearable={false}
                            isSearchable={false}
                        />
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: 10,
                        alignItems: 'center',
                    }}
                >
                    <div
                        data-test="GenericAssayEntitySelection"
                        style={{
                            flex: 1,
                            marginRight: 15,
                        }}
                    >
                        <Select
                            name="generic-assay-select"
                            placeholder={
                                this.overridePlaceHolderText
                                    ? this.overridePlaceHolderText
                                    : `Search for ${deriveDisplayTextFromGenericAssayType(
                                          this.props.genericAssayType,
                                          true
                                      )}...`
                            }
                            closeMenuOnSelect={false}
                            value={this.selectedGenericAssaysJS}
                            isMulti
                            isClearable={false}
                            options={this.showingGenericAssayOptions}
                            filterOption={this.filterGenericAssayOption}
                            onInputChange={this.onGenericAssayInputChange}
                            onChange={this.onSelectGenericAssayEntities}
                            noOptionsMessage={() => 'No results'}
                            styles={{
                                multiValueLabel: (base: any) => ({
                                    ...base,
                                    whiteSpace: 'normal',
                                }),
                            }}
                            components={{
                                MenuList: MenuList,
                                MenuListHeader: (
                                    <MenuListHeader
                                        current={
                                            this.filteredGenericAssayOptions
                                                .length
                                        }
                                        total={
                                            this.props.genericAssayEntityOptions
                                                .length
                                        }
                                    />
                                ),
                            }}
                        />
                    </div>
                    {this.canShowBulkToggle && (
                        <button
                            className="btn btn-default btn-sm"
                            style={{ marginLeft: 8, whiteSpace: 'nowrap' }}
                            data-test="GenericAssaySelectionSelectAllButton"
                            onClick={
                                this.bulkToggleIsClear
                                    ? this.clearSelectedEntities
                                    : this.selectAllEntities
                            }
                        >
                            {this.bulkToggleIsClear
                                ? 'Clear all'
                                : 'Select all'}
                        </button>
                    )}
                </div>
                {this.props.showChartTypeSelector && (
                    <div
                        style={{
                            marginTop: 12,
                            fontSize: 12,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            columnGap: 14,
                            rowGap: 4,
                        }}
                        data-test="GenericAssayChartTypeSelector"
                    >
                        <span style={{ fontWeight: 600 }}>Chart type:</span>
                        {[
                            {
                                value: 'heatmap',
                                label: 'Separate rows (heatmap)',
                            },
                            {
                                value: 'bar',
                                label: 'Separate rows (bar chart)',
                            },
                            {
                                value: 'stacked_composition',
                                label: 'Stacked bar (composition)',
                            },
                            {
                                value: 'stacked_absolute',
                                label: 'Stacked bar (absolute)',
                            },
                        ].map(opt => (
                            <label
                                key={opt.value}
                                style={{
                                    fontWeight: 'normal',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    marginBottom: 0,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="ga-chart-type"
                                    value={opt.value}
                                    checked={this._chartType === opt.value}
                                    onChange={action(() => {
                                        this._chartType = opt.value as GenericAssayChartType;
                                    })}
                                    style={{ marginRight: 5, marginTop: 0 }}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', marginTop: 12 }}>
                    <button
                        disabled={this.buttonDisabled}
                        className="btn btn-primary btn-sm"
                        data-test="GenericAssaySelectionSubmitButton"
                        onClick={this.onSubmit}
                        style={{ flex: 1 }}
                    >
                        {this.props.submitButtonText}
                    </button>
                </div>
            </div>
        );
    }
}

export const MenuList = (props: any) => {
    const {
        MenuListHeader = null,
        MenuListFooter = null,
    } = props.selectProps.components;

    return (
        <components.MenuList {...props}>
            {props.children.length && MenuListHeader}
            {props.children}
            {props.children.length && MenuListFooter}
        </components.MenuList>
    );
};

export const MenuListHeader = ({ current, total }: any) =>
    current > DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING ? (
        <span className={styles.menuHeader}>
            Showing first {DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING} of{' '}
            {numeral(total).format('0,0')} results. Refine search for specific
            options.
        </span>
    ) : null;
