import * as React from 'react';
import { observer } from 'mobx-react';
import styles from '../styles.module.scss';
import { SortableContainer } from 'react-sortable-hoc';

export interface IGroupSelectorButtonListProps {
    buttons: any[];
}

@observer
class GroupSelectorButtonList extends React.Component<
    IGroupSelectorButtonListProps,
    {}
> {
    render() {
        return (
            <div className={styles.groupButtons}>
                <div>{this.props.buttons}</div>
            </div>
        );
    }
}

// SortableContainer HOC strips original prop types; re-assert them.
export default (SortableContainer(
    GroupSelectorButtonList
) as unknown) as React.ComponentType<
    IGroupSelectorButtonListProps & {
        axis?: 'x' | 'y' | 'xy';
        onSortStart?: () => void;
        onSortEnd?: (params: any) => void;
        distance?: number;
    }
>;
