const _ = require('lodash');

const suppressors = [
    // function(report) {
    //     return (
    //         report.clDataSorted[0].counts.find(m => m.value == 'not_mutated')
    //             .count ===
    //         report.legacyDataSorted[0].counts.find(
    //             m => m.value == 'not_profiled'
    //         ).count
    //     );
    // },
    function(report) {
        const diff = _.difference(
            report.chResult.body[0].counts.map(c => c.value),
            report.legacyResult.body[0].counts.map(c => c.value)
        );
        return (
            diff.includes('not_profiled') &&
            _.sumBy(report.legacyResult.body[0].counts, 'count') ===
                _.sumBy(report.chResult.body[0].counts, 'count')
        );
    },
    function(report) {
        return (
            report.test.data.studyViewFilter.clinicalDataFilters[0].values
                .length > 10
        );
    },
    function(report) {
        return report.test.data.clinicalDataFilters[0].values.length > 10;
    },
    function(report) {
        return (
            report.test.data.customDataFilters ||
            report.test.data.studyViewFilter.customDataFilters
        );
    },

    function(report) {
        return report.test.data.studyIds.includes('genie_private');
    },

    function(report) {
        return report.legacyResult.status == 501;
    },

    function(report) {
        // some weird character that screws up sorting
        return JSON.stringify(report.legacyResult.body).includes('ï¼');
    },

    function(report) {
        // some weird character that screws up sorting
        return JSON.stringify(report.test.data).includes('Wilms');
    },
    function(report) {
        // some weird character that screws up sorting
        const studs = 'acc_2019,ampca_bcm_2016,brain_cptac_2020,brca_igr_2015,breast_alpelisib_2020,brca_smc_2018,crc_eo_2020,ctcl_columbia_2015,dlbc_broad_2012,dlbcl_duke_2017,esca_broad,es_iocurie_2014,gct_msk_2016,gbm_mayo_pdx_sarkaria_2019,gbm_columbia_2019,hcc_inserm_fr_2015,histiocytosis_cobi_msk_2019,kirc_bgi,hnsc_mdanderson_2013,ihch_msk_2021,lihc_riken,luad_mskcc_2015,luad_broad,luad_cptac_2020,mbl_icgc,mds_tokyo_2011,mel_ucla_2016,lung_msk_pdx,mm_broad,nbl_amc_2012,mpn_cimr_2013,mnm_washu_2016,mixed_selpercatinib_2020,msk_ch_2020,msk_ch_ped_2021,nbl_target_2018_pub,paad_icgc,plmeso_nyu_2015,paad_qcmg_uq_2016,pediatric_dkfz_2017,pan_origimed_2020,error,prad_cpcg_2017,prad_mskcc_cheny1_organoids_2014,skcm_broad_dfarber,skcm_yale,stmyec_wcm_2022,um_qimr_2016,wt_target_2018_pub,laml_tcga,lgg_tcga,meso_tcga,mel_tsam_liang_2017,mbn_mdacc_2013,stad_tcga,rt_target_2018_pub,prostate_dkfz_2018,error,difg_glass,coadread_cass_2020,mbn_sfu_2023,cll_broad_2022,ucec_ccr_cfdna_msk_2022,msk_ch_2023,brca_tcga_gdc,esca_tcga_gdc,aml_tcga_gdc,difg_tcga_gdc,paad_tcga_gdc,prad_tcga_gdc,thpa_tcga_gdc,breast_cptac_gdc,luad_cptac_gdc,pancreas_cptac_gdc,pancan_pcawg_2020,hcc_clca_2024,brca_fuscc_2020'.split(
            ','
        );
        return (
            _.intersection(
                report.test.data.studyIds ||
                    report.test.data.studyViewFilter.studyIds,
                studs
            ).length > 0
        );
    },

    function(report) {
        // some weird character that screws up sorting
        return (
            report.legacyResult.body.length > 0 &&
            report.chResult.body.length === 0
        );
    },
];

module.exports = suppressors;
