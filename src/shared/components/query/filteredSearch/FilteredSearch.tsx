import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import {
    CancerTreeSearchFilter,
    SearchClause,
} from 'shared/lib/textQueryUtils';
import { FilteredSearchDropdownForm } from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';
import { SearchBox } from 'shared/components/query/filteredSearch/SearchBox';

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
     * Input from search box
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
                    <SearchBox
                        queryString={toQueryString(props.query)}
                        onType={props.onType}
                    />
                    <MenuToggle onClick={() => setMenuOpen(!isMenuOpen)} />
                </div>
                <ClearSearchButton
                    show={props.query.length > 0}
                    onClick={() => props.onType('')}
                />
                <FilteredSearchDropdownForm
                    query={props.query}
                    filterConfig={props.filterConfig}
                    onSelect={props.onSelect}
                />
            </div>
        </>
    );
};

const MenuToggle: FunctionComponent<{ onClick: () => void }> = props => {
    return (
        <span className="input-group-btn">
            <button
                type="button"
                className="dropdown-toggle btn btn-sm btn-default"
                onClick={props.onClick}
            >
                <span className="caret">&nbsp;</span>
            </button>
        </span>
    );
};

const ClearSearchButton: FunctionComponent<{
    onClick: () => void;
    show: boolean;
}> = props => {
    return (
        <span
            data-test="clearStudyFilter"
            onClick={props.onClick}
            style={{
                visibility: props.show ? 'visible' : 'hidden',
                position: 'absolute',
                right: '37px',
                top: '3px',
                zIndex: 10,
                fontSize: '18px',
                cursor: 'pointer',
                color: 'grey',
            }}
        >
            x
        </span>
    );
};

function toQueryString(query: SearchClause[]) {
    return query.map(c => c.textRepresentation).join(' ');
}
