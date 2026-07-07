import * as React from 'react';
import _ from 'lodash';
import { GenericAssayChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable, toJS } from 'mobx';
import Select, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import { MolecularProfileOption } from 'pages/studyView/StudyViewUtils';
import numeral from 'numeral';
import styles from './styles.module.scss';
import { ISelectOption } from 'shared/lib/GenericAssayUtils/GenericAssaySelectionUtils';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    deriveDisplayTextFromGenericAssayType,
    fetchGenericAssayMetaByEntityIds,
    fetchGenericAssayMetaPageByProfileIds,
    formatGenericAssayCompactLabelByNameAndId,
    getGenericAssayPropertyOrDefault,
    makeGenericAssayOption,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { DataTypeConstants } from 'shared/constants';

export interface IGenericAssayProfileOption extends ISelectOption {
    profileName?: string;
    description?: string;
    dataType?: string;
    patientLevel?: boolean;
    profileIds?: string[];
}

export interface IGenericAssaySelectionProps {
    molecularProfileOptions: IGenericAssayProfileOption[];
    genericAssayType: string;
    submitButtonText: string;
    containerWidth?: number;
    initialGenericAssayEntityIds?: string[];
    allowEmptySubmission?: boolean;
    selectAllThreshold?: number;
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

export const DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING: number = 100;
export const GENERIC_ASSAY_SEARCH_DEBOUNCE_MS = 250;
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
            this._selectedGenericAssayEntityIds =
                this.props.initialGenericAssayEntityIds;
        }
    }

    public static defaultProps: Partial<IGenericAssaySelectionProps> = {
        allowEmptySubmission: false,
    };

    @observable private _selectedProfileOption:
        | IGenericAssayProfileOption
        | undefined = undefined;

    @observable.ref private _selectedGenericAssayEntityIds: string[] = [];
    @observable private _genericAssaySearchText: string = '';
    @observable private _chartType: GenericAssayChartType = 'heatmap';
    @observable.ref private _genericAssayEntityMap: {
        [stableId: string]: GenericAssayMeta;
    } = {};
    @observable.ref private _loadedGenericAssayOptions: ISelectOption[] = [];
    @observable private _loadedGenericAssayOptionsCount: number = 0;
    @observable private _totalGenericAssayOptionsCount: number = 0;
    @observable private _isLoadingOptions = false;
    @observable.ref private _defaultLoadedGenericAssayOptionValues: string[] =
        [];
    @observable private _defaultLoadedGenericAssayOptionsCount: number = 0;
    @observable private _defaultTotalGenericAssayOptionsCount: number = 0;
    private latestOptionsRequestId = 0;
    private readonly debouncedLoadGenericAssayOptions = _.debounce(
        (
            inputText: string,
            callback: (options: ISelectOption[]) => void
        ) => {
            void this.loadGenericAssayOptions(inputText).then(callback);
        },
        GENERIC_ASSAY_SEARCH_DEBOUNCE_MS
    );
    private overridePlaceHolderText =
        GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
            this.props.genericAssayType
        ]?.selectionConfig?.placeHolderText;

    componentDidMount() {
        void this.hydrateSelectedGenericAssayEntities(
            this.props.initialGenericAssayEntityIds || []
        );
    }

    componentWillUnmount() {
        this.debouncedLoadGenericAssayOptions.cancel();
    }

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

            if (shouldAddFrequencyTable) {
                this.props.onFrequencyTableSubmit!(option);
            }

            if (this.props.onChartSubmit && selectedEntityIds.length > 0) {
                const charts = selectedEntityIds.map(entityId => {
                    const entity = this._genericAssayEntityMap[entityId];
                    const entityName = GENERIC_ASSAY_CONFIG
                        .genericAssayConfigByType[
                        this.props.genericAssayType
                    ]?.selectionConfig?.formatChartNameUsingCompactLabel
                        ? formatGenericAssayCompactLabelByNameAndId(
                              entityId,
                              getGenericAssayPropertyOrDefault(
                                  entity
                                      ? entity.genericEntityMetaProperties
                                      : {},
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
                });
                this.props.onChartSubmit(charts);
            }

            if (shouldAddFrequencyTable || selectedEntityIds.length > 0) {
                this.clearSelectedEntities();
            }

            if (this.props.onTrackSubmit) {
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
        this._selectedGenericAssayEntityIds = this._loadedGenericAssayOptions.map(
            o => o.value
        );
    }

    @computed get canShowBulkToggle() {
        const threshold = this.props.selectAllThreshold;
        if (threshold === undefined) return false;
        return (
            this._totalGenericAssayOptionsCount > 0 &&
            this._totalGenericAssayOptionsCount <= threshold
        );
    }

    @computed get bulkToggleIsClear() {
        return this.validSelectedGenericAssayEntityIds.length > 0;
    }

    @action.bound
    private handleProfileSelect(option: any) {
        if (option && option.value) {
            this._selectedProfileOption = option;
            this._genericAssaySearchText = '';
            this.latestOptionsRequestId++;
            this.debouncedLoadGenericAssayOptions.cancel();
            this._defaultLoadedGenericAssayOptionValues = [];
            this._defaultLoadedGenericAssayOptionsCount = 0;
            this._defaultTotalGenericAssayOptionsCount = 0;
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
        if (this.props.allowEmptySubmission) {
            return false;
        } else {
            return _.isEmpty(this.validSelectedGenericAssayEntityIds);
        }
    }

    @computed get genericAssayEntitiesOptionsByValueMap(): {
        [value: string]: ISelectOption;
    } {
        return _.keyBy(this._loadedGenericAssayOptions, option => option.value);
    }

    @computed get validSelectedGenericAssayEntityIds(): string[] {
        return this._selectedGenericAssayEntityIds.filter(entityId => {
            if (entityId === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
                return this.selectedProfileSupportsFrequencyTable;
            }

            return !!this._genericAssayEntityMap[entityId];
        });
    }

    @action.bound
    private onSelectGenericAssayEntities(
        selectedOptions: ISelectOption[],
        selectInfo: any
    ) {
        const hadSearchText = this._genericAssaySearchText.length > 0;
        let candidateOptions = selectedOptions ? selectedOptions : [];
        if (
            selectInfo.action === 'select-option' &&
            selectInfo.option.value === 'select_all_filtered_options'
        ) {
            candidateOptions = _.union(
                this._loadedGenericAssayOptions,
                candidateOptions
            );
        }
        let candidateIds = candidateOptions.map(o => o.value);
        candidateIds = candidateIds.filter(
            id => id !== 'select_all_filtered_options'
        );
        this._selectedGenericAssayEntityIds = candidateIds;
        this._genericAssaySearchText = '';
        if (hadSearchText && this._defaultTotalGenericAssayOptionsCount > 0) {
            this._loadedGenericAssayOptionsCount =
                this._defaultLoadedGenericAssayOptionValues.filter(
                    value => !candidateIds.includes(value)
                ).length;
            this._totalGenericAssayOptionsCount =
                this._defaultTotalGenericAssayOptionsCount;
        }
    }

    @computed get selectedGenericAssayEntities(): ISelectOption[] {
        return this.validSelectedGenericAssayEntityIds.map(entityId => {
            if (entityId === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
                return {
                    value: GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
                    label: 'Frequency table',
                };
            }
            const entity = this._genericAssayEntityMap[entityId];
            return entity
                ? makeGenericAssayOption(entity)
                : { value: entityId, label: entityId };
        });
    }

    @computed
    private get selectedGenericAssayProfileIds() {
        if (!this.selectedProfileOption) {
            return [];
        }
        if (
            this.selectedProfileOption.profileIds &&
            this.selectedProfileOption.profileIds.length > 0
        ) {
            return this.selectedProfileOption.profileIds;
        }
        return [this.selectedProfileOption.value];
    }

    @computed
    private get selectableLoadedGenericAssayOptions() {
        return this._loadedGenericAssayOptions.filter(
            option => !this._selectedGenericAssayEntityIds.includes(option.value)
        );
    }

    @computed get selectedGenericAssaysJS() {
        return toJS(this.selectedGenericAssayEntities);
    }

    @computed
    private get warningCurrentCount() {
        if (
            this._genericAssaySearchText.length === 0 &&
            this._defaultTotalGenericAssayOptionsCount > 0
        ) {
            return this._defaultLoadedGenericAssayOptionsCount;
        }
        return this._loadedGenericAssayOptionsCount;
    }

    @computed
    private get warningTotalCount() {
        if (
            this._genericAssaySearchText.length === 0 &&
            this._defaultTotalGenericAssayOptionsCount > 0
        ) {
            return this._defaultTotalGenericAssayOptionsCount;
        }
        return this._totalGenericAssayOptionsCount;
    }

    @action.bound
    filterGenericAssayOption(option: ISelectOption, _filterString: string) {
        if (option.value === 'select_all_filtered_options') {
            return true;
        }
        if (option.value === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
            return !this._selectedGenericAssayEntityIds.includes(option.value);
        }
        return !this._selectedGenericAssayEntityIds.includes(option.value);
    }

    @action.bound
    onGenericAssayInputChange(input: string, inputInfo: any) {
        if (inputInfo.action === 'input-change') {
            this._genericAssaySearchText = input;
            if (
                input.length === 0 &&
                this._defaultTotalGenericAssayOptionsCount > 0
            ) {
                this._loadedGenericAssayOptionsCount =
                    this._defaultLoadedGenericAssayOptionsCount;
                this._totalGenericAssayOptionsCount =
                    this._defaultTotalGenericAssayOptionsCount;
            }
        } else if (inputInfo.action !== 'set-value') {
            this._genericAssaySearchText = '';
        }
    }

    @computed get isSelectedGenericAssayOptionsOverLimit() {
        return this._selectedGenericAssayEntityIds.length > 100;
    }

    private async hydrateSelectedGenericAssayEntities(entityIds: string[]) {
        if (entityIds.length === 0) {
            return;
        }
        const missingEntityIds = entityIds.filter(
            entityId => this._genericAssayEntityMap[entityId] === undefined
        );
        if (missingEntityIds.length === 0) {
            return;
        }
        const entities = await fetchGenericAssayMetaByEntityIds(
            missingEntityIds
        );
        this.updateGenericAssayEntityMap(entities);
    }

    @action.bound
    private updateGenericAssayEntityMap(entities: GenericAssayMeta[]) {
        if (entities.length === 0) {
            return;
        }
        this._genericAssayEntityMap = {
            ...this._genericAssayEntityMap,
            ..._.keyBy(entities, entity => entity.stableId),
        };
    }

    @action.bound
    private async loadGenericAssayOptions(inputText: string) {
        const requestId = ++this.latestOptionsRequestId;
        this._isLoadingOptions = true;
        const result = await fetchGenericAssayMetaPageByProfileIds(
            this.selectedGenericAssayProfileIds,
            inputText,
            DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
            0
        );
        if (requestId !== this.latestOptionsRequestId) {
            return [];
        }
        this.updateGenericAssayEntityMap(result.items);
        this._loadedGenericAssayOptions = result.items.map(makeGenericAssayOption);
        this._loadedGenericAssayOptionsCount =
            this.selectableLoadedGenericAssayOptions.length;
        this._totalGenericAssayOptionsCount = result.totalItems;
        this._isLoadingOptions = false;

        if (!inputText) {
            this._defaultLoadedGenericAssayOptionValues = result.items.map(
                item => item.stableId
            );
            this._defaultLoadedGenericAssayOptionsCount =
                this._loadedGenericAssayOptionsCount;
            this._defaultTotalGenericAssayOptionsCount =
                this._totalGenericAssayOptionsCount;
        }

        let optionsToReturn = this.selectableLoadedGenericAssayOptions;

        if (
            this.selectedProfileSupportsFrequencyTable &&
            !this._selectedGenericAssayEntityIds.includes(
                GENERIC_ASSAY_FREQUENCY_TABLE_OPTION
            )
        ) {
            optionsToReturn = _.concat(
                {
                    value: GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
                    label: 'Frequency table',
                } as ISelectOption,
                optionsToReturn
            );
        }

        if (
            inputText.length > 0 &&
            result.totalItems === this._loadedGenericAssayOptions.length &&
            this.selectableLoadedGenericAssayOptions.length > 0
        ) {
            optionsToReturn = _.concat(
                {
                    value: 'select_all_filtered_options',
                    label: `Select all filtered options (${this.selectableLoadedGenericAssayOptions.length})`,
                } as ISelectOption,
                optionsToReturn
            );
        }

        return optionsToReturn;
    }

    @action.bound
    private loadGenericAssayOptionsWithDebounce(
        inputText: string,
        callback: (options: ISelectOption[]) => void
    ) {
        if (!inputText) {
            this.debouncedLoadGenericAssayOptions.cancel();
            void this.loadGenericAssayOptions(inputText).then(callback);
            return;
        }
        this.debouncedLoadGenericAssayOptions(inputText, callback);
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
                        <AsyncSelect
                            key={
                                this.selectedProfileOption?.value ||
                                'generic-assay-select'
                            }
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
                            defaultOptions={true}
                            cacheOptions={false}
                            isLoading={this._isLoadingOptions}
                            filterOption={this.filterGenericAssayOption}
                            onInputChange={this.onGenericAssayInputChange}
                            onChange={this.onSelectGenericAssayEntities}
                            loadOptions={
                                this.loadGenericAssayOptionsWithDebounce
                            }
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
                                        current={this.warningCurrentCount}
                                        total={this.warningTotalCount}
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
                                        this._chartType =
                                            opt.value as GenericAssayChartType;
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
    total > current ? (
        <span className={styles.menuHeader}>
            Showing first {numeral(current).format('0,0')} of{' '}
            {numeral(total).format('0,0')} results. Refine search for specific
            options.
        </span>
    ) : null;
