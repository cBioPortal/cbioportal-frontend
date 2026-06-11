import type { Preview } from '@storybook/react';
import * as React from 'react';

// React 16 does not ship useInsertionEffect; Storybook 8 internals reference
// it via a re-export.  Stub it so the preview bundle resolves without warnings.
if (!(React as any).useInsertionEffect) {
    (React as any).useInsertionEffect = (React as any).useLayoutEffect;
}

const preview: Preview = {
    parameters: {
        // Sensible viewport default matching the app's typical minimum width
        viewport: {
            defaultViewport: 'desktop',
            viewports: {
                desktop: {
                    name: 'Desktop (1280px)',
                    styles: { width: '1280px', height: '800px' },
                    type: 'desktop',
                },
                tablet: {
                    name: 'Tablet (768px)',
                    styles: { width: '768px', height: '1024px' },
                    type: 'tablet',
                },
            },
        },
        // Disable animations in snapshot/screenshot mode to prevent flakiness
        chromatic: { disableSnapshot: false },
    },
};

export default preview;
