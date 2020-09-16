var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;
var studyViewUrl = require('./group-color-chooser').studyViewUrl;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;

describe('color chooser for comparison groups feature', () => {
    describe('study view', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(studyViewUrl);
        });
    });
});
