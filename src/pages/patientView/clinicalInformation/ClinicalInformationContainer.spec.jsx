import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { default as reducer, actionTypes } from './duck';
import { ClinicalInformationContainerUnconnected } from './ClinicalInformationContainer';
import Spinner from 'react-spinkit';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import PDXTree from './PDXTree';
import FixedDataTableExample from './ClinicalInformationSamples';

const stubComponent = function (componentClass) {
    let originalPropTypes;

    let renderStub;

    beforeEach(() => {
        originalPropTypes = componentClass.propTypes;

        componentClass.propTypes = {};

        renderStub = sinon.stub(componentClass.prototype, 'render', () => <div />);
        // sinon.stub(componentClass.prototype, 'componentWillMount');
        // sinon.stub(componentClass.prototype, 'componentDidMount');
        // sinon.stub(componentClass.prototype, 'componentWillReceiveProps');
        // sinon.stub(componentClass.prototype, 'shouldComponentUpdate');
        // sinon.stub(componentClass.prototype, 'componentWillUpdate');
        // sinon.stub(componentClass.prototype, 'componentDidUpdate');
        // sinon.stub(componentClass.prototype, 'componentWillUnmount');
    });

    afterEach(() => {
        renderStub.restore();
        componentClass.propTypes = originalPropTypes;
    });
};

describe('ClinicalInformationContainerUnconnected', () => {
    let comp, props, buildTabsStub;

    before(() => {

        props = {

            loadClinicalInformationTableData: sinon.stub(),
            setTab: sinon.stub(),

        };

        stubComponent(ClinicalInformationPatientTable);
        stubComponent(PDXTree);
        stubComponent(FixedDataTableExample);


        comp = mount(<ClinicalInformationContainerUnconnected {...props} />);
    });

    it('it calls data load routine on mounting', () => {
        assert.isTrue(props.loadClinicalInformationTableData.calledOnce);
    });

    it('has a spinner when in status is fetching', () => {
        assert.isFalse(comp.contains(<Spinner />));

        comp.setProps({ status: 'fetching' });

        assert.isTrue(comp.find('.spinner').length > 0);

        assert.isTrue(comp.contains(<Spinner />));
    });

    it('calls buildTabs when status is "complete" ', () => {
        buildTabsStub = sinon.stub(ClinicalInformationContainerUnconnected.prototype, 'buildTabs');

        assert.isFalse(buildTabsStub.called);

        comp.setProps({ status: 'complete' });

        assert.isTrue(buildTabsStub.called);

        buildTabsStub.restore();
    });

    after(() => {


    });
});
