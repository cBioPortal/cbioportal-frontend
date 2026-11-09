import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import Tour from 'reactour';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { findAll, targetBox } from './targets';
import { navigationFor, tutorialSteps } from './steps';
import { Box, Target, TutorialScript, TutorialStep } from './types';
import tutorial1 from './tutorial1';
import '../Tour/styles.css';
import './styles.css';

/** ?web-tour=<id> starts a tutorial, on any page */
export const TUTORIAL_TOURS: { [id: string]: TutorialScript } = {
    tutorial1,
};
const TOUR_URL_PARAM = 'web-tour';
const STORAGE_KEY = 'web-tour-tutorial';
// a tour left open resumes on the next page load (or in a tab it opened) for this long
const RESUME_MS = 12 * 60 * 60 * 1000;
const PROXY_ID = 'tutorial-tour-target';
const MEASURE_MS = 500;

type Progress = { id: string; step: number };

function readProgress(): Progress | null {
    const id = new URLSearchParams(window.location.search).get(TOUR_URL_PARAM);
    if (id && TUTORIAL_TOURS[id]) {
        return { id, step: 0 };
    }
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (
            saved &&
            TUTORIAL_TOURS[saved.id] &&
            Date.now() - saved.time < RESUME_MS
        ) {
            return { id: saved.id, step: saved.step };
        }
    } catch (e) {
        // no storage: the tour just doesn't resume
    }
    return null;
}

function saveProgress(p: Progress | null) {
    try {
        if (p) {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ ...p, time: Date.now() })
            );
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (e) {
        // no storage: the tour just doesn't resume
    }
}

/** a viewport box in document px, so it stays put when the window scrolls */
function toPage(b: Box): Box {
    return [
        b[0] + window.scrollX,
        b[1] + window.scrollY,
        b[2] + window.scrollX,
        b[3] + window.scrollY,
    ];
}

function boxStyle(b: Box): React.CSSProperties {
    return {
        left: b[0],
        top: b[1],
        width: b[2] - b[0],
        height: b[3] - b[1],
    };
}

const StepContent: React.FunctionComponent<{
    step: TutorialStep;
    index: number;
    count: number;
    found: boolean;
}> = ({ step, index, count, found }) => {
    const { beat, point } = step;
    return (
        <div className="step" data-test="tutorial-tour-step">
            <p className="title">
                {point && <span className="tutorial-badge">{point.n}</span>}
                {beat.title}
            </p>
            {point && <p>{point.say}</p>}
            {point && point.target && !found && (
                <p className="tutorial-missing">
                    This part of the page is not shown yet. Follow the previous
                    steps, or click Next.
                </p>
            )}
            {beat.bullets && (
                <ul>
                    {beat.bullets.map(b => (
                        <li key={b}>{b}</li>
                    ))}
                </ul>
            )}
            {beat.foot && <p className="tutorial-foot">{beat.foot}</p>}
            {beat.links && (
                <ul>
                    {beat.links.map(l => (
                        <li key={l.label}>
                            {l.label}
                            {l.url ? (
                                <a href={l.url} target="_blank">
                                    {l.text}
                                </a>
                            ) : (
                                l.text
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <p className="tutorial-count">
                {index + 1} / {count}
            </p>
        </div>
    );
};

/**
 * A tutorial script as a guided tour of the live site: each point highlights its target and
 * shows its text; Next steps on, and a step on another page navigates there first.
 * Mounted once in the app shell so it survives navigation; renders nothing unless started
 * with ?web-tour=<id> or resumed.
 */
export default function TutorialTour() {
    const [progress, setProgress] = useState<Progress | null>(readProgress);
    const steps = useMemo(
        () => (progress ? tutorialSteps(TUTORIAL_TOURS[progress.id]) : []),
        [progress && progress.id]
    );
    const current = progress ? progress.step : null;
    const [box, setBox] = useState<Box | null>(null);
    const [also, setAlso] = useState<Box[]>([]);

    useEffect(() => {
        saveProgress(progress);
    }, [progress]);

    useEffect(() => {
        if (current == null) {
            return;
        }
        const step = steps[current];
        const routing = getBrowserWindow().routingStore;
        const dest = navigationFor(step.beat.page, routing.location);
        if (dest) {
            routing.push(dest);
        }
        const target = step.point && step.point.target;
        let scrolled = false;
        const same = (a: Box | null, b: Box | null) =>
            a === b || (!!a && !!b && a.every((v, i) => v === b[i]));
        const measure = () => {
            let b = target ? targetBox(target) : null;
            if (b && !scrolled) {
                // scroll containers inside the page too, not only the window
                scrolled = true;
                findAll(target!)[0].scrollIntoView({ block: 'nearest' });
                b = targetBox(target!);
            }
            const pb = b && toPage(b);
            setBox(prev => (same(prev, pb) ? prev : pb));
            const ab = ((step.point && step.point.also) || [])
                .map((t: Target) => targetBox(t))
                .filter((x): x is Box => !!x)
                .map(toPage);
            setAlso(prev =>
                prev.length === ab.length &&
                prev.every((p, i) => same(p, ab[i]))
                    ? prev
                    : ab
            );
        };
        measure();
        const timer = setInterval(measure, MEASURE_MS);
        return () => clearInterval(timer);
    }, [current, steps]);

    if (!progress || current == null) {
        return null;
    }

    const tourSteps = steps.map((step, i) => ({
        selector: i === current && box ? '#' + PROXY_ID : '',
        content: (
            <StepContent
                step={step}
                index={i}
                count={steps.length}
                found={i !== current || !!box}
            />
        ),
    }));

    return (
        <>
            {ReactDOM.createPortal(
                <>
                    {box && (
                        <div
                            id={PROXY_ID}
                            className="tutorial-tour-proxy"
                            style={boxStyle(box)}
                        />
                    )}
                    {also.map((b, i) => (
                        <div
                            key={i}
                            className="tutorial-tour-also"
                            style={boxStyle(b)}
                        />
                    ))}
                </>,
                document.body
            )}
            <Tour
                className="tutorial-tour"
                isOpen={true}
                steps={tourSteps}
                startAt={current}
                goToStep={current}
                getCurrentStep={(step: number) =>
                    setProgress(p => p && { ...p, step })
                }
                update={`${current}:${box ? box.join(',') : ''}`}
                onRequestClose={() => setProgress(null)}
                rounded={8}
                maskSpace={4}
                closeWithMask={false}
                disableFocusLock={true}
                showNumber={false}
                showNavigation={false}
                showNavigationNumber={false}
                prevButton={<div className="skip-all-btn">Back</div>}
                nextButton={<div className="next-step-btn">Next</div>}
                lastStepNextButton={
                    <div
                        className="finish-step-btn"
                        onClick={() => setProgress(null)}
                    >
                        Finish
                    </div>
                }
            />
        </>
    );
}
