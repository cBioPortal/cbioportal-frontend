import * as React from 'react';
import { observer } from 'mobx-react';
import { autorun, IReactionDisposer } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { ResourceTableStore } from 'shared/components/resourceTable/ResourceTableStore';
import ResourceDataTable from 'shared/components/resourceTable/ResourceDataTable';
import {
    getStudyViewResourceCohort,
    syncStudyViewResourceCohort,
} from './studyViewResourceCohort';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface IFilesLinksTable {
    store: StudyViewPageStore;
}

@observer
export class FilesAndLinks extends React.Component<IFilesLinksTable, {}> {
    private readonly resourceTableStore = new ResourceTableStore();
    private storeReactionDisposer: IReactionDisposer | null = null;

    constructor(props: IFilesLinksTable) {
        super(props);
    }

    componentDidMount() {
        // Keep ResourceTableStore in sync with Study View's selection
        this.storeReactionDisposer = autorun(() => {
            const cohort = getStudyViewResourceCohort(this.props.store);
            if (cohort) {
                syncStudyViewResourceCohort(this.resourceTableStore, cohort);
            }
        });
    }

    componentWillUnmount() {
        if (this.storeReactionDisposer) {
            this.storeReactionDisposer();
        }
    }

    render() {
        const samplesLoading = this.props.store.selectedSamples.isPending;

        if (samplesLoading) {
            return <LoadingIndicator isLoading center size="big" />;
        }

        return (
            <span data-test="files-links-data-content">
                <ResourceDataTable store={this.resourceTableStore} />
            </span>
        );
    }
}
