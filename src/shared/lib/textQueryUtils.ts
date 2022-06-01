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
    FilterText,
} from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';

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

export const defaultSearchFilter: CancerTreeSearchFilter = {
    phrasePrefix: undefined,
    nodeFields: defaultNodeFields,
    form: {
        input: FilterText,
        label: 'search terms',
    },
};

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

export enum SearchClauseType {
    NOT = 'not',
    AND = 'and',
}

export type SearchClause = NotClause | AndClause;

export type NotClause = {
    readonly type: SearchClauseType.NOT;
} & ClauseData;

export type AndClause = {
    readonly type: SearchClauseType.AND;
    readonly data: ClauseData[];
    readonly textRepresentation: string;
};

export type ClauseData = {
    readonly phrase: string;
    readonly fields: CancerTreeNodeFields[];
    readonly textRepresentation: string;
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

type Parsed = {
    phrase: string;
    fields: CancerTreeNodeFields[];
};

function parsePhrase(data: string): Parsed {
    const parts: string[] = data.split(':');
    let phrase: string;
    let fields: CancerTreeNodeFields[];
    let filter = searchFilters.find(sf => sf.phrasePrefix === parts[0]);
    if (parts.length === 2 && filter?.nodeFields) {
        phrase = parts[1];
        fields = filter.nodeFields;
    } else {
        phrase = parts[0];
        fields = defaultSearchFilter.nodeFields;
    }
    return { phrase, fields };
}

function createNotClause(data: string): SearchClause {
    const { phrase, fields } = parsePhrase(data);
    const type = SearchClauseType.NOT;
    let textRepresentation = `- ${enquoteSpaces(data)}`;
    return {
        type,
        phrase,
        fields,
        textRepresentation,
    };
}

function createAndClause(phrases: string[]): SearchClause {
    const data: ClauseData[] = [];
    for (const phrase of phrases) {
        const parsedData = parsePhrase(phrase);
        // TODO: parsed should also return textRepresentation
        //  --> AndData should something like ClauseData
        data.push({ ...parsedData, textRepresentation: enquoteSpaces(phrase) });
    }
    const type = SearchClauseType.AND;
    return {
        type,
        data,
        textRepresentation: data.map(d => d.textRepresentation).join(' '),
    };
}

function enquoteSpaces(data: string) {
    return data.includes(' ') ? `"${data}"` : data;
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
 * @returns {boolean} true if the query, considering quotation marks, 'and' and 'or' logic, matches
 */
export function performSearchSingle(
    parsedQuery: SearchClause[],
    study: CancerTreeNode
): MatchResult {
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
            if (matchPhraseInFields(clause.phrase, study, clause.fields)) {
                match = false;
                forced = true;
                break;
            }
        } else if (clause.type === SearchClauseType.AND) {
            let clauseMatch = true;
            for (const phrase of clause.data) {
                clauseMatch =
                    clauseMatch &&
                    matchPhraseInFields(phrase.phrase, study, phrase.fields);
            }
            match = match || clauseMatch;
        }
    }
    return { match, forced };
}
