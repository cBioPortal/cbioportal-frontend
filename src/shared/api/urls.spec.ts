import { getOncoKbApiUrl } from './urls';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import AppConfig from 'appConfig';

describe('url library', () => {

    before(()=>{
        //global.window = { location: { protocol: 'https://' } };
        AppConfig.serverConfig.oncokb_public_api_url = 'http://www.test.com/hello/';
        AppConfig.apiRoot = 'http://www.cbioportal.org';
    });

    after(()=>{
        delete AppConfig.serverConfig.oncokb_public_api_url;
        delete AppConfig.apiRoot;
    });

    it('transforms oncokb url configuration url to proxied url: removes protocol and trailing slash', ()=>{

        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.equal(getOncoKbApiUrl(), 'http://www.cbioportal.org/proxy/www.test.com/hello');
    });

    it('transforms oncokb url configuration url to proxied url: removes protocol and trailing slash', ()=>{
        AppConfig.serverConfig.oncokb_public_api_url = null;
        // note that this is WRONG (http: should be followed by double shlash)
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.isUndefined(getOncoKbApiUrl());
    });

});
