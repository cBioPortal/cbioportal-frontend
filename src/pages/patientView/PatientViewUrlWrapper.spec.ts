import { createMemoryHistory, MemoryHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';

const NESTED_LINK =
    '/patient/wsiHESlides?studyId=mskimpact&caseId=P-0000024' +
    '&sampleId=P-0000024-T01-IM3' +
    '&pathologySlideSettings=%7B%22stainFilter%22%3A%22hne%22%2C' +
    '%22matchLevel%22%3A%22PART%22%2C%22specimenKey%22%3A%22part%3A%3A1%22%7D';

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

    it('ignores top-level scope params', () => {
        const urlWrapper = open(
            '/patient/wsiHESlides?studyId=s&caseId=p&stainFilter=ihc'
        );
        expect(urlWrapper.pathologySlideScope.stainFilter).toBeUndefined();
    });

    it('has an empty scope without the node', () => {
        const urlWrapper = open('/patient/wsiHESlides?studyId=s&caseId=p');
        expect(urlWrapper.pathologySlideScope).toEqual({
            stainFilter: undefined,
            matchLevel: undefined,
            specimenKey: undefined,
        });
    });

    it('follows navigation between links', () => {
        const urlWrapper = open(NESTED_LINK);
        history.push(
            '/patient/wsiHESlides?studyId=s&caseId=p' +
                '&pathologySlideSettings=%7B%22stainFilter%22%3A%22ihc%22%7D'
        );
        expect(urlWrapper.pathologySlideScope.stainFilter).toBe('ihc');
        expect(urlWrapper.pathologySlideScope.matchLevel).toBeUndefined();
        history.push(NESTED_LINK);
        expect(urlWrapper.pathologySlideScope).toEqual(SCOPE);
        history.push('/patient/wsiHESlides?studyId=s&caseId=p');
        expect(urlWrapper.pathologySlideScope.stainFilter).toBeUndefined();
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
