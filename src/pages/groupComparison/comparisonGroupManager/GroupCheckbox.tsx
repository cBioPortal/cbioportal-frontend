import * as React from 'react';
import { observer } from 'mobx-react';
import {
    caseCounts,
    DUPLICATE_GROUP_NAME_MSG,
    getNumPatients,
    getNumSamples,
    MissingSamplesMessage,
    StudyViewComparisonGroup,
} from '../GroupComparisonUtils';
import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import { computed, observable } from 'mobx';
import ErrorIcon from '../../../shared/components/ErrorIcon';
import styles from '../styles.module.scss';
import { SyntheticEvent } from 'react';
import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';

export interface IGroupCheckboxProps {
    group: StudyViewComparisonGroup;
    store: StudyViewPageStore;
    markedForDeletion: boolean;
    restore: (group: StudyViewComparisonGroup) => void;
    rename: (newName: string, currentGroup: StudyViewComparisonGroup) => void;
    delete: (group: StudyViewComparisonGroup) => void;
    addSelectedSamples: (group: StudyViewComparisonGroup) => void;
    allGroupNames: string[];
}

@observer
export default class GroupCheckbox extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    @observable _editingName = false;
    @observable nameInput = '';

    @computed get editingName() {
        return this._editingName && !this.props.markedForDeletion;
    }

    @autobind
    private onCheckboxClick() {
        this.props.store.toggleComparisonGroupSelected(this.props.group.uid);
    }

    @autobind
    private onRestoreClick() {
        this.props.restore(this.props.group);
    }

    @autobind
    private onEditClick() {
        this._editingName = true;
        this.nameInput = this.props.group.name;
    }

    @autobind
    private onDeleteClick() {
        this.props.delete(this.props.group);
    }

    @autobind
    private onAddSelectedSamplesClick() {
        this.props.addSelectedSamples(this.props.group);
    }

    @autobind
    private onEditSubmit() {
        if (
            this.nameInput.length > 0 &&
            this.nameInput !== this.props.group.name
        ) {
            this.props.rename(this.nameInput, this.props.group);
        }
        this._editingName = false;
    }

    @autobind
    private onEditCancel() {
        this._editingName = false;
    }

    @autobind
    private handleNameInputChange(evt: SyntheticEvent<HTMLInputElement>) {
        this.nameInput = (evt.target as HTMLInputElement).value;
    }

    @computed get label() {
        return (
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <EllipsisTextTooltip text={this.props.group.name} />
                &nbsp;(
                {caseCounts(
                    getNumSamples(this.props.group),
                    getNumPatients(this.props.group)
                )}
                )
            </span>
        );
    }

    @computed get editingNameUI() {
        return (
            <DefaultTooltip
                visible={
                    !!(this.editSubmitError && this.editSubmitError.message)
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
                        <span>
                            {this.editSubmitError &&
                                this.editSubmitError.message}
                        </span>
                    </div>
                }
            >
                <input
                    type="text"
                    value={this.nameInput}
                    onChange={this.handleNameInputChange}
                    style={{ width: 174 }}
                />
            </DefaultTooltip>
        );
    }

    @computed get editSubmitError() {
        if (this.nameInput.length === 0) {
            return { message: 'Please enter a name.' };
        } else if (this.nameInput === this.props.group.name) {
            // Non-null object signifies that submit should be disabled, but no message specified means no tooltip.
            return {};
        } else if (this.props.allGroupNames.indexOf(this.nameInput) > -1) {
            return { message: DUPLICATE_GROUP_NAME_MSG };
        } else {
            return null;
        }
    }

    render() {
        const group = this.props.group;
        let checkboxAndLabel;
        if (this.props.markedForDeletion) {
            checkboxAndLabel = (
                <span className={styles.markedForDeletion}>{this.label}</span>
            );
        } else {
            checkboxAndLabel = (
                <div
                    className={styles.groupItem}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <input
                        type="checkbox"
                        value={group.uid}
                        checked={this.props.store.isComparisonGroupSelected(
                            group.uid
                        )}
                        onClick={this.onCheckboxClick}
                    />
                    {this.editingName ? this.editingNameUI : this.label}
                </div>
            );
        }

        let editingRelatedIcons;
        if (this.editingName) {
            editingRelatedIcons = [
                <button
                    className="btn btn-xs btn-primary"
                    onClick={this.onEditSubmit}
                    disabled={!!this.editSubmitError}
                    style={{ marginRight: 3 }}
                >
                    Save
                </button>,
                <button
                    className="btn btn-xs btn-default"
                    onClick={this.onEditCancel}
                >
                    Cancel
                </button>,
            ];
        } else if (!this.props.markedForDeletion) {
            editingRelatedIcons = [
                <DefaultTooltip overlay={'Edit Name'}>
                    <span onClick={this.onEditClick}>
                        <i
                            className="fa fa-md fa-pencil"
                            style={{
                                cursor: 'pointer',
                            }}
                        />
                    </span>
                </DefaultTooltip>,
                <DefaultTooltip overlay={'Delete Group'}>
                    <span onClick={this.onDeleteClick}>
                        <i
                            className="fa fa-md fa-trash"
                            style={{
                                cursor: 'pointer',
                            }}
                        />
                    </span>
                </DefaultTooltip>,
                <DefaultTooltip
                    overlay={
                        <span>
                            {`Add currently selected samples (${getNumSamples(
                                group
                            )}) to `}
                            <strong>{group.name}</strong>
                        </span>
                    }
                >
                    <span onClick={this.onAddSelectedSamplesClick}>
                        <i
                            className="fa fa-md fa-plus"
                            style={{
                                cursor: 'pointer',
                            }}
                        />
                    </span>
                </DefaultTooltip>,
            ];
        }

        return (
            <div
                key={group.uid}
                className={styles.groupRow}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 4,
                    paddingTop: 4,
                }}
            >
                {checkboxAndLabel}
                <div className={styles.groupLineItemActionButtons}>
                    {editingRelatedIcons}
                    {this.props.group.nonExistentSamples.length > 0 && (
                        <ErrorIcon
                            tooltip={
                                <MissingSamplesMessage
                                    samples={
                                        this.props.group.nonExistentSamples
                                    }
                                />
                            }
                        />
                    )}
                    {this.props.markedForDeletion && (
                        <button
                            style={{ marginLeft: 10 }}
                            className="btn btn-xs btn-default"
                            onClick={this.onRestoreClick}
                        >
                            Restore
                        </button>
                    )}
                </div>
            </div>
        );
    }
}
