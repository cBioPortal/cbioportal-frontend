import GenePanelModal from './GenePanelModal';
import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

describe('GenePanelModal', () => {
    let wrapper: any;
    const props = {
        panelName: 'TESTPANEL1',
        show: true,
        onHide: () => {},
        isLoading: true,
    };

    after(() => {
        wrapper.unmount();
    });

    it('only renders modal body when isLoading is false', () => {
        wrapper = shallow(<GenePanelModal {...props} />);
        assert(wrapper.find('[data-test="gene-panel-modal-body"]').length === 0);

        wrapper.unmount();
        wrapper = shallow(<GenePanelModal {...props} isLoading={false} />);
        assert(wrapper.find('[data-test="gene-panel-modal-body"]').length === 1);
    });

    it('renders panel modal name', () => {
        const panelTitle = wrapper.find('[data-test="gene-panel-modal-title"]').at(0);
        assert(
            panelTitle
                .dive()
                .text()
                .includes('TESTPANEL1')
        );
    });
});
