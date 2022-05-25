import { CancerStudy } from "cbioportal-ts-api-client";
import {CancerTreeNode, CancerTypeWithVisibility, NodeMetadata} from "shared/components/query/CancerStudyTreeData";

export enum SearchClauseType {
    NOT = 'not',
    AND = 'and'
}

type CancerTreeNodeFields = keyof CancerTypeWithVisibility | keyof CancerStudy;

export type SearchClause =
    {
        type: SearchClauseType.NOT;
        data: string;
        fields: CancerTreeNodeFields[];
    } |
    {
        type: SearchClauseType.AND;
        data: AndData[]
    }
    ;

type AndData = {
    phrase: string;
    fields: CancerTreeNodeFields[]
};

export const defaultSearchFields: CancerTreeNodeFields[] = ['name', 'description', 'studyId'];

/**
 * This field can be extended with additional filters
 */
export const phrasesToSearchFields: {[type: string]: CancerTreeNodeFields[]} = {
    'reference-genome': ['referenceGenome']
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
 * Create conjunctive, negative and reference genome clauses
 */
function createClauses(phrases: string[]): SearchClause[] {
    const clauses: SearchClause[] = [];
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
    clauses: SearchClause[]
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

function parsePhrase(data: string) {
    const parts: string[] = data.split(':');
    let phrase: string;
    let fields: CancerTreeNodeFields[];
    if (parts.length === 2 && phrasesToSearchFields[parts[0]]) {
        phrase = parts[1];
        fields = phrasesToSearchFields[parts[0]];
    } else {
        phrase = parts[0];
        fields = defaultSearchFields;
    }
    return {phrase, fields};
}

function createNotClause(data: string): SearchClause {
    const {phrase, fields} = parsePhrase(data);
    return { data: phrase, type: SearchClauseType.NOT, fields };
}

function createAndClause(phrases: string[]): SearchClause {
    const data: AndData[] = [];
    for(const phrase of phrases) {
        data.push(parsePhrase(phrase));
    }
    return { data, type: SearchClauseType.AND };
}

export function matchPhrase(phrase: string, fullText: string) {
    return fullText.toLowerCase().indexOf(phrase.toLowerCase()) > -1;
}

export function matchPhraseInFields(
    phrase: string,
    study: CancerTreeNode,
    fields: CancerTreeNodeFields[]
): boolean {
    let anyFieldMatch = false;
    for (const fieldName of fields) {
        let fieldMatch = false;
        const studyElement = (study as any)[fieldName];
        if (studyElement) {
            fieldMatch = matchPhrase(phrase, studyElement)
        }
        anyFieldMatch = anyFieldMatch || fieldMatch;
    }
    return anyFieldMatch;
}

/**
 * @returns {boolean} true if the query, considering quotation marks, 'and' and 'or' logic, matches
 */
export function performSearchSingle(
    parsedQuery: SearchClause[],
    study: CancerTreeNode
) {
    let match = false;
    let hasPositiveClauseType = false;
    let forced = false;

    for (const clause of parsedQuery) {
        if (clause.type !== SearchClauseType.NOT) {
            hasPositiveClauseType = true;
            break;
        }
    }
    if (!hasPositiveClauseType) {
        // if only negative clauses, match by default
        match = true;
    }
    for (const clause of parsedQuery) {
        if (clause.type === SearchClauseType.NOT) {
            if (matchPhraseInFields(clause.data, study, clause.fields)) {
                match = false;
                forced = true;
                break;
            }
        } else if(clause.type === SearchClauseType.AND) {
            let clauseMatch = true;
            for (const phrase of clause.data) {
                clauseMatch = clauseMatch && matchPhraseInFields(phrase.phrase, study, phrase.fields);
            }
            match = match || clauseMatch;
        }
    }
    return { match, forced };
}
