import * as React from 'react';
import { assert } from 'chai';
import AddChartButton from './AddChartButton';

describe('AddChartButton', () => {
    function createComponent(showResetPopup: () => void = () => undefined) {
        return new AddChartButton({
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
            showResetPopup,
            openShareCustomDataUrlModal: () => undefined,
            isShareLinkModalVisible: false,
        } as any);
    }

    it('renders its menu in the document body', () => {
        const component = createComponent();

        const tooltip = component.render() as React.ReactElement;

        assert.strictEqual(tooltip.props.getTooltipContainer(), document.body);
    });

    it('closes the tooltip before opening reset charts', () => {
        let resetPopupCalls = 0;
        const component = createComponent(() => {
            resetPopupCalls += 1;
        });

        component.showTooltip = true;
        (component as any).closeTooltipAndShowResetPopup();

        assert.isFalse(component.showTooltip);
        assert.strictEqual(resetPopupCalls, 1);
    });
});
