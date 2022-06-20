import {
    addClauses,
    removePhrase,
    toQueryString,
} from 'shared/lib/query/textQueryUtils';
import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import {
    SearchClause,
    QueryUpdate,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import _ from 'lodash';
import { SearchBox } from 'shared/components/query/filteredSearch/SearchBox';
import { StudySearchControls } from 'shared/components/query/filteredSearch/StudySearchControls';

export type AutosuggestStudySearchProps = {
    parser: QueryParser;
    query: SearchClause[];
    onSearch: (query: SearchClause[]) => void;
};

export const StudySearch: FunctionComponent<AutosuggestStudySearchProps> = function(
    props
) {
    const [isMenuOpen, setMenuOpen] = useState(false);

    return (
        <div className={`autosuggest dropdown ${isMenuOpen ? 'open' : ''}`}>
            <div className="input-group input-group-sm input-group-toggle">
                <SearchBox
                    queryString={toQueryString(props.query)}
                    onType={handleQueryTyping}
                />
                <SearchMenuToggle onClick={() => setMenuOpen(!isMenuOpen)} />
            </div>
            <ClearSearchButton
                show={props.query.length > 0}
                onClick={() => handleQueryTyping('')}
            />
            <StudySearchControls
                query={props.query}
                filterConfig={props.parser.searchFilters}
                onChange={handleQueryUpdate}
                parser={props.parser}
            />
        </div>
    );

    function handleQueryTyping(update: string) {
        const updatedQuery = props.parser.parseSearchQuery(update);
        return props.onSearch(updatedQuery);
    }

    function handleQueryUpdate(update: QueryUpdate) {
        let updatedQuery = _.cloneDeep(props.query);
        if (update.toRemove) {
            for (const p of update.toRemove) {
                updatedQuery = removePhrase(p, updatedQuery);
            }
        }
        if (update.toAdd) {
            updatedQuery = addClauses(update.toAdd, updatedQuery);
        }
        props.onSearch(updatedQuery);
    }
};

const SearchMenuToggle: FunctionComponent<{ onClick: () => void }> = props => {
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
