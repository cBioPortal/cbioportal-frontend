/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Portal } from 'react-overlays';
import {
    configureTracks,
    TimelineEvent,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import { buildBaseConfig, sortTracks } from './timeline_helpers';
import {
    hasPathologySlideEvents,
    pathologySlideGroupMarker,
    pathologySlideMarkerSample,
    pathologySlidesTrackConfig,
    UNMATCHED_MARKER_COLOR,
    withoutPathologySlideLinkouts,
} from './pathologySlidesTimeline';
import { ISampleMetaDeta } from './TimelineWrapper';

function event(
    eventType: string,
    days: number,
    attributes: Record<string, string>
): ClinicalEvent {
    return {
        eventType,
        startNumberOfDaysSinceDiagnosis: days,
        attributes: Object.entries(attributes).map(([key, value]) => ({
            key,
            value,
        })),
    } as ClinicalEvent;
}

// react-router 5 typings predate React 18's implicit-children removal.
const TestRouter = MemoryRouter as React.ComponentType<
    React.PropsWithChildren<{ initialEntries: string[] }>
>;
const TestPortal = (Portal as unknown) as React.ComponentType<
    React.PropsWithChildren<{ container: HTMLElement }>
>;

const SAMPLE = 'P-0000081-T02-IM6';
/** A LINKOUT as written by pdm's generate_pathology_timeline_files.py. */
function pdmLinkout(matchLevel: string, sampleId?: string): string {
    const params = new URLSearchParams({
        studyId: 'mskimpact',
        caseId: 'P-0000081',
        ...(sampleId ? { sampleId } : {}),
        pathologySlideSettings: JSON.stringify({
            stainFilter: 'hne',
            matchLevel,
            specimenKey: 'sk_0123456789abcdef',
        }),
    });
    return `/patient/wsiHESlides?${params.toString()}`;
}

const LINKOUT = pdmLinkout('PART', SAMPLE);

/** Attributes of a pathology timeline file row. */
interface SlideRow {
    sampleId?: string;
    matchLevel: string;
    stain: string;
    specimen: string;
    viewable: number;
    total: number;
    linkout: string;
}

const UNMATCHED: Partial<SlideRow> = {
    matchLevel: 'Unmatched',
    sampleId: 'Unmatched',
    linkout: pdmLinkout('Unmatched'),
};

/** A PATHOLOGY SLIDES clinical event imported from the timeline file. */
function slide(row: Partial<SlideRow>, days = 920): ClinicalEvent {
    const r: SlideRow = {
        sampleId: SAMPLE,
        matchLevel: 'PART',
        stain: 'H&E',
        specimen: 'Part 1',
        viewable: 1,
        total: 1,
        linkout: LINKOUT,
        ...row,
    };
    return event('PATHOLOGY SLIDES', days, {
        SAMPLE_ID: r.sampleId || '',
        SUBTYPE: r.stain,
        MATCH_LEVEL: r.matchLevel,
        SPECIMEN: r.specimen,
        IMAGE_COUNT: String(r.viewable),
        NON_SERVABLE_IMAGE_COUNT: String(r.total - r.viewable),
        TOTAL_IMAGE_COUNT: String(r.total),
        TIMEPOINT_SOURCE: 'Procedure date relative to first ICD-O diagnosis',
        LINKOUT: r.viewable > 0 ? r.linkout : '',
    });
}

const CASE_META: ISampleMetaDeta = {
    color: { [SAMPLE]: '#ff0000', 'P-0000081-T01-IM3': '#0000ff' },
    label: { [SAMPLE]: '2', 'P-0000081-T01-IM3': '1' },
    index: { [SAMPLE]: 1, 'P-0000081-T01-IM3': 0 },
};

const SEQUENCING = event('Sequencing', 962, { SAMPLE_ID: SAMPLE });

function configuredTracks(slides: ClinicalEvent[]) {
    const data = [...slides, SEQUENCING];
    const config = buildBaseConfig({} as SampleManager, CASE_META, [
        pathologySlidesTrackConfig(CASE_META, data),
    ]);
    const tracks = sortTracks(config, data);
    configureTracks(tracks, config);
    return tracks;
}

function pathologyRoot(slides: ClinicalEvent[]): TimelineTrackSpecification {
    return configuredTracks(slides).find(t => t.type === 'PATHOLOGY SLIDES')!;
}

/** The stain row of the PATHOLOGY SLIDES track (H&E unless given). */
function pathologyTrack(
    slides: ClinicalEvent[],
    stain = 'H&E'
): TimelineTrackSpecification {
    return pathologyRoot(slides).tracks!.find(t => t.type === stain)!;
}

function renderTooltip(track: TimelineTrackSpecification, item: TimelineEvent) {
    let location: { pathname: string; search: string } | undefined;
    render(
        <TestRouter initialEntries={['/patient/summary']}>
            <TestPortal container={document.body}>
                {track.renderTooltip!(item)}
            </TestPortal>
            <Route
                path="*"
                render={props => {
                    location = props.location;
                    return null;
                }}
            />
        </TestRouter>
    );
    return () => location;
}

describe('withoutPathologySlideLinkouts', () => {
    it('drops LINKOUT from PATHOLOGY SLIDES events only', () => {
        const slides = event('PATHOLOGY SLIDES', 10, {
            SUBTYPE: 'H&E',
            LINKOUT,
        });
        const imaging = event('IMAGING', 20, { linkout: 'https://x.org' });
        const [slidesOut, imagingOut] = withoutPathologySlideLinkouts([
            slides,
            imaging,
        ]);
        expect(slidesOut.attributes.map(a => a.key)).toEqual(['SUBTYPE']);
        expect(imagingOut).toBe(imaging);
        expect(slides.attributes.map(a => a.key)).toEqual([
            'SUBTYPE',
            'LINKOUT',
        ]);
    });
});

describe('pathologySlideMarkerSample', () => {
    it("maps matched events to their sample's color and number", () => {
        expect(pathologySlideMarkerSample(slide({}), CASE_META)).toEqual({
            sampleId: SAMPLE,
            color: '#ff0000',
            label: '2',
        });
    });

    it('returns null for unmatched events and samples outside the patient', () => {
        expect(
            pathologySlideMarkerSample(slide(UNMATCHED), CASE_META)
        ).toBeNull();
        expect(
            pathologySlideMarkerSample(
                slide({ sampleId: 'P-OTHER' }),
                CASE_META
            )
        ).toBeNull();
    });
});

describe('pathologySlideGroupMarker', () => {
    const sample1 = {
        sampleId: 'P-0000081-T01-IM3',
        color: '#0000ff',
        label: '1',
    };
    const sample2 = { sampleId: SAMPLE, color: '#ff0000', label: '2' };

    it('uses one sample marker when every event has the same sample', () => {
        expect(
            pathologySlideGroupMarker(
                [slide({}), slide({ stain: 'IHC' })],
                CASE_META
            )
        ).toEqual({ kind: 'sample', sample: sample2, count: 2 });
    });

    it('deduplicates samples of a mixed group and skips unmatched events', () => {
        expect(
            pathologySlideGroupMarker(
                [
                    slide({}),
                    slide({ stain: 'IHC' }),
                    slide({ sampleId: 'P-0000081-T01-IM3' }),
                    slide(UNMATCHED),
                ],
                CASE_META
            )
        ).toEqual({ kind: 'samples', samples: [sample2, sample1], count: 4 });
        expect(
            pathologySlideGroupMarker([slide({}), slide(UNMATCHED)], CASE_META)
        ).toEqual({ kind: 'samples', samples: [sample2], count: 2 });
    });

    it('marks groups without a patient sample as unmatched', () => {
        expect(
            pathologySlideGroupMarker(
                [slide(UNMATCHED), slide({ sampleId: 'P-OTHER' })],
                CASE_META
            )
        ).toEqual({ kind: 'unmatched', count: 2 });
    });
});

describe('PATHOLOGY SLIDES timeline track', () => {
    function renderMarker(slides: ClinicalEvent[]) {
        const track = pathologyTrack(slides);
        const { container } = render(
            <svg>{track.renderEvents!(track.items, 10)}</svg>
        );
        return {
            track,
            texts: Array.from(container.querySelectorAll('text')).map(
                t => t.textContent
            ),
            fills: Array.from(
                container.querySelectorAll('circle, ellipse, rect')
            ).map(el => el.getAttribute('fill')),
        };
    }

    it('draws a matched event as its numbered sample marker', () => {
        const { track, texts, fills } = renderMarker([slide({})]);
        expect(texts).toEqual(['2']);
        expect(fills).toEqual(['#ff0000']);
        expect(track.eventColorGetter!(track.items[0])).toBe('#ff0000');
    });

    it("draws a same-sample group as the sample's marker with a count", () => {
        const { texts, fills } = renderMarker([
            slide({}),
            slide({ specimen: 'Part 2' }),
            slide({ matchLevel: 'BLOCK' }),
        ]);
        expect(texts).toEqual(['2', '3']);
        expect(fills).toEqual(['#ff0000']);
    });

    it('lists each sample once in a mixed group', () => {
        const mixed = renderMarker([
            slide({}),
            slide({ specimen: 'Part 2' }),
            slide({ sampleId: 'P-0000081-T01-IM3' }),
        ]);
        // The sample tracks' multi-sample marker writes consecutive
        // numbers as a range.
        expect(mixed.texts).toEqual(['1-2', '3']);

        const withUnmatched = renderMarker([
            slide({}),
            slide({ specimen: 'Part 2' }),
            slide(UNMATCHED),
        ]);
        expect(withUnmatched.texts).toEqual(['2', '3']);
        expect(withUnmatched.fills).not.toContain(UNMATCHED_MARKER_COLOR);
    });

    it('draws unmatched events as grey markers', () => {
        const single = renderMarker([slide(UNMATCHED)]);
        expect(single.texts).toEqual([]);
        expect(single.fills).toEqual([UNMATCHED_MARKER_COLOR]);
        expect(single.track.eventColorGetter!(single.track.items[0])).toBe(
            UNMATCHED_MARKER_COLOR
        );

        const stack = renderMarker([
            slide(UNMATCHED),
            slide({ ...UNMATCHED, specimen: 'Part 2' }),
        ]);
        expect(stack.texts).toEqual(['2']);
        expect(stack.fills).toContain(UNMATCHED_MARKER_COLOR);
        expect(stack.fills).not.toContain('#ff0000');
    });

    it('orders simultaneous events by sample number', () => {
        const track = pathologyTrack([
            slide(UNMATCHED),
            slide({ sampleId: 'P-0000081-T01-IM3' }),
            slide({}),
        ]);
        const sorted = track.sortSimultaneousEvents!(track.items);
        const attr = (e: TimelineEvent, key: string) =>
            e.event.attributes.find(a => a.key === key)!.value;
        expect(
            sorted.map(e => `${attr(e, 'SAMPLE_ID')} ${attr(e, 'MATCH_LEVEL')}`)
        ).toEqual([
            'P-0000081-T01-IM3 PART',
            `${SAMPLE} PART`,
            'Unmatched Unmatched',
        ]);
    });

    it('splits the track into stain rows: H&E, IHC, then the rest', () => {
        const root = pathologyRoot([
            slide({ stain: 'Unknown' }),
            slide({ stain: 'IHC' }),
            slide({ stain: 'Special stain' }),
            slide({}),
        ]);
        expect(root.items).toEqual([]);
        expect(root.tracks!.map(t => t.type)).toEqual([
            'H&E',
            'IHC',
            'Special stain',
            'Unknown',
        ]);
        root.tracks!.forEach(t => {
            expect(t.renderEvents).toBeDefined();
            expect(t.renderTooltip).toBeDefined();
            expect(t.items).toHaveLength(1);
        });
    });

    it('places the track right after sequencing', () => {
        const types = configuredTracks([
            slide({}),
            event('Treatment', 10, { TREATMENT_TYPE: 'Medical Therapy' }),
            event('Status', 5, { STATUS: 'Alive' }),
        ]).map(t => t.type);
        expect(types.indexOf('PATHOLOGY SLIDES')).toBe(
            types.indexOf('SEQUENCING') + 1
        );
    });

    it('renders a readable tooltip with an in-app Open slides link', () => {
        const track = pathologyTrack([slide({})]);
        const location = renderTooltip(track, track.items[0]);

        expect(
            screen.getByText('Pathology slides · H&E · Part-matched')
        ).toBeTruthy();
        expect(screen.getByText(SAMPLE)).toBeTruthy();
        expect(
            screen.getByText('d+920 — 42 d before sequencing (d+962)')
        ).toBeTruthy();
        expect(screen.getByText('Part 1')).toBeTruthy();
        expect(screen.getByText('1 of 1 viewable')).toBeTruthy();
        expect(document.body.textContent).not.toContain('sk_0123456789abcdef');

        // The timeline renders tooltips in a portal; the router context
        // still reaches the link, so it navigates without a page load.
        fireEvent.click(screen.getByRole('link', { name: /Open H&E slides/ }));
        expect(location()?.pathname).toBe('/patient/wsiHESlides');
        expect(location()?.search).toBe(
            LINKOUT.split('/patient/wsiHESlides')[1]
        );
    });

    it('omits Open slides when nothing is viewable', () => {
        const track = pathologyTrack([slide({ viewable: 0 })]);
        renderTooltip(track, track.items[0]);
        expect(screen.getByText('0 of 1 viewable')).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('links only to the Pathology Slides tab', () => {
        const track = pathologyTrack([
            slide({ linkout: 'https://example.org/patient/wsiHESlides?x=1' }),
        ]);
        renderTooltip(track, track.items[0]);
        expect(screen.getByText('1 of 1 viewable')).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('explains slides that are not viewable', () => {
        const track = pathologyTrack([slide({ viewable: 1, total: 3 })]);
        renderTooltip(track, track.items[0]);
        expect(screen.getByText('1 of 3 viewable').getAttribute('title')).toBe(
            '2 slides are not viewable: no scanned image is available.'
        );
    });

    it('describes unmatched slides in the tooltip', () => {
        const track = pathologyTrack([slide(UNMATCHED)]);
        const location = renderTooltip(track, track.items[0]);
        expect(
            screen.getByText('Pathology slides · H&E · Unmatched')
        ).toBeTruthy();
        expect(
            screen.getByText('Unmatched (not linked to a sequenced sample)')
        ).toBeTruthy();
        expect(screen.getByText('d+920')).toBeTruthy();
        fireEvent.click(
            screen.getByRole('link', { name: /Open H&E slides for Unmatched/ })
        );
        const settings = new URLSearchParams(location()?.search).get(
            'pathologySlideSettings'
        );
        expect(JSON.parse(settings!).matchLevel).toBe('Unmatched');
    });
});

describe('hasPathologySlideEvents', () => {
    it('finds PATHOLOGY SLIDES events', () => {
        expect(hasPathologySlideEvents([SEQUENCING])).toBe(false);
        expect(hasPathologySlideEvents([SEQUENCING, slide({})])).toBe(true);
    });
});
