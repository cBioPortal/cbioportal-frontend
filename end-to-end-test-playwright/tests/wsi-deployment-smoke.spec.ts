import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { test, expect } from '../fixtures';

/**
 * Smoke test for a deployed portal. This is deliberately opt-in: CI must set
 * WSI_DEPLOYMENT_SMOKE=1, LOCALDEV=0, CBIOPORTAL_URL and a release manifest.
 * The manifest contains every study included in the stack, so the test does
 * not silently validate one hand-picked patient while another study is empty.
 */
const enabled = process.env.WSI_DEPLOYMENT_SMOKE === '1';
const baseUrl = (process.env.CBIOPORTAL_URL ?? '').replace(/\/$/, '');
const focusedStudy = process.env.WSI_STUDY_ID ?? '';
const focusedPatient = process.env.WSI_PATIENT_ID ?? '';

type ReleaseStudy = { study_id: string; study_dir: string };

async function firstServablePatient(studyDir: string): Promise<string> {
    const directory = path.resolve(studyDir);
    const metadata = fs.readFileSync(
        path.join(directory, 'meta_wsi.txt'),
        'utf8'
    );
    const dataFilename = metadata
        .split(/\r?\n/)
        .map(line => line.match(/^\s*data_filename\s*:\s*(.+?)\s*$/)?.[1])
        .find(Boolean);
    if (!dataFilename)
        throw new Error(`missing data_filename in ${directory}/meta_wsi.txt`);
    const dataPath = path.resolve(directory, dataFilename);
    if (path.dirname(dataPath) !== directory)
        throw new Error('data_filename escapes study directory');
    const input = fs.createReadStream(dataPath, { encoding: 'utf8' });
    const reader = readline.createInterface({ input, crlfDelay: Infinity });
    let header: string[] | undefined;
    for await (const line of reader) {
        if (!line.trim() || line.startsWith('#')) continue;
        if (!header) {
            header = line.split('\t');
            if (
                !header.includes('PATIENT_ID') ||
                !header.includes('CAN_SERVE_TILES')
            ) {
                throw new Error(
                    'WSI source must contain PATIENT_ID and CAN_SERVE_TILES'
                );
            }
            continue;
        }
        const row = line.split('\t');
        const patient = row[header.indexOf('PATIENT_ID')]?.trim();
        const serves = row[header.indexOf('CAN_SERVE_TILES')]
            ?.trim()
            .toUpperCase();
        if (patient && ['TRUE', '1', 'YES'].includes(serves ?? '')) {
            reader.close();
            input.destroy();
            return patient;
        }
    }
    reader.close();
    input.destroy();
    throw new Error(`no servable patient in ${directory}`);
}

function studies(): ReleaseStudy[] {
    if (focusedStudy && focusedPatient)
        return [{ study_id: focusedStudy, study_dir: '' }];
    const manifestPath = process.env.STACK_STUDY_MANIFEST;
    if (!manifestPath) return [];
    const manifest = JSON.parse(
        fs.readFileSync(path.resolve(manifestPath), 'utf8')
    ) as {
        version?: number;
        studies?: ReleaseStudy[];
    };
    if (
        manifest.version !== 1 ||
        !Array.isArray(manifest.studies) ||
        !manifest.studies.length
    ) {
        throw new Error(
            'STACK_STUDY_MANIFEST must contain a non-empty version 1 studies array'
        );
    }
    const seen = new Set<string>();
    return manifest.studies.map(entry => {
        if (!entry?.study_id || !entry.study_dir || seen.has(entry.study_id)) {
            throw new Error(
                'manifest studies must have unique study_id and study_dir'
            );
        }
        seen.add(entry.study_id);
        return entry;
    });
}

const configuredStudies = enabled ? studies() : [];

test.describe('deployed WSI stack', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(
            !enabled || !baseUrl || !configuredStudies.length,
            'set WSI_DEPLOYMENT_SMOKE=1, LOCALDEV=0, CBIOPORTAL_URL and STACK_STUDY_MANIFEST'
        );
        test.skip(
            process.env.LOCALDEV !== '0',
            'LOCALDEV=0 is required for deployed smoke tests'
        );

        // The value is supplied by the deployment runner; never commit a token.
        const rawCookie = process.env.WSI_SESSION_COOKIE;
        if (rawCookie) {
            const separator = rawCookie.indexOf('=');
            const name =
                separator > 0 ? rawCookie.slice(0, separator) : 'SESSION';
            const value =
                separator > 0 ? rawCookie.slice(separator + 1) : rawCookie;
            await page.context().addCookies([{ name, value, url: baseUrl }]);
        }
    });

    for (const study of configuredStudies) {
        test(`hydrates summary, clinical data, and viewer for ${study.study_id}`, async ({
            page,
        }) => {
            const patient =
                focusedStudy === study.study_id && focusedPatient
                    ? focusedPatient
                    : await firstServablePatient(study.study_dir);
            const configResponse = await page.request.get(
                `${baseUrl}/config_service`
            );
            expect(configResponse.ok()).toBe(true);
            const config = await configResponse.json();
            const tileUrl = config?.msk_wsi_tile_server_url;
            expect(typeof tileUrl).toBe('string');
            const tileOrigin = new URL(tileUrl, baseUrl).origin;
            const failures: string[] = [];
            let hierarchy = 0;
            let access = 0;
            let thumbnail = 0;
            let tile = 0;
            page.on('response', response => {
                const url = new URL(response.url());
                const status = response.status();
                if (url.pathname.includes('/api/wsi/v2/hierarchy/'))
                    hierarchy = status;
                if (url.pathname.includes('/api/wsi/v2/slides/'))
                    access = status;
                if (url.pathname.includes('/thumbnails')) {
                    thumbnail = status;
                    if (url.origin !== tileOrigin)
                        failures.push(`thumbnail origin ${url.origin}`);
                }
                if (url.pathname.includes('/tiles/')) {
                    tile = status;
                    if (url.origin !== tileOrigin)
                        failures.push(`tile origin ${url.origin}`);
                }
                if (
                    (url.pathname.includes('/api/wsi/') ||
                        url.pathname.includes('/thumbnails') ||
                        url.pathname.includes('/tiles/')) &&
                    status >= 400
                ) {
                    failures.push(`${status} ${url.pathname}`);
                }
            });

            await page.goto(
                `${baseUrl}/patient/summary?studyId=${encodeURIComponent(
                    study.study_id
                )}&caseId=${encodeURIComponent(patient)}`
            );
            await expect(
                page.locator('body')
            ).toContainText(/PATHOLOGY|SLIDES/i, { timeout: 60000 });
            await expect(page.locator('.tl-timeline-svg')).toBeVisible({
                timeout: 60000,
            });

            await page.goto(
                `${baseUrl}/patient/clinicalData?studyId=${encodeURIComponent(
                    study.study_id
                )}&caseId=${encodeURIComponent(patient)}`
            );
            await expect(
                page.locator('body')
            ).toContainText(/pathology slides/i, { timeout: 60000 });

            await page.goto(
                `${baseUrl}/patient/wsiHESlides?studyId=${encodeURIComponent(
                    study.study_id
                )}&caseId=${encodeURIComponent(patient)}`
            );
            await expect(
                page.locator('[data-testid^="wsi-slide-item-"]').first()
            ).toBeVisible({ timeout: 60000 });
            await expect(
                page.locator('[data-testid="wsi-share-button"]')
            ).toBeVisible({ timeout: 60000 });
            expect(hierarchy).toBe(200);
            expect(access).toBe(200);
            expect(thumbnail).toBe(200);
            expect(tile).toBe(200);
            expect(failures).toEqual([]);
        });
    }
});
