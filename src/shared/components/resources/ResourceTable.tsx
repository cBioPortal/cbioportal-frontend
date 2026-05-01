import * as React from 'react';
import { observer } from 'mobx-react';
import { ResourceData } from 'cbioportal-ts-api-client';
import { useLocalObservable } from 'mobx-react-lite';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { hasNonEmptyDescriptionInResources } from 'shared/lib/ResourceUtils';

export interface IResourceTableProps {
    resources: ResourceData[];
    openResource: (resource: ResourceData) => void;
    sampleId?: React.ReactNode;
}

class ResourceMobXTable extends LazyMobXTable<{
    resource: ResourceData;
    resourceName: string;
    url: string;
    description?: string;
    priority: string;
    sampleId?: React.ReactNode;
}> {}

const ResourceTable = observer(
    ({ resources, openResource, sampleId }: IResourceTableProps) => {
        const state = useLocalObservable(() => ({
            get data() {
                // Map incoming resources into row data for the MobX table
                return resources.map((r) => ({
                    resource: r,
                    resourceName: r.resourceDefinition?.displayName ?? r.url,
                    url: r.url,
                    description: r.resourceDefinition?.description,
                    priority: r.resourceDefinition?.priority ?? '',
                    sampleId,
                }));
            },
        }));

        if (state.data.length === 0) {
            return <p>There are no resources for this sample.</p>;
        }

        const columns: Column<{
            resource: ResourceData;
            resourceName: string;
            url: string;
            description?: string;
            priority: string;
            sampleId?: React.ReactNode;
        }>[] = [];

        if (sampleId) {
            columns.push({
                name: 'Sample ID',
                headerRender: () => (
                    <span data-test={'Sample ID'}>{'Sample ID'}</span>
                ),
                render: (row) => <span>{row.sampleId}</span>,
                download: (row) => `${row.resource.sampleId ?? ''}`,
                sortBy: (row) => `${row.resource.sampleId ?? ''}`,
                filter: (row, _filterString, filterStringUpper) => {
                    const value = `${
                        row.resource.sampleId ?? ''
                    }`.toUpperCase();
                    return value.includes(filterStringUpper ?? '');
                },
            });
        }

        // Determine if there's only one unique resource type
        const uniqueResourceNames = _.uniq(
            state.data.map((d) => d.resourceName)
        );
        const resourceColumnHeader =
            uniqueResourceNames.length === 1 && uniqueResourceNames[0]
                ? uniqueResourceNames[0]
                : 'Resource';

        columns.push(
            {
                name: 'Resource',
                headerRender: () => (
                    <span data-test={'Resource'}>{resourceColumnHeader}</span>
                ),
                render: (row) => (
                    <a
                        onClick={() => openResource(row.resource)}
                        style={{ fontSize: 10 }}
                    >
                        <i
                            className={`fa fa-user fa-sm`}
                            style={{
                                marginRight: 5,
                                color: 'black',
                            }}
                            title="Open in Patient View"
                        />
                        {row.resourceName}
                    </a>
                ),
                download: (row) => row.resourceName,
                // Sort by priority so the initial ordering reflects resource priority
                sortBy: (row) => row.priority,
                filter: (row, _filterString, filterStringUpper) =>
                    row.resourceName
                        .toUpperCase()
                        .includes(filterStringUpper ?? ''),
            },
            {
                name: 'Resource URL',
                headerRender: () => (
                    <span data-test={'Resource URL'}>{'Resource URL'}</span>
                ),
                render: (row) => (
                    <a
                        href={row.url}
                        style={{ fontSize: 10 }}
                        target={'_blank'}
                        rel="noopener noreferrer"
                    >
                        <i
                            className={`fa fa-external-link fa-sm`}
                            style={{ marginRight: 5, color: 'black' }}
                        />
                        Open in new window
                    </a>
                ),
                download: (row) => row.url,
                sortBy: (row) => row.url,
                filter: (row, _filterString, filterStringUpper) =>
                    row.url.toUpperCase().includes(filterStringUpper ?? ''),
            }
        );

        // Only show Description column if at least one resource has a non-empty description
        if (hasNonEmptyDescriptionInResources(resources)) {
            columns.push({
                name: 'Description',
                headerRender: () => (
                    <span data-test={'Description'}>{'Description'}</span>
                ),
                render: (row) => <span>{row.description ?? ''}</span>,
                download: (row) => row.description ?? '',
                sortBy: (row) => row.description ?? '',
                filter: (row, _filterString, filterStringUpper) =>
                    (row.description ?? '')
                        .toUpperCase()
                        .includes(filterStringUpper ?? ''),
            });
        }

        return (
            <ResourceMobXTable
                initialItemsPerPage={20}
                data={state.data}
                columns={columns}
                showColumnVisibility={false}
                showCountHeader={false}
                showFilterClearButton={false}
                showCopyDownload={true}
                copyDownloadProps={{ showCopy: false }}
                initialSortColumn={'Resource'}
                initialSortDirection={'asc'}
            />
        );
    }
);

export default ResourceTable;
