import * as React from 'react';
import { SyntheticEvent } from 'react';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    DUPLICATE_GROUP_NAME_MSG,
    getDefaultGroupName,
    MAX_GROUPS_IN_SESSION,
    StudyViewComparisonGroup,
} from '../GroupComparisonUtils';
import {
    getComparisonLoadingUrl,
    redirectToComparisonPage,
} from '../../../shared/api/urls';
import styles from '../styles.module.scss';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import {
    addSamplesParameters,
    getGroupParameters,
    getSelectedGroups,
} from './ComparisonGroupManagerUtils';
import comparisonClient from '../../../shared/api/comparisonGroupClientInstance';
import { MakeMobxView } from '../../../shared/components/MobxView';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import GroupCheckbox from './GroupCheckbox';
import { sleepUntil } from '../../../shared/lib/TimeUtils';
import { LoadingPhase } from '../GroupComparisonLoading';
import _ from 'lodash';
import { serializeEvent } from 'shared/lib/tracking';

export interface IComparisonGroupManagerProps {
    store: StudyViewPageStore;
}

@observer
export default class ComparisonGroupManager extends React.Component<
    IComparisonGroupManagerProps,
    {}
> {
    @observable groupNameFilter: string = '';
    @observable addGroupPanelOpen = false;
    @observable _inputGroupName: string = '';
    @computed get inputGroupName() {
        return this._inputGroupName;
    }
    @observable addSamplesTargetGroupId: string = '';

    @autobind
    @action
    private onChangeGroupNameFilter(e: SyntheticEvent<HTMLInputElement>) {
        this.groupNameFilter = (e.target as HTMLInputElement).value;
    }

    @autobind
    @action
    private onChangeInputGroupName(e: SyntheticEvent<HTMLInputElement>) {
        this._inputGroupName = (e.target as HTMLInputElement).value;
    }

    readonly filteredGroups = remoteData({
        await: () => [this.props.store.comparisonGroups],
        invoke: () =>
            Promise.resolve(
                // TODO: fuzzy string search?
                _.sortBy(
                    this.props.store.comparisonGroups.result!.filter(group =>
                        new RegExp(this.groupNameFilter, 'i').test(group.name)
                    ),
                    group => group.name.toLowerCase()
                )
            ),
    });

    @autobind
    @action
    private showAddGroupPanel() {
        this.addGroupPanelOpen = true;
        this._inputGroupName = getDefaultGroupName(
            this.props.store.filters,
            this.props.store.customChartFilterSet.toJS(),
            this.props.store.clinicalAttributeIdToDataType.result!
        );
    }

    @autobind
    @action
    private cancelAddGroup() {
        this.addGroupPanelOpen = false;
        this._inputGroupName = '';
        this.addSamplesTargetGroupId = '';
    }

    @autobind
    @action
    private deleteGroup(group: StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    @autobind
    @action
    private async addSamplesToGroup(group: StudyViewComparisonGroup) {
        if (this.props.store.selectedSamples.result) {
            await comparisonClient.updateGroup(
                group.uid,
                addSamplesParameters(
                    group,
                    this.props.store.selectedSamples.result
                )
            );
            this.props.store.notifyComparisonGroupsChange();
        }
    }

    @autobind
    @action
    private selectAllFiltered() {
        for (const group of this.filteredGroups.result!) {
            this.props.store.setComparisonGroupSelected(group.uid, true);
        }
    }

    @autobind
    @action
    private deselectAllFiltered() {
        for (const group of this.filteredGroups.result!) {
            this.props.store.setComparisonGroupSelected(group.uid, false);
        }
    }

    private get header() {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginTop: 3,
                    alignItems: 'center',
                    marginBottom: 10,
                }}
            >
                <div className="btn-group" role="group">
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.selectAllFiltered}
                    >
                        Select all&nbsp;
                        {this.filteredGroups.isComplete
                            ? `(${this.filteredGroups.result!.length})`
                            : ''}
                    </button>
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.deselectAllFiltered}
                    >
                        Deselect all
                    </button>
                </div>
                <input
                    className="form-control"
                    style={{
                        right: 0,
                        width: 140,
                        height: 25,
                    }}
                    type="text"
                    placeholder="Search.."
                    value={this.groupNameFilter}
                    onChange={this.onChangeGroupNameFilter}
                />
            </div>
        );
    }

    @autobind
    private restoreGroup(group: StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    @autobind
    private async renameGroup(
        newName: string,
        group: StudyViewComparisonGroup
    ) {
        const { name, ...rest } = group;
        await comparisonClient.updateGroup(group.uid, {
            name: newName,
            ...rest,
        });
        this.props.store.notifyComparisonGroupsChange();
    }

    private readonly groupsSection = MakeMobxView({
        await: () => [
            this.props.store.comparisonGroups,
            this.filteredGroups,
            this.props.store.selectedSamples,
        ],
        render: () => {
            if (this.props.store.comparisonGroups.result!.length > 0) {
                // show this component if there are groups, and if filteredGroups is complete
                const allGroupNames = this.props.store.comparisonGroups.result!.map(
                    group => group.name
                );
                return (
                    <div className={styles.groupCheckboxes}>
                        {this.filteredGroups.result!.length > 0 ? (
                            this.filteredGroups.result!.map(group => (
                                <GroupCheckbox
                                    group={group}
                                    store={this.props.store}
                                    markedForDeletion={this.props.store.isComparisonGroupMarkedForDeletion(
                                        group.uid
                                    )}
                                    restore={this.restoreGroup}
                                    rename={this.renameGroup}
                                    delete={this.deleteGroup}
                                    addSelectedSamples={this.addSamplesToGroup}
                                    allGroupNames={allGroupNames}
                                />
                            ))
                        ) : (
                            <div className={styles.noGroupsMessage}>
                                No results for your current search.
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div className={styles.noGroupsMessage}>
                        Group comparison allows you to create custom groups and
                        compare their clinical and genomic features. Use the
                        button below to create groups based on selections.
                    </div>
                );
            }
        },
        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => (
            <div className={styles.noGroupsMessage}>
                <ErrorMessage
                    message={
                        'There was an error loading saved groups. Please try again.'
                    }
                />
            </div>
        ),
    });

    private get viewButton() {
        if (
            this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result.length > 0
        ) {
            // only show select button if there are any groups
            return (
                <button
                    className="btn btn-sm btn-default"
                    disabled={
                        getSelectedGroups(
                            this.props.store.comparisonGroups.result,
                            this.props.store
                        ).length === 0
                    }
                    style={{ marginLeft: 7 }}
                    onClick={() => {
                        this.props.store.clearAllFilters();
                        this.props.store.updateComparisonGroupsFilter();
                    }}
                >
                    View
                </button>
            );
        } else {
            return null;
        }
    }

    @computed get submitNewGroupDisabled() {
        const selectedSamples = this.props.store.selectedSamples.isComplete
            ? this.props.store.selectedSamples.result
            : undefined;
        const allGroupNames = this.props.store.comparisonGroups.isComplete
            ? this.props.store.comparisonGroups.result!.map(group => group.name)
            : undefined;
        return (
            !selectedSamples ||
            this.inputGroupName.length === 0 ||
            !allGroupNames ||
            allGroupNames.includes(this.inputGroupName)
        );
    }

    @autobind
    @action
    private async submitNewGroup() {
        const selectedSamples = this.props.store.selectedSamples.isComplete
            ? this.props.store.selectedSamples.result
            : undefined;
        const { id } = await comparisonClient.addGroup(
            getGroupParameters(
                this.inputGroupName,
                selectedSamples!,
                this.props.store.studyIds
            )
        );
        this.props.store.setComparisonGroupSelected(id); // created groups start selected
        this.props.store.notifyComparisonGroupsChange();
        this.cancelAddGroup();
    }

    private get compareButton() {
        if (this.props.store.comparisonGroups.isComplete) {
            // only show if there are enough groups to possibly compare (i.e. 2)
            const numSelectedGroups = getSelectedGroups(
                this.props.store.comparisonGroups.result,
                this.props.store
            ).length;
            const wrongNumberOfGroups =
                numSelectedGroups > MAX_GROUPS_IN_SESSION ||
                numSelectedGroups < 2;

            let tooltipText = '';
            if (this.props.store.comparisonGroups.result.length >= 2) {
                if (wrongNumberOfGroups) {
                    tooltipText = `Select between 2 and ${MAX_GROUPS_IN_SESSION} groups to enable comparison.`;
                } else {
                    tooltipText =
                        'Open a comparison session with selected groups';
                }
            } else {
                tooltipText =
                    'Create at least two groups to open a comparison session';
            }

            return (
                <DefaultTooltip overlay={tooltipText}>
                    <button
                        className="btn btn-sm btn-primary"
                        disabled={wrongNumberOfGroups}
                        data-event={serializeEvent({
                            action: 'createCustomComparisonSession',
                            label: this.props.store.comparisonGroups.result.length.toString(),
                            category: 'groupComparison',
                        })}
                        onClick={async () => {
                            // open window before the first `await` call - this makes it a synchronous window.open,
                            //  which doesnt trigger pop-up blockers. We'll send it to the correct url once we get the result
                            const comparisonWindow = window.open(
                                getComparisonLoadingUrl({
                                    phase: LoadingPhase.CREATING_SESSION,
                                }),
                                '_blank'
                            );

                            // wait until the new window has routingStore available
                            await sleepUntil(
                                () => !!(comparisonWindow as any).routingStore
                            );

                            // save comparison session, and get id
                            const groups = getSelectedGroups(
                                this.props.store.comparisonGroups.result!,
                                this.props.store
                            );
                            const {
                                id,
                            } = await comparisonClient.addComparisonSession({
                                groups,
                                origin: this.props.store.studyIds,
                            });

                            // redirect window to correct URL
                            redirectToComparisonPage(comparisonWindow!, {
                                sessionId: id,
                            });
                        }}
                    >
                        Compare
                    </button>
                </DefaultTooltip>
            );
        } else {
            return null;
        }
    }

    private readonly actionButtons = MakeMobxView({
        await: () => [this.props.store.comparisonGroups],
        render: () => {
            if (this.props.store.comparisonGroups.result!.length > 0) {
                return (
                    <div
                        style={{
                            marginTop: 6,
                        }}
                    >
                        {this.compareButton}
                        {this.viewButton}
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    private get addGroupPanel() {
        let contents: any;
        const inputWidth = 235;
        const createOrAddButtonWidth = 58;
        const selectedSamples = this.props.store.selectedSamples.isComplete
            ? this.props.store.selectedSamples.result
            : undefined;
        const allGroupNames = this.props.store.comparisonGroups.isComplete
            ? this.props.store.comparisonGroups.result!.map(group => group.name)
            : undefined;
        if (this.addGroupPanelOpen) {
            contents = [
                <div
                    style={{
                        display: 'none',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginTop: 3,
                    }}
                >
                    <h5>
                        Add{selectedSamples ? ` ${selectedSamples.length}` : ''}{' '}
                        selected samples
                    </h5>
                    <button
                        className="btn btn-xs btn-default"
                        style={{
                            right: 0,
                            marginTop: -4,
                        }}
                        onClick={this.cancelAddGroup}
                    >
                        Cancel
                    </button>
                </div>,
                <div style={{ width: '100%', marginTop: 7 }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <DefaultTooltip
                            visible={
                                allGroupNames &&
                                allGroupNames.includes(this.inputGroupName)
                            }
                            overlay={
                                <div>
                                    <i
                                        className="fa fa-md fa-exclamation-triangle"
                                        style={{
                                            color: '#BB1700',
                                            marginRight: 5,
                                        }}
                                    />
                                    <span>{DUPLICATE_GROUP_NAME_MSG}</span>
                                </div>
                            }
                        >
                            <input
                                className="form-control"
                                style={{ marginRight: 5 }}
                                type="text"
                                placeholder="Enter a name for your new group"
                                value={this.inputGroupName}
                                onChange={this.onChangeInputGroupName}
                                onKeyPress={event => {
                                    if (
                                        event.key == 'Enter' &&
                                        !this.submitNewGroupDisabled
                                    ) {
                                        this.submitNewGroup();
                                    }
                                }}
                            />
                        </DefaultTooltip>
                        <button
                            className="btn btn-sm btn-primary"
                            style={{ width: createOrAddButtonWidth }}
                            onClick={this.submitNewGroup}
                            disabled={this.submitNewGroupDisabled}
                        >
                            Create
                        </button>
                    </div>
                </div>,
            ];
        } else {
            contents = (
                <button
                    className="btn btn-sm btn-primary"
                    data-event={serializeEvent({
                        action: 'createCustomGroup',
                        label: '',
                        category: 'groupComparison',
                    })}
                    onClick={this.showAddGroupPanel}
                    disabled={!selectedSamples}
                    style={{ width: '100%' }}
                >
                    Create new group from selected samples{' '}
                    {selectedSamples ? ` (${selectedSamples.length})` : ''}
                </button>
            );
        }
        return (
            <div
                style={{
                    width: '100%',
                }}
            >
                {contents}
            </div>
        );
    }

    componentWillUnmount() {
        this.props.store.deleteMarkedComparisonGroups();
    }

    render() {
        return (
            <div
                className={styles.comparisonGroupManager}
                style={{ position: 'relative' }}
            >
                {this.header}
                {this.groupsSection.component}
                {this.actionButtons.component}
                <hr />
                {this.addGroupPanel}
            </div>
        );
    }
}
