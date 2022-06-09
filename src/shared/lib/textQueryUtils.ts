import { CancerStudy } from 'cbioportal-ts-api-client';
import {
    CancerTreeNode,
    CancerTypeWithVisibility,
} from 'shared/components/query/CancerStudyTreeData';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import {
    FilterCheckbox,
    FilterField,
    FilterList,
} from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';
import {
    AndSearchClause,
    Phrase,
    ISearchClause,
    NotSearchClause,
} from 'shared/components/query/SearchClause';
import _ from 'lodash';

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

/**
 * This field can be extended with additional search filters
 */
export const searchFilters: CancerTreeSearchFilter[] = [
    /**
     * Reference genome:
     */
    {
        phrasePrefix: 'reference-genome',
        nodeFields: ['referenceGenome'],
        form: {
            input: FilterCheckbox,
            // TODO: Make dynamic
            options: ['hg19', 'hg38'],
            label: 'Reference genome',
        },
    },
    /**
     * Example queries:
     */
    {
        phrasePrefix: undefined,
        nodeFields: defaultNodeFields,
        form: {
            label: 'Examples',
            input: FilterList,
            options: ServerConfigHelpers.skin_example_study_queries(
                getServerConfig()!.skin_example_study_queries || ''
            ),
        },
    },
];

export type CancerTreeNodeFields =
    | keyof CancerTypeWithVisibility
    | keyof CancerStudy;

export function parseSearchQuery(query: string): ISearchClause[] {
    query = cleanUpQuery(query);
    const phrases = createPhrases(query);
    return createClauses(phrases);
}

/**
 * Eliminate trailing whitespace
 * and reduce every whitespace to a single space.
 */
function cleanUpQuery(query: string) {
    return query
        .toLowerCase()
        .trim()
        .split(/\s+/g)
        .join(' ');
}

/**
 * Factor out quotation marks and inter-token spaces
 */
function createPhrases(query: string): string[] {
    let phrases = [];
    let currInd = 0;
    let nextSpace, nextQuote;
    while (currInd < query.length) {
        if (query[currInd] === '"') {
            nextQuote = query.indexOf('"', currInd + 1);
            if (nextQuote === -1) {
                phrases.push(query.substring(currInd + 1));
                currInd = query.length;
            } else {
                phrases.push(query.substring(currInd + 1, nextQuote));
                currInd = nextQuote + 1;
            }
        } else if (query[currInd] === ' ') {
            currInd += 1;
        } else if (query[currInd] === '-') {
            phrases.push('-');
            currInd += 1;
        } else {
            nextSpace = query.indexOf(' ', currInd);
            if (nextSpace === -1) {
                phrases.push(query.substring(currInd));
                currInd = query.length;
            } else {
                phrases.push(query.substring(currInd, nextSpace));
                currInd = nextSpace + 1;
            }
        }
    }
    return phrases;
}

/**
 * Create conjunctive and negative clauses
 */
function createClauses(phrases: string[]): ISearchClause[] {
    const clauses: ISearchClause[] = [];
    let currInd = 0;
    while (currInd < phrases.length) {
        if (phrases[currInd] === '-') {
            currInd = addNotClause(currInd, phrases, clauses);
        } else {
            currInd = addAndClause(phrases, currInd, clauses);
        }
    }
    return clauses;
}

/**
 * @returns {number} next index
 **/
function addNotClause(
    currInd: number,
    phrases: string[],
    clauses: ISearchClause[]
): number {
    if (currInd < phrases.length - 1) {
        clauses.push(createNotClause(phrases[currInd + 1]));
    }
    return currInd + 2;
}

/**
 * @returns {number} next index
 */
function addAndClause(
    phrases: string[],
    currInd: number,
    clauses: ISearchClause[]
): number {
    let nextOr = phrases.indexOf('or', currInd);
    let nextDash = phrases.indexOf('-', currInd);
    if (nextOr === -1 && nextDash === -1) {
        clauses.push(createAndClause(phrases.slice(currInd)));
        return phrases.length;
    } else if (nextOr === -1 && nextDash > 0) {
        clauses.push(createAndClause(phrases.slice(currInd, nextDash)));
        return nextDash;
    } else if (nextOr > 0 && nextDash === -1) {
        clauses.push(createAndClause(phrases.slice(currInd, nextOr)));
        return nextOr + 1;
    } else {
        if (nextOr < nextDash) {
            clauses.push(createAndClause(phrases.slice(currInd, nextOr)));
            return nextOr + 1;
        } else {
            clauses.push(createAndClause(phrases.slice(currInd, nextDash)));
            return nextDash;
        }
    }
}

function parsePhrase(data: string): Phrase {
    const parts: string[] = data.split(':');
    let phrase: string;
    let fields: CancerTreeNodeFields[];
    let filter = searchFilters.find(sf => sf.phrasePrefix === parts[0]);
    if (parts.length === 2 && filter?.nodeFields) {
        phrase = parts[1];
        fields = filter.nodeFields;
    } else {
        phrase = parts[0];
        fields = defaultNodeFields;
    }
    return { phrase, fields, textRepresentation: enquoteSpaces(data) };
}

function createNotClause(data: string): ISearchClause {
    const { phrase, fields } = parsePhrase(data);
    let textRepresentation = enquoteSpaces(data);
    return new NotSearchClause({ phrase, textRepresentation, fields });
}

function createAndClause(phrases: string[]): ISearchClause {
    const data: Phrase[] = [];
    for (const phrase of phrases) {
        const parsedData = parsePhrase(phrase);
        data.push(parsedData);
    }
    return new AndSearchClause(data);
}

export function enquoteSpaces(data: string) {
    return data.includes(' ') ? `"${data}"` : data;
}

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

type MatchResult = {
    match: boolean;
    forced: boolean;
};

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
 * - add, or do nothing when clause already exists
 * - remove added phrases from existing query
 * - remove inverse clause from query
 *   (and-clause is 'inverse' or 'opposite' of not-clause)
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

    let multiplePhrases = toAdd.getPhrases().length > 1;
    if (multiplePhrases) {
        result = removeClause(toAdd, query);
    }

    result.push(toAdd);

    const inverseClause = findInverseClause(toAdd, result);
    if (inverseClause) {
        result = removeClause(inverseClause, result);
    }

    return result;
}

/**
 * Remove clause from query
 * - When and-clause: remove all phrases from and-clauses in query
 * - When not-clause: remove not-clause from query
 */
export function removeClause(
    toRemove: ISearchClause,
    query: ISearchClause[]
): ISearchClause[] {
    let result = [...query];
    if (toRemove.isAnd()) {
        toRemove.getPhrases().forEach(removePhrase);
    } else {
        result = result.filter(r => !r.equals(toRemove));
    }
    return result;

    function removePhrase(phrase: Phrase) {
        const containingClause = result.find(
            r => r.isAnd() && r.contains(phrase)
        );
        if (!containingClause) {
            return;
        }
        _.remove(result, containingClause);
        const multiplePhrases = containingClause.getPhrases().length > 1;
        if (multiplePhrases) {
            const otherPhrases = containingClause
                .getPhrases()
                .filter(p => !areEqualPhrases(p, phrase));
            result.push(new AndSearchClause(otherPhrases));
        }
    }
}

/**
 * Find 'inverse' clause which contains phrase of needle
 * And-clause is 'inverse' or 'opposite' of not-clause
 */
export function findInverseClause(
    needle: ISearchClause,
    haystack: ISearchClause[]
): ISearchClause | undefined {
    if (needle.isAnd()) {
        return haystack.find(
            not => not.isNot() && needle.contains(not.getPhrases()[0])
        );
    } else {
        // Needle is not-clause:
        return haystack.find(
            and => and.isAnd() && and.contains(needle.getPhrases()[0])
        );
    }
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

export function toQueryString(query: ISearchClause[]): string {
    return query.map(c => c.toString()).join(' ');
}
