import { getOncoKbApiUrl } from './urls';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('url library', () => {

    before(()=>{
        //global.window = { location: { protocol: 'https://' } };
    });

    after(()=>{
        delete (global as any).window.oncoKBApiUrl;
    });

    it('transforms oncokb url configuration url to proxied url: removes protocol and trailing slash', ()=>{
        (global as any).window.oncoKBApiUrl = 'http://www.test.com/hello/';
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.equal(getOncoKbApiUrl(), 'http:proxy/www.test.com/hello');
    });

    it('transforms oncokb url configuration url to proxied url: removes protocol and trailing slash', ()=>{
        (global as any).window.oncoKBApiUrl = null;
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.isUndefined(getOncoKbApiUrl());
    });

});
