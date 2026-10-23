const viewerProps: any[] = [];

jest.mock('shared/components/resourceViewer/ResourceViewer', () => {
    const React = require('react');
    return function MockResourceViewer(props: any) {
        viewerProps.push(props);
        return <div data-testid="viewer" />;
    };
});

import * as React from 'react';
import { assert } from 'chai';
import { render } from '@testing-library/react';
import ResourceViewerTab from './ResourceViewerTab';

describe('ResourceViewerTab', () => {
    const rows = ['a', 'b', 'c'].map(k => ({
        key: k,
        url: `https://example.com/${k}`,
    }));
    const store = { rows: { result: rows } } as any;

    const lastIndex = () => viewerProps[viewerProps.length - 1].index;

    const tab = (props: any) => (
        <ResourceViewerTab
            store={store}
            resourceDisplayName="CyCIF"
            onSelect={() => undefined}
            {...props}
        />
    );

    beforeEach(() => {
        viewerProps.length = 0;
    });

    it('shows the item the URL names while it is the tab in view', () => {
        render(tab({ isActive: true, urlItem: 'https://example.com/c' }));
        assert.equal(lastIndex(), 2);
    });

    it('keeps showing that item once another tab is in view', () => {
        // The viewer stays mounted while hidden. Falling back to the first item would reload the
        // frame and lose its zoom, which is what keeping it mounted is for.
        const { rerender } = render(
            tab({ isActive: true, urlItem: 'https://example.com/c' })
        );
        rerender(
            tab({
                isActive: false,
                // Another viewer moved, so the URL now names its item.
                urlItem: 'https://example.com/elsewhere',
            })
        );
        assert.equal(lastIndex(), 2);
    });

    it('ignores an item from the URL that is not one of its rows', () => {
        // resourceUrl lingers after the user moves to another tab.
        render(tab({ isActive: true, urlItem: 'https://other.org/x' }));
        assert.equal(lastIndex(), 0);
    });

    it('remembers an item stepped to with the chevrons', () => {
        const selected: string[] = [];
        const { rerender } = render(
            tab({ isActive: true, onSelect: (u: string) => selected.push(u) })
        );
        viewerProps[viewerProps.length - 1].onIndexChange(1);
        rerender(tab({ isActive: false, urlItem: undefined }));

        assert.deepEqual(selected, ['https://example.com/b']);
        assert.equal(lastIndex(), 1);
    });

    it('returns to the first item when Back leaves the URL naming none', () => {
        const { rerender } = render(
            tab({ isActive: true, urlItem: 'https://example.com/b' })
        );
        rerender(tab({ isActive: true, urlItem: undefined }));
        assert.equal(lastIndex(), 0);
    });

    it('writes its item back to the URL when it comes into view', () => {
        // Another viewer's item is in the URL, so a reload or a shared link would open this
        // viewer on its first item.
        const selected: [string, boolean | undefined][] = [];
        const onSelect = (u: string, replace?: boolean) =>
            selected.push([u, replace]);
        const { rerender } = render(
            tab({ isActive: true, urlItem: 'https://example.com/b', onSelect })
        );
        rerender(
            tab({ isActive: false, urlItem: 'https://other.org/x', onSelect })
        );
        rerender(
            tab({ isActive: true, urlItem: 'https://other.org/x', onSelect })
        );

        assert.deepEqual(selected, [['https://example.com/b', true]]);
        assert.equal(lastIndex(), 1);
    });

    it('takes the URL item when it comes into view on one of its rows', () => {
        const selected: string[] = [];
        const onSelect = (u: string) => selected.push(u);
        const { rerender } = render(
            tab({ isActive: true, urlItem: 'https://example.com/b', onSelect })
        );
        rerender(tab({ isActive: false, urlItem: undefined, onSelect }));
        rerender(
            tab({ isActive: true, urlItem: 'https://example.com/c', onSelect })
        );

        assert.deepEqual(selected, []);
        assert.equal(lastIndex(), 2);
    });

    it('shows a linked item once its rows arrive', () => {
        const selected: string[] = [];
        const onSelect = (u: string) => selected.push(u);
        const loading = { rows: { result: undefined } } as any;
        const props = {
            isActive: true,
            urlItem: 'https://example.com/c',
            onSelect,
        };
        const { rerender } = render(tab({ ...props, store: loading }));
        rerender(tab({ ...props, store }));

        assert.deepEqual(selected, []);
        assert.equal(lastIndex(), 2);
    });

    it('starts on the first item when nothing names one', () => {
        render(tab({ isActive: true }));
        assert.equal(lastIndex(), 0);
    });
});
