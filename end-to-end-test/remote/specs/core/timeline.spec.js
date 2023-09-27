const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    checkElementWithMouseDisabled,
} = require('../../../shared/specUtils');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('clinical timeline', () => {
    beforeEach(() => {
        const url = `${CBIOPORTAL_URL}/patient/summary?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013`;
        goToUrlAndSetLocalStorage(url);
    });

    it('timeline displays on load', () => {
        $('.tl-timeline-svg').waitForDisplayed();
        const res = checkElementWithMouseDisabled('.tl-timeline-wrapper');
        assertScreenShotMatch(res);
    });

    it('timeline rows collapse when caret clicked', () => {
        $('.tl-timeline-svg').waitForDisplayed();

        assert.equal($$('.tl-timeline-tracklabels > div').length, 15);

        $$('.tl-timeline-wrapper .fa-caret-down')[1].click();

        assert.equal($$('.tl-timeline-tracklabels > div').length, 6);
        const res = checkElementWithMouseDisabled('.tl-timeline-wrapper');
        assertScreenShotMatch(res);

        // now restore it
        $$('.tl-timeline-wrapper .fa-caret-right')[0].click();

        assert.equal($$('.tl-timeline-tracklabels > div').length, 15);
    });

    it('timeline zooms in on drag and drop', () => {
        $('.tl-timeline-svg').waitForDisplayed();

        const moo = $$('.tl-timelineviewport text').find(t =>
            t.getHTML().includes('>0<')
        );

        // this doesn't work too well
        moo.dragAndDrop({ x: 300, y: 0, duration: 10000 }, 10000);

        $('body').moveTo({ x: 0, y: 0 });

        const res = checkElementWithMouseDisabled('.tl-timeline-wrapper');
    });
});
