import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { default as reducer, actionTypes } from './duck';
import { ClinicalInformationContainerUnconnected } from './ClinicalInformationContainer';
import Spinner from 'react-spinkit';
import * as $ from 'jquery';
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

const mockData = {

    patient: [
        ['OS_MONTHS', '58'],
        ['AGE', '28'],
        ['OS_STATUS', 'DECEASED'],
        ['GENDER', 'Male'],
        ['CANCER_TYPE', 'Glioma'],
    ],
    samples: [
        ['anti_O_viverrini_IgG', 'Negative'], ['Anatomical Subtype', 'Extrahepatic'],
    ],
    nodes: {
        'name': 'Top Node',
        'label': '1',
        'children': [
            {
                'name': 'Bob: Child of Top Node',
                'label': '1.1',
                'parent': 'Top Node',
                'children': [
                    {
                        'name': 'Son of Bob',
                        'label': '1.1.1',
                        'parent': 'Bob: Child of Top Node',
                    },
                    {
                        'name': 'Daughter of Bob',
                        'label': '1.1.2',
                        'parent': 'Bob: Child of Top Node',
                    },
                ],
            },
            {
                'name': 'Sally: Child of Top Node',
                'label': '1.2',
                'parent': 'Top Node',
                'children': [
                    {
                        'name': 'Son of Sally',
                        'label': '1.2.1',
                        'parent': 'Sally: Child of Top Node',
                    },
                    {
                        'name': 'Daughter of Sally',
                        'label': '1.2.2',
                        'parent': 'Sally: Child of Top Node',
                    },
                    {
                        'name': 'Daughter #2 of Sally',
                        'label': '1.2.3',
                        'parent': 'Sally: Child of Top Node',
                        'children': [
                            {
                                'name': 'Daughter of Daughter #2 of Sally',
                                'label': '1.2.3.1',
                                'parent': 'Daughter #2 of Sally',
                            },
                        ],
                    },
                ],
            },
            {
                'name': 'Dirk: Child of Top Node',
                'label': '1.3',
                'parent': 'Top Node',
                'children': [
                    {
                        'name': 'Son of Dirk',
                        'label': '1.3.1',
                        'parent': 'Dirk: Child of Top Node',
                    },
                ],
            },
        ],
    },
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
