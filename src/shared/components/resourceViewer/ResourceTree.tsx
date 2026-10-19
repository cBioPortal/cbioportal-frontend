import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import classNames from 'classnames';
import _ from 'lodash';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';
import styles from './tree.module.scss';

export interface IResourceTreeProps {
    rows: IResourceTableRow[];
    selectedKey?: string;
    onSelect: (row: IResourceTableRow) => void;
}

/**
 * Every resource of one patient in a single list, grouped by resource. Lets the user move
 * between a slide and a scan without changing tab, which the per-resource tables cannot do.
 */
@observer
export default class ResourceTree extends React.Component<
    IResourceTreeProps,
    {}
> {
    constructor(props: IResourceTreeProps) {
        super(props);
        makeObservable(this);
    }

    /** Groups in the order the rows arrive, which the backend groups by resource. */
    @computed get groups(): { label: string; rows: IResourceTableRow[] }[] {
        const byResource = _.groupBy(this.props.rows, row => row.resourceId);
        return Object.keys(byResource).map(resourceId => ({
            label: byResource[resourceId][0].resourceType || resourceId,
            rows: byResource[resourceId],
        }));
    }

    private label(row: IResourceTableRow) {
        // The sample is what distinguishes one item of a resource from the next; the row's own
        // label is used when it has one.
        return row.description || row.sampleId || row.patientId;
    }

    render() {
        if (this.props.rows.length === 0) {
            return null;
        }

        return (
            <div className={styles.tree} data-test="ResourceTree">
                {this.groups.map(group => (
                    <div key={group.label} className={styles.group}>
                        <div className={styles.groupLabel}>
                            {group.label}{' '}
                            <span className={styles.count}>
                                {group.rows.length}
                            </span>
                        </div>
                        {group.rows.map(row => (
                            <div
                                key={row.key}
                                className={classNames(styles.leaf, {
                                    [styles.selected]:
                                        row.key === this.props.selectedKey,
                                })}
                                onClick={() => this.props.onSelect(row)}
                                data-test="ResourceTreeLeaf"
                                data-test-selected={
                                    row.key === this.props.selectedKey
                                        ? 'true'
                                        : undefined
                                }
                            >
                                {this.label(row)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }
}
