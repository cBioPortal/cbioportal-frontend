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
});
