import {
    AndClause,
    CancerTreeNodeFields,
    ClauseData,
    NotClause,
    parseSearchQuery,
    SearchClause,
    SearchClauseType,
    searchFilters,
} from 'shared/lib/textQueryUtils';
import * as React from 'react';
import _ from 'lodash';
import { FilteredSearch } from 'shared/components/query/filteredSearch/FilteredSearch';

export type AutosuggestStudySearchProps = {
    parsedQuery: SearchClause[];
    onSearch: (query: SearchClause[]) => void;
};

export const AutosuggestStudySearch: React.FunctionComponent<AutosuggestStudySearchProps> = function(
    props
) {
    return (
        <>
            <FilteredSearch
                query={props.parsedQuery}
                filterConfig={searchFilters}
                onSelect={handleSelect}
                onType={handleTyping}
            />
        </>
    );

    function handleTyping(query: string) {
        let parsed = parseSearchQuery(query);
        console.log('handleTyping', query, parsed);
        return props.onSearch(parsed);
    }

    function handleSelect(textRepresentation: string): void {
        const clauses = parseSearchQuery(textRepresentation);
        const result = props.parsedQuery;

        for (const clause of clauses) {
            if (!clause) {
                continue;
            }

            const existingClause = findClause(clause, result);
            if (existingClause) {
                continue;
            }

            const inverseClause = findInverseClause(clause, result);
            if (inverseClause) {
                _.remove(result, c => _.isEqual(c, inverseClause));
            }

            result.push(clause);
        }

        props.onSearch(result);
    }

    // TODO:
    function handleSearch(query: string): void {
        return props.onSearch(parseSearchQuery(query));
    }
};

export function findClausesByPrefix(
    prefix: string,
    haystack: SearchClause[]
): SearchClause[] {
    return findClauseBy((c: ClauseData) => {
        return c.phrase.includes(`${prefix}:`);
    }, haystack);
}

export function findClause(
    needle: SearchClause,
    haystack: SearchClause[]
): SearchClause | undefined {
    if (needle.type === SearchClauseType.AND) {
        return findAndClause(fromAndFields(needle), haystack);
    } else {
        return findNotClause(fromNotFields(needle), haystack);
    }
}

export function findClauseByString(
    textualRepresentation: string,
    haystack: SearchClause[]
): SearchClause | undefined {
    const clause = parseSearchQuery(textualRepresentation);
    return findClause(clause[0], haystack);
}

export function findInverseClause(
    needle: SearchClause,
    haystack: SearchClause[]
): SearchClause | undefined {
    if (needle.type === SearchClauseType.AND) {
        return findNotClause(fromAndFields(needle), haystack);
    } else {
        return findAndClause(fromNotFields(needle), haystack);
    }
}

export function findInverseClauseByString(
    textualRepresentation: string,
    haystack: SearchClause[]
): SearchClause | undefined {
    const clause = parseSearchQuery(textualRepresentation);
    return findInverseClause(clause[0], haystack);
}

type FindClauseBy = { data: string; fields: CancerTreeNodeFields[] };

function findNotClause(needle: FindClauseBy, haystack: SearchClause[]) {
    return haystack
        .filter(h => h.type === SearchClauseType.NOT)
        .find(
            (h: NotClause) =>
                h.phrase === needle.data && _.isEqual(h.fields, needle.fields)
        );
}

function findAndClause(needle: FindClauseBy, haystack: SearchClause[]) {
    const andClauses = haystack.filter(c => c.type === SearchClauseType.AND);
    return andClauses.find((h: AndClause) =>
        h.data.find(
            d => d.phrase === needle.data && _.isEqual(d.fields, needle.fields)
        )
    );
}

/**
 * Find clauses that match predicate
 * @returns {SearchClause}
 *  - {@link NotClause} that match predicate
 *  - {@link AndClause} with phrases that match predicate
 */
function findClauseBy(
    predicate: (value: ClauseData) => boolean,
    haystack: SearchClause[]
): SearchClause[] {
    const results: SearchClause[] = [];
    let andClauses = haystack
        .filter(c => c.type === SearchClauseType.AND)
        .filter((c: AndClause) =>
            c.data.filter((d: ClauseData) => predicate(d))
        );
    results.concat(andClauses);
    let notClauses = haystack
        .filter(c => c.type === SearchClauseType.NOT)
        .filter((c: NotClause) => predicate(c));
    results.concat(notClauses);
    return results;
}

function fromAndFields(needle: AndClause) {
    return {
        data: needle.data[0].phrase,
        fields: needle.data[0].fields,
    };
}

function fromNotFields(needle: NotClause) {
    return {
        data: needle.phrase,
        fields: needle.fields,
    };
}
