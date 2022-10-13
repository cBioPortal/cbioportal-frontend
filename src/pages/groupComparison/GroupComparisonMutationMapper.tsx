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
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
}

@observer
class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);
    }

    protected get mutationTableComponent() {
        return null;
    }
}

export default GroupComparisonMutationMapper;
