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
    let currInd = 0;
    while (currInd < phrases.length) {
        if (phrases[currInd].startsWith(SearchClauseType.REFERENCE_GENOME)) {
            currInd = addRefGenomeClause(currInd, phrases, clauses);
        } else if (phrases[currInd] === '-') {
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
function addRefGenomeClause(
    currInd: number,
    phrases: string[],
    clauses: SearchClause[]
): number {
    if (currInd < phrases.length) {
        clauses.push(referenceGenomeClause(phrases[currInd]));
    }
    return currInd + 1;
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

export function perform_search_single(
    parsed_query: SearchClause[],
    item: string
): SearchResult;
export function perform_search_single<T>(
    parsed_query: SearchClause[],
    item: T,
    matcher: (phrase: string, item: T) => boolean
): SearchResult;
export function perform_search_single<T>(
    parsed_query: SearchClause[],
    item: T,
    matcher?: (phrase: string, item: T) => boolean
) {
    if (!matcher) matcher = matchPhrase as any;

    // return true iff the query, considering quotation marks, 'and' and 'or' logic, matches
    let match = false;
    let hasPositiveClauseType = false;
    let forced = false;

    for (let clause of parsed_query) {
        if (clause.type !== 'not') {
            hasPositiveClauseType = true;
            break;
        }
    }
    if (!hasPositiveClauseType) {
        // if only negative clauses, match by default
        match = true;
    }
    for (let clause of parsed_query) {
        if (clause.type === 'not') {
            if (matcher!(clause.data, item)) {
                match = false;
                forced = true;
                break;
            }
        } else if (clause.type === 'and') {
            hasPositiveClauseType = true;
            let clauseMatch = true;
            for (let phrase of clause.data) {
                clauseMatch = clauseMatch && matcher!(phrase, item);
            }
            match = match || clauseMatch;
        }
    }
    return { match, forced };
}
