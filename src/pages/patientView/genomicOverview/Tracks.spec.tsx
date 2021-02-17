import * as React from 'react';
import Tracks from './Tracks';
import { assert } from 'chai';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import sinon from 'sinon';

Enzyme.configure({ adapter: new Adapter() });

describe('Tracks', () => {
    // it('', ()=>{
    //
    //     const wrapper = mount(<Tracks data={mockData} />);
    //     //console.log(mockData);
    //
    //
    //
    // })
});
