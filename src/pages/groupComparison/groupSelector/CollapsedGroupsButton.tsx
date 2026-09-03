import * as React from 'react';
import { observer } from 'mobx-react';
import { SortableElement } from 'react-sortable-hoc';
import classNames from 'classnames';
import styles from '../styles.module.scss';

export interface ICollapsedGroupsButtonProps {
    numCollapsedGroups: number;
    toggleCollapsedGroups: () => void;
    collapsed: boolean;
}

@observer
class CollapsedGroupsButton extends React.Component<
    ICollapsedGroupsButtonProps,
    {}
> {
    render() {
        return (
            <button
                className={classNames('btn btn-xs btn-default')}
                onClick={this.props.toggleCollapsedGroups}
                data-test={`groupSelectorCollapseButton`}
            >
                {this.props.collapsed
                    ? `${
                          this.props.numCollapsedGroups
                      } more groups ${String.fromCharCode(9660)}`
                    : `Show less ${String.fromCharCode(9650)}`}
            </button>
        );
    }
}
// SortableElement HOC strips original prop types; re-assert them.
export default (SortableElement(
    CollapsedGroupsButton
) as unknown) as React.ComponentType<
    ICollapsedGroupsButtonProps & { index: number; disabled?: boolean }
>;

//    content: ' \25BC';
