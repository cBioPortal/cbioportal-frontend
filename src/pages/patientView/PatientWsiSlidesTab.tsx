import * as React from 'react';
import {
    clearWsiHashFromCurrentUrl,
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
 * view scopes the rest of the page; the page's sample filter widens it. A slide named by a `#wsi:slide=` hash wins: the link scope and
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

type Props = Omit<
    AppWsiViewerProps,
    keyof WsiSlidesTabScope | 'hostOwnsSampleScope'
> & {
    query: WsiSlidesTabQuery;
};

/**
 * The patient and link params the tab last showed, and whether a
 * `#wsi:slide=` hash was a deep link for them. Only a link the page loads
 * with can be a deep link: the viewer writes the selected slide to the hash
 * itself, so later a hash just names the slide the user was looking at. A
 * remount at the same link (e.g. a tab switch) keeps the deep link (or the
 * scope) it had; once the user picks another sample, even the one the page
 * opened with, the hash is stale and is dropped.
 */
let lastLink:
    | { patientId: string; linkKey: string; deepLink: boolean }
    | undefined;

/** Forgets the last link, as a full page load does. */
export function resetOpeningWsiSlidesLink() {
    lastLink = undefined;
}

/** Pathology Slides tab: the viewer scoped by the patient view URL. */
export default function PatientWsiSlidesTab({ query, ...viewerProps }: Props) {
    const { patientId } = viewerProps;
    const { sampleId, stainFilter, matchLevel, specimenKey } = query;
    const linkKey = JSON.stringify([
        sampleId,
        stainFilter,
        matchLevel,
        specimenKey,
    ]);
    const { deepLink, staleHash } = React.useMemo(() => {
        const hashSlide = !!readWsiHashState()?.slideId;
        const opening = !lastLink || lastLink.patientId !== patientId;
        const sameLink = !opening && lastLink!.linkKey === linkKey;
        const link = {
            deepLink: opening ? hashSlide : sameLink && lastLink!.deepLink,
            staleHash: !opening && !sameLink && hashSlide,
        };
        lastLink = { patientId, linkKey, deepLink: link.deepLink };
        return link;
    }, [patientId, linkKey]);
    const scope = React.useMemo(
        () =>
            wsiSlidesTabScopeFromQuery(
                {
                    sampleId,
                    stainFilter,
                    matchLevel,
                    specimenKey,
                },
                deepLink ? readWsiHashState()?.slideId : undefined
            ),
        [linkKey, deepLink]
    );
    // A stale slide hash would make a reload or a copied link reopen the
    // previous slide instead of this scope.
    React.useEffect(() => {
        if (staleHash) {
            clearWsiHashFromCurrentUrl();
        }
    }, [linkKey, staleHash]);
    // The page's sample filter shows and widens the sample scope, so the
    // slide list neither repeats it as a chip nor widens past it.
    return <AppWsiViewer {...viewerProps} {...scope} hostOwnsSampleScope />;
}
