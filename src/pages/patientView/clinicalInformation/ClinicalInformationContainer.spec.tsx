import React from 'react';
import { assert } from 'chai';
import { shallow, mount, ReactWrapper } from 'enzyme';
import sinon from 'sinon';
import ClinicalInformationContainer from './ClinicalInformationContainer';
import Spinner from 'react-spinkit';
import ClinicalInformationPatientTable from './ClinicalInformationPatientTable';
import PDXTree from './PDXTree';
import FixedDataTableExample from './ClinicalInformationSamplesTable';

const ComponentUnderTest = ClinicalInformationContainer;

function stubComponent(componentClass:React.ComponentClass<any>) {
    let originalPropTypes:React.ValidationMap<any> | undefined;

    let renderStub:sinon.SinonStub;

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

describe('ClinicalInformationContainer', () => {
    let comp:ReactWrapper<any, any>, props, buildTabsStub;

    before(() => {

        props = {

            loadClinicalInformationTableData: sinon.stub(),
            setTab: sinon.stub(),

        };

        stubComponent(ClinicalInformationPatientTable);
        //stubComponent(PDXTree);

        comp = mount(<ComponentUnderTest {...props} />);
    });


    it('has a spinner when in status is fetching', () => {
        assert.isFalse(comp.contains(<Spinner />));

        comp.setProps({ status: 'pending' });

        assert.isTrue(comp.find('.spinner').length > 0);

        assert.isTrue(comp.contains(<Spinner />));
    });

    it('calls buildTabs when status is "complete" ', () => {
        buildTabsStub = sinon.stub(ComponentUnderTest.prototype, 'buildTabs');

        assert.isFalse(buildTabsStub.called);

        comp.setProps({ status: 'complete' });

        assert.isTrue(buildTabsStub.called);

        buildTabsStub.restore();
    });

    after(() => {


    });
});
