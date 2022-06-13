import {
    CancerTreeNodeFields,
    CancerTreeSearchFilter,
    defaultNodeFields,
} from 'shared/lib/query/textQueryUtils';
import {
    AndSearchClause,
    ISearchClause,
    NotSearchClause,
    Phrase,
} from 'shared/components/query/SearchClause';
import { FilterCheckbox } from 'shared/components/query/filteredSearch/CheckboxFilterField';
import { FilterList } from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';
import { getServerConfig, ServerConfigHelpers } from 'config/config';

export class QueryParser {
    /**
     * Can be extended with additional search filters
     */
    private readonly _searchFilters: CancerTreeSearchFilter[];

    constructor() {
        this._searchFilters = [
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
    }

    get searchFilters(): CancerTreeSearchFilter[] {
        return this._searchFilters;
    }

    public parseSearchQuery(query: string): ISearchClause[] {
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
    private createClauses(phrases: string[]): ISearchClause[] {
        const clauses: ISearchClause[] = [];
        let currInd = 0;
        while (currInd < phrases.length) {
            if (phrases[currInd] === '-') {
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
        clauses: ISearchClause[]
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
        clauses: ISearchClause[]
    ): number {
        let nextOr = phrases.indexOf('or', currInd);
        let nextDash = phrases.indexOf('-', currInd);
        if (nextOr === -1 && nextDash === -1) {
            clauses.push(this.createAndClause(phrases.slice(currInd)));
            return phrases.length;
        } else if (nextOr === -1 && nextDash > 0) {
            clauses.push(
                this.createAndClause(phrases.slice(currInd, nextDash))
            );
            return nextDash;
        } else if (nextOr > 0 && nextDash === -1) {
            clauses.push(this.createAndClause(phrases.slice(currInd, nextOr)));
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

    private parsePhrase(data: string): Phrase {
        const parts: string[] = data.split(':');
        let phrase: string;
        let fields: CancerTreeNodeFields[];
        let filter = this._searchFilters.find(
            sf => sf.phrasePrefix === parts[0]
        );
        if (parts.length === 2 && filter?.nodeFields) {
            phrase = parts[1];
            fields = filter.nodeFields;
        } else {
            phrase = parts[0];
            fields = defaultNodeFields;
        }
        return { phrase, fields, textRepresentation: this.enquoteSpaces(data) };
    }

    private createNotClause(data: string): ISearchClause {
        const { phrase, fields } = this.parsePhrase(data);
        let textRepresentation = this.enquoteSpaces(data);
        return new NotSearchClause({ phrase, textRepresentation, fields });
    }

    private createAndClause(phrases: string[]): ISearchClause {
        const data: Phrase[] = [];
        for (const phrase of phrases) {
            const parsedData = this.parsePhrase(phrase);
            data.push(parsedData);
        }
        return new AndSearchClause(data);
    }

    public enquoteSpaces(data: string) {
        return data.includes(' ') ? `"${data}"` : data;
    }
}

export type MatchResult = {
    match: boolean;
    forced: boolean;
};
