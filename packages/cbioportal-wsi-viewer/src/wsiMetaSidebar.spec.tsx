/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import { WsiMetaSidebar } from './wsiMetaSidebar';
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
