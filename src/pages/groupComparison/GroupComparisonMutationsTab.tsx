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
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';

interface IGroupComparisonMutationsTabProps {
    store: GroupComparisonStore;
}

@observer
export default class GroupComparisonMutationsTab extends React.Component<
    IGroupComparisonMutationsTabProps,
    {}
> {
    @observable public geneTab: string | undefined;
    constructor(props: IGroupComparisonMutationsTabProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    protected handleGeneChange(id: string | undefined) {
        this.geneTab = id;
        this.props.store.setSelectedMutationMapperGene(id);
    }

    @computed get tabs() {
        return this.props.store.genesWithMaxFrequency.map(g => (
            <MSKTab
                key={g.hugoGeneSymbol}
                id={g.hugoGeneSymbol}
                linkText={g.hugoGeneSymbol}
            />
        ));
    }

    @computed get activeTabId(): string | undefined {
        let activeTabId;
        if (this.geneTab) {
            activeTabId = this.geneTab;
        } else if (this.props.store.userSelectedMutationMapperGene) {
            activeTabId = this.props.store.userSelectedMutationMapperGene;
        } else {
            activeTabId = this.props.store.activeMutationMapperGene!
                .hugoGeneSymbol;
        }
        return activeTabId;
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
                    {/* {!this.props.store.userSelectedMutationMapperGene ? (
                        <div className="alert alert-info">
                            <div>
                                Gene with highest frequency is displayed by
                                default. Gene can be changed in the dropdown
                                below.
                            </div>
                            <div>
                                The top 10 genes with highest frequency are
                                shown below the dropdown and can be selected by
                                clicking on their respective tabs.
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            The top 10 genes with highest frequency are shown
                            below the dropdown and can be selected by clicking
                            on their respective tabs.
                        </div>
                    )} */}
                    <OverlapExclusionIndicator
                        store={this.props.store}
                        only="sample"
                    />
                    <LollipopGeneSelector
                        store={this.props.store}
                        genes={this.props.store.availableGenes.result!}
                        handleGeneChange={this.handleGeneChange}
                        key={
                            'comparisonLollipopGene' +
                            this.props.store.activeMutationMapperGene!
                                .hugoGeneSymbol
                        }
                    />
                    <div style={{ display: 'flex' }}>
                        <div style={{ paddingRight: '5px' }}>
                            Highest Frequency:
                        </div>
                        <MSKTabs
                            activeTabId={this.activeTabId}
                            onTabClick={(id: string) =>
                                this.handleGeneChange(id)
                            }
                            className="pillTabs comparisonMutationMapperTabs"
                            tabButtonStyle="pills"
                            defaultTabId={false}
                        >
                            {this.tabs}
                        </MSKTabs>
                    </div>
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
