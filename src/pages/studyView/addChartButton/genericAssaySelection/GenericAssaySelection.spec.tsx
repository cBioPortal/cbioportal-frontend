jest.mock('shared/lib/GenericAssayUtils/GenericAssayCommonUtils', () => ({
    ...jest.requireActual(
        'shared/lib/GenericAssayUtils/GenericAssayCommonUtils'
    ),
    fetchGenericAssayMetaByEntityIds: jest.fn(),
}));

import { assert } from 'chai';
import { DataTypeConstants } from 'shared/constants';
import { fetchGenericAssayMetaByEntityIds } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import GenericAssaySelection, {
    GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
} from './GenericAssaySelection';

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

    it('drops stale frequency-table and entity selections after switching profiles', async () => {
        (fetchGenericAssayMetaByEntityIds as jest.Mock).mockResolvedValue([
            {
                stableId: 'entity_a',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {},
            },
        ]);

        let chartSubmitCount = 0;
        let frequencyTableSubmitCount = 0;

        const component = new GenericAssaySelection({
            molecularProfileOptions: [supportedProfile, unsupportedProfile],
            genericAssayType: 'TEST_GENERIC_ASSAY',
            submitButtonText: 'Add charts',
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
        } as any);

        // componentDidMount fires this without awaiting it (fire-and-forget),
        // so drive it directly here to observe the hydrated result.
        await (component as any).hydrateSelectedGenericAssayEntities([
            GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
            'entity_a',
        ]);

        assert.deepEqual(component.validSelectedGenericAssayEntityIds, [
            GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
            'entity_a',
        ]);
        assert.isFalse((component as any).buttonDisabled);

        (component as any).handleProfileSelect(unsupportedProfile);

        assert.deepEqual(component.validSelectedGenericAssayEntityIds, []);
        assert.deepEqual(component.selectedGenericAssaysJS, []);
        assert.isTrue((component as any).buttonDisabled);

        (component as any).onSubmit();

        assert.equal(chartSubmitCount, 0);
        assert.equal(frequencyTableSubmitCount, 0);
    });
});
