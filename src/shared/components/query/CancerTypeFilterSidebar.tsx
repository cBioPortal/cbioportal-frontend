import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import styles from './styles/styles.module.scss';
import classNames from 'classnames';
import { QueryStore } from './QueryStore';
import { TypeOfCancer as CancerType } from 'cbioportal-ts-api-client';
import { expr } from 'mobx-utils';
import _ from 'lodash';
import memoize from 'memoize-weak-decorator';

export interface ICancerTypeFilterSidebarProps {
    store: QueryStore;
}

@observer
export default class CancerTypeFilterSidebar extends React.Component<
    ICancerTypeFilterSidebarProps,
    {}
> {
    constructor(props: ICancerTypeFilterSidebarProps) {
        super(props);
        makeObservable(this);
    }

    get logic() {
        return this.props.store.studyListLogic;
    }

    @memoize
    getCancerTypeClickHandler<T>(node: CancerType) {
        return (event: React.MouseEvent<T>) =>
            this.props.store.selectCancerType(node as CancerType, event.ctrlKey);
    }

    renderCancerTypeItem = (cancerType: CancerType) => {
        let numStudies = expr(
            () =>
                this.logic.cancerTypeListView.getDescendantCancerStudies(
                    cancerType
                ).length
        );
        let selected = _.includes(
            this.props.store.selectedCancerTypeIds,
            cancerType.cancerTypeId
        );
        let highlighted = this.logic.isHighlighted(cancerType);
        let liClassName = classNames(styles.filterItem, {
            [styles.selected]: selected,
            [styles.matchingNodeText]:
                !!this.props.store.searchText && highlighted,
            [styles.nonMatchingNodeText]:
                !!this.props.store.searchText && !highlighted,
            [styles.containsSelectedStudies]: expr(() =>
                this.logic.cancerTypeContainsSelectedStudies(cancerType)
            ),
        });

        return (
            <label
                key={cancerType.cancerTypeId}
                className={liClassName}
                onMouseDown={this.getCancerTypeClickHandler(cancerType)}
            >
                <span className={styles.filterItemLabel}>
                    {cancerType.name}
                </span>
                <span className={styles.filterItemCount}>{numStudies}</span>
            </label>
        );
    };

    render() {
        let cancerTypes = this.logic.cancerTypeListView.getChildCancerTypes(
            this.props.store.treeData.rootCancerType
        );

        return (
            <div className={styles.filterList}>
                {cancerTypes.map(cancerType =>
                    this.renderCancerTypeItem(cancerType)
                )}
                {cancerTypes.length === 0 && (
                    <div className={styles.noFilters}>
                        No cancer types available
                    </div>
                )}
            </div>
        );
    }
}
