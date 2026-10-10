import { createMemoryHistory, MemoryHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import PatientViewUrlWrapper, {
    pathologySlideSettingsBackwardsCompatibility,
} from './PatientViewUrlWrapper';

const NESTED_LINK =
    '/patient/wsiHESlides?studyId=mskimpact&caseId=P-0000024' +
    '&sampleId=P-0000024-T01-IM3' +
    '&pathologySlideSettings=%7B%22stainFilter%22%3A%22hne%22%2C' +
    '%22matchLevel%22%3A%22PART%22%2C%22specimenKey%22%3A%22part%3A%3A1%22%7D';

const LEGACY_LINK =
    '/patient/wsiHESlides?studyId=mskimpact&caseId=P-0000024' +
    '&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A1' +
    '&sampleId=P-0000024-T01-IM3';

const SCOPE = {
    stainFilter: 'hne',
    matchLevel: 'PART',
    specimenKey: 'part::1',
};

describe('PatientViewUrlWrapper pathologySlideSettings', () => {
    let routing: ExtendedRouterStore;
    let history: MemoryHistory;
    let wrapper: PatientViewUrlWrapper | undefined;

    function open(url: string) {
        history.push(url);
        wrapper = wrapper || new PatientViewUrlWrapper(routing);
        return wrapper;
    }

    beforeEach(() => {
        routing = new ExtendedRouterStore();
        history = createMemoryHistory();
        syncHistoryWithStore(history, routing);
        wrapper = undefined;
    });

    afterEach(() => {
        wrapper?.destroy();
    });

    it('reads the nested node', () => {
        const urlWrapper = open(NESTED_LINK);
        expect(urlWrapper.pathologySlideScope).toEqual(SCOPE);
        expect(urlWrapper.query.pathologySlideSettings).toEqual(SCOPE);
        expect(urlWrapper.query.sampleId).toBe('P-0000024-T01-IM3');
    });

    it('falls back to legacy top-level params', () => {
        const urlWrapper = open(LEGACY_LINK);
        expect(urlWrapper.pathologySlideScope).toEqual(SCOPE);
        expect(urlWrapper.query.sampleId).toBe('P-0000024-T01-IM3');
    });

    it('reads a partial legacy link', () => {
        const urlWrapper = open(
            '/patient/wsiHESlides?studyId=s&caseId=p&stainFilter=ihc'
        );
        expect(urlWrapper.pathologySlideScope).toEqual({
            stainFilter: 'ihc',
            matchLevel: undefined,
            specimenKey: undefined,
        });
    });

    it('has an empty scope when neither form is present', () => {
        const urlWrapper = open('/patient/wsiHESlides?studyId=s&caseId=p');
        expect(urlWrapper.pathologySlideScope).toEqual({
            stainFilter: undefined,
            matchLevel: undefined,
            specimenKey: undefined,
        });
    });

    it('prefers the nested node over legacy params', () => {
        const urlWrapper = open(
            `${NESTED_LINK}&stainFilter=ihc&matchLevel=BLOCK`
        );
        expect(urlWrapper.pathologySlideScope).toEqual(SCOPE);
    });

    it('follows navigation between link forms', () => {
        const urlWrapper = open(LEGACY_LINK);
        history.push(
            '/patient/wsiHESlides?studyId=s&caseId=p' +
                '&pathologySlideSettings=%7B%22stainFilter%22%3A%22ihc%22%7D'
        );
        expect(urlWrapper.pathologySlideScope.stainFilter).toBe('ihc');
        expect(urlWrapper.pathologySlideScope.matchLevel).toBeUndefined();
        history.push(LEGACY_LINK);
        expect(urlWrapper.pathologySlideScope).toEqual(SCOPE);
        history.push('/patient/wsiHESlides?studyId=s&caseId=p');
        expect(urlWrapper.pathologySlideScope.stainFilter).toBeUndefined();
    });

    it('reads the stain filter from a study view slide table link', () => {
        // The link the study view slide table builds (withSlideStainFilter):
        // patient/wsiHESlides?...&pathologySlideSettings={"stainFilter":"ihc"}
        const params = new URLSearchParams({
            studyId: 's',
            caseId: 'p',
        });
        params.set(
            'pathologySlideSettings',
            JSON.stringify({ stainFilter: 'ihc' })
        );
        const urlWrapper = open(`/patient/wsiHESlides?${params.toString()}`);
        expect(urlWrapper.activeTabId).toBe('wsiHESlides');
        expect(urlWrapper.pathologySlideScope).toEqual({
            stainFilter: 'ihc',
        });
    });

    it('reads the sample from a study view sample link', () => {
        const params = new URLSearchParams({
            sampleId: 'P-1-T01',
            studyId: 's',
        });
        params.set(
            'pathologySlideSettings',
            JSON.stringify({ stainFilter: 'hne' })
        );
        const urlWrapper = open(`/patient/wsiHESlides?${params.toString()}`);
        expect(urlWrapper.query.sampleId).toBe('P-1-T01');
        expect(urlWrapper.pathologySlideScope).toEqual({
            stainFilter: 'hne',
        });
    });

    it('writes the node as one JSON-encoded param', () => {
        const urlWrapper = open('/patient/wsiHESlides?studyId=s&caseId=p');
        urlWrapper.updateURL({
            pathologySlideSettings: { stainFilter: 'ihc' },
        });
        expect(routing.query.pathologySlideSettings).toBe(
            JSON.stringify({ stainFilter: 'ihc' })
        );
        expect(urlWrapper.pathologySlideScope.stainFilter).toBe('ihc');
    });
});

describe('pathologySlideSettingsBackwardsCompatibility', () => {
    it('folds legacy params into the node', () => {
        const mapped = pathologySlideSettingsBackwardsCompatibility({
            studyId: 's',
            stainFilter: 'hne',
            matchLevel: '',
            specimenKey: 'part::1',
        });
        expect(mapped.studyId).toBe('s');
        expect(JSON.parse(mapped.pathologySlideSettings!)).toEqual({
            stainFilter: 'hne',
            specimenKey: 'part::1',
        });
    });

    it('leaves a query with the node, or without legacy params, alone', () => {
        const nested = {
            pathologySlideSettings: '{}',
            stainFilter: 'hne',
        };
        expect(pathologySlideSettingsBackwardsCompatibility(nested)).toBe(
            nested
        );
        const plain = { studyId: 's' };
        expect(pathologySlideSettingsBackwardsCompatibility(plain)).toBe(plain);
    });
});
