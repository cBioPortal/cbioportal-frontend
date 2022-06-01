import * as React from 'react';
import {
    ChangeEvent,
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    CancerTreeSearchFilter,
    SearchClause,
} from 'shared/lib/textQueryUtils';
import { FilteredSearchDropdownForm } from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';
import _ from 'lodash';
import { usePrevious } from 'shared/components/query/filteredSearch/usePrevious';
import { toJS } from 'mobx';

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
    console.log('props.query', toJS(props.query));

    const [isMenuOpen, setMenuOpen] = useState(false);

    const [inputValue, setInputValue] = useState(toQueryString(props.query));

    const [queryString, setQueryString] = useState(inputValue);
    const prevQueryString = usePrevious(queryString);

    function handleSearchBoxChange(e: ChangeEvent<HTMLInputElement>) {
        let value = e.target.value;
        setInputValue(value);
        setQueryStringDebounced(value);
    }

    useEffect(() => {
        if (queryString !== prevQueryString) {
            props.onType(queryString);
        }
    });

    // TODO: fix
    // useEffect(() => {
    //     setInputValue(toQueryString(props.query))
    // })

    const setQueryStringDebounced = useCallback(
        _.debounce(setQueryString, 1000),
        []
    );

    return (
        <>
            <div className={`dropdown ${isMenuOpen ? 'open' : ''}`}>
                <div className="input-group input-group-sm input-group-toggle">
                    <input
                        autoComplete="off"
                        className="form-control"
                        placeholder="Search..."
                        type="text"
                        value={inputValue}
                        onChange={handleSearchBoxChange}
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

function toQueryString(query: SearchClause[]) {
    return query.map(c => c.textRepresentation).join(' ');
}
