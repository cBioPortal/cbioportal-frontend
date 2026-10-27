jest.mock('shared/lib/GenericAssayUtils/GenericAssayCommonUtils', () => ({
    ...jest.requireActual(
        'shared/lib/GenericAssayUtils/GenericAssayCommonUtils'
    ),
    fetchGenericAssayMetaPageByProfileIds: jest.fn(),
    fetchGenericAssayMetaByEntityIdsInProfiles: jest.fn(),
}));

import { assert } from 'chai';
import { autorun, IReactionDisposer, when } from 'mobx';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { DataTypeConstants } from 'shared/constants';
import {
    doesGenericAssayMetaMatchSearchTerm,
    fetchGenericAssayMetaByEntityIdsInProfiles,
    fetchGenericAssayMetaPageByProfileIds,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import GenericAssaySelection, {
    GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
    IGenericAssaySelectionProps,
} from './GenericAssaySelection';

const fetchPage = fetchGenericAssayMetaPageByProfileIds as jest.Mock;
const fetchByIdsInProfiles = fetchGenericAssayMetaByEntityIdsInProfiles as jest.Mock;

function meta(stableId: string, name?: string): GenericAssayMeta {
    return {
        stableId,
        entityType: 'GENERIC_ASSAY',
        genericEntityMetaProperties: name ? { NAME: name } : {},
    } as GenericAssayMeta;
}

describe('GenericAssaySelection', () => {
    const supportedProfile = {
        value: 'supported_profile',
        label: 'Supported Profile',
        profileName: 'Supported Profile',
        description: 'supported profile',
        dataType: DataTypeConstants.BINARY,
        patientLevel: false,
        count: 2,
    };

    const unsupportedProfile = {
        value: 'unsupported_profile',
        label: 'Unsupported Profile',
        profileName: 'Unsupported Profile',
        description: 'unsupported profile',
        dataType: DataTypeConstants.LIMITVALUE,
        patientLevel: false,
        count: 1,
    };

    // entities of each profile, in server order
    let entitiesByProfile: { [profileId: string]: GenericAssayMeta[] };
    let component: GenericAssaySelection;
    let disposeObserver: IReactionDisposer;

    function create(props: Partial<IGenericAssaySelectionProps>) {
        component = new GenericAssaySelection({
            molecularProfileOptions: [supportedProfile, unsupportedProfile],
            genericAssayType: 'TEST_GENERIC_ASSAY',
            submitButtonText: 'Add charts',
            ...props,
        } as IGenericAssaySelectionProps);
        // keep the loaders observed, as the rendered selector does
        disposeObserver = autorun(() => [
            component.validSelectedGenericAssayEntityIds,
            component.showingGenericAssayOptions,
            component.canShowBulkToggle,
            (component as any).matchCount,
            (component as any).profileEntityCount,
        ]);
        return component;
    }

    const optionValues = () =>
        component.showingGenericAssayOptions.map(o => o.value);
    const isLoaded = () => !(component as any).isLoadingOptions;

    beforeEach(() => {
        entitiesByProfile = {
            supported_profile: [meta('entity_a'), meta('entity_b')],
            unsupported_profile: [meta('entity_b')],
        };
        fetchPage.mockReset();
        fetchByIdsInProfiles.mockReset();
        fetchPage.mockImplementation(
            (
                profileIds: string[],
                searchTerm: string | undefined,
                pageSize: number,
                pageNumber: number
            ) => {
                const matching = (
                    entitiesByProfile[profileIds[0]] || []
                ).filter(m =>
                    doesGenericAssayMetaMatchSearchTerm(m, searchTerm)
                );
                return Promise.resolve({
                    items: matching.slice(
                        pageNumber * pageSize,
                        (pageNumber + 1) * pageSize
                    ),
                    totalItems: matching.length,
                });
            }
        );
        fetchByIdsInProfiles.mockImplementation(
            (ids: string[], profileIds: string[]) =>
                Promise.resolve(
                    (entitiesByProfile[profileIds[0]] || []).filter(m =>
                        ids.includes(m.stableId)
                    )
                )
        );
    });

    afterEach(() => disposeObserver());

    it('drops stale frequency-table and entity selections after switching profiles', async () => {
        let chartSubmitCount = 0;
        let frequencyTableSubmitCount = 0;
        entitiesByProfile.unsupported_profile = [meta('entity_b')];
        create({
            initialGenericAssayEntityIds: [
                GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
                'entity_a',
            ],
            onChartSubmit: () => {
                chartSubmitCount += 1;
            },
            onFrequencyTableSubmit: () => {
                frequencyTableSubmitCount += 1;
            },
        });

        await when(
            () => component.validSelectedGenericAssayEntityIds.length === 2
        );
        assert.deepEqual(component.validSelectedGenericAssayEntityIds, [
            GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
            'entity_a',
        ]);
        assert.isFalse((component as any).buttonDisabled);

        (component as any).handleProfileSelect(unsupportedProfile);
        await when(() => component.selectionCheck.isComplete);

        assert.deepEqual(component.validSelectedGenericAssayEntityIds, []);
        assert.deepEqual(component.selectedGenericAssaysJS, []);
        assert.isTrue((component as any).buttonDisabled);

        (component as any).onSubmit();
        assert.equal(chartSubmitCount, 0);
        assert.equal(frequencyTableSubmitCount, 0);
    });

    it('keeps a selection that also exists in the new profile', async () => {
        create({ initialGenericAssayEntityIds: ['entity_b'] });
        await when(
            () => component.validSelectedGenericAssayEntityIds.length === 1
        );
        (component as any).handleProfileSelect(unsupportedProfile);
        await when(
            () =>
                component.selectionCheck.isComplete &&
                (component as any).profileKey === 'unsupported_profile'
        );
        assert.deepEqual(component.validSelectedGenericAssayEntityIds, [
            'entity_b',
        ]);
    });

    it('selects every filtered entity, not just the first page', async () => {
        entitiesByProfile.supported_profile = Array.from(
            { length: 150 },
            (_x, i) => meta(`match_${i}`)
        ).concat([meta('other')]);
        create({});
        await when(isLoaded);

        component.onGenericAssayInputChange('match', {
            action: 'input-change',
        });
        await when(() => !(component as any).isSearching || isLoaded(), {
            timeout: 2000,
        });
        await when(isLoaded, { timeout: 2000 });
        assert.equal(
            component.showingGenericAssayOptions[0].label,
            'Select all filtered options (150)'
        );
        // the header counts every match
        assert.equal((component as any).matchCount, 150);
        assert.equal((component as any).profileEntityCount, 151);

        await (component as any).onSelectGenericAssayEntities(
            [component.showingGenericAssayOptions[0]],
            {
                action: 'select-option',
                option: component.showingGenericAssayOptions[0],
            }
        );
        assert.equal(component.validSelectedGenericAssayEntityIds.length, 150);
    });

    it('offers "Select all" for the whole profile, also while searching', async () => {
        create({ selectAllThreshold: 50 });
        await when(isLoaded);
        assert.isTrue(component.canShowBulkToggle);

        component.onGenericAssayInputChange('entity_a', {
            action: 'input-change',
        });
        await when(isLoaded, { timeout: 2000 });
        await (component as any).selectAllEntities();
        assert.deepEqual(component.validSelectedGenericAssayEntityIds, [
            'entity_a',
            'entity_b',
        ]);
    });

    it('lists matching entities of the prioritized genes first when searching', async () => {
        entitiesByProfile.supported_profile = [
            ...Array.from({ length: 120 }, (_x, i) =>
                meta(`cg${String(i).padStart(3, '0')}`)
            ),
            meta('cg900', 'TP53'),
        ];
        create({
            genericAssayType: 'METHYLATION',
            prioritizedHugoGeneSymbols: ['TP53'],
        });
        await when(isLoaded);
        component.onGenericAssayInputChange('cg', { action: 'input-change' });
        await when(isLoaded, { timeout: 2000 });
        assert.deepEqual(optionValues().slice(0, 4), [
            'select_all_filtered_options',
            GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
            'cg900',
            'cg000',
        ]);
    });

    it('lists entities of the prioritized genes first for gene-related types', async () => {
        entitiesByProfile.supported_profile = [
            meta('cg0'),
            meta('cg1'),
            meta('cg2', 'TP53'),
        ];
        create({
            genericAssayType: 'METHYLATION',
            prioritizedHugoGeneSymbols: ['TP53'],
        });
        await when(isLoaded);
        assert.deepEqual(optionValues(), [
            GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
            'cg2',
            'cg0',
            'cg1',
        ]);
    });
});
