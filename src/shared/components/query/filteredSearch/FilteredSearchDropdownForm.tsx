import { FunctionComponent } from 'react';
import {
    CancerTreeSearchFilter,
    SearchClause,
} from 'shared/lib/textQueryUtils';
import * as React from 'react';
import {
    findClauseByString,
    findClausesByPrefix,
    findInverseClauseByString,
} from 'shared/components/query/AutosuggestStudySearch';

export type FilteredSearchDropdownFormProps = {
    query: SearchClause[];
    filterConfig: CancerTreeSearchFilter[];
    onSelect: (textualRepresentation: string) => void;
};

export const FilteredSearchDropdownForm: FunctionComponent<FilteredSearchDropdownFormProps> = props => {
    return (
        <ul className="dropdown-menu">
            {props.filterConfig.map(filter => {
                return (
                    <FilterFormField
                        filter={filter}
                        clauses={props.query}
                        onClick={props.onSelect}
                    />
                );
            })}
            <li className="menu-item">
                <a tabIndex={-1} href="#">
                    Lorem
                </a>
            </li>
        </ul>
    );
};

/**
 * Free field containing negative or positive clauses
 */
export type TextFilterField = {
    input: typeof FilterText;
    label: string;
};

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

export type FilterField =
    | TextFilterField
    | CheckboxFilterField
    | ListFilterField;

type FieldProps = {
    filter: CancerTreeSearchFilter;
    clauses: SearchClause[];
    onClick: (textualRepresentation: string) => void;
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
    return (
        <div className="filter-checkbox">
            <span>{form.label}</span>
            <div>
                {form.options.map((option: string, i: number) => {
                    const textualRepresentation = `${prefix}:${option}`;
                    const exists = !!findClauseByString(
                        textualRepresentation,
                        props.clauses
                    );
                    const inverseExists = !!findInverseClauseByString(
                        textualRepresentation,
                        props.clauses
                    );
                    const prefixExists =
                        prefix && findClausesByPrefix(prefix, props.clauses);
                    const checked = exists;
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
                                    const result = `${
                                        checked ? '- ' : ''
                                    } ${textualRepresentation}`;
                                    props.onClick(result);
                                }}
                                style={{
                                    display: 'inline-block',
                                }}
                                checked={checked}
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
                const textualRepresentation = `${prefix}:${option}`;
                return (
                    <li className="menu-item">
                        <a
                            tabIndex={-1}
                            onClick={() => props.onClick(textualRepresentation)}
                        >
                            {option}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};

export const FilterText: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as ListFilterField;
    const prefix = props.filter.phrasePrefix;
    return (
        <ul>
            {form.options.map(option => {
                const textualRepresentation = `${prefix}:${option}`;
                return (
                    <li className="menu-item">
                        <a
                            tabIndex={-1}
                            onClick={() => props.onClick(textualRepresentation)}
                        >
                            {option}
                        </a>
                    </li>
                );
            })}
            ;
        </ul>
    );
};
