import * as React from 'react';
import { observer } from 'mobx-react';
import { ResourceData, Sample } from 'cbioportal-ts-api-client';
import LazyMobXTable, { Column } from '../lazyMobXTable/LazyMobXTable';
import SampleManager from '../../../pages/patientView/SampleManager';
import { computed, makeObservable } from 'mobx';
import ResourceLink from './ResourceLink';
import _ from 'lodash';
import { ResourcesTableRowData } from './ResourcesTableUtils';
import { stringListToIndexSet } from 'cbioportal-frontend-commons';

export interface ISampleResourcesTableProps {
    data: ResourcesTableRowData[];
    sampleManager: SampleManager;
    isTabOpen: (resourceId: string) => boolean;
    openResource: (resource: ResourceData) => void;
}

@observer
export default class SampleResourcesTable extends React.Component<
    ISampleResourcesTableProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed get data() {
        const sampleIndex = stringListToIndexSet(
            this.props.sampleManager.getSampleIdsInOrder()
        );
        return _.sortBy(
            this.props.data,
            rowData => sampleIndex[rowData.sample.sampleId]
        );
    }

    @computed get columns(): Column<ResourcesTableRowData>[] {
        return [
            {
                name: 'Sample',
                sortBy: datum => datum.sample.sampleId,
                render: datum =>
                    this.props.sampleManager.getComponentForSample(
                        datum.sample.sampleId
                    ) || <span>{datum.sample.sampleId}</span>,
            },
            {
                name: 'Resources',
                render: datum => (
                    <>
                        {_.sortBy(
                            datum.resources,
                            r => r.resourceDefinition.priority
                        ).map(resource => (
                            <ResourceLink
                                resource={resource}
                                isTabOpen={this.props.isTabOpen}
                                openResource={this.props.openResource}
                            />
                        ))}
                    </>
                ),
            },
        ];
    }

    render() {
        return (
            <LazyMobXTable
                columns={this.columns}
                data={this.data}
                showPagination={false}
            />
        );
    }
}
