import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Else, If, Then } from 'react-if';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    getPatientViewUrlWithPathname,
    getResourceViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { computed, makeObservable } from 'mobx';
import ResourceDataTable from 'shared/components/resources/ResourceDataTable';
import {
    getResourceConfig,
    ResourceCustomConfig,
} from 'shared/lib/ResourceConfig';

export interface IFilesLinksTable {
    store: StudyViewPageStore;
    selectedResourceId?: string;
}

@observer
export class FilesAndLinks extends React.Component<IFilesLinksTable, {}> {
    constructor(props: IFilesLinksTable) {
        super(props);
        makeObservable(this);
    }

    @computed get activeResources() {
        const resources = this.props.store.resourceTableData.result || [];
        if (!this.props.selectedResourceId) {
            return resources;
        }
        return resources.filter(
            resource => resource.resourceId === this.props.selectedResourceId
        );
    }

    @computed get uniqueResourceTypes(): string[] {
        if (!this.activeResources.length) {
            return [];
        }
        return _.uniq(
            this.activeResources.map(
                resource => resource.resourceDefinition.displayName
            )
        );
    }

    @computed get activeResourceDefinition() {
        if (this.props.selectedResourceId) {
            return (
                this.props.store.resourceDefinitions.result?.find(
                    definition =>
                        definition.resourceId === this.props.selectedResourceId
                ) || this.activeResources[0]?.resourceDefinition
            );
        }

        if (
            this.uniqueResourceTypes.length !== 1 ||
            !this.uniqueResourceTypes[0]
        ) {
            return undefined;
        }

        const typeName = this.uniqueResourceTypes[0];
        return (
            this.props.store.resourceDefinitions.result?.find(
                definition => definition.displayName === typeName
            ) ||
            this.activeResources.find(
                resource => resource.resourceDefinition.displayName === typeName
            )?.resourceDefinition
        );
    }

    @computed get singleTypeConfig(): {
        config: ResourceCustomConfig;
        typeName: string;
    } | null {
        const definition = this.activeResourceDefinition;
        if (!definition) {
            return null;
        }
        const config = getResourceConfig(definition);
        const typeName = definition.displayName;
        return { config, typeName };
    }

    public render() {
        const config = this.singleTypeConfig?.config ?? {};
        const typeName =
            this.singleTypeConfig?.typeName ||
            this.activeResources[0]?.resourceDefinition.displayName;
        const resourceLabel = typeName || 'resources';

        return (
            <span data-test="files-links-data-content">
                <If condition={this.props.store.resourceTableData.isPending}>
                    <Then>
                        <LoadingIndicator
                            isLoading={true}
                            size={'big'}
                            center={true}
                        />
                    </Then>
                    <Else>
                        <ResourceDataTable
                            resources={this.props.store.resourceTableData.result || []}
                            selectedResourceId={this.props.selectedResourceId}
                            showResourceTabs={false}
                            resourceLabel={resourceLabel}
                            hideUrlColumn={!!config.hideUrlColumn}
                            columnLabels={{
                                resourceType:
                                    config.columnNameMapping?.[
                                        'Type Of Resource'
                                    ] || 'Resource Type',
                            }}
                            getPatientHref={row =>
                                row.resource.patientId
                                    ? getPatientViewUrlWithPathname(
                                          row.resource.studyId,
                                          row.resource.patientId,
                                          'patient/filesAndLinks'
                                      )
                                    : undefined
                            }
                            getSampleHref={row =>
                                row.resource.sampleId
                                    ? getSampleViewUrlWithPathname(
                                          row.resource.studyId,
                                          row.resource.sampleId,
                                          'patient/filesAndLinks'
                                      )
                                    : undefined
                            }
                            getResourceAction={row => {
                                if (!row.resource.patientId) {
                                    return undefined;
                                }
                                return {
                                    label: row.resourceType,
                                    href: getResourceViewUrlWithPathname(
                                        row.resource.studyId,
                                        `patient/openResource_${row.resource.resourceId}`,
                                        row.resource.patientId
                                    ),
                                    target: config.openInNewTab
                                        ? '_blank'
                                        : undefined,
                                    rel: 'noopener noreferrer',
                                };
                            }}
                        />
                    </Else>
                </If>
            </span>
        );
    }
}
