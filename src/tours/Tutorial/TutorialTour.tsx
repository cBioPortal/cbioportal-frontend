import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Tour from 'reactour';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { closeBeat, reveal } from './actions';
import { findAll, targetBox } from './targets';
import { navigationFor, tutorialSteps } from './steps';
import {
    Box,
    Target,
    TutorialBeat,
    TutorialScript,
    TutorialStep,
} from './types';
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
// how long a target may be missing before the tour does the beat's actions to show it
const REVEAL_AFTER_MS = 1200;

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

function onScreen(b: Box): boolean {
    return (
        b[2] > 0 &&
        b[3] > 0 &&
        b[0] < window.innerWidth &&
        b[1] < window.innerHeight
    );
}

function rounded(b: Box | null): Box | null {
    return b && (b.map(Math.round) as Box);
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
                    Showing this part of the page... If it doesn't appear,
                    follow the previous steps, or click Next.
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
    const shownBeat = useRef<TutorialBeat | null>(null);

    useEffect(() => {
        saveProgress(progress);
    }, [progress]);

    useEffect(() => {
        if (current == null) {
            return;
        }
        const step = steps[current];
        const left = shownBeat.current;
        shownBeat.current = step.beat;
        const routing = getBrowserWindow().routingStore;
        (left && left !== step.beat ? closeBeat(left) : Promise.resolve()).then(
            () => {
                const dest = navigationFor(step.beat.page, routing.location);
                if (dest) {
                    routing.push(dest);
                }
            }
        );
        const target = step.point && step.point.target;
        const hoverTarget = step.point && step.point.hover;
        const hovered: Element[] = [];
        // the element itself: the script's pads fit the window its captures were taken in
        const boxOf = (t: Target) => targetBox(t, false, false);
        const actions = step.beat.reveal || [];
        let scrolled = false;
        let missingSince = Date.now();
        let revealed = false;
        let cancelled = false;
        const same = (a: Box | null, b: Box | null) =>
            a === b || (!!a && !!b && a.every((v, i) => v === b[i]));
        const measure = () => {
            const h = hoverTarget && findAll(hoverTarget)[0];
            if (h && !h.hasAttribute('data-tour-hover')) {
                h.setAttribute('data-tour-hover', '');
                h.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                hovered.push(h);
            }
            let b = target ? boxOf(target) : null;
            if (b && !scrolled) {
                // scroll containers inside the page too, not only the window
                scrolled = true;
                findAll(target!)[0].scrollIntoView({ block: 'nearest' });
                b = boxOf(target!);
            }
            if (target && !b && !revealed && actions.length) {
                if (Date.now() - missingSince > REVEAL_AFTER_MS) {
                    revealed = true;
                    reveal(
                        actions,
                        () => !!boxOf(target),
                        () => cancelled
                    ).then(measure);
                }
            } else if (b) {
                missingSince = Date.now();
            }
            const vb = rounded(b);
            setBox(prev => (same(prev, vb) ? prev : vb));
            const ab = ((step.point && step.point.also) || [])
                .map((t: Target) => rounded(boxOf(t)))
                .filter((x): x is Box => !!x);
            setAlso(prev =>
                prev.length === ab.length &&
                prev.every((p, i) => same(p, ab[i]))
                    ? prev
                    : ab
            );
        };
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        measure();
        const timer = setInterval(measure, MEASURE_MS);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            cancelled = true;
            clearInterval(timer);
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
            for (const h of hovered) {
                h.removeAttribute('data-tour-hover');
                h.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
            }
        };
    }, [current, steps]);

    if (!progress || current == null) {
        return null;
    }

    const tourSteps = steps.map((step, i) => ({
        // only a target on screen: reactour would scroll back to one the user scrolled away from
        selector: i === current && box && onScreen(box) ? '#' + PROXY_ID : '',
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
                inViewThreshold={-100000}
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
