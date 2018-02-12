import * as React from 'react';
import { RouterProps } from 'react-router';
import { expect } from 'chai';
import { shallow, ShallowWrapper } from 'enzyme';

import App from './App';
import {IAppProps} from "./App";

const App_any = App as any;

describe('<App />', () => {
    let wrapper:ShallowWrapper<any, any>;
    const history = {};

    beforeEach(() => {
        wrapper = shallow(<App_any history={history} />);
    });

    it('has a Router component', () => {
        expect(wrapper.find('Router')).to.have.length(1);
    });

    it('passes a history prop', () => {
        const props = wrapper.find('Router').props() as RouterProps;

        expect(props.history).to.exist;
    });
});
