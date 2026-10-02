import {
    scheduleThumbnailRequest,
    THUMBNAIL_REQUEST_CONCURRENCY,
} from './thumbnailRequestLimiter';

describe('scheduleThumbnailRequest', () => {
    it('limits concurrent thumbnail access and fetch work', async () => {
        let active = 0;
        let peak = 0;

        const promises = Array.from(
            { length: THUMBNAIL_REQUEST_CONCURRENCY + 2 },
            (_, index) =>
                scheduleThumbnailRequest(async () => {
                    active += 1;
                    peak = Math.max(peak, active);
                    await new Promise(resolve => setTimeout(resolve, 5));
                    active -= 1;
                    return index;
                }, new AbortController().signal)
        );

        await expect(Promise.all(promises)).resolves.toHaveLength(
            THUMBNAIL_REQUEST_CONCURRENCY + 2
        );
        expect(peak).toBe(THUMBNAIL_REQUEST_CONCURRENCY);
    });

    it('does not start queued work after cancellation', async () => {
        const controller = new AbortController();
        controller.abort();
        const task = jest.fn(async () => 'thumbnail');

        await expect(
            scheduleThumbnailRequest(task, controller.signal)
        ).rejects.toMatchObject({
            name: 'AbortError',
        });
        expect(task).not.toHaveBeenCalled();
    });

    it('drops a queued request as soon as it is cancelled', async () => {
        const release: Array<() => void> = [];
        const running = Array.from(
            { length: THUMBNAIL_REQUEST_CONCURRENCY },
            () =>
                scheduleThumbnailRequest(
                    () => new Promise<void>(resolve => release.push(resolve)),
                    new AbortController().signal
                )
        );
        const controller = new AbortController();
        const task = jest.fn(async () => 'thumbnail');
        const queued = scheduleThumbnailRequest(task, controller.signal);

        controller.abort();
        await expect(queued).rejects.toMatchObject({ name: 'AbortError' });

        release.forEach(resolve => resolve());
        await Promise.all(running);
        expect(task).not.toHaveBeenCalled();
    });
});
