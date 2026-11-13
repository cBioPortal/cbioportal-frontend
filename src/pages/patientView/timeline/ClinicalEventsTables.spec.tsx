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

function event(eventType: string, linkout: string): ClinicalEvent {
    return ({
        eventType,
        patientId: 'P-1',
        studyId: 'study',
        startNumberOfDaysSinceDiagnosis: -505,
        attributes: [
            { key: 'SUBTYPE', value: 'H&E' },
            { key: 'LINKOUT', value: linkout },
        ],
    } as unknown) as ClinicalEvent;
}

function renderTables(events: ClinicalEvent[], linkPathologySlides: boolean) {
    return render(
        <TestRouter>
            <ClinicalEventsTables
                clinicalEvents={events}
                linkPathologySlides={linkPathologySlides}
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
