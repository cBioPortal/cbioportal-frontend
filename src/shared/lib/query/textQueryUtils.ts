import { CancerStudy } from 'cbioportal-ts-api-client';
import {
    CancerTreeNode,
    CancerTypeWithVisibility,
} from 'shared/components/query/CancerStudyTreeData';
import { FilterField } from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';
import {
    AndSearchClause,
    ISearchClause,
    Phrase,
} from 'shared/components/query/SearchClause';
import _ from 'lodash';
import { MatchResult } from 'shared/lib/query/QueryParser';

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

export function matchPhrase(phrase: string, fullText: string) {
    return fullText.toLowerCase().indexOf(phrase.toLowerCase()) > -1;
}

export function matchPhraseInStudyFields(
    phrase: string,
    study: CancerTreeNode,
    fields: CancerTreeNodeFields[]
): boolean {
    let anyFieldMatch = false;
    for (const fieldName of fields) {
        let fieldMatch = false;
        const studyElement = (study as any)[fieldName];
        if (studyElement) {
            fieldMatch = matchPhrase(phrase, studyElement);
        }
        anyFieldMatch = anyFieldMatch || fieldMatch;
    }
    return anyFieldMatch;
}

/**
 * @returns {boolean} true if the query matches,
 * considering quotation marks, 'and' and 'or' logic
 */
export function performSearchSingle(
    parsedQuery: ISearchClause[],
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
            let phrase = clause.getPhrases()[0];
            if (matchPhraseInStudyFields(phrase.phrase, study, phrase.fields)) {
                match = false;
                forced = true;
                break;
            }
        } else if (clause.isAnd()) {
            let clauseMatch = true;
            for (const phrase of clause.getPhrases()) {
                clauseMatch =
                    clauseMatch &&
                    matchPhraseInStudyFields(
                        phrase.phrase,
                        study,
                        phrase.fields
                    );
            }
            match = match || clauseMatch;
        }
    }
    return { match, forced };
}

/**
 * Add clause to query
 * - add clause when it does not exist
 * - remove all phrases from toAdd in existing query
 */
export function addClause(
    toAdd: ISearchClause,
    query: ISearchClause[]
): ISearchClause[] {
    let result = [...query];
    const existingClause = result.find(r => r.equals(toAdd));
    if (existingClause) {
        return result;
    }

    for (const p of toAdd.getPhrases()) {
        result = removePhrase(p, result);
    }

    return result;
}

/**
 * Remove clause from query
 * - When and-clause: remove all phrases from and-clause in query
 * - When not-clause: remove not-clause from query
 */
export function removeClause(
    toRemove: ISearchClause,
    query: ISearchClause[]
): ISearchClause[] {
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

export function createPhrase(
    prefix: string,
    option: string,
    fields: CancerTreeNodeFields[]
): Phrase {
    const textRepresentation = `${prefix ? `${prefix}:` : ''}${option}`;
    return {
        phrase: option,
        fields: fields,
        textRepresentation,
    };
}

/**
 * Remove phrase from query
 * - When removed phrase results in empty clause, the clause is also removed
 * - When phrase is removed from clause with multiple phrases, a new clause is added without the phrase
 *
 * Note: function expects phrase to exist only once
 */
export function removePhrase(
    phrase: Phrase,
    query: ISearchClause[]
): ISearchClause[] {
    const containingClause = query.find(r => r.contains(phrase));
    if (!containingClause) {
        return query;
    }
    let result = [...query];
    _.remove(result, containingClause);
    const multiplePhrases = containingClause.getPhrases().length > 1;
    if (multiplePhrases) {
        const otherPhrases = containingClause
            .getPhrases()
            .filter(p => !areEqualPhrases(p, phrase));
        result.push(new AndSearchClause(otherPhrases));
    }
    return result;
}

/**
 * Phrases are equal when phrase and fields are equal
 */
export function areEqualPhrases(a: Phrase, b: Phrase): boolean {
    if (a.phrase !== b.phrase) {
        return false;
    }
    return _.isEqual(a.fields, b.fields);
}

/**
 * Convert query of search clauses into string
 * - adding spaces between clauses
 * - adding `or` between two and-clauses
 */
export function toQueryString(query: ISearchClause[]): string {
    return query.reduce<string>(
        (accumulator: string, current: ISearchClause, i: number) => {
            const appendOr =
                current.isAnd() && query[i + 1] && query[i + 1].isAnd();
            return `${accumulator} ${current.toString()}${
                appendOr ? ' or' : ''
            }`;
        },
        ''
    );
}
