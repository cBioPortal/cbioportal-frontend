/**
 * @jest-environment jsdom
 */

const requests: Array<{
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    query?: unknown;
}> = [];

const mockOncoKbProxy = 'https://portal.example/api/proxy/oncokb';
let mockOncoKbFailure = false;

jest.mock('shared/api/urls', () => ({
    getOncoKbApiUrl: () => mockOncoKbProxy,
}));

jest.mock('superagent', () => ({
    Request: class {
        method: string;
        url: string;
        headers: Record<string, string> = {};
        body?: unknown;
        queryParams?: unknown;

        constructor(method: string, url: string) {
            this.method = method;
            this.url = url;
        }

        query(value: unknown) {
            this.queryParams = value;
            return this;
        }

        set(name: string, value: string) {
            this.headers[name] = value;
            return this;
        }

        send(value: unknown) {
            this.body = value;
            return this;
        }

        end(callback: (error: Error | undefined, response: any) => void) {
            requests.push({
                method: this.method,
                url: this.url,
                headers: this.headers,
                body: this.body,
                query: this.queryParams,
            });
            if (mockOncoKbFailure) {
                callback(new Error('OncoKB unavailable'), { ok: false });
                return;
            }
            callback(undefined, {
                ok: true,
                body: [
                    {
                        query: { id: '3845_G12D_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                    },
                ],
            });
        }
    },
}));

import {
    getWsiOncoKbClient,
    resetWsiOncoKbClientForTests,
} from './wsiOncoKbClientInstance';
import { OncoKbAPI } from 'oncokb-ts-api-client';
import { maskApiRequests } from 'cbioportal-utils';
import eventBus from 'shared/events/eventBus';

describe('WSI OncoKB client', () => {
    beforeAll(() => {
        maskApiRequests(OncoKbAPI, mockOncoKbProxy, {
            'X-Proxy-User-Agreement': 'test-agreement',
        });
    });

    beforeEach(() => {
        requests.length = 0;
        mockOncoKbFailure = false;
        resetWsiOncoKbClientForTests();
    });

    it('uses the configured portal proxy and generated request contract', async () => {
        const response = await getWsiOncoKbClient().annotateMutationsByProteinChangePostUsingPOST_1(
            {
                body: [
                    {
                        id: '3845_G12D_Missense_Mutation',
                        alteration: 'G12D',
                    } as any,
                ],
            }
        );

        expect(response).toEqual([
            {
                query: { id: '3845_G12D_Missense_Mutation' },
                oncogenic: 'Oncogenic',
            },
        ]);
        expect(requests).toHaveLength(1);
        expect(requests[0]).toMatchObject({
            method: 'POST',
            url: `${mockOncoKbProxy}/${Buffer.from(
                '/annotate/mutations/byProteinChange'
            ).toString('base64')}`,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Proxy-User-Agreement': 'test-agreement',
            },
        });
        expect(
            JSON.parse(
                Buffer.from(String(requests[0].body), 'base64').toString()
            )
        ).toEqual([
            {
                id: '3845_G12D_Missense_Mutation',
                alteration: 'G12D',
            },
        ]);
    });

    it('rejects an unavailable enrichment service without emitting a portal error', async () => {
        mockOncoKbFailure = true;
        const emit = jest.spyOn(eventBus, 'emit');

        await expect(
            getWsiOncoKbClient().annotateMutationsByProteinChangePostUsingPOST_1(
                { body: [{} as any] }
            )
        ).rejects.toThrow('OncoKB unavailable');
        expect(emit).not.toHaveBeenCalled();
        emit.mockRestore();
    });

    it('uses the generated CNA and structural-variant endpoint contracts', async () => {
        await getWsiOncoKbClient().annotateCopyNumberAlterationsPostUsingPOST_1(
            {
                body: [{ id: '3845_AMP' } as any],
            }
        );
        await getWsiOncoKbClient().annotateStructuralVariantsPostUsingPOST_1({
            body: [{ id: 'ALK--EML4' } as any],
        });

        expect(requests).toHaveLength(2);
        expect(requests[0].url).toBe(
            `${mockOncoKbProxy}/${Buffer.from(
                '/annotate/copyNumberAlterations'
            ).toString('base64')}`
        );
        expect(requests[1].url).toBe(
            `${mockOncoKbProxy}/${Buffer.from(
                '/annotate/structuralVariants'
            ).toString('base64')}`
        );
        expect(
            JSON.parse(
                Buffer.from(String(requests[0].body), 'base64').toString()
            )
        ).toEqual([{ id: '3845_AMP' }]);
        expect(
            JSON.parse(
                Buffer.from(String(requests[1].body), 'base64').toString()
            )
        ).toEqual([{ id: 'ALK--EML4' }]);
    });
});
