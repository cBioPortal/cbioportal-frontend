import { CancerTreeNodeFields } from 'shared/lib/query/textQueryUtils';
import _ from 'lodash';
import { CancerTreeNode } from 'shared/components/query/CancerStudyTreeData';

export const FILTER_SEPARATOR = `:`;
export const NOT_PREFIX = `-`;

export interface ISearchClause {
    isNot(): boolean;
    isAnd(): boolean;
    toString(): string;
    equals(other: ISearchClause): boolean;

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
        return this.phrase ? `${NOT_PREFIX} ${this.phrase.toString()}` : '';
    }

    equals(other: ISearchClause): boolean {
        if (other.isAnd()) {
            return false;
        }
        return other.contains(this.phrase);
    }

    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean {
        if (!match) {
            return !this.phrase;
        }
        if (_.isFunction(match)) {
            return match(this.phrase);
        }
        return this.phrase.equals(match);
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
            ? this.phrases.map(p => p.toString()).join(' ')
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
            if (phrase.equals(match)) {
                return true;
            }
        }
        return false;
    }

    equals(other: ISearchClause): boolean {
        if (other.isNot()) {
            return false;
        }
        let itemPhrases = (other as AndSearchClause).phrases;
        let containsAll = true;
        for (const itemPhrase of this.phrases) {
            containsAll = containsAll && other.contains(itemPhrase);
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
export interface Phrase {
    phrase: string;
    toString(): string;
    match(study: CancerTreeNode): boolean;
    equals(other: Phrase): boolean;
}

export class DefaultPhrase implements Phrase {
    constructor(
        phrase: string,
        textRepresentation: string,
        fields: CancerTreeNodeFields[]
    ) {
        this.fields = fields;
        this._phrase = phrase;
        this._textRepresentation = textRepresentation;
    }

    protected readonly fields: CancerTreeNodeFields[];
    protected readonly _textRepresentation: string;
    private readonly _phrase: string;

    public get phrase() {
        return this._phrase;
    }

    public toString() {
        return this._textRepresentation;
    }

    public match(study: CancerTreeNode): boolean {
        let anyFieldMatch = false;
        for (const fieldName of this.fields) {
            let fieldMatch = false;
            const fieldValue = (study as any)[fieldName];
            if (fieldValue) {
                fieldMatch = matchPhrase(this.phrase, fieldValue);
            }
            anyFieldMatch = anyFieldMatch || fieldMatch;
        }
        return anyFieldMatch;
    }

    equals(other: Phrase): boolean {
        if (!other) {
            return false;
        }
        const o = other as DefaultPhrase;
        if (!o.phrase || !o.fields) {
            return false;
        }
        if (this.phrase !== o.phrase) {
            return false;
        }
        return _.isEqual(this.fields, o.fields);
    }
}

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

function matchPhrase(phrase: string, fullText: string) {
    return fullText.toLowerCase().indexOf(phrase.toLowerCase()) > -1;
}
