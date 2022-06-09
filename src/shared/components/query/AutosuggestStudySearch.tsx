import {
    addClause,
    parseSearchQuery,
    removePhrase,
    searchFilters,
} from 'shared/lib/textQueryUtils';
import * as React from 'react';
import { FilteredSearch } from 'shared/components/query/filteredSearch/FilteredSearch';
import {
    ISearchClause,
    QueryUpdate,
} from 'shared/components/query/SearchClause';
import { FunctionComponent } from 'react';

export type AutosuggestStudySearchProps = {
    parsedQuery: ISearchClause[];
    onSearch: (query: ISearchClause[]) => void;
};

export const AutosuggestStudySearch: FunctionComponent<AutosuggestStudySearchProps> = function(
    props
) {
    return (
        <FilteredSearch
            query={props.parsedQuery}
            filterConfig={searchFilters}
            onChange={handleChange}
            onType={handleTyping}
        />
    );

    function handleTyping(query: string) {
        let parsed = parseSearchQuery(query);
        return props.onSearch(parsed);
    }

    function handleChange(update: QueryUpdate) {
        let result = props.parsedQuery;
        if (update.toAdd) {
            for (const clause of update.toAdd) {
                result = addClause(clause, result);
            }
        }
        if (update.toRemove) {
            for (const p of update.toRemove) {
                result = removePhrase(p, result);
            }
        }
        props.onSearch(result);
    }
};
