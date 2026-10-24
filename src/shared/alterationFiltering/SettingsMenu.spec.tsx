import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import { observable } from 'mobx';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import SettingsMenu from './SettingsMenu';
import {
    buildDriverAnnotationSettings,
    IAnnotationFilterSettings,
} from './AnnotationFilteringSettings';
import SettingsMenuButton from 'shared/components/driverAnnotations/SettingsMenuButton';

function createStore(): IAnnotationFilterSettings {
    const driverAnnotationSettings = buildDriverAnnotationSettings(() => false);
    driverAnnotationSettings.customBinary = true;
    return observable({
        driverAnnotationSettings,
        customDriverAnnotationReport: remoteData({
            invoke: async () => ({ hasBinary: false, tiers: [] as string[] }),
            default: { hasBinary: false, tiers: [] as string[] },
        }),
        includeGermlineMutations: true,
        includeSomaticMutations: true,
        includeUnknownStatusMutations: true,
    });
}

describe('expression driver-filter explanation', () => {
    const expressionProfileProps = { hasExpressionProfileSelected: true };

    it('appears when driver filtering is enabled and disappears when disabled', () => {
        const store = createStore();
        store.driverAnnotationSettings.includeVUS = true;
        const wrapper = mount(
            <SettingsMenu
                store={store}
                showFilterControls={true}
                {...expressionProfileProps}
            />
        );
        const message = () =>
            wrapper.find('[data-test="DriverExpressionFilterInfo"]');
        const toggle = () => {
            wrapper
                .find('input[data-test="HideVUS"]')
                .getDOMNode<HTMLInputElement>()
                .click();
            wrapper.update();
        };
        assert.isFalse(message().exists());
        toggle();
        assert.isFalse(store.driverAnnotationSettings.includeVUS);
        assert.equal(
            message().text(),
            'Driver filtering does not apply to mRNA or protein expression data.'
        );
        toggle();
        assert.isTrue(store.driverAnnotationSettings.includeVUS);
        assert.isFalse(message().exists());
        wrapper.unmount();
    });

    it('disappears when the selected expression profile is removed', () => {
        const store = createStore();
        store.driverAnnotationSettings.includeVUS = false;
        const wrapper = mount(
            <SettingsMenu
                store={store}
                showFilterControls={true}
                {...expressionProfileProps}
            />
        );
        assert.isTrue(
            wrapper.find('[data-test="DriverExpressionFilterInfo"]').exists()
        );
        wrapper.setProps({ hasExpressionProfileSelected: false });
        assert.isFalse(
            wrapper.find('[data-test="DriverExpressionFilterInfo"]').exists()
        );
        wrapper.unmount();
    });

    for (const props of [
        {},
        { hasExpressionProfileSelected: false },
        { hasExpressionProfileSelected: true, disabled: true },
        { hasExpressionProfileSelected: true, showFilterControls: false },
    ]) {
        it(`does not show an inapplicable explanation for ${JSON.stringify(
            props
        )}`, () => {
            const store = createStore();
            store.driverAnnotationSettings.includeVUS = false;
            const wrapper = mount(
                <SettingsMenu
                    store={store}
                    showFilterControls={true}
                    {...props}
                />
            );
            assert.isFalse(
                wrapper
                    .find('[data-test="DriverExpressionFilterInfo"]')
                    .exists()
            );
            wrapper.unmount();
        });
    }

    it('forwards selected-expression context through the menu button', () => {
        const store = createStore();
        store.driverAnnotationSettings.includeVUS = false;
        const button = shallow(
            <SettingsMenuButton
                store={store}
                showFilterControls={true}
                showExcludeUnprofiledSamplesControl={true}
                {...expressionProfileProps}
            />
        );
        const menu = mount(
            button.find(DefaultTooltip).prop('overlay') as React.ReactElement
        );
        assert.isTrue(
            menu.find('[data-test="DriverExpressionFilterInfo"]').exists()
        );
        menu.unmount();
        button.unmount();
    });
});
