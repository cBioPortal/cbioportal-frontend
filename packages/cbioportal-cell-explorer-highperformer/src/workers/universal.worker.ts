import { WorkerMessageSchema } from './colorBuffer.schemas';
import { SelectionMessageSchema } from './selection.schemas';
import { SummaryMessageSchema } from './summary.schemas';
import { IdMatchMessageSchema } from './idMatch.schemas';
import { handleColorBufferMessage } from './colorBuffer.handler';
import { handleSelectionMessage } from './selection.handler';
import { handleSummaryMessage } from './summary.handler';
import { handleIdMatchMessage } from './idMatch.handler';
import { z } from 'zod';

const UnifiedMessageSchema = z.union([
    WorkerMessageSchema,
    SelectionMessageSchema,
    SummaryMessageSchema,
    IdMatchMessageSchema,
]);

const workerSelf = (self as unknown) as {
    onmessage: ((e: MessageEvent) => void) | null;
    postMessage(message: unknown, transfer: Transferable[]): void;
};

workerSelf.onmessage = (e: MessageEvent) => {
    const { _poolTaskId, ...rest } = e.data;

    const result = UnifiedMessageSchema.safeParse(rest);
    if (!result.success) {
        console.warn('universal worker: invalid message', result.error);
        return;
    }

    const msg = result.data;

    if (msg.type === 'pointsInPolygon') {
        const response = handleSelectionMessage(msg);
        workerSelf.postMessage({ ...response, _poolTaskId }, [
            response.indices.buffer,
        ] as Transferable[]);
        return;
    }

    if (msg.type === 'matchByIds') {
        const response = handleIdMatchMessage(msg);
        workerSelf.postMessage({ ...response, _poolTaskId }, [
            response.indices.buffer,
        ] as Transferable[]);
        return;
    }

    if (msg.type === 'summarizeCategory') {
        const response = handleSummaryMessage(msg);
        workerSelf.postMessage(
            { ...response, _poolTaskId },
            response.type === 'categorySummary'
                ? ([response.counts.buffer] as Transferable[])
                : []
        );
        return;
    }

    if (msg.type === 'summarizeExpression') {
        const response = handleSummaryMessage(msg);
        workerSelf.postMessage(
            { ...response, _poolTaskId },
            response.type === 'expressionSummary'
                ? ([
                      response.bins.buffer,
                      response.binEdges.buffer,
                  ] as Transferable[])
                : []
        );
        return;
    }

    if (msg.type === 'summarizeExpressionByCategory') {
        const response = handleSummaryMessage(msg);
        workerSelf.postMessage(
            { ...response, _poolTaskId },
            response.type === 'expressionByCategorySummary'
                ? ([
                      response.meanExpression.buffer,
                      response.fractionExpressing.buffer,
                  ] as Transferable[])
                : []
        );
        return;
    }

    // Color buffer messages — all non-color-buffer types return early above
    const response = handleColorBufferMessage(
        msg as z.infer<typeof WorkerMessageSchema>
    );
    const transferables: Transferable[] = [response.buffer.buffer];
    if (response.radiusBuffer) {
        transferables.push(response.radiusBuffer.buffer);
    }
    workerSelf.postMessage({ ...response, _poolTaskId }, transferables);
};
