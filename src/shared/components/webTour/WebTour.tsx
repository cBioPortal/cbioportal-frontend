import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import React, { Component } from 'react';
import Tour from 'reactour';
import './tour.scss';

const TourContext = React.createContext<any>(null);

interface Props {
    config: { selector: string; content: () => JSX.Element }[];
}

export const TourProvider: React.FC<Props> = observer(
    ({ children, config }) => {
        const TourStore = useLocalObservable(() => ({
            isTourActive: false,
            closeTour() {
                this.isTourActive = false;
            },
            openTour() {
                this.isTourActive = true;
            },
        }));
        const isTourActive = TourStore.isTourActive;
        const { openTour, closeTour } = TourStore;
        const accentColor = '#3786C2';
        return (
            <>
                {TourStore.isTourActive}
                <TourContext.Provider
                    value={{
                        isTourActive,
                        closeTour,
                        openTour,
                    }}
                >
                    {children}
                    <Tour
                        onRequestClose={closeTour}
                        steps={config}
                        isOpen={isTourActive}
                        maskClassName="mask"
                        className="helper"
                        rounded={5}
                        accentColor={accentColor}
                        // onAfterOpen={this.disableBody}
                        // onBeforeClose={this.enableBody}
                    />
                </TourContext.Provider>
            </>
        );
    }
);

export default TourContext;
