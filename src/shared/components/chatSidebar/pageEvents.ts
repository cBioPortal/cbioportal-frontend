// Pushes page changes to the chat iframe as they happen — its only source of
// what the user is looking at. Every change is sent; which ones matter is the
// iframe's call.

import { comparer, IReactionDisposer, reaction } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import {
    getCurrentContextHref,
    getCurrentPageDetails,
    isCurrentPageDetailsPending,
    PageDetails,
} from './pageDetails';

type SnapshotDetails = PageDetails | { available: false; error: string };

interface Snapshot {
    // True while the page is mid-load, so the details may describe a page the
    // user never saw (e.g. Study View's 0 samples, 0 charts).
    pending: boolean;
    href: string;
    details: SnapshotDetails;
}

export type PageEvent = { kind: 'snapshot'; at: string } & Snapshot;

// A store mid-load can throw from a getter; that must not kill the reaction.
function readSnapshot(): Snapshot {
    const href = getCurrentContextHref();
    try {
        return {
            pending: isCurrentPageDetailsPending(),
            href,
            details: getCurrentPageDetails(),
        };
    } catch (e) {
        return {
            pending: false,
            href,
            details: {
                available: false,
                error: e instanceof Error ? e.message : String(e),
            },
        };
    }
}

export class PageEventPublisher {
    private dispose?: IReactionDisposer;

    /**
     * Starts over on every call, re-sending the current state first — which
     * is what a freshly (re)loaded iframe needs.
     */
    start(send: (event: PageEvent) => void) {
        this.stop();
        const routingStore = getBrowserWindow().routingStore;
        this.dispose = reaction(
            () => {
                // Read only to track it: the href comes from window.location,
                // which isn't observable.
                void routingStore.location;
                return readSnapshot();
            },
            snapshot =>
                send({
                    kind: 'snapshot',
                    at: new Date().toISOString(),
                    ...snapshot,
                }),
            // Structural equality only stops a re-run that changed nothing
            // from sending a duplicate — each read builds a fresh object.
            { equals: comparer.structural, fireImmediately: true }
        );
    }

    stop() {
        this.dispose?.();
        this.dispose = undefined;
    }
}
