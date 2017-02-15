import * as SortUtils from './SortUtils';
import {IComparableArray} from "./SortUtils";
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('SortUtils', () => {

    before(() => {

    });

    after(() => {

    });

    it('compares number lists', () => {
        let a = [0, 1, 1, 2, 3, 5, 8, 13, 21];
        let b = [0, 1, 1, 2, 3, 5, 8, 13, 21];
        assert.equal(SortUtils.compareNumberLists(a, b), 0);

        a = [0, 0, 3, 0, 2];
        b = [0, 1, 0, 0, 0];
        assert.isBelow(SortUtils.compareNumberLists(a, b), 0);

        a = [0, 7, 9, 3, 1];
        b = [0, 6, 11, 34, 1];
        assert.isAbove(SortUtils.compareNumberLists(a, b), 0);
    });

    it('compares nested number lists', () => {
        let a:IComparableArray = [0, 1, 1, 2, 3, 5, 8, 13, 21];
        let b:IComparableArray = [0, 1, 1, 2, 3, 5, 8, 13, 21];

        assert.equal(SortUtils.compareNestedNumberLists(a, b), 0,
            "Identical flat number lists");

        a = [0, 1, [0, 3], [5, [6,7]], 7, 3];
        b = [0, 1, [0, 3], [5, [6,7]], 7, 3];

        assert.equal(SortUtils.compareNestedNumberLists(a, b), 0,
            "Identical nested number lists");

        a = [0, 0, 3, 0, 2];
        b = [0, 1, 0, 0, 0];

        assert.isBelow(SortUtils.compareNestedNumberLists(a, b), 0,
            "Flat number lists");

        a = [0, [2, [0, 4, 0], 9], 3];
        b = [0, [2, [0, 1, 5], 9], 0];

        assert.isAbove(SortUtils.compareNestedNumberLists(a, b), 0,
            "Nested number lists 1");
        assert.equal(SortUtils.compareNestedNumberLists(a, b), 3,
            "Nested number list diff value");

        a = [[1, 0], [[0, 0, 0], 9], 3, [0, 0]];
        b = [[0, 1], [[33, 41, 65], 99], 7, [4, 0]];

        assert.isAbove(SortUtils.compareNestedNumberLists(a, b), 0,
            "Nested number lists 2");
    });

});
