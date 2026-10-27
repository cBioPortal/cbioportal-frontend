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

type Props = Omit<
    AppWsiViewerProps,
    keyof WsiSlidesTabScope | 'hostOwnsSampleScope'
> & {
    query: WsiSlidesTabQuery;
};

/**
 * The patient and link params the tab last showed. The viewer writes the
 * selected slide to a `#wsi:slide=` hash, so the hash belongs to that link: it
 * is a deep link for the link that opened the page, and after a remount at
 * the same link (e.g. a tab switch) it keeps the user's slide. Once the user
 * picks another sample, even the one the page opened with, the hash names the
 * slide they were looking at and must not override the new sample's scope.
 */
let lastLink: { patientId: string; linkKey: string } | undefined;

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
    const hashBelongsToLink = React.useMemo(() => {
        const same =
            !lastLink ||
            lastLink.patientId !== patientId ||
            lastLink.linkKey === linkKey;
        lastLink = { patientId, linkKey };
        return same;
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
                hashBelongsToLink ? readWsiHashState()?.slideId : undefined
            ),
        [linkKey, hashBelongsToLink]
    );
    // A stale slide hash would make a reload or a copied link reopen the
    // previous slide instead of this scope.
    React.useEffect(() => {
        if (!hashBelongsToLink && readWsiHashState()?.slideId) {
            clearWsiHashFromCurrentUrl();
        }
    }, [linkKey, hashBelongsToLink]);
    // The page's sample filter shows and widens the sample scope, so the
    // slide list neither repeats it as a chip nor widens past it.
    return <AppWsiViewer {...viewerProps} {...scope} hostOwnsSampleScope />;
}
