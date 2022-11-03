import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import GroupComparisonStore from './GroupComparisonStore';
import _ from 'lodash';
import {
    MUTATIONS_NOT_ENOUGH_GROUPS_MSG,
    MUTATIONS_TOO_MANY_GROUPS_MSG,
} from './GroupComparisonUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import { LollipopGeneSelector } from './LollipopGeneSelector';
import GroupComparisonMutationsTabPlot from './GroupComparisonMutationsTabPlot';

interface IGroupComparisonMutationsTabProps {
    store: GroupComparisonStore;
}

@observer
export default class GroupComparisonMutationsTab extends React.Component<
    IGroupComparisonMutationsTabProps,
    {}
> {
    constructor(props: IGroupComparisonMutationsTabProps) {
        super(props);
    }

    readonly tabUI = MakeMobxView({
        await: () => [this.props.store.availableGenes],
        render: () => {
            // We only want 2 groups for our mirrored lollipop plot. Display message if not 2 groups
            if (this.props.store.activeGroups.result!.length < 2) {
                return (
                    <div className="alert alert-info">
                        {MUTATIONS_NOT_ENOUGH_GROUPS_MSG}
                    </div>
                );
            } else if (this.props.store.activeGroups.result!.length > 2) {
                return (
                    <div className="alert alert-info">
                        {MUTATIONS_TOO_MANY_GROUPS_MSG}
                    </div>
                );
            }
            return (
                <>
                    {!this.props.store.userSelectedMutationMapperGene && (
                        <div className="alert alert-info">
                            Gene with highest frequency is displayed by default.
                            Gene can be changed in the dropdown below.
                        </div>
                    )}
                    <LollipopGeneSelector
                        store={this.props.store}
                        genes={this.props.store.availableGenes.result!}
                    />
                    <GroupComparisonMutationsTabPlot
                        store={this.props.store}
                        mutations={_(this.props.store.mutationsByGroup.result!)
                            .values()
                            .flatten()
                            .value()}
                        filters={{
                            groupFilters: _.keys(
                                this.props.store.mutationsByGroup.result!
                            ).map(group => ({
                                group: group,
                                filter: {
                                    type: 'GroupComparisonFilter',
                                    values: [group],
                                },
                            })),
                            filterAppliersOverride: {
                                GroupComparisonFilter: this.props.store
                                    .shouldApplySampleIdFilter,
                            },
                        }}
                    />
                </>
            );
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tabUI.component;
    }
}
