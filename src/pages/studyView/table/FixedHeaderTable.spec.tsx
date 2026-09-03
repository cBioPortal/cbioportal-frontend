import { assert } from 'chai';
import React from 'react';
import FixedHeaderTable from './FixedHeaderTable';
import { SelectionOperatorEnum } from '../TableUtils';

describe('FixedHeaderTable', () => {
    it('marks the current selection operator as active in the dropdown', () => {
        const component = new FixedHeaderTable<any>({
            columns: [],
            data: [],
            numberOfSelectedRows: 2,
            defaultSelectionOperator: SelectionOperatorEnum.UNION,
        });

        const options = (component as any).getSelectionOptions() as React.ReactElement[];
        const byLabel = Object.fromEntries(
            options.map(option => [option.props.children.props.overlay.split(' ')[0], option])
        );

        assert.isFalse(byLabel.Intersection.props.active);
        assert.isTrue(byLabel.Union.props.active);
    });
});
