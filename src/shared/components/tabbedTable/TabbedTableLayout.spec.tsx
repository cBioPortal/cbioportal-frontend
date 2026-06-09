import * as React from 'react';
import { render } from '@testing-library/react';
import TabbedTableLayout from './TabbedTableLayout';

describe('TabbedTableLayout', () => {
    it('does not render an empty shell when there is no header content', () => {
        const { container } = render(
            <TabbedTableLayout testId="layout">
                <div data-test="child">Table content</div>
            </TabbedTableLayout>
        );

        const root = container.querySelector('[data-test="layout"]') as HTMLElement;
        expect(root.children).toHaveLength(1);
        expect((root.firstElementChild as HTMLElement).dataset.test).toBe('child');
    });

    it('renders the shell when tabs are present', () => {
        const { container } = render(
            <TabbedTableLayout
                testId="layout"
                tabs={[{ id: 'resource_a', label: 'Whole Slide' }]}
                activeTabId="resource_a"
            >
                <div data-test="child">Table content</div>
            </TabbedTableLayout>
        );

        const root = container.querySelector('[data-test="layout"]') as HTMLElement;
        expect(root.children).toHaveLength(2);
        expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    });
});
