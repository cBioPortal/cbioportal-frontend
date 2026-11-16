import * as React from 'react';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from '../StudyViewPageStore';
import { ResourceData } from 'cbioportal-ts-api-client';

import { FilesAndLinks } from './FilesAndLinks';

export interface IResourcesTabProps {
    store: StudyViewPageStore;
    openResource: (resource: ResourceData) => void;
}

export const RESOURCES_TAB_NAME = 'Files & Links';

@observer
export default class ResourcesTab extends React.Component<
    IResourcesTabProps,
    {}
> {
    render() {
        return (
            <div className="resourcesTab">
                <div className="resourcesSection">
                    <FilesAndLinks store={this.props.store}></FilesAndLinks>
                </div>
            </div>
        );
    }
}
