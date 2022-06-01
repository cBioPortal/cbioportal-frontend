import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import {
    CancerTreeSearchFilter,
    SearchClause,
} from 'shared/lib/textQueryUtils';
import { FilteredSearchDropdownForm } from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';

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
                        value={props.query
                            .map(c => c.textRepresentation)
                            .join(' ')}
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
