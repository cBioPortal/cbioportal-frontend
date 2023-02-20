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

type hesitantPillStoreEntry = {
    key: string;
    onDeleteCallback?: () => void;
};

export type QueuedFilterPillStore = {
    [content: string]: hesitantPillStoreEntry;
};

getBrowserWindow().hesitantPillStore = {} as QueuedFilterPillStore;

@observer
export class PillTag extends React.Component<IPillTagProps, {}> {
    @observable isDeleted = false;

    constructor(props: IPillTagProps) {
        super(props);
        makeObservable(this);
        if (this.hesitateUpdate) {
            this.putHesitantPill();
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
        if (!this.hesitateUpdate) {
            // Delete all filters immediately in autocommit mode:
            this.deleteNow();
            return;
        }
        if (this.hesitateUpdate && this.hesitantPillStoreEntry) {
            // Delete non-submitted filters immediately in hesitate mode:
            this.deleteNow();
            return;
        }
        if (this.hesitateUpdate && !this.hesitantPillStoreEntry) {
            // Postpone deleting of submitted filters in hesitate mode:
            this.isDeleted = true;
            this.putHesitantPill();
        }
    }

    private deleteNow() {
        if (this.props.onDelete) {
            this.props.onDelete();
        }
    }

    /**
     * Add or update pill in hesitantPillStore
     */
    private putHesitantPill() {
        const onDeleteCallback = this.isDeleted
            ? () => {
                  if (this.props.onDelete) {
                      this.props.onDelete();
                  }
              }
            : undefined;
        const key = this.hesitantPillStoreKey;
        this.hesitantPillStore[key] = {
            key,
            onDeleteCallback,
        };
    }

    private get hesitantPillStore(): QueuedFilterPillStore {
        return getBrowserWindow().hesitantPillStore;
    }

    /**
     * Only pills of queued filters have an entry in this store
     */
    private get hesitantPillStoreEntry() {
        const key = this.hesitantPillStoreKey;
        return (this.hesitantPillStore as any)[key];
    }

    private get hesitantPillStoreKey() {
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
