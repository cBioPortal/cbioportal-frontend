import React from 'react';
import {assert} from 'chai';
import {shallow, mount} from 'enzyme';
import sinon from 'sinon';
import CopyNumberTableWrapper from './CopyNumberTableWrapper';
import {CNATableColumn} from "./CopyNumberTableWrapper";

describe('CopyNumberTableWrapper', () => {

    it.only('includes mrna expr column only if there is ONE sample. hides for multiple samples', () => {

        let sampleManager = {
            getSampleIdsInOrder: function () {
                return [1];
            }
        };
        let columns: CNATableColumn[] = CopyNumberTableWrapper.prototype.buildColumns.apply({props: {sampleManager}});
        let mrnaCol = columns.find((column) => column.name === 'mRNA Expr.');
        assert.isDefined(mrnaCol);

        sampleManager = {
            getSampleIdsInOrder: function () {
                return [1, 2, 3];
            }
        };

        columns = CopyNumberTableWrapper.prototype.buildColumns.apply({props: {sampleManager}});
        mrnaCol = columns.find((column) => column.name === 'mRNA Expr.');
        assert.isUndefined(mrnaCol);

    });

});
