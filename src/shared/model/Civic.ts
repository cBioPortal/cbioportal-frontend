import { ICivicGene, ICivicVariant } from 'react-mutation-mapper';

export type MobXStatus = 'pending' | 'error' | 'complete';

export interface ICivicGeneDataWrapper {
    status: MobXStatus;
    result?: ICivicGene;
}

export interface ICivicVariantDataWrapper {
    status: MobXStatus;
    result?: ICivicVariant;
}
