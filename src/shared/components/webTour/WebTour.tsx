import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import React, { Component } from 'react';
import Tour from 'reactour';
import './tour.scss';

const TourContext = React.createContext<any>(null);

interface Props {
    config: {
        selector: string;

        content: ({ goTo }: any) => JSX.Element;
    }[];
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
            currStep: 0,
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
                        getCurrentStep={(curr: number) => {
                            TourStore.currStep = curr;
                            console.log(TourStore.currStep);
                        }}
                        accentColor={accentColor}
                        nextButton={
                            <button
                                style={{ display: 'none' }}
                                id="_tour_next_btn"
                            ></button>
                        }
                        // onAfterOpen={this.disableBody}
                        // onBeforeClose={this.enableBody}
                    />
                </TourContext.Provider>
            </>
        );
    }
);

export default TourContext;
