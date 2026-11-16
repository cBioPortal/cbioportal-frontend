import { assert } from 'chai';
import { closeBeat, reveal, runAction } from './actions';
import { targetBox } from './targets';

// jsdom has no layout: an element is visible unless it (or an ancestor) has the hidden class
const original = Element.prototype.getBoundingClientRect;

describe('tutorial actions', () => {
    beforeAll(() => {
        Element.prototype.getBoundingClientRect = function(this: Element) {
            const shown = !this.closest('.hidden');
            return {
                left: 10,
                top: 10,
                right: shown ? 20 : 10,
                bottom: shown ? 20 : 10,
                width: shown ? 10 : 0,
                height: shown ? 10 : 0,
            } as DOMRect;
        };
    });

    afterAll(() => {
        Element.prototype.getBoundingClientRect = original;
        document.body.innerHTML = '';
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="toggle">Menu</button>
            <div id="menu" class="hidden"><input type="checkbox" id="box"></div>
        `;
        document.getElementById('toggle')!.onclick = () =>
            document.getElementById('menu')!.classList.toggle('hidden');
    });

    it('stops replaying once the target shows', async () => {
        let clicks = 0;
        document
            .getElementById('toggle')!
            .addEventListener('click', () => clicks++);
        const shown = await reveal(
            [{ click: '#toggle' }, { click: '#toggle' }],
            () => !!targetBox('#box'),
            () => false,
            0
        );
        assert.isTrue(shown);
        assert.equal(clicks, 1);
    });

    it('leaves a ticked box ticked', async () => {
        document.getElementById('menu')!.classList.remove('hidden');
        const box = document.getElementById('box') as HTMLInputElement;
        box.checked = true;
        assert.isTrue(await runAction({ click: '#box' }));
        assert.isTrue(box.checked);
        assert.isFalse(await runAction({ click: '#missing' }));
    });

    it('closes the menu a beat opened, and leaves a closed one closed', async () => {
        const beat = {
            title: 'menu',
            points: [{ n: 1, say: 'tick', target: '#box' }],
            reveal: [{ click: '#toggle' }],
        };
        const menu = document.getElementById('menu')!;
        menu.classList.remove('hidden');
        await closeBeat(beat, 0);
        assert.isTrue(menu.classList.contains('hidden'));
        await closeBeat(beat, 0);
        assert.isTrue(menu.classList.contains('hidden'));
    });

    it('leaves the pad off when asked', () => {
        document.getElementById('menu')!.classList.remove('hidden');
        assert.deepEqual(targetBox({ css: '#box', pad: 5 }, false, false), [
            10,
            10,
            20,
            20,
        ]);
    });
});
