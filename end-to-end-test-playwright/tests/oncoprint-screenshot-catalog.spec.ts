import { test } from '@playwright/test';
import {
    expectOncoprintScreenshot,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Oncoprint URL catalog — each entry cold-loads a URL and snaps the
 * resulting oncoprint. Each test is independent of the others, so
 * this file can be split off onto its own worker cheaply.
 *
 * The companion files are:
 *   - oncoprint-screenshot-interactions.spec.ts — track-header menu
 *     actions, treatment-track removal, column gaps / minimap.
 *   - oncoprint-screenshot-sorting.spec.ts — the long serial flow of
 *     sort actions on a shared page.
 *
 * Any track-type or renderer regression should show up in at least
 * one of the entries below.
 */

const URL_CATALOG: Array<{
    title: string;
    url: string;
    snapshot: string;
    /**
     * Explicit intent — what regression would this screenshot catch?
     * Written out so readers don't have to guess from the URL.
     */
    rationale: string;
}> = [
    {
        title: 'ov_tcga_pub with germline mutations',
        url:
            '/results/oncoprint?cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations' +
            '&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete' +
            '&gene_list=BRCA1%20BRCA2&gene_set_choice=user-defined-list',
        snapshot: 'ov_tcga_pub-germline.png',
        rationale:
            'BRCA1/BRCA2 in ov_tcga_pub has many germline mutations — guards the germline glyph coloring.',
    },
    {
        title: 'coadread_tcga_pub with clinical and heatmap tracks',
        url:
            '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
            '&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
            '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores' +
            '&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE' +
            '&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&',
        snapshot: 'coadread-clinical-heatmap.png',
        rationale:
            'Multiple track types (mutation, CNA, mRNA heatmap, clinical) rendered together — layout/ordering regression target.',
    },
    {
        title: 'acc_tcga with clinical and heatmap tracks',
        url:
            '/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1' +
            '&data_priority=0&case_set_id=acc_tcga_all' +
            '&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2' +
            '&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic' +
            '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores' +
            '&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores' +
            '&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY' +
            '&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2',
        snapshot: 'acc-clinical-heatmap.png',
        rationale:
            'Wide 10-gene oncoprint with RPPA + mRNA heatmaps — stresses track count and heatmap track rendering.',
    },
    {
        title: 'blca_tcga with clinical and heatmap tracks',
        url:
            '/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1' +
            '&data_priority=0&case_set_id=blca_tcga_pub_all' +
            '&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2' +
            '&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic' +
            '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores' +
            '&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores' +
            '&show_samples=false' +
            '&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2' +
            '&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT',
        snapshot: 'blca-clinical-heatmap.png',
        rationale:
            'Same shape as acc_tcga but different study — catches data-source-specific rendering bugs.',
    },
    {
        title: 'hcc_inserm_fr_2015 with TERT promoter mutations',
        url:
            '/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
            '&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced' +
            '&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT' +
            '&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations',
        snapshot: 'hcc-tert-promoter.png',
        rationale:
            'TERT promoter mutations must render as the orange promoter glyph, not the generic mutation glyph.',
    },
    {
        title: 'msk_impact_2017 with SOS1 — not-sequenced',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=msk_impact_2017_all' +
            '&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations',
        snapshot: 'msk-sos1-not-sequenced.png',
        rationale:
            'SOS1 is not on the MSK-IMPACT panel; the column must render as "not sequenced", not "wild-type".',
    },
    {
        title: 'msk_impact_2017 with ALK and SOS1 — SOS1 not sequenced',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=msk_impact_2017_all' +
            '&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations',
        snapshot: 'msk-alk-sos1.png',
        rationale:
            'Mixed-profiling case: ALK is sequenced, SOS1 is not. Each row must reflect its own panel coverage.',
    },
    {
        title: 'msk_impact_2017 with SOS1 + CNA profile — not sequenced',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=msk_impact_2017_all' +
            '&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna',
        snapshot: 'msk-sos1-cna.png',
        rationale:
            'Adding CNA profile must not flip SOS1 to "sequenced" — panel coverage is per alteration type.',
    },
    {
        title: 'brca_tcga_pub with methylation heatmap',
        url:
            '/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=brca_tcga_pub_cnaseq' +
            '&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic' +
            '&show_samples=false' +
            '&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2',
        snapshot: 'brca-methylation-heatmap.png',
        rationale:
            'Methylation heatmap uses a different colorscale than mRNA — regression target for per-datatype colors.',
    },
    {
        title: 'MSK-IMPACT profiled-in tracks with 3 not-profiled genes',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
            '&data_priority=0&case_set_id=msk_impact_2017_cnaseq' +
            '&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna',
        snapshot: 'msk-profiled-in-tracks.png',
        rationale:
            'All 3 query genes are off-panel — the profiled-in summary track should show a solid not-sequenced band.',
    },
    {
        title: 'profiled-in tracks in a combined study session',
        url:
            '/results/oncoprint?session_id=5c38e4c0e4b05228701fb0c9&show_samples=false',
        snapshot: 'profiled-in-combined-session.png',
        rationale:
            'Session-driven load path with multiple studies exercises cross-study profiled-in logic.',
    },
    {
        title: 'profiled-in tracks across multiple studies (SOS1)',
        url:
            '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
            '&cancer_study_list=msk_impact_2017%2Cbrca_tcga_pub&case_set_id=all' +
            '&data_priority=0&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize',
        snapshot: 'profiled-in-multi-study.png',
        rationale:
            'Mixes a panel-sequenced study (MSK) with a WES study (BRCA) — each sample must show its own coverage.',
    },
    {
        title: 'multiple tracks with same gene',
        url:
            '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
            '&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq' +
            '&data_priority=0&gene_list=EGFR%253AAMP%253BEGFR%253AMUT%253B%2520PTEN%253B%2520EGFR%2520EGFR' +
            '&geneset_list=%20' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations' +
            '&tab_index=tab_visualize',
        snapshot: 'multiple-tracks-same-gene.png',
        rationale:
            'EGFR appears multiple times with different alteration filters — each occurrence must render independently.',
    },
];

// Tests are independent — each cold-loads its own URL without shared state.
// Opt into parallel so shards running this file don't serialize unnecessarily.
test.describe.configure({ mode: 'parallel' });

test.describe('oncoprint URL catalog', () => {
    for (const entry of URL_CATALOG) {
        test(entry.title, async ({ page }) => {
            await page.goto(entry.url);
            // Catalog queries include large MSK / multi-study configs that
            // exceed the default 20s under parallel load.
            await waitForOncoprint(page, 60000);
            // Some of the combined-study / heatmap configs render progressively;
            // a short settle lets the final layout stabilize before capture.
            await page.waitForTimeout(1000);
            await expectOncoprintScreenshot(page, entry.snapshot);
        });
    }
});
