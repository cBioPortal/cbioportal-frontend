import * as React from 'react';
import { FunctionComponent } from 'react';
import { CancerTreeSearchFilter } from 'shared/lib/query/textQueryUtils';
import {
    ISearchClause,
    QueryUpdate,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import { FilterFormField } from 'shared/components/query/filteredSearch/field/FilterFormField';

export type FilteredSearchDropdownFormProps = {
    query: ISearchClause[];
    filterConfig: CancerTreeSearchFilter[];
    onChange: (change: QueryUpdate) => void;
    parser: QueryParser;
};

export const FilteredSearchDropdownForm: FunctionComponent<FilteredSearchDropdownFormProps> = props => {
    return (
        <ul
            className="dropdown-menu"
            style={{
                width: '300px',
            }}
        >
            {props.filterConfig.map(filter => {
                return (
                    <FilterFormField
                        filter={filter}
                        query={props.query}
                        onChange={props.onChange}
                        parser={props.parser}
                    />
                );
            })}
        </ul>
    );
};
