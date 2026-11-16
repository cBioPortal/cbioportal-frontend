import { assert } from 'chai';
import {
    hasMetadataColumns,
    parseOpenResources,
    redirectForViewerOnly,
    serializeOpenResources,
    viewerToAdopt,
} from './resourceViewerTabs';

describe('resourceViewerTabs', () => {
    describe('hasMetadataColumns', () => {
        it('is false when every column is a builtin', () => {
            // CYCIF on www: patientId, sampleId, url, displayName and nothing else.
            assert.isFalse(
                hasMetadataColumns({
                    columns: [
                        { id: 'patientId', source: 'builtin' },
                        { id: 'url', source: 'builtin' },
                    ] as any,
                })
            );
        });

        it('is true when any column comes from row metadata', () => {
            assert.isTrue(
                hasMetadataColumns({
                    columns: [
                        { id: 'patientId', source: 'builtin' },
                        { id: 'metadata:stain', source: 'metadata' },
                    ] as any,
                })
            );
        });
    });

    describe('open viewers in the URL', () => {
        it('round-trips a list of ids', () => {
            const ids = parseOpenResources('IDC_SLIM,CYCIF');
            assert.deepEqual(ids, ['IDC_SLIM', 'CYCIF']);
            assert.equal(serializeOpenResources(ids), 'IDC_SLIM,CYCIF');
        });

        it('reads a missing or empty parameter as nothing open', () => {
            assert.deepEqual(parseOpenResources(undefined), []);
            assert.deepEqual(parseOpenResources(''), []);
            assert.deepEqual(parseOpenResources(',,'), []);
        });

        it('drops the parameter once the last viewer closes', () => {
            assert.isUndefined(serializeOpenResources([]));
        });
    });

    describe('redirectForViewerOnly', () => {
        it('sends a table link for a resource without a table to its viewer', () => {
            assert.equal(
                redirectForViewerOnly('resourceTable_CYCIF', ['CYCIF']),
                'openResource_CYCIF'
            );
        });

        it('leaves a resource that has its table alone', () => {
            assert.isUndefined(
                redirectForViewerOnly('resourceTable_IDC_SLIM', ['CYCIF'])
            );
        });

        it('leaves every other tab alone', () => {
            assert.isUndefined(redirectForViewerOnly('summary', ['CYCIF']));
            assert.isUndefined(
                redirectForViewerOnly('openResource_CYCIF', ['CYCIF'])
            );
        });
    });

    describe('viewerToAdopt', () => {
        const presence = { IDC_SLIM: true, CYCIF: false };

        it('adds a linked viewer that the open set does not list', () => {
            // The shape every earlier shared link has: the viewer tab, no openResources.
            assert.equal(
                viewerToAdopt('openResource_IDC_SLIM', presence, []),
                'IDC_SLIM'
            );
        });

        it('adds nothing once it is already open', () => {
            assert.isUndefined(
                viewerToAdopt('openResource_IDC_SLIM', presence, ['IDC_SLIM'])
            );
        });

        it('adds nothing for a viewer-only resource, whose viewer is always there', () => {
            assert.isUndefined(
                viewerToAdopt('openResource_CYCIF', presence, [])
            );
        });

        it('adds nothing on any other tab', () => {
            assert.isUndefined(
                viewerToAdopt('resourceTable_IDC_SLIM', presence, [])
            );
            assert.isUndefined(viewerToAdopt('summary', presence, []));
        });
    });
});
