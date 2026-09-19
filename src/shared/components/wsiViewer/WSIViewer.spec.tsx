/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import WSIViewer from './WSIViewer';

jest.mock('./wsiOpenSeadragonLoader', () => ({
    loadOpenSeadragon: jest.fn(),
    hasPreloadedOpenSeadragon: () => false,
}));

function makeInstance() {
    return new (WSIViewer as any)({
        tileServerUrl: 'https://tiles.example.com',
        hierarchyUrl: '/api/wsi/v2/hierarchy/study/P-1',
        patientId: 'P-1',
        height: 500,
    });
}

describe('WSIViewer foundation', () => {
    it('renders a loading state before hierarchy data arrives', () => {
        const instance = makeInstance();
        const renderer = TestRenderer.create(instance.render());

        expect(renderer.root.findByType('div')).toBeTruthy();
    });

    it('renders a readable error when hierarchy loading fails', () => {
        const instance = makeInstance();
        instance.loading = false;
        instance.error = 'Hierarchy unavailable';
        instance.hierarchy = null;

        const renderer = TestRenderer.create(instance.render());

        expect(renderer.root.findByType('div').children.join('')).toContain(
            'Hierarchy unavailable'
        );
    });
});
