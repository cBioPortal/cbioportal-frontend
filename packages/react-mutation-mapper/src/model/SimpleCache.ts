import { RemoteDataStatus } from './RemoteData';

export interface ICacheData<T = any> {
    status: RemoteDataStatus;
    data?: T;
}
export interface ICache<T = any> {
    [queryId: string]: ICacheData<T>;
}

export interface SimpleCache<T = any, Q = any> {
    getData(ids: string[], query: Q): ICache<T>;
}
