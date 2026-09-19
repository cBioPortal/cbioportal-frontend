jest.mock('react-markdown', () => () => null);

import React from 'react';
import { hoverCallback } from './Timeline';

describe('timeline hover highlight', () => {
    function leaveFor(target: EventTarget | null) {
        const style = document.createElement('style');
        style.textContent = '.tl-track { opacity: 1; }';
        hoverCallback(
            { type: 'mouseleave', relatedTarget: target } as React.MouseEvent<
                Element,
                MouseEvent
            >,
            { current: style },
            'timeline-test'
        );
        return style.textContent;
    }

    it('clears highlighting when leaving the document or entering a non-element', () => {
        for (const target of [
            null,
            window,
            document,
            document.createTextNode(''),
        ]) {
            expect(leaveFor(target)).toBe('');
        }
    });

    it('clears highlighting when entering an ordinary element', () => {
        expect(leaveFor(document.createElement('div'))).toBe('');
    });

    it('preserves highlighting when entering a tooltip arrow', () => {
        const arrow = document.createElement('div');
        for (const className of ['arrow', 'arrow tooltip-arrow']) {
            arrow.className = className;
            expect(leaveFor(arrow)).toBe('.tl-track { opacity: 1; }');
        }
    });
});
