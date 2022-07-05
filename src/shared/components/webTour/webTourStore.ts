import { observable } from 'mobx';
import { createContext } from 'react';

class TourStore {
    @observable isTourActive = false;
    @observable closeTour = () => {
        this.isTourActive = false;
    };
    @observable openTour = () => {
        this.isTourActive = true;
    };
}

export const TourStoreContext = createContext(new TourStore());
