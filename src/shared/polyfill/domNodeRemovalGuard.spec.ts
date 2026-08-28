import { assert } from 'chai';
import { installDomNodeRemovalGuard } from './domNodeRemovalGuard';

describe('domNodeRemovalGuard', () => {
    beforeEach(() => {
        installDomNodeRemovalGuard();
    });

    it('removes a child that is present, as usual', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);

        assert.strictEqual(parent.removeChild(child), child);
        assert.isNull(child.parentNode);
        assert.equal(parent.childNodes.length, 0);
    });

    it('does not throw when removing a node that was moved elsewhere (e.g. by page translation)', () => {
        const parent = document.createElement('div');
        const text = document.createTextNode('hello');
        parent.appendChild(text);

        // Simulate Chrome translate wrapping the text node in a <font>
        const font = document.createElement('font');
        parent.replaceChild(font, text);
        font.appendChild(text);

        assert.doesNotThrow(() => parent.removeChild(text));
        assert.strictEqual(text.parentNode, font);
    });

    it('inserts before a present reference node, as usual', () => {
        const parent = document.createElement('div');
        const ref = document.createElement('b');
        const newNode = document.createElement('i');
        parent.appendChild(ref);

        parent.insertBefore(newNode, ref);
        assert.strictEqual(parent.firstChild, newNode);
        assert.strictEqual(newNode.nextSibling, ref);
    });

    it('does not throw when the reference node was moved elsewhere', () => {
        const parent = document.createElement('div');
        const ref = document.createTextNode('ref');
        const newNode = document.createElement('i');
        parent.appendChild(ref);

        const font = document.createElement('font');
        parent.replaceChild(font, ref);
        font.appendChild(ref);

        assert.doesNotThrow(() => parent.insertBefore(newNode, ref));
    });

    it('appends when the reference node is null', () => {
        const parent = document.createElement('div');
        const newNode = document.createElement('i');
        parent.insertBefore(newNode, null);
        assert.strictEqual(parent.lastChild, newNode);
    });

    it('is idempotent', () => {
        const removeChild = Node.prototype.removeChild;
        installDomNodeRemovalGuard();
        assert.strictEqual(Node.prototype.removeChild, removeChild);
    });
});
