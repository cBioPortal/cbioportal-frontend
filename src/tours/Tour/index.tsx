import React, { useEffect, useState } from 'react';
import Tour from 'reactour';

import './styles.scss';

const steps = [
    // Step 0
    {
        selector: '#cancer-study-search-box input',
        content: () => (
            <div className="step">
                Use the search box to find the studies of interest.
                <p>For example, type in 'glioma'.</p>
            </div>
        ),
        action: (node: Element) => {
            node.setAttribute('value', 'glioma');
            node.dispatchEvent(new Event('input', { bubbles: true }));
        },
    },
    // Step 1
    {
        selector: '#cancer-study-list-container',
        content: () => (
            <div className="step">Select two studies of interest.</div>
        ),
    },
    // Step 2
    {
        selector: '#explore-studies-button',
        content: () => (
            <div className="step">Click “Explore Selected Studies”.</div>
        ),
        action: () => {
            localStorage.setItem('current-step', '3');
        }
    },
    // Step 3
    {
        selector: '#show-more-description-icon',
        content: () => (
            <div className="step">
                Click on the “+” icon to see the list of studies.
            </div>
        )
    },
    // Step 4
    {
        selector: '#mutated-genes-table',
        content: () => (
            <div className="step">
                In the Mutated Genes table, Click the check box in the “#” column to select samples with one more mutation, and then click the “Select Samples” button at the bottom of the table.
            </div>
        )
    },
    // Step 5
    {
        selector: '#action-button-bookmark',
        content: () => (
            <div className="step">
                Click the bookmark icon to create and share your virtual study.
            </div>
        ),
        // action: (node: any) => {
        //     setLockTour(true)
        //     node.onclick(() => {
        //         setLockTour(false)
        //     })
        // }
    },
];

export function checkForTour() {
    const currentStep = localStorage.getItem('current-step');
    if (currentStep) {
        localStorage.removeItem('current-step')
        return +currentStep;
    }
    return null;
}

type TourProps = { studies?: number, hideEntry?: boolean, startAt?: number }
export default function HomePageTour({ studies = 0, hideEntry = false, startAt = 0 }: TourProps) {
    const [step, setStep] = useState(startAt);
    const [isOpen, setIsOpen] = useState(startAt > 0 ? true: false);
    const [lockTour, setLockTour] = useState(false);

    const startTour = () => {
        if (hideEntry) return
        setIsOpen(true);
    }

    const endTour = () => {
        setIsOpen(false);
        const currentStep = localStorage.getItem('current-step');
        if (currentStep) localStorage.removeItem('current-step');
    }

    const getCurrentStep = (step: number) => setStep(step);

    const checkStep1 = () => {
        setLockTour(true);
        if (studies > 1) {
            setLockTour(false);
        }
    };

    const checkStep2 = () => {
        setLockTour(true);
    }

    useEffect(() => {
        if (step === 1) checkStep1();
        if (step === 2) checkStep2();
        // if (step === 4) checkStep4(); one more samples selected
        // if (step === 5) checkStep5(); panel is open
    }, [studies, step]);

    return (
        <div className="interactive-tour" onClick={startTour}>
            {hideEntry ? '' : 'Create a Virtual Study'}
            <Tour
                rounded={5}
                closeWithMask
                showNumber={false}
                showNavigation={false}
                showNavigationNumber={false}
                showButtons={!lockTour}
                steps={steps}
                isOpen={isOpen}
                startAt={startAt}
                onRequestClose={endTour}
                getCurrentStep={getCurrentStep}
                lastStepNextButton={<button>Done! Finish guidance.</button>}
            />
        </div>
    );
}
