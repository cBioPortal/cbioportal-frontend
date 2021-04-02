var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var executeInBrowser = require('../../shared/specUtils').executeInBrowser;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var setServerConfiguration = require('../../shared/specUtils')
    .setServerConfiguration;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('homepage', function() {
    this.retries(0);

    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.execute(function() {
            this.localStorage.setItem('frontendConfig', '{}');
        });
    });

    afterEach(() => {
        browser.execute(function() {
            this.localStorage.setItem(
                'frontendConfig',
                JSON.stringify({ serverConfig: {} })
            );
        });
    });

    it('login ui observes authenticationMethod', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        $('button=Login').isExisting();

        browser.execute(function() {
            this.localStorage.setItem(
                'frontendConfig',
                JSON.stringify({
                    serverConfig: { authenticationMethod: null },
                })
            );
        });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        assert.equal($('button=Login').isExisting(), false);
    });

    it('dataset nav observes authenticationMethod', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        $('a=Data Sets').isExisting();

        setServerConfiguration({ skin_show_data_tab: false });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        assert.equal($('a=Data Sets').isExisting(), false);
    });

    it('shows right logo in header bar depending on skin_right_logo', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        browser.pause(1000);
        let doesLogoExist = browser.execute(function() {
            return (
                $("img[src='images/msk_logo_transparent_black.png']").length > 0
            );
        });

        assert(!doesLogoExist);

        setServerConfiguration({
            skin_right_logo: 'msk_logo_transparent_black.png',
        });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        // this logo now exists
        $("img[src*='images/msk_logo_transparent_black.png']").waitForExist();
    });

    it('shows skin_blurb as configured', function() {
        setServerConfiguration({
            skin_blurb: "<div id='blurbDiv'>This is the blurb</div>",
        });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#blurbDiv').waitForExist();
    });
});
