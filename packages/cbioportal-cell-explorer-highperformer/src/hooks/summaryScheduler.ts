/**
 * Schedules summary computation tasks so they don't all fire in the same frame.
 * When context switches (e.g. All Cells → Selections), every chart's hook fires
 * simultaneously. Without staggering, the main thread gets overwhelmed by
 * postMessage structured cloning of large typed arrays.
 *
 * Tasks are processed one at a time with a yielding gap between each, keeping
 * the main thread responsive for UI updates and animations.
 */

type Task = () => Promise<void>;

const queue: Task[] = [];
let running = false;

function drain() {
    if (running || queue.length === 0) return;
    running = true;
    // Always defer via setTimeout so that postMessage structured cloning
    // never runs synchronously during React's effect flush cycle.
    // Without this, React flushing pending effects (e.g. before processing
    // a click event) would synchronously execute postMessage for every
    // queued task, blocking the main thread for seconds.
    setTimeout(() => {
        if (queue.length === 0) {
            running = false;
            return;
        }
        const task = queue.shift()!;
        task().finally(() => {
            running = false;
            // Yield to the browser before processing the next task
            if (queue.length > 0) {
                setTimeout(drain, 0);
            }
        });
    }, 0);
}

/**
 * Enqueue a summary computation task. Tasks are processed sequentially with
 * a yield between each to keep the UI responsive.
 */
export function scheduleSummary(task: Task): void {
    queue.push(task);
    drain();
}

/**
 * Clear all pending tasks (e.g. when context changes and old tasks are stale).
 */
export function flushSummaryQueue(): void {
    queue.length = 0;
}
