// Source: end-to-end-test/local/specs/init-columns-in-mutation-tables.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const resultsViewUrl = `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_all&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
const patientViewUrl = `${CBIOPORTAL_URL}/patient?sampleId=TEST_SAMPLE_SOMATIC_HOMOZYGOUS&studyId=study_es_0`;

const DEFAULT_RESULT_COLS = {
    SAMPLE_ID: 'Sample ID',
    PROTEIN_CHANGE: 'Protein Change',
    ANNOTATION: 'Annotation',
    MUTATION_TYPE: 'Mutation Type',
    COPY_NUM: 'Copy #',
    NUM_MUT_IN_SAMPLE: '# Mut in Sample',
};

const DEFAULT_PATIENT_COLS = {
    GENE: 'Gene',
    PROTEIN_CHANGE: 'Protein Change',
    ANNOTATION: 'Annotation',
    MUTATION_TYPE: 'Mutation Type',
    COPY_NUM: 'Copy #',
    COHORT: 'Cohort',
};

const headerLocator = (page: Page, text: string) =>
    page.locator(`xpath=//span[text() = '${text}']`);

async function isHeaderVisible(page: Page, text: string) {
    return await headerLocator(page, text).isVisible();
}

async function defaultResultColumnsAreDisplayed(page: Page) {
    return (
        (await isHeaderVisible(page, DEFAULT_RESULT_COLS.SAMPLE_ID)) &&
        (await isHeaderVisible(page, DEFAULT_RESULT_COLS.PROTEIN_CHANGE)) &&
        (await isHeaderVisible(page, DEFAULT_RESULT_COLS.ANNOTATION)) &&
        (await isHeaderVisible(page, DEFAULT_RESULT_COLS.MUTATION_TYPE)) &&
        (await isHeaderVisible(page, DEFAULT_RESULT_COLS.COPY_NUM)) &&
        (await isHeaderVisible(page, DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE)) &&
        !(await isHeaderVisible(page, 'Functional Impact')) &&
        !(await isHeaderVisible(page, 'Variant Type'))
    );
}

async function defaultPatientColumnsAreDisplayed(page: Page) {
    return (
        (await isHeaderVisible(page, DEFAULT_PATIENT_COLS.GENE)) &&
        (await isHeaderVisible(page, DEFAULT_PATIENT_COLS.PROTEIN_CHANGE)) &&
        (await isHeaderVisible(page, DEFAULT_PATIENT_COLS.ANNOTATION)) &&
        (await isHeaderVisible(page, DEFAULT_PATIENT_COLS.MUTATION_TYPE)) &&
        (await isHeaderVisible(page, DEFAULT_PATIENT_COLS.COPY_NUM)) &&
        (await isHeaderVisible(page, DEFAULT_PATIENT_COLS.COHORT)) &&
        !(await isHeaderVisible(page, 'Functional Impact')) &&
        !(await isHeaderVisible(page, 'Variant Type'))
    );
}

async function namespaceColumnsAreDisplayed(page: Page) {
    return (
        (await isHeaderVisible(page, 'Zygosity Code')) &&
        (await isHeaderVisible(page, 'Zygosity Name'))
    );
}

async function namespaceColumnsAreNotDisplayed(page: Page) {
    return !(
        (await isHeaderVisible(page, 'Zygosity Code')) &&
        (await isHeaderVisible(page, 'Zygosity Name'))
    );
}

async function columnIsDisplayed(page: Page, column: string) {
    return await isHeaderVisible(page, column);
}

async function columnIsNotDisplayed(page: Page, column: string) {
    return !(await isHeaderVisible(page, column));
}

async function waitForMutationTable(page: Page) {
    await expect(page.locator('[data-test=LazyMobXTable]')).toBeVisible();
}

async function waitForPatientViewMutationTable(page: Page) {
    await expect(
        page.locator('[data-test=patientview-mutation-table]')
    ).toBeVisible();
    await expect(page.locator('[data-test=LazyMobXTable]')).toBeVisible();
}

test.describe('default init columns in mutation tables', () => {
    test.describe('results view', () => {
        test('shows default columns when properties not set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                resultsViewUrl,
                true,
                {}
            );
            await waitForMutationTable(page);
            expect(await defaultResultColumnsAreDisplayed(page)).toBe(true);
            expect(await namespaceColumnsAreNotDisplayed(page)).toBe(true);
        });

        test('shows default and namespace columns when only namespace property set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                resultsViewUrl,
                true,
                {
                    skin_mutation_table_namespace_column_show_by_default: true,
                }
            );
            await waitForMutationTable(page);
            expect(await defaultResultColumnsAreDisplayed(page)).toBe(true);
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });

        test('shows selected columns when only selected property set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                resultsViewUrl,
                true,
                {
                    skin_results_view_mutation_table_columns_show_on_init:
                        'Sample ID,Protein Change',
                }
            );
            await waitForMutationTable(page);
            expect(
                await columnIsDisplayed(page, DEFAULT_RESULT_COLS.SAMPLE_ID)
            ).toBe(true);
            expect(
                await columnIsDisplayed(
                    page,
                    DEFAULT_RESULT_COLS.PROTEIN_CHANGE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_RESULT_COLS.ANNOTATION)
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_RESULT_COLS.MUTATION_TYPE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_RESULT_COLS.COPY_NUM)
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE
                )
            ).toBe(true);
            expect(await columnIsNotDisplayed(page, 'Functional Impact')).toBe(
                true
            );
            expect(await columnIsNotDisplayed(page, 'Variant Type')).toBe(true);
            expect(await namespaceColumnsAreNotDisplayed(page)).toBe(true);
        });

        test('shows selected and namespace columns when both properties are set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                resultsViewUrl,
                true,
                {
                    skin_results_view_mutation_table_columns_show_on_init:
                        'Sample ID,Protein Change',
                    skin_mutation_table_namespace_column_show_by_default: true,
                }
            );
            await waitForMutationTable(page);
            expect(
                await columnIsDisplayed(page, DEFAULT_RESULT_COLS.SAMPLE_ID)
            ).toBe(true);
            expect(
                await columnIsDisplayed(
                    page,
                    DEFAULT_RESULT_COLS.PROTEIN_CHANGE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_RESULT_COLS.MUTATION_TYPE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_RESULT_COLS.COPY_NUM)
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE
                )
            ).toBe(true);
            expect(await columnIsNotDisplayed(page, 'Functional Impact')).toBe(
                true
            );
            expect(await columnIsNotDisplayed(page, 'Variant Type')).toBe(true);
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });
    });

    test.describe('patient view', () => {
        test('shows default columns when properties not set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {}
            );
            await waitForPatientViewMutationTable(page);
            expect(await defaultPatientColumnsAreDisplayed(page)).toBe(true);
            expect(await namespaceColumnsAreNotDisplayed(page)).toBe(true);
        });

        test('shows default and namespace columns when only namespace property set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {
                    skin_mutation_table_namespace_column_show_by_default: true,
                }
            );
            await waitForPatientViewMutationTable(page);
            expect(await defaultPatientColumnsAreDisplayed(page)).toBe(true);
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });

        test('shows selected columns when only selected property set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {
                    skin_patient_view_mutation_table_columns_show_on_init:
                        'Gene,Protein Change',
                }
            );
            await waitForPatientViewMutationTable(page);
            expect(
                await columnIsDisplayed(page, DEFAULT_PATIENT_COLS.GENE)
            ).toBe(true);
            expect(
                await columnIsDisplayed(
                    page,
                    DEFAULT_PATIENT_COLS.PROTEIN_CHANGE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_PATIENT_COLS.ANNOTATION
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_PATIENT_COLS.MUTATION_TYPE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_PATIENT_COLS.COPY_NUM)
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_PATIENT_COLS.COHORT)
            ).toBe(true);
            expect(await columnIsNotDisplayed(page, 'Functional Impact')).toBe(
                true
            );
            expect(await columnIsNotDisplayed(page, 'Variant Type')).toBe(true);
            expect(await namespaceColumnsAreNotDisplayed(page)).toBe(true);
        });

        test('shows selected and namespace columns when both properties are set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {
                    skin_patient_view_mutation_table_columns_show_on_init:
                        'Gene,Protein Change',
                    skin_mutation_table_namespace_column_show_by_default: true,
                }
            );
            await waitForPatientViewMutationTable(page);
            expect(
                await columnIsDisplayed(page, DEFAULT_PATIENT_COLS.GENE)
            ).toBe(true);
            expect(
                await columnIsDisplayed(
                    page,
                    DEFAULT_PATIENT_COLS.PROTEIN_CHANGE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_PATIENT_COLS.ANNOTATION
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(
                    page,
                    DEFAULT_PATIENT_COLS.MUTATION_TYPE
                )
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_PATIENT_COLS.COPY_NUM)
            ).toBe(true);
            expect(
                await columnIsNotDisplayed(page, DEFAULT_PATIENT_COLS.COHORT)
            ).toBe(true);
            expect(await columnIsNotDisplayed(page, 'Functional Impact')).toBe(
                true
            );
            expect(await columnIsNotDisplayed(page, 'Variant Type')).toBe(true);
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });
    });
});
