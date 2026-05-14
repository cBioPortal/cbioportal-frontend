// Source: end-to-end-test/local/specs/core/resultsviewDisabledTabs.spec.js
import { test, expect } from '../../fixtures';
import { Page } from '@playwright/test';
import {
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
} from './helpers';
import { waitForOncoprint } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;

async function getResultsViewTabNames(page: Page): Promise<string[]> {
    const tabAnchors = page.locator('.nav-tabs .tabAnchor');
    const count = await tabAnchors.count();
    const tabs: string[] = [];
    for (let i = 0; i < count; i++) {
        const tab = tabAnchors.nth(i);
        if (await tab.isVisible()) {
            const classes = (await tab.getAttribute('class')) || '';
            if (!classes.includes('tabAnchor_oncoprint')) {
                const tabAnchorClass = classes
                    .split(' ')
                    .find((cls: string) => cls.startsWith('tabAnchor_'));
                if (tabAnchorClass) {
                    tabs.push(tabAnchorClass.split('_')[1]);
                }
            }
        }
    }
    return tabs;
}

test.describe('results view check possibility to disable tabs', () => {
    test('check that all tabs can be disabled', async ({ page }) => {
        await goToUrlAndSetLocalStorage(page, url, true);
        await waitForOncoprint(page);
        await expect(page.locator('.mainTabs')).toBeVisible();
        const tabs = await getResultsViewTabNames(page);

        let message = '';
        let allTabsCanBeDisabled = true;

        for (const tab of tabs) {
            await goToUrlAndSetLocalStorageWithProperty(page, url, true, {
                disabled_tabs: tab,
            });
            await expect(page.locator('.mainTabs')).toBeVisible();
            const tabAnchor = page.locator('.tabAnchor.tabAnchor_' + tab);
            if (
                (await tabAnchor.count()) > 0 &&
                (await tabAnchor.isVisible())
            ) {
                message += 'Tab ' + tab + ' could not be disabled; ';
                allTabsCanBeDisabled = false;
            }
        }
        expect(allTabsCanBeDisabled, message).toBe(true);
    });
});
