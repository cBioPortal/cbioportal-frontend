import React from 'react';
import TestRenderer from 'react-test-renderer';
import PatientViewPageHeader from './PatientViewPageHeader';

jest.mock('pages/patientView/patientHeader/PatientHeader', () => () => (
    <div data-testid="patient-header">patient header</div>
));

jest.mock('pages/patientView/sampleHeader/SampleSummaryList', () => () => (
    <div data-testid="sample-summary-list">sample summary list</div>
));

jest.mock('cbioportal-utils', () => ({
    getRemoteDataGroupStatus: jest.fn(),
}));

const { getRemoteDataGroupStatus } = jest.requireMock('cbioportal-utils');

function makeProps(overrides: Record<string, unknown> = {}) {
    return {
        handlePatientClick: jest.fn(),
        handleSampleClick: jest.fn(),
        toggleGenePanelModal: jest.fn(),
        genePanelModal: { isOpen: false },
        pageStore: {
            patientViewData: { result: { patient: {} } },
            studyId: 'study',
            darwinUrl: { result: '' },
            sampleManager: { result: {} },
            studyMetaData: {},
            hasMutationalSignatureData: {},
            mutationalSignatureDataGroupByVersion: {},
            allSamplesForPatient: {},
        },
        ...overrides,
    } as any;
}

describe('PatientViewPageHeader', () => {
    beforeEach(() => {
        getRemoteDataGroupStatus.mockReset();
    });

    it('renders the sample summary override instead of the default sample summary list', () => {
        getRemoteDataGroupStatus.mockReturnValue('complete');

        const renderer = TestRenderer.create(
            <PatientViewPageHeader
                {...makeProps({
                    sampleSummaryOverride: (
                        <div data-testid="summary-override">override</div>
                    ),
                })}
            />
        );

        expect(() =>
            renderer.root.findByProps({ 'data-testid': 'summary-override' })
        ).not.toThrow();
        expect(
            renderer.root.findAllByProps({
                'data-testid': 'sample-summary-list',
            })
        ).toHaveLength(0);
        renderer.unmount();
    });

    it('renders the default sample summary list when complete and no override is provided', () => {
        getRemoteDataGroupStatus.mockReturnValue('complete');

        const renderer = TestRenderer.create(
            <PatientViewPageHeader {...makeProps()} />
        );

        expect(() =>
            renderer.root.findByProps({
                'data-testid': 'sample-summary-list',
            })
        ).not.toThrow();
        renderer.unmount();
    });
});
