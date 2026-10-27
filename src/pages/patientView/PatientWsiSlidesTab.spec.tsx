/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render } from '@testing-library/react';
import PatientWsiSlidesTab, {
    resetOpeningWsiSlidesLink,
    wsiSlidesTabScopeFromQuery,
} from './PatientWsiSlidesTab';

const mockEntryPoint = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('shared/components/wsiViewer/wsiAppConfig', () => ({
    AppWsiViewer: (props: Record<string, unknown>) => mockEntryPoint(props),
}));

const LINK_QUERY = {
    sampleId: 'P-1-T01',
    stainFilter: 'ihc',
    matchLevel: 'PART',
    specimenKey: 'part::1',
};

describe('wsiSlidesTabScopeFromQuery', () => {
    it('maps pathology slide link params to viewer props', () => {
        expect(wsiSlidesTabScopeFromQuery(LINK_QUERY)).toEqual({
            preferredSampleId: 'P-1-T01',
            pathologyFilter: {
                sampleId: 'P-1-T01',
                matchLevel: 'PART',
                specimenKey: 'part::1',
            },
            initialStainFilter: 'ihc',
        });
    });

    it('scopes the slide list to a linked sample', () => {
        expect(wsiSlidesTabScopeFromQuery({ sampleId: 'P-1-T01' })).toEqual({
            preferredSampleId: 'P-1-T01',
            pathologyFilter: {
                sampleId: 'P-1-T01',
                matchLevel: undefined,
                specimenKey: undefined,
            },
            initialStainFilter: undefined,
        });
        expect(wsiSlidesTabScopeFromQuery({})).toEqual({
            preferredSampleId: undefined,
            pathologyFilter: undefined,
            initialStainFilter: undefined,
        });
    });

    it('accepts only the viewer stain filters', () => {
        expect(
            wsiSlidesTabScopeFromQuery({ stainFilter: 'HNE' })
                .initialStainFilter
        ).toBe('hne');
        expect(
            wsiSlidesTabScopeFromQuery({ stainFilter: 'other' })
                .initialStainFilter
        ).toBe('other');
        expect(
            wsiSlidesTabScopeFromQuery({ stainFilter: 'unknown' })
                .initialStainFilter
        ).toBe('unknown');
        expect(
            wsiSlidesTabScopeFromQuery({ stainFilter: 'all' })
                .initialStainFilter
        ).toBeUndefined();
        expect(
            wsiSlidesTabScopeFromQuery({ stainFilter: 'bogus' })
                .initialStainFilter
        ).toBeUndefined();
    });

    it('drops the link scope when the hash names a slide', () => {
        expect(wsiSlidesTabScopeFromQuery(LINK_QUERY, 'slide-9')).toEqual({
            preferredSampleId: 'P-1-T01',
        });
    });
});

describe('PatientWsiSlidesTab', () => {
    afterEach(() => {
        mockEntryPoint.mockClear();
        window.history.replaceState(null, '', '/');
        resetOpeningWsiSlidesLink();
    });

    const baseProps = {
        patientId: 'P-1',
        studyId: 'study',
        tileServerUrl: 'https://tiles.example',
        height: 600,
    };

    it('passes the URL scope to the viewer', () => {
        render(<PatientWsiSlidesTab {...baseProps} query={LINK_QUERY} />);
        expect(mockEntryPoint).toHaveBeenLastCalledWith(
            expect.objectContaining({
                patientId: 'P-1',
                preferredSampleId: 'P-1-T01',
                pathologyFilter: {
                    sampleId: 'P-1-T01',
                    matchLevel: 'PART',
                    specimenKey: 'part::1',
                },
                initialStainFilter: 'ihc',
            })
        );
    });

    it('leaves the sample scope to the page sample filter', () => {
        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        );
        expect(mockEntryPoint).toHaveBeenLastCalledWith(
            expect.objectContaining({
                pathologyFilter: expect.objectContaining({
                    sampleId: 'P-1-T01',
                }),
                hostOwnsSampleScope: true,
            })
        );
    });

    it('lets a hash slide deep link take precedence', () => {
        window.history.replaceState(null, '', '/#wsi:slide=slide-9');
        render(<PatientWsiSlidesTab {...baseProps} query={LINK_QUERY} />);
        const props =
            mockEntryPoint.mock.calls[mockEntryPoint.mock.calls.length - 1][0];
        expect(props.pathologyFilter).toBeUndefined();
        expect(props.initialStainFilter).toBeUndefined();
        expect(props.preferredSampleId).toBe('P-1-T01');
    });

    it('scopes to a newly picked sample even though the hash names the previous slide', () => {
        window.history.replaceState(null, '', '/#wsi:slide=slide-9');
        const first = render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T02' }}
            />
        );
        expect(
            mockEntryPoint.mock.calls[mockEntryPoint.mock.calls.length - 1][0]
                .pathologyFilter
        ).toBeUndefined();
        // The patient view remounts the tab for the new sample.
        first.unmount();

        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        );

        expect(mockEntryPoint).toHaveBeenLastCalledWith(
            expect.objectContaining({
                preferredSampleId: 'P-1-T01',
                pathologyFilter: {
                    sampleId: 'P-1-T01',
                    matchLevel: undefined,
                    specimenKey: undefined,
                },
            })
        );
        // The stale slide is dropped from the URL, so a reload keeps the scope.
        expect(window.location.hash).toBe('');
    });

    it('scopes to the opening sample again once the hash names another sample', () => {
        const lastProps = () =>
            mockEntryPoint.mock.calls[mockEntryPoint.mock.calls.length - 1][0];
        const opening = render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        );
        opening.unmount();
        const picked = render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T02' }}
            />
        );
        // The viewer writes the T02 slide it shows to the hash.
        window.history.replaceState(null, '', '/#wsi:slide=slide-t02');
        picked.unmount();

        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        );

        expect(lastProps().pathologyFilter).toEqual(
            expect.objectContaining({ sampleId: 'P-1-T01' })
        );
        expect(window.location.hash).toBe('');
    });

    it("keeps the user's slide when the tab remounts at the same link", () => {
        const first = render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        );
        window.history.replaceState(null, '', '/#wsi:slide=slide-t01');
        first.unmount();

        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        );

        expect(window.location.hash).toBe('#wsi:slide=slide-t01');
    });

    it("treats a hash as a deep link when another patient's link opens", () => {
        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01' }}
            />
        ).unmount();
        window.history.replaceState(null, '', '/#wsi:slide=slide-p2');

        render(
            <PatientWsiSlidesTab
                {...baseProps}
                patientId="P-2"
                query={{ sampleId: 'P-2-T01' }}
            />
        );

        const props =
            mockEntryPoint.mock.calls[mockEntryPoint.mock.calls.length - 1][0];
        expect(props.pathologyFilter).toBeUndefined();
        expect(props.preferredSampleId).toBe('P-2-T01');
    });
});
