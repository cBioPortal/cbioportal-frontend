import {CancerStudyQueryUrlParams, normalizeQuery, QueryStore} from "./QueryStore";

export type NonGeneticProfileQueryParams = Pick<CancerStudyQueryUrlParams,
    'cancer_study_id' | 'cancer_study_list' | 'Z_SCORE_THRESHOLD' | 'RPPA_SCORE_THRESHOLD' | 'data_priority' |
    'case_set_id' | 'case_ids' | 'gene_list' | 'tab_index' | 'transpose_matrix' | 'Action'>;

export type GeneticProfileQueryParams = Pick<CancerStudyQueryUrlParams,
    'genetic_profile_ids_PROFILE_MUTATION_EXTENDED' | 'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION' |
    'genetic_profile_ids_PROFILE_MRNA_EXPRESSION' | 'genetic_profile_ids_PROFILE_METHYLATION' |
    'genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION'>;


export function currentQueryParams(store:QueryStore) {
    let nonProfileParams = nonGeneticProfileParams(store);
    let profileParams = geneticProfileParams(store);
    let path = queryUrl(store, nonProfileParams);
    return queryParams(nonProfileParams, profileParams, path);
}

export function queryUrl(store:QueryStore, nonGeneticProfileParams:NonGeneticProfileQueryParams) {

    if (store.selectedStudyIds.length != 1)
    {
        let studyIds = store.selectedStudyIds;
        if (!studyIds.length) {
            studyIds = store.cancerStudies.result.map(study => study.studyId);
        }

        const hash = `crosscancer/overview/${nonGeneticProfileParams.data_priority}/${encodeURIComponent(nonGeneticProfileParams.gene_list)}/${encodeURIComponent(studyIds.join(","))}`;
        return `cross_cancer.do#${hash}`;
    } else {
        return 'index.do';
    }
}

export function queryParams(nonGeneticProfileParams:NonGeneticProfileQueryParams,
                            geneticProfileParams:GeneticProfileQueryParams,
                            path:string) {
    let params:CancerStudyQueryUrlParams = Object.assign({}, nonGeneticProfileParams, geneticProfileParams);

    // Remove params with no value, because they may cause problems.
    // For example, the server will always transpose if transpose_matrix is present, no matter the value.
    for (let key in params) {
        if (!(params as any)[key]) {
            delete (params as any)[key];
        }
    }

    return {pathname: path, query:params};
}

export function nonGeneticProfileParams(store:QueryStore):NonGeneticProfileQueryParams {
    let ret:NonGeneticProfileQueryParams = {
        cancer_study_id: store.singleSelectedStudyId || 'all',
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

    if (store.selectedStudyIds.length !== 1) {
        ret = Object.assign(ret, { cancer_study_list: store.selectedStudyIds.join(",") });
    }

    return ret;
}

export function geneticProfileParams(store:QueryStore, geneticProfileIds?:ReadonlyArray<string>) {
    return {
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED: store.getSelectedProfileIdFromGeneticAlterationType("MUTATION_EXTENDED", geneticProfileIds),
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: store.getSelectedProfileIdFromGeneticAlterationType("COPY_NUMBER_ALTERATION", geneticProfileIds),
        genetic_profile_ids_PROFILE_MRNA_EXPRESSION: store.getSelectedProfileIdFromGeneticAlterationType("MRNA_EXPRESSION", geneticProfileIds),
        genetic_profile_ids_PROFILE_METHYLATION: store.getSelectedProfileIdFromGeneticAlterationType("METHYLATION", geneticProfileIds) || store.getSelectedProfileIdFromGeneticAlterationType("METHYLATION_BINARY", geneticProfileIds),
        genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: store.getSelectedProfileIdFromGeneticAlterationType("PROTEIN_LEVEL", geneticProfileIds)
    };
}