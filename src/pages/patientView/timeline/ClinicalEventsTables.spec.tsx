/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import ClinicalEventsTables from './ClinicalEventsTables';

// The router types predate React children props.
const TestRouter = MemoryRouter as React.ComponentType<
    React.PropsWithChildren<{}>
>;

jest.mock('config/config', () => ({
    getServerConfig: () => ({ skin_hide_download_controls: 'show' }),
}));

const SLIDES_PATH =
    '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=P-1-T01';

const PATIENT = { studyId: 'study', patientId: 'P-1' };

function event(
    eventType: string,
    linkout: string,
    attributes: Record<string, string> = {},
    linkoutKey = 'LINKOUT'
): ClinicalEvent {
    return ({
        eventType,
        patientId: 'P-1',
        studyId: 'study',
        startNumberOfDaysSinceDiagnosis: -505,
        attributes: [
            { key: 'SUBTYPE', value: 'H&E' },
            { key: 'SAMPLE_ID', value: 'P-1-T01' },
            ...Object.entries(attributes).map(([key, value]) => ({
                key,
                value,
            })),
            { key: linkoutKey, value: linkout },
        ],
    } as unknown) as ClinicalEvent;
}

function renderTables(events: ClinicalEvent[], linkPathologySlides: boolean) {
    return render(
        <TestRouter>
            <ClinicalEventsTables
                clinicalEvents={events}
                pathologySlides={linkPathologySlides ? PATIENT : undefined}
                sampleIds={['P-1-T01']}
            />
        </TestRouter>
    );
}

describe('ClinicalEventsTables', () => {
    it("links a PATHOLOGY SLIDES event's LINKOUT to the Pathology Slides tab", () => {
        renderTables([event('PATHOLOGY SLIDES', SLIDES_PATH)], true);

        const link = screen.getByText('Open slides');
        expect(link.closest('a')!.getAttribute('href')).toBe(SLIDES_PATH);
        expect(screen.queryByText(SLIDES_PATH)).toBeNull();
    });

    it('names the stain and sample in the link, like the timeline tooltip', () => {
        renderTables(
            [
                event('PATHOLOGY SLIDES', SLIDES_PATH),
                event('PATHOLOGY SLIDES', SLIDES_PATH, {
                    SAMPLE_ID: 'Unmatched',
                    MATCH_LEVEL: 'Unmatched',
                }),
            ],
            true
        );

        expect(
            screen.getByRole('link', { name: 'Open slides (H&E, P-1-T01)' })
        ).toBeTruthy();
        expect(
            screen.getByRole('link', { name: 'Open slides (H&E, Unmatched)' })
        ).toBeTruthy();
    });

    it('does not link slides with no viewable slide', () => {
        renderTables(
            [
                event('PATHOLOGY SLIDES', SLIDES_PATH, { IMAGE_COUNT: '0' }),
                event('PATHOLOGY SLIDES', SLIDES_PATH, { IMAGE_COUNT: '2' }),
            ],
            true
        );

        expect(screen.getAllByRole('link')).toHaveLength(1);
        expect(screen.getByText(SLIDES_PATH)).toBeTruthy();
    });

    it("does not link to another study's or patient's Pathology Slides tab", () => {
        const otherStudy =
            '/patient/wsiHESlides?studyId=other&caseId=P-1&sampleId=P-1-T01';
        const otherPatient =
            '/patient/wsiHESlides?studyId=study&caseId=P-2&sampleId=P-2-T01';
        renderTables(
            [
                event('PATHOLOGY SLIDES', otherStudy),
                event('PATHOLOGY SLIDES', otherPatient),
            ],
            true
        );

        expect(screen.queryByText('Open slides')).toBeNull();
        expect(screen.getByText(otherStudy)).toBeTruthy();
        expect(screen.getByText(otherPatient)).toBeTruthy();
    });

    it('reads the LINKOUT column in any case', () => {
        renderTables(
            [event('Pathology Slides', SLIDES_PATH, {}, 'linkout')],
            true
        );

        expect(
            screen
                .getByRole('link', { name: 'Open slides (H&E, P-1-T01)' })
                .getAttribute('href')
        ).toBe(SLIDES_PATH);
    });

    it('does not link other LINKOUT values', () => {
        renderTables(
            [
                event('PATHOLOGY SLIDES', 'https://example.com/x'),
                event('TREATMENT', SLIDES_PATH),
            ],
            true
        );

        expect(screen.queryByText('Open slides')).toBeNull();
        expect(screen.getByText('https://example.com/x')).toBeTruthy();
        expect(screen.getByText(SLIDES_PATH)).toBeTruthy();
    });

    it('leaves the LINKOUT out without a Pathology Slides tab', () => {
        renderTables([event('PATHOLOGY SLIDES', SLIDES_PATH)], false);

        expect(screen.queryByText('Open slides')).toBeNull();
        expect(screen.queryByText('LINKOUT')).toBeNull();
    });
});
