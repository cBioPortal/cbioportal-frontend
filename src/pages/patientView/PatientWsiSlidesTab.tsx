import * as React from 'react';
import {
    PathologySlideFilter,
    readWsiHashState,
    WsiStainFilter,
} from 'cbioportal-wsi-viewer';
import {
    AppWsiViewer,
    AppWsiViewerProps,
} from 'shared/components/wsiViewer/wsiAppConfig';
import { PathologySlideSettings } from './PatientViewUrlWrapper';

/** Patient view query params that scope the Pathology Slides tab. */
export type WsiSlidesTabQuery = PathologySlideSettings & { sampleId?: string };

export type WsiSlidesTabScope = Pick<
    AppWsiViewerProps,
    'preferredSampleId' | 'pathologyFilter' | 'initialStainFilter'
>;

/** Stain filters a link can set; "all" is the viewer default. */
const STAIN_FILTERS: WsiStainFilter[] = ['hne', 'ihc', 'other', 'unknown'];

function queryValue(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined;
}

/**
 * Maps pathology slide link params (`sampleId`, plus `matchLevel`,
 * `specimenKey` and `stainFilter` from the `pathologySlideSettings` URL node)
 * to viewer props. A sample scopes the slide list to that sample, as sample
 * view scopes the rest of the page; the viewer offers "Show all slides" to
 * widen it. A slide named by a `#wsi:slide=` hash wins: the link scope and
 * the stain filter are dropped so they cannot exclude or hide that slide.
 */
export function wsiSlidesTabScopeFromQuery(
    query: WsiSlidesTabQuery,
    hashSlideKey?: string
): WsiSlidesTabScope {
    const sampleId = queryValue(query.sampleId);
    if (hashSlideKey) {
        return { preferredSampleId: sampleId };
    }
    const matchLevel = queryValue(query.matchLevel);
    const specimenKey = queryValue(query.specimenKey);
    const stain = queryValue(query.stainFilter)?.toLowerCase();
    const pathologyFilter: PathologySlideFilter | undefined =
        sampleId || matchLevel || specimenKey
            ? { sampleId, matchLevel, specimenKey }
            : undefined;
    const initialStainFilter = STAIN_FILTERS.find(filter => filter === stain);
    return {
        preferredSampleId: sampleId,
        pathologyFilter,
        initialStainFilter,
    };
}

type Props = Omit<AppWsiViewerProps, keyof WsiSlidesTabScope> & {
    query: WsiSlidesTabQuery;
};

/** Pathology Slides tab: the viewer scoped by the patient view URL. */
export default function PatientWsiSlidesTab({ query, ...viewerProps }: Props) {
    const { sampleId, stainFilter, matchLevel, specimenKey } = query;
    const linkKey = JSON.stringify([
        sampleId,
        stainFilter,
        matchLevel,
        specimenKey,
    ]);
    // A `#wsi:slide=` hash is a deep link only for the link the page opened
    // with. Once the user picks another sample, the hash still names the slide
    // they were looking at, which must not override the new sample's scope.
    const openedWith = React.useRef({
        linkKey,
        hashSlideKey: readWsiHashState()?.slideId,
    });
    const scope = React.useMemo(
        () =>
            wsiSlidesTabScopeFromQuery(
                {
                    sampleId,
                    stainFilter,
                    matchLevel,
                    specimenKey,
                },
                linkKey === openedWith.current.linkKey
                    ? openedWith.current.hashSlideKey
                    : undefined
            ),
        [linkKey]
    );
    return <AppWsiViewer {...viewerProps} {...scope} />;
}
