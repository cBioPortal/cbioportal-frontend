import { CancerStudy } from 'cbioportal-ts-api-client';
import {
    CancerTreeNode,
    CancerTypeWithVisibility,
} from 'shared/components/query/CancerStudyTreeData';
import {
    FILTER_SEPARATOR,
    SearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import _ from 'lodash';
import { MatchResult } from 'shared/lib/query/QueryParser';
import { FilterField } from 'shared/components/query/filteredSearch/field/FilterFormField';
import {
    ListPhrase,
    Phrase,
} from 'shared/components/query/filteredSearch/Phrase';

export type CancerTreeSearchFilter = {
    /**
     * Prefix that marks type of search filter in, as in: <prefix>:<value>
     */
    phrasePrefix: string | undefined;

    /**
     * Study node properties to search in
     */
    nodeFields: CancerTreeNodeFields[];

    /**
     * Filter form config
     */
    form: FilterField;
};

export const defaultNodeFields: CancerTreeNodeFields[] = [
    'name',
    'description',
    'studyId',
];

export type CancerTreeNodeFields =
    | keyof CancerTypeWithVisibility
    | keyof CancerStudy;

/**
 * @returns {boolean} true if the query matches,
 * considering quotation marks, 'and' and 'or' logic
 */
export function performSearchSingle(
    parsedQuery: SearchClause[],
    study: CancerTreeNode
): MatchResult {
    let match = false;
    let hasPositiveClauseType = false;
    let forced = false;

    for (const clause of parsedQuery) {
        if (clause.isAnd()) {
            hasPositiveClauseType = true;
            break;
        }
    }
    if (!hasPositiveClauseType) {
        // if only negative clauses, match by default
        match = true;
    }
    for (const clause of parsedQuery) {
        if (clause.isNot()) {
            const phrase = clause.getPhrases()[0];
            if (phrase.match(study)) {
                match = false;
                forced = true;
                break;
            }
        } else if (clause.isAnd()) {
            let clauseMatch = true;
            for (const phrase of clause.getPhrases()) {
                clauseMatch = clauseMatch && phrase.match(study);
            }
            match = match || clauseMatch;
        }
    }
    return { match, forced };
}

/**
 * Add clause to query
 * - remove all phrases from toAdd in existing query
 * if not-clause:
 * - add new not-clause
 * if and-clause:
 * - merge with existing and-clauses
 * - or push new clause
 */
export function addClauses(
    toAdd: SearchClause[],
    query: SearchClause[]
): SearchClause[] {
    let result = [...query];
    let newAndClauses: SearchClause[] = [];
    for (const clause of toAdd) {
        const existingClause = result.find(r => r.equals(clause));
        if (existingClause) {
            continue;
        }

        for (const p of clause.getPhrases()) {
            result = removePhrase(p, result);
        }

        if (clause.isAnd()) {
            [result, newAndClauses] = addAndClause(
                result,
                newAndClauses,
                clause
            );
        } else {
            result = addNotClause(clause, result);
        }
    }

    return result;
}

/**
 * Merge and-clause with old and-clauses, or add new and-clause
 * @returns {result, newClauses}
 */
function addAndClause(
    query: SearchClause[],
    newClauses: SearchClause[],
    toAdd: SearchClause
): [SearchClause[], SearchClause[]] {
    const oldClauses = query.filter(c => c.isAnd() && !newClauses.includes(c));
    if (oldClauses.length) {
        mergeAndClause(toAdd, oldClauses);
    } else {
        query.push(toAdd);
        newClauses.push(toAdd);
    }
    return [query, newClauses];
}

/**
 * Merge phrases with existing and-clauses
 */
function mergeAndClause(toAdd: SearchClause, query: SearchClause[]): void {
    query.forEach(c => c.getPhrases().push(...toAdd.getPhrases()));
}

function addNotClause(toAdd: SearchClause, result: SearchClause[]) {
    result.push(toAdd);
    return result;
}

/**
 * Remove clause from query
 * - When and-clause: remove all phrases from and-clause in query
 * - When not-clause: remove not-clause from query
 */
export function removeClause(
    toRemove: SearchClause,
    query: SearchClause[]
): SearchClause[] {
    let result = [...query];
    if (toRemove.isAnd()) {
        const andClauses = query.filter(c => c.isAnd());
        toRemove
            .getPhrases()
            .forEach(p => (result = removePhrase(p, andClauses)));
    } else {
        result = result.filter(r => !r.equals(toRemove));
    }
    return result;
}

export function createListPhrase(
    prefix: string,
    option: string,
    fields: CancerTreeNodeFields[]
): ListPhrase {
    const textRepresentation = `${
        prefix ? `${prefix}${FILTER_SEPARATOR}` : ''
    }${option}`;
    return new ListPhrase(option, textRepresentation, fields);
}

export function removePhrase(
    phrase: Phrase,
    query: SearchClause[]
): SearchClause[] {
    const containingClauses = query.filter(r => r.contains(phrase));
    if (!containingClauses.length) {
        return query;
    }
    let result = [...query];
    containingClauses.forEach(c => {
        if (c.getPhrases().length === 1) {
            _.remove(result, c);
        } else {
            _.remove(c.getPhrases(), p => p.equals(phrase));
        }
    });
    return result;
}

/**
 * Convert query of search clauses into string
 * - adding spaces between clauses
 * - adding `or` between two and-clauses
 */
export function toQueryString(query: SearchClause[]): string {
    return query.reduce<string>(
        (accumulator: string, current: SearchClause, i: number) => {
            if (!i) {
                return current.toString();
            }
            const or = current.isAnd() && query[i - 1] && query[i - 1].isAnd();
            return `${accumulator} ${or ? 'or ' : ''}${current.toString()}`;
        },
        ''
    );
}
