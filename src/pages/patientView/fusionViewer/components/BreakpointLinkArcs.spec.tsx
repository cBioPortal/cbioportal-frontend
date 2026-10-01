import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import BreakpointLinkArcs from './BreakpointLinkArcs';
import { LinkHover } from './LinkHover';
import { matchLinkIds, LinkGroup } from '../data/linkAggregation';

const g = (id: string, n: number, x5 = 10, x3 = 300): LinkGroup => {
    const [key5, key3, frame] = id.split('|');
    return {
        id,
        key5,
        key3,
        frame: frame as any,
        x5,
        x3,
        sampleIds: [],
        sampleCount: n,
    };
};

describe('BreakpointLinkArcs', () => {
    const groups = [g('A1|B3|inFrame', 14), g('A2|B3|unknown', 1)];

    it('one arc per group, thicker for more samples, thickest drawn first', () => {
        const w = mount(
            <BreakpointLinkArcs
                groups={[groups[1], groups[0]]}
                width={600}
                height={120}
                onHover={() => {}}
            />
        );
        const arcs = w.find('path[data-testid="link-arc"]');
        assert.lengthOf(arcs, 2);
        assert.isAbove(
            Number(arcs.at(0).prop('strokeWidth')),
            Number(arcs.at(1).prop('strokeWidth'))
        );
    });

    it('matcher lights matching arcs and dims the rest', () => {
        const w = mount(
            <BreakpointLinkArcs
                groups={groups}
                width={600}
                height={120}
                matcher={matchLinkIds(['A2|B3|unknown'])}
                onHover={() => {}}
            />
        );
        const op = (id: string) =>
            Number(w.find(`path[data-link-id="${id}"]`).prop('strokeOpacity'));
        assert.equal(op('A2|B3|unknown'), 0.9);
        assert.equal(op('A1|B3|inFrame'), 0.06);
    });

    it('hover reports the group and clears on leave', () => {
        const seen: any[] = [];
        const w = mount(
            <BreakpointLinkArcs
                groups={groups}
                width={600}
                height={120}
                onHover={x => seen.push(x)}
            />
        );
        const arc = w.find('path[data-link-id="A1|B3|inFrame"]');
        arc.simulate('mouseenter');
        arc.simulate('mouseleave');
        assert.equal(seen[0].id, 'A1|B3|inFrame');
        assert.isUndefined(seen[1]);
    });

    it('LinkHover set/clear', () => {
        const h = new LinkHover();
        h.set(matchLinkIds(['x']));
        assert.isDefined(h.matcher);
        h.clear();
        assert.isUndefined(h.matcher);
    });
});
