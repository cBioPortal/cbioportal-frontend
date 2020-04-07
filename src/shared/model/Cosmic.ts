import { CosmicMutation } from 'cbioportal-ts-api-client';

export interface ICosmicData {
    [keyword: string]: CosmicMutation[];
}
