import * as React from 'react';
import _ from 'lodash';
import { GenericAssayChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable, toJS } from 'mobx';
import Select, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
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
    onSelectGenericAssayProfile?: (molecularProfileId: string) => void;
    onTrackSubmit?: (data: GenericAssayTrackInfo[]) => void;
    onChartSubmit?: (data: GenericAssayChart[]) => void;
}

export type GenericAssayTrackInfo = {
    profileId: string;
    genericAssayType: string;
    genericAssayEntityId: string;
};

export const DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING: number = 100;
export const GENERIC_ASSAY_SEARCH_DEBOUNCE_MS = 250;

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
        | IGenericAssayProfileOption
        | undefined = undefined;

    @observable.ref private _selectedGenericAssayEntityIds: string[] = [];
    @observable private _genericAssaySearchText: string = '';
    @observable.ref private _genericAssayEntityMap: {
        [stableId: string]: GenericAssayMeta;
    } = {};
    @observable.ref private _loadedGenericAssayOptions: ISelectOption[] = [];
    @observable private _loadedGenericAssayOptionsCount: number = 0;
    @observable private _totalGenericAssayOptionsCount: number = 0;
    @observable private _isLoadingOptions = false;
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
            // Generic Assay chart submit (StudyView)
            if (this.props.onChartSubmit) {
                const option = this.selectedProfileOption;
                const charts = this._selectedGenericAssayEntityIds.map(
                    entityId => {
                        const entity =
                            this._genericAssayEntityMap[entityId];
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
                    }
                );
                this.props.onChartSubmit(charts);
                // clear selected entities after submit new charts
                this.clearSelectedEntities();
            }
            // Generic Assay track submit (OncoPrint)
            if (this.props.onTrackSubmit) {
                const option = this.selectedProfileOption;
                // select profile if onSelectGenericAssayProfile exists
                const info = this._selectedGenericAssayEntityIds.map(
                    entityId => {
                        return {
                            profileId: option.value,
                            genericAssayType: this.props.genericAssayType,
                            genericAssayEntityId: entityId,
                        };
                    }
                );
                this.props.onTrackSubmit(info);
            }
        }
        // fail silently
    }

    @action.bound
    private clearSelectedEntities() {
        this._selectedGenericAssayEntityIds = [];
    }

    @action.bound
    private handleProfileSelect(option: any) {
        if (option && option.value) {
            this._selectedProfileOption = option;
            this._genericAssaySearchText = '';
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
    private get buttonDisabled() {
        // disable button only when we don't allow empty submissions and has zero selected entities
        if (this.props.allowEmptySubmission) {
            return false;
        } else {
            return _.isEmpty(this._selectedGenericAssayEntityIds);
        }
    }

    @computed get genericAssayEntitiesOptionsByValueMap(): {
        [value: string]: ISelectOption;
    } {
        return _.keyBy(this._loadedGenericAssayOptions, option => option.value);
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
                this._loadedGenericAssayOptions,
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
        return this._selectedGenericAssayEntityIds.map(entityId => {
            const entity = this._genericAssayEntityMap[entityId];
            return entity ? makeGenericAssayOption(entity) : { value: entityId, label: entityId };
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

    @action.bound
    filterGenericAssayOption(option: ISelectOption, filterString: string) {
        if (option.value === 'select_all_filtered_options') {
            return true;
        }
        return !this._selectedGenericAssayEntityIds.includes(option.value);
    }

    @action.bound
    onGenericAssayInputChange(input: string, inputInfo: any) {
        if (inputInfo.action === 'input-change') {
            this._genericAssaySearchText = input;
        } else if (inputInfo.action !== 'set-value') {
            this._genericAssaySearchText = '';
        }
    }

    // TODO: decide whether we need this or not
    // disabled currently
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
        const entities = await fetchGenericAssayMetaByEntityIds(missingEntityIds);
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
        this._loadedGenericAssayOptionsCount = this._loadedGenericAssayOptions.length;
        this._totalGenericAssayOptionsCount = result.totalItems;
        this._isLoadingOptions = false;
        if (
            inputText.length > 0 &&
            result.totalItems === this._loadedGenericAssayOptions.length &&
            this.selectableLoadedGenericAssayOptions.length > 0
        ) {
            return _.concat(
                {
                    value: 'select_all_filtered_options',
                    label: `Select all filtered options (${this.selectableLoadedGenericAssayOptions.length})`,
                } as ISelectOption,
                this.selectableLoadedGenericAssayOptions
            );
        }
        return this.selectableLoadedGenericAssayOptions;
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
                <div data-test="GenericAssayProfileSelection">
                    {/* {this.isSelectedGenericAssayOptionsOverLimit && (
                        <div className="alert alert-warning">
                            <i
                                className="fa fa-warning"
                                style={{ marginRight: 3 }}
                            />
                            Warning: we don't support adding more than 100
                            options, please make sure your selection has less
                            than 100 options.
                        </div>
                    )} */}
                    <Select
                        value={this.selectedProfileOption}
                        onChange={this.handleProfileSelect}
                        options={this.props.molecularProfileOptions}
                        isClearable={false}
                        isSearchable={false}
                    />
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
                            key={this.selectedProfileOption?.value || 'generic-assay-select'}
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
                                        current={
                                            this._loadedGenericAssayOptionsCount
                                        }
                                        total={
                                            this._totalGenericAssayOptionsCount
                                        }
                                    />
                                ),
                            }}
                        />
                    </div>
                    <button
                        disabled={this.buttonDisabled}
                        className="btn btn-primary btn-sm"
                        data-test="GenericAssaySelectionSubmitButton"
                        onClick={this.onSubmit}
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
