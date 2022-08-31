import * as React from 'react';
import { observer } from 'mobx-react';
import { ResourceData } from 'cbioportal-ts-api-client';
import SampleManager from '../../../pages/patientView/SampleManager';
import { computed, makeObservable } from 'mobx';
import _ from 'lodash';
import { ResourcesTableRowData } from './ResourcesTableUtils';
import { stringListToIndexSet } from 'cbioportal-frontend-commons';
import ResourceTable from './ResourceTable';

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

    render() {
        return (
            <>
                {this.data.map((datum, index) => {
                    return (
                        <>
                            <h5 className="blackHeader">
                                Sample {datum.sample.sampleId}{' '}
                                {this.props.sampleManager.getComponentForSample(
                                    datum.sample.sampleId
                                )}
                            </h5>
                            <ResourceTable
                                resources={datum.resources}
                                isTabOpen={this.props.isTabOpen}
                                openResource={this.props.openResource}
                            />
                            {index < this.data.length - 1 && (
                                <hr style={{ marginTop: 20 }}></hr>
                            )}
                        </>
                    );
                })}
            </>
        );
    }
}
