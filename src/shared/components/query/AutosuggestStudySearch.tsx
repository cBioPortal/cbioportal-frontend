import {
    addClause,
    parseSearchQuery,
    removeClause,
    searchFilters,
} from 'shared/lib/textQueryUtils';
import * as React from 'react';
import { FilteredSearch } from 'shared/components/query/filteredSearch/FilteredSearch';
import { ISearchClause } from 'shared/components/query/SearchClause';
import { FunctionComponent } from 'react';

export type AutosuggestStudySearchProps = {
    parsedQuery: ISearchClause[];
    onSearch: (query: ISearchClause[]) => void;
};

export const AutosuggestStudySearch: FunctionComponent<AutosuggestStudySearchProps> = function(
    props
) {
    return (
        <>
            <FilteredSearch
                query={props.parsedQuery}
                filterConfig={searchFilters}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onType={handleTyping}
            />
        </>
    );

    function handleTyping(query: string) {
        let parsed = parseSearchQuery(query);
        return props.onSearch(parsed);
    }

    function handleAdd(textRepresentation: string): void {
        const toAdd = parseSearchQuery(textRepresentation)[0];
        if (!toAdd) {
            return;
        }
        let result = props.parsedQuery;
        result = addClause(toAdd, result);
        props.onSearch(result);
    }

    function handleRemove(textRepresentation: string): void {
        const toRemove = parseSearchQuery(textRepresentation)[0];
        if (!toRemove) {
            return;
        }
        let result = props.parsedQuery;
        result = removeClause(toRemove, result);
        props.onSearch(result);
    }
};
