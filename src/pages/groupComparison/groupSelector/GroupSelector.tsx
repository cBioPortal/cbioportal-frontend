import * as React from 'react';
import { observer } from 'mobx-react';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import GroupComparisonStore, { OverlapStrategy } from '../GroupComparisonStore';
import autobind from 'autobind-decorator';
import GroupSelectorButton from './GroupSelectorButton';
import GroupSelectorButtonList from './GroupSelectorButtonList';
import SelectAllDeselectAll from './SelectAllDeselectAll';

export interface IGroupSelectorProps {
    store: GroupComparisonStore;
}

@observer
export default class GroupSelector extends React.Component<
    IGroupSelectorProps,
    {}
> {
    private dragging = false;

    @autobind
    private isSelected(groupName: string) {
        return !!this.props.store.isGroupSelected(groupName);
    }

    @autobind
    private onClick(groupName: string) {
        if (!this.dragging) {
            this.props.store.toggleGroupSelected(groupName);
        }
    }

    @autobind
    private onClickDelete(groupName: string) {
        if (!this.dragging) {
            this.props.store.deleteGroup(groupName);
        }
    }

    @autobind
    private onSortEnd(params: any) {
        if (params.oldIndex !== params.newIndex)
            this.props.store.updateGroupOrder(params.oldIndex, params.newIndex);

        this.dragging = false;
    }

    @autobind
    private onSortStart() {
        this.dragging = true;
    }

    readonly tabUI = MakeMobxView({
        await: () => [
            this.props.store._originalGroups,
            this.props.store.sampleSet,
            this.props.store.overlapComputations,
        ],
        render: () => {
            if (this.props.store._originalGroups.result!.length === 0) {
                return null;
            } else {
                const deletable =
                    this.props.store._originalGroups.result!.length > 2;
                const buttons = this.props.store._originalGroups.result!.map(
                    (group, index) => {
                        const excludedFromAnalysis =
                            this.props.store.overlapStrategy ===
                                OverlapStrategy.EXCLUDE &&
                            group.uid in
                                this.props.store.overlapComputations.result!
                                    .excludedFromAnalysis;

                        return (
                            <GroupSelectorButton
                                isSelected={this.isSelected}
                                deletable={deletable}
                                onClick={this.onClick}
                                onClickDelete={this.onClickDelete}
                                sampleSet={this.props.store.sampleSet.result!}
                                group={group}
                                index={index}
                                excludedFromAnalysis={excludedFromAnalysis}
                            />
                        );
                    }
                );
                buttons.push(
                    <SelectAllDeselectAll
                        store={this.props.store}
                        disabled={true}
                        index={buttons.length}
                    />
                );
                return (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                        }}
                    >
                        <strong style={{ marginRight: 5 }}>Groups: </strong>
                        <span style={{ fontSize: 12, marginRight: 3 }}>
                            (drag to reorder)
                        </span>
                        <GroupSelectorButtonList
                            buttons={buttons}
                            axis="xy"
                            onSortStart={this.onSortStart}
                            onSortEnd={this.onSortEnd}
                            distance={6}
                        />
                    </div>
                );
            }
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} size="big" center={true} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
