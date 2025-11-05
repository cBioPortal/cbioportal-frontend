import * as React from 'react';
import { observer } from 'mobx-react';
import styles from './styles/styles.module.scss';
import { QueryStore } from './QueryStore';
import { IFilterDef } from './DataTypeFilter';
import { createDataTypeUpdate } from './DataTypeFilter';

export interface IDataTypeFilterSidebarProps {
    store: QueryStore;
    dataFilterActive: IFilterDef[];
    toggleFilter: (id: string) => void;
    samplePerFilter: number[];
    studyPerFilter: number[];
}

export const DataTypeFilterSidebar: React.FunctionComponent<IDataTypeFilterSidebarProps> = observer(
    props => {
        return (
            <div className={styles.filterList}>
                {props.dataFilterActive.map((type, i) => {
                    return (
                        <label key={type.id} className={styles.filterItem}>
                            <input
                                type="checkbox"
                                checked={type.checked}
                                onChange={() => {
                                    props.toggleFilter(type.id);
                                    props.store.dataTypeFilters = createDataTypeUpdate(
                                        props.dataFilterActive
                                    );
                                }}
                            />
                            <span className={styles.filterItemLabel}>
                                {type.name}
                            </span>
                            <span className={styles.filterItemCount}>
                                {props.studyPerFilter[i]} studies,{' '}
                                {props.samplePerFilter[i]} samples
                            </span>
                        </label>
                    );
                })}
                {props.dataFilterActive.length === 0 && (
                    <div className={styles.noFilters}>
                        No data types available
                    </div>
                )}
            </div>
        );
    }
);
