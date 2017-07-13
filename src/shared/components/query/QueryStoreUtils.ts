import {CancerStudyQueryUrlParams, normalizeQuery, QueryStore} from "./QueryStore";
export function urlParams(store:QueryStore) {
    let params: CancerStudyQueryUrlParams = {
        cancer_study_id: store.singleSelectedStudyId || 'all',
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED: store.getSelectedProfileIdFromGeneticAlterationType("MUTATION_EXTENDED"),
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: store.getSelectedProfileIdFromGeneticAlterationType("COPY_NUMBER_ALTERATION"),
        genetic_profile_ids_PROFILE_MRNA_EXPRESSION: store.getSelectedProfileIdFromGeneticAlterationType("MRNA_EXPRESSION"),
        genetic_profile_ids_PROFILE_METHYLATION: store.getSelectedProfileIdFromGeneticAlterationType("METHYLATION") || store.getSelectedProfileIdFromGeneticAlterationType("METHYLATION_BINARY"),
        genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: store.getSelectedProfileIdFromGeneticAlterationType("PROTEIN_LEVEL"),
        Z_SCORE_THRESHOLD: store.zScoreThreshold,
        RPPA_SCORE_THRESHOLD: store.rppaScoreThreshold,
        data_priority: store.dataTypePriorityCode,
        case_set_id: store.selectedSampleListId || '-1', // empty string won't work
        case_ids: store.asyncCustomCaseSet.result.join('\r\n'),
        gene_list: normalizeQuery(store.geneQuery) || ' ', // empty string won't work
        tab_index: store.forDownloadTab ? 'tab_download' : 'tab_visualize' as any,
        transpose_matrix: store.transposeDataMatrix ? 'on' : undefined,
        Action: 'Submit',
    };

    // Remove params with no value, because they may cause problems.
    // For example, the server will always transpose if transpose_matrix is present, no matter the value.
    for (let key in params)
        if (!(params as any)[key])
            delete (params as any)[key];

    if (store.selectedStudyIds.length != 1)
    {
        let studyIds = store.selectedStudyIds;
        if (!studyIds.length)
            studyIds = store.cancerStudies.result.map(study => study.studyId);

        const hash = `crosscancer/overview/${params.data_priority}/${encodeURIComponent(params.gene_list)}/${encodeURIComponent(studyIds.join(','))}`;
        return {
            pathname: `cross_cancer.do#${hash}`,
            query: Object.assign({ cancer_study_list: studyIds.join(",")}, params),
        };
    }

    return {pathname: 'index.do', query: params};
}