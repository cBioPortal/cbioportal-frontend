import { CancerStudy } from "cbioportal-ts-api-client";
import {CancerTreeNode, NodeMetadata} from "shared/components/query/CancerStudyTreeData";

export enum SearchClauseType {
    NOT = 'not',
    AND = 'and',
    REFERENCE_GENOME = 'reference-genome',
}

export type SearchClause =
    | {
          type: SearchClauseType.NOT;
          data: string;
          field: 'searchTerms';
      }
    | {
          type: SearchClauseType.AND;
          data: string[];
          field: 'searchTerms';
      }
    | {
          type: SearchClauseType.REFERENCE_GENOME;
          data: string;
          field: 'referenceGenome';
      };

export type SearchResult = {
    match: boolean;
    forced: boolean;
};

export function parseSearchQuery(query: string): SearchClause[] {
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
function createPhrases(query: string) {
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
 * Create conjunctive, negative and reference genome clauses
 */
function createClauses(phrases: string[]) {

    const clauses: SearchClause[] = [];

    const refGenPhrases = phrases.filter(p => p.startsWith('reference-genome:'));
    phrases = phrases.filter(p => !p.startsWith('reference-genome:'));

    for (const p of refGenPhrases) {
        clauses.push(referenceGenomeClause(p));
    }

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
    clauses: SearchClause[]
): number {
    if (currInd < phrases.length - 1) {
        clauses.push(notClause(phrases[currInd + 1]));
    }
    return currInd + 2;
}

/**
 * @returns {number} next index
 */
function addAndClause(
    phrases: string[],
    currInd: number,
    clauses: SearchClause[]
): number {
    let nextOr = phrases.indexOf('or', currInd);
    let nextDash = phrases.indexOf('-', currInd);
    if (nextOr === -1 && nextDash === -1) {
        clauses.push(andClause(phrases.slice(currInd)));
        return phrases.length;
    } else if (nextOr === -1 && nextDash > 0) {
        clauses.push(andClause(phrases.slice(currInd, nextDash)));
        return nextDash;
    } else if (nextOr > 0 && nextDash === -1) {
        clauses.push(andClause(phrases.slice(currInd, nextOr)));
        return nextOr + 1;
    } else {
        if (nextOr < nextDash) {
            clauses.push(andClause(phrases.slice(currInd, nextOr)));
            return nextOr + 1;
        } else {
            clauses.push(andClause(phrases.slice(currInd, nextDash)));
            return nextDash;
        }
    }
}

function notClause(data: string): SearchClause {
    return { data, type: SearchClauseType.NOT, field: 'searchTerms' };
}

function andClause(data: string[]): SearchClause {
    return { data, type: SearchClauseType.AND, field: 'searchTerms' };
}

function referenceGenomeClause(data: string): SearchClause {
    return {
        data: data.split(':')[1],
        type: SearchClauseType.REFERENCE_GENOME,
        field: 'referenceGenome',
    };
}

export function matchPhrase(phrase: string, fullText: string) {
    return fullText.toLowerCase().indexOf(phrase.toLowerCase()) > -1;
}

/**
 * @returns {boolean} true if the query, considering quotation marks, 'and' and 'or' logic, matches
 */
export function performSearchSingle(
    parsed_query: SearchClause[],
    [study, meta]: [CancerTreeNode, NodeMetadata]
) {
    let match = false;
    let hasPositiveClauseType = false;
    let forced = false;

    for (let clause of parsed_query) {
        if (clause.type !== SearchClauseType.NOT) {
            hasPositiveClauseType = true;
            break;
        }
    }
    if (!hasPositiveClauseType) {
        // if only negative clauses, match by default
        match = true;
    }
    clauseLoop: for (let clause of parsed_query) {
        switch (clause.type) {
            case SearchClauseType.NOT:
                if (matchPhrase(clause.data, meta.searchTerms)) {
                    match = false;
                    forced = true;
                    break clauseLoop;
                } else {
                    break;
                }
            case SearchClauseType.AND:
                let clauseMatch = true;
                for (let phrase of clause.data) {
                    clauseMatch = clauseMatch && matchPhrase(phrase, meta.searchTerms);
                }
                match = match || clauseMatch;
                break;
            case SearchClauseType.REFERENCE_GENOME:
                const referenceGenome = (study as CancerStudy).referenceGenome;
                match = !!referenceGenome && referenceGenome === clause.data;
                break;
            default:
                throw new Error('SearchClauseType missing');
        }
    }
    return { match, forced };
}
