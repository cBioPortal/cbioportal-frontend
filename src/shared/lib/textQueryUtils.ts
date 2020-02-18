export type SearchClause = { type: 'not'; data: string } | { type: 'and'; data: string[] };

export type SearchResult = { match: boolean; forced: boolean };

export function parse_search_query(query: string): SearchClause[] {
    // First eliminate trailing whitespace and reduce every whitespace
    //	to a single space.
    query = query
        .toLowerCase()
        .trim()
        .split(/\s+/g)
        .join(' ');
    // Now factor out quotation marks and inter-token spaces
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
    // Now get the conjunctive clauses, and the negative clauses
    let clauses: SearchClause[] = [];
    currInd = 0;
    let nextOr, nextDash;
    while (currInd < phrases.length) {
        if (phrases[currInd] === '-') {
            if (currInd < phrases.length - 1) {
                clauses.push({ type: 'not', data: phrases[currInd + 1] });
            }
            currInd = currInd + 2;
        } else {
            nextOr = phrases.indexOf('or', currInd);
            nextDash = phrases.indexOf('-', currInd);
            if (nextOr === -1 && nextDash === -1) {
                clauses.push({ type: 'and', data: phrases.slice(currInd) });
                currInd = phrases.length;
            } else if (nextOr === -1 && nextDash > 0) {
                clauses.push({
                    type: 'and',
                    data: phrases.slice(currInd, nextDash),
                });
                currInd = nextDash;
            } else if (nextOr > 0 && nextDash === -1) {
                clauses.push({
                    type: 'and',
                    data: phrases.slice(currInd, nextOr),
                });
                currInd = nextOr + 1;
            } else {
                if (nextOr < nextDash) {
                    clauses.push({
                        type: 'and',
                        data: phrases.slice(currInd, nextOr),
                    });
                    currInd = nextOr + 1;
                } else {
                    clauses.push({
                        type: 'and',
                        data: phrases.slice(currInd, nextDash),
                    });
                    currInd = nextDash;
                }
            }
        }
    }
    return clauses;
}

export function matchPhrase(phrase: string, fullText: string) {
    return fullText.toLowerCase().indexOf(phrase.toLowerCase()) > -1;
}

export function perform_search_single(parsed_query: SearchClause[], item: string): SearchResult;
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
