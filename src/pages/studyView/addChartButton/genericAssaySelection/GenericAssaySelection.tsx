import * as React from 'react';
import _ from 'lodash';
import { GenericAssayChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import {
    action,
    computed,
    observable,
    makeObservable,
    runInAction,
    toJS,
} from 'mobx';
import Select, { components } from 'react-select';
import { MolecularProfileOption } from 'pages/studyView/StudyViewUtils';
import numeral from 'numeral';
import styles from './styles.module.scss';
import { ISelectOption } from 'shared/lib/GenericAssayUtils/GenericAssaySelectionUtils';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    compareGenericAssayStableIds,
    deriveDisplayTextFromGenericAssayType,
    doesGenericAssayMetaMatchSearchTerm,
    fetchGenericAssayMetaByEntityIdsInProfiles,
    fetchGenericAssayMetaPageByProfileIds,
    filterGenericAssayEntitiesByGenes,
    formatGenericAssayCompactLabelByNameAndId,
    getGenericAssayPropertyOrDefault,
    makeGenericAssayOption,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { DataTypeConstants } from 'shared/constants';
import { remoteData } from 'cbioportal-frontend-commons';

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
    // for gene-related types, entities of these genes are listed first
    prioritizedHugoGeneSymbols?: string[];
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
const SELECT_ALL_FILTERED_OPTIONS = 'select_all_filtered_options';

type EntityPage = {
    profileKey: string;
    searchText: string;
    items: GenericAssayMeta[];
    totalItems: number;
};

type DefaultEntityPage = EntityPage & {
    // entities of the prioritized genes, listed first
    prioritizedItems: GenericAssayMeta[];
};

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
    @observable private _debouncedSearchText: string = '';
    @observable private _chartType: GenericAssayChartType = 'heatmap';
    @observable private _isSelectingAll = false;
    // entities known to belong to a profile, keyed by profile key
    @observable.ref private _metaByProfileKey: {
        [profileKey: string]: { [stableId: string]: GenericAssayMeta };
    } = {};
    // ids already checked against a profile, found or not
    @observable.ref private _checkedIdsByProfileKey: {
        [profileKey: string]: { [stableId: string]: true };
    } = {};

    private readonly updateDebouncedSearchText = _.debounce(
        action((text: string) => {
            this._debouncedSearchText = text;
        }),
        GENERIC_ASSAY_SEARCH_DEBOUNCE_MS
    );
    private overridePlaceHolderText =
        GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
            this.props.genericAssayType
        ]?.selectionConfig?.placeHolderText;

    componentWillUnmount() {
        this.updateDebouncedSearchText.cancel();
    }

    @action.bound
    private onSubmit() {
        if (this.selectedProfileOption !== undefined) {
            const option = this
                .selectedProfileOption as MolecularProfileOption & {
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
                    const entity = this.profileMeta[entityId];
                    const entityName = GENERIC_ASSAY_CONFIG
                        .genericAssayConfigByType[this.props.genericAssayType]
                        ?.selectionConfig?.formatChartNameUsingCompactLabel
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
    private async selectAllEntities() {
        const page = this.defaultPage.result;
        if (!page) {
            return;
        }
        const entities = await this.fetchAllMatching(page, page.totalItems);
        runInAction(() => {
            this._selectedGenericAssayEntityIds = entities.map(e => e.stableId);
        });
    }

    @computed get canShowBulkToggle() {
        const threshold = this.props.selectAllThreshold;
        if (threshold === undefined || !this.defaultPage.isComplete) {
            return false;
        }
        const total = this.defaultPage.result!.totalItems;
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
    private get profileKey() {
        return this.selectedGenericAssayProfileIds.join(',');
    }

    @computed
    private get profileMeta() {
        return this._metaByProfileKey[this.profileKey] || {};
    }

    @computed
    private get prioritizedHugoGeneSymbols() {
        return GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
            this.props.genericAssayType
        ]?.globalConfig?.geneRelatedGenericAssayType
            ? this.props.prioritizedHugoGeneSymbols || []
            : [];
    }

    @action
    private rememberMeta(
        profileKey: string,
        entities: GenericAssayMeta[],
        checkedIds: string[] = []
    ) {
        if (entities.length > 0) {
            this._metaByProfileKey = {
                ...this._metaByProfileKey,
                [profileKey]: {
                    ...this._metaByProfileKey[profileKey],
                    ..._.keyBy(entities, e => e.stableId),
                },
            };
        }
        if (checkedIds.length > 0) {
            this._checkedIdsByProfileKey = {
                ...this._checkedIdsByProfileKey,
                [profileKey]: {
                    ...this._checkedIdsByProfileKey[profileKey],
                    ..._.fromPairs(checkedIds.map(id => [id, true])),
                },
            };
        }
    }

    // First page plus, for gene-related types, the entities of the prioritized
    // genes, which are listed first and may not be on the first page.
    readonly defaultPage = remoteData<DefaultEntityPage>({
        invoke: async () => {
            const profileKey = this.profileKey;
            const profileIds = this.selectedGenericAssayProfileIds;
            const genes = this.prioritizedHugoGeneSymbols;
            const [page, ...genePages] = await Promise.all([
                fetchGenericAssayMetaPageByProfileIds(
                    profileIds,
                    undefined,
                    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
                    0
                ),
                ...genes.map(gene =>
                    fetchGenericAssayMetaPageByProfileIds(
                        profileIds,
                        gene,
                        DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
                        0
                    )
                ),
            ]);
            const geneRelated = filterGenericAssayEntitiesByGenes(
                _.flatMap(genePages, p => p.items),
                genes
            ).sort((a, b) =>
                compareGenericAssayStableIds(a.stableId, b.stableId)
            );
            return {
                profileKey,
                searchText: '',
                items: _.uniqBy(
                    [...geneRelated, ...page.items],
                    e => e.stableId
                ),
                totalItems: page.totalItems,
                prioritizedItems: geneRelated,
            };
        },
        onResult: page =>
            page && this.rememberMeta(page.profileKey, page.items),
    });

    readonly searchPage = remoteData<EntityPage>({
        invoke: async () => {
            const profileKey = this.profileKey;
            const profileIds = this.selectedGenericAssayProfileIds;
            const searchText = this._debouncedSearchText;
            if (!searchText) {
                return { profileKey, searchText, items: [], totalItems: 0 };
            }
            const page = await fetchGenericAssayMetaPageByProfileIds(
                profileIds,
                searchText,
                DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
                0
            );
            return { profileKey, searchText, ...page };
        },
        onResult: page =>
            page && this.rememberMeta(page.profileKey, page.items),
    });

    // checks selected ids that haven't been seen in the selected profile yet,
    // e.g. ids from the url or kept after switching profile
    readonly selectionCheck = remoteData({
        invoke: async () => {
            const profileKey = this.profileKey;
            const profileIds = this.selectedGenericAssayProfileIds;
            const checked = this._checkedIdsByProfileKey[profileKey] || {};
            const uncheckedIds = this._selectedGenericAssayEntityIds.filter(
                id =>
                    id !== GENERIC_ASSAY_FREQUENCY_TABLE_OPTION &&
                    !this.profileMeta[id] &&
                    !checked[id]
            );
            if (uncheckedIds.length === 0) {
                return { profileKey, uncheckedIds, items: [] };
            }
            const items = await fetchGenericAssayMetaByEntityIdsInProfiles(
                uncheckedIds,
                profileIds
            );
            return { profileKey, uncheckedIds, items };
        },
        onResult: result =>
            result &&
            this.rememberMeta(
                result.profileKey,
                result.items,
                result.uncheckedIds
            ),
    });

    private async fetchAllMatching(page: EntityPage, totalItems: number) {
        if (page.items.length >= totalItems) {
            return page.items;
        }
        const all = await fetchGenericAssayMetaPageByProfileIds(
            this.selectedGenericAssayProfileIds,
            page.searchText || undefined,
            totalItems,
            0
        );
        this.rememberMeta(page.profileKey, all.items);
        return all.items;
    }

    @computed get validSelectedGenericAssayEntityIds(): string[] {
        // keeps the check running while the selector is rendered
        void this.selectionCheck.status;
        return this._selectedGenericAssayEntityIds.filter(entityId => {
            if (entityId === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION) {
                return this.selectedProfileSupportsFrequencyTable;
            }
            return !!this.profileMeta[entityId];
        });
    }

    @computed get selectedGenericAssayEntities(): ISelectOption[] {
        return this.validSelectedGenericAssayEntityIds.map(entityId =>
            entityId === GENERIC_ASSAY_FREQUENCY_TABLE_OPTION
                ? {
                      value: GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
                      label: 'Frequency table',
                  }
                : makeGenericAssayOption(this.profileMeta[entityId])
        );
    }

    @computed get selectedGenericAssaysJS() {
        return toJS(this.selectedGenericAssayEntities);
    }

    @computed private get isSearching() {
        return this._genericAssaySearchText.length > 0;
    }

    @computed private get isLoadingOptions() {
        if (this._isSelectingAll) {
            return true;
        }
        if (this.isSearching) {
            const page = this.searchPage.result;
            return (
                this._genericAssaySearchText !== this._debouncedSearchText ||
                this.searchPage.isPending ||
                !page ||
                page.searchText !== this._genericAssaySearchText ||
                page.profileKey !== this.profileKey
            );
        }
        return (
            this.defaultPage.isPending ||
            this.defaultPage.result?.profileKey !== this.profileKey
        );
    }

    @computed private get activePage(): EntityPage | undefined {
        if (this.isLoadingOptions) {
            return undefined;
        }
        return this.isSearching
            ? this.searchPage.result
            : this.defaultPage.result;
    }

    // unselected entities matching the search, across the whole profile
    @computed private get selectableMatchCount() {
        const page = this.activePage;
        if (!page) {
            return 0;
        }
        const selectedMatches = this._selectedGenericAssayEntityIds.filter(
            id =>
                this.profileMeta[id] &&
                doesGenericAssayMetaMatchSearchTerm(
                    this.profileMeta[id],
                    page.searchText
                )
        ).length;
        return Math.max(page.totalItems - selectedMatches, 0);
    }

    @computed get showingGenericAssayOptions(): ISelectOption[] {
        const page = this.activePage;
        if (!page) {
            return [];
        }
        // entities of the prioritized genes that match the search come first,
        // even when they're beyond the search's first page
        const prioritizedMatches = this.isSearching
            ? (this.defaultPage.result?.profileKey === this.profileKey
                  ? this.defaultPage.result.prioritizedItems
                  : []
              ).filter(m =>
                  doesGenericAssayMetaMatchSearchTerm(m, page.searchText)
              )
            : [];
        let options: ISelectOption[] = _.uniqBy(
            [...prioritizedMatches, ...page.items],
            m => m.stableId
        )
            .slice(0, DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING)
            .map(makeGenericAssayOption);
        if (this.selectedProfileSupportsFrequencyTable) {
            options = [
                {
                    value: GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
                    label: 'Frequency table',
                },
                ...options,
            ];
        }
        // offered only after filtering, since a profile can hold thousands of entities
        if (this.isSearching && this.selectableMatchCount > 0) {
            options = [
                {
                    value: SELECT_ALL_FILTERED_OPTIONS,
                    label: `Select all filtered options (${this.selectableMatchCount})`,
                },
                ...options,
            ];
        }
        return options;
    }

    // all entities matching the current search
    @computed private get matchCount() {
        return this.activePage ? this.activePage.totalItems : 0;
    }

    @computed private get profileEntityCount() {
        return this.defaultPage.result?.profileKey === this.profileKey
            ? this.defaultPage.result.totalItems
            : 0;
    }

    @action.bound
    private async onSelectGenericAssayEntities(
        selectedOptions: ISelectOption[],
        selectInfo: any
    ) {
        // selectedOptions can be null if delete the last selected option
        const candidateIds = (selectedOptions || [])
            .map(o => o.value)
            .filter(id => id !== SELECT_ALL_FILTERED_OPTIONS);
        const page = this.activePage;
        this.setSearchText('');
        if (
            selectInfo.action === 'select-option' &&
            selectInfo.option.value === SELECT_ALL_FILTERED_OPTIONS &&
            page
        ) {
            this._isSelectingAll = true;
            try {
                const matching = await this.fetchAllMatching(
                    page,
                    page.totalItems
                );
                runInAction(() => {
                    this._selectedGenericAssayEntityIds = _.union(
                        this._selectedGenericAssayEntityIds,
                        matching.map(e => e.stableId)
                    );
                });
            } finally {
                runInAction(() => {
                    this._isSelectingAll = false;
                });
            }
            return;
        }
        this._selectedGenericAssayEntityIds = candidateIds;
    }

    @action.bound
    filterGenericAssayOption(option: ISelectOption, _filterString: string) {
        // the options are already filtered by the server-side search
        if (option.value === SELECT_ALL_FILTERED_OPTIONS) {
            return true;
        }
        return !this._selectedGenericAssayEntityIds.includes(option.value);
    }

    @action
    private setSearchText(text: string) {
        this._genericAssaySearchText = text;
        if (text) {
            this.updateDebouncedSearchText(text);
        } else {
            this.updateDebouncedSearchText.cancel();
            this._debouncedSearchText = '';
        }
    }

    @action.bound
    onGenericAssayInputChange(input: string, inputInfo: any) {
        if (inputInfo.action === 'input-change') {
            this.setSearchText(input);
        } else if (inputInfo.action !== 'set-value') {
            this.setSearchText('');
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
                            isLoading={this.isLoadingOptions}
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
                                        current={this.matchCount}
                                        total={this.profileEntityCount}
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
