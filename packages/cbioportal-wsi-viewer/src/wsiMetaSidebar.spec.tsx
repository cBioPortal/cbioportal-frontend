/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
    WsiMetaSidebar,
    wsiSidebarSectionCollapsedKey,
} from './wsiMetaSidebar';
import { WsiClinicalRow } from './wsiViewerTypes';

function renderSidebarJson(clinicalRows?: WsiClinicalRow[]): string {
    const renderer = TestRenderer.create(
        <WsiMetaSidebar
            width={300}
            showImageProperties={false}
            wsiRows={[]}
            showPathology={false}
            pathRows={[]}
            clinicalRows={clinicalRows}
        />
    );
    return JSON.stringify(renderer.toJSON());
}

describe('WsiMetaSidebar clinical section', () => {
    it('hides the Clinical section without clinical rows', () => {
        expect(renderSidebarJson(undefined)).not.toContain('"Clinical"');
    });

    it('renders clinical rows after Pathology', () => {
        const json = renderSidebarJson([
            { label: 'Sex', value: 'Female', labelTip: 'Sex' },
        ]);
        expect(json).toContain('"Clinical"');
        expect(json).toContain('"Female"');
        expect(json.indexOf('"Pathology"')).toBeLessThan(
            json.indexOf('"Clinical"')
        );
    });

    it('shows an empty state when no attributes have values', () => {
        const json = renderSidebarJson([]);
        expect(json).toContain('"Clinical"');
        expect(json).toContain('—');
    });
});

describe('WsiMetaSidebar collapsible sections', () => {
    beforeEach(() => window.localStorage.clear());

    function renderSidebar() {
        return TestRenderer.create(
            <WsiMetaSidebar
                width={300}
                showImageProperties={true}
                wsiRows={[{ label: 'Dimensions', value: '100 x 100' }]}
                showPathology={true}
                pathRows={[{ label: 'Stain', value: 'H&E' }]}
                clinicalRows={[{ label: 'Sex', value: 'Female' }]}
            />
        );
    }

    function isHidden(renderer: TestRenderer.ReactTestRenderer, id: string) {
        return renderer.root.findByProps({ id: `wsi-sidebar-section-${id}` })
            .props.hidden;
    }

    function toggle(renderer: TestRenderer.ReactTestRenderer, id: string) {
        return renderer.root.findByProps({
            'data-testid': `wsi-sidebar-section-${id}-toggle`,
        });
    }

    it.each(['imageProperties', 'pathology', 'clinical'])(
        'collapses and expands the %s section',
        id => {
            const renderer = renderSidebar();
            expect(toggle(renderer, id).props['aria-expanded']).toBe(true);

            act(() => toggle(renderer, id).props.onClick());
            expect(toggle(renderer, id).props['aria-expanded']).toBe(false);
            expect(isHidden(renderer, id)).toBe(true);
            expect(
                window.localStorage.getItem(wsiSidebarSectionCollapsedKey(id))
            ).toBe('1');

            act(() => toggle(renderer, id).props.onClick());
            expect(toggle(renderer, id).props['aria-expanded']).toBe(true);
            expect(
                window.localStorage.getItem(wsiSidebarSectionCollapsedKey(id))
            ).toBeNull();
        }
    );

    it('collapses one section without touching the others', () => {
        const renderer = renderSidebar();
        act(() => toggle(renderer, 'pathology').props.onClick());

        expect(isHidden(renderer, 'pathology')).toBe(true);
        expect(isHidden(renderer, 'imageProperties')).toBe(false);
        expect(isHidden(renderer, 'clinical')).toBe(false);
    });

    it('keeps collapsed content mounted', () => {
        const renderer = renderSidebar();
        act(() => toggle(renderer, 'clinical').props.onClick());
        expect(JSON.stringify(renderer.toJSON())).toContain('"Female"');
    });

    it('restores the stored collapsed state', () => {
        window.localStorage.setItem(
            wsiSidebarSectionCollapsedKey('clinical'),
            '1'
        );
        const renderer = renderSidebar();
        expect(toggle(renderer, 'clinical').props['aria-expanded']).toBe(false);
        expect(isHidden(renderer, 'clinical')).toBe(true);
    });
});
