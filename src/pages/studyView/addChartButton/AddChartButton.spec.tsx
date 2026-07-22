import * as React from 'react';
import { assert } from 'chai';
import AddChartButton from './AddChartButton';

describe('AddChartButton', () => {
    it('renders its menu in the document body', () => {
        const component = new AddChartButton({
            buttonText: 'Columns',
            store: {
                studyIds: [],
                genericAssayProfileOptionsByType: { isPending: false },
                molecularProfileOptions: { isPending: false },
                genericAssayEntitiesGroupedByProfileIdSuffix: {
                    isPending: false,
                },
            },
            currentTab: 'clinicalData' as any,
            showResetPopup: () => undefined,
            openShareCustomDataUrlModal: () => undefined,
            isShareLinkModalVisible: false,
        } as any);

        const tooltip = component.render() as React.ReactElement;

        assert.strictEqual(tooltip.props.getTooltipContainer(), document.body);
    });
});
