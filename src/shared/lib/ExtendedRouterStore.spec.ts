import ExtendedRouterStore from './ExtendedRouterStore';
import { assert } from 'chai';
import * as React from 'react';
import * as _ from 'lodash';
import * as $ from 'jquery';
import * as sinon from 'sinon';

describe('test',()=>{

    let mockInstance: any;

    beforeEach(()=>{
        mockInstance = {
            query: { param1:1, param2:2, param3: 3 },
            push:sinon.stub(),
            location: { pathname: '/patient' }
        };
    });

    after(()=>{

    });


    it ('router store updateroute method deletes parameters, alters existing params and adds new ones', ()=>{

        ExtendedRouterStore.prototype.updateRoute.call(mockInstance,{
            param1:undefined,
            param2:'altered',
            param3:'new'
        });

        assert.equal(mockInstance.push.args[0][0], '/patient?param2=altered&param3=new');

    });

    it ('router store updateroute method updates path if one is passed, otherwise, retains existing path', ()=>{

        mockInstance.location.pathname = 'donkey';

        ExtendedRouterStore.prototype.updateRoute.call(mockInstance,{
            param1:undefined,
            param2:'altered',
            param3:'new'
        });

        assert.equal(mockInstance.push.args[0][0], '/donkey?param2=altered&param3=new');

        ExtendedRouterStore.prototype.updateRoute.call(mockInstance,{
            param2:'a',
            param3:'b'
        }, 'one/two');

        assert.equal(mockInstance.push.args[1][0], '/one/two?param1=1&param2=a&param3=b');

    });

});
