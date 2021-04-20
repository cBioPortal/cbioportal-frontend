var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var executeInBrowser = require('../../shared/specUtils').executeInBrowser;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('homepage', function() {
    this.retries(2);

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

    it('test login observes authenticationMethod config property', function() {
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

    it('test login observes authenticationMethod config property', function() {
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

        var test = browser.execute(function() {
            return (
                $("img[src='images/msk_logo_transparent_black.png']").length ===
                0
            );
        });

        assert.equal(test.value, true);

        setServerConfiguration({
            skin_right_logo: 'msk_logo_transparent_black.png',
        });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#rightHeaderContent').waitForExist();

        assert(
            executeInBrowser(() => {
                return (
                    $("img[src='images/msk_logo_transparent_black.png']")
                        .length > 0
                );
            })
        );
    });

    it('shows skin_blurb as configured', function() {
        setServerConfiguration({
            skin_blurb: "<div id='blurbDiv'>This is the blurb</div>",
        });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('#blurbDiv').waitForExist();
    });
});

function setServerConfiguration(serverConfig) {
    browser.execute(function(_serverConfig) {
        this.localStorage.setItem(
            'frontendConfig',
            JSON.stringify({ serverConfig: _serverConfig })
        );
    }, serverConfig);
}
