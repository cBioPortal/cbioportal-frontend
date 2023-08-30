import { pluralize } from 'cbioportal-frontend-commons';
import { FilterResetPanel } from 'react-mutation-mapper';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import StudyViewMutationMapperStore from './StudyViewMutationMapperStore';

type StudyViewMutationMapperControlsProps = {
    store: StudyViewPageStore;
    gene: string;
    mutationMapperStore: StudyViewMutationMapperStore;
};

const StudyViewMutationPlotControls = (
    props: StudyViewMutationMapperControlsProps
) => {
    return (
        <div
            style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                border: '1px solid transparent',
                borderRadius: 4,
                padding: '1px 10px !important',
            }}
        >
            <FilterResetPanel
                filterInfo={`Selected ${
                    props.mutationMapperStore.samplesByPosition.length
                } ${pluralize('sample', length)}.`}
                additionalInfo={
                    length > 0
                        ? ' (Shift click to select multiple residues)'
                        : ''
                }
                resetFilters={() =>
                    props.store.updateStudyViewFilter(props.gene)
                }
                buttonText="Apply Filter"
                buttonClass={classNames('btn', 'btn-default', 'btn-xs')}
            />
        </div>
    );
};

export default StudyViewMutationPlotControls;
