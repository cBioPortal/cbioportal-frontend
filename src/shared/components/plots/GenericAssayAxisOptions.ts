import * as _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { GenericAssayMeta, MolecularProfile } from 'cbioportal-ts-api-client';
import {
    fetchGenericAssayMetaByEntityIds,
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
// present, goes first.
export function arrangeGenericAssayOptions({
    options,
    queriedHugoGeneSymbols,
    hasNoQueriedGenes,
    otherAxisHugoGeneSymbol,
    isGeneRelatedOptions,
    sameOption,
}: IArrangeGenericAssayOptionsParams): GenericAssayPlotsOption[] {
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
    const arranged = _.uniqBy(
        [
            ...otherAxisGeneRelatedOptions,
            ...queriedGeneRelatedOptions,
            ...options,
        ] as GenericAssayPlotsOption[],
        o => o.value
    );
    return sameOption ? [sameOption, ...arranged] : arranged;
}

// Pins the entities selected at query time in their own group and caps the
// rest. The cap must run after arrangeGenericAssayOptions, otherwise the
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
    const selected = options.filter(o => selectedIdSet.has(o.value));
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

    readonly selectedEntitiesMeta = remoteData<GenericAssayMeta[]>({
        invoke: () =>
            fetchGenericAssayMetaByEntityIds(this.context.selectedEntityIds),
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

    // deep-linked selection that is not in the default options
    readonly urlOptionMeta = remoteData<GenericAssayMeta | undefined>({
        await: () => [this.defaultPage, this.selectedEntitiesMeta],
        invoke: async () => {
            const value = this.context.urlOptionValue;
            if (
                !value ||
                value === SAME_SELECTED_OPTION_STRING_VALUE ||
                this.pickedOptions[value] ||
                [
                    ...this.defaultPage.result!.items,
                    ...this.selectedEntitiesMeta.result!,
                ].some(m => m.stableId === value)
            ) {
                return undefined;
            }
            return (await fetchGenericAssayMetaByEntityIds([value]))[0];
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

    private arrange(metas: GenericAssayMeta[]) {
        return arrangeGenericAssayOptions({
            options: this.makeOptions(
                _.unionBy(
                    this.selectedEntitiesMeta.result!,
                    metas,
                    m => m.stableId
                )
            ),
            queriedHugoGeneSymbols: this.context.queriedHugoGeneSymbols,
            hasNoQueriedGenes: this.context.hasNoQueriedGenes,
            otherAxisHugoGeneSymbol: this.context.otherAxisHugoGeneSymbol,
            isGeneRelatedOptions: this.isGeneRelated,
            sameOption: this.context.sameOption,
        });
    }

    // options without search text; also used to pick the default selection,
    // so typing a search never changes the plotted entity
    @computed get defaultOptions() {
        return this.arrange(this.defaultPage.result!.items);
    }

    @computed private get isSearching() {
        return this.searchText.length > 0;
    }

    @computed get isLoading() {
        if (this.isSearching) {
            return (
                this.searchText !== this.debouncedSearchText ||
                !this.searchPage.isComplete ||
                this.searchPage.result!.searchText !== this.searchText
            );
        }
        return (
            this.defaultPage.isPending || this.selectedEntitiesMeta.isPending
        );
    }

    @computed get menu() {
        if (this.isLoading) {
            return { display: [], shownCount: 0, totalCount: 0 };
        }
        const options = this.isSearching
            ? this.arrange(this.searchPage.result!.items)
            : this.defaultOptions;
        const totalCount = this.isSearching
            ? this.searchPage.result!.totalItems
            : this.defaultPage.result!.totalItems;
        return {
            ...groupAndCapGenericAssayOptions(
                options,
                this.context.selectedEntityIds,
                DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING
            ),
            totalCount,
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
                ..._.compact([this.urlOptionMeta.result]),
                ..._.values(this.pickedMeta),
            ],
            m => m.stableId
        );
    }

    // Resolves the option object for a stored value. Reads only sources that
    // don't change while typing, so the axis data isn't reloaded per keystroke.
    resolveOption(value: string): GenericAssayPlotsOption {
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
        return { value, label: value, plotAxisLabel: value };
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
            this.pickedOptions = {
                ...this.pickedOptions,
                [option.value]: option,
            };
            const meta =
                this.searchPage.result?.items.find(
                    m => m.stableId === option.value
                ) || this.metaById[option.value];
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
