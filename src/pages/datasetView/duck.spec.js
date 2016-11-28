/**
 * Created by jiaojiao on 10/19/16.
 */
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import { default as reducer, actionTypes, actionCreators} from './duck';
import { DataSetPageUnconnected } from './DataSetPage';

describe('DataSetPageUnconnected', () => {
    let comp, props;

    before(() => {

        props = {

            loadDatasetsInfo: sinon.stub()

        };

        comp = mount(<DataSetPageUnconnected {...props} />);
    });

    it('it load datasets info from API on mounting', () => {
        assert.isTrue(props.loadDatasetsInfo.calledOnce);
    });

    after(() => {


    });
});