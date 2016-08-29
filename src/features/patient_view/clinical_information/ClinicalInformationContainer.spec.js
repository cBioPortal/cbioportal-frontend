import React from 'react';
import {assert} from 'chai';
import {shallow, mount} from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import {default as reducer, actionTypes} from './duck';
import ClinicalInformationContainer from './ClinicalInformationContainer';

const mockData = {

    patient: [
        ['OS_MONTHS', '58'],
        ['AGE', '28'],
        ['OS_STATUS', 'DECEASED'],
        ['GENDER', 'Male'],
        ['CANCER_TYPE', 'Glioma']
    ],
    samples: [
        ['anti_O_viverrini_IgG', 'Negative'], ['Anatomical Subtype', 'Extrahepatic']
    ],
    nodes: {
        "name": "Top Node",
        "label": "1",
        "children": [
            {
                "name": "Bob: Child of Top Node",
                "label": "1.1",
                "parent": "Top Node",
                "children": [
                    {
                        "name": "Son of Bob",
                        "label": "1.1.1",
                        "parent": "Bob: Child of Top Node"
                    },
                    {
                        "name": "Daughter of Bob",
                        "label": "1.1.2",
                        "parent": "Bob: Child of Top Node"
                    }
                ]
            },
            {
                "name": "Sally: Child of Top Node",
                "label": "1.2",
                "parent": "Top Node",
                "children": [
                    {
                        "name": "Son of Sally",
                        "label": "1.2.1",
                        "parent": "Sally: Child of Top Node"
                    },
                    {
                        "name": "Daughter of Sally",
                        "label": "1.2.2",
                        "parent": "Sally: Child of Top Node"
                    },
                    {
                        "name": "Daughter #2 of Sally",
                        "label": "1.2.3",
                        "parent": "Sally: Child of Top Node",
                        "children": [
                            {
                                "name": "Daughter of Daughter #2 of Sally",
                                "label": "1.2.3.1",
                                "parent": "Daughter #2 of Sally"
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Dirk: Child of Top Node",
                "label": "1.3",
                "parent": "Top Node",
                "children": [
                    {
                        "name": "Son of Dirk",
                        "label": "1.3.1",
                        "parent": "Dirk: Child of Top Node"
                    },
                ]
            }
        ]
    }
};


describe('', () => {

    it('dispatches on mounting', ()=> {

        const getDispatcherStub = sinon.stub(ClinicalInformationContainer.prototype, 'componentDidMount');

        const store = Immutable.fromJS({clinical_information: {status: 'fetching'}});

        const getStoreStateStub = sinon.stub(ClinicalInformationContainer.prototype, 'getStoreState', ()=>store);

        const wrapper = mount(<ClinicalInformationContainer />);

        assert.isTrue(getDispatcherStub.called);

        console.log(getDispatcherStub.args[0]);

        getDispatcherStub.restore();

        getStoreStateStub.restore();

    });


});
