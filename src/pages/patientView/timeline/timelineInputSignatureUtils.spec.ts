import {
    buildTimelineCaseMetaDataSignature,
    buildTimelineSampleManagerSignature,
} from './timelineInputSignatureUtils';

describe('timelineInputSignatureUtils', () => {
    it('reuses the same sample-manager signature for unchanged warm inputs', () => {
        const sampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'A',
                            value: '1',
                        },
                        {
                            clinicalAttributeId: 'B',
                            value: '2',
                        },
                    ],
                },
            ],
        } as any;

        const first = buildTimelineSampleManagerSignature(sampleManager);
        const second = buildTimelineSampleManagerSignature(sampleManager);

        expect(second).toBe(first);
    });

    it('recomputes the sample-manager signature when sample clinical data mutates in place', () => {
        const sampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'A',
                            value: '1',
                        },
                    ],
                },
            ],
        } as any;

        expect(buildTimelineSampleManagerSignature(sampleManager)).toBe('S-1::A:1');

        sampleManager.samples[0].clinicalData[0].value = '9';

        expect(buildTimelineSampleManagerSignature(sampleManager)).toBe('S-1::A:9');
    });

    it('reuses the same case-metadata signature for unchanged warm inputs', () => {
        const caseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 1 },
            label: { 'S-1': 'Sample 1' },
        };

        const first = buildTimelineCaseMetaDataSignature(caseMetaData);
        const second = buildTimelineCaseMetaDataSignature(caseMetaData);

        expect(second).toBe(first);
    });

    it('recomputes the case-metadata signature when values mutate in place', () => {
        const caseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 1 },
            label: { 'S-1': 'Sample 1' },
        };

        expect(buildTimelineCaseMetaDataSignature(caseMetaData)).toBe(
            'S-1:#123456:1:Sample 1'
        );

        caseMetaData.label['S-1'] = 'Updated sample';

        expect(buildTimelineCaseMetaDataSignature(caseMetaData)).toBe(
            'S-1:#123456:1:Updated sample'
        );
    });
});
