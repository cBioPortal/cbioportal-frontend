import { addClauses, removePhrase } from 'shared/lib/query/textQueryUtils';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { FilteredSearch } from 'shared/components/query/filteredSearch/FilteredSearch';
import {
    ISearchClause,
    QueryUpdate,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import _ from 'lodash';

export type AutosuggestStudySearchProps = {
    parser: QueryParser;
    parsedQuery: ISearchClause[];
    onSearch: (query: ISearchClause[]) => void;
};

export const AutosuggestStudySearch: FunctionComponent<AutosuggestStudySearchProps> = function(
    props
) {
    return (
        <FilteredSearch
            query={props.parsedQuery}
            filterConfig={props.parser.searchFilters}
            onChange={handleChange}
            onType={handleTyping}
            parser={props.parser}
        />
    );

    function handleTyping(query: string) {
        let parsed = props.parser.parseSearchQuery(query);
        return props.onSearch(parsed);
    }

    function handleChange(update: QueryUpdate) {
        let result = _.cloneDeep(props.parsedQuery);
        if (update.toRemove) {
            for (const p of update.toRemove) {
                result = removePhrase(p, result);
            }
        }
        if (update.toAdd) {
            result = addClauses(update.toAdd, result);
        }
        props.onSearch(result);
    }
};
