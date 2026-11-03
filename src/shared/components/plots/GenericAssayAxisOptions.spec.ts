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
    fetchGenericAssayMetaByEntityIdsInProfiles,
    fetchGenericAssayMetaPageByProfileIds,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import {
    arrangeGenericAssayOptions,
    GenericAssayAxisOptions,
    GenericAssayOptionGroup,
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
    fetchGenericAssayMetaByEntityIdsInProfiles: jest.fn(),
}));

const fetchPage = fetchGenericAssayMetaPageByProfileIds as jest.Mock;
const fetchByIdsInProfiles = fetchGenericAssayMetaByEntityIdsInProfiles as jest.Mock;

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

    it('orders the "Same" option like the other options', () => {
        const sameOption = option(
            SAME_SELECTED_OPTION_STRING_VALUE,
            'Same Methylation (EGFR (cg2))'
        );
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
            ['tp53', SAME_SELECTED_OPTION_STRING_VALUE, 'a', 'egfr', 'b']
        );
    });
});

describe('groupAndCapGenericAssayOptions', () => {
    const options = ['a', 'b', 'c', 'd'].map(v => option(v));

    it('caps a flat list when nothing is selected', () => {
        const { display } = groupAndCapGenericAssayOptions(options, [], 2);
        assert.deepEqual(values(display as GenericAssayPlotsOption[]), [
            'a',
            'b',
        ]);
    });

    it('pins selected entities in their own group and caps only the rest', () => {
        const { display } = groupAndCapGenericAssayOptions(options, ['d'], 2);
        assert.deepEqual(display, [
            { label: 'Selected entities', options: [option('d')] },
            { label: 'Other entities', options: [option('a'), option('b')] },
        ]);
    });
});

describe('GenericAssayAxisOptions', () => {
    const profile = {
        molecularProfileId: 'study_methylation',
        genericAssayType: 'METHYLATION',
    } as MolecularProfile;
    // entities of other profiles are not returned by the profile-scoped fetch
    const entitiesInProfile = ['cg_sel', 'cg_deep'];

    type Mutable<T> = { -readonly [K in keyof T]: T[K] };
    let context: Mutable<IGenericAssayAxisContext>;
    let store: GenericAssayAxisOptions;
    let disposeObserver: IReactionDisposer;

    beforeEach(() => {
        fetchPage.mockReset();
        fetchByIdsInProfiles.mockReset();
        fetchPage.mockImplementation(
            (_ids: string[], searchTerm: string | undefined) => {
                const pages: { [term: string]: GenericAssayMeta[] } = {
                    '': [meta('cg0'), meta('cg9')],
                    TP53: [meta('cg1', 'TP53')],
                    EGFR: [meta('cg2', 'EGFR')],
                    BRCA1: [meta('cg3', 'BRCA1')],
                    cg9: [meta('cg9')],
                    cg: [meta('cg0'), meta('cg9')],
                };
                const items = pages[searchTerm || ''] || [];
                return Promise.resolve({
                    items,
                    totalItems: searchTerm ? items.length : 500,
                });
            }
        );
        fetchByIdsInProfiles.mockImplementation((ids: string[]) =>
            Promise.resolve(
                ids
                    .filter(id => entitiesInProfile.includes(id))
                    .map(id => meta(id))
            )
        );
        context = observable({
            profiles: [profile],
            genericAssayType: 'METHYLATION',
            selectedEntityIds: [] as string[],
            queriedHugoGeneSymbols: ['TP53', 'EGFR'],
            hasNoQueriedGenes: false,
            otherAxisHugoGeneSymbol: 'TP53' as string | undefined,
            sameOption: undefined as GenericAssayPlotsOption | undefined,
            urlOptionValue: undefined as string | undefined,
        });
        store = new GenericAssayAxisOptions(context);
        // keep the loaders observed, as the rendered selector and axis do
        disposeObserver = autorun(() => [
            store.menu,
            store.defaultOptions,
            store.defaultPickOptions,
            store.metaById,
            store.hasNoEntities,
            // a rendered error state; unobserved errors go to the global handlers
            store.searchPage.error,
        ]);
    });

    afterEach(() => {
        disposeObserver();
        store.dispose();
    });

    const menuValues = () =>
        (store.menu.display as GenericAssayPlotsOption[]).map(o => o.value);

    it('lists the queried genes first and counts every entity', async () => {
        await when(() => !store.isLoading);
        assert.deepEqual(menuValues(), ['cg1', 'cg2', 'cg0', 'cg9']);
        assert.equal(store.menu.shownCount, 500);
        assert.equal(store.menu.totalCount, 500);
    });

    it('picks the default from entities in server order', async () => {
        await when(() => !store.isLoading);
        assert.deepEqual(values(store.defaultPickOptions), [
            'cg0',
            'cg1',
            'cg2',
            'cg9',
        ]);
    });

    it('reorders for the other-axis gene without fetching again', async () => {
        await when(() => !store.isLoading);
        const fetchCount = fetchPage.mock.calls.length;
        runInAction(() => (context.otherAxisHugoGeneSymbol = 'EGFR'));
        assert.deepEqual(menuValues(), ['cg2', 'cg1', 'cg0', 'cg9']);
        assert.equal(fetchPage.mock.calls.length, fetchCount);
    });

    it('fetches the other-axis gene when it is not a queried gene', async () => {
        runInAction(() => (context.otherAxisHugoGeneSymbol = 'BRCA1'));
        await when(() => !store.isLoading);
        assert.equal(menuValues()[0], 'cg3');
    });

    it('searches on the server without changing the default options', async () => {
        await when(() => !store.isLoading);
        const defaultOptions = store.defaultOptions;
        store.onInputChange('cg9', { action: 'input-change' });
        assert.isTrue(store.isLoading);
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(menuValues(), ['cg9']);
        assert.equal(store.menu.shownCount, 1);
        assert.strictEqual(store.defaultOptions, defaultOptions);

        store.onSelect(option('cg9'));
        assert.equal(store.searchText, '');
        assert.deepEqual(menuValues(), ['cg1', 'cg2', 'cg0', 'cg9']);
    });

    it('lists loaded entities of the queried genes first in search results', async () => {
        await when(() => !store.isLoading);
        // the search's first page has cg0 and cg9 only
        store.onInputChange('cg', { action: 'input-change' });
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(menuValues(), ['cg1', 'cg2', 'cg0', 'cg9']);
    });

    it('keeps the selected entities in server order', async () => {
        entitiesInProfile.push('cg1');
        runInAction(() => (context.selectedEntityIds = ['cg_sel', 'cg1']));
        await when(() => !store.isLoading);
        const [selectedGroup] = store.menu.display as GenericAssayOptionGroup[];
        assert.deepEqual(values(selectedGroup.options), ['cg1', 'cg_sel']);
        entitiesInProfile.pop();
    });

    it('stops loading when a search fails', async () => {
        await when(() => !store.isLoading);
        // MobxPromise attaches its handler on the next tick, so reject after it
        fetchPage.mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) =>
                    setTimeout(() => reject(new Error('failed')), 10)
                )
        );
        store.onInputChange('broken', { action: 'input-change' });
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(store.menu.display, []);
    });

    it('keeps a picked option after its search is cleared', async () => {
        await when(() => !store.isLoading);
        const picked = option('cg_only_in_search', 'picked label');
        store.onSelect(picked);
        assert.strictEqual(store.resolveOption('cg_only_in_search'), picked);
    });

    it('builds the picked option from meta when given a partial option', async () => {
        await when(() => !store.isLoading);
        store.onSelect({
            value: 'cg1',
            label: 'cg1',
        } as GenericAssayPlotsOption);
        assert.deepEqual(store.resolveOption('cg1'), {
            value: 'cg1',
            label: 'TP53 (cg1)',
            plotAxisLabel: 'TP53 (cg1)',
        });
    });

    it('resolves a deep-linked entity of the profile', async () => {
        runInAction(() => (context.urlOptionValue = 'cg_deep'));
        await when(() => !!store.metaById['cg_deep']);
        expect(fetchByIdsInProfiles).toHaveBeenCalledWith(
            ['cg_deep'],
            ['study_methylation']
        );
        assert.equal(store.resolveOption('cg_deep')!.value, 'cg_deep');
    });

    it('does not resolve a deep-linked entity outside the profile', async () => {
        runInAction(() => (context.urlOptionValue = 'cg_elsewhere'));
        await when(() => store.urlOptionMeta.isComplete);
        assert.isUndefined(store.resolveOption('cg_elsewhere'));
    });

    it('groups only the selected entities of this profile', async () => {
        runInAction(
            () => (context.selectedEntityIds = ['cg_sel', 'cg_elsewhere'])
        );
        await when(() => !store.isLoading);
        const [selectedGroup] = store.menu.display as GenericAssayOptionGroup[];
        assert.deepEqual(values(selectedGroup.options), ['cg_sel']);
        assert.equal(store.menu.shownCount, 499);
    });

    it('filters the selected entities by the search text', async () => {
        runInAction(() => (context.selectedEntityIds = ['cg_sel']));
        await when(() => !store.isLoading);
        store.onInputChange('cg9', { action: 'input-change' });
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(menuValues(), ['cg9']);
    });

    it('offers "Same" only when it matches the search text', async () => {
        runInAction(
            () =>
                (context.sameOption = option(
                    SAME_SELECTED_OPTION_STRING_VALUE,
                    'Same Methylation (cg0)'
                ))
        );
        await when(() => !store.isLoading);
        assert.equal(store.menu.totalCount, 501);
        store.onInputChange('cg9', { action: 'input-change' });
        await when(() => !store.isLoading, { timeout: 2000 });
        assert.deepEqual(menuValues(), ['cg9']);
    });

    it('reports no entities only when the default page is empty', async () => {
        await when(() => !store.isLoading);
        assert.isFalse(store.hasNoEntities);
        fetchPage.mockResolvedValue({ items: [], totalItems: 0 });
        runInAction(() => (context.profiles = []));
        await when(() => store.hasNoEntities);
    });
});
