/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render } from '@testing-library/react';
import PatientWsiSlidesTab, {
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

    it('opens filtered from a study view slide table link', () => {
        // patient/wsiHESlides?...&pathologySlideSettings={"stainFilter":"ihc"}
        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ stainFilter: 'ihc' }}
            />
        );
        const props =
            mockEntryPoint.mock.calls[mockEntryPoint.mock.calls.length - 1][0];
        expect(props.initialStainFilter).toBe('ihc');
        expect(props.pathologyFilter).toBeUndefined();
        expect(props.preferredSampleId).toBeUndefined();
    });

    it('scopes a study view sample link to that sample', () => {
        render(
            <PatientWsiSlidesTab
                {...baseProps}
                query={{ sampleId: 'P-1-T01', stainFilter: 'ihc' }}
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
                initialStainFilter: 'ihc',
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
});
