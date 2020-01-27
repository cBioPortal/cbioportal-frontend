import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import { MakeMobxView } from '../../../shared/components/MobxView';
import ResourceLink from '../../../shared/components/resources/ResourceLink';
import _ from 'lodash';
import { StudyViewPageStore } from '../StudyViewPageStore';
import { ResourceData } from 'cbioportal-ts-api-client';

export interface IResourcesTabProps {
    store: StudyViewPageStore;
    openResource: (resource: ResourceData) => void;
}

export const RESOURCES_TAB_NAME = 'Files and Links';

@observer
export default class ResourcesTab extends React.Component<
    IResourcesTabProps,
    {}
> {
    readonly studyResources = MakeMobxView({
        await: () => [
            this.props.store.studyResourceData,
            this.props.store.studies,
        ],
        render: () => {
            if (this.props.store.studyResourceData.result!.length > 0) {
                return (
                    <div className="resourcesSection">
                        <h4>
                            Study Resources for{' '}
                            {this.props.store.studies.result![0].name}
                        </h4>
                        {_.sortBy(
                            this.props.store.studyResourceData.result!,
                            r => parseFloat(r.resourceDefinition.priority)
                        ).map(d => (
                            <ResourceLink
                                resource={d}
                                isTabOpen={this.props.store.isResourceTabOpen}
                                openResource={this.props.openResource}
                            />
                        ))}
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    render() {
        return (
            <div className="resourcesTab">
                <FeatureTitle
                    title={RESOURCES_TAB_NAME}
                    isLoading={this.studyResources.isPending}
                    className="pull-left"
                />
                <br />
                <br />
                <div>{this.studyResources.component}</div>
            </div>
        );
    }
}
