import _ from 'lodash';
import { ResourceData } from 'cbioportal-ts-api-client';
import { getFileExtension } from 'shared/components/resources/ResourcesTableUtils';

export interface IResourceTableRow {
    key: string;
    patientId: string;
    sampleId: string;
    resourceType: string;
    resourceScope: string;
    resourceId: string;
    description: string;
    url: string;
    metadata: Record<string, string>;
    resource: ResourceData;
}

export interface IResourceTableTab {
    id: string;
    label: string;
    totalCount: number;
    patientCount: number;
    sampleCount: number;
}

function normalizeMetadataValue(value: unknown) {
    if (_.isNil(value)) {
        return undefined;
    }
    if (_.isArray(value)) {
        return value.map(item => String(item)).join(', ');
    }
    if (_.isPlainObject(value)) {
        return JSON.stringify(value);
    }
    return String(value);
}

export function parseResourceDefinitionMetadata(customMetaData: string) {
    if (!customMetaData) {
        return {};
    }

    try {
        const parsed = JSON.parse(customMetaData);
        if (!_.isPlainObject(parsed)) {
            return {};
        }

        return _.reduce(
            parsed,
            (acc, value, key) => {
                const normalizedValue = normalizeMetadataValue(value);
                if (normalizedValue) {
                    acc[key] = normalizedValue;
                }
                return acc;
            },
            {} as Record<string, string>
        );
    } catch (error) {
        return {};
    }
}

function getUrlHost(url: string) {
    try {
        return new URL(url, 'https://www.cbioportal.org').hostname;
    } catch (error) {
        return undefined;
    }
}

function getResourceFileType(url: string) {
    try {
        const extension = getFileExtension(url);
        return extension ? extension.toLowerCase() : 'link';
    } catch (error) {
        return 'link';
    }
}

function getSampleLabel(resource: ResourceData) {
    if (resource.sampleId) {
        return resource.sampleId;
    }

    switch (resource.resourceDefinition.resourceType) {
        case 'SAMPLE':
            return 'Sample-level';
        case 'PATIENT':
            return 'Patient-level';
        case 'STUDY':
            return 'Study-level';
        default:
            return 'Not available';
    }
}

function getPatientLabel(resource: ResourceData, patientIdFallback?: string) {
    return resource.patientId || patientIdFallback || 'Study-wide';
}

export function buildResourceTableRows(
    resources: ResourceData[],
    patientIdFallback?: string
) {
    return resources.map((resource, index) => {
        const definitionMetadata = parseResourceDefinitionMetadata(
            resource.resourceDefinition.customMetaData
        );
        const derivedMetadata: Record<string, string> = {
            file_type: getResourceFileType(resource.url),
            resource_scope: resource.resourceDefinition.resourceType,
        };

        const urlHost = getUrlHost(resource.url);
        if (urlHost) {
            derivedMetadata.host = urlHost;
        }

        return {
            key: [
                resource.resourceId,
                resource.patientId || patientIdFallback || 'study',
                resource.sampleId || resource.resourceDefinition.resourceType,
                index,
            ].join('::'),
            patientId: getPatientLabel(resource, patientIdFallback),
            sampleId: getSampleLabel(resource),
            resourceType:
                resource.resourceDefinition.displayName || resource.resourceId,
            resourceScope: resource.resourceDefinition.resourceType,
            resourceId: resource.resourceId,
            description: resource.resourceDefinition.description || '',
            url: resource.url,
            metadata: {
                ...definitionMetadata,
                ...derivedMetadata,
            },
            resource,
        } as IResourceTableRow;
    });
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

export function getResourceTableResourceTypes(rows: IResourceTableRow[]) {
    return _.sortBy(
        _.uniq(rows.map(row => row.resourceType).filter(Boolean)),
        resourceType => resourceType.toLowerCase()
    );
}

function getMostCommonResourceLabel(rows: IResourceTableRow[]) {
    const labels = rows.map(row => row.resourceType).filter(Boolean);
    if (labels.length === 0) {
        return rows[0]?.resourceId || 'Resource';
    }

    const labelCounts = _.countBy(labels);
    return _.orderBy(
        _.uniq(labels),
        [label => labelCounts[label], label => label.toLowerCase()],
        ['desc', 'asc']
    )[0];
}

export function buildResourceTableTabs(rows: IResourceTableRow[]) {
    const rowsByResourceId = _.groupBy(rows, row => row.resourceId);

    return _.sortBy(
        Object.entries(rowsByResourceId).map(([resourceId, groupedRows]) => ({
            id: resourceId,
            label: getMostCommonResourceLabel(groupedRows),
            totalCount: groupedRows.length,
            patientCount: _.uniq(
                groupedRows.map(row => row.patientId).filter(Boolean)
            ).length,
            sampleCount: _.uniq(
                groupedRows
                    .map(row => row.resource.sampleId)
                    .filter((sampleId): sampleId is string => !!sampleId)
            ).length,
        })),
        tab => tab.label.toLowerCase()
    );
}
