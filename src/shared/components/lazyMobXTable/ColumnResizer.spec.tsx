import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import sinon from 'sinon';
import { act } from 'react-dom/test-utils';
import ColumnResizer from './ColumnResizer';

function stubWidth(el: HTMLElement, width: number) {
    Object.defineProperty(el, 'clientWidth', {
        configurable: true,
        get: () => width,
    });
}

function dispatchMouse(type: string, clientX: number) {
    act(() => {
        document.dispatchEvent(
            new MouseEvent(type, { clientX, bubbles: true, cancelable: true })
        );
    });
}

function dispatchTouch(type: string, clientX: number) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    const touches = type === 'touchend' ? [] : [{ clientX }];
    Object.defineProperty(event, 'touches', { value: touches });
    Object.defineProperty(event, 'changedTouches', {
        value: [{ clientX }],
    });
    act(() => {
        document.dispatchEvent(event);
    });
}

describe('ColumnResizer', () => {
    let container: HTMLDivElement;
    let wrapper: ReactWrapper | undefined;
    let prev: HTMLElement;
    let next: HTMLElement;
    let spies: sinon.SinonSpy[] = [];

    function spyOnDocument(method: 'addEventListener' | 'removeEventListener') {
        const spy = sinon.spy(document, method);
        spies.push(spy);
        return spy;
    }

    function render(minWidth?: number) {
        wrapper = mount(
            <table>
                <tbody>
                    <tr>
                        <td className="prev" />
                        <ColumnResizer
                            className="columnResizer"
                            minWidth={minWidth}
                        />
                        <td className="next" />
                    </tr>
                </tbody>
            </table>,
            { attachTo: container }
        );
        prev = container.querySelector('td.prev') as HTMLElement;
        next = container.querySelector('td.next') as HTMLElement;
        stubWidth(prev, 100);
        stubWidth(next, 80);
    }

    function resizerCell() {
        return wrapper!.find('td.columnResizer');
    }

    function startMouseDrag(clientX: number) {
        resizerCell().simulate('mousedown', { button: 0, clientX });
    }

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.detach();
        }
        document.body.removeChild(container);
        spies.forEach(spy => spy.restore());
        spies = [];
    });

    it('renders a single td carrying the given className', () => {
        render();
        const cells = container.querySelectorAll('td.columnResizer');
        assert.equal(cells.length, 1);
        assert.equal(cells[0].tagName, 'TD');
        const style = (cells[0] as HTMLElement).style;
        assert.equal(style.cursor, 'ew-resize');
    });

    it('widens the previous cell and narrows the next one when dragged right', () => {
        render();
        startMouseDrag(200);
        dispatchMouse('mousemove', 230);
        assert.equal(prev.style.width, '130px');
        assert.equal(next.style.width, '50px');
    });

    it('narrows the previous cell and widens the next one when dragged left', () => {
        render();
        startMouseDrag(200);
        dispatchMouse('mousemove', 160);
        assert.equal(prev.style.width, '60px');
        assert.equal(next.style.width, '120px');
    });

    it('measures each move from the drag start position', () => {
        render();
        startMouseDrag(200);
        dispatchMouse('mousemove', 220);
        dispatchMouse('mousemove', 190);
        assert.equal(prev.style.width, '90px');
        assert.equal(next.style.width, '90px');
    });

    it('clamps the next cell at minWidth', () => {
        render(20);
        startMouseDrag(200);
        dispatchMouse('mousemove', 400);
        assert.equal(prev.style.width, '160px');
        assert.equal(next.style.width, '20px');
    });

    it('clamps the previous cell at minWidth', () => {
        render(20);
        startMouseDrag(200);
        dispatchMouse('mousemove', 0);
        assert.equal(prev.style.width, '20px');
        assert.equal(next.style.width, '160px');
    });

    it('defaults minWidth to 0', () => {
        render();
        startMouseDrag(200);
        dispatchMouse('mousemove', -500);
        assert.equal(prev.style.width, '0px');
        assert.equal(next.style.width, '180px');
    });

    it('does not resize on mouse move without a drag in progress', () => {
        render();
        dispatchMouse('mousemove', 300);
        assert.equal(prev.style.width, '');
        assert.equal(next.style.width, '');
    });

    it('ignores non-primary mouse buttons', () => {
        render();
        resizerCell().simulate('mousedown', { button: 2, clientX: 200 });
        dispatchMouse('mousemove', 250);
        assert.equal(prev.style.width, '');
    });

    it('stops resizing after mouseup', () => {
        render();
        startMouseDrag(200);
        dispatchMouse('mousemove', 210);
        dispatchMouse('mouseup', 210);
        dispatchMouse('mousemove', 300);
        assert.equal(prev.style.width, '110px');
        assert.equal(next.style.width, '70px');
    });

    it('resizes with touch events and stops on touchend', () => {
        render();
        resizerCell().simulate('touchstart', {
            touches: [{ clientX: 50 }],
        });
        dispatchTouch('touchmove', 75);
        assert.equal(prev.style.width, '125px');
        assert.equal(next.style.width, '55px');
        dispatchTouch('touchend', 75);
        dispatchTouch('touchmove', 10);
        assert.equal(prev.style.width, '125px');
    });

    it('removes its document listeners on mouseup', () => {
        render();
        const remove = spyOnDocument('removeEventListener');
        startMouseDrag(200);
        remove.resetHistory();
        dispatchMouse('mouseup', 200);
        const removed = remove.getCalls().map(c => c.args[0]);
        ['mousemove', 'touchmove', 'mouseup', 'touchend'].forEach(type =>
            assert.include(removed, type)
        );
    });

    it('removes its document listeners when unmounted mid-drag', () => {
        render();
        const add = spyOnDocument('addEventListener');
        const remove = spyOnDocument('removeEventListener');
        startMouseDrag(200);
        const moveListener = add
            .getCalls()
            .find(c => c.args[0] === 'mousemove')!.args[1];

        remove.resetHistory();
        act(() => {
            wrapper!.unmount();
        });
        wrapper = undefined;

        assert.isTrue(
            remove
                .getCalls()
                .some(
                    c => c.args[0] === 'mousemove' && c.args[1] === moveListener
                )
        );
        dispatchMouse('mousemove', 300);
        assert.equal(prev.style.width, '');
    });
});
