import { DataFilter } from '../model/DataFilter';
import { Mutation } from '../model/Mutation';

export type MutationFilterValue = {
    [field in keyof Mutation]: string;
};

export type MutationFilter = DataFilter<MutationFilterValue>;
