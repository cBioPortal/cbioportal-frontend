import { getOncoKbApiUrl } from './urls';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import AppConfig from 'appConfig';

describe('url library', () => {

    before(()=>{
        //global.window = { location: { protocol: 'https://' } };
    });

    after(()=>{
        delete AppConfig.oncoKBApiUrl;
    });

    it('transforms oncokb url configuration url to proxied url: removes protocol and trailing slash', ()=>{
        AppConfig.oncoKBApiUrl = 'http://www.test.com/hello/';
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.equal(getOncoKbApiUrl(), 'http:proxy/www.test.com/hello');
    });

    it('transforms oncokb url configuration url to proxied url: removes protocol and trailing slash', ()=>{
        AppConfig.oncoKBApiUrl = undefined;
        // note that this is WRONG (http: should be followed by double shlash)
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.isUndefined(getOncoKbApiUrl());
    });

});
