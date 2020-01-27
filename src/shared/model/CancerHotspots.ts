import { IHotspotIndex } from 'react-mutation-mapper';

export interface IHotspotDataWrapper {
    status: 'pending' | 'error' | 'complete';
    result?: IHotspotIndex;
}
