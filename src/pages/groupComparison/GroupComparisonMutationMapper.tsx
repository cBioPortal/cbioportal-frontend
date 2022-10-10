import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
} from 'react-mutation-mapper';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    mutationData?: Mutation[] | undefined;
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
}

@observer
class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);

        // makeObservable<GroupComparisonMutationMapper, 'geneWidth'>(this);
        // makeObservable(this)
    }

    protected get mutationTableComponent() {
        return null;
    }

    // protected get mutationPlot() {

    // }
}

export default GroupComparisonMutationMapper;
