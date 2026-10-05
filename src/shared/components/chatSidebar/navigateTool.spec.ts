import { assert } from 'chai';
import { normalizeBasePath, toPortalRoute } from './navigateTool';

const ALIASES = ['www.cbioportal.org', 'cbioportal.org'];
const FILTER_HASH = '#filterJson=%7B%22studyIds%22%3A%5B%22brca_tcga%22%5D%7D';

describe('navigateTool', () => {
    describe('toPortalRoute at the host root', () => {
        const portal = {
            origin: 'https://beta.cbioportal.org',
            basePath: '',
            aliases: ALIASES,
        };

        it('keeps path, query and hash of alias-host links', () => {
            assert.equal(
                toPortalRoute(
                    `https://www.cbioportal.org/study/summary?id=brca_tcga${FILTER_HASH}`,
                    portal
                ),
                `/study/summary?id=brca_tcga${FILTER_HASH}`
            );
            assert.equal(
                toPortalRoute(
                    'https://cbioportal.org/patient?studyId=s&caseId=P1#navCaseIds=s:P1,s:P2',
                    portal
                ),
                '/patient?studyId=s&caseId=P1#navCaseIds=s:P1,s:P2'
            );
        });

        it('accepts same-origin and relative URLs', () => {
            assert.equal(
                toPortalRoute(
                    'https://beta.cbioportal.org/results?session_id=abc',
                    portal
                ),
                '/results?session_id=abc'
            );
            assert.equal(toPortalRoute('/datasets', portal), '/datasets');
            assert.equal(
                toPortalRoute('https://www.cbioportal.org', portal),
                '/'
            );
        });

        it('rejects other hosts', () => {
            assert.isNull(
                toPortalRoute('https://genie.cbioportal.org/study?id=x', portal)
            );
            assert.isNull(
                toPortalRoute('https://pubmed.ncbi.nlm.nih.gov/123', portal)
            );
            assert.isNull(toPortalRoute('//evil.com/study?id=x', portal));
        });

        it('rejects paths the app does not route', () => {
            assert.isNull(
                toPortalRoute('https://www.cbioportal.org/api/studies', portal)
            );
            assert.isNull(toPortalRoute('/login', portal));
        });
    });

    describe('toPortalRoute under a base path', () => {
        const portal = {
            origin: 'https://inst.org',
            basePath: '/cbioportal',
            aliases: ALIASES,
        };

        it('strips the base path from same-origin URLs', () => {
            assert.equal(
                toPortalRoute('https://inst.org/cbioportal/study?id=x', portal),
                '/study?id=x'
            );
        });

        it('takes relative and alias-host paths as portal paths', () => {
            assert.equal(toPortalRoute('/study?id=x', portal), '/study?id=x');
            assert.equal(
                toPortalRoute('https://www.cbioportal.org/study?id=x', portal),
                '/study?id=x'
            );
        });

        it('rejects same-origin URLs outside the base path', () => {
            assert.isNull(toPortalRoute('https://inst.org/other', portal));
        });
    });

    describe('normalizeBasePath', () => {
        it('normalizes to a leading slash and no trailing slash', () => {
            assert.equal(normalizeBasePath(undefined), '');
            assert.equal(normalizeBasePath('/'), '');
            assert.equal(normalizeBasePath('cbioportal/'), '/cbioportal');
            assert.equal(normalizeBasePath('/cbioportal'), '/cbioportal');
        });
    });
});
