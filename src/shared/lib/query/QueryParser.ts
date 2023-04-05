import {
    CancerTreeNodeFields,
    CancerTreeSearchFilter,
    defaultNodeFields,
} from 'shared/lib/query/textQueryUtils';
import {
    AndSearchClause,
    FILTER_SEPARATOR,
    NOT_PREFIX,
    NotSearchClause,
    SearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import { FilterCheckbox } from 'shared/components/query/filteredSearch/field/CheckboxFilterField';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import { FilterList } from 'shared/components/query/filteredSearch/field/ListFormField';
import {
    DefaultPhrase,
    ListPhrase,
    Phrase,
} from 'shared/components/query/filteredSearch/Phrase';
import { toFilterFieldOption } from 'shared/components/query/filteredSearch/field/FilterFieldOption';

export class QueryParser {
    /**
     * Can be extended with additional search filters
     */
    private readonly _searchFilters: CancerTreeSearchFilter[];

    constructor(referenceGenomes: Set<string>, readPermissions: Set<string>) {
        console.log('readPermissions');
        console.log(readPermissions);
        console.log(readPermissions.size);
        this._searchFilters = [
            /**
             * Example queries:
             */
            {
                phrasePrefix: undefined,
                nodeFields: defaultNodeFields,
                form: {
                    label: 'Example queries',
                    input: FilterList,
                    options: ServerConfigHelpers.skin_example_study_queries(
                        getServerConfig()!.skin_example_study_queries || ''
                    ).map(toFilterFieldOption),
                },
            },
            /**
             * Reference genome:
             */
            {
                phrasePrefix: 'reference-genome',
                nodeFields: ['referenceGenome'],
                form: {
                    input: FilterCheckbox,
                    options: [...referenceGenomes].map(toFilterFieldOption),
                    label: 'Reference genome',
                },
            },
            /**
             * Show Authorized Studies
             */
            {
                phrasePrefix: 'authorized',
                nodeFields: ['readPermission'],
                form: {
                    input: FilterCheckbox,
                    options: readPermissions.size > 1 ? [
                        { value: 'true', displayValue: 'Authorized' },
                        { value: 'false', displayValue: 'Unauthorized' },
                    ]:[],
                    label: 'Controlled access',
                },
            },
        ];
    }

    get searchFilters(): CancerTreeSearchFilter[] {
        return this._searchFilters;
    }

    public parseSearchQuery(query: string): SearchClause[] {
        query = QueryParser.cleanUpQuery(query);
        const phrases = QueryParser.createPhrases(query);
        return this.createClauses(phrases);
    }

    /**
     * Eliminate trailing whitespace
     * and reduce every whitespace to a single space.
     */
    private static cleanUpQuery(query: string) {
        return query
            .toLowerCase()
            .trim()
            .split(/\s+/g)
            .join(' ');
    }

    /**
     * Factor out quotation marks and inter-token spaces
     */
    private static createPhrases(query: string): string[] {
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
            } else if (query[currInd] === NOT_PREFIX) {
                phrases.push(NOT_PREFIX);
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
    private createClauses(phrases: string[]): SearchClause[] {
        const clauses: SearchClause[] = [];
        let currInd = 0;
        while (currInd < phrases.length) {
            if (phrases[currInd] === NOT_PREFIX) {
                currInd = this.addNotClause(currInd, phrases, clauses);
            } else {
                currInd = this.addAndClause(phrases, currInd, clauses);
            }
        }
        return clauses;
    }

    /**
     * @returns {number} next index
     **/
    private addNotClause(
        currInd: number,
        phrases: string[],
        clauses: SearchClause[]
    ): number {
        if (currInd < phrases.length - 1) {
            clauses.push(this.createNotClause(phrases[currInd + 1]));
        }
        return currInd + 2;
    }

    /**
     * @returns {number} next index
     */
    private addAndClause(
        phrases: string[],
        currInd: number,
        clauses: SearchClause[]
    ): number {
        let nextOr = phrases.indexOf('or', currInd);
        let nextDash = phrases.indexOf(NOT_PREFIX, currInd);
        if (nextOr === -1 && nextDash === -1) {
            clauses.push(this.createAndClause(phrases.slice(currInd)));
            return phrases.length;
        } else if (nextOr === -1 && nextDash > 0) {
            clauses.push(
                this.createAndClause(phrases.slice(currInd, nextDash))
            );
            return nextDash;
        } else if (nextOr >= 0 && nextDash === -1) {
            if (nextOr === phrases.length - 1) {
                // When query ends with 'or', interpret 'or' as a phrase:
                clauses.push(
                    this.createAndClause(phrases.slice(currInd, nextOr + 1))
                );
            } else {
                // When 'or' is between phrases, interpret 'or' as separator of and-clauses:
                clauses.push(
                    this.createAndClause(phrases.slice(currInd, nextOr))
                );
            }
            return nextOr + 1;
        } else {
            if (nextOr < nextDash) {
                clauses.push(
                    this.createAndClause(phrases.slice(currInd, nextOr))
                );
                return nextOr + 1;
            } else {
                clauses.push(
                    this.createAndClause(phrases.slice(currInd, nextDash))
                );
                return nextDash;
            }
        }
    }

    private createPhrase(data: string): Phrase {
        const parts: string[] = data.split(FILTER_SEPARATOR);
        let phrase: string;
        let fields: CancerTreeNodeFields[];
        let filter = this._searchFilters.find(
            sf => sf.phrasePrefix === parts[0]
        );
        if (parts.length === 2 && filter?.nodeFields) {
            phrase = parts[1];
            fields = filter.nodeFields;
            return new ListPhrase(phrase, this.enquoteSpaces(data), fields);
        } else {
            phrase = parts[0];
            fields = defaultNodeFields;
            return new DefaultPhrase(phrase, this.enquoteSpaces(data), fields);
        }
    }

    private createNotClause(data: string): SearchClause {
        const phrase = this.createPhrase(data);
        return new NotSearchClause(phrase);
    }

    private createAndClause(textualRepresentations: string[]): SearchClause {
        const phrases: Phrase[] = [];
        for (const tr of textualRepresentations) {
            const phrase = this.createPhrase(tr);
            phrases.push(phrase);
        }
        return new AndSearchClause(phrases);
    }

    public enquoteSpaces(data: string) {
        return data.includes(' ') ? `"${data}"` : data;
    }
}

export type MatchResult = {
    match: boolean;
    forced: boolean;
};
