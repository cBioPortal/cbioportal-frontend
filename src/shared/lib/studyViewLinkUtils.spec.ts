import { getServerConfig } from 'config/config';
import { canLinkToStudyView } from './studyViewLinkUtils';

describe('canLinkToStudyView', () => {
    const originalShowUnauthorizedStudies = getServerConfig()
        .skin_home_page_show_unauthorized_studies;

    afterEach(() => {
        getServerConfig().skin_home_page_show_unauthorized_studies = originalShowUnauthorizedStudies;
    });

    it('does not allow unauthorized studies when unauthorized studies are shown', () => {
        getServerConfig().skin_home_page_show_unauthorized_studies = true;

        expect(canLinkToStudyView(true)).toBe(true);
        expect(canLinkToStudyView(false)).toBe(false);
        expect(canLinkToStudyView(undefined)).toBe(false);
    });

    it('keeps legacy behavior when unauthorized studies are hidden', () => {
        getServerConfig().skin_home_page_show_unauthorized_studies = false;

        expect(canLinkToStudyView(true)).toBe(true);
        expect(canLinkToStudyView(false)).toBe(false);
        expect(canLinkToStudyView(undefined)).toBe(true);
    });
});
