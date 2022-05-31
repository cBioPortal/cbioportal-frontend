import {
    AndClause,
    ClauseData,
    CancerTreeNodeFields,
    NotClause,
    parseSearchQuery,
    performSearchSingle,
    SearchClause,
    SearchClauseType,
    searchFilters,
} from 'shared/lib/textQueryUtils';
import * as React from 'react';
import { ReactNode } from 'react';
import { CancerTreeNode } from 'shared/components/query/CancerStudyTreeData';
import { FormGroup } from 'react-bootstrap';
import Autosuggest, { ItemAdapter } from 'react-bootstrap-autosuggest';
import _ from 'lodash';
import { FilteredSearch } from 'shared/components/query/FilteredSearch';

export type AutosuggestStudySearchProps = {
    parsedQuery: SearchClause[];
    onSearch: (query: SearchClause[]) => void;
};

export const AutosuggestStudySearch: React.FunctionComponent<AutosuggestStudySearchProps> = function(
    props
) {
    type SearchItem = {
        value: string | ReactNode;
        textRepresentation: string;
    };

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
        return props.onSearch(parseSearchQuery(query));
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

    function handleSearch(query: string): void {
        return props.onSearch(parseSearchQuery(query));
    }
};

function findClause(
    needle: SearchClause,
    haystack: SearchClause[]
): SearchClause | undefined {
    if (needle.type === SearchClauseType.AND) {
        return findAndClause(fromAndFields(needle), haystack);
    } else {
        return findNotClause(fromNotFields(needle), haystack);
    }
}

function findInverseClause(
    needle: SearchClause,
    haystack: SearchClause[]
): SearchClause | undefined {
    if (needle.type === SearchClauseType.AND) {
        return findNotClause(fromAndFields(needle), haystack);
    } else {
        return findAndClause(fromNotFields(needle), haystack);
    }
}

type FindClauseBy = { data: string; fields: CancerTreeNodeFields[] };

function findNotClause(needle: FindClauseBy, haystack: SearchClause[]) {
    return haystack
        .filter(h => h.type === SearchClauseType.NOT)
        .find(
            (h: NotClause) =>
                h.data === needle.data && _.isEqual(h.fields, needle.fields)
        );
}

function findAndClause(needle: FindClauseBy, haystack: SearchClause[]) {
    return haystack
        .filter(h => h.type === SearchClauseType.AND)
        .find((h: AndClause) =>
            h.data.find(
                d =>
                    d.phrase === needle.data &&
                    _.isEqual(d.fields, needle.fields)
            )
        );
}

function fromAndFields(needle: AndClause) {
    return {
        data: needle.data[0].phrase,
        fields: needle.data[0].fields,
    };
}

function fromNotFields(needle: NotClause) {
    return {
        data: needle.data,
        fields: needle.fields,
    };
}
