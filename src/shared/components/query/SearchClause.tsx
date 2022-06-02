import { CancerTreeNodeFields } from 'shared/lib/textQueryUtils';

export type SearchClause = NotClause | AndClause;

export enum SearchClauseType {
    NOT = 'not',
    AND = 'and',
}

export type NotClause = {
    readonly type: SearchClauseType.NOT;
} & ClauseData;

export type AndClause = {
    readonly type: SearchClauseType.AND;
    data: ClauseData[];
    textRepresentation: string;
};

export type ClauseData = {
    readonly phrase: string;
    readonly fields: CancerTreeNodeFields[];
    textRepresentation: string;
};

export type FindClauseBy = {
    phrase: string;
    fields: CancerTreeNodeFields[];
};

export type SearchResult = {
    match: boolean;
    forced: boolean;
};

export interface ISearchClause {
    isNot(): boolean;
    isAnd(): boolean;
    toString(): string;
    remove(item: FindClauseBy): void;
    contains(item: FindClauseBy): void;
}
