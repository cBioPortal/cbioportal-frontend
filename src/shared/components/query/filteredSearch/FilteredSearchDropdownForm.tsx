import * as React from 'react';
import { FunctionComponent } from 'react';
import { CancerTreeSearchFilter } from 'shared/lib/query/textQueryUtils';
import {
    AndSearchClause,
    ISearchClause,
    NotSearchClause,
    Phrase,
    QueryUpdate,
} from 'shared/components/query/SearchClause';
import { CheckboxFilterField } from 'shared/components/query/filteredSearch/CheckboxFilterField';
import { QueryParser } from 'shared/lib/query/QueryParser';

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

/**
 * Can be extended with additional input fields
 */
export type FilterField = CheckboxFilterField | ListFilterField;

/**
 * Options disappear when found in query:
 */
type ListFilterField = {
    input: typeof FilterList;
    options: string[];
};

export type FieldProps = {
    filter: CancerTreeSearchFilter;
    query: ISearchClause[];
    onChange: (change: QueryUpdate) => void;
    parser: QueryParser;
};

export const FilterFormField: FunctionComponent<FieldProps> = props => {
    const inputField = props.filter.form.input;
    return (
        <div
            className={`filter-form-field ${props.filter.phrasePrefix}`}
            style={{
                margin: '0.5em',
            }}
        >
            {React.createElement(inputField, props)}
        </div>
    );
};

export const FilterList: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as ListFilterField;

    return (
        <ul>
            {form.options.map(option => {
                const update = props.parser.parseSearchQuery(option);
                return (
                    <li className="menu-item">
                        <a
                            tabIndex={-1}
                            onClick={() => props.onChange({ toAdd: update })}
                        >
                            {option}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};
