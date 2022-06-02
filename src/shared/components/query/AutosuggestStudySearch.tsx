import { parseSearchQuery, searchFilters } from 'shared/lib/textQueryUtils';
import * as React from 'react';
import _ from 'lodash';
import { FilteredSearch } from 'shared/components/query/filteredSearch/FilteredSearch';
import {
    AndClause,
    ClauseData,
    FindClauseBy,
    NotClause,
    SearchClause,
    SearchClauseType,
} from 'shared/components/query/SearchClause';

export type AutosuggestStudySearchProps = {
    parsedQuery: SearchClause[];
    onSearch: (query: SearchClause[]) => void;
};

/**
 * TODO: how to handle deleting of phrase in AND array?
 */
function removePhraseFromClauses(
    existingClause: SearchClause,
    result: SearchClause[],
    toRemove: SearchClause
) {
    const clauseIsNot = existingClause.type === SearchClauseType.NOT;
    const clauseHasSinglePhrase =
        existingClause.type === SearchClauseType.AND &&
        existingClause.data.length === 1;
    if (clauseIsNot || clauseHasSinglePhrase) {
        _.remove(result, c => _.isEqual(c, existingClause));
    } else {
        // TODO: simplify using clause.toString():
        const andClause = existingClause as AndClause;
        const findClause = toRemove as FindClauseBy;
        _.remove(andClause.data, c => clausMatches(c, findClause));
        existingClause.textRepresentation = andClause.data
            .map(d => d.textRepresentation)
            .join(' ');
    }
}

export const AutosuggestStudySearch: React.FunctionComponent<AutosuggestStudySearchProps> = function(
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
        console.log('handleTyping', query, parsed);
        return props.onSearch(parsed);
    }

    // TODO: replace with clause:
    function handleAdd(textRepresentation: string): void {
        const clause = parseSearchQuery(textRepresentation)[0];
        const result = props.parsedQuery;

        if (!clause) {
            return;
        }

        const existingClause = findClause(clause, result);
        if (existingClause) {
            return;
        }

        result.push(clause);

        const inverseClause = findInverseClause(clause, result);
        if (inverseClause) {
            if (inverseClause.type === SearchClauseType.NOT) {
                _.remove(result, c => _.isEqual(c, inverseClause));
            } else {
                // TODO: simplify using clause.toString():
                // inverse is AND, so clause is NOT:
                const toRemove: ClauseData = inverseClause.data.find(d =>
                    clausMatches(d, clause as FindClauseBy)
                )!;
                _.remove(inverseClause.data, c => _.isEqual(c, toRemove));
                inverseClause.textRepresentation = inverseClause.data
                    .map(d => d.textRepresentation)
                    .join(' ');
            }
        }

        props.onSearch(result);
    }

    // TODO: replace with clause:
    function handleRemove(textRepresentation: string): void {
        const toRemove = parseSearchQuery(textRepresentation)[0];
        if (!toRemove) {
            return;
        }

        const result = props.parsedQuery;
        const existingClause = findClause(toRemove, result);
        if (!existingClause) {
            return;
        }
        removePhraseFromClauses(existingClause, result, toRemove);

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
    return findClausesBy((c: ClauseData) => {
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

function findNotClause(
    needle: FindClauseBy,
    haystack: SearchClause[]
): NotClause {
    return haystack
        .filter(h => h.type === SearchClauseType.NOT)
        .find((h: NotClause) => clausMatches(h, needle)) as NotClause;
}

function findAndClause(
    needle: FindClauseBy,
    haystack: SearchClause[]
): AndClause {
    return haystack
        .filter(c => c.type === SearchClauseType.AND)
        .find((h: AndClause) =>
            h.data.find(d => clausMatches(d, needle))
        ) as AndClause;
}

function clausMatches(clause: ClauseData, d: FindClauseBy): boolean {
    return clause.phrase === d.phrase && _.isEqual(d.fields, clause.fields);
}

/**
 * Find clauses that match predicate
 * @returns {SearchClause}
 *  - {@link NotClause} that match predicate
 *  - {@link AndClause} with phrases that match predicate
 */
function findClausesBy(
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

function fromAndFields(needle: AndClause): FindClauseBy {
    return {
        phrase: needle.data[0].phrase,
        fields: needle.data[0].fields,
    };
}

function fromNotFields(needle: NotClause): FindClauseBy {
    return {
        phrase: needle.phrase,
        fields: needle.fields,
    };
}
