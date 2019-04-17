import { CosmicMutation } from 'shared/api/generated/CBioPortalAPIInternal';

export interface ICosmicData {
    [keyword: string]: CosmicMutation[];
}
