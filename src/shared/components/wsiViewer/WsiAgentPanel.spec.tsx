/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { WsiAgentPanel } from './WsiAgentPanel';
import { WsiAgentContext, WsiAgentProposal } from './wsiAgent';

const context: WsiAgentContext = {
    study_id: 'study-a',
    patient_id: 'patient-a',
    sample_id: 'sample-a',
    slide_id: 'slide-a',
    filters: {},
    slide_metadata: {},
    patient_context: {},
    existing_annotations: [],
    viewport: {
        slide_width: 1000,
        slide_height: 1000,
        image_width: 100,
        image_height: 100,
    },
};

const proposal: WsiAgentProposal = {
    id: 'proposal-a',
    session_id: 'browser-session',
    action_type: 'create_annotation',
    study_id: 'study-a',
    slide_id: 'slide-a',
    payload: {
        geometry_type: 'rectangle',
        points: [
            { x: 100, y: 100 },
            { x: 300, y: 300 },
        ],
        label: 'candidate region',
        layer_name: 'AI review',
        rationale: 'Visible pattern for researcher review.',
    },
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
};

function responseWithJson(value: unknown) {
    return {
        ok: true,
        status: 200,
        json: async () => value,
    };
}

function streamResponse(value: string) {
    let complete = false;
    return {
        ok: true,
        status: 200,
        body: {
            getReader: () => ({
                read: async () => {
                    if (complete) return { done: true, value: undefined };
                    complete = true;
                    return {
                        done: false,
                        value: new Uint8Array(
                            Array.from(value).map(character =>
                                character.charCodeAt(0)
                            )
                        ),
                    };
                },
            }),
        },
    };
}

describe('WsiAgentPanel', () => {
    it('does not apply a proposed annotation until Apply is pressed', async () => {
        if (!globalThis.TextDecoder) {
            Object.defineProperty(globalThis, 'TextDecoder', {
                value: require('util').TextDecoder,
            });
        }
        const originalFetch = globalThis.fetch;
        const fetchMock = jest.fn();
        globalThis.fetch = (fetchMock as unknown) as typeof fetch;
        fetchMock.mockResolvedValueOnce(
            streamResponse(
                `event: message.delta\ndata: {"text":"Review this region."}\n\nevent: proposal\ndata: ${JSON.stringify(
                    proposal
                )}\n\nevent: complete\ndata: {"proposal_ids":["proposal-a"]}\n\n`
            ) as Response
        );
        fetchMock.mockResolvedValueOnce(
            responseWithJson({ ...proposal, status: 'approved' }) as Response
        );
        fetchMock.mockResolvedValueOnce(
            responseWithJson({
                ...proposal,
                status: 'completed',
                outcome: { success: true, detail: 'Annotation created.' },
            }) as Response
        );
        const applyProposal = jest.fn().mockResolvedValue({
            success: true,
            detail: 'Annotation created.',
        });
        const renderer = TestRenderer.create(
            <WsiAgentPanel
                apiUrl="/wsi"
                getContext={() => context}
                getToken={async () => 'token'}
                applyProposal={applyProposal}
            />
        );
        const input = renderer.root.findByProps({
            'aria-label': 'Ask the research assistant',
        });
        const form = renderer.root.findByType('form');
        act(() => {
            input.props.onChange({ target: { value: 'mark this region' } });
        });
        await act(async () => {
            form.props.onSubmit({ preventDefault: jest.fn() });
            await new Promise(resolve => setTimeout(resolve, 25));
        });
        expect(applyProposal).not.toHaveBeenCalled();

        const apply = renderer.root.findByProps({
            'data-testid': 'wsi-agent-apply-proposal-a',
        });
        await act(async () => {
            apply.props.onClick();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(applyProposal).toHaveBeenCalledWith({
            ...proposal,
            status: 'approved',
        });
        expect(fetchMock).toHaveBeenCalledTimes(3);
        globalThis.fetch = originalFetch;
    });
});
