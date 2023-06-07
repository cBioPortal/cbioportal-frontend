import React, { useState, useEffect } from 'react';
import Tour from 'reactour';

import './styles.scss';

type Steps = Array<{
    selector: string; 
    content: () => any; 
    action?: (node: Element) => void; 
}>

type SetLockTour = (value: React.SetStateAction<boolean>) => void;
type SetGotoStep = (value: React.SetStateAction<number | null>) => void;
type GetStepsProps = {
    isLoggedIn: boolean, studies:number, setLockTour: SetLockTour, setGotoStep: SetGotoStep, endTour: () => void
}
export type GetSteps = (props: GetStepsProps) => Steps;

type TourProps = {
    title?: string;
    studies?: number;
    startAt?: number;
    hideEntry?: boolean;
    isLoggedIn?: boolean;
    localStorageId: string;
    getSteps: GetSteps;
};

export default function WebTour({
    title = '',
    studies = 0,
    startAt = 0,
    hideEntry = false,
    isLoggedIn = false,
    localStorageId,
    getSteps,
}: TourProps) {
    const [gotoStep, setGotoStep] = useState(null);
    const [isOpen, setIsOpen] = useState(startAt > 0 ? true : false);
    const [lockTour, setLockTour] = useState(false);

    const startTour = () => {
        if (hideEntry) return;
        setIsOpen(true);
    };

    const endTour = () => {
        setIsOpen(false);
        const currentStep = localStorage.getItem(localStorageId);
        if (currentStep) localStorage.removeItem(localStorageId);
    };

    // when return to the homepage, the tour should be continued
    useEffect(() => {
        if (startAt > 0 && !isOpen) setIsOpen(true);
    }, [startAt])

    return (
        <div className="interactive-tour" onClick={startTour}>
            {hideEntry ? '' : title}
            <Tour
                rounded={5}
                closeWithMask
                isOpen={isOpen}
                startAt={startAt}
                goToStep={gotoStep}
                showNumber={false}
                showNavigation={false}
                showButtons={!lockTour}
                showNavigationNumber={false}
                onRequestClose={endTour}
                steps={getSteps({ isLoggedIn, studies, setLockTour, setGotoStep, endTour })}
                lastStepNextButton={<button onClick={endTour}>Done! Finish guidance.</button>}
            />
        </div>
    );
}
