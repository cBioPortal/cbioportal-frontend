import { action, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';
import { fetchResourceTableData } from 'shared/api/resourceTableClient';
import {
    IResourceTableRow,
    toResourceTableRows,
} from 'shared/lib/ResourceTableUtils';

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
    /** Rows the tabs endpoint reports, used as the page size so one request holds them all. */
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
        this.totalCount = totalCount;
    }

    readonly rows = remoteData<IResourceTableRow[]>({
        invoke: async () => {
            if (
                !this.resourceId ||
                this.studyIds.length === 0 ||
                this.totalCount === 0
            ) {
                return [];
            }
            const result = await fetchResourceTableData({
                studyIds: this.studyIds,
                resourceId: this.resourceId,
                patientIdentifiers: this.patientIdentifiers,
                sampleIdentifiers: this.sampleIdentifiers,
                pageNumber: 0,
                pageSize: this.totalCount,
            });
            return toResourceTableRows(result);
        },
        default: [],
    });
}
