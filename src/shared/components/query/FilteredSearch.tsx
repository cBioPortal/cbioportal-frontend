import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import {
    CancerTreeSearchFilter,
    SearchClause,
} from 'shared/lib/textQueryUtils';

/**
 * Free field containing negative or positive clauses
 */
export type TextFilterField = {
    input: typeof FilterText;
};

/**
 * Options are checked when found in query
 */
type CheckboxFilterField = {
    input: typeof FilterCheckbox;
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

export type FilteredSearchProps = {
    /**
     * Current search query
     */
    query: SearchClause[];

    /**
     * Configuration of dropdown form
     */
    filterConfig: CancerTreeSearchFilter[];

    /**
     * Input from dropdown form
     */
    onSelect: (query: string) => void;

    /**
     * Debounced content from search bar
     */
    onType: (query: string) => void;
};

export const FilteredSearch: FunctionComponent<FilteredSearchProps> = function(
    props
) {
    const [isMenuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <div className={`dropdown ${isMenuOpen ? 'open' : ''}`}>
                <div className="input-group input-group-sm input-group-toggle">
                    <input
                        autoComplete="off"
                        className="form-control"
                        placeholder="Search..."
                        type="text"
                        value={props.query.map(c => c.toString()).join(' ')}
                    />
                    <span className="input-group-btn">
                        <button
                            type="button"
                            className="dropdown-toggle btn btn-sm btn-default"
                            onClick={() => setMenuOpen(!isMenuOpen)}
                        >
                            <span className="caret">&nbsp;</span>
                        </button>
                    </span>
                </div>

                <FilteredSearchDropdownForm
                    query={props.query}
                    filterConfig={props.filterConfig}
                    onSelect={props.onSelect}
                />
            </div>
        </>
    );
};

export type FilteredSearchDropdownFormProps = {
    query: SearchClause[];
    filterConfig: CancerTreeSearchFilter[];
    onSelect: (textualRepresentation: string) => void;
};

export const FilteredSearchDropdownForm: FunctionComponent<FilteredSearchDropdownFormProps> = props => {
    return (
        <ul className="dropdown-menu">
            {props.filterConfig.map(filter => {
                const relevant = props.query.filter(c => {
                    const prefix = filter.phrasePrefix;
                    const textualRepresentation = c.toString();
                    if (prefix) {
                        return (
                            textualRepresentation.includes(':') &&
                            prefix === textualRepresentation.split(':')[0]
                        );
                    } else {
                        return !textualRepresentation.includes(':');
                    }
                });
                return (
                    <FilterFormField
                        filter={filter}
                        clauses={relevant}
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

type FieldProps = {
    filter: CancerTreeSearchFilter;
    clauses: SearchClause[];
    onClick: (textualRepresentation: string) => void;
};

function FilterFormField(props: FieldProps) {
    const inputType = props.filter.form.input;
    return React.createElement(inputType, props);
}

export function FilterList(props: FieldProps) {
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
}

export function FilterText(props: FieldProps) {
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
}

export function FilterCheckbox(props: FieldProps) {
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
}
