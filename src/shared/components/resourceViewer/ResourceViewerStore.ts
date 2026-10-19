import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';
import { fetchResourceTableData } from 'shared/api/resourceTableClient';
import {
    IResourceTableRow,
    toResourceTableRows,
} from 'shared/lib/ResourceTableUtils';

/**
 * A resource with more items than this is not worth stepping through one at a time; the viewer
 * falls back to the table. Patient-scoped resources are far below it — the largest seen in a
 * public study is a few dozen.
 */
export const MAX_VIEWER_ROWS = 2000;

/**
 * The items one resource viewer can step through.
 *
 * Deliberately separate from `ResourceTableStore`: the viewer's list must not move when the user
 * pages, sorts, searches or filters the table, or "3 of 57" turns into "3 of 4" mid-session. The
 * request therefore sends no sort, search or filters, and the backend's own ordering
 * (patient, sample, internal id) decides the sequence.
 */
export class ResourceViewerStore {
    constructor() {
        makeObservable(this);
    }

    @observable.ref private studyIds: string[] = [];
    @observable.ref private patientIdentifiers: PatientIdentifier[] = [];
    @observable.ref private sampleIdentifiers: SampleIdentifier[] = [];
    @observable private resourceId: string | undefined;
    /** Read every resource of the cohort rather than one. */
    @observable private allResources = false;
    /** Total rows the tabs endpoint reports, so the cap can be applied before fetching. */
    @observable private totalCount = 0;

    @action setContext(
        studyIds: string[],
        patientIdentifiers: PatientIdentifier[],
        sampleIdentifiers: SampleIdentifier[]
    ) {
        this.studyIds = studyIds;
        this.patientIdentifiers = patientIdentifiers;
        this.sampleIdentifiers = sampleIdentifiers;
    }

    @action setResource(resourceId: string | undefined, totalCount: number) {
        this.resourceId = resourceId;
        this.allResources = false;
        this.totalCount = totalCount;
    }

    /** Every resource of the cohort in one list, for a viewer that crosses resources. */
    @action setAllResources(totalCount: number) {
        this.resourceId = undefined;
        this.allResources = true;
        this.totalCount = totalCount;
    }

    @computed get exceedsViewerLimit(): boolean {
        return this.totalCount > MAX_VIEWER_ROWS;
    }

    readonly rows = remoteData<IResourceTableRow[]>({
        invoke: async () => {
            if (
                (!this.resourceId && !this.allResources) ||
                this.studyIds.length === 0 ||
                this.totalCount === 0 ||
                this.exceedsViewerLimit
            ) {
                return [];
            }
            const result = await fetchResourceTableData({
                studyIds: this.studyIds,
                resourceId: this.resourceId,
                patientIdentifiers: this.patientIdentifiers,
                sampleIdentifiers: this.sampleIdentifiers,
                pageNumber: 0,
                pageSize: Math.min(this.totalCount, MAX_VIEWER_ROWS),
            });
            return toResourceTableRows(result);
        },
        default: [],
    });

    /** Position of a row in the viewer's list, or -1. Rows are identified by `key`. */
    indexOfRow(key: string | undefined): number {
        if (!key) {
            return -1;
        }
        return (this.rows.result || []).findIndex(row => row.key === key);
    }
}
