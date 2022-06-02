import {
    areEqualPhrases,
    CancerTreeNodeFields,
} from 'shared/lib/textQueryUtils';
import _ from 'lodash';

/**
 * Phrase string and associated fields
 */
export type Phrase = {
    readonly phrase: string;

    readonly fields: CancerTreeNodeFields[];

    /**
     * Phrase as entered in search box, including its prefix
     */
    readonly textRepresentation: string;
};

export type SearchResult = {
    match: boolean;
    forced: boolean;
};

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

export class NotSearchClause implements ISearchClause {
    private readonly phrase: Phrase;

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
        if (!this.phrase) {
            return '';
        }
        return `- ${this.phrase.textRepresentation}`;
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

export class AndSearchClause implements ISearchClause {
    private readonly phrases: Phrase[];

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
        if (!this.phrases.length) {
            return '';
        }
        return this.phrases.map(p => p.textRepresentation).join(' ');
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
