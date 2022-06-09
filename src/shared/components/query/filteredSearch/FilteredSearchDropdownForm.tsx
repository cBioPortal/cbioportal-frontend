import * as React from 'react';
import { FunctionComponent } from 'react';
import { CancerTreeSearchFilter } from 'shared/lib/textQueryUtils';
import {
    AndSearchClause,
    ISearchClause,
    Phrase,
} from 'shared/components/query/SearchClause';

export type FilteredSearchDropdownFormProps = {
    query: ISearchClause[];
    filterConfig: CancerTreeSearchFilter[];
    onAdd: (clauses: ISearchClause[]) => void;
    onRemove: (clauses: ISearchClause[]) => void;
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
                        clauses={props.query}
                        onAdd={props.onAdd}
                        onRemove={props.onRemove}
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
 * Options are checked when found in query
 */
type CheckboxFilterField = {
    input: typeof FilterCheckbox;
    label: string;
    options: string[];
};

/**
 * Options disappear when found in query:
 */
type ListFilterField = {
    input: typeof FilterList;
    options: string[];
};

type FieldProps = {
    filter: CancerTreeSearchFilter;
    clauses: ISearchClause[];
    onAdd: (clauses: ISearchClause[]) => void;
    onRemove: (clauses: ISearchClause[]) => void;
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

export const FilterCheckbox: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as CheckboxFilterField;
    const prefix = props.filter.phrasePrefix;
    const allSelected: Phrase[] = [];
    return (
        <div className="filter-checkbox">
            <span>{form.label}</span>
            <div>
                {form.options.map((option: string, i: number) => {
                    const textRepresentation = `${prefix}:${option}`;
                    let phrase = {
                        phrase: option,
                        fields: props.filter.nodeFields,
                        textRepresentation,
                    };
                    const exists = !!props.clauses.find(
                        clause => clause.isAnd() && clause.contains(phrase)
                    );
                    if (exists) {
                        allSelected.push(phrase);
                    }
                    const id = `input-${option}-${i}`;
                    return (
                        <span
                            style={{
                                padding: '0 1em 0 0',
                            }}
                        >
                            <input
                                type="checkbox"
                                id={id}
                                value={option}
                                onClick={() => {
                                    if (exists) {
                                        props.onRemove([
                                            new AndSearchClause([phrase]),
                                        ]);
                                    } else {
                                        allSelected.push(phrase);
                                        props.onAdd([
                                            new AndSearchClause(allSelected),
                                        ]);
                                    }
                                }}
                                style={{
                                    display: 'inline-block',
                                }}
                                checked={exists}
                            />
                            <label
                                htmlFor={id}
                                style={{
                                    display: 'inline-block',
                                    padding: '0 0 0 0.2em',
                                }}
                            >
                                {option}
                            </label>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export const FilterList: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as ListFilterField;
    const prefix = props.filter.phrasePrefix;
    return (
        <ul>
            {form.options.map(option => {
                const textRepresentation = `${prefix}:${option}`;
                const clause = new AndSearchClause([
                    {
                        phrase: option,
                        fields: props.filter.nodeFields,
                        textRepresentation,
                    },
                ]);
                return (
                    <li className="menu-item">
                        <a tabIndex={-1} onClick={() => props.onAdd([clause])}>
                            {option}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};
