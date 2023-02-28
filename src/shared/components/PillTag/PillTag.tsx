import * as React from 'react';
import _ from 'lodash';
import styles from './styles.module.scss';
import { If } from 'react-if';
import contrast from 'contrast';
import { computed, makeObservable, observable } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';

export interface IPillTagProps {
    content: string | { uniqueChartKey: string; element: JSX.Element };
    backgroundColor: string;
    infoSection?: JSX.Element | null;
    onDelete?: () => void;
    store: StudyViewPageStore;
}

export type PillStoreEntry = {
    /**
     * Unique filter key
     */
    key: string;

    /**
     * Called in hesitate mode, when filter updates are submitted
     */
    onDeleteCallback?: () => void;
};

export type PillStore = {
    [content: string]: PillStoreEntry;
};

/**
 * Keep track of submitted and 'hesitant' (i.e. queued or non-submitted)
 * filters using a unique key. When a delete is queued, a hesitant store entry
 * also contains an onDeleteCallback, which will be executed on submit.
 *
 * Filters can be of different shapes, and they are created
 * in a number of different places, so we use these two global stores
 * to keep track of hesitant (queued) filters and submitted filters.
 *
 * TODO: A better solution would be a uniform list of filters
 *  but this would require some refactoring.
 */
getBrowserWindow().hesitantPillStore = {} as PillStore;
getBrowserWindow().submittedPillStore = {} as PillStore;

@observer
export class PillTag extends React.Component<IPillTagProps, {}> {
    @observable isDeleted = false;

    constructor(props: IPillTagProps) {
        super(props);
        makeObservable(this);
        // TODO: when switching to autocommit: trigger submit
        if (this.hesitateUpdate && !this.submittedPillStoreEntry) {
            this.addPillToHesitateStore();
        } else {
            // We always need to keep track of submitted filters,
            // in case user switches from auto to hesitate mode:
            this.addPillToSubmittedStore();
        }
    }

    private get hesitateUpdate() {
        return this.props.store.hesitateUpdate;
    }

    @computed
    get contentColor() {
        let _contrast = contrast(this.props.backgroundColor);
        if (_contrast === 'light') {
            return '#000';
        } else {
            return '#fff';
        }
    }

    private handleDelete() {
        this.isDeleted = true;
        if (!this.hesitateUpdate) {
            // Delete all filters immediately in autocommit mode:
            this.deleteNow();
            return;
        }
        if (
            this.hesitateUpdate &&
            this.hesitantPillStoreEntry &&
            !this.hesitantPillStoreEntry.onDeleteCallback
        ) {
            // Delete non-submitted filters immediately in hesitate mode:
            this.deleteNow();
            return;
        }
        if (this.hesitateUpdate && !this.hesitantPillStoreEntry) {
            // Postpone deleting of submitted filters in hesitate mode:
            this.addPillToHesitateStore();
        }
    }

    private deleteNow() {
        const key = this.pillStoreKey;
        delete this.submittedPillStore[key];
        if (this.props.onDelete) {
            this.props.onDelete();
        }
    }

    private addPillToHesitateStore() {
        const onDeleteCallback = this.isDeleted
            ? () => {
                  if (this.props.onDelete) {
                      this.props.onDelete();
                  }
              }
            : undefined;
        const key = this.pillStoreKey;
        this.hesitantPillStore[key] = {
            key,
            onDeleteCallback,
        };
    }

    private addPillToSubmittedStore() {
        const key = this.pillStoreKey;
        this.submittedPillStore[key] = { key };
    }

    private get hesitantPillStore(): PillStore {
        return getBrowserWindow().hesitantPillStore;
    }

    private get submittedPillStore(): PillStore {
        return getBrowserWindow().submittedPillStore;
    }

    private get hesitantPillStoreEntry() {
        const key = this.pillStoreKey;
        return (this.hesitantPillStore as any)[key];
    }

    private get submittedPillStoreEntry() {
        const key = this.pillStoreKey;
        return (this.submittedPillStore as any)[key];
    }

    private get pillStoreKey() {
        return _.isString(this.props.content)
            ? this.props.content
            : this.props.content.uniqueChartKey;
    }

    private get contentToRender() {
        return _.isString(this.props.content)
            ? this.props.content
            : this.props.content.element;
    }

    render() {
        const isPending = !!this.hesitantPillStoreEntry;

        return (
            <div
                className={classnames({
                    [styles.main]: true,
                    [styles.pending]: isPending,
                    [styles.pendingDelete]: this.isDeleted,
                })}
                style={{
                    background: this.props.backgroundColor,
                    color: this.contentColor,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <span className={styles.content}>
                        {this.contentToRender}
                    </span>
                    {this.props.infoSection}
                </div>
                <If condition={_.isFunction(this.props.onDelete)}>
                    <span
                        data-test="pill-tag-delete"
                        className={styles.delete}
                        onClick={() => this.handleDelete()}
                    >
                        <i className="fa fa-times-circle"></i>
                    </span>
                </If>
            </div>
        );
    }
}
