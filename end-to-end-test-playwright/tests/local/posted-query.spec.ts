// Source: end-to-end-test/local/specs/core/postedquery.spec.js
import { test, expect } from '../../fixtures';
import { Page } from '@playwright/test';
import { goToUrlAndSetLocalStorage, keycloakLogin } from './helpers';
import { byTestHandle } from '../helpers/common';
import { waitForOncoprint } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

async function postDataToUrl(
    page: Page,
    url: string,
    data: Record<string, string>,
    authenticated = true
) {
    // form.submit() is fire-and-forget — evaluate resolves before the
    // navigation starts. Race the eval with waitForURL so the next
    // assertion lands on the post-submit document.
    await Promise.all([
        page.waitForURL(u => u.toString().startsWith(url), {
            waitUntil: 'load',
            timeout: 30000,
        }),
        page.evaluate(
            ({ url, data }: { url: string; data: Record<string, string> }) => {
                const form = document.createElement('form');
                form.setAttribute('method', 'post');
                form.setAttribute('action', url);
                form.setAttribute('target', '_self');
                for (const key of Object.keys(data)) {
                    const hiddenField = document.createElement('input');
                    hiddenField.setAttribute('type', 'hidden');
                    hiddenField.setAttribute('name', key);
                    hiddenField.setAttribute('value', data[key]);
                    form.appendChild(hiddenField);
                }
                document.body.appendChild(form);
                form.submit();
            },
            { url, data }
        ),
    ]);
    if (authenticated) await keycloakLogin(page, 10000);
}

test.describe('posting query parameters (instead of GET) to query page', () => {
    test('reads posted data (written by backend) and successfully passes params into URL, resulting in oncoprint display', async ({
        page,
    }) => {
        const url = `${CBIOPORTAL_URL}`;
        await goToUrlAndSetLocalStorage(page, url, true);

        const query: Record<string, string> = {
            gene_list: 'CDKN2A MDM2 MDM4 TP53',
            cancer_study_list: 'study_es_0',
            case_set_id: 'study_es_0_cnaseq',
            profileFilter: '0',
            RPPA_SCORE_THRESHOLD: '2.0',
            Z_SCORE_THRESHOLD: '2.0',
            genetic_profile_ids_PROFILE_MUTATION_EXTENDED:
                'study_es_0_mutations',
            genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION:
                'study_es_0_gistic',
        };

        await postDataToUrl(page, `${url}/results`, query);

        await page.waitForFunction(q => {
            const u = location.href;
            return Object.entries(q).every(([key, item]) => {
                if (key === 'gene_list') {
                    return u.includes(
                        `${key}=${encodeURIComponent(
                            encodeURIComponent(item as string)
                        )}`
                    );
                }
                return u.includes(
                    `${key}=${encodeURIComponent(item as string)}`
                );
            });
        }, query);

        const postData = await page.evaluate(() => (window as any).postData);
        expect(postData).toBeNull();

        await waitForOncoprint(page);
    });
});

test.describe(
    'Post Data for StudyView Filtering with filterJson via HTTP Post',
    () => {
        test('Verify PatientIdentifier Filter via postData', async ({
            page,
        }) => {
            const filterJsonQuery: Record<string, string> = {
                filterJson:
                    '{"patientIdentifiers":[{"studyId":"lgg_ucsf_2014_test_generic_assay","patientId":"P01"}]}',
            };

            const NUMBER_OF_PATIENTS_AFTER_FILTER = '1';

            await goToUrlAndSetLocalStorage(page, `${CBIOPORTAL_URL}`, true);

            await postDataToUrl(
                page,
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                filterJsonQuery
            );

            await byTestHandle(page, 'selected-patients').waitFor({
                state: 'attached',
                timeout: 20000,
            });

            expect(
                await byTestHandle(page, 'selected-patients').innerText()
            ).toBe(NUMBER_OF_PATIENTS_AFTER_FILTER);
        });
    }
);
