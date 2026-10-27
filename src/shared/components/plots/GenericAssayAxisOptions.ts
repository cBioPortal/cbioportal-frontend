import * as _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { GenericAssayMeta, MolecularProfile } from 'cbioportal-ts-api-client';
import { createFilter } from 'react-select';
import {
    compareGenericAssayStableIds,
    doesGenericAssayMetaMatchSearchTerm,
    fetchGenericAssayMetaByEntityIdsInProfiles,
    fetchGenericAssayMetaPageByProfileIds,
    filterGenericAssayOptionsByGenes,
    makeGenericAssayPlotsTabOption,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
    GENERIC_ASSAY_SEARCH_DEBOUNCE_MS,
} from 'pages/studyView/addChartButton/genericAssaySelection/GenericAssaySelection';
import { SAME_SELECTED_OPTION_STRING_VALUE } from './PlotsTabTypes';

export type GenericAssayPlotsOption = {
    value: string;
    label: string;
    plotAxisLabel: string;
};

export type GenericAssayOptionGroup = {
    label: string;
    options: GenericAssayPlotsOption[];
};

export interface IArrangeGenericAssayOptionsParams {
    options: GenericAssayPlotsOption[];
    queriedHugoGeneSymbols: string[];
    hasNoQueriedGenes: boolean;
    otherAxisHugoGeneSymbol?: string;
    isGeneRelatedOptions?: boolean;
    sameOption?: GenericAssayPlotsOption;
}

// Order: options related to the gene selected on the other axis, then options
// related to any queried gene, then everything else. The "Same X" option, when
// present, starts the list before this ordering is applied.
export function arrangeGenericAssayOptions({
    options,
    queriedHugoGeneSymbols,
    hasNoQueriedGenes,
    otherAxisHugoGeneSymbol,
    isGeneRelatedOptions,
    sameOption,
}: IArrangeGenericAssayOptionsParams): GenericAssayPlotsOption[] {
    if (sameOption) {
        options = [sameOption, ...options];
    }
    const otherAxisGeneRelatedOptions =
        isGeneRelatedOptions && otherAxisHugoGeneSymbol
            ? filterGenericAssayOptionsByGenes(options, [
                  otherAxisHugoGeneSymbol,
              ])
            : [];
    const queriedGeneRelatedOptions = isGeneRelatedOptions
        ? hasNoQueriedGenes
            ? options
            : filterGenericAssayOptionsByGenes(options, queriedHugoGeneSymbols)
        : [];
    return _.uniqBy(
        [
            ...otherAxisGeneRelatedOptions,
            ...queriedGeneRelatedOptions,
            ...options,
        ] as GenericAssayPlotsOption[],
        o => o.value
    );
}

// react-select's default filter, which the selector applied on top of the
// search before options were searched on the server
const matchesReactSelectFilter = createFilter({});

function sortByStableId(metas: GenericAssayMeta[]) {
    return metas
        .slice()
        .sort((a, b) => compareGenericAssayStableIds(a.stableId, b.stableId));
}

// Pins the entities selected at query time in their own group, in the given
// order, and caps the rest. The cap must run after arrangeGenericAssayOptions, otherwise the
// options it would promote can be cut off.
export function groupAndCapGenericAssayOptions(
    options: GenericAssayPlotsOption[],
    selectedEntityIds: string[],
    cap: number
): {
    display: (GenericAssayPlotsOption | GenericAssayOptionGroup)[];
    shownCount: number;
} {
    const selectedIdSet = new Set(selectedEntityIds);
    const optionsByValue = _.keyBy(options, o => o.value);
    const selected = _.compact(selectedEntityIds.map(id => optionsByValue[id]));
    const other = options
        .filter(o => !selectedIdSet.has(o.value))
        .slice(0, cap);
    const shownCount = selected.length + other.length;
    if (selected.length === 0) {
        return { display: other, shownCount };
    }
    return {
        display: [
            { label: 'Selected entities', options: selected },
            { label: 'Other entities', options: other },
        ],
        shownCount,
    };
}

export interface IGenericAssayAxisContext {
    // empty unless this axis is showing a generic assay selector
    readonly profiles: MolecularProfile[];
    readonly genericAssayType: string | undefined;
    readonly selectedEntityIds: string[];
    readonly queriedHugoGeneSymbols: string[];
    readonly hasNoQueriedGenes: boolean;
    readonly otherAxisHugoGeneSymbol: string | undefined;
    readonly sameOption: GenericAssayPlotsOption | undefined;
    // raw option value stored in the url for this axis
    readonly urlOptionValue: string | undefined;
}

// Loads and arranges the generic assay options of one plots axis. The context
// must be an object of getters so each loader only tracks what it reads.
export class GenericAssayAxisOptions {
    @observable searchText = '';
    @observable private debouncedSearchText = '';
    @observable.ref private pickedOptions: {
        [value: string]: GenericAssayPlotsOption;
    } = {};
    @observable.ref private pickedMeta: {
        [stableId: string]: GenericAssayMeta;
    } = {};

    private readonly updateDebouncedSearchText = _.debounce(
        action((text: string) => {
            this.debouncedSearchText = text;
        }),
        GENERIC_ASSAY_SEARCH_DEBOUNCE_MS
    );

    constructor(private readonly context: IGenericAssayAxisContext) {
        makeObservable(this);
    }

    private get profileIds() {
        return this.context.profiles.map(p => p.molecularProfileId);
    }

    private get isGeneRelated() {
        const type = this.context.genericAssayType;
        return type
            ? GENERIC_ASSAY_CONFIG.genericAssayConfigByType[type]?.globalConfig
                  ?.geneRelatedGenericAssayType
            : undefined;
    }

    // entities selected at query time that belong to this axis's profiles
    readonly selectedEntitiesMeta = remoteData<GenericAssayMeta[]>({
        invoke: () =>
            fetchGenericAssayMetaByEntityIdsInProfiles(
                this.context.selectedEntityIds,
                this.profileIds
            ),
        default: [],
    });

    // First page plus, for gene-related types, a search per queried gene:
    // those entities may not be on the first page but are listed first.
    readonly defaultPage = remoteData({
        invoke: async () => {
            const profileIds = this.profileIds;
            const genes =
                this.isGeneRelated && !this.context.hasNoQueriedGenes
                    ? this.context.queriedHugoGeneSymbols
                    : [];
            const [page, ...geneRelatedPages] = await Promise.all([
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
            return {
                items: _.uniqBy(
                    _.flatten([
                        ...geneRelatedPages.map(p => p.items),
                        page.items,
                    ]),
                    m => m.stableId
                ),
                totalItems: page.totalItems,
            };
        },
        default: { items: [], totalItems: 0 },
    });

    // the gene on the other axis may not be a queried gene, e.g. in patient
    // and study view plots
    @computed private get otherAxisGeneToFetch() {
        const gene = this.context.otherAxisHugoGeneSymbol;
        return gene &&
            this.isGeneRelated &&
            (this.context.hasNoQueriedGenes ||
                !this.context.queriedHugoGeneSymbols.includes(gene))
            ? gene
            : undefined;
    }

    readonly otherAxisGenePage = remoteData<GenericAssayMeta[]>({
        invoke: async () => {
            const gene = this.otherAxisGeneToFetch;
            if (!gene) {
                return [];
            }
            return (
                await fetchGenericAssayMetaPageByProfileIds(
                    this.profileIds,
                    gene,
                    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
                    0
                )
            ).items;
        },
        default: [],
    });

    readonly searchPage = remoteData({
        invoke: async () => {
            const searchText = this.debouncedSearchText;
            if (!searchText) {
                return { searchText, items: [], totalItems: 0 };
            }
            const page = await fetchGenericAssayMetaPageByProfileIds(
                this.profileIds,
                searchText,
                DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
                0
            );
            return { searchText, ...page };
        },
    });

    // entities loaded without search text, in server order
    @computed private get defaultEntities() {
        return sortByStableId(
            _.uniqBy(
                [
                    ...this.defaultPage.result!.items,
                    ...this.otherAxisGenePage.result!,
                ],
                m => m.stableId
            )
        );
    }

    // deep-linked selection that is not in the default options
    readonly urlOptionMeta = remoteData<GenericAssayMeta | undefined>({
        await: () => [
            this.defaultPage,
            this.selectedEntitiesMeta,
            this.otherAxisGenePage,
        ],
        invoke: async () => {
            const value = this.context.urlOptionValue;
            if (
                !value ||
                value === SAME_SELECTED_OPTION_STRING_VALUE ||
                this.pickedOptions[value] ||
                [
                    ...this.defaultEntities,
                    ...this.selectedEntitiesMeta.result!,
                ].some(m => m.stableId === value)
            ) {
                return undefined;
            }
            return (
                await fetchGenericAssayMetaByEntityIdsInProfiles(
                    [value],
                    this.profileIds
                )
            )[0];
        },
    });

    private makeOptions(metas: GenericAssayMeta[]): GenericAssayPlotsOption[] {
        const profile = _.first(this.context.profiles.slice());
        const useCompactLabel = profile
            ? GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                  profile.genericAssayType
              ]?.plotsTabConfig?.plotsTabUsecompactLabel
            : undefined;
        return metas.map(meta =>
            makeGenericAssayPlotsTabOption(meta, useCompactLabel)
        );
    }

    private arrange(metas: GenericAssayMeta[], searchText?: string) {
        const sameOption = this.context.sameOption;
        return arrangeGenericAssayOptions({
            options: this.makeOptions(
                sortByStableId(
                    _.unionBy(
                        this.selectedEntitiesMeta.result!,
                        metas,
                        m => m.stableId
                    )
                )
            ),
            queriedHugoGeneSymbols: this.context.queriedHugoGeneSymbols,
            hasNoQueriedGenes: this.context.hasNoQueriedGenes,
            otherAxisHugoGeneSymbol: this.context.otherAxisHugoGeneSymbol,
            isGeneRelatedOptions: this.isGeneRelated,
            sameOption:
                sameOption &&
                (!searchText || this.matchesSearchText(sameOption, searchText))
                    ? sameOption
                    : undefined,
        });
    }

    private matchesSearchText(
        option: GenericAssayPlotsOption,
        searchText: string
    ) {
        return matchesReactSelectFilter(
            { label: option.label, value: option.value, data: option },
            searchText
        );
    }

    // options without search text, so typing a search never changes the
    // plotted entity
    @computed get defaultOptions() {
        return this.arrange(this.defaultEntities);
    }

    // the flat option list the default selection is picked from: "Same" first
    // on the vertical axis, then entities in server order
    @computed get defaultPickOptions(): GenericAssayPlotsOption[] {
        const options = this.makeOptions(this.defaultEntities);
        return this.context.sameOption
            ? [this.context.sameOption, ...options]
            : options;
    }

    @computed private get isSearching() {
        return this.searchText.length > 0;
    }

    @computed get isLoading() {
        if (this.isSearching) {
            return (
                this.searchText !== this.debouncedSearchText ||
                this.searchPage.isPending ||
                (this.searchPage.isComplete &&
                    this.searchPage.result!.searchText !== this.searchText)
            );
        }
        return (
            this.defaultPage.isPending ||
            this.selectedEntitiesMeta.isPending ||
            this.otherAxisGenePage.isPending
        );
    }

    @computed private get selectedOptions() {
        return this.makeOptions(
            sortByStableId(this.selectedEntitiesMeta.result!)
        );
    }

    // shownCount: options matching the search that are not selected entities;
    // totalCount: every option. The header shows when shownCount exceeds the cap.
    @computed get menu() {
        const searchFailed = this.isSearching && this.searchPage.isError;
        if (this.isLoading || searchFailed || this.defaultPage.isError) {
            return { display: [], shownCount: 0, totalCount: 0 };
        }
        const searchText = this.isSearching ? this.searchText : undefined;
        // loaded entities that match are merged in, so entities of the queried
        // genes are listed first even when they're beyond the search's first page
        const options = this.isSearching
            ? this.arrange(
                  _.unionBy(
                      this.searchPage.result!.items,
                      this.defaultEntities.filter(m =>
                          doesGenericAssayMetaMatchSearchTerm(
                              m,
                              this.searchText
                          )
                      ),
                      m => m.stableId
                  ),
                  this.searchText
              )
            : this.defaultOptions;
        const selectedIds = searchText
            ? this.selectedOptions
                  .filter(o => this.matchesSearchText(o, searchText))
                  .map(o => o.value)
            : this.selectedOptions.map(o => o.value);
        const visibleOptions = options.filter(
            o =>
                !this.context.selectedEntityIds.includes(o.value) ||
                selectedIds.includes(o.value)
        );
        const sameCount = options.some(
            o => o.value === SAME_SELECTED_OPTION_STRING_VALUE
        )
            ? 1
            : 0;
        const matchingTotal = this.isSearching
            ? this.searchPage.result!.totalItems
            : this.defaultPage.result!.totalItems;
        const selectedMatching = this.selectedEntitiesMeta.result!.filter(m =>
            doesGenericAssayMetaMatchSearchTerm(m, searchText)
        ).length;
        return {
            display: groupAndCapGenericAssayOptions(
                visibleOptions,
                selectedIds,
                DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING
            ).display,
            shownCount: matchingTotal - selectedMatching + sameCount,
            totalCount:
                this.defaultPage.result!.totalItems +
                (this.context.sameOption ? 1 : 0),
        };
    }

    @computed get hasNoEntities() {
        return (
            this.defaultPage.isComplete &&
            this.defaultPage.result!.totalItems === 0
        );
    }

    @computed get metaById(): { [stableId: string]: GenericAssayMeta } {
        return _.keyBy(
            [
                ...this.selectedEntitiesMeta.result!,
                ...this.defaultPage.result!.items,
                ...this.otherAxisGenePage.result!,
                ..._.compact([this.urlOptionMeta.result]),
                ..._.values(this.pickedMeta),
            ],
            m => m.stableId
        );
    }

    // Resolves the option object for a stored value. Reads only sources that
    // don't change while typing, so the axis data isn't reloaded per keystroke.
    // Returns undefined for a value that is not in this axis's profiles, so the
    // default selection is used instead.
    resolveOption(value: string): GenericAssayPlotsOption | undefined {
        const defaultOption = () =>
            this.defaultOptions.find(o => o.value === value);
        if (value === SAME_SELECTED_OPTION_STRING_VALUE) {
            // its label follows the horizontal selection, so never cache it
            return (
                defaultOption() || { value, label: value, plotAxisLabel: value }
            );
        }
        const option = this.pickedOptions[value] || defaultOption();
        if (option) {
            return option;
        }
        const meta = this.urlOptionMeta.result;
        if (meta && meta.stableId === value) {
            return this.makeOptions([meta])[0];
        }
        return undefined;
    }

    @action.bound
    onInputChange(input: string, inputInfo: { action: string }) {
        if (inputInfo.action === 'input-change') {
            this.searchText = input;
        } else if (inputInfo.action !== 'set-value') {
            this.searchText = '';
        }
        if (this.searchText) {
            this.updateDebouncedSearchText(this.searchText);
        } else {
            this.updateDebouncedSearchText.cancel();
            this.debouncedSearchText = '';
        }
    }

    @action.bound
    onSelect(option: GenericAssayPlotsOption | undefined) {
        if (option && option.value) {
            const meta =
                this.searchPage.result?.items.find(
                    m => m.stableId === option.value
                ) || this.metaById[option.value];
            // callers may pass a partial option, so prefer one built from meta
            this.pickedOptions = {
                ...this.pickedOptions,
                [option.value]: meta ? this.makeOptions([meta])[0] : option,
            };
            if (meta) {
                this.pickedMeta = {
                    ...this.pickedMeta,
                    [meta.stableId]: meta,
                };
            }
        }
        this.onInputChange('', { action: 'menu-close' });
    }

    dispose() {
        this.updateDebouncedSearchText.cancel();
    }
}
