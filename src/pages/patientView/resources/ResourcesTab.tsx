import * as React from 'react';
import { observer } from 'mobx-react';
import { autorun, IReactionDisposer } from 'mobx';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import SampleManager from '../SampleManager';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { ResourceData } from 'cbioportal-ts-api-client';
import { ResourceTableStore } from 'shared/components/resourceTable/ResourceTableStore';
import ResourceDataTable from 'shared/components/resourceTable/ResourceDataTable';

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
    private readonly resourceTableStore = new ResourceTableStore();
    private storeReactionDisposer: IReactionDisposer | null = null;

    componentDidMount() {
        // Keep ResourceTableStore in sync with the patient's context
        this.storeReactionDisposer = autorun(() => {
            const { store } = this.props;
            if (!store.samples.result) return;
            const studyIds = [store.studyId];
            const patientIds = [store.patientId];
            const sampleIds = store.samples.result.map(s => s.sampleId);
            this.resourceTableStore.setContext(studyIds, patientIds, sampleIds);
        });
    }

    componentWillUnmount() {
        if (this.storeReactionDisposer) {
            this.storeReactionDisposer();
        }
    }

    render() {
        return (
            <div className="resourcesTab">
                <FeatureTitle
                    title={RESOURCES_TAB_NAME}
                    isLoading={
                        this.props.store.samples.isPending ||
                        this.resourceTableStore.tabs.isPending ||
                        this.resourceTableStore.tableData.isPending
                    }
                    className={'pull-left'}
                />
                <br />
                <br />
                <ResourceDataTable store={this.resourceTableStore} />
            </div>
        );
    }
}
