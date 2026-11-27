import { assert } from 'chai';
import { findAll, targetBox } from './targets';

// jsdom has no layout: each element's box comes from its data-box attribute ("l t r b")
const original = Element.prototype.getBoundingClientRect;

describe('tutorial targets', () => {
    beforeAll(() => {
        Element.prototype.getBoundingClientRect = function(this: Element) {
            const [left, top, right, bottom] = (
                this.getAttribute('data-box') || '0 0 0 0'
            )
                .split(' ')
                .map(Number);
            return {
                left,
                top,
                right,
                bottom,
                width: right - left,
                height: bottom - top,
            } as DOMRect;
        };
        document.body.innerHTML = `
            <div data-test="list" data-box="0 0 500 500">
                <div class="row" data-box="0 0 500 20"><label data-box="0 0 100 20">IDH1</label><input data-box="110 0 120 20"></div>
                <div class="row" data-box="0 20 500 40"><label data-box="0 20 100 40">TP53 R273H</label><input data-box="110 20 120 40"></div>
                <div class="row" data-box="0 40 500 60"><label data-box="0 40 100 60">ATRX</label></div>
            </div>
            <button data-box="600 0 650 30">Query</button>
            <button class="hidden">Query</button>
            <a class="far" data-box="900 900 950 950">Open</a>
        `;
    });

    afterAll(() => {
        Element.prototype.getBoundingClientRect = original;
        document.body.innerHTML = '';
    });

    it('finds the first visible match of a selector', () => {
        assert.equal(findAll('.row')[0].textContent, 'IDH1');
        assert.equal(findAll('button').length, 1);
    });

    it('matches text exactly, or contains it, and keeps the innermost match', () => {
        assert.equal(findAll({ css: 'button', text: 'Query' }).length, 1);
        assert.equal(findAll({ css: '*', text: 'TP53' }).length, 0);
        assert.equal(findAll({ has: 'TP53' })[0].tagName, 'LABEL');
    });

    it('looks within another target, and takes the nth match', () => {
        const input = findAll({
            css: 'input',
            within: { css: '.row', has: 'TP53' },
        });
        assert.equal(input[0].getAttribute('data-box'), '110 20 120 40');
        assert.equal(findAll({ css: '.row', nth: 2 })[0].textContent, 'ATRX');
        assert.deepEqual(findAll({ css: '.row', nth: 5 }), []);
    });

    it('boxes a union and pads it', () => {
        assert.deepEqual(
            targetBox({
                union: [{ css: 'label', text: 'IDH1' }, 'button'],
                pad: [1, 2, 3, 4],
            }),
            [-1, -2, 653, 34]
        );
        assert.deepEqual(targetBox({ css: 'button', pad: 2 }), [
            598,
            -2,
            652,
            32,
        ]);
    });

    it('returns no box when part of a union is missing', () => {
        assert.isNull(targetBox({ union: ['button', '.missing'] }));
        assert.isNull(targetBox('.missing'));
    });

    it('clips to the window before padding, when asked', () => {
        const [, , right, bottom] = targetBox('a.far', true)!;
        assert.equal(right, Math.min(window.innerWidth, 950));
        assert.equal(bottom, Math.min(window.innerHeight, 950));
    });

    it('finds nothing for a selector the browser cannot parse', () => {
        assert.deepEqual(findAll('div:::nope'), []);
    });
});
