import { assert } from 'chai';
import { DataTypeConstants } from 'shared/constants';
import GenericAssaySelection, {
    GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
    GenericAssayTrackInfo,
} from './GenericAssaySelection';
import { GenericAssayTypeConstants } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';

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

    it('drops stale frequency-table and entity selections after switching profiles', () => {
        let chartSubmitCount = 0;
        let frequencyTableSubmitCount = 0;

        const component = new GenericAssaySelection({
            molecularProfileOptions: [supportedProfile, unsupportedProfile],
            genericAssayEntityOptions: [
                {
                    value: 'entity_a',
                    label: 'Entity A',
                },
            ],
            entityMap: {},
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

        assert.deepEqual(component.validSelectedGenericAssayEntityIds, [
            GENERIC_ASSAY_FREQUENCY_TABLE_OPTION,
            'entity_a',
        ]);
        assert.isFalse((component as any).buttonDisabled);

        (component.props as any).genericAssayEntityOptions = [
            {
                value: 'entity_b',
                label: 'Entity B',
            },
        ];
        (component as any).handleProfileSelect(unsupportedProfile);

        assert.deepEqual(component.validSelectedGenericAssayEntityIds, []);
        assert.deepEqual(component.selectedGenericAssaysJS, []);
        assert.isTrue((component as any).buttonDisabled);

        (component as any).onSubmit();

        assert.equal(chartSubmitCount, 0);
        assert.equal(frequencyTableSubmitCount, 0);
    });

    it('submits the configured categories when the chart type fixes the entities', () => {
        let submitted: GenericAssayTrackInfo[] = [];
        const component = new GenericAssaySelection({
            molecularProfileOptions: [unsupportedProfile],
            genericAssayEntityOptions: [
                { value: 'ISIG_KNN_PROBABILITY', label: 'KNN probability' },
            ],
            entityMap: {},
            genericAssayType: GenericAssayTypeConstants.ISIG_PROBABILITY,
            submitButtonText: 'Add tracks',
            initialGenericAssayEntityIds: [],
            allowEmptySubmission: true,
            showChartTypeSelector: true,
            onTrackSubmit: (info: GenericAssayTrackInfo[]) => {
                submitted = info;
            },
        } as any);

        assert.isTrue(component.entitiesFixedByChartType);
        (component as any).onSubmit();

        assert.deepEqual(
            submitted.map(d => d.genericAssayEntityId),
            ['ISIG_PROB_D', 'ISIG_PROB_F', 'ISIG_PROB_IE', 'ISIG_PROB_IE_F']
        );
        assert.isTrue(submitted.every(d => d.chartType === 'composition'));
    });
});
