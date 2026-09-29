import { assert } from 'chai';
import {
    autorun,
    IReactionDisposer,
    observable,
    runInAction,
    when,
} from 'mobx';
import { GenericAssayMeta, MolecularProfile } from 'cbioportal-ts-api-client';
import {
    fetchGenericAssayMetaByEntityIds,
    fetchGenericAssayMetaPageByProfileIds,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import {
    arrangeGenericAssayOptions,
    GenericAssayAxisOptions,
    GenericAssayPlotsOption,
    groupAndCapGenericAssayOptions,
    IGenericAssayAxisContext,
} from './GenericAssayAxisOptions';
import { SAME_SELECTED_OPTION_STRING_VALUE } from './PlotsTabTypes';

jest.mock('shared/lib/GenericAssayUtils/GenericAssayCommonUtils', () => ({
    ...jest.requireActual(
        'shared/lib/GenericAssayUtils/GenericAssayCommonUtils'
    ),
    fetchGenericAssayMetaPageByProfileIds: jest.fn(),
    fetchGenericAssayMetaByEntityIds: jest.fn(),
}));

const fetchPage = fetchGenericAssayMetaPageByProfileIds as jest.Mock;
const fetchByIds = fetchGenericAssayMetaByEntityIds as jest.Mock;

function option(value: string, label = value): GenericAssayPlotsOption {
    return { value, label, plotAxisLabel: label };
}

function meta(stableId: string, name?: string): GenericAssayMeta {
    return {
        stableId,
        entityType: 'GENERIC_ASSAY',
        genericEntityMetaProperties: name ? { NAME: name } : {},
    } as GenericAssayMeta;
}

const values = (options: GenericAssayPlotsOption[]) =>
    options.map(o => o.value);

describe('arrangeGenericAssayOptions', () => {
    const options = [
        option('a', 'a'),
        option('egfr', 'EGFR (cg2)'),
        option('b', 'b'),
        option('tp53', 'TP53 (cg1)'),
    ];

    it('keeps the order for types that are not gene related', () => {
        assert.deepEqual(
            values(
                arrangeGenericAssayOptions({
                    options,
                    queriedHugoGeneSymbols: ['TP53'],
                    hasNoQueriedGenes: false,
                    otherAxisHugoGeneSymbol: 'TP53',
                    isGeneRelatedOptions: false,
                })
            ),
            ['a', 'egfr', 'b', 'tp53']
        );
    });

    it('puts the other-axis gene first, then the other queried genes', () => {
        assert.deepEqual(
            values(
                arrangeGenericAssayOptions({
                    options,
                    queriedHugoGeneSymbols: ['EGFR', 'TP53'],
                    hasNoQueriedGenes: false,
                    otherAxisHugoGeneSymbol: 'TP53',
                    isGeneRelatedOptions: true,
                })
            ),
            ['tp53', 'egfr', 'a', 'b']
        );
    });

    it('puts the "Same" option before everything else', () => {
        const sameOption = option(SAME_SELECTED_OPTION_STRING_VALUE);
        assert.deepEqual(
            values(
                arrangeGenericAssayOptions({
                    options,
                    queriedHugoGeneSymbols: ['TP53'],
                    hasNoQueriedGenes: false,
                    isGeneRelatedOptions: true,
                    sameOption,
                })
            ),
            [SAME_SELECTED_OPTION_STRING_VALUE, 'tp53', 'a', 'egfr', 'b']
        );
    });
});

describe('groupAndCapGenericAssayOptions', () => {
    const options = ['a', 'b', 'c', 'd'].map(v => option(v));

    it('caps a flat list when nothing is selected', () => {
        const { display, shownCount } = groupAndCapGenericAssayOptions(
            options,
            [],
            2
        );
        assert.deepEqual(values(display as GenericAssayPlotsOption[]), [
            'a',
            'b',
        ]);
        assert.equal(shownCount, 2);
    });

    it('pins selected entities in their own group and caps only the rest', () => {
        const { display, shownCount } = groupAndCapGenericAssayOptions(
            options,
            ['d'],
            2
        );
        assert.deepEqual(display, [
            { label: 'Selected entities', options: [option('d')] },
            { label: 'Other entities', options: [option('a'), option('b')] },
        ]);
        assert.equal(shownCount, 3);
    });
});

describe('GenericAssayAxisOptions', () => {
    const profile = {
        molecularProfileId: 'study_methylation',
        genericAssayType: 'METHYLATION',
    } as MolecularProfile;

    type Mutable<T> = { -readonly [K in keyof T]: T[K] };
    let context: Mutable<IGenericAssayAxisContext>;
    let store: GenericAssayAxisOptions;
    let disposeObserver: IReactionDisposer;

    beforeEach(() => {
        fetchPage.mockReset();
        fetchByIds.mockReset();
        fetchPage.mockImplementation(
            (_ids: string[], searchTerm: string | undefined) => {
                const pages: { [term: string]: GenericAssayMeta[] } = {
                    '': [meta('cg0'), meta('cg9')],
                    TP53: [meta('cg1', 'TP53')],
                    EGFR: [meta('cg2', 'EGFR')],
                    cg9: [meta('cg9')],
                };
                const items = pages[searchTerm || ''] || [];
                return Promise.resolve({
                    items,
                    totalItems: searchTerm ? items.length : 500,
                });
            }
        );
        fetchByIds.mockImplementation((ids: string[]) =>
            Promise.resolve(ids.map(id => meta(id)))
        );
        context = observable({
            profiles: [profile],
            genericAssayType: 'METHYLATION',
            selectedEntityIds: [] as string[],
            queriedHugoGeneSymbols: ['TP53', 'EGFR'],
            hasNoQueriedGenes: false,
            otherAxisHugoGeneSymbol: 'TP53' as string | undefined,
            sameOption: undefined,
            urlOptionValue: undefined as string | undefined,
        });
        store = new GenericAssayAxisOptions(context);
        // keep the loaders observed, as the rendered selector and axis do
        disposeObserver = autorun(() => [
            store.menu,
            store.defaultOptions,
            store.metaById,
            store.hasNoEntities,
        ]);
    });

    afterEach(() => {
        disposeObserver();
        store.dispose();
    });

    const menuValues = () =>
        (store.menu.display as GenericAssayPlotsOption[]).map(o => o.value);

    it('lists the queried genes first and reports the server total', async () => {
        await when(() => !store.isLoading);
        assert.deepEqual(menuValues(), ['cg1', 'cg2', 'cg0', 'cg9']);
        assert.equal(store.menu.totalCount, 500);
    });

    it('reorders for the other-axis gene without fetching again', async () => {
        await when(() => !store.isLoading);
        const fetchCount = fetchPage.mock.calls.length;
        runInAction(() => (context.otherAxisHugoGeneSymbol = 'EGFR'));
        assert.deepEqual(menuValues(), ['cg2', 'cg1', 'cg0', 'cg9']);
        assert.equal(fetchPage.mock.calls.length, fetchCount);
    });

    it('searches on the server without changing the default options', async () => {
        await when(() => !store.isLoading);
        const defaultOptions = store.defaultOptions;
        store.onInputChange('cg9', { action: 'input-change' });
        assert.isTrue(store.isLoading);
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(menuValues(), ['cg9']);
        assert.equal(store.menu.totalCount, 1);
        assert.strictEqual(store.defaultOptions, defaultOptions);

        store.onSelect(option('cg9'));
        assert.equal(store.searchText, '');
        assert.deepEqual(menuValues(), ['cg1', 'cg2', 'cg0', 'cg9']);
    });

    it('keeps a picked option after its search is cleared', async () => {
        await when(() => !store.isLoading);
        const picked = option('cg_only_in_search', 'picked label');
        store.onSelect(picked);
        assert.strictEqual(store.resolveOption('cg_only_in_search'), picked);
    });

    it('fetches a deep-linked selection that is not in the default options', async () => {
        runInAction(() => (context.urlOptionValue = 'cg_deep'));
        await when(() => !!store.metaById['cg_deep']);
        expect(fetchByIds).toHaveBeenCalledWith(['cg_deep']);
        assert.equal(store.resolveOption('cg_deep').value, 'cg_deep');
    });

    it('pins url-selected entities even while searching', async () => {
        runInAction(() => (context.selectedEntityIds = ['cg_selected']));
        store.onInputChange('cg9', { action: 'input-change' });
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(store.menu.display, [
            {
                label: 'Selected entities',
                options: [option('cg_selected')],
            },
            { label: 'Other entities', options: [option('cg9')] },
        ]);
    });

    it('reports no entities only when the default page is empty', async () => {
        await when(() => !store.isLoading);
        assert.isFalse(store.hasNoEntities);
        fetchPage.mockResolvedValue({ items: [], totalItems: 0 });
        runInAction(() => (context.profiles = []));
        await when(() => store.hasNoEntities);
    });
});
