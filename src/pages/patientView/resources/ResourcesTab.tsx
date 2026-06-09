import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import SampleManager from '../SampleManager';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { MakeMobxView } from '../../../shared/components/MobxView';
import _ from 'lodash';
import { ResourceData } from 'cbioportal-ts-api-client';
import ResourceDataTable from 'shared/components/resources/ResourceDataTable';

export interface IResourcesTabProps {
    sampleManager: SampleManager | null;
    store: PatientViewPageStore;
    openResource: (resource: ResourceData) => void;
}

export const RESOURCES_TAB_NAME = 'Files & Links';

@observer
export default class ResourcesTab extends React.Component<
    IResourcesTabProps,
    {}
> {
    readonly allResources = remoteData<ResourceData[]>({
        await: () => [
            this.props.store.patientResourceData,
            this.props.store.sampleResourceData,
            this.props.store.studyResourceData,
        ],
        invoke: () => {
            return Promise.resolve(
                _.flatMap(
                    this.props.store.sampleResourceData.result!,
                    data => data
                )
                    .concat(this.props.store.patientResourceData.result!)
                    .concat(this.props.store.studyResourceData.result!)
            );
        },
    });

    readonly resourcesTable = MakeMobxView({
        await: () => [this.allResources],
        render: () => {
            return (
                <div className="resourcesSection">
                    <h4 className="blackHeader">
                        Resources for {this.props.store.patientId}
                    </h4>
                    <ResourceDataTable
                        patientIdFallback={this.props.store.patientId}
                        resources={this.allResources.result!}
                        getResourceAction={row => ({
                            label: row.resourceType,
                            onClick: () => this.props.openResource(row.resource),
                        })}
                        getPrimaryAction={row => ({
                            label: 'Open in portal',
                            onClick: () => this.props.openResource(row.resource),
                        })}
                    />
                </div>
            );
        },
    });

    render() {
        return (
            <div className="resourcesTab">
                <FeatureTitle
                    title={RESOURCES_TAB_NAME}
                    isLoading={
                        this.allResources.isPending ||
                        this.resourcesTable.isPending
                    }
                    className={'pull-left'}
                />
                <br />
                <br />
                <div>{this.resourcesTable.component}</div>
            </div>
        );
    }
}
