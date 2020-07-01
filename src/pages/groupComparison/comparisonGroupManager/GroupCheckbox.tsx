import * as React from 'react';
import { observer } from 'mobx-react';
import {
    caseCounts,
    getNumPatients,
    getNumSamples,
    MissingSamplesMessage,
    StudyViewComparisonGroup,
} from '../GroupComparisonUtils';
import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import { computed } from 'mobx';
import ErrorIcon from '../../../shared/components/ErrorIcon';
import styles from '../styles.module.scss';

import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import classnames from 'classnames';

export interface IGroupCheckboxProps {
    group: StudyViewComparisonGroup;
    store: StudyViewPageStore;
    markedForDeletion: boolean;
    studyIds: string[];
    restore: (group: StudyViewComparisonGroup) => void;
    delete: (group: StudyViewComparisonGroup) => void;
    shareGroup: (group: StudyViewComparisonGroup) => void;
}

@observer
export default class GroupCheckbox extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    @autobind
    private onCheckboxClick() {
        this.props.store.toggleComparisonGroupSelected(this.props.group.uid);
    }

    @autobind
    private onRestoreClick() {
        this.props.restore(this.props.group);
    }

    @autobind
    private onDeleteClick() {
        this.props.delete(this.props.group);
    }

    @autobind
    private shareGroup() {
        this.props.shareGroup(this.props.group);
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
                    {this.label}
                </div>
            );
        }

        return (
            <div
                key={group.uid}
                className={classnames(styles.groupRow, {
                    [styles.sharedGroup]: this.props.group.isSharedGroup,
                })}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 4,
                    paddingTop: 4,
                    minHeight: '35px',
                }}
            >
                {checkboxAndLabel}
                <div className={styles.groupLineItemActionButtons}>
                    {!this.props.markedForDeletion && (
                        <>
                            <DefaultTooltip overlay={'Delete Group'}>
                                <span onClick={this.onDeleteClick}>
                                    <i
                                        className="fa fa-md fa-trash"
                                        style={{
                                            cursor: 'pointer',
                                        }}
                                    />
                                </span>
                            </DefaultTooltip>
                            <span onClick={this.shareGroup}>
                                <i
                                    className="fa fa-share-alt"
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                />
                            </span>
                        </>
                    )}

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
