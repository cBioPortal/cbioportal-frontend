import {
    areEqualPhrases,
    CancerTreeNodeFields,
} from 'shared/lib/query/textQueryUtils';
import _ from 'lodash';

export interface ISearchClause {
    isNot(): boolean;
    isAnd(): boolean;
    toString(): string;
    equals(item: ISearchClause): boolean;

    /**
     * check clause contains phrase using:
     * - {@link Phrase}
     * - or a predicate function
     */
    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean;

    /**
     * @returns {phrases}
     *
     *  - not-clause returns one phrase
     *  - and-clause returns one or more phrases
     */
    getPhrases(): Phrase[];
}

/**
 * Negative clause
 * contains single phrase
 */
export class NotSearchClause implements ISearchClause {
    private readonly phrase: Phrase;
    private readonly type = 'not';

    constructor(phrase: Phrase) {
        this.phrase = phrase;
    }

    getPhrases(): Phrase[] {
        return [this.phrase];
    }

    isAnd(): boolean {
        return false;
    }

    isNot(): boolean {
        return true;
    }

    toString(): string {
        return this.phrase ? `- ${this.phrase.textRepresentation}` : '';
    }

    equals(item: ISearchClause): boolean {
        if (item.isAnd()) {
            return false;
        }
        return item.contains(this.phrase);
    }

    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean {
        if (!match) {
            return !this.phrase;
        }
        if (_.isFunction(match)) {
            return match(this.phrase);
        }
        return areEqualPhrases(this.phrase, match);
    }
}

/**
 * Conjunctive clause
 * consists of multiple phrases which all must match
 */
export class AndSearchClause implements ISearchClause {
    private readonly phrases: Phrase[];
    private readonly type = 'and';

    constructor(phrases: Phrase[]) {
        this.phrases = phrases;
    }

    getPhrases(): Phrase[] {
        return this.phrases;
    }

    isAnd(): boolean {
        return true;
    }

    isNot(): boolean {
        return false;
    }

    toString(): string {
        return this.phrases.length
            ? this.phrases.map(p => p.textRepresentation).join(' ')
            : '';
    }

    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean {
        if (!match) {
            return !this.phrases.length;
        }
        if (_.isFunction(match)) {
            for (const phrase of this.phrases) {
                if (match(phrase)) {
                    return true;
                }
            }
            return false;
        }

        for (const phrase of this.phrases) {
            if (areEqualPhrases(phrase, match)) {
                return true;
            }
        }
        return false;
    }

    equals(item: ISearchClause): boolean {
        if (item.isNot()) {
            return false;
        }
        let itemPhrases = (item as AndSearchClause).phrases;
        let containsAll = true;
        for (const itemPhrase of this.phrases) {
            containsAll = containsAll && item.contains(itemPhrase);
        }
        for (const itemPhrase of itemPhrases) {
            containsAll = containsAll && this.contains(itemPhrase);
        }
        return containsAll;
    }
}

/**
 * Phrase string and associated fields
 */
export type Phrase = {
    /**
     * Phrase as shown in search box, including its prefix
     */
    readonly textRepresentation: string;

    readonly phrase: string;

    readonly fields: CancerTreeNodeFields[];
};

export type SearchResult = {
    match: boolean;
    forced: boolean;
};

export type QueryUpdate = {
    toAdd?: ISearchClause[];

    /**
     * Remove phrases, ignoring the type of their containing Clause
     * to prevent conflicting clauses
     */
    toRemove?: Phrase[];
};
