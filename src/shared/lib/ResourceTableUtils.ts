import _ from 'lodash';

/**
 * A row as the table renders it. `patientId` and `sampleId` are display labels and fall back to
 * the row's scope ("Study-wide", "Sample-level"), so the stable ids are carried separately for the
 * patient and sample links.
 */
export interface IResourceTableRow {
    key: string;
    studyId: string;
    patientId: string;
    sampleId: string;
    patientStableId?: string;
    sampleStableId?: string;
    resourceType: string;
    resourceScope: string;
    resourceId: string;
    description: string;
    url: string;
    metadata: Record<string, string>;
}

export interface IResourceTableTab {
    id: string;
    label: string;
    totalCount: number;
    patientCount: number;
    sampleCount: number;
}

export function getResourceTableMetadataKeys(rows: IResourceTableRow[]) {
    return _.sortBy(
        _.uniq(
            _.flatMap(rows, row => Object.keys(row.metadata)).filter(
                key => key.length > 0
            )
        ),
        key => key.toLowerCase()
    );
}
